/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
library(
    identifier: 'jenkins-lib-common@v4.11.0',
    retriever: modernSCM([
        $class: 'GitSCMSource',
        remote: 'git@github.com:zextras/jenkins-lib-common.git',
        credentialsId: 'jenkins-integration-with-github-account'
    ])
)

// npm-only CLI package: no dist/yap.json, no deb/rpm, so the Package stage is skipped.
// `pnpm run build:scripts` still runs in CI through the `prepare` lifecycle hook,
// which pnpm install triggers.
uiPipeline(hasPackage: false)
