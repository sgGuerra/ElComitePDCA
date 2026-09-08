$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$env:SONAR_TOKEN = "c173184ae5cc212435be945f9059dcf900867e25"
node -e "const scanner = require('sonarqube-scanner').default || require('sonarqube-scanner'); scanner({serverUrl:'https://sonarcloud.io', options:{'sonar.token':'c173184ae5cc212435be945f9059dcf900867e25'}}, () => process.exit())"
