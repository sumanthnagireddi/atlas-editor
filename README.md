# Atlas Web Components Integration Guide

This repo builds two Atlaskit-based web components:

```html
<atlas-editor></atlas-editor>
<atlas-side-nav></atlas-side-nav>
```

The goal of this README is to show how to use them in another Angular app, either by:

- loading the published web-component bundles directly, or
- copying the Angular host wrappers from this repo and letting those wrappers lazy-load the runtime assets for you

## What gets built

Running the workspace build creates a web-component bundle in:

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

`atlas-editor.js` and `atlas-side-nav.js` are the browser bootstrap files. They register the custom elements and then lazy-load the actual code from the sibling `atlaskit-editor/` and `atlaskit-navigation/` folders.

Important: you must publish the whole `dist/web-components` folder, not just the top-level loader files.

## Build the bundle

From this repo:

```bash
npm ci
npm run build
```

That runs:

- `npm run build:editor`
- `npm run build:angular`
- `npm run build:bundle`

The standalone bundle you integrate elsewhere is produced by:

```bash
npm run build:bundle
```

## Option 1: Load the published bundle directly

If you host the generated `web-components` folder on a CDN, static server, or GitHub Pages, load the bootstrap file like this:

```html
<script type="module" src="https://<your-host>/web-components/atlas-editor.js"></script>
<script type="module" src="https://<your-host>/web-components/atlas-side-nav.js"></script>
<atlas-editor></atlas-editor>
<atlas-side-nav></atlas-side-nav>
```

The existing GitHub Pages workflow in this repo publishes the bundle under:

```text
/web-components/atlas-editor.js
```

The same workflow also uploads a downloadable CI artifact named `atlas-web-components`, which contains the full `dist/web-components` folder for consumer use.

## Option 2: Copy the bundle into another Angular app

In your target Angular app, copy the generated folder into `src/assets`.

Example target structure:

```text
src/assets/atlas/
  atlas-editor.js
  atlas-side-nav.js
  atlaskit-editor/
    atlas-atlaskit-editor.js
    atlas-atlaskit-editor.css
    ...all chunk files...
  atlaskit-navigation/
    atlas-atlaskit-navigation.js
    atlas-atlaskit-navigation.css
    ...all chunk files...
```

Then load it from:

```html
<script type="module" src="/assets/atlas/atlas-editor.js"></script>
<script type="module" src="/assets/atlas/atlas-side-nav.js"></script>
```

You can add that script to `src/index.html`.

## Current recommended Angular integration

This is the preferred consumer model now:

1. Angular components are the public API
2. React stays internal inside those Angular wrappers
3. the consumer app uses Angular inputs and outputs only

This is the shape we want in the consuming app:

```html
<app-atlaskit-editor
  [value]="document()"
  [page]="page()"
  [readOnly]="readOnly()"
  [mode]="mode()"
  [darkMode]="darkMode()"
  [debounceMs]="debounceMs()"
  [placeholder]="placeholder()"
  (valueChange)="handleValueChange($event)"
  (change)="handleChange()"
  (pageChange)="handlePageChange($event)"
  (pageSubmit)="handlePageSubmit($event)"
  (pageCancel)="handlePageCancel($event)"
  (editModeChange)="handleEditModeChange($event)"
  (ready)="handleReady()"
  (editorError)="handleError($event)">
</app-atlaskit-editor>

<app-atlaskit-side-nav
  [model]="model()"
  [darkMode]="darkMode()"
  (ready)="handleReady()"
  (itemInvoke)="handleItemInvoke($event)"
  (actionInvoke)="handleActionInvoke($event)"
  (expandChange)="handleExpandChange($event)"
  (flyoutOpenChange)="handleFlyoutOpenChange($event)">
</app-atlaskit-side-nav>
```

The wrappers support both selector styles so older templates do not break:

- editor: `app-atlaskit-editor` and `app-atlaskit-editor-host`
- side nav: `app-atlaskit-side-nav` and `app-atlaskit-side-nav-host`

### Provide the bundle to the target Angular app

You now have two supported ways to provide the runtime bundle:

1. copy the full bundle locally into the target app
2. point the Angular wrappers at a hosted bundle URL

