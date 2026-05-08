# Atlas Angular Integration Guide

This repo ships two Atlaskit-based UI runtimes:

- an editor
- a side navigation

They are implemented with React internally, but the recommended consumer API is Angular.

The Angular app should use these wrapper components:

```html
<app-atlaskit-editor></app-atlaskit-editor>
<app-atlaskit-side-nav></app-atlaskit-side-nav>
```

Those wrappers lazy-load the generated web-component bundles for you, so the consumer app does not need to manage React directly.

## Recommended distribution model

The Angular-first package in this repo is now:

```text
@sumanthnagireddi/atlas-angular
```

That package is the recommended consumer entrypoint.

It gives Angular teams:

1. Angular components as the public API
2. React kept internal
3. packaged runtime loading by default
4. an `assetBaseUrl` escape hatch when you want to self-host or override the runtime assets

## What gets built

Running the workspace build produces this folder:

```text
dist/web-components/
  atlas-editor.js
  atlas-side-nav.js
  atlaskit-editor/
    atlas-atlaskit-editor.js
    atlas-atlaskit-editor.css
    ...many chunk files...
  atlaskit-navigation/
    atlas-atlaskit-navigation.js
    atlas-atlaskit-navigation.css
    ...many chunk files...
```

Important: keep the full folder structure intact. Do not publish only the top-level `atlas-editor.js` or `atlas-side-nav.js` files.

## Build the bundle

From this repo:

```bash
npm ci
npm run build
```

If you only need the standalone bundle output:

```bash
npm run build:bundle
```

If you only need the Angular wrapper package output:

```bash
npm run build:angular-lib
```

## Recommended integration model

This is the supported Angular-first approach:

1. build and publish `@sumanthnagireddi/atlas-angular`
2. install that package in the consumer Angular app
3. use the Angular components directly
4. let the wrappers load the packaged runtime automatically

You do not need to:

- copy wrapper files into the consumer app
- add `<script>` tags to `index.html`
- manage React directly

## Publish or consume the Angular package

The package source lives here:

- [C:\Users\HP\Desktop\code\atlas-editor\packages\angular](C:\Users\HP\Desktop\code\atlas-editor\packages\angular)

Build it with:

```bash
npm run build:angular-lib
```

That produces:

```text
packages/angular/dist/
  public-api.js
  public-api.d.ts
  lib/
    atlaskit-editor.component.js
    atlaskit-editor.component.d.ts
    atlaskit-side-nav.component.js
    atlaskit-side-nav.component.d.ts
```

If you want to publish to npm, publish the `@sumanthnagireddi/atlas-angular` package from `packages/angular`.

If you want to consume it before publishing, you can install it from a packed tarball or a git dependency after building it.

CI also publishes the Angular package automatically after the main workspace build passes on pushes to `master` or `main`.

To make that work in GitHub Actions, configure:

- `NPM_TOKEN` as a repository secret with publish permission for npm

The publish job checks whether the current `packages/angular/package.json` version already exists on npm. If it does, the workflow skips publish cleanly, so version bumps are what trigger new package releases.

## Wrapper selectors

The wrappers support both selector styles:

- editor:
  - `app-atlaskit-editor`
  - `app-atlaskit-editor-host`
- side nav:
  - `app-atlaskit-side-nav`
  - `app-atlaskit-side-nav-host`

For new consumers, prefer:

- `app-atlaskit-editor`
- `app-atlaskit-side-nav`

## Angular import surface

In the consumer app, import from `@sumanthnagireddi/atlas-angular`:

```ts
import {
  AtlaskitEditorComponent,
  AtlaskitSideNavComponent
} from '@sumanthnagireddi/atlas-angular';
```

These are exported as real standalone Angular component classes, so they can be used directly in:

```ts
imports: [CommonModule, AtlaskitEditorComponent, AtlaskitSideNavComponent]
```

## Ready-to-paste Angular consumer page

This is the recommended standalone Angular usage pattern.

