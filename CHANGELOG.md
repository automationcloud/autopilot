## 29.6.0

- feat(autopilot): allow publishing extensions via Autopilot

## 29.5.0

- fix(autopilot): HTML snapshots loading
- fix(autopilot): recorded actions produced unresolved pipelines
- feat(engine): framework for managing extension services
- feat(engine): test rig for testing extensions

## 29.3.0-GA

- feat(autopilot): new signin UI
- feat(engine): use keycloak auth when communicate with api

## 29.0.2

- BREAKING CHANGE: scripts authored with Autopilot versions prior to 28.0.0 are no longer supported
- feat(engine): standardize core APIs

## 28.0.0

- feat(enigne): new naming scheme for Actions and Pipes

## 27.8.1

- chore: rename `Ctx` to `RuntimeCtx`
- fix(autopilot): `node_modules` inside dev extensions need to be symlinked to Autopilot

## 27.7.0

- fix(autopilot): settings manager not updating settings
- fix(autopilot): HMTL snapshot loading broken
- fix(autopilot): extensions are always loaded in a predictable order

## 27.6.1

- fix(autopilot): `output` and `dynamic-output` actions validate preview objects properly

## 27.4.5

- fix(autopilot): make api key optional when setting up autopilot for the first time

## 27.4.3

- feat(engine): make FetchService available to scripting
- fix(autopilot): fix recordset params editing

## 27.4.0

- feat(autopilot): zoom support
- feat(autopilot): action UI is dynamically generated

## 27.1.0

- feat(autopilot): introduce smart compose

## 27.0.0

- feat: Custom Pipe feature is removed (backwards compatibility maintained)

## 25.8.0

- feat(engine): `pan-exchange` supports multiple pan tokens

## 25.5.0

- feat(engine): parse arabic numbers pipe

## 25.4.0

- feat(autopilot): frequent used items available when adding actions and pipes

## 25.3.0

- feat(engine): dynamic parts of input and otuput keys are now hashed

## 25.2.0

- feat(worker): new options introduced for controlling granularity of screenshots and html snapshots

## 25.1.5-GA

- fix(autopilot): make output preview visible

## 25.1.4

- fix(engine): `dataset-predict` did not enter children after running

## 25.1.3-GA

- feat(autopilot): update matchers and definitions UI to look more visually distinct from actions

## 25.1.0

- feat(autopilot): add breakpoints functionality

## 23.4.1

- feat(engine): replace globs with regular expressions, Match Glob removed

## 23.3.0

- feat(engine): `download-file` action dropped
- feat(autopilot): "Play context" button no longer disabled when no action is selected
- feat(engine): add "Peek input" pipe
- feat(engine): coordinates are calculated respecting page zoom

## 23.0.0

- BREAKING CHANGE(engine): remove blacklisted contexts from `3ds-wrapper` action; 3dsecure handling now configured in contexts

## 22.29.0

- feat(engine): add `<checkpoint>` context which runs in checkpoint-enabled executions, after checkpoint is restored

## 22.28.0

- feat(engine): add support for Persian and Arabic numbers in price parsing
- fix(autopilot): `pan-exchange` action is disabled by default, unless PAN Exchange mocking is explicitly disabled in configuration

## 22.27.2

- fix(autopilot): copy `send-network-request` action as cURL was missing single quotes around urls and headers

## 22.27.0

- feat(engine): `pan-exchange` has new `alpex` mode

## 22.26.0

- feat(autopilot): highlight recently added context in 3dsecure-wrapper action

## 22.25.0

- feat(engine): add "Remove duplicates" option to `dataset-insert`
- feat(autopilot): copy `send-network-request` action as cURL
- feat(autopilot): add information about loaded script version

## 22.23.0

- feat(autopilot): show profile icon when multiple profiles are open

## 22.22.5

- fix(autopilot): custom pipes were incorrectly reporting "modified locally"
- feat: add ability to copy/paste blocked URL patterns
- feat: add ability to create blocked URL patterns based on existing network activity
- fix(engine): send-network-request was failing http (non-https) requests via Node.js + proxy
- feat(autopilot): allow selecting proxy tags in proxy switching UI

## 22.19.0

- feat(engine): `input-file` supports "renaming" a blob by rewriting `filename` field.

## 22.16.0

- feat(autopilot): add debugging capabilities around `pan-exchange` action
- feat(worker): use new Proxies API

## 22.13.1

- feat(autopilot): add "Copy as JSON" and "Copy as CSV" to pipeline outcomes UI

## 22.13.0

- fix: matching airports by name improved

## 22.12.0

- feat: add `delay` option to Input Text aciton
- fix: numerous issues around connecting to upstream proxies
- feat: add support for Saudi Real price currency

## 22.10.0-GA

- misc: initial release for Supported Automation
