/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 * @type {import('semantic-release').GlobalConfig}
 */

export default {
  branches: [
    "devel",
    {
      name: "beta",
      prerelease: true,
    },
  ],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
        releaseRules: [
          // enable release also for refactor and build commits
          { type: "refactor", release: "patch" },
          { type: "build", release: "patch" },
        ],
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        presetConfig: {
          types: [
            { type: "feat", section: "Features" },
            { type: "fix", section: "Bug Fixes" },
            { type: "perf", section: "Performance Improvements" },
            { type: "refactor", section: "Code Refactoring" },
            { type: "build", section: "Build System" },
          ],
        },
      },
    ],
    "@semantic-release/npm",
    "@semantic-release/github",
  ],
};
