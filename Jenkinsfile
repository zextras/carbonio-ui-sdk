/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// git utils
int getCommitParentsCount() {
    return Integer.parseInt(
        sh(
            script: """#!/usr/bin/env bash
                git cat-file -p HEAD | grep -w "parent" | wc -l
            """,
            returnStdout: true
        ).trim()
    )
}

boolean gitIsMergeCommit() {
    return 2 <= getCommitParentsCount()
}

void gitFixConfigAndRemote() {
    sh(
        script: """#!/usr/bin/env bash
            git config user.email "bot@zextras.com"
            git config user.name "Tarsier Bot"
        """
    )
    String repoOriginUrl = sh(
        script: """#!/usr/bin/env bash
            git remote -v | head -n1 | cut -d\$'\t' -f2 | cut -d\" \" -f1
        """,
        returnStdout: true
    ).trim()
    String newOriginUrl = repoOriginUrl.replaceFirst("https://github.com/Zextras", "git@github.com:Zextras")
    sh(
        script: """#!/usr/bin/env bash
            git remote set-url origin ${newOriginUrl}
        """
    )
}

void gitUnshallow() {
    sh(
      script: """#!/usr/bin/env bash
        git fetch --unshallow
      """
    )
}

void gitSetup() {
    gitFixConfigAndRemote()
    gitUnshallow()
}

String getCommitVersion() {
    return sh(
        script: """#!/usr/bin/env bash
            git log -1 | grep \'version:\' | sed -n \'s/.*version:\\s*//p\'
        """,
        returnStdout: true
    ).trim()
}

String getCommitId() {
    return sh(
        script: """#!/usr/bin/env bash
            git rev-parse HEAD
        """,
        returnStdout: true
    ).trim()
}

void gitPush(Map opts = [:]) {
    def gitOptions = [' ']
    if (opts.followTags == true) {
        gitOptions << '--follow-tags'
    }
    if (gitOptions.size() > 1) {
        gitOptions << ' '
    }

    sh(
        script: """#!/usr/bin/env bash
            git push${gitOptions.join(' ')}origin HEAD:${opts.branch}
        """
    )
}

String getOriginUrl() {
    return sh(
      script: """#!/usr/bin/env bash
        git remote -v | head -n1 | cut -d\$'\t' -f2 | cut -d\" \" -f1
      """,
      returnStdout: true
    ).trim()
}

void openGithubPr(Map args = [:]) {
    def ownerAndRepo = getOriginUrl().replaceAll("git@github.com:", "").replaceAll(".git", "")
    echo "Opening PR with https://api.github.com/repos/${ownerAndRepo}/pulls"
    sh(
        script: """#!/usr/bin/env bash
            curl --location https://api.github.com/repos/${ownerAndRepo}/pulls \
            -X POST \
            -H 'Accept: application/vnd.github+json' \
            -H 'Authorization: Bearer ${args.TOKEN}' \
            -d '{
                \"title\": \"${args.title}\",
                \"head\": \"${args.head}\",
                \"base\": \"${args.base}\",
                \"maintainer_can_modify\": true
            }'
        """
    )
}

// Package utils
String getPackageName() {
    return sh(
        script: """#!/usr/bin/env bash
            cat package.json \
            | jq --raw-output '.name'
            """,
        returnStdout: true
    ).trim()
}

String getPackageDescription() {
    return sh(
        script: """#!/usr/bin/env bash
            cat package.json \
            | jq --raw-output '.description'
            """,
        returnStdout: true
    ).trim()
}

String getPackageVersion() {
    return sh(
        script: """#!/usr/bin/env bash
            cat package.json \
            | jq --raw-output '.version'
            """,
        returnStdout: true
    ).trim()
}

// node utils
void nodeCmd(Map args = [:]) {
    final boolean install = (args.install != null) ? args.install : false
    def varEnv = []
    ((args.varEnv != null) ? args.varEnv : []).each { k, v -> varEnv.push("$k=$v") }
    String version
    if (fileExists('.nvmrc')) {
        version = ''
    } else {
        version = (args.version != null) ? "${args.version} " : '16'
    }
    sh(
        script: """#!/usr/bin/env bash
            ${varEnv.join(' ')} source load_nvm && nvm install ${version} && nvm use ${version} \
            ${install ? '&& npm ci ' : ''} \
            ${args.script != null ? "&& ${args.script} " : ''} \
        """
    )
}

