# rollup-plugin-git-info

Plugin for including git version information into `package.json` imports.

- [Requirements]
- [Install]
- [Usage]
  - [Fields]
- [Options]
  - [`abbrev`]
  - [`branchCommand`]
  - [`commitHashCommand`]
  - [`cwd`]
  - [`dateFormat`]
  - [`dateCommand`]
  - [`transformFilename`]
  - [`updateVersion`]
  - [`versionFormat`]

## Requirements

This plugin requires:

- Node v12+ (the latest [LTS](https://github.com/nodejs/Release) or newer)
- Rollup v2+ (tested against 2.32.0+)

## Install

Using npm:

```console
npm install rollup-plugin-git-info --save-dev
```

## Usage

In your [`rollup.config.js`](https://www.rollupjs.org/guide/en/#configuration-files),
import the plugin:

```js
import gitInfo from 'rollup-plugin-git-info';

export default {
  input: 'src/index.js',
  output: {
    dir: 'dist',
    format: 'es',
  },
  plugins: [gitInfo()],
};
```

Then in your source code, import the `package.json` file, and use the [fields]:

```js
// src/index.js
import pkg from './package.json';
console.log(`running version ${pkg.version}`);
```

Then use [`rollup`](https://www.rollupjs.org/) like normal!

### Fields

The following fields are injected into the JSON import.

Note: `version` is updated by default to equal `gitVersion`.

| Field           | Meaning                          | Example                                    |
| --------------- | -------------------------------- | ------------------------------------------ |
| `buildDate`     | Date the bundled was made.       | `Mon, 26 Oct 2020 06:58:09 GMT`            |
| `gitAbbrevHash` | Abbreviated (short) git hash.    | `f347dcd`                                  |
| `gitBranch`     | Active git branch.               | `main`                                     |
| `gitCommitHash` | Full git hash.                   | `f347dcd8c8c7b5923fd8459eaf5fddc44f31acc6` |
| `gitDate`       | Latest commit date. <sup>1</sup> | `Sat, 24 Oct 2020 01:32:35 -0400`          |
| `gitVersion`    | [SemVer] version with git info.  | `1.0.0-main+gf347dcd`                      |

<sup>1</sup>: By default, the git date is the git commit date which comes from the
git commit itself and might not be the same as the author date or when the
commit was actually pushed to the branch.

## Options

Since this loads a JSON file using the [rollup-plugin-json] package, all of its
[options](https://www.npmjs.com/package/@rollup/plugin-json#options)
are respected here too.
They aren't documented here though, so see that plugin's documentation.

### `abbrev`

Type: `Number`<br>
Default: `7`

How many leading characters to use when creating `gitAbbrevHash`.

### `branchCommand`

Type: `String`<br>
Default: `rev-parse --abbrev-ref HEAD`

The git command to display the active branch.
If no branch is active (i.e. a detached head due to checking out a specific
commit), then this will simply be `HEAD`.

### `commitHashCommand`

Type: `String`<br>
Default: `rev-parse HEAD`

Git subcommand to extract the commit hash from the repository.

### `cwd`

Type: `String`<br>
Default: undefined

The directory to run git commands under.
By default, git information is extracted from the directory where the imported
`package.json` file lives.

### `dateFormat`

Type: `String`<br>
Default: `%cD` ("git commit date, RFC2822 style")

The [git pretty format](https://git-scm.com/docs/pretty-formats) for extracting
the date of the git repository.
This is appended to `dateCommand` to form the complete git command, but is
broken out for convience as most people only want to tweak the format.

Another common option is `%aD` for the RFC2822 git author date.

If none of the stock formats work for you, consider using `%ad` or `%cd` with
[`--date=<format>`](https://git-scm.com/docs/git-log#Documentation/git-log.txt---dateltformatgt).
In particular, the `--date=format:...` gets access to
[strftime](https://man7.org/linux/man-pages/man3/strftime.3.html).

### `dateCommand`

Type: `String`<br>
Default: `log -1 --format=`

The git command to extract the commit date.
The `dateFormat` option is appended to this command first to control which date
field to extract from the git repository.

### `enableBuildDate`

Type: `Boolean`<br>
Default: `false`

Whether to export `buildDate` at all.

This can be useful for development, but it can also be detrimental to caching
and [reproducible builds](https://reproducible-builds.org/).
Hence it is disabled by default.

### `transformFilename`

Type: `String`<br>
Default: `package.json`

The JSON file to inject git fields into when importing.

This might be useful if, for some reason, you want to keep the standard
`package.json` content unmodified, and place all the generated git fields in a
unique file/namespace.

### `updateVersion`

Type: `Boolean`<br>
Default: `true`

Whether to set the `package.json`'s `version` to the generated `gitVersion`.

Note: The `gitVersion` is always available separately, so this is more of a
convience of just referring to `pkg.version` everywhere.

### `versionFormat`

Type: `String`<br>
Default: `[version]-[branch]+g[abbrevHash]`

The format of the generated `gitVersion`.

It is strongly recommended to keep it [SemVer] compliant.

Note: The `g` prefix (short for "git") on the commit hash is a standard
convention in the git world when using commit hashes in version strings.

Available placeholders (see the [Fields] section for details):

- `abbrevHash`: Abbreviated commit hash.
- `commitHash`: Full commit hash.
- `branch`: Git branch.
- `version`: The input file's `version` field (or `0.0.0` if unavailable).

[requirements]: #requirements
[install]: #install
[usage]: #usage
[fields]: #fields
[options]: #options
[`abbrev`]: #abbrev
[`branchcommand`]: #branchCommand
[`commithashcommand`]: #commitHashCommand
[`cwd`]: #cwd
[`dateformat`]: #dateFormat
[`datecommand`]: #dateCommand
[`transformfilename`]: #transformFilename
[`updateversion`]: #updateVersion
[`versionformat`]: #versionFormat
[rollup-plugin-json]: https://www.npmjs.com/package/@rollup/plugin-json
[semver]: https://semver.org/
