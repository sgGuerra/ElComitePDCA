$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$env:SONAR_TOKEN = "<set-your-sonar-token>"
node -e "const scanner = require('sonarqube-scanner').default || require('sonarqube-scanner'); scanner({serverUrl:'https://sonarcloud.io', options:{'sonar.token':process.env.SONAR_TOKEN}}, () => process.exit())"
