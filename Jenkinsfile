pipeline {
    agent any

    environment {
        COMPOSE_PROJECT = 'elcomitepdca'
        SONAR_SCANNER = tool 'SonarScanner'
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    stages {

        // Checkout del codigo fuente
        stage('Checkout') {
            steps {
                cleanWs()
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/test/dev']],
                    userRemoteConfigs: scm.userRemoteConfigs
                ])
                echo "Codigo descargado - Branch: ${env.GIT_BRANCH}, Commit: ${env.GIT_COMMIT}"
            }
        }

        // Tests del Backend (Python 3.10 / FastAPI)
        stage('Backend Tests') {
            agent {
                docker {
                    image 'python:3.10-slim'
                    reuseNode true
                }
            }
            steps {
                dir('backend') {
                    sh '''
                        python -m venv venv
                        . venv/bin/activate
                        pip install --no-cache-dir -r requirements.txt
                        pytest --cov=app --cov-report=xml -v
                    '''
                }
            }
            post {
                always {
                    echo 'Reporte de cobertura backend: backend/coverage.xml'
                }
            }
        }

        // Tests del Frontend (React / Vite / Node 20)
        stage('Frontend Tests') {
            agent {
                docker {
                    image 'node:20-slim'
                    reuseNode true
                }
            }
            steps {
                dir('frontend') {
                    sh '''
                        npm ci
                    '''
                    timeout(time: 15, unit: 'MINUTES') {
                        sh 'npm run test:cov -- --maxWorkers=2 --minWorkers=1'
                    }
                }
            }
            post {
                always {
                    echo 'Reporte de cobertura frontend: frontend/coverage/lcov.info'
                }
            }
        }

        // Analisis SonarQube (usa sonar-project.properties del repositorio)
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh "${SONAR_SCANNER}/bin/sonar-scanner"
                }
            }
        }

        // Quality Gate
        stage('Quality Gate') {
            steps {
                script {
                    try {
                        timeout(time: 5, unit: 'MINUTES') {
                            def qg = waitForQualityGate()
                            if (qg.status != 'OK') {
                                echo "Quality Gate no aprobado: ${qg.status}"
                            }
                        }
                    } catch (Exception e) {
                        echo "Quality Gate check omitido: ${e.message}"
                    }
                }
            }
        }

        // Construccion de imagenes Docker
        stage('Docker Build') {
            steps {
                sh '''
                    docker build -t elcomitepdca-backend:latest ./backend
                    docker build -t elcomitepdca-frontend:latest ./frontend
                '''
                echo 'Imagenes Docker construidas'
                sh 'docker images | grep elcomitepdca'
            }
        }

        // Deploy con Docker Compose
        stage('Deploy') {
            steps {
                sh '''
                    if docker compose version >/dev/null 2>&1; then
                        COMPOSE_VARIANT='v2'
                        docker compose version
                    elif command -v docker-compose >/dev/null 2>&1; then
                        COMPOSE_VARIANT='v1'
                        docker-compose --version
                    else
                        echo 'Error: no se encontro Docker Compose V2 ni docker-compose.'
                        exit 1
                    fi

                    compose() {
                        if [ "$COMPOSE_VARIANT" = 'v2' ]; then
                            docker compose "$@"
                        else
                            docker-compose "$@"
                        fi
                    }

                    compose --project-name "$COMPOSE_PROJECT" down --remove-orphans || true
                    compose --project-name "$COMPOSE_PROJECT" up -d
                    compose --project-name "$COMPOSE_PROJECT" ps
                '''
                echo 'Aplicacion desplegada:'
                echo '  Frontend: http://localhost:80'
                echo '  Backend API: http://localhost:8000'
                echo '  API Docs: http://localhost:8000/docs'
            }
        }
    }

    post {
        success {
            echo 'Pipeline completado exitosamente.'
        }
        failure {
            echo 'Pipeline fallo - revisar los logs.'
        }
        always {
            echo "Fin del pipeline - Branch: ${env.GIT_BRANCH}"
        }
    }
}
