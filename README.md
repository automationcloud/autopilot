# Welcome to Autopilot!

This repository hosts the codebase for several tightly coupled projects:

- [Engine](packages/engine) — a library which defines core Automation model, shared between Autopilot and Worker
- [CDP](packages/cdp) — a library for managing Chrome via [Chrome DevTools Protocol](https://chromedevtools.github.io)
- [Autopilot](packages/autopilot) — an Electron-based GUI application for creating, editing and debugging scripts
- [Worker](packages/worker) — a process which coordinates execution of the Ubio Automation Jobs by means of communicating with APIs and delegating the work to the Engine.

## Usage

This repository can be used in several ways:

- Running Autopilot (or any of its components) from source code — useful for development, contributing new features, or if you prefer forking it and build your own Automation engine. Please see [Development](#development).
- Running a script created with Autopilot locally using Engine. Please see [Engine](packages/engine) for more information.

## Development

This repository is a monorepo managed by [Lerna](https://lerna.js.org).

### Initial setup

Make sure you have Lerna installed globally:

```
npm i -g lerna
```

After checking out the project, run:

```
npm run init
```

This will install dependencies in sub-packages, link local dependencies together and perform the initial compilation.
(Note: it may take a while!)

### Compiling TypeScript

In development you'd probably be insterested in running TypeScript incremental compiler in background.
To do this run the following command in your separate terminal tab:

```
npm run dev
```

Initial compilation can take considerable time, but all subsequent compilations will be faster.

Note: sometimes removing or renaming source files causes issues with TypeScript compiler (e.g. module not found or, conversely, module is found but doesn't actually exist). If you run into such problems, stop the compiler, run `npm run clean` and try again.

### Running Autopilot

After initial compilation run:

```
npm run ap
```

This will start Autopilot and also run WebPack in watch mode.

### Releasing

Releasing in the context of Autopilot means:

- bumping a version (major, minor, patch, prerelease, etc)
- performing a clean build (compiling TypeScript w/o cache, preparing other assets)
- publishing all packages to npm
- pushing the tag to npm
- have CI building worker image and deploying it to staging

Run `npm run release` in project root to do all that. Outcome to assert:

- all packages are published to npm
- GitHub tag created and pushed
- GitHub builds and pushes worker image

### Releasing Autopilot

Prerequisites:

- you need an Apple Developer account, contact someone from your team to get it
- go to https://developer.apple.com/account/resources/certificates/list and download a Developer ID Application certificate; once you download the certificate open it to add it to your key chain
- go to https://appleid.apple.com/account/manage and create an app-specific password
- create a `packages/autopilot/.env` and fill in necessary data (use `.env.example` as a guide)
    - for `APPLE_ID` use your UBIO membership email
    - for `APPLE_ID_PASSWORD` use app-specific password

With everything set up run `npm run ap:release` in project root.

Note: you should only do that after bumping to new version, see `npm run release` above).

- This will generate packages for Mac, Windows, Linux
- For Mac the package will be signed and notarized (note: this step takes considerable time!)
- Finally, the generated artefacts will be uploaded to GitHub releases.

Once the files are uploaded to GitHub releases:

- go to https://github.com/automationcloud/autopilot/releases
- locate a draft release
- fill in the release name (note: seems like removing `v` is mandatory, so that only version number stays) and (optionally) release notes
- click "Publish release"

### Building worker Docker image locally

Docker requires `NPM_TOKEN` environment variable in order to build with private dependencies.

## Contribution Guidelines

### Commits

This repository uses [Conventional Commits](https://www.conventionalcommits.org/). When making pull requests you should either:

- rebase your commits to squash or remove unwanted commits, and rephrase the commits to conform to Conventional Commits guidelines
- OR squash the PR, providing conventional commit message for the generated commit

The commonly used commit types are:

- `chore:` corresponds to all kinds of code quality or preparational work (yes, we do expect a lot of chores as part of feature delivery). Examples:
    - extract common functionality into private method
    - rename private method or local variable
    - rename/move file without changing package-level exports
    - add/remove/change tests
    - amend code style
    - fix typos in comments or docs
    - configure build tools
    - configure build infrastructure (e.g. CI workflows)
- `feat:` corresponds to any kind of feature, either code-level, API-level, user-facing, etc. Examples:
    - new public class
    - new public method
    - new method parameter
    - new button in UI
- `fix:` designates correcting components that were previously not functioning as intended.

The `BREAKING CHANGE:` footer must be added if functionality which is not directly backwards compatible. Typical examples include renaming public classes/field/methods (from components that are not considered internal-only) or changing the semantics of their behaviour.

### Changelog

[Changelog](CHANGELOG.md) lists high level changes that may affect users. It is perfectly valid to make a release without adding to changelogs, but if end users need to be aware of some changes, you should concisely announce them.

To contribute to changelog:

- after the branch is merged to `main`, prior to releasing, add your entries to the top of the [CHANGELOG.md](CHANGELOG.md)
- the `npm run release` script will automatically add the version number you're releasing if there are unversioned entries at the top

## Troubleshooting

- Running tests and/or Autopilot fails with `Cannot find module out/grammars/...`

    If you've cleaned compiled artefacts, run `npm run compile` prior to `npm run dev`.
    Aside from compiling TypeScript, this will also include other compilation steps
    in submodules.