```ts
import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import {
  AtlaskitEditorComponent,
  AtlaskitSideNavComponent,
  type ADFDoc,
  type AtlasEditorPage,
  type AtlasSideNavModel
} from '@sumanthnagireddi/atlas-angular';

@Component({
  selector: 'app-atlas-consumer-page',
  standalone: true,
  imports: [CommonModule, AtlaskitEditorComponent, AtlaskitSideNavComponent],
  template: `
    <div class="shell">
      <aside class="shell__nav">
        <app-atlaskit-side-nav
          [model]="model()"
          [darkMode]="darkMode()"
          (ready)="handleNavReady()"
          (itemInvoke)="handleItemInvoke($event)"
          (actionInvoke)="handleActionInvoke($event)"
          (expandChange)="handleExpandChange($event)"
          (flyoutOpenChange)="handleFlyoutOpenChange($event)">
        </app-atlaskit-side-nav>
      </aside>

      <main class="shell__content">
        <app-atlaskit-editor
          [value]="document()"
          [page]="page()"
          [readOnly]="readOnly()"
          [mode]="mode()"
          [darkMode]="darkMode()"
          [debounceMs]="debounceMs()"
          [placeholder]="placeholder()"
          (valueChange)="handleValueChange($event)"
          (change)="handleChange($event)"
          (pageChange)="handlePageChange($event)"
          (pageSubmit)="handlePageSubmit($event)"
          (pageCancel)="handlePageCancel($event)"
          (editModeChange)="handleEditModeChange($event)"
          (ready)="handleEditorReady()"
          (editorError)="handleEditorError($event)">
        </app-atlaskit-editor>
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: #101214;
      }

      .shell {
        display: grid;
        grid-template-columns: 320px minmax(0, 1fr);
        min-height: 100vh;
      }

      .shell__nav {
        min-width: 0;
        border-right: 1px solid rgba(255, 255, 255, 0.08);
      }

      .shell__content {
        min-width: 0;
      }
    `
  ]
})
export class AtlasConsumerPageComponent {
  readonly darkMode = signal(true);
  readonly readOnly = signal(false);
  readonly mode = signal<'editor' | 'renderer'>('editor');
  readonly debounceMs = signal(250);
  readonly placeholder = signal('Give this page a title...');

  readonly document = signal<ADFDoc>({
    version: 1,
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Hello from another Angular app.' }]
      }
    ]
  });

  readonly page = signal<AtlasEditorPage>({
    title: 'OSI (Open Systems Interconnection)',
    authorName: 'Sumanth',
    authorInitials: 'S',
    updatedText: 'Updated 1h ago',
    metaItems: ['5 min', 'See views', 'Add a reaction'],
    statusText: 'Verified',
    statusAppearance: 'success',
    widthMode: 'centered',
    titleAlignment: 'left'
  });

  readonly model = signal<AtlasSideNavModel>({
    label: 'Workspace navigation',
    header: {
      title: 'Atlas workspace',
      description: 'Angular consumer app',
      icon: 'apps'
    },
    sections: [
      {
        id: 'primary',
        title: 'Main',
        items: [
          {
            id: 'home',
            kind: 'link',
            label: 'Home',
            href: '/home',
            icon: 'home',
            isSelected: true
          },
          {
            id: 'create-page',
            kind: 'button',
            label: 'Create page',
            icon: 'add'
          },
          {
            id: 'projects',
            kind: 'expandable',
            variant: 'button',
            label: 'Projects',
            icon: 'project',
            isOpen: true,
            children: [
              {
                id: 'kanban',
                kind: 'link',
                label: 'My Kanban Project',
                description: 'Board',
                href: '/projects/kanban',
                icon: 'board'
              },
              {
                id: 'analytics',
                kind: 'link',
                label: 'Analytics workspace',
                description: 'Dashboard',
                href: '/projects/analytics',
                icon: 'dashboard'
              }
            ]
          },
          {
            id: 'recent',
            kind: 'flyout',
            label: 'Recent',
            icon: 'recent',
            flyout: {
              title: 'Recent',
              searchPlaceholder: 'Search recent items',
              footerLabel: 'View all recent items',
              sections: [
                {
                  id: 'recent-this-week',
                  title: 'This week',
                  items: [
                    {
                      id: 'kanban-recent',
                      kind: 'link',
                      label: 'My Kanban Project',
                      description: '5 days ago',
                      href: '/recent/kanban',
                      icon: 'board'
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    ]
  });

  handleValueChange(nextDoc: ADFDoc): void {
    this.document.set(nextDoc);
  }

  handleChange(nextDoc: ADFDoc): void {
    console.log('Editor change', nextDoc);
  }

  handlePageChange(nextPage: AtlasEditorPage): void {
    this.page.set(nextPage);
  }

  handlePageSubmit(payload: unknown): void {
    console.log('Page submit', payload);
  }

  handlePageCancel(payload: unknown): void {
    console.log('Page cancel', payload);
  }

  handleEditModeChange(isEditing: boolean): void {
    console.log('Edit mode', isEditing);
  }

  handleEditorReady(): void {
    console.log('Editor ready');
  }

  handleEditorError(error: unknown): void {
    console.error('Editor error', error);
  }

  handleNavReady(): void {
    console.log('Side nav ready');
  }

  handleItemInvoke(detail: unknown): void {
    console.log('Item invoke', detail);
  }

  handleActionInvoke(detail: unknown): void {
    console.log('Action invoke', detail);
  }

  handleExpandChange(detail: unknown): void {
    console.log('Expand change', detail);
  }

  handleFlyoutOpenChange(detail: unknown): void {
    console.log('Flyout open change', detail);
  }
}
```

