pipeline {
    agent any

    environment {
        DOCKER_COMPOSE = 'docker-compose'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                echo 'Building Docker containers...'
                sh "${DOCKER_COMPOSE} build"
            }
        }

        stage('Test Backend') {
            steps {
                echo 'Running backend tests...'
                sh 'cd backend && pip install -r requirements.txt && pytest'
            }
        }

        stage('Test Frontend') {
            steps {
                echo 'Running frontend tests...'
                sh 'cd frontend && npm install && npm run build'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Starting containers...'
                sh "${DOCKER_COMPOSE} up -d"
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
