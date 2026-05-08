import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AtlaskitEditor } from './AtlaskitEditor';
import { normalizeADF, stableADFString } from './adf';
import type { ADFDoc, AtlasEditorPage, AtlasEditorSubmission, EditorMode } from './types';

const BOOLEAN_ATTRIBUTES = new Set(['read-only', 'dark-mode']);

export class AtlaskitEditorElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['value', 'read-only', 'mode', 'dark-mode', 'debounce-ms', 'placeholder'];
  }

  private root: Root | null = null;
  private mountPoint: HTMLDivElement | null = null;
  private internalValue: ADFDoc = normalizeADF(undefined);
  private committedValue: ADFDoc = normalizeADF(undefined);
  private internalPage: AtlasEditorPage | null = null;
  private committedPage: AtlasEditorPage | null = null;
  private internalReadOnly = false;
  private internalMode: EditorMode = 'editor';
  private internalDarkMode = false;
  private internalDebounceMs = 250;
  private internalPlaceholder = 'Start writing...';
  private lastRenderKey = '';
  private renderQueued = false;
  private readyDispatched = false;

  connectedCallback(): void {
    if (!this.mountPoint) {
      this.mountPoint = document.createElement('div');
      this.mountPoint.className = 'atlas-editor-element-root';
      this.renderLoadingState();
      this.append(this.mountPoint);
    }

    if (!this.root) {
      this.root = createRoot(this.mountPoint);
    }

    this.queueRender();
  }

  disconnectedCallback(): void {
    this.root?.unmount();
    this.root = null;
    this.readyDispatched = false;
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (BOOLEAN_ATTRIBUTES.has(name)) {
      this[name === 'read-only' ? 'readOnly' : 'darkMode'] = newValue !== null;
      return;
    }

    if (name === 'value') {
      if (newValue === null || newValue.trim().length === 0) {
        this.value = normalizeADF(undefined);
        return;
      }

      try {
        this.value = JSON.parse(newValue) as ADFDoc;
      } catch (error) {
        console.warn('Unable to parse initial ADF value attribute, falling back to an empty document', error);
        this.value = normalizeADF(undefined);
      }

      return;
    }

    if (name === 'mode') {
      this.mode = newValue === 'renderer' ? 'renderer' : 'editor';
      return;
    }

    if (name === 'debounce-ms') {
      this.debounceMs = Number(newValue ?? 250);
      return;
    }

    if (name === 'placeholder' && newValue !== null) {
      this.placeholder = newValue;
    }
  }

  get value(): ADFDoc {
    return normalizeADF(this.internalValue);
  }

  set value(nextValue: ADFDoc) {
    this.internalValue = normalizeADF(nextValue);
    this.committedValue = normalizeADF(nextValue);
    this.queueRender();
  }

  get readOnly(): boolean {
    return this.internalReadOnly;
  }

  set readOnly(nextValue: boolean) {
    this.internalReadOnly = coerceBoolean(nextValue);
    this.queueRender();
  }

  get mode(): EditorMode {
    return this.internalMode;
  }

  set mode(nextValue: EditorMode) {
    this.internalMode = nextValue === 'renderer' ? 'renderer' : 'editor';
    this.queueRender();
  }

  get darkMode(): boolean {
    return this.internalDarkMode;
  }

  set darkMode(nextValue: boolean) {
    this.internalDarkMode = coerceBoolean(nextValue);

    if (!this.readyDispatched) {
      this.renderLoadingState();
    }

    this.queueRender();
  }

  get debounceMs(): number {
    return this.internalDebounceMs;
  }

  set debounceMs(nextValue: number) {
    const parsed = Number(nextValue);
    this.internalDebounceMs = Number.isFinite(parsed) && parsed >= 0 ? parsed : 250;
    this.queueRender();
  }

  get placeholder(): string {
    return this.internalPlaceholder;
  }

  set placeholder(nextValue: string) {
    this.internalPlaceholder = typeof nextValue === 'string' && nextValue.trim().length > 0 ? nextValue : 'Start writing...';
    this.queueRender();
  }

  get page(): AtlasEditorPage | null {
    return this.internalPage ? { ...this.internalPage, metaItems: [...(this.internalPage.metaItems ?? [])] } : null;
  }

  set page(nextValue: AtlasEditorPage | null) {
    this.internalPage = nextValue ? clonePage(nextValue) : null;
    this.committedPage = nextValue ? clonePage(nextValue) : null;
    this.queueRender();
  }

  private handleChange = (doc: ADFDoc): void => {
    this.internalValue = normalizeADF(doc);
    this.dispatchEvent(
      new CustomEvent<ADFDoc>('change', {
        detail: this.value,
        bubbles: true,
        composed: true
      })
    );
  };

  private handlePageChange = (page: AtlasEditorPage): void => {
    this.dispatchEvent(
      new CustomEvent<AtlasEditorPage>('page-change', {
        detail: clonePage(page),
        bubbles: true,
        composed: true
      })
    );
  };

  private handlePageSubmit = (payload: AtlasEditorSubmission): void => {
    this.internalValue = normalizeADF(payload.value);
    this.committedValue = normalizeADF(payload.value);
    this.internalPage = clonePage(payload.page);
    this.committedPage = clonePage(payload.page);
    this.dispatchEvent(
      new CustomEvent<AtlasEditorSubmission>('page-submit', {
        detail: {
          value: this.value,
          page: clonePage(payload.page)
        },
        bubbles: true,
        composed: true
      })
    );
  };

  private handlePageCancel = (_payload: AtlasEditorSubmission): void => {
    this.internalValue = normalizeADF(this.committedValue);
    this.internalPage = this.committedPage ? clonePage(this.committedPage) : null;
    this.dispatchEvent(
      new CustomEvent<AtlasEditorSubmission>('page-cancel', {
        detail: {
          value: this.value,
          page: this.committedPage ? clonePage(this.committedPage) : createFallbackPage()
        },
        bubbles: true,
        composed: true
      })
    );
  };

  private handleEditModeChange = (isEditing: boolean): void => {
    this.dispatchEvent(
      new CustomEvent<boolean>('edit-mode-change', {
        detail: isEditing,
        bubbles: true,
        composed: true
      })
    );
  };

  private renderLoadingState(): void {
    if (!this.mountPoint) {
      return;
    }

    this.mountPoint.className = `atlas-editor-element-root${this.internalDarkMode ? ' atlas-editor-element-root--dark' : ''}`;
    this.mountPoint.innerHTML = `
      <div class="atlas-editor-loader" role="status" aria-live="polite">
        <span class="atlas-editor-loader__spinner" aria-hidden="true"></span>
        <span class="atlas-editor-loader__label">Loading Confluence editor...</span>
      </div>
    `;
  }

  private queueRender(): void {
    if (!this.root || this.renderQueued) {
      return;
    }

    this.renderQueued = true;
    queueMicrotask(() => {
      this.renderQueued = false;
      this.render();
    });
  }

  private render(): void {
    if (!this.root) {
      return;
    }

    const renderKey = JSON.stringify({
      value: stableADFString(this.internalValue),
      page: this.internalPage,
      readOnly: this.internalReadOnly,
      mode: this.internalMode,
      darkMode: this.internalDarkMode,
      debounceMs: this.internalDebounceMs,
      placeholder: this.internalPlaceholder
    });

    if (renderKey === this.lastRenderKey) {
      return;
    }

    this.lastRenderKey = renderKey;
    this.root.render(
      <AtlaskitEditor
        value={this.internalValue}
        readOnly={this.internalReadOnly}
        mode={this.internalMode}
        darkMode={this.internalDarkMode}
        debounceMs={this.internalDebounceMs}
        placeholder={this.internalPlaceholder}
        page={this.internalPage}
        onChange={this.handleChange}
        onPageChange={this.handlePageChange}
        onPageSubmit={this.handlePageSubmit}
        onPageCancel={this.handlePageCancel}
        onEditModeChange={this.handleEditModeChange}
      />
    );

    if (!this.readyDispatched) {
      this.readyDispatched = true;
      queueMicrotask(() => {
        if (!this.isConnected) {
          return;
        }

        this.dispatchEvent(new CustomEvent('ready', { bubbles: true, composed: true }));
      });
    }
  }
}