## Inputs and outputs

### `app-atlaskit-editor` inputs

- `assetBaseUrl`
- `value`
- `page`
- `readOnly`
- `mode`
- `darkMode`
- `debounceMs`
- `placeholder`

### `app-atlaskit-editor` outputs

- `valueChange`
- `change`
- `pageChange`
- `pageSubmit`
- `pageCancel`
- `editModeChange`
- `ready`
- `editorError`

### `app-atlaskit-side-nav` inputs

- `assetBaseUrl`
- `model`
- `darkMode`

### `app-atlaskit-side-nav` outputs

- `itemInvoke`
- `actionInvoke`
- `expandChange`
- `flyoutOpenChange`
- `ready`
- `sideNavError`

## Default runtime location

`@sumanthnagireddi/atlas-angular` defaults to the packaged runtime bundle that ships inside the npm library itself.

That means the simplest Angular consumer often does not need to pass `assetBaseUrl` at all.

If you want to override the runtime location, pass the folder URL, not an individual loader file. Internally:

- editor wrapper loads `atlas-editor.js`
- side-nav wrapper loads `atlas-side-nav.js`
- `atlas-editor.js` loads `./atlaskit-editor/atlas-atlaskit-editor.js`
- `atlas-side-nav.js` loads `./atlaskit-navigation/atlas-atlaskit-navigation.js`

If you want to be explicit, or you want to swap environments, pass your base URL to:

- `[assetBaseUrl]` on `app-atlaskit-editor`
- `[assetBaseUrl]` on `app-atlaskit-side-nav`

No `index.html` script tags are required in either mode.

## Self-hosting the runtime bundle

If you prefer to host the runtime assets yourself, copy:

- [C:\Users\HP\Desktop\code\atlas-editor\dist\web-components](C:\Users\HP\Desktop\code\atlas-editor\dist\web-components)

into your own static hosting path and point `assetBaseUrl` there, for example:

```ts
bundleBaseUrl = '/assets/atlas';
```

## Dynamic data compatibility

The wrappers are built to support both:

- initial object input
- later updates from Angular state

For the side nav specifically, the wrapper also handles in-place JSON mutations by fingerprinting the model during Angular change detection. That means both of these patterns are supported:

```ts
this.model.set(nextModel);
```

