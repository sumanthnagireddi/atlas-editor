import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AtlaskitEditor } from './AtlaskitEditor';
import { normalizeADF, stableADFString } from './adf';
import type { ADFDoc, EditorMode } from './types';

const BOOLEAN_ATTRIBUTES = new Set(['read-only', 'dark-mode']);

export class AtlaskitEditorElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['value', 'read-only', 'mode', 'dark-mode', 'debounce-ms', 'placeholder'];
  }

  private root: Root | null = null;
  private mountPoint: HTMLDivElement | null = null;
  private internalValue: ADFDoc = normalizeADF(undefined);
  private internalReadOnly = false;
  private internalMode: EditorMode = 'editor';
  private internalDarkMode = false;
  private internalDebounceMs = 250;
  private internalPlaceholder = 'Start writing...';
  private lastRenderKey = '';
  private renderQueued = false;

  connectedCallback(): void {
    if (!this.mountPoint) {
      this.mountPoint = document.createElement('div');
      this.mountPoint.className = 'atlas-editor-element-root';
      this.append(this.mountPoint);
    }

    if (!this.root) {
      this.root = createRoot(this.mountPoint);
    }

    this.queueRender();
    this.dispatchEvent(new CustomEvent('ready', { bubbles: true, composed: true }));
  }

  disconnectedCallback(): void {
    this.root?.unmount();
    this.root = null;
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (BOOLEAN_ATTRIBUTES.has(name)) {
      this[name === 'read-only' ? 'readOnly' : 'darkMode'] = newValue !== null;
      return;
    }

    if (name === 'value' && newValue) {
      this.value = JSON.parse(newValue) as ADFDoc;
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
        onChange={this.handleChange}
      />
    );
  }
}

export function defineAtlaskitEditorElement(tagName = 'atlas-editor'): void {
  registerEditorElement(tagName);

  if (tagName === 'atlas-editor') {
    registerEditorElement('atlaskit-editor');
  }
}

function coerceBoolean(value: unknown): boolean {
  return value !== false && value !== 'false' && value !== null && value !== undefined;
}

function registerEditorElement(tagName: string): void {
  if (customElements.get(tagName)) {
    return;
  }

  customElements.define(tagName, AtlaskitEditorElement);
}
