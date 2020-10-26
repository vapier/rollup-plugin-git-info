// Copyright 2020 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Test the plugin.
 */

import {assert} from 'chai';
import gitInfo from '../src/index.js';
import {TEST_ONLY} from '../src/index.js';

/**
 * Tests for runGit helper.
 */
describe('runGit', () => {
  const {runGit} = TEST_ONLY;
  it('version', () => {
    const ret = runGit('.', 'version');
    assert.include(ret, 'git version');
  });
});

/**
 * Tests for formatString helper.
 */
describe('formatString', () => {
  const {formatString} = TEST_ONLY;
  it('no fields', () => {
    assert.equal('foo', formatString('foo', {}));
  });

  it('one field', () => {
    assert.equal('bar', formatString('[foo]', {foo: 'bar'}));
  });

  it('repeat field', () => {
    assert.equal('bar-bar', formatString('[foo]-[foo]', {foo: 'bar'}));
  });

  it('many fields', () => {
    assert.equal('FB', formatString('[foo][bar]', {foo: 'F', bar: 'B'}));
  });

  it('unknown field', () => {
    assert.throws(() => formatString('[foo][bar]', {}));
  });
});

/**
 * Tests for injection.
 */
describe('inject', () => {
  const {defaultVersionFormat, inject} = TEST_ONLY;
  const defOptions = {
    updateVersion: true,
    versionFormat: defaultVersionFormat,
  };
  const defFields = {
    buildDate: 'today!',
    abbrevHash: '12345',
    branch: 'main',
    commitHash: 'myhash',
    commitDate: 'long-ago',
  };

  it('normal', () => {
    const data = {version: '1.2.3'};
    inject(defOptions, data, defFields);
    assert.deepEqual({
      gitAbbrevHash: '12345',
      gitBranch: 'main',
      gitCommitHash: 'myhash',
      gitDate: 'long-ago',
      gitVersion: '1.2.3-main+g12345',
      version: '1.2.3-main+g12345',
    }, data);
  });

  it('missing version', () => {
    const data = {};
    inject(defOptions, data, defFields);
    assert.equal(data.version, '0.0.0-main+g12345');
    assert.equal(data.gitVersion, '0.0.0-main+g12345');
  });

  it('options enableBuildDate=true', () => {
    const data = {};
    inject({...defOptions, enableBuildDate: true}, data, defFields);
    assert.equal(data.buildDate, 'today!');
  });

  it('options updateVersion=false', () => {
    const data = {};
    inject({...defOptions, updateVersion: false}, data, defFields);
    assert.isUndefined(data.version);
    assert.equal(data.gitVersion, '0.0.0-main+g12345');
  });
});

/**
 * Real tests for the plugin itself.
 */
describe('plugin', () => {
  const {defaultBranchCommand, defaultCommitHashCommand, defaultDateCommand,
         defaultDateFormat} = TEST_ONLY;

  before(function() {
    this.oldRunGit = TEST_ONLY.runGit;
  });
  after(function() {
    TEST_ONLY.runGit = this.oldRunGit;
  });

  it('name', () => {
    assert.equal(gitInfo().name, 'git-info');
  });

  it('instantiate', () => {
    const plugin = new gitInfo();
  });

  it('skip file', () => {
    TEST_ONLY.runGit = () => assert.fail('Should not be run');
    const plugin = new gitInfo();
    assert.isNull(plugin.transform('', 'my.json'));
  });

  it('options abbrev', () => {
    TEST_ONLY.runGit = () => 'long-output-should-be-abbrev';
    const plugin = new gitInfo({abbrev: 10});
    const {code} = plugin.transform('{}', 'package.json');
    assert.include(code, 'export var gitAbbrevHash = "long-outpu";');
  });

  it('options cwd', () => {
    let callCount = 0;
    TEST_ONLY.runGit = (cwd) => {
      ++callCount;
      assert.equal(cwd, '/foo/bar');
      return 'output';
    };
    const plugin = new gitInfo({cwd: '/foo/bar'});
    plugin.transform('{}', 'package.json');
    assert.notEqual(callCount, 0);
  });

  it('options transformFilename', () => {
    TEST_ONLY.runGit = () => 'output';
    const plugin = new gitInfo({transformFilename: 'my.json'});
    const {code} = plugin.transform('{}', 'my.json');
    assert.include(code, 'export var gitVersion = "0.0.0-output+goutput";');
  });

  it('options versionFormat', () => {
    TEST_ONLY.runGit = () => 'output';
    const plugin = new gitInfo({versionFormat: 'fooie!'});
    const {code} = plugin.transform('{}', 'package.json');
    assert.include(code, 'export var version = "fooie!";');
  });

  it('transform', () => {
    TEST_ONLY.runGit = (cwd, cmd) => {
      switch (cmd) {
        case defaultBranchCommand:
          return 'main';
        case defaultCommitHashCommand:
          return 'abcdef0123456789a0b1c2d3e4f5069876543210';
        case defaultDateCommand + defaultDateFormat:
          return 'today!';
        default:
          assert.fail(`mock for "${cmd}" is missing`);
      }
    };

    const plugin = new gitInfo();
    const {code} = plugin.transform('{}', 'package.json');
    // Could assert all the fields, but inject() coverage above should be OK.
    assert.include(code, 'export var gitCommitHash');
    assert.include(code, 'export var gitDate');
  });
});
