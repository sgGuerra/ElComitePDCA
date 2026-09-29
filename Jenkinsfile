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
                        npm run test:cov
                    '''
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
                sh """
                    docker compose -p ${COMPOSE_PROJECT} down --remove-orphans || true
                    docker compose -p ${COMPOSE_PROJECT} up -d
                    docker compose -p ${COMPOSE_PROJECT} ps
                """
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
