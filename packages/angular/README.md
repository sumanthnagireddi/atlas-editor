# @sumanthnagireddi/atlas-angular

Angular standalone wrappers for the Atlas Atlaskit editor and side navigation runtimes.

The npm package includes the runtime loaders it needs, so Angular consumers do not need a separate hosted bundle URL for the normal path.

## Install

```bash
npm install @sumanthnagireddi/atlas-angular
```

## Public exports

Import the standalone components directly from the package root:

```ts
import {
  AtlaskitEditorComponent,
  AtlaskitSideNavComponent,
  type AtlasEditorPage,
  type AtlasSideNavModel,
} from '@sumanthnagireddi/atlas-angular';
```

These are real Angular standalone component classes, so they can be used directly inside a standalone consumer component `imports` array.

## Angular standalone usage

```ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  AtlaskitEditorComponent,
  AtlaskitSideNavComponent,
  type AtlasEditorPage,
  type AtlasSideNavModel,
} from '@sumanthnagireddi/atlas-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AtlaskitEditorComponent, AtlaskitSideNavComponent],
  template: `
    <app-atlaskit-side-nav
      [model]="sideNavModel"
      [darkMode]="true">
    </app-atlaskit-side-nav>

    <app-atlaskit-editor
      [value]="document"
      [page]="page"
      [darkMode]="true"
      [mode]="'editor'">
    </app-atlaskit-editor>
  `,
})
export class AppComponent {
  document = {
    version: 1 as const,
    type: 'doc' as const,
    content: [],
  };

  page: AtlasEditorPage = {
    title: 'Untitled page',
  };

  sideNavModel: AtlasSideNavModel = {
    label: 'Navigation',
    sections: [],
  };
}
```

## Selectors

- `app-atlaskit-editor`
- `app-atlaskit-side-nav`

Compatibility aliases are also available:

- `app-atlaskit-editor-host`
- `app-atlaskit-side-nav-host`

## Runtime bundle loading

By default, the wrappers load the packaged runtime bundle from inside `@sumanthnagireddi/atlas-angular` itself.

That means a normal Angular npm install does not need `assetBaseUrl` at all.

## Optional runtime override

If you want to override the packaged runtime and self-host the loaders yourself, pass the **folder URL** to `assetBaseUrl`, not the individual loader file.

Example:

```ts
bundleBaseUrl = 'https://sumanthnagireddi.github.io/atlas-editor/web-components';
```

The wrappers append the loader filenames internally:

- editor wrapper -> `/atlas-editor.js`
- side nav wrapper -> `/atlas-side-nav.js`

Those loader files then load the runtime entrypoints relative to themselves:

- `atlas-editor.js` -> `./atlaskit-editor/atlas-atlaskit-editor.js`
- `atlas-side-nav.js` -> `./atlaskit-navigation/atlas-atlaskit-navigation.js`

If you self-host the runtime assets instead, point `assetBaseUrl` at your own folder containing that same layout.