export function defineAtlaskitEditorElement(tagName = 'atlas-editor'): void {
  registerEditorElement(tagName);

  if (tagName === 'atlas-editor') {
    registerEditorElement('atlaskit-editor', createAliasEditorElement());
  }

  if (tagName === 'atlaskit-editor') {
    registerEditorElement('atlas-editor', createAliasEditorElement());
  }
}

function coerceBoolean(value: unknown): boolean {
  return value !== false && value !== 'false' && value !== null && value !== undefined;
}

function createAliasEditorElement(): typeof AtlaskitEditorElement {
  return class AtlaskitEditorAliasElement extends AtlaskitEditorElement {};
}

function registerEditorElement(tagName: string, elementClass: typeof HTMLElement = AtlaskitEditorElement): void {
  if (customElements.get(tagName)) {
    return;
  }

  customElements.define(tagName, elementClass);
}

function clonePage(page: AtlasEditorPage): AtlasEditorPage {
  return {
    ...page,
    metaItems: [...(page.metaItems ?? [])]
  };
}

function createFallbackPage(): AtlasEditorPage {
  return {
    title: 'Untitled page',
    authorName: 'Unknown author',
    authorInitials: 'U',
    updatedText: 'Updated just now',
    metaItems: [],
    statusText: 'Rough draft',
    statusAppearance: 'default',
    widthMode: 'centered',
    titleAlignment: 'left'
  };
}
