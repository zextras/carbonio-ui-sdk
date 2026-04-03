/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// git utils
String getRepositoryName() {
    return sh(script: '''
        git remote -v | head -n1 | cut -d$'\t' -f2 | cut -d' ' -f1 | sed -e 's!https://github.com/!!g' -e 's!git@github.com:!!g' -e 's!.git!!g'
    ''', returnStdout: true).trim()
}

Boolean tagExistsAtHead() {
    try {
        sh(script: '''
            git describe --tags --exact-match
        ''', returnStdout: true)
        return true
    } catch (err) {
        return false
    }
}

String getLastTag() {
    return sh(script: '''
        git describe --tags --abbrev=0
    ''', returnStdout: true).trim()
}

def getNodeVersion() {
    return sh(
        script: 'sed "s/^[vV]//" .nvmrc | cut -d. -f1',
        returnStdout: true
    ).trim()
}

// FLAGS
Boolean isReleaseBranch
Boolean isPullRequest
String nodeVersion

pipeline {
    agent {
        node {
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
                   nodeVersion = getNodeVersion()
                   echo "NodeJS Major Version: $nodeVersion"
                }
            }
        }
        stage('Install dependencies') {
            steps {
                container('nodejs-' + nodeVersion) {
                    script {
                        sh 'npm ci'
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
