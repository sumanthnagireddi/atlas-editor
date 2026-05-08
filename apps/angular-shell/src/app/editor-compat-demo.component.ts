import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, signal } from '@angular/core';
import { AtlaskitEditorComponent } from '@sumanthnagireddi/atlas-angular';

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
  selector: 'app-editor-compat-demo',
  standalone: true,
  imports: [AtlaskitEditorComponent],
  template: `
    <section class="compat-shell">
      <aside class="compat-panel">
        <div class="compat-panel__section">
          <div class="compat-panel__title">Consumer inputs</div>

          <label class="compat-field">
            <span>Initial mode</span>
            <select [value]="mode()" (change)="onModeChange($event)">
              <option value="renderer">renderer</option>
              <option value="editor">editor</option>
            </select>
          </label>

          <label class="compat-toggle">
            <input type="checkbox" [checked]="darkMode()" (change)="darkMode.set(!darkMode())" />
            <span>darkMode</span>
          </label>

          <label class="compat-toggle">
            <input type="checkbox" [checked]="readOnly()" (change)="readOnly.set(!readOnly())" />
            <span>readOnly</span>
          </label>

          <label class="compat-field">
            <span>placeholder</span>
            <input type="text" [value]="placeholder()" (input)="placeholder.set($any($event.target).value)" />
          </label>

          <label class="compat-field">
            <span>debounceMs</span>
            <input
              type="number"
              min="0"
              step="50"
              [value]="debounceMs()"
              (input)="debounceMs.set(toNumber($any($event.target).value, 200))" />
          </label>
        </div>

        <div class="compat-panel__section">
          <div class="compat-panel__title">Page inputs</div>

          <label class="compat-field">
            <span>Title</span>
            <input type="text" [value]="page().title" (input)="updatePage({ title: $any($event.target).value })" />
          </label>

          <label class="compat-field">
            <span>Author</span>
            <input
              type="text"
              [value]="page().authorName ?? ''"
              (input)="updatePage({ authorName: $any($event.target).value })" />
          </label>

          <label class="compat-field">
            <span>Updated text</span>
            <input
              type="text"
              [value]="page().updatedText ?? ''"
              (input)="updatePage({ updatedText: $any($event.target).value })" />
          </label>

          <label class="compat-field">
            <span>Status</span>
            <select [value]="page().statusText ?? 'Rough draft'" (change)="onStatusChange($event)">
              @for (option of statusOptions; track option.label) {
                <option [value]="option.label">{{ option.label }}</option>
              }
            </select>
          </label>

          <label class="compat-field">
            <span>Width</span>
            <select [value]="page().widthMode ?? 'centered'" (change)="onWidthModeChange($event)">
              <option value="centered">centered</option>
              <option value="wide">wide</option>
              <option value="full-width">full-width</option>
            </select>
          </label>

          <label class="compat-field">
            <span>Title align</span>
            <select [value]="page().titleAlignment ?? 'left'" (change)="onTitleAlignmentChange($event)">
              <option value="left">left</option>
              <option value="center">center</option>
              <option value="right">right</option>
            </select>
          </label>
        </div>

        <div class="compat-panel__section">
          <div class="compat-panel__title">Document actions</div>

          <div class="compat-actions">
            <button type="button" (click)="loadEmpty()">Empty</button>
            <button type="button" (click)="loadExample()">Example</button>
            <button type="button" (click)="resetState()">Reset</button>
          </div>
        </div>

        <div class="compat-panel__section">
          <div class="compat-panel__title">Raw ADF input</div>

          <label class="compat-field">
            <span>Paste ADF JSON</span>
            <textarea
              class="compat-textarea"
              [value]="adfDraft()"
              (input)="adfDraft.set($any($event.target).value); adfDraftError.set('')"></textarea>
          </label>

          <div class="compat-actions">
            <button type="button" (click)="applyAdfDraft()">Apply ADF</button>
            <button type="button" (click)="syncDraftWithCommitted()">Use committed output</button>
          </div>

          @if (adfDraftError()) {
            <div class="compat-error">{{ adfDraftError() }}</div>
          }
        </div>

        <div class="compat-panel__section">
          <div class="compat-panel__title">Outputs</div>
          <div class="compat-output">
            <div><strong>ready:</strong> {{ readyCount() }}</div>
            <div><strong>change:</strong> {{ changeCount() }}</div>
            <div><strong>pageChange:</strong> {{ pageChangeCount() }}</div>
            <div><strong>pageSubmit:</strong> {{ pageSubmitCount() }}</div>
            <div><strong>editMode:</strong> {{ editMode() ? 'editing' : 'viewing' }}</div>
            <div><strong>last type:</strong> {{ lastEventType() }}</div>
          </div>
        </div>

        <div class="compat-panel__section">
          <div class="compat-panel__title">Latest committed page</div>
          <pre class="compat-json">{{ pageText() }}</pre>
        </div>

        <div class="compat-panel__section">
          <div class="compat-panel__title">Latest draft ADF</div>
          <pre class="compat-json">{{ liveDocumentText() }}</pre>
        </div>
      </aside>

      <div class="compat-stage">
        @if (!isEditorReady()) {
          <div class="compat-stage__status" role="status" aria-live="polite">
            <div class="compat-stage__status-card">
              <div class="compat-stage__spinner" aria-hidden="true"></div>
              <div class="compat-stage__status-copy">
                <strong>Loading Confluence editor...</strong>
                <span>The editor bundle is still hydrating.</span>
              </div>
            </div>
          </div>
        }

          <app-atlaskit-editor
            [assetBaseUrl]="assetBaseUrl"
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
            (pageCancel)="handlePageCancel()"
            (editModeChange)="handleEditModeChange($event)"
            (ready)="handleReady()"
            (editorError)="handleError($event)">
          </app-atlaskit-editor>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: calc(100vh - 140px);
      }

      .compat-shell {
        display: grid;
        grid-template-columns: 340px minmax(0, 1fr);
        gap: 20px;
        min-height: inherit;
      }

      .compat-panel {
        align-self: start;
        padding: 16px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.04);
      }

      :host-context(.confluence-shell:not(.confluence-shell--dark)) .compat-panel {
        border-color: #dfe1e6;
        background: #ffffff;
      }

      .compat-panel__section + .compat-panel__section {
        margin-top: 18px;
        padding-top: 18px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }

      :host-context(.confluence-shell:not(.confluence-shell--dark)) .compat-panel__section + .compat-panel__section {
        border-top-color: #ebecf0;
      }

      .compat-panel__title {
        margin-bottom: 12px;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #9fadbc;
      }

      :host-context(.confluence-shell:not(.confluence-shell--dark)) .compat-panel__title {
        color: #44546f;
      }

      .compat-field,
      .compat-toggle {
        display: grid;
        gap: 6px;
        margin-bottom: 12px;
        font-size: 14px;
      }

      .compat-toggle {
        grid-template-columns: 18px 1fr;
        align-items: center;
      }

      .compat-field input,
      .compat-field select {
        height: 36px;
        padding: 0 10px;
        border: 1px solid #3a3f46;
        border-radius: 8px;
        background: #1f2329;
        color: inherit;
        font: inherit;
      }

      .compat-textarea {
        min-height: 180px;
        padding: 10px 12px;
        resize: vertical;
        border: 1px solid #3a3f46;
        border-radius: 8px;
        background: #1f2329;
        color: inherit;
        font: 12px/1.5 Consolas, "SFMono-Regular", monospace;
      }

      :host-context(.confluence-shell:not(.confluence-shell--dark)) .compat-field input,
      :host-context(.confluence-shell:not(.confluence-shell--dark)) .compat-field select {
        border-color: #c7d1db;
        background: #ffffff;
      }

      :host-context(.confluence-shell:not(.confluence-shell--dark)) .compat-textarea {
        border-color: #c7d1db;
        background: #ffffff;
        color: #172b4d;
      }

      .compat-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .compat-actions button {
        height: 34px;
        padding: 0 12px;
        border: 1px solid #3a3f46;
        border-radius: 8px;
        background: #282d33;
        color: inherit;
        cursor: pointer;
        font: inherit;
        font-size: 14px;
      }

      :host-context(.confluence-shell:not(.confluence-shell--dark)) .compat-actions button {
        border-color: #c7d1db;
        background: #ffffff;
      }

      .compat-output {
        display: grid;
        gap: 6px;
        font-size: 14px;
      }

      .compat-error {
        margin-top: 10px;
        font-size: 13px;
        color: #ff8f73;
      }

      .compat-json {
        max-height: 240px;
        margin: 0;
        overflow: auto;
        padding: 12px;
        border-radius: 10px;
        background: #16181d;
        color: #dfe1e6;
        font: 12px/1.5 Consolas, "SFMono-Regular", monospace;
      }

      :host-context(.confluence-shell:not(.confluence-shell--dark)) .compat-json {
        background: #f7f8f9;
        color: #172b4d;
      }

      .compat-stage {
        position: relative;
        min-width: 0;
      }

      .compat-stage__status {
        position: absolute;
        inset: 0;
        z-index: 2;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 76px;
        pointer-events: none;
      }

      .compat-stage__status-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        background: rgba(29, 33, 37, 0.92);
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
      }

      .compat-stage__status-copy {
        display: grid;
        gap: 2px;
        font-size: 13px;
      }

      .compat-stage__status-copy strong {
        font-size: 14px;
        font-weight: 700;
      }

      .compat-stage__status-copy span {
        color: #9fadbc;
      }

      .compat-stage__spinner {
        width: 18px;
        height: 18px;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 999px;
        animation: compat-spin 0.8s linear infinite;
      }

      :host-context(.confluence-shell:not(.confluence-shell--dark)) .compat-stage__status-card {
        border-color: #dfe1e6;
        background: rgba(255, 255, 255, 0.96);
        box-shadow: 0 10px 24px rgba(9, 30, 66, 0.14);
      }

      :host-context(.confluence-shell:not(.confluence-shell--dark)) .compat-stage__status-copy span {
        color: #44546f;
      }

      @media (max-width: 1160px) {
        .compat-shell {
          grid-template-columns: 1fr;
        }
      }

      @keyframes compat-spin {
        to {
          transform: rotate(360deg);
        }
      }
    `
  ]
})
export class EditorCompatDemoComponent implements OnChanges {
  @Input() documentInput: ADFDoc = createEmptyDocument();
  @Input() pageInput: AtlasEditorPage = createDefaultPage();
  @Input() darkModeInput = true;
  @Input() modeInput: EditorMode = 'renderer';
  @Output() readonly documentSubmit = new EventEmitter<AtlasEditorSubmission>();

