import {
  CUSTOM_ELEMENTS_SCHEMA,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';

export type ADFDoc = {
  version: 1;
  type: 'doc';
  content?: unknown[];
  [key: string]: unknown;
};

export type EditorMode = 'editor' | 'renderer';

export type AtlasPageStatusAppearance = 'default' | 'inprogress' | 'moved' | 'new' | 'removed' | 'success';

export type AtlasPageWidthMode = 'centered' | 'wide' | 'full-width';
export type AtlasPageTitleAlignment = 'left' | 'center' | 'right';

export type AtlasEditorPage = {
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

export type AtlasEditorSubmission = {
  page: AtlasEditorPage;
  value: ADFDoc;
};

type AtlaskitEditorElementContract = HTMLElement & {
  value: ADFDoc;
  readOnly: boolean;
  mode: EditorMode;
  darkMode: boolean;
  debounceMs: number;
  placeholder: string;
  page: AtlasEditorPage | null;
};

const EDITOR_ASSET_VERSION = '2026-05-08-angular-lib-1';
const LOCAL_EDITOR_MODULE_SPECIFIER = '@sumanthnagireddi/atlas-angular/runtime/atlas-editor.js';
const EMPTY_DOCUMENT: ADFDoc = {
  version: 1,
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: []
    }
  ]
};

@Component({
  selector: 'app-atlaskit-editor-host, app-atlaskit-editor',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <atlas-editor
      #editorElement
      class="editor-element"
      [attr.mode]="mode"
      [attr.read-only]="readOnly ? '' : null"
      [attr.dark-mode]="darkMode ? '' : null"
      [attr.debounce-ms]="debounceMs"
      [attr.placeholder]="placeholder">
    </atlas-editor>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 520px;
      }

      .editor-element {
        display: block;
        min-height: 520px;
      }
    `
  ]
})
export class AtlaskitEditorComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() value: ADFDoc | null | undefined = EMPTY_DOCUMENT;
  @Input() readOnly = false;
  @Input() mode: EditorMode = 'editor';
  @Input() darkMode = false;
  @Input() debounceMs = 250;
  @Input() placeholder = 'Start writing...';
  @Input() page: AtlasEditorPage | null = null;
  @Input() assetBaseUrl: string | null = null;

  @Output() readonly valueChange = new EventEmitter<ADFDoc>();
  @Output('change') readonly changeEvent = new EventEmitter<ADFDoc>();
  @Output() readonly pageChange = new EventEmitter<AtlasEditorPage>();
  @Output() readonly pageSubmit = new EventEmitter<AtlasEditorSubmission>();
  @Output() readonly pageCancel = new EventEmitter<AtlasEditorSubmission>();
  @Output() readonly editModeChange = new EventEmitter<boolean>();
  @Output() readonly ready = new EventEmitter<void>();
  @Output() readonly editorError = new EventEmitter<unknown>();

  @ViewChild('editorElement', { static: true })
  private editorRef?: ElementRef<AtlaskitEditorElementContract>;

  private removeChangeListener?: () => void;
  private removeReadyListener?: () => void;
  private removePageChangeListener?: () => void;
  private removePageSubmitListener?: () => void;
  private removePageCancelListener?: () => void;
  private removeEditModeChangeListener?: () => void;
  private initialized = false;

  constructor(private readonly zone: NgZone) {}

  async ngAfterViewInit(): Promise<void> {
    try {
      await loadEditorElementModule(this.assetBaseUrl);
      this.initialized = true;
      this.bindElementEvents();
      this.syncElementProperties();
    } catch (error) {
      this.editorError.emit(error);
    }
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.syncElementProperties();
  }

  ngOnDestroy(): void {
    this.removeChangeListener?.();
    this.removeReadyListener?.();
    this.removePageChangeListener?.();
    this.removePageSubmitListener?.();
    this.removePageCancelListener?.();
    this.removeEditModeChangeListener?.();
  }

  private bindElementEvents(): void {
    const editor = this.editorRef?.nativeElement;

    if (!editor || this.removeChangeListener) {
      return;
    }

    this.zone.runOutsideAngular(() => {
      const handleChange = (event: Event): void => {
        const detail = (event as CustomEvent<ADFDoc>).detail;
        this.zone.run(() => {
          this.valueChange.emit(detail);
          this.changeEvent.emit(detail);
        });
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

      this.removeChangeListener = () => editor.removeEventListener('change', handleChange);
      this.removeReadyListener = () => editor.removeEventListener('ready', handleReady);
      this.removePageChangeListener = () => editor.removeEventListener('page-change', handlePageChange);
      this.removePageSubmitListener = () => editor.removeEventListener('page-submit', handlePageSubmit);
      this.removePageCancelListener = () => editor.removeEventListener('page-cancel', handlePageCancel);
      this.removeEditModeChangeListener = () => editor.removeEventListener('edit-mode-change', handleEditModeChange);
    });
  }

  private syncElementProperties(): void {
    if (!this.initialized) {
      return;
    }

    const editor = this.editorRef?.nativeElement;

    if (!editor) {
      return;
    }

    editor.value = normalizeHostValue(this.value);
    editor.readOnly = this.readOnly;
    editor.mode = this.mode;
    editor.darkMode = this.darkMode;
    editor.debounceMs = this.debounceMs;
    editor.placeholder = this.placeholder;
    editor.page = this.page ? structuredClone(this.page) : null;
  }
}

export { AtlaskitEditorComponent as AtlaskitEditorHostComponent };

function normalizeHostValue(value: ADFDoc | null | undefined): ADFDoc {
  if (!value || typeof value !== 'object' || value.type !== 'doc') {
    return structuredClone(EMPTY_DOCUMENT);
  }

  return {
    ...value,
    version: 1,
    content: Array.isArray(value.content) ? structuredClone(value.content) : []
  };
}

async function loadEditorElementModule(assetBaseUrl: string | null | undefined): Promise<void> {
  const importEditor = new Function('path', 'return import(path)') as (
    path: string
  ) => Promise<unknown>;

  const normalizedBaseUrl = normalizeAssetBaseUrl(assetBaseUrl);

  if (normalizedBaseUrl) {
    await importEditor(`${normalizedBaseUrl}/atlas-editor.js?v=${EDITOR_ASSET_VERSION}`);
  } else {
    await importEditor(LOCAL_EDITOR_MODULE_SPECIFIER);
  }

  await customElements.whenDefined('atlas-editor');
}

function normalizeAssetBaseUrl(assetBaseUrl: string | null | undefined): string | null {
  const normalized = (assetBaseUrl ?? '').trim();

  if (!normalized) {
    return null;
  }

  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
}
