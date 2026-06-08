pipeline {
    agent any

    options {
        disableConcurrentBuilds()
    }

    stages {

        stage('Read Dev Commit') {
            steps {
                script {
                    env.DEV_AUTHOR = sh(
                        script: "git log -1 --pretty='%an'",
                        returnStdout: true).trim()
                    env.DEV_EMAIL  = sh(
                        script: "git log -1 --pretty='%ae'",
                        returnStdout: true).trim()
                    env.DEV_MSG    = sh(
                        script: "git log -1 --pretty='%s'",
                        returnStdout: true).trim()
                    env.DEV_DATE   = sh(
                        script: "git log -1 --pretty='%ad' --date=format:'%d %b %Y %H:%M'",
                        returnStdout: true).trim()
                    env.DEV_HASH   = sh(
                        script: "git log -1 --pretty='%h'",
                        returnStdout: true).trim()

                    echo "Developer: ${env.DEV_AUTHOR}"
                    echo "Commit: ${env.DEV_MSG}"
                }
            }
        }

        stage('Trigger Tests') {
            steps {
                script {
                    build job: 'dubai-opera-tests',
                        wait: true,
                        propagate: false,
                        parameters: [
                            string(name: 'DEV_AUTHOR', value: env.DEV_AUTHOR ?: 'N/A'),
                            string(name: 'DEV_EMAIL',  value: env.DEV_EMAIL  ?: 'N/A'),
                            string(name: 'DEV_MSG',    value: env.DEV_MSG    ?: 'N/A'),
                            string(name: 'DEV_DATE',   value: env.DEV_DATE   ?: 'N/A'),
                            string(name: 'DEV_HASH',   value: env.DEV_HASH   ?: 'N/A')
                        ]
                }
            }
        }

    }

    post {
        always {
            echo 'Dev pipeline finished'
        }
    }
}