  readonly statusOptions = STATUS_OPTIONS;
  readonly document = signal<ADFDoc>(createEmptyDocument());
  readonly liveDocument = signal<ADFDoc>(createEmptyDocument());
  readonly page = signal<AtlasEditorPage>(createDefaultPage());
  readonly livePage = signal<AtlasEditorPage>(createDefaultPage());
  readonly darkMode = signal(true);
  readonly mode = signal<EditorMode>('renderer');
  readonly readOnly = signal(false);
  readonly debounceMs = signal(200);
  readonly placeholder = signal('Start writing...');
  readonly readyCount = signal(0);
  readonly changeCount = signal(0);
  readonly pageChangeCount = signal(0);
  readonly pageSubmitCount = signal(0);
  readonly lastEventType = signal('none');
  readonly editMode = signal(false);
  readonly adfDraft = signal(JSON.stringify(createEmptyDocument(), null, 2));
  readonly adfDraftError = signal('');
  readonly pageText = computed(() => JSON.stringify(this.page(), null, 2));
  readonly liveDocumentText = computed(() => JSON.stringify(this.liveDocument(), null, 2));
  readonly isEditorReady = signal(false);
  readonly assetBaseUrl = '/assets/atlas';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['documentInput']) {
      this.document.set(structuredClone(this.documentInput));
      this.liveDocument.set(structuredClone(this.documentInput));
      this.adfDraft.set(JSON.stringify(this.documentInput, null, 2));
      this.adfDraftError.set('');
    }

    if (changes['pageInput']) {
      const nextPage = normalizePage(this.pageInput);
      this.page.set(nextPage);
      this.livePage.set(nextPage);
    }

    if (changes['darkModeInput']) {
      this.darkMode.set(this.darkModeInput);
    }

    if (changes['modeInput']) {
      this.mode.set(this.modeInput);
    }
  }

  handleValueChange(doc: ADFDoc): void {
    this.liveDocument.set(structuredClone(doc));
    this.lastEventType.set('valueChange');
  }

  handleChange(): void {
    this.changeCount.update((count) => count + 1);
    this.lastEventType.set('change');
  }

  handlePageChange(page: AtlasEditorPage): void {
    this.livePage.set(structuredClone(page));
    this.pageChangeCount.update((count) => count + 1);
    this.lastEventType.set('pageChange');
  }

  handlePageSubmit(payload: AtlasEditorSubmission): void {
    const nextPage = normalizePage(payload.page);
    const nextDoc = structuredClone(payload.value);

    this.page.set(nextPage);
    this.livePage.set(nextPage);
    this.document.set(nextDoc);
    this.liveDocument.set(nextDoc);
    this.pageSubmitCount.update((count) => count + 1);
    this.lastEventType.set('pageSubmit');
    this.adfDraft.set(JSON.stringify(nextDoc, null, 2));
    this.adfDraftError.set('');
    this.documentSubmit.emit({
      page: structuredClone(nextPage),
      value: nextDoc
    });
  }

  handlePageCancel(): void {
    this.livePage.set(structuredClone(this.page()));
    this.liveDocument.set(structuredClone(this.document()));
    this.lastEventType.set('pageCancel');
  }

  handleEditModeChange(isEditing: boolean): void {
    this.editMode.set(isEditing);
    this.lastEventType.set('editModeChange');
  }

  handleReady(): void {
    this.readyCount.update((count) => count + 1);
    this.lastEventType.set('ready');
    this.isEditorReady.set(true);
  }

  handleError(error: unknown): void {
    console.error('Editor demo error', error);
    this.lastEventType.set('editorError');
    this.isEditorReady.set(false);
  }

  onModeChange(event: Event): void {
    this.mode.set((event.target as HTMLSelectElement).value as EditorMode);
  }

  onStatusChange(event: Event): void {
    const label = (event.target as HTMLSelectElement).value;
    const option = STATUS_OPTIONS.find((candidate) => candidate.label === label) ?? STATUS_OPTIONS[0];
    this.updatePage({
      statusText: option.label,
      statusAppearance: option.appearance
    });
  }

  onWidthModeChange(event: Event): void {
    this.updatePage({
      widthMode: (event.target as HTMLSelectElement).value as AtlasPageWidthMode
    });
  }

  onTitleAlignmentChange(event: Event): void {
    this.updatePage({
      titleAlignment: (event.target as HTMLSelectElement).value as AtlasPageTitleAlignment
    });
  }

  updatePage(patch: Partial<AtlasEditorPage>): void {
    this.page.update((currentPage) => normalizePage({ ...currentPage, ...patch }));
  }

  loadEmpty(): void {
    const nextDoc = createEmptyDocument();
    this.document.set(nextDoc);
    this.liveDocument.set(structuredClone(nextDoc));
    this.adfDraft.set(JSON.stringify(nextDoc, null, 2));
    this.adfDraftError.set('');
    this.page.set(createDefaultPage());
    this.livePage.set(createDefaultPage());
    this.mode.set('renderer');
  }

  loadExample(): void {
    const nextDoc = createExampleDocument();
    this.document.set(nextDoc);
    this.liveDocument.set(structuredClone(nextDoc));
    this.adfDraft.set(JSON.stringify(nextDoc, null, 2));
    this.adfDraftError.set('');
    this.page.set(createDefaultPage());
    this.livePage.set(createDefaultPage());
    this.mode.set('renderer');
  }

  resetState(): void {
    const nextDoc = createExampleDocument();
    const nextPage = createDefaultPage();

    this.document.set(nextDoc);
    this.liveDocument.set(structuredClone(nextDoc));
    this.page.set(nextPage);
    this.livePage.set(structuredClone(nextPage));
    this.mode.set('renderer');
    this.readOnly.set(false);
    this.darkMode.set(true);
    this.debounceMs.set(200);
    this.placeholder.set('Start writing...');
    this.changeCount.set(0);
    this.readyCount.set(0);
    this.pageChangeCount.set(0);
    this.pageSubmitCount.set(0);
    this.lastEventType.set('reset');
    this.editMode.set(false);
    this.adfDraft.set(JSON.stringify(nextDoc, null, 2));
    this.adfDraftError.set('');
  }

  toNumber(value: string, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  applyAdfDraft(): void {
    try {
      const parsed = JSON.parse(this.adfDraft()) as Partial<ADFDoc>;

      if (!parsed || parsed.type !== 'doc') {
        throw new Error('ADF JSON must contain "type": "doc".');
      }

      const nextDoc = {
        ...parsed,
        version: 1,
        content: Array.isArray(parsed.content) ? parsed.content : []
      } as ADFDoc;

      this.document.set(structuredClone(nextDoc));
      this.liveDocument.set(structuredClone(nextDoc));
      this.adfDraftError.set('');
      this.lastEventType.set('applyAdfDraft');
    } catch (error) {
      this.adfDraftError.set(error instanceof Error ? error.message : 'Unable to parse ADF JSON.');
    }
  }

  syncDraftWithCommitted(): void {
    this.adfDraft.set(JSON.stringify(this.document(), null, 2));
    this.adfDraftError.set('');
  }
}

const STATUS_OPTIONS: Array<{ appearance: AtlasPageStatusAppearance; label: string }> = [
  { label: 'Rough draft', appearance: 'default' },
  { label: 'In progress', appearance: 'inprogress' },
  { label: 'Ready for review', appearance: 'new' },
  { label: 'Verified', appearance: 'success' }
];

function createEmptyDocument(): ADFDoc {
  return {
    version: 1,
    type: 'doc',
    content: []
  };
}

function createDefaultPage(): AtlasEditorPage {
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

function normalizePage(page: AtlasEditorPage): AtlasEditorPage {
  const normalizedStatusText =
    page.statusText === 'Draft'
      ? 'Rough draft'
      : page.statusText === 'In review'
        ? 'Ready for review'
        : page.statusText === 'Approved'
          ? 'Verified'
          : page.statusText;
  const statusOption = STATUS_OPTIONS.find((option) => option.label === normalizedStatusText) ?? STATUS_OPTIONS[0];

  return {
    title: page.title?.trim() || 'Untitled page',
    authorName: page.authorName?.trim() || 'Unknown author',
    authorInitials: page.authorInitials?.trim() || deriveInitials(page.authorName?.trim() || 'Unknown author'),
    updatedText: page.updatedText?.trim() || 'Updated just now',
    metaItems: Array.isArray(page.metaItems) ? [...page.metaItems] : ['5 min', 'See views', 'Add a reaction'],
    statusText: statusOption.label,
    statusAppearance: page.statusAppearance ?? statusOption.appearance,
    widthMode: page.widthMode ?? 'centered',
    titleAlignment: page.titleAlignment ?? 'left'
  };
}

function deriveInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? '')
    .join('') || 'U';
}

function createExampleDocument(): ADFDoc {
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
          { type: 'text', text: ', each with a specific job.' }
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
                content: [{ type: 'text', text: 'Application layer is what users and apps usually see.' }]
              }
            ]
          }
        ]
      }
    ]
  };
}