void npxCmd(Map args = [:]) {
    nodeCmd(
        version: args.nodeVersion,
        install: args.install,
        script: """
            npx ${args.script}
            """,
        varEnv: args.varEnv
    )
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
Boolean isDevelBranch
Boolean isPullRequest
Boolean isMergeCommit
Boolean isBumpBuild
// PROJECT DETAILS
String pkgName
String pkgVersion
String pkgVersionFull
String[] pkgVersionParts

pipeline {
    agent {
        node {
            label "nodejs-agent-v2"
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
                   isReleaseBranch = "${BRANCH_NAME}" ==~ /(release|master)/
                   echo "isReleaseBranch: ${isReleaseBranch}"
                   isDevelBranch = "${BRANCH_NAME}" ==~ /devel/
                   echo "isDevelBranch: ${isDevelBranch}"
                   isPullRequest = "${BRANCH_NAME}" ==~ /PR-\d+/
                   echo "isPullRequest: ${isPullRequest}"
                   isMergeCommit = gitIsMergeCommit()
                   echo "isMergeCommit: ${isMergeCommit}"
                   isBumpBuild = isReleaseBranch && isMergeCommit
                   echo "isBumpBuild: ${isBumpBuild}"
                   isDevBuild = !isReleaseBranch
                   echo "isDevBuild: ${isDevBuild}"
                   pkgName = getPackageName()
                   echo "pkgName: ${pkgName}"
                   pkgDescription = getPackageDescription()
                   echo "pkgDescription: ${pkgDescription}"
                   pkgFullVersion = getPackageVersion()
                   echo "pkgFullVersion: ${pkgFullVersion}"
                }
                withCredentials([
                    usernamePassword(
                        credentialsId: "npm-zextras-bot-auth-token",
                        usernameVariable: "NPM_USERNAME",
                        passwordVariable: "NPM_PASSWORD"
                    )
                ]) {
                    script {
                        npmLogin(NPM_PASSWORD)
                    }
                }
                stash(
                    includes: ".npmrc",
                    name: ".npmrc"
                )
            }
        }

        // ============================================ Release Automation ==============================================
        stage("Bump Version") {
            agent {
                node {
                    label "nodejs-agent-v2"
                }
            }
            when {
                beforeAgent(true)
                expression { isBumpBuild == true }
            }
            steps {
                gitSetup()
                script {
                    def commitVersion = getCommitVersion();
                    if (commitVersion) {
                        echo "Force bump to version ${commitVersion}"
                        npxCmd(
                            script: "standard-version --no-verify --release-as ${commitVersion}"
                        )
                    } else {
                        npxCmd(
                            script: "standard-version --no-verify"
                        )
                    }
                    pkgVersionFull = getPackageVersion()
                    echo("Package version: ${pkgVersionFull}")
                    gitPush(
                        branch: "${BRANCH_NAME}",
                        followTags: true
                    )
                    def versionBumperBranch = "version-bumper/v${pkgVersionFull}"
                    gitPush(
                        branch: "refs/heads/${versionBumperBranch}"
                    )

                    stash(
                        includes: 'CHANGELOG.md',
                        name: 'release_updated_files_changelogmd'
                    )
                    stash(
                        includes: 'package.json',
                        name: 'release_updated_files_packagejson'
                    )
                    stash(
                        includes: 'package-lock.json',
                        name: 'release_updated_files_packagelockjson'
                    )

                }
            }
        }

        stage("Release in NPM") {
            agent {
                node {
                    label "nodejs-agent-v2"
                }
            }
            when {
                beforeAgent(true)
                allOf {
                    expression { isReleaseBranch == true }
                    expression { isBumpBuild == false }
                }
            }
            steps {
                script {
                    def commitId = getCommitId()
                    checkout(scm: [
                        $class: "GitSCM",
                        branches: [[
                            name: commitId
                        ]],
                        userRemoteConfigs: scm.userRemoteConfigs
                    ])
                    unstash(name: ".npmrc")
                    catchError(buildResult: "UNSTABLE", stageResult: "FAILURE") {
                        nodeCmd(
                            install: true,
                            script: "npm publish",
                            varEnv: [
                                NODE_ENV: 'production'
                            ]
                        )
                    }
                }
            }
        }
    }
}