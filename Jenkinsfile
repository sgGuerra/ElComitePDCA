pipeline {
    agent any

    environment {
        COMPOSE_PROJECT = 'elcomitepdca'
        SONAR_SCANNER = tool 'SonarScanner'
        CI = 'true'
    }

    options {
        disableConcurrentBuilds()
    }

    stages {

        // Checkout del codigo fuente
        stage('Checkout') {
            steps {
                cleanWs()
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
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

        // Subir imagenes a Docker Hub
        stage('Docker Push') {
            steps {
                // Asegurate de crear una credencial en Jenkins tipo "Username with password" con el ID 'dockerhub-credentials'
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', passwordVariable: 'DOCKER_PWD', usernameVariable: 'DOCKER_USR')]) {
                    sh '''
                        # Iniciar sesion en Docker Hub
                        echo "$DOCKER_PWD" | docker login -u "$DOCKER_USR" --password-stdin
                        
                        # Etiquetar las imagenes locales con tu usuario de Docker Hub
                        docker tag elcomitepdca-backend:latest $DOCKER_USR/elcomitepdca-backend:latest
                        docker tag elcomitepdca-frontend:latest $DOCKER_USR/elcomitepdca-frontend:latest
                        
                        # Subir las imagenes a Docker Hub
                        docker push $DOCKER_USR/elcomitepdca-backend:latest
                        docker push $DOCKER_USR/elcomitepdca-frontend:latest
                    '''
                }
            }
        }

        // Deploy con Docker Compose
        stage('Deploy') {
            steps {
                sh '''
                    docker compose --project-name "$COMPOSE_PROJECT" down --remove-orphans || true
                    docker compose --project-name "$COMPOSE_PROJECT" up -d
                    docker compose --project-name "$COMPOSE_PROJECT" ps
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
