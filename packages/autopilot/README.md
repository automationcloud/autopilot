# Welcome to Autopilot!

## Project structure

- [src/main](src/main) — entry point of main process; it creates an [application window](static/index.html)

- [src/app](src/app) — entry point of redenderer application, which has mixed Node.js and Browser runtime, bundled with webpack; the majority of app logic is implemented here

## Styling

We follow naming convention for CSS class names inspired by BEM:

```
.block__element--modifier
.long-block-name__long-element-name--long-modifier-name
.block--modifier
```

- `block` should match given component's root level semantics
- `element` is optional
- `modifier` is optional, describes modifications of element or block (e.g `active`)

Notes:

- Typically `block` matches Vue component name (e.g. `.tree-view`
  is a root element of `tree-view.vue`). Such component-scoped classes should
  never be used outside the component file.

- Reusable blocks like `.button` or `.input` can occur in multiple components,
  they should be declared in `stylesheets/components`.

- If multiple components are tightly coupled, they should still use different
  block names (see `sb.vue` and `sb-node.vue` as an example). Tight coupling,
  however, should be avoided whenever possible (see `player.vue` and
  `status.vue` as an example).

- Refer to official BEM documentation for general guidelines.

### Variables

All variables are globally declared in `stylesheets/variables.styl` using
CSS3 variables syntax. Local variables in component files indicate WIP
and should be either inlined into the component itself, or extracted into
global variables.

CSS variables use similar approach to naming. Due to the nature of variables
and their inherent reusability, the `block` part typically refers to a common
trait or namespace described by a set of variables:

```
--font__family
--font-family--mono
--font__weight
--font__size
--font__size--mono
--font__line-height--mono
```

In other words, the `block` part of CSS variable name doesn't have to correspond
to any of classnames, blocks or components.

The `element` part of CSS variable should also include CSS property:

```
--dom-tagname-color
```

Note: introducing a variable requires some analysis. If unsure, it's best to
keep them inlined or add to the Inbox section of `variables.styl`.

## Vue Guidelines

To keep UI bundle size lows we refrain from using `require`
and instead just import stuff exposed by `src/app/index.js`.

Most of the time the imports section of a component looks like this:

```js
const {
    workspace,
} = window.domains;
```

1. Keep component members in following order:

    - components
    - props
    - data
    - mounted
    - destroyed
    - watch
    - computed
    - methods

2. Keep `components` sorted alphabetically

3. Prefer `props` with types

4. Avoid using `{};:` in Stylus stylesheets

5. Do not put block/element styles in Vue component
   which do not belong to the component's block, instead:

    - either put it in `inbox.styl` and have it sorted out later
    - put it into `stylesheets/components/` if it factors nicely as a standalone block
    - factor out new Vue component and put it there
