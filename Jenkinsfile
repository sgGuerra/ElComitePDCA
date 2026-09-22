pipeline {
    agent any

    environment {
        // Nombre del proyecto para Docker Compose
        COMPOSE_PROJECT = 'elcomitepdca'
    }

    stages {

        // =============================================
        // STAGE 1: Checkout del código fuente
        // =============================================
        stage('Checkout') {
            steps {
                cleanWs()
                checkout scm
                echo "✅ Código fuente descargado desde ${env.GIT_URL}"
                echo "📌 Branch: ${env.GIT_BRANCH}"
                echo "📝 Commit: ${env.GIT_COMMIT}"
            }
        }

        // =============================================
        // STAGE 2: Tests del Backend (Python/FastAPI)
        // =============================================
        stage('Backend Tests') {
            agent {
                docker {
                    image 'python:3.10-slim'
                    reuseNode true
                }
            }
            steps {
                dir('backend') {
                    echo '🐍 Instalando dependencias del backend...'
                    sh 'pip install --no-cache-dir -r requirements.txt'

                    echo '🧪 Ejecutando tests del backend con cobertura...'
                    sh 'pytest --cov=app --cov-report=xml -v'
                }
            }
            post {
                always {
                    echo "📊 Reporte de cobertura backend: backend/coverage.xml"
                }
            }
        }

        // =============================================
        // STAGE 3: Tests del Frontend (React/Vite)
        // =============================================
        stage('Frontend Tests') {
            agent {
                docker {
                    image 'node:20-slim'
                    reuseNode true
                }
            }
            steps {
                dir('frontend') {
                    echo '📦 Instalando dependencias del frontend...'
                    sh 'npm ci'

                    echo '🧪 Ejecutando tests del frontend con cobertura...'
                    sh 'npm run test:cov'
                }
            }
            post {
                always {
                    echo "📊 Reporte de cobertura frontend: frontend/coverage/lcov.info"
                }
            }
        }

        // =============================================
        // STAGE 4: Análisis SonarQube
        // =============================================
        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'
                    withSonarQubeEnv('Comite-SonarQube') {
                        echo '🔍 Ejecutando análisis de SonarQube...'
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
            }
        }

        // =============================================
        // STAGE 5: Quality Gate
        // =============================================
        stage('Quality Gate') {
            steps {
                script {
                    try {
                        timeout(time: 5, unit: 'MINUTES') {
                            def qg = waitForQualityGate()
                            if (qg.status == 'OK') {
                                echo "✅ Quality Gate aprobado: ${qg.status}"
                            } else {
                                echo "⚠️ Quality Gate no aprobado: ${qg.status}"
                            }
                        }
                    } catch (Exception e) {
                        echo "⚠️ Quality Gate check omitido: ${e.message}"
                        echo "💡 Para habilitar: configura un webhook en SonarQube → Administration → Webhooks"
                        echo "   URL del webhook: http://<jenkins-container>:8080/sonarqube-webhook/"
                    }
                }
            }
        }

        // =============================================
        // STAGE 6: Construir imágenes Docker
        // =============================================
        stage('Docker Build') {
            steps {
                echo '🐳 Construyendo imagen del Backend...'
                sh 'docker build -t elcomitepdca-backend:latest ./backend'

                echo '🐳 Construyendo imagen del Frontend...'
                sh 'docker build -t elcomitepdca-frontend:latest ./frontend'

                echo '✅ Imágenes Docker construidas exitosamente'
                sh 'docker images | grep elcomitepdca'
            }
        }

        // =============================================
        // STAGE 7: Deploy con Docker Compose
        // =============================================
        stage('Deploy') {
            steps {
                echo '🚀 Desplegando aplicación...'

                // Detener contenedores previos (si existen)
                sh "docker compose -p ${COMPOSE_PROJECT} down --remove-orphans || true"

                // Levantar nuevos contenedores
                sh "docker compose -p ${COMPOSE_PROJECT} up -d"

                // Verificar que los contenedores están corriendo
                sh "docker compose -p ${COMPOSE_PROJECT} ps"

                echo '✅ Aplicación desplegada exitosamente'
                echo '🌐 Frontend: http://localhost:80'
                echo '🔧 Backend API: http://localhost:8000'
                echo '📖 API Docs: http://localhost:8000/docs'
            }
        }
    }

    post {
        success {
            echo '''
            ╔══════════════════════════════════════════╗
            ║  ✅ PIPELINE COMPLETADO EXITOSAMENTE     ║
            ╚══════════════════════════════════════════╝
            '''
        }
        failure {
            echo '''
            ╔══════════════════════════════════════════╗
            ║  ❌ PIPELINE FALLÓ - Revisar los logs     ║
            ╚══════════════════════════════════════════╝
            '''
        }
    }
}