If you want local assets, copy this full folder from [C:\Users\HP\Desktop\code\atlas-editor\dist\web-components](C:\Users\HP\Desktop\code\atlas-editor\dist\web-components):

```text
dist/web-components/
```

Place it in the target app like this:

```text
src/assets/atlas/
  atlas-editor.js
  atlas-side-nav.js
  atlaskit-editor/
  atlaskit-navigation/
```

If you use the Angular wrappers below, you do not need to load any `<script>` tags in `index.html`. The wrappers lazy-load:

- `${assetBaseUrl}/atlas-editor.js`
- `${assetBaseUrl}/atlas-side-nav.js`

The default `assetBaseUrl` is:

```text
/assets/atlas
```

You can also point the wrappers at a hosted bundle URL, for example:

```ts
bundleBaseUrl = 'https://sumanthnagireddi.github.io/atlas-editor/web-components';
```

### Copy these Angular wrapper files into the target app

Copy these files directly into your other Angular app:

- editor wrapper: [C:\Users\HP\Desktop\code\atlas-editor\apps\angular-shell\src\app\atlaskit-editor-host.component.ts](C:\Users\HP\Desktop\code\atlas-editor\apps\angular-shell\src\app\atlaskit-editor-host.component.ts)
- side-nav wrapper: [C:\Users\HP\Desktop\code\atlas-editor\apps\angular-shell\src\app\atlaskit-side-nav-host.component.ts](C:\Users\HP\Desktop\code\atlas-editor\apps\angular-shell\src\app\atlaskit-side-nav-host.component.ts)
- Angular barrel export: [C:\Users\HP\Desktop\code\atlas-editor\apps\angular-shell\src\app\public-api.ts](C:\Users\HP\Desktop\code\atlas-editor\apps\angular-shell\src\app\public-api.ts)

Those wrappers already handle:

- assigning object inputs as element properties
- listening to custom DOM events and re-emitting Angular outputs
- loading the runtime JS and CSS from `src/assets`
- keeping React completely hidden from the consumer app

If you want a clean import surface inside the target app, import from the copied `public-api.ts` file instead of importing the wrapper files individually.

### Ready-to-paste sample Angular consumer page

This is a full standalone consumer component that uses both wrappers together.

```ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AtlaskitEditorComponent, AtlaskitSideNavComponent } from './public-api';

@Component({
  selector: 'app-atlas-consumer-page',
  standalone: true,
  imports: [CommonModule, AtlaskitEditorComponent, AtlaskitSideNavComponent],
  template: `
    <div class="page-shell">
      <aside class="page-shell__nav">
        <app-atlaskit-side-nav
          [assetBaseUrl]="bundleBaseUrl"
          [model]="sideNavModel"
          [darkMode]="true"
          (itemInvoke)="onNavItemInvoke($event)"
          (actionInvoke)="onNavActionInvoke($event)"
          (expandChange)="onExpandChange($event)"
          (flyoutOpenChange)="onFlyoutOpenChange($event)"
          (ready)="onSideNavReady()">
        </app-atlaskit-side-nav>
      </aside>

      <main class="page-shell__content">
        <app-atlaskit-editor
          [assetBaseUrl]="bundleBaseUrl"
          [value]="doc"
          [page]="page"
          [mode]="'editor'"
          [darkMode]="true"
          [readOnly]="false"
          [debounceMs]="250"
          [placeholder]="'Give this page a title...'"
          (valueChange)="onDocChange($event)"
          (pageChange)="onPageChange($event)"
          (pageSubmit)="onPageSubmit($event)"
          (pageCancel)="onPageCancel($event)"
          (editModeChange)="onEditModeChange($event)"
          (ready)="onEditorReady()">
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

      .page-shell {
        display: grid;
        grid-template-columns: 320px minmax(0, 1fr);
        min-height: 100vh;
      }

      .page-shell__nav {
        border-right: 1px solid rgba(255, 255, 255, 0.08);
        min-width: 0;
      }

      .page-shell__content {
        min-width: 0;
      }
    `,
  ],
})
export class AtlasConsumerPageComponent {
  bundleBaseUrl = '/assets/atlas';

  doc = {
    version: 1,
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Hello from another Angular app.' }],
      },
    ],
  };

  page = {
    title: 'OSI (Open Systems Interconnection)',
    authorName: 'Sumanth',
    authorInitials: 'S',
    updatedText: 'Updated 1h ago',
    metaItems: ['5 min', 'See views', 'Add a reaction'],
    statusText: 'Verified',
    statusAppearance: 'success',
    widthMode: 'centered',
    titleAlignment: 'left',
  };

  sideNavModel = {
    label: 'Workspace navigation',
    header: {
      title: 'Atlas workspace',
      description: 'Angular consumer app',
      icon: 'apps',
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
            isSelected: true,
          },
          {
            id: 'compose',
            kind: 'button',
            label: 'Create page',
            icon: 'add',
            actionsOnHover: [{ id: 'more-compose', label: 'More', icon: 'more' }],
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
                id: 'projects-heading',
                kind: 'spacer',
              },
              {
                id: 'kanban-board',
                kind: 'link',
                label: 'My Kanban Project',
                description: 'Board',
                href: '/projects/kanban',
                icon: 'board',
              },
              {
                id: 'analytics',
                kind: 'link',
                label: 'Analytics workspace',
                description: 'Dashboard',
                href: '/projects/analytics',
                icon: 'dashboard',
              },
            ],
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
                      id: 'recent-kanban',
                      kind: 'link',
                      label: 'My Kanban Project',
                      description: '5 days ago',
                      href: '/recent/kanban',
                      icon: 'board',
                    },
                    {
                      id: 'recent-business',
                      kind: 'link',
                      label: 'Business projects',
                      description: '6 days ago',
                      href: '/recent/business',
                      elemBeforeAppearance: 'app-tile',
                      elemBeforeText: 'BP',
                    },
                  ],
                },
                {
                  id: 'recent-this-month',
                  title: 'This month',
                  items: [
                    {
                      id: 'recent-ko-board',
                      kind: 'link',
                      label: 'KO Board',
                      description: '5 days ago',
                      href: '/recent/ko-board',
                      icon: 'board',
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
    footerSections: [
      {
        id: 'footer',
        items: [
          {
            id: 'settings',
            kind: 'link',
            label: 'Settings',
            href: '/settings',
            icon: 'settings',
          },
        ],
      },
    ],
  };

  onDocChange(nextDoc: unknown): void {
    console.log('ADF changed', nextDoc);
    this.doc = nextDoc as typeof this.doc;
  }

  onPageChange(nextPage: unknown): void {
    console.log('Page shell changed', nextPage);
    this.page = nextPage as typeof this.page;
  }

  onPageSubmit(payload: unknown): void {
    console.log('Committed page + ADF', payload);
  }

  onPageCancel(payload: unknown): void {
    console.log('Cancelled page edit', payload);
  }

  onEditModeChange(isEditing: boolean): void {
    console.log('Editor edit mode', isEditing);
  }

  onEditorReady(): void {
    console.log('Editor is ready');
  }

  onNavItemInvoke(detail: unknown): void {
    console.log('Side-nav item invoked', detail);
  }

  onNavActionInvoke(detail: unknown): void {
    console.log('Side-nav action invoked', detail);
  }

  onExpandChange(detail: unknown): void {
    console.log('Expandable item changed', detail);
  }

  onFlyoutOpenChange(detail: unknown): void {
    console.log('Flyout open state changed', detail);
  }

  onSideNavReady(): void {
    console.log('Side nav is ready');
  }
}
```

### What data the consumer passes in

`app-atlaskit-editor` accepts:

- `assetBaseUrl`: where `atlas-editor.js` is served from
- `value`: the ADF document
- `page`: the page-shell metadata object
- `mode`: `'editor' | 'renderer'`
- `readOnly`
- `darkMode`
- `debounceMs`
- `placeholder`

`app-atlaskit-side-nav` accepts:

- `assetBaseUrl`: where `atlas-side-nav.js` is served from
- `model`: the full side-nav tree
- `darkMode`

### What comes back out

`app-atlaskit-editor` emits:

