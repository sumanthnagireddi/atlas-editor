import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AtlaskitSideNav } from './AtlaskitSideNav';
import type { AtlasSideNavActionDetail, AtlasSideNavExpandDetail, AtlasSideNavInvokeDetail, AtlasSideNavModel } from './types';

export class AtlaskitSideNavElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['dark-mode'];
  }

  private root: Root | null = null;
  private mountPoint: HTMLDivElement | null = null;
  private internalModel: AtlasSideNavModel = createFallbackModel();
  private internalDarkMode = false;
  private readyDispatched = false;

  connectedCallback(): void {
    if (!this.mountPoint) {
      this.mountPoint = document.createElement('div');
      this.mountPoint.className = 'atlas-side-nav-element-root';
      this.append(this.mountPoint);
    }

    if (!this.root) {
      this.root = createRoot(this.mountPoint);
    }

    this.render();
  }

  disconnectedCallback(): void {
    this.root?.unmount();
    this.root = null;
    this.readyDispatched = false;
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (name === 'dark-mode') {
      this.darkMode = newValue !== null;
    }
  }

  get model(): AtlasSideNavModel {
    return structuredClone(this.internalModel);
  }

  set model(nextValue: AtlasSideNavModel) {
    this.internalModel = structuredClone(nextValue);
    this.render();
  }

  get darkMode(): boolean {
    return this.internalDarkMode;
  }

  set darkMode(nextValue: boolean) {
    this.internalDarkMode = nextValue !== false && nextValue !== null && nextValue !== undefined;
    this.render();
  }

  private handleInvoke = (detail: AtlasSideNavInvokeDetail): void => {
    this.dispatchEvent(new CustomEvent<AtlasSideNavInvokeDetail>('item-invoke', { detail, bubbles: true, composed: true }));
  };

  private handleActionInvoke = (detail: AtlasSideNavActionDetail): void => {
    this.dispatchEvent(new CustomEvent<AtlasSideNavActionDetail>('action-invoke', { detail, bubbles: true, composed: true }));
  };

  private handleExpandChange = (detail: AtlasSideNavExpandDetail): void => {
    this.dispatchEvent(new CustomEvent<AtlasSideNavExpandDetail>('expand-change', { detail, bubbles: true, composed: true }));
  };

  private handleFlyoutOpenChange = (detail: AtlasSideNavExpandDetail): void => {
    this.dispatchEvent(new CustomEvent<AtlasSideNavExpandDetail>('flyout-open-change', { detail, bubbles: true, composed: true }));
  };

  private render(): void {
    if (!this.root) {
      return;
    }

    this.root.render(
      <AtlaskitSideNav
        model={this.internalModel}
        darkMode={this.internalDarkMode}
        onInvoke={this.handleInvoke}
        onActionInvoke={this.handleActionInvoke}
        onExpandChange={this.handleExpandChange}
        onFlyoutOpenChange={this.handleFlyoutOpenChange}
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

export function defineAtlaskitSideNavElement(tagName = 'atlas-side-nav'): void {
  registerSideNavElement(tagName);

  if (tagName === 'atlas-side-nav') {
    registerSideNavElement('atlaskit-side-nav', createAliasElement());
  }

  if (tagName === 'atlaskit-side-nav') {
    registerSideNavElement('atlas-side-nav', createAliasElement());
  }
}

function registerSideNavElement(tagName: string, elementClass: typeof HTMLElement = AtlaskitSideNavElement): void {
  if (customElements.get(tagName)) {
    return;
  }

  customElements.define(tagName, elementClass);
}

function createAliasElement(): typeof AtlaskitSideNavElement {
  return class AtlaskitSideNavAliasElement extends AtlaskitSideNavElement {};
}

function createFallbackModel(): AtlasSideNavModel {
  return {
    label: 'Atlas side navigation',
    header: {
      title: 'Navigation',
      description: 'Official Atlaskit side nav items'
    },
    sections: []
  };
}
