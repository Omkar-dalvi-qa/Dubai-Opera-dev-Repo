pipeline {
    agent any

    options {
        disableConcurrentBuilds()
    }

    tools {
        nodejs 'NodeJS-18'
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

        stage('Run Tests') {
            steps {
                script {
                    // Checkout test repo
                    dir('test-suite') {
                        git branch: 'main',
                            url: 'https://github.com/Omkar-dalvi-qa/Dubai-Opera-TestCases.git'
                        sh 'npm ci'
                        sh 'npx playwright install --with-deps'
                        sh 'rm -rf allure-results'
                        sh 'mkdir -p test-results'
                        sh 'npx playwright test || true'
                    }
                }
            }
        }

        stage('Parse Results') {
            steps {
                script {
                    try {
                        def results = readJSON file: 'test-suite/test-results/results.json'
                        env.PASSED  = results.stats.expected.toString()
                        env.FAILED  = results.stats.unexpected.toString()
                        env.SKIPPED = results.stats.skipped.toString()

                        def failedTests = []
                        results.suites.each { suite ->
                            suite.suites.each { inner ->
                                inner.specs.each { spec ->
                                    if (!spec.ok) failedTests.add(spec.title)
                                }
                            }
                        }
                        env.FAILED_TESTS = failedTests.size() > 0
                            ? failedTests.join(', ')
                            : 'None'

                    } catch (err) {
                        env.PASSED       = 'N/A'
                        env.FAILED       = 'N/A'
                        env.SKIPPED      = 'N/A'
                        env.FAILED_TESTS = 'N/A'
                    }

                    // Tester info
                    dir('test-suite') {
                        env.TEST_AUTHOR = sh(
                            script: "git log -1 --pretty='%an'",
                            returnStdout: true).trim()
                        env.TEST_MSG = sh(
                            script: "git log -1 --pretty='%s'",
                            returnStdout: true).trim()
                        env.TEST_DATE = sh(
                            script: "git log -1 --pretty='%ad' --date=format:'%d %b %Y %H:%M'",
                            returnStdout: true).trim()
                    }

                    // Previous build
                    def prev = currentBuild.previousBuild
                    env.PREV_STATUS = prev ? prev.result.toString() : 'N/A'

                    // Build email list safely
env.EMAIL_TO = "omkardalvi861@gmail.com"
if (env.DEV_EMAIL != null && env.DEV_EMAIL != '' && env.DEV_EMAIL != 'N/A') {
    env.EMAIL_TO = env.EMAIL_TO + ',' + env.DEV_EMAIL
}
                }
            }
        }

    }

    post {
        always {
            allure([
                includeProperties: false,
                reportBuildPolicy: 'ALWAYS',
                results: [[path: 'test-suite/allure-results']]
            ])

            emailext(
                to:     env.EMAIL_TO,
                subject: "Dubai Opera — Build #${BUILD_NUMBER}: ${currentBuild.currentResult}",
                body: """
                <html>
                <body style="font-family:Arial;background:#f4f4f4;margin:0;padding:0;">

                <table width="100%" style="background:#8B0000;padding:20px 32px;">
                    <tr>
                        <td>
                            <h2 style="margin:0;color:#fff;font-size:20px;">
                                DUBAI OPERA</h2>
                            <p style="margin:4px 0 0;color:#ffcccc;font-size:12px;">
                                Automated Test Report</p>
                        </td>
                        <td align="right">
                            <span style="background:${
                                currentBuild.currentResult == 'SUCCESS'
                                ? '#2ecc71' : currentBuild.currentResult == 'UNSTABLE'
                                ? '#f39c12' : '#e74c3c'};
                                color:#fff;padding:6px 16px;border-radius:20px;
                                font-size:12px;font-weight:bold;">
                                ${currentBuild.currentResult}
                            </span>
                        </td>
                    </tr>
                </table>

                <table width="100%" style="padding:20px 32px;">
                <tr><td>

                <!-- Stats -->
                <table width="100%" style="margin-bottom:16px;">
                    <tr>
                        <td width="25%" style="padding:4px;">
                            <table width="100%" style="background:#fff;
                                border-radius:8px;border-top:4px solid #2ecc71;
                                padding:16px;text-align:center;">
                                <tr><td>
                                    <p style="margin:0;font-size:28px;
                                        font-weight:bold;color:#2ecc71;">
                                        ${PASSED}</p>
                                    <p style="margin:4px 0 0;font-size:11px;
                                        color:#888;">PASSED</p>
                                </td></tr>
                            </table>
                        </td>
                        <td width="25%" style="padding:4px;">
                            <table width="100%" style="background:#fff;
                                border-radius:8px;border-top:4px solid #e74c3c;
                                padding:16px;text-align:center;">
                                <tr><td>
                                    <p style="margin:0;font-size:28px;
                                        font-weight:bold;color:#e74c3c;">
                                        ${FAILED}</p>
                                    <p style="margin:4px 0 0;font-size:11px;
                                        color:#888;">FAILED</p>
                                </td></tr>
                            </table>
                        </td>
                        <td width="25%" style="padding:4px;">
                            <table width="100%" style="background:#fff;
                                border-radius:8px;border-top:4px solid #f39c12;
                                padding:16px;text-align:center;">
                                <tr><td>
                                    <p style="margin:0;font-size:28px;
                                        font-weight:bold;color:#f39c12;">
                                        ${SKIPPED}</p>
                                    <p style="margin:4px 0 0;font-size:11px;
                                        color:#888;">SKIPPED</p>
                                </td></tr>
                            </table>
                        </td>
                        <td width="25%" style="padding:4px;">
                            <table width="100%" style="background:#fff;
                                border-radius:8px;border-top:4px solid #3498db;
                                padding:16px;text-align:center;">
                                <tr><td>
                                    <p style="margin:0;font-size:16px;
                                        font-weight:bold;color:#3498db;">
                                        ${PREV_STATUS}</p>
                                    <p style="margin:4px 0 0;font-size:11px;
                                        color:#888;">PREV BUILD</p>
                                </td></tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <!-- Failed tests -->
                <table width="100%" style="background:#fff;border-radius:8px;
                    overflow:hidden;margin-bottom:16px;">
                    <tr style="background:#e74c3c;">
                        <td colspan="2" style="padding:10px 16px;color:#fff;
                            font-size:12px;font-weight:bold;">FAILED TESTS</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 16px;color:#888;
                            font-size:12px;width:30%;">Test name(s)</td>
                        <td style="padding:10px 16px;color:#e74c3c;
                            font-size:12px;">${FAILED_TESTS}</td>
                    </tr>
                </table>

                <!-- Dev repo -->
                <table width="100%" style="background:#fff;border-radius:8px;
                    overflow:hidden;margin-bottom:16px;">
                    <tr style="background:#2c3e50;">
                        <td colspan="2" style="padding:10px 16px;color:#fff;
                            font-size:12px;font-weight:bold;">
                            LATEST PUSH IN DEV REPO</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 16px;color:#888;
                            font-size:12px;width:30%;">Developer</td>
                        <td style="padding:10px 16px;color:#333;
                            font-size:12px;font-weight:bold;">
                            ${DEV_AUTHOR} (${DEV_EMAIL})</td>
                    </tr>
                    <tr style="background:#fafafa;">
                        <td style="padding:10px 16px;color:#888;
                            font-size:12px;">Last Commit</td>
                        <td style="padding:10px 16px;color:#333;
                            font-size:12px;">${DEV_MSG}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 16px;color:#888;
                            font-size:12px;">Date</td>
                        <td style="padding:10px 16px;color:#333;
                            font-size:12px;">${DEV_DATE}</td>
                    </tr>
                    <tr style="background:#fafafa;">
                        <td style="padding:10px 16px;color:#888;
                            font-size:12px;">Hash</td>
                        <td style="padding:10px 16px;color:#333;
                            font-size:12px;font-family:monospace;">
                            ${DEV_HASH}</td>
                    </tr>
                </table>

                <!-- Test repo -->
                <table width="100%" style="background:#fff;border-radius:8px;
                    overflow:hidden;margin-bottom:16px;">
                    <tr style="background:#8B0000;">
                        <td colspan="2" style="padding:10px 16px;color:#fff;
                            font-size:12px;font-weight:bold;">
                            LATEST PUSH IN TEST REPO</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 16px;color:#888;
                            font-size:12px;width:30%;">Tester</td>
                        <td style="padding:10px 16px;color:#333;
                            font-size:12px;font-weight:bold;">
                            ${TEST_AUTHOR}</td>
                    </tr>
                    <tr style="background:#fafafa;">
                        <td style="padding:10px 16px;color:#888;
                            font-size:12px;">Last Commit</td>
                        <td style="padding:10px 16px;color:#333;
                            font-size:12px;">${TEST_MSG}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 16px;color:#888;
                            font-size:12px;">Date</td>
                        <td style="padding:10px 16px;color:#333;
                            font-size:12px;">${TEST_DATE}</td>
                    </tr>
                </table>

                <!-- Build details -->
                <table width="100%" style="background:#fff;border-radius:8px;
                    overflow:hidden;margin-bottom:16px;">
                    <tr style="background:#8B0000;">
                        <td colspan="2" style="padding:10px 16px;color:#fff;
                            font-size:12px;font-weight:bold;">BUILD DETAILS</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 16px;color:#888;
                            font-size:12px;width:30%;">Build ID</td>
                        <td style="padding:10px 16px;color:#333;
                            font-size:12px;font-family:monospace;
                            font-weight:bold;">#${BUILD_NUMBER}</td>
                    </tr>
                    <tr style="background:#fafafa;">
                        <td style="padding:10px 16px;color:#888;
                            font-size:12px;">Environment</td>
                        <td style="padding:10px 16px;color:#333;
                            font-size:12px;">localhost:3000</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 16px;color:#888;
                            font-size:12px;">Duration</td>
                        <td style="padding:10px 16px;color:#333;
                            font-size:12px;">${currentBuild.durationString}</td>
                    </tr>
                </table>

                <!-- Buttons -->
                <table style="margin-top:16px;">
                    <tr>
                        <td style="padding-right:12px;">
                            <a href="${BUILD_URL}allure/" style="
                                background:#8B0000;color:#fff;
                                padding:10px 20px;text-decoration:none;
                                border-radius:6px;font-size:12px;
                                font-weight:bold;">
                                View Allure Report</a>
                        </td>
                        <td>
                            <a href="${BUILD_URL}console" style="
                                background:#fff;color:#8B0000;
                                padding:10px 20px;text-decoration:none;
                                border-radius:6px;font-size:12px;
                                font-weight:bold;border:2px solid #8B0000;">
                                View Console</a>
                        </td>
                    </tr>
                </table>

                </td></tr></table>

                <table width="100%" style="background:#333;padding:12px 32px;">
                    <tr><td>
                        <p style="margin:0;color:#888;font-size:11px;">
                            Jenkins CI — Dubai Opera Test Pipeline —
                            Auto triggers on developer push
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