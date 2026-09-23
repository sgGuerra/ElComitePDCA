 pipeline {
        agent any

        environment {

            SONAR_SERVER = 'sonarqube'
            DOCKER_COMPOSE = 'docker-compose'
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
                    
                    sh 'cd backend && pip3 install -r requirements.txt && pytest --cov=app --cov-
  report=xml:coverage.xml --junitxml=../backend-test-results.xml'
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
                        sh 'sonar-scanner'
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
                    sh "${DOCKER_COMPOSE} build"
                }
            }

            stage('Deploy Automático') {
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
    EOF