- `valueChange`
- `change`
- `pageChange`
- `pageSubmit`
- `pageCancel`
- `editModeChange`
- `ready`

`app-atlaskit-side-nav` emits:

- `itemInvoke`
- `actionInvoke`
- `expandChange`
- `flyoutOpenChange`
- `ready`

### Raw bundle fallback

If you prefer to load the bundles directly in `index.html`, you still can, but this is now a fallback for Angular consumers rather than the main path:

```html
<script type="module" src="/assets/atlas/atlas-editor.js"></script>
<script type="module" src="/assets/atlas/atlas-side-nav.js"></script>
```

and keep this folder structure intact:

```text
src/assets/atlas/
  atlas-editor.js
  atlas-side-nav.js
  atlaskit-editor/
  atlaskit-navigation/
```

Then assign object inputs as element properties in plain JavaScript:

```ts
const editor = document.querySelector('atlas-editor');
const sideNav = document.querySelector('atlas-side-nav');

editor.value = doc;
editor.page = page;
editor.darkMode = true;

sideNav.model = sideNavModel;
sideNav.darkMode = true;
```

## Low-level Angular setup

Only use this section if you are not using the provided `app-atlaskit-editor` and `app-atlaskit-side-nav` wrappers.

If you render `<atlas-editor>` directly inside Angular, you need `CUSTOM_ELEMENTS_SCHEMA`.

Minimal standalone host component:

