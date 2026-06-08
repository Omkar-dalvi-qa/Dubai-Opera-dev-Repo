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
            emailext(
                to: 'omkardalvi861@gmail.com',
                subject: "Dubai Opera — Dev Push by ${env.DEV_COMMIT_AUTHOR}: ${currentBuild.currentResult}",
                body: """
                    <html><body style="font-family:Arial;background:#f4f4f4;margin:0;padding:0;">

                    <table width="100%" style="background:#8B0000;padding:20px 32px;">
                        <tr>
                            <td>
                                <h2 style="margin:0;color:#fff;font-size:20px;">DUBAI OPERA</h2>
                                <p style="margin:4px 0 0;color:#ffcccc;font-size:12px;">
                                    Automated Test Report
                                </p>
                            </td>
                            <td align="right">
                                <span style="background:${currentBuild.currentResult == 'SUCCESS' ? '#2ecc71' : '#e74c3c'};
                                    color:#fff;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:bold;">
                                    ${currentBuild.currentResult}
                                </span>
                            </td>
                        </tr>
                    </table>

                    <table width="100%" style="padding:20px 32px;">
                        <tr><td>

                        <!-- Dev repo section -->
                        <table width="100%" cellpadding="0" cellspacing="0"
                            style="background:#fff;border-radius:8px;
                            overflow:hidden;margin-bottom:16px;">
                            <tr style="background:#2c3e50;">
                                <td colspan="2" style="padding:12px 20px;
                                    color:#fff;font-size:13px;font-weight:bold;
                                    letter-spacing:1px;">
                                    LATEST PUSH IN DEV REPO
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:12px 20px;color:#888;
                                    font-size:13px;width:35%;">Developer</td>
                                <td style="padding:12px 20px;color:#333;
                                    font-size:13px;font-weight:bold;">
                                    ${env.DEV_COMMIT_AUTHOR} (${env.DEV_COMMIT_EMAIL})
                                </td>
                            </tr>
                            <tr style="background:#fafafa;">
                                <td style="padding:12px 20px;color:#888;font-size:13px;">
                                    Last Commit</td>
                                <td style="padding:12px 20px;color:#333;font-size:13px;">
                                    ${env.DEV_COMMIT_MSG}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:12px 20px;color:#888;font-size:13px;">
                                    Last Date</td>
                                <td style="padding:12px 20px;color:#333;font-size:13px;">
                                    ${env.DEV_COMMIT_DATE} (${env.DEV_COMMIT_TIME})
                                </td>
                            </tr>
                            <tr style="background:#fafafa;">
                                <td style="padding:12px 20px;color:#888;font-size:13px;">
                                    Commit Hash</td>
                                <td style="padding:12px 20px;color:#333;
                                    font-size:13px;font-family:monospace;">
                                    ${env.DEV_COMMIT_HASH}
                                </td>
                            </tr>
                        </table>

                        <!-- Test repo section -->
                        <table width="100%" cellpadding="0" cellspacing="0"
                            style="background:#fff;border-radius:8px;
                            overflow:hidden;margin-bottom:16px;">
                            <tr style="background:#8B0000;">
                                <td colspan="2" style="padding:12px 20px;
                                    color:#fff;font-size:13px;font-weight:bold;
                                    letter-spacing:1px;">
                                    LATEST PUSH IN TEST REPO
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:12px 20px;color:#888;
                                    font-size:13px;width:35%;">Tester</td>
                                <td style="padding:12px 20px;color:#333;
                                    font-size:13px;font-weight:bold;">
                                    ${env.TEST_COMMIT_AUTHOR}
                                </td>
                            </tr>
                            <tr style="background:#fafafa;">
                                <td style="padding:12px 20px;color:#888;font-size:13px;">
                                    Last Commit</td>
                                <td style="padding:12px 20px;color:#333;font-size:13px;">
                                    ${env.TEST_COMMIT_MSG}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:12px 20px;color:#888;font-size:13px;">
                                    Last Date</td>
                                <td style="padding:12px 20px;color:#333;font-size:13px;">
                                    ${env.TEST_COMMIT_DATE}
                                </td>
                            </tr>
                        </table>

                        <p style="font-size:12px;color:#888;margin-top:16px;">
                            Triggered automatically when
                            <b>${env.DEV_COMMIT_AUTHOR}</b>
                            pushed to the dev repo.
                        </p>

                        </td></tr>
                    </table>

                    </body></html>
                """,
                mimeType: 'text/html'
            )
        }
    }
}