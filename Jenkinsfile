pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 25, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        SONAR_PROJECT_KEY = 'el-comite-pdca'
        SONAR_PROJECT_NAME = 'El Comite PDCA'
        VENV_DIR = '.venv'
        IMAGE_NAME = 'el-comite-pdca'
        CONTAINER_NAME = 'el-comite-pdca-container'
    }

    stages {
        stage('Verify Environment') {
            steps {
                sh '''
                    set -e
                    python3 --version
                    docker --version
                    java -version
                    docker run --rm node:22-alpine node --version
                '''
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                sh '''
                    set -e
                    python3 -m venv --clear "$VENV_DIR"
                    . "$VENV_DIR/bin/activate"
                    python -m pip install --upgrade pip
                    python -m pip install -r backend/requirements.txt
                '''
            }
        }

        stage('Backend Tests & Coverage') {
            steps {
                sh '''
                    set -e
                    . "$VENV_DIR/bin/activate"
                    cd backend
                    python -m pytest \
                        --junitxml=../backend-test-results.xml \
                        --cov=app \
                        --cov-report=xml:coverage.xml
                '''
            }
        }

        stage('Frontend Build Test') {
            steps {
                sh '''
                    set -e
                    docker run --rm \
                        --user "$(id -u):$(id -g)" \
                        -e HOME=/tmp \
                        -v "$WORKSPACE:/app" \
                        -w /app/frontend \
                        node:22-alpine \
                        sh -c "npm install && npm run build"
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool(
                        name: 'SonarScanner',
                        type: 'hudson.plugins.sonar.SonarRunnerInstallation'
                    )

                    withSonarQubeEnv('SonarQube') {
                        sh """
                            set -e
                            "${scannerHome}/bin/sonar-scanner"
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    set -e
                    docker build \
                        -t "$IMAGE_NAME:$BUILD_NUMBER" \
                        -t "$IMAGE_NAME:latest" \
                        .
                '''
            }
        }

        stage('Deploy Full-Stack Application') {
            steps {
                sh '''
                    set -e
                    # Detener versiones anteriores
                    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
                    # Detener el contenedor de la clase anterior si usa el puerto 8000
                    docker rm -f crud-clientes-api-container 2>/dev/null || true

                    docker run -d \
                        --name "$CONTAINER_NAME" \
                        --network devops-net \
                        --restart unless-stopped \
                        -p 8000:8000 \
                        "$IMAGE_NAME:$BUILD_NUMBER"
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    set -e
                    for attempt in $(seq 1 12); do
                        HEALTH_STATUS=$(docker inspect \
                            --format='{{.State.Health.Status}}' \
                            "$CONTAINER_NAME" \
                            2>/dev/null || true)

                        echo "Estado de salud: $HEALTH_STATUS"

                        if [ "$HEALTH_STATUS" = "healthy" ]; then
                            exit 0
                        fi

                        if [ "$HEALTH_STATUS" = "unhealthy" ]; then
                            docker logs "$CONTAINER_NAME"
                            exit 1
                        fi

                        sleep 5
                    done

                    docker logs "$CONTAINER_NAME"
                    echo "El contenedor no alcanzo el estado healthy."
                    exit 1
                '''
            }
        }
    }

    post {
        always {
            junit(
                testResults: 'backend-test-results.xml',
                allowEmptyResults: true
            )

            archiveArtifacts(
                artifacts: [
                    'backend/coverage.xml',
                    'backend-test-results.xml'
                ].join(','),
                fingerprint: true,
                allowEmptyArchive: true
            )
        }

        failure {
            sh '''
                docker logs "$CONTAINER_NAME" 2>/dev/null || true
            '''
        }
    }
}