```ts
import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

type ADFDoc = {
  version: 1;
  type: 'doc';
  content?: unknown[];
  [key: string]: unknown;
};

type EditorMode = 'editor' | 'renderer';

type AtlasPageStatusAppearance =
  | 'default'
  | 'inprogress'
  | 'moved'
  | 'new'
  | 'removed'
  | 'success';

type AtlasPageWidthMode = 'centered' | 'wide' | 'full-width';

type AtlasEditorPage = {
  title: string;
  authorName?: string;
  authorInitials?: string;
  updatedText?: string;
  metaItems?: string[];
  statusText?: string;
  statusAppearance?: AtlasPageStatusAppearance;
  widthMode?: AtlasPageWidthMode;
};

type AtlasEditorSubmission = {
  page: AtlasEditorPage;
  value: ADFDoc;
};

type AtlasEditorElement = HTMLElement & {
  value: ADFDoc;
  readOnly: boolean;
  mode: EditorMode;
  darkMode: boolean;
  debounceMs: number;
  placeholder: string;
  page: AtlasEditorPage | null;
};

@Component({
  selector: 'app-atlas-editor-host',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <atlas-editor #editor class="editor-element"></atlas-editor>
  `,
  styles: [
    `
      :host,
      .editor-element {
        display: block;
        min-height: 520px;
      }
    `,
  ],
})
export class AtlasEditorHostComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input({ required: true }) value!: ADFDoc;
  @Input() readOnly = false;
  @Input() mode: EditorMode = 'editor';
  @Input() darkMode = true;
  @Input() debounceMs = 250;
  @Input() placeholder = 'Start writing...';
  @Input() page: AtlasEditorPage | null = null;

  @Output() readonly valueChange = new EventEmitter<ADFDoc>();
  @Output() readonly ready = new EventEmitter<void>();
  @Output() readonly pageChange = new EventEmitter<AtlasEditorPage>();
  @Output() readonly pageSubmit = new EventEmitter<AtlasEditorSubmission>();
  @Output() readonly pageCancel = new EventEmitter<AtlasEditorSubmission>();
  @Output() readonly editModeChange = new EventEmitter<boolean>();

  @ViewChild('editor', { static: true })
  private readonly editorRef?: ElementRef<AtlasEditorElement>;

  private removeChangeListener?: () => void;
  private removeReadyListener?: () => void;
  private removePageChangeListener?: () => void;
  private removePageSubmitListener?: () => void;
  private removePageCancelListener?: () => void;
  private removeEditModeChangeListener?: () => void;

  constructor(private readonly zone: NgZone) {}

  ngAfterViewInit(): void {
    const editor = this.editorRef?.nativeElement;
    if (!editor) {
      return;
    }

    const handleChange = (event: Event): void => {
      const detail = (event as CustomEvent<ADFDoc>).detail;
      this.zone.run(() => this.valueChange.emit(detail));
    };

    const handleReady = (): void => {
      this.zone.run(() => this.ready.emit());
    };

    const handlePageChange = (event: Event): void => {
      const detail = (event as CustomEvent<AtlasEditorPage>).detail;
      this.zone.run(() => this.pageChange.emit(detail));
    };

    const handlePageSubmit = (event: Event): void => {
      const detail = (event as CustomEvent<AtlasEditorSubmission>).detail;
      this.zone.run(() => this.pageSubmit.emit(detail));
    };

    const handlePageCancel = (event: Event): void => {
      const detail = (event as CustomEvent<AtlasEditorSubmission>).detail;
      this.zone.run(() => this.pageCancel.emit(detail));
    };

    const handleEditModeChange = (event: Event): void => {
      const detail = (event as CustomEvent<boolean>).detail;
      this.zone.run(() => this.editModeChange.emit(detail));
    };

    editor.addEventListener('change', handleChange);
    editor.addEventListener('ready', handleReady);
    editor.addEventListener('page-change', handlePageChange);
    editor.addEventListener('page-submit', handlePageSubmit);
    editor.addEventListener('page-cancel', handlePageCancel);
    editor.addEventListener('edit-mode-change', handleEditModeChange);

    this.removeChangeListener = () =>
      editor.removeEventListener('change', handleChange);
    this.removeReadyListener = () =>
      editor.removeEventListener('ready', handleReady);
    this.removePageChangeListener = () =>
      editor.removeEventListener('page-change', handlePageChange);
    this.removePageSubmitListener = () =>
      editor.removeEventListener('page-submit', handlePageSubmit);
    this.removePageCancelListener = () =>
      editor.removeEventListener('page-cancel', handlePageCancel);
    this.removeEditModeChangeListener = () =>
      editor.removeEventListener('edit-mode-change', handleEditModeChange);

    this.syncInputs();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.syncInputs();
  }

  ngOnDestroy(): void {
    this.removeChangeListener?.();
    this.removeReadyListener?.();
    this.removePageChangeListener?.();
    this.removePageSubmitListener?.();
    this.removePageCancelListener?.();
    this.removeEditModeChangeListener?.();
  }

  private syncInputs(): void {
    const editor = this.editorRef?.nativeElement;
    if (!editor) {
      return;
    }

    editor.value = this.value;
    editor.readOnly = this.readOnly;
    editor.mode = this.mode;
    editor.darkMode = this.darkMode;
    editor.debounceMs = this.debounceMs;
    editor.placeholder = this.placeholder;
    editor.page = this.page ? structuredClone(this.page) : null;
  }
}
```

## Angular usage

Template:

```html
<app-atlas-editor-host
  [value]="doc"
  [page]="page"
  [mode]="'editor'"
  [darkMode]="true"
  [readOnly]="false"
  [debounceMs]="250"
  [placeholder]="'Give this page a title...'"
  (valueChange)="onDocChange($event)"
  (pageSubmit)="onPageSubmit($event)"
  (ready)="onEditorReady()">
</app-atlas-editor-host>
```

Component:

```ts
doc = {
  version: 1,
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Hello from Angular' }],
    },
  ],
};

page = {
  title: 'OSI (Open Systems Interconnection)',
  authorName: 'Sumanth',
  authorInitials: 'S',
  updatedText: 'Updated 1h ago',
  metaItems: ['5 min', 'See views', 'Add a reaction'],
  statusText: 'Draft',
  statusAppearance: 'default',
  widthMode: 'centered',
};

onDocChange(nextDoc: unknown): void {
  console.log('ADF changed', nextDoc);
}

onPageSubmit(payload: unknown): void {
  console.log('Committed page + ADF', payload);
}

onEditorReady(): void {
  console.log('Editor is ready');
}
```

## Supported inputs

Set these on the custom element as properties:

- `value`: ADF document
- `page`: top page metadata object for the Confluence-style header
- `readOnly`: `boolean`
- `mode`: `'editor' | 'renderer'`
- `darkMode`: `boolean`
- `debounceMs`: `number`
- `placeholder`: `string`

Example:

```ts
const editor = document.querySelector('atlas-editor') as HTMLElement & {
  value: unknown;
  page: unknown;
  mode: 'editor' | 'renderer';
  darkMode: boolean;
};

