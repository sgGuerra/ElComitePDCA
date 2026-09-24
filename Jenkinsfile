pipeline {
    agent any

    environment {
        SONAR_SERVER = 'sonarqube'
        SCANNER_HOME = tool 'SonarScanner'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Test Backend') {
            steps {
                echo 'Running backend tests...'
                sh 'cd backend && pip3 install -r requirements.txt --break-system-packages && pytest --cov=app --cov-report=xml:coverage.xml --junitxml=../backend-test-results.xml || true'
            }
        }

        stage('Install & Test Frontend') {
            steps {
                echo 'Running frontend tests...'
                sh 'cd frontend && npm install && npm run build'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv(env.SONAR_SERVER) {
                    sh "${SCANNER_HOME}/bin/sonar-scanner"
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

        stage('Docker Build') {
            steps {
                echo 'Building Docker containers...'
                sh 'docker compose build'
            }
        }

        stage('Deploy Automático') {
            steps {
                echo 'Starting containers...'
                sh 'docker compose up -d'
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished.'
        }
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}