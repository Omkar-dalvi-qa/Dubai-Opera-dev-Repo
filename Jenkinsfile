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
                sh 'git log -1 --pretty=format:"%H|%an|%ae|%ar|%s"'
            }
        }

        stage('Read Dev Commit Info') {
            steps {
                script {
                    env.DEV_COMMIT_HASH   = sh(script: "git log -1 --pretty='%h'",    returnStdout: true).trim()
                    env.DEV_COMMIT_MSG    = sh(script: "git log -1 --pretty='%s'",    returnStdout: true).trim()
                    env.DEV_COMMIT_AUTHOR = sh(script: "git log -1 --pretty='%an'",   returnStdout: true).trim()
                    env.DEV_COMMIT_EMAIL  = sh(script: "git log -1 --pretty='%ae'",   returnStdout: true).trim()
                    env.DEV_COMMIT_TIME   = sh(script: "git log -1 --pretty='%ar'",   returnStdout: true).trim()
                    env.DEV_COMMIT_DATE   = sh(script: "git log -1 --pretty='%ad' --date=format:'%d %b %Y %H:%M'", returnStdout: true).trim()

                    echo "Developer: ${DEV_COMMIT_AUTHOR}"
                    echo "Commit: ${DEV_COMMIT_MSG}"
                    echo "Time: ${DEV_COMMIT_TIME}"
                }
            }
        }

        stage('Run Playwright Tests') {
            steps {
                script {
                    // Get tester repo commit info
                    dir('/Users/sanathshetty/.jenkins/workspace/dubai-opera-tests') {
                        env.TEST_COMMIT_MSG    = sh(script: "git log -1 --pretty='%s'",  returnStdout: true).trim()
                        env.TEST_COMMIT_AUTHOR = sh(script: "git log -1 --pretty='%an'", returnStdout: true).trim()
                        env.TEST_COMMIT_DATE   = sh(script: "git log -1 --pretty='%ad' --date=format:'%d %b %Y %H:%M'", returnStdout: true).trim()
                    }
                }
                // Run the actual tests
                build job: 'dubai-opera-tests', wait: true
            }
        }

    }

    post {
        always {
            emailext(
                to: 'omkardalvi861@gmail.com',
                subject: "Dubai Opera — Dev Push Detected: ${currentBuild.currentResult}",
                body: """
                    <html><body>
                    <h2 style="font-family:Arial;color:#8B0000;">
                        Dubai Opera — Automated Test Report
                    </h2>

                    <table border="1" cellpadding="10" cellspacing="0"
                        style="border-collapse:collapse;font-family:Arial;
                        font-size:13px;width:100%">

                        <tr style="background:#8B0000;color:white;">
                            <td colspan="2" style="padding:10px 14px;">
                                <b>Latest push in Dev Repo</b>
                            </td>
                        </tr>
                        <tr>
                            <td style="color:#888;width:35%;">Developer</td>
                            <td><b>${DEV_COMMIT_AUTHOR}</b>
                                (${DEV_COMMIT_EMAIL})</td>
                        </tr>
                        <tr style="background:#fafafa;">
                            <td style="color:#888;">Last Commit</td>
                            <td>${DEV_COMMIT_MSG}</td>
                        </tr>
                        <tr>
                            <td style="color:#888;">Last Date</td>
                            <td>${DEV_COMMIT_DATE}
                                (${DEV_COMMIT_TIME})</td>
                        </tr>
                        <tr>
                            <td style="color:#888;">Commit Hash</td>
                            <td style="font-family:monospace;">
                                ${DEV_COMMIT_HASH}</td>
                        </tr>

                        <tr style="background:#2c3e50;color:white;">
                            <td colspan="2" style="padding:10px 14px;">
                                <b>Latest push in Test Repo</b>
                            </td>
                        </tr>
                        <tr>
                            <td style="color:#888;">Tester</td>
                            <td><b>${TEST_COMMIT_AUTHOR}</b></td>
                        </tr>
                        <tr style="background:#fafafa;">
                            <td style="color:#888;">Last Commit</td>
                            <td>${TEST_COMMIT_MSG}</td>
                        </tr>
                        <tr>
                            <td style="color:#888;">Last Date</td>
                            <td>${TEST_COMMIT_DATE}</td>
                        </tr>

                    </table>

                    <br/>
                    <p style="font-family:Arial;font-size:12px;color:#888;">
                        This report was triggered automatically when
                        <b>${DEV_COMMIT_AUTHOR}</b> pushed to the dev repo.
                    </p>

                    </body></html>
                """,
                mimeType: 'text/html'
            )
        }
    }
}