editor.value = {
  version: 1,
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Injected ADF content' }],
    },
  ],
};
editor.page = {
  title: 'Injected page title',
  authorName: 'Atlas',
  authorInitials: 'A',
  updatedText: 'Updated just now',
  metaItems: ['3 min', 'Internal'],
  statusText: 'Draft',
  statusAppearance: 'default',
  widthMode: 'centered',
};
editor.mode = 'editor';
editor.darkMode = true;
```

## Events / outputs

The custom element emits:

- `ready`
  - fired once the React editor is hydrated and mounted
- `change`
  - `event.detail` contains the latest ADF document
- `page-change`
  - fired while the page shell metadata is being edited
- `page-submit`
  - fired when the user clicks `Update`
  - `event.detail` contains `{ page, value }`
- `page-cancel`
  - fired when the user clicks `Close`
- `edit-mode-change`
  - `event.detail` is `true` in edit mode and `false` in view mode

Example:

```ts
editor.addEventListener('change', (event) => {
  const doc = (event as CustomEvent).detail;
  console.log('Updated ADF', doc);
});

editor.addEventListener('page-submit', (event) => {
  const payload = (event as CustomEvent).detail;
  console.log('Committed page shell payload', payload.page, payload.value);
});
```

## Page-shell behavior

When a `page` object is supplied, the component switches to a Confluence-style page shell:

- view mode shows the page title, metadata row, and top-right `Edit` action
- edit mode shows inline title editing plus Atlaskit controls for `Status`, `Width`, `Update`, and `Close`
- the editor remains responsible only for editing and emitting data back to the consumer
- the consumer remains responsible for providing the initial `page` object and deciding what to do with submitted output

## Notes about ADF input

- Pass ADF as a property when possible: `editor.value = doc`
- Do not pass HTML into the component and expect it to convert automatically
- `change` returns ADF, not HTML
- If you want preview-only mode, use:

```ts
editor.mode = 'renderer';
editor.readOnly = true;
```

## Local testing flow

In this repo:

```bash
npm run build:editor
npm run start
```

If you update the bundle and your Angular app is still showing old behavior:

1. rebuild the editor bundle
2. restart `ng serve`
3. hard refresh the browser

This matters because the consuming Angular app is loading generated bundle files from `assets`.

## Troubleshooting

### The editor area is blank

Usually one of these is true:

- only `atlas-editor.js` was deployed, but the `atlaskit-editor/` chunk folder was not
- the script URL is right, but the relative folder layout is wrong
- the app is still serving cached old bundle files

The bootstrap file expects this relative structure:

```text
<same-folder>/atlas-editor.js
<same-folder>/atlaskit-editor/atlas-atlaskit-editor.js
<same-folder>/atlaskit-editor/atlas-atlaskit-editor.css
<same-folder>/atlaskit-editor/...all remaining chunks...
```

### My ADF is not rendering

Check that the input is a valid ADF `doc` object:

```json
{
  "version": 1,
  "type": "doc",
  "content": []
}
```

Also make sure you are assigning it to the `value` property, not trying to inject it as raw text into the DOM.

### Dark mode looks wrong

Set:

```ts
editor.darkMode = true;
```

and make sure your consuming shell does not override Atlaskit styles with global CSS.

## Files in this repo that matter

- Bundle entry: `C:\Users\HP\Desktop\code\atlas-editor\dist\web-components\atlas-editor.js`
- Bundle assets: `C:\Users\HP\Desktop\code\atlas-editor\dist\web-components\atlaskit-editor`
- Bundle builder: `C:\Users\HP\Desktop\code\atlas-editor\scripts\build-web-components.mjs`
- Angular wrapper example: `C:\Users\HP\Desktop\code\atlas-editor\apps\angular-shell\src\app\atlaskit-editor-host.component.ts`

If you want, the next natural step is adding a copy-paste-ready `AtlasEditorHostComponent` package for external Angular apps so consumers do not have to write the wrapper themselves.
