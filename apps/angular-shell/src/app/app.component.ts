import { Component, signal } from '@angular/core';
import { EditorCompatDemoComponent } from './editor-compat-demo.component';
import { SideNavDemoComponent } from './side-nav-demo.component';

type ADFDoc = {
  version: 1;
  type: 'doc';
  content?: unknown[];
  [key: string]: unknown;
};

type EditorMode = 'editor' | 'renderer';

type AtlasPageStatusAppearance = 'default' | 'inprogress' | 'moved' | 'new' | 'removed' | 'success';

type AtlasPageWidthMode = 'centered' | 'wide' | 'full-width';
type AtlasPageTitleAlignment = 'left' | 'center' | 'right';

type AtlasEditorPage = {
  title: string;
  authorName?: string;
  authorInitials?: string;
  updatedText?: string;
  metaItems?: string[];
  statusText?: string;
  statusAppearance?: AtlasPageStatusAppearance;
  widthMode?: AtlasPageWidthMode;
  titleAlignment?: AtlasPageTitleAlignment;
};

type AtlasEditorSubmission = {
  page: AtlasEditorPage;
  value: ADFDoc;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SideNavDemoComponent, EditorCompatDemoComponent],
  template: `
    <main class="playground-shell" [class.playground-shell--light]="!darkMode()">
      <header class="playground-header">
        <div class="playground-header__copy">
          <span class="playground-header__eyebrow">Atlas web components</span>
          <h1>Atlaskit package playground</h1>
          <p>Both exported packages live here now: the Confluence-style editor and the side navigation host wrapper.</p>
        </div>

        <div class="playground-header__actions">
          <button class="playground-button playground-button--ghost" type="button" (click)="toggleDarkMode()">
            {{ darkMode() ? 'Switch to light' : 'Switch to dark' }}
          </button>
          <button class="playground-button" type="button" (click)="resetState()">Reset demo</button>
        </div>
      </header>

      <div class="playground-stack">
        <section class="playground-block">
          <div class="playground-block__copy">
            <span class="playground-block__eyebrow">Navigation package</span>
            <h2>Side nav items host</h2>
            <p>Link, button, expandable, and flyout menu items are all exposed through the Angular host wrapper.</p>
          </div>

          <app-side-nav-demo></app-side-nav-demo>
        </section>

        <section class="playground-block">
          <div class="playground-block__copy">
            <span class="playground-block__eyebrow">Editor package</span>
            <h2>Confluence-style page editor</h2>
            <p>Top page metadata comes in from the consumer, and the editor sends the updated page plus ADF back on submit.</p>
          </div>

          <app-editor-compat-demo
            [documentInput]="editorData()"
            [pageInput]="pageData()"
            [modeInput]="mode()"
            [darkModeInput]="darkMode()"
            (documentSubmit)="handleDocumentSubmit($event)">
          </app-editor-compat-demo>
        </section>
      </div>
    </main>
  `,
  styleUrl: './app.component.css'
})
export class AppComponent {
  readonly editorData = signal<ADFDoc>(createInitialDocument());
  readonly pageData = signal<AtlasEditorPage>(createInitialPage());
  readonly darkMode = signal(true);
  readonly mode = signal<EditorMode>('renderer');

  handleDocumentSubmit(payload: AtlasEditorSubmission): void {
    this.editorData.set(structuredClone(payload.value));
    this.pageData.set(structuredClone(payload.page));
    this.mode.set('renderer');
  }

  toggleDarkMode(): void {
    this.darkMode.update((value) => !value);
  }

  resetState(): void {
    this.editorData.set(createInitialDocument());
    this.pageData.set(createInitialPage());
    this.mode.set('renderer');
  }
}

function createInitialPage(): AtlasEditorPage {
  return {
    title: 'OSI (Open Systems Interconnection)',
    authorName: 'Sumanth',
    authorInitials: 'S',
    updatedText: 'Updated 1h ago',
    metaItems: ['5 min', 'See views', 'Add a reaction'],
    statusText: 'Verified',
    statusAppearance: 'success',
    widthMode: 'centered',
    titleAlignment: 'left'
  };
}

function createInitialDocument(): ADFDoc {
  return {
    version: 1,
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'The OSI Model - The Foundation of Everything' }]
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'All protocols fit into a layered model called the ' },
          { type: 'text', text: 'OSI (Open Systems Interconnection) Model', marks: [{ type: 'strong' }] },
          { type: 'text', text: '. It has ' },
          { type: 'text', text: '7 layers', marks: [{ type: 'strong' }] },
          { type: 'text', text: ', each with a specific job. Protocols at each layer only talk to the layers directly above and below them.' }
        ]
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Reference material: ' },
          {
            type: 'inlineCard',
            attrs: {
              url: 'https://www.rfc-editor.org/rfc/rfc1122'
            }
          }
        ]
      },
      {
        type: 'codeBlock',
        attrs: { language: 'typescript' },
        content: [
          {
            type: 'text',
            text: "const layers = ['Physical', 'Data Link', 'Network', 'Transport', 'Session', 'Presentation', 'Application'];\nconst topLayer = layers.at(-1);\nconsole.log(`Top layer: ${topLayer}`);"
          }
        ]
      },
      {
        type: 'blockCard',
        attrs: {
          url: 'https://developer.atlassian.com/cloud/confluence/rest/v1/intro/'
        }
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Physical layer handles raw bits on the wire.' }]
              }
            ]
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Network and transport layers route and deliver packets.' }]
              }
            ]
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Application layer is what end users and apps usually interact with.' }]
              }
            ]
          }
        ]
      }
    ]
  };
}
