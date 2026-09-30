# AGENTS.md

Vue 3 admin + low-code configuration platform (`iview-admin-pro` v3.0.0, "赢科项目配置平台").
Vue CLI 5 / webpack 5, Vuex 4, vue-router 4, View UI Plus, Less. Source comments are Chinese.

## Version control: SVN + git coexist

This working copy is **both** an SVN checkout (`.svn/`) and a local git repository (`.git/`); both
must keep working. git is **local-only** (no remote) and used for local history; SVN remains the
shared source of truth. Expect the same edit to show up in both systems.

- `.gitignore` excludes `node_modules/`, `dist/`, `.svn/`, and logs. That ignores those paths **on the
  git side only** — SVN needs its own `svn:ignore` on the repo root for `.git`, `node_modules`,
  `dist`, or `svn status` gets flooded (`node_modules` is hundreds of MB).
- `core.autocrlf` is deliberately **`false`** for this repo so git never rewrites line endings in the
  working tree. The Windows default `true` rewrites LF→CRLF on any `git checkout`/`reset`, after which
  SVN reports those versioned files as modified. Do not re-enable.
- The `lint-staged` block in `package.json` is inert (no git hooks are installed).

## Commands

- Package manager: `npm run <script>` and `yarn run <script>` both work; a `yarn.lock` **is**
  committed. `docs/DEPENDENCIES.md`'s "npm only, never introduce `yarn.lock`" rule is stale (that file
  also references a committed lockfile and a `tests/e2e/` + `playwright.config.js` that do not exist).
- `npm run serve` — dev server on **port 8083** (`--open`). Proxies `/api` → `192.168.2.101:28009`
  with `pathRewrite` stripping `/api` (other targets are commented out in `vue.config.js:187-220`).
  Change the target there to point at a different backend, not in request code.
- `npm run build` — outputs `dist/`. **Do not run it.** Build-based verification is **forbidden** in
  this repo (see the "Build: forbidden" section below) — including after dependency or
  webpack-config changes.
- `npm run lint` — `vue-cli-service lint --fix`. **Do not run it.** ESLint and every other
  formatting/lint validation are **forbidden** in this repo — see the "Formatting & lint: forbidden"
  section below.
- `npm run test:unit` — **not usable.** `jest.config.js` references `vue-jest`,
  `jest-transform-stub`, and `jest-serializer-vue`, none of which are installed, and `tests/unit/`
  contains only `.eslintrc.js`. There is no unit or e2e suite; do not report tests as passing.

## Formatting & lint: forbidden

**Do not run, enable, add, or rely on any formatting or lint validation — ESLint included.** This
is a hard rule for every agent and every contributor.

Forbidden, without exception:

- Running `npm run lint` / `vue-cli-service lint` (with or without `--fix`), or any `eslint`,
  `prettier`, `stylelint`, or formatter command.
- Adding lint/format tooling: ESLint/Prettier/Stylelint configs, plugins, devDependencies, npm
  scripts, pre-commit hooks, or CI steps that check formatting.
- Reporting lint or formatting violations as findings, and editing files for style reasons only
  (reindent, reorder imports, add/remove semicolons, wrap lines, "fix" quotes).

Rationale: the repo deliberately disables lint-on-save (`lintOnSave: false` in `src/setting.env.js`)
and the `lint-staged` block in `package.json` is inert (no git hooks are installed). Automated
formatting is pure noise here and, worse, it rewrites whole files and can flip line endings — which
pollutes **both** SVN and git and breaks the SVN + git coexistence this repo depends on.

- **Code style is inherited by reading the surrounding code.** That is the only style authority.
- **The existing `.eslintrc` / eslint config is kept as-is and must not be deleted or modified.**
  It documents the historic style (`plugin:vue/essential` + `@vue/standard`) but is never enforced.
- **`npm run build` is not lint, but it is equally forbidden for verification** — it does not invoke
  ESLint while `lintOnSave` is `false`, yet agents must not run it either. See the "Build: forbidden"
  section below.

## Build: forbidden

**Do not run `npm run build` (or `yarn run build`, or any production/CI build) to verify changes.**
This is a hard rule for every agent, in the same spirit as the lint prohibition above.

Forbidden, without exception:

- Running `npm run build` as a verification step after code or config changes.
- Reporting a build (successful or failed) as evidence that a change is correct.
- Adding build steps to agent workflows, scripts, hooks, or CI for verification purposes.

Rationale: a full build takes minutes, rewrites the whole `dist/` tree, and churns thousands of files
in a working copy that is **both** an SVN checkout and a git repo — polluting `svn status` and local
git history for no reviewable benefit. It also does not catch the mistakes agents actually make here
(wrong route paths/names, wrong API wrapper, wrong field or event names), which reading the code does
catch.

Instead, verify by:

- **Reading** the changed files together with what they integrate with (routes, API wrappers, sibling
  pages, reference implementations such as `src/pages/project/ai/provider/README.md`).
- **Checking contracts**: route paths/names, `props`/`emits`, event names, request payloads.
- Leaving `npm run serve` / `npm run build` to the user unless they explicitly ask for it.

## Architecture: backend-driven, not file-driven

This is the single most important thing to understand. Routes, menus, and pages are delivered by the
backend at runtime, so most UI work is *not* "add a route + a page".

- Menus/routes come from the backend menu table (`T_XT_QXB`); `fwlx` decides placement: `ht` →
  child of the admin layout, `qt` → front-end layout, `kjw` → top-level. Components are resolved as
  `@/pages` + the menu's `zjurl` field (`src/router/index.js:25`).
