/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// git utils
String getRepositoryName() {
    return sh(script: '''#!/bin/bash
        git remote -v | head -n1 | cut -d$'\t' -f2 | cut -d' ' -f1 | sed -e 's!https://github.com/!!g' -e 's!git@github.com:!!g' -e 's!.git!!g'
    ''', returnStdout: true).trim()
}

Boolean tagExistsAtHead() {
    try {
        sh(script: '''#!/bin/bash
            git describe --tags --exact-match
        ''', returnStdout: true)
        return true
    } catch (err) {
        return false
    }
}

String getLastTag() {
    return sh(script: '''#!/bin/bash
        git describe --tags --abbrev=0
    ''', returnStdout: true).trim()
}

// node utils
def nodeCmd(String cmd) {
    sh '. load_nvm && nvm install && nvm use && npm ci && ' + cmd
}

void npmLogin(String npmAuthToken) {
    if (!fileExists(file: '.npmrc')) {
        sh(
            script: """
                touch .npmrc;
                echo "//registry.npmjs.org/:_authToken=${npmAuthToken}" > .npmrc
            """,
            returnStdout: false
        )
    }
}


// FLAGS
Boolean isReleaseBranch
Boolean isPullRequest

pipeline {
    agent {
        node {
            label "nodejs-agent-v4"
        }
    }
    options {
        timeout(time: 20, unit: "MINUTES")
        buildDiscarder(logRotator(numToKeepStr: "50"))
    }
    post {
        always {
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

        // ============================================ Release Automation ==============================================
        stage("Release") {
            when {
                beforeAgent true
                allOf {
                    expression { isPullRequest == false }
                }
            }
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'npm-zextras-bot-auth-token', usernameVariable: 'AUTH_USERNAME', passwordVariable: 'NPM_TOKEN')]) {
                        withCredentials([usernamePassword(credentialsId: 'tarsier-bot-pr-token-github', usernameVariable: 'GH_USERNAME', passwordVariable: 'GH_TOKEN')]) {
                            nodeCmd("npx semantic-release")
                        }
                    }
                }
            }
        }

        stage('Open release to devel pull request') {
            when {
                beforeAgent true
                allOf {
                    expression { isReleaseBranch == true }
                    expression { tagExistsAtHead() == true }
                }
            }
            steps {
                script {
                    String versionBumperBranchName = "version-bumper/${getLastTag()}"
                    sh(script: """#!/bin/bash
                        git push origin HEAD:refs/heads/${versionBumperBranchName}
                    """)
                    withCredentials([usernamePassword(credentialsId: 'tarsier-bot-pr-token-github', usernameVariable: 'GH_USERNAME', passwordVariable: 'GH_TOKEN')]) {
                        sh(script: """
                            curl https://api.github.com/repos/${getRepositoryName()}/pulls \
                            -X POST \
                            -H 'Accept: application/vnd.github.v3+json' \
                            -H 'Authorization: token ${GH_TOKEN}' \
                            -d '{
                                \"title\": \"chore(release): ${getLastTag()}\",
                                \"head\": \"${versionBumperBranchName}\",
                                \"base\": \"devel\",
                                \"maintainer_can_modify\": true
                            }'
                        """)
                    }
                }
            }
        }
    }
}