// Copyright 2020 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Bundle for release.
 */

import pkg from './package.json';

export default {
  input: 'src/index.js',
  output: [
    // We have to provide CommonJS still because rollup requires it :(.
    {file: pkg.main, format: 'cjs', exports: 'named'},
    {file: pkg.module, format: 'es'},
  ],
  plugins: [],
  external: [
    'child_process', 'path',
    ...Object.keys({...pkg.dependencies, ...pkg.peerDependencies}),
  ],
};
