// Copyright 2020 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview The git info rollup plugin!
 */

import jsonPlugin from '@rollup/plugin-json';

import child_process from 'child_process';
import path from 'path';

// Declared once in module scope so it's consistent across multiple outputs.
const buildDate = new Date().toUTCString();

/**
 * Execute a git subcommand and return the output.
 *
 * @param {string} cwd The directory to run in.
 * @param {string} cmd The git subcommand.
 * @return {string} The command's output (stdout).
 */
function runGit(cwd, cmd) {
  return child_process.execSync(`git ${cmd}`, {
    cwd,
    encoding: 'utf-8',
    windowsHide: true,
  }).trim();
}

/**
 * Format the placeholders in a string.
 *
 * @param {string} format The string to format.
 * @param {!Object<string, string>} fields The placeholders dict.
 * @return {string} The formatted string.
 */
function formatString(format, fields) {
  return format.replace(/\[([^\]]*)\]/g, (match, field) => {
    const ret = fields[field];
    if (ret === undefined) {
      throw new Error(`"${format}": unknown placeholder '${field}'`);
    }
    return ret;
  });
}

/**
 * Helper for doing the actual field injection into the parsed object.
 *
 * @param {!Object} options The plugin options.
 * @param {!Object} data The object to inject our fields into.
 * @param {!Object} fields The fields we'll be injecting.
 */
function inject(options, data,
                {buildDate, abbrevHash, branch, commitHash, commitDate}) {
  const version = data.version || '0.0.0';
  if (options.enableBuildDate) {
    data.buildDate = buildDate;
  }
  data.gitAbbrevHash = abbrevHash;
  data.gitBranch = branch;
  data.gitCommitHash = commitHash;
  data.gitDate = commitDate;
  data.gitVersion = formatString(options.versionFormat, {
    version, branch, commitHash, abbrevHash,
  });
  if (options.updateVersion) {
    data.version = data.gitVersion;
  }
}

/**
 * Options that we pass through to the JSON plugin.
 *
 * @type {!Array<string>}
 */
const jsonPluginOptions = [
  'compact',
  'exclude',
  'include',
  'indent',
  'namedExports',
  'preferConst',
];

// Constants broken out to help with testing.
const defaultBranchCommand = 'rev-parse --abbrev-ref HEAD';
const defaultCommitHashCommand = 'rev-parse HEAD';
const defaultDateCommand = 'log -1 --format=';
const defaultDateFormat = '%cD';
const defaultVersionFormat = '[version]-[branch]+g[abbrevHash]';

/**
 * The rollup plugin!
 *
 * @param {!Object} options The plugin options from the rollup config.
 * @return {!Object} The plugin configuration info.
 */
function rollupGitInfo(options = {}) {
  // Extract the JSON plugin options only.
  const jsonOptions = {};
  jsonPluginOptions.forEach((key) => {
    if (options[key] !== undefined) {
      jsonOptions[key] = options[key];
      delete options[key];
    }
  });
  const jsonTransform = jsonPlugin(jsonOptions).transform;

  // Set up our default options.
  options = Object.assign({
    abbrev: 7,
    branchCommand: defaultBranchCommand,
    commitHashCommand: defaultCommitHashCommand,
    cwd: undefined,
    dateCommand: defaultDateCommand,
    dateFormat: defaultDateFormat,
    enableBuildDate: false,
    transformFilename: 'package.json',
    updateVersion: true,
    versionFormat: defaultVersionFormat,
  }, options);

  return {
    name: 'git-info',

    /**
     * Transform the import!
     *
     * @param {string} json The input file data.
     * @param {string} id The input file name.
     * @return {?string} The transformed file data.
     */
    transform(json, id) {
      // Only monkey patch package.json imports.
      if (path.basename(id) != options.transformFilename) {
        return null;
      }

      // Figure out the runtime info to use.
      const cwd = options.cwd === undefined ? path.dirname(id) : options.cwd;
      const run = TEST_ONLY.runGit.bind(this, cwd);

      // Extract the git details in this dir.
      const commitHash = run(options.commitHashCommand);
      const branch = run(options.branchCommand);
      const abbrevHash = commitHash.slice(0, options.abbrev);
      const commitDate = run(options.dateCommand + options.dateFormat);

      // Inject the fields into the JSON content.
      const data = JSON.parse(json);
      inject(options, data,
             {buildDate, abbrevHash, branch, commitHash, commitDate});

      // Pass the new JSON on to the JSON plugin to output.
      const newJson = JSON.stringify(data);
      return jsonTransform(newJson, id);
    },
  };
}

export default rollupGitInfo;

// Exports only for the test framework.
export const TEST_ONLY = {
  defaultBranchCommand,
  defaultCommitHashCommand,
  defaultDateCommand,
  defaultDateFormat,
  defaultVersionFormat,
  formatString,
  inject,
  runGit,
};