- Restored routes are cached **AES-encrypted in `localStorage`** and re-added on the first navigation
  guard (`restoreDynamicRoutes`, `src/router/index.js:90`). Permission checks live inline in
  `router.beforeEach`.
- All data access goes through `commonsJs.incoRequest(type, sqlid, param)` →
  `/inco/ht/{add,upd,del,queryOne,queryList,queryListByPage}` with an AES-encrypted `param`
  (`src/api/common.js:64`). `commonsJs.multiquery([{sqlid, blm, type, param}])` batches them and
  keys results by `blm` (`src/api/common.js:199`).
- `commonsJs.getzjpzxx(id, type)` loads JSON page/component config (backend, or encrypted static JSON).
  Screens are rendered by the JSON-driven components under `src/components/commonComponent/`
  (`incocomponent`, `newpage`, `renderpage`, `jtable`, `jform`, `jlist`, `jtab`).
- Boot order matters: `src/main.js` awaits remote config → `initSetting()` → rebuilds menus → *then*
  `useSharedApp(app)` and `app.mount('#app')` (`src/main.js:56-85`).
- **Reference implementations** (read these before building a new module):
  `src/pages/project/ai/provider/README.md` is the canonical example of the SQL-driven CRUD module
  pattern plus how to register its menu items.
- AI routes are temporarily hardcoded in `src/router/routes.js:35-133`; the comment there says they
  should become backend menus. `src/pages/project/ruleEngine/index.js` exports routes that nothing
  imports — treat it as unwired.

## Globals an agent will get wrong

- `commonsJs` is the global name for the entire `src/api/common.js` (~3000-line grab-bag, axios
  wrappers + business helpers + re-exports). There is **no `$api`**.
- The event bus is **`$Bus`** (capital B, `mitt`) — there is no `$bus`.
- `window.$t` / `i18n.global.t`: i18n uses `legacy: false`, so Composition API semantics.
- `$root.*` holds process-wide low-code state (`components`, `componentRefs`, `function`, `tempdata`,
  ...), set up in `src/App.vue`. Changing it affects mounted sub-apps.
- `app.config.warnHandler` (`src/plugins/shared/sharedApp.js`) **silently suppresses** several Vue
  warnings — absence of a warning does not mean the code is correct.
- `v-auth` directive gates elements by `store.state.admin.user.info.access`.

## Vuex

Only the `admin` root module is registered. Every file in `src/store/modules/admin/modules/` is
auto-loaded via `require.context` and namespaced, so commit/dispatch as
`admin/<module>/<action>` (e.g. `admin/page/open`, `admin/layout/updateLayoutSetting`).
Local persistence goes through the `admin/db` module.

## Conventions

- **Style is inherited by reading nearby code, never by tooling.** The historic ESLint preset
  (`plugin:vue/essential` + `@vue/standard`) is documentation only: **4-space indent in `.vue`
  `<script>` blocks**, no semicolons. It is **never enforced and must never be run or extended** —
  see the "Formatting & lint: forbidden" section.
- Avoid `console.log` in shipping code. (`no-console` was an error under `NODE_ENV=production` in
  the historic lint config; it is now a convention, not an automated check.)
- Write comments in Chinese to match the codebase.

## Gotchas

- Do not edit `src/libs/iview-pro/` — a vendored, un-transpiled fork explicitly excluded from Babel
  (`vue.config.js:233`). Only its CSS is imported; the bundled `.min.js` is unused.
- `unplugin-auto-import` and `unplugin-vue-components` are in `package.json` but **never wired**
  (absent from `vue.config.js`/`babel.config.js`). Write explicit imports.
- Tailwind is configured (`tailwind.config.js`, `postcss.config.js`) but no `@tailwind` directives are
  imported by the global stylesheet, so utility classes are effectively inert. Do not rely on them.
- `vue.config.js` declares `plugins` **twice** inside `configureWebpack` (lines 55 and 101). JS keeps
  the last key, so the first array — `ProvidePlugin` for `Buffer`/`process` — is shadowed. Edit the
  second array if you are adding a plugin.
- Build-time `string-replace-loader` rewrites source strings (`.cookie=` → `.cookie = `, strips
  email-like tokens). These look like typos but are deliberate; do not "clean them up".
- Node core polyfills are declared in `vue.config.js` `resolve.fallback` + `ProvidePlugin`. A new
  dependency that needs `crypto`/`stream`/`path`/etc. will fail to build until a fallback is added.
- Dev server sets `compress: false` deliberately so SSE (`/ai/llm/chat/stream`) streams incrementally.
  Do not re-enable compression.
- `patch-package` runs on `postinstall` but there is no `patches/` directory.
- Undeclared-but-working imports rely on hoisted transitive copies:
  `src/store/modules/admin/modules/apichat.js` imports `lodash`, and `postcss.config.js` uses
  `autoprefixer` — neither is in `package.json`. Prefer declaring any new dependency explicitly.

## Docs

- `docs/DEPENDENCIES.md` — per-package rationale, plus hard-won dependency-cleanup lessons
  (e.g. `xe-utils` is a phantom dependency of `vxe-table` and must not be removed; `depcheck` misses
  string references in `vue.config.js`). Two claims there are stale: it says `@vxe-ui/core` and
  `dom-zindex` are provided transitively, but `vxe-table@4.22.1` declares **no** `dependencies`/
  `peerDependencies` yet imports both — they are now explicit dependencies; and it references a
  `tests/e2e/` + `playwright.config.js` that do not exist.
- `src/pages/project/ai/provider/README.md` — module pattern, SQL/menu registration, key-encryption
  contract.
