import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AtlaskitNavigation } from './AtlaskitNavigation';

export class AtlaskitNavigationElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['active-item'];
  }

  private root: Root | null = null;
  private mountPoint: HTMLDivElement | null = null;
  private internalActiveItem = 'editor';

  connectedCallback(): void {
    if (!this.mountPoint) {
      this.mountPoint = document.createElement('div');
      this.mountPoint.className = 'atlas-navigation-element-root';
      this.append(this.mountPoint);
    }

    if (!this.root) {
      this.root = createRoot(this.mountPoint);
    }

    this.render();
    this.dispatchEvent(new CustomEvent('ready', { bubbles: true, composed: true }));
  }

  disconnectedCallback(): void {
    this.root?.unmount();
    this.root = null;
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (name === 'active-item' && newValue) {
      this.activeItem = newValue;
    }
  }

  get activeItem(): string {
    return this.internalActiveItem;
  }

  set activeItem(nextValue: string) {
    this.internalActiveItem = nextValue || 'editor';
    this.render();
  }

  private handleSelect = (itemId: string): void => {
    this.internalActiveItem = itemId;
    this.dispatchEvent(
      new CustomEvent<string>('item-select', {
        detail: itemId,
        bubbles: true,
        composed: true
      })
    );
    this.render();
  };

  private render(): void {
    if (!this.root) {
      return;
    }

    this.root.render(
      <AtlaskitNavigation activeItem={this.internalActiveItem} onSelect={this.handleSelect} />
    );
  }
}

export function defineAtlaskitNavigationElement(tagName = 'atlas-sidebar'): void {
  registerNavigationElement(tagName);

  if (tagName === 'atlas-sidebar') {
    registerNavigationElement('atlaskit-navigation');
  }
}

function registerNavigationElement(tagName: string): void {
  if (customElements.get(tagName)) {
    return;
  }

  customElements.define(tagName, AtlaskitNavigationElement);
}
