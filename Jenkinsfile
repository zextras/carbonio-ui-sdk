/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// FLAGS
Boolean isReleaseBranch
Boolean isPullRequest
String nodeVersion

pipeline {
    agent {
        node {
            label "nodejs-v1"
            label "nodejs-v1"
        }
    }
    options {
        timeout(time: 20, unit: "MINUTES")
        buildDiscarder(logRotator(numToKeepStr: "50"))
    }
    post {
        always {
            container('base') {
                script {
                    def commitEmail = sh(
                        script: "git --no-pager show -s --format='%ae'",
                        returnStdout: true
                    ).trim()
                    emailext(
                        attachLog: true,
                        body: "\$DEFAULT_CONTENT",
                        recipientProviders: [requestor()],
                        subject: "\$DEFAULT_SUBJECT",
                        to: "${commitEmail}"
                    )
                }
            container('base') {
                script {
                    def commitEmail = sh(
                        script: "git --no-pager show -s --format='%ae'",
                        returnStdout: true
                    ).trim()
                    emailext(
                        attachLog: true,
                        body: "\$DEFAULT_CONTENT",
                        recipientProviders: [requestor()],
                        subject: "\$DEFAULT_SUBJECT",
                        to: "${commitEmail}"
                    )
                }
            }
        }
    }
    stages {
        stage("Read settings") {
            steps {
                script {
                   isReleaseBranch = "${BRANCH_NAME}" ==~ /release/
                   echo "isReleaseBranch: ${isReleaseBranch}"
                   isPullRequest = "${BRANCH_NAME}" ==~ /PR-\d+/
                   echo "isPullRequest: ${isPullRequest}"
                }
            }
        }
        stage('Install dependencies') {
            steps {
                container('pnpm') {
                    script {
                        sh 'pnpm install --frozen-lockfile'
                    }
                }
            }
        }

        stage('Checks') {
            parallel {
                stage('TypeCheck') {
                    steps {
                        container('pnpm') {
                            script {
                                catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
                                    sh 'pnpm run type-check'
                                }
                            }
                        }
                    }
                }
            }
        }
    
        stage("Release") {
            when {
                allOf {
                    expression { isPullRequest == false }
                }
            }
            steps {
                container('nodejs-' + nodeVersion) {
                    script {
                        withCredentials([usernamePassword(credentialsId: 'npm-zextras-bot-auth-token', usernameVariable: 'AUTH_USERNAME', passwordVariable: 'NPM_TOKEN')]) {
                            withCredentials([usernamePassword(credentialsId: 'jenkins-integration-with-github-account', usernameVariable: 'GH_USERNAME', passwordVariable: 'GH_TOKEN')]) {
                                sh 'npx semantic-release'
                            }
                        }
                    }
                }
            }
        }
    }
}