and:

```ts
const current = this.model();
current.sections[0].items.push({
  id: 'new-item',
  kind: 'link',
  label: 'New item',
  href: '/new-item',
  icon: 'page'
});
```

As long as Angular change detection runs, the wrapper will push the updated model into the runtime.

## Editor page-shell behavior

When a `page` object is provided, the editor renders in the Confluence-style page shell:

- top metadata row
- title area
- view mode with `Edit`
- edit mode with page controls
- emitted page updates back to the consumer

The consumer remains responsible for:

- providing the initial page metadata
- storing updated ADF
- storing submitted page metadata
- deciding what to do with `pageSubmit`

## Raw web-component fallback

Only use this section if you do not want the Angular wrappers.

You can still load the generated custom elements directly:

```html
<script type="module" src="https://sumanthnagireddi.github.io/atlas-editor/web-components/atlas-editor.js"></script>
<script type="module" src="https://sumanthnagireddi.github.io/atlas-editor/web-components/atlas-side-nav.js"></script>

<atlas-editor></atlas-editor>
<atlas-side-nav></atlas-side-nav>
```

Then assign object data as element properties:

```ts
const editor = document.querySelector('atlas-editor');
const sideNav = document.querySelector('atlas-side-nav');

editor.value = doc;
editor.page = page;
editor.darkMode = true;

sideNav.model = sideNavModel;
sideNav.darkMode = true;
```

For Angular consumers, this is a fallback only. The wrapper path above is the preferred integration model.

## Local testing

In this repo:

```bash
npm ci
npm run build
npm run start
```

If the consumer app still shows stale behavior after a bundle update:

1. rebuild the bundle
2. restart `ng serve`
3. hard refresh the browser

This matters because the Angular wrappers load generated runtime assets from `assetBaseUrl`.

## Troubleshooting

### The editor never leaves the loading state

Check that the full runtime folder exists under the same base URL:

```text
<assetBaseUrl>/atlas-editor.js
<assetBaseUrl>/atlaskit-editor/...
```

If you are using the side nav too:

```text
<assetBaseUrl>/atlas-side-nav.js
<assetBaseUrl>/atlaskit-navigation/...
```

### My ADF does not render

Pass a valid ADF `doc` object into `[value]`, for example:

```json
{
  "version": 1,
  "type": "doc",
  "content": []
}
```

Do not pass HTML and expect automatic conversion.

### Dark mode looks wrong

Set:

```ts
darkMode = true;
```

and avoid global CSS overrides that restyle Atlaskit internals.

### Local `npm ci` fails on Windows with `EPERM` around `esbuild.exe`

That usually means a local process is still holding `node_modules/@esbuild/win32-x64/esbuild.exe` open. This does not indicate a broken CI dependency graph by itself. Close running dev processes and retry locally.

## Files in this repo that matter

- Angular package entrypoint: [C:\Users\HP\Desktop\code\atlas-editor\packages\angular\src\public-api.ts](C:\Users\HP\Desktop\code\atlas-editor\packages\angular\src\public-api.ts)
- editor wrapper source: [C:\Users\HP\Desktop\code\atlas-editor\packages\angular\src\lib\atlaskit-editor.component.ts](C:\Users\HP\Desktop\code\atlas-editor\packages\angular\src\lib\atlaskit-editor.component.ts)
- side-nav wrapper source: [C:\Users\HP\Desktop\code\atlas-editor\packages\angular\src\lib\atlaskit-side-nav.component.ts](C:\Users\HP\Desktop\code\atlas-editor\packages\angular\src\lib\atlaskit-side-nav.component.ts)
- generated assets: [C:\Users\HP\Desktop\code\atlas-editor\dist\web-components](C:\Users\HP\Desktop\code\atlas-editor\dist\web-components)
- bundle builder: [C:\Users\HP\Desktop\code\atlas-editor\scripts\build-web-components.mjs](C:\Users\HP\Desktop\code\atlas-editor\scripts\build-web-components.mjs)
