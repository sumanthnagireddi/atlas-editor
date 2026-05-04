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

type ADFDoc = {
  version: 1;
  type: 'doc';
  content?: unknown[];
  [key: string]: unknown;
};

type EditorMode = 'editor' | 'renderer';

type AtlaskitEditorElementContract = HTMLElement & {
  value: ADFDoc;
  readOnly: boolean;
  mode: EditorMode;
  darkMode: boolean;
  debounceMs: number;
  placeholder: string;
};

const EDITOR_ASSET_VERSION = '2026-05-05-1';

@Component({
  selector: 'app-atlaskit-editor-host',
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
export class AtlaskitEditorHostComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) value!: ADFDoc;
  @Input() readOnly = false;
  @Input() mode: EditorMode = 'editor';
  @Input() darkMode = false;
  @Input() debounceMs = 250;
  @Input() placeholder = 'Start writing...';

  @Output() readonly valueChange = new EventEmitter<ADFDoc>();
  @Output('change') readonly changeEvent = new EventEmitter<ADFDoc>();
  @Output() readonly ready = new EventEmitter<void>();
  @Output() readonly editorError = new EventEmitter<unknown>();

  @ViewChild('editorElement', { static: true })
  private editorRef?: ElementRef<AtlaskitEditorElementContract>;

  private removeChangeListener?: () => void;
  private removeReadyListener?: () => void;
  private initialized = false;

  constructor(private readonly zone: NgZone) {}

  async ngAfterViewInit(): Promise<void> {
    try {
      const { defineAtlaskitEditorElement } = await loadEditorElementModule();
      defineAtlaskitEditorElement();
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

      editor.addEventListener('change', handleChange);
      editor.addEventListener('ready', handleReady);

      this.removeChangeListener = () => editor.removeEventListener('change', handleChange);
      this.removeReadyListener = () => editor.removeEventListener('ready', handleReady);
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

    editor.value = this.value;
    editor.readOnly = this.readOnly;
    editor.mode = this.mode;
    editor.darkMode = this.darkMode;
    editor.debounceMs = this.debounceMs;
    editor.placeholder = this.placeholder;
  }
}

async function loadEditorElementModule(): Promise<{ defineAtlaskitEditorElement: () => void }> {
  ensureBrowserProcessShim();
  ensureEditorStylesheet();

  const importEditor = new Function('path', 'return import(path)') as (
    path: string
  ) => Promise<{ defineAtlaskitEditorElement: () => void }>;

  return importEditor(`/assets/atlaskit-editor/atlas-atlaskit-editor.js?v=${EDITOR_ASSET_VERSION}`);
}

function ensureBrowserProcessShim(): void {
  const globalScope = globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>;
    };
  };

  globalScope.process ??= {};
  globalScope.process.env ??= {};
  globalScope.process.env['NODE_ENV'] ??= 'production';
  globalScope.process.env['CI'] ??= 'false';
  globalScope.process.env['REACT_SSR'] ??= 'false';
}

function ensureEditorStylesheet(): void {
  const href = `/assets/atlaskit-editor/atlas-atlaskit-editor.css?v=${EDITOR_ASSET_VERSION}`;

  if (document.querySelector(`link[href="${href}"]`)) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.append(link);
}
