pipeline {
    agent any

    triggers {
        githubPush()
    }

    tools {
        nodejs 'NodeJS-18'
    }

    stages {

        stage('Checkout Dev Repo') {
            steps {
                echo 'Developer code checked out'
            }
        }

        stage('Read Dev Commit Info') {
            steps {
                script {
                    env.DEV_COMMIT_HASH   = sh(script: "git log -1 --pretty='%h'",  returnStdout: true).trim()
                    env.DEV_COMMIT_MSG    = sh(script: "git log -1 --pretty='%s'",  returnStdout: true).trim()
                    env.DEV_COMMIT_AUTHOR = sh(script: "git log -1 --pretty='%an'", returnStdout: true).trim()
                    env.DEV_COMMIT_EMAIL  = sh(script: "git log -1 --pretty='%ae'", returnStdout: true).trim()
                    env.DEV_COMMIT_TIME   = sh(script: "git log -1 --pretty='%ar'", returnStdout: true).trim()
                    env.DEV_COMMIT_DATE   = sh(script: "git log -1 --pretty='%ad' --date=format:'%d %b %Y %H:%M'", returnStdout: true).trim()

                    echo "Developer: ${DEV_COMMIT_AUTHOR}"
                    echo "Commit: ${DEV_COMMIT_MSG}"
                    echo "Time: ${DEV_COMMIT_TIME}"
                }
            }
        }

        stage('Read Test Repo Info') {
            steps {
                script {
                    try {
                        dir('/Users/sanathshetty/.jenkins/workspace/dubai-opera-tests') {
                            env.TEST_COMMIT_AUTHOR = sh(script: "git log -1 --pretty='%an'", returnStdout: true).trim()
                            env.TEST_COMMIT_MSG    = sh(script: "git log -1 --pretty='%s'",  returnStdout: true).trim()
                            env.TEST_COMMIT_DATE   = sh(script: "git log -1 --pretty='%ad' --date=format:'%d %b %Y %H:%M'", returnStdout: true).trim()
                        }
                    } catch (err) {
                        echo "Could not read test repo info: ${err}"
                        env.TEST_COMMIT_AUTHOR = 'N/A'
                        env.TEST_COMMIT_MSG    = 'N/A'
                        env.TEST_COMMIT_DATE   = 'N/A'
                    }
                }
            }
        }

        stage('Run Playwright Tests') {
            steps {
                script {
                    build job: 'dubai-opera-tests',
                        wait: true,
                        propagate: false,
                        parameters: [
                            string(name: 'DEV_AUTHOR', value: env.DEV_COMMIT_AUTHOR ?: 'N/A'),
                            string(name: 'DEV_COMMIT', value: env.DEV_COMMIT_MSG    ?: 'N/A'),
                            string(name: 'DEV_DATE',   value: env.DEV_COMMIT_DATE   ?: 'N/A'),
                            string(name: 'DEV_HASH',   value: env.DEV_COMMIT_HASH   ?: 'N/A'),
                            string(name: 'DEV_EMAIL',  value: env.DEV_COMMIT_EMAIL  ?: 'N/A')
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