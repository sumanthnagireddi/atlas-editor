import { Component, computed, signal } from '@angular/core';
import { AtlaskitSideNavHostComponent } from './atlaskit-side-nav-host.component';

type AtlasSideNavIconKey =
  | 'home'
  | 'project'
  | 'star'
  | 'recent'
  | 'apps'
  | 'folder'
  | 'dashboard'
  | 'board'
  | 'settings'
  | 'page'
  | 'person'
  | 'add'
  | 'more'
  | 'search'
  | 'filter'
  | 'chevron-right'
  | 'clock';

type AtlasSideNavAffix = {
  type: 'badge' | 'lozenge' | 'text';
  text: string;
  appearance?: 'default' | 'new' | 'inprogress' | 'moved' | 'removed' | 'success';
};

type AtlasSideNavElemBeforeAppearance =
  | 'icon'
  | 'container-avatar'
  | 'app-tile'
  | 'spacer'
  | 'none';

type AtlasSideNavAction = {
  id: string;
  label: string;
  icon: AtlasSideNavIconKey;
};

type AtlasSideNavItemBase = {
  id: string;
  label: string;
  description?: string;
  icon?: AtlasSideNavIconKey;
  elemBeforeAppearance?: AtlasSideNavElemBeforeAppearance;
  elemBeforeText?: string;
  isSelected?: boolean;
  isDisabled?: boolean;
  elemAfter?: AtlasSideNavAffix[];
  actions?: AtlasSideNavAction[];
  actionsOnHover?: AtlasSideNavAction[];
};

type AtlasSideNavLinkItem = AtlasSideNavItemBase & {
  kind: 'link';
  href: string;
};

type AtlasSideNavButtonItem = AtlasSideNavItemBase & {
  kind: 'button';
};

type AtlasSideNavExpandableItem = AtlasSideNavItemBase & {
  kind: 'expandable';
  variant?: 'button' | 'link';
  href?: string;
  isOpen?: boolean;
  children: AtlasSideNavNode[];
};

type AtlasSideNavFlyout = {
  title: string;
  searchPlaceholder?: string;
  footerLabel?: string;
  emptyStateText?: string;
  items?: AtlasSideNavNode[];
  sections?: AtlasSideNavFlyoutSection[];
};

type AtlasSideNavFlyoutItem = AtlasSideNavItemBase & {
  kind: 'flyout';
  flyout: AtlasSideNavFlyout;
};

type AtlasSideNavSpacer = {
  kind: 'spacer';
  id: string;
};

type AtlasSideNavItem =
  | AtlasSideNavLinkItem
  | AtlasSideNavButtonItem
  | AtlasSideNavExpandableItem
  | AtlasSideNavFlyoutItem;

type AtlasSideNavNode = AtlasSideNavItem | AtlasSideNavSpacer;

type AtlasSideNavSection = {
  id: string;
  title?: string;
  hasSeparator?: boolean;
  items: AtlasSideNavNode[];
};

type AtlasSideNavFlyoutSection = {
  id: string;
  title?: string;
  items: AtlasSideNavNode[];
};

type AtlasSideNavHeader = {
  title: string;
  description?: string;
  icon?: AtlasSideNavIconKey;
};

type AtlasSideNavModel = {
  label: string;
  header?: AtlasSideNavHeader | null;
  sections: AtlasSideNavSection[];
  footerSections?: AtlasSideNavSection[];
  isLoading?: boolean;
};

type AtlasSideNavInvokeDetail = {
  itemId: string;
  kind: AtlasSideNavItem['kind'];
  href?: string;
};

type AtlasSideNavActionDetail = {
  itemId: string;
  actionId: string;
  source: 'actions' | 'actionsOnHover' | 'flyout-footer';
};

type AtlasSideNavExpandDetail = {
  itemId: string;
  isOpen: boolean;
};

@Component({
  selector: 'app-side-nav-demo',
  standalone: true,
  imports: [AtlaskitSideNavHostComponent],
  template: `
    <section class="nav-demo">
      <aside class="nav-demo__panel">
        <div class="nav-demo__section">
          <div class="nav-demo__title">Consumer inputs</div>

          <label class="nav-demo__toggle">
            <input type="checkbox" [checked]="darkMode()" (change)="darkMode.set(!darkMode())" />
            <span>darkMode</span>
          </label>

          <label class="nav-demo__toggle">
            <input type="checkbox" [checked]="isLoading()" (change)="toggleLoading()" />
            <span>isLoading</span>
          </label>
        </div>

        <div class="nav-demo__section">
          <div class="nav-demo__title">Actions</div>

          <div class="nav-demo__actions">
            <button type="button" (click)="resetModel()">Reset model</button>
            <button type="button" (click)="selectItem('button-selected')">Select button item</button>
            <button type="button" (click)="selectItem('flyout-selected')">Select flyout item</button>
            <button type="button" (click)="mutateModelInPlace()">Mutate JSON in place</button>
          </div>
        </div>

        <div class="nav-demo__section">
          <div class="nav-demo__title">Outputs</div>
          <div class="nav-demo__output">
            <div><strong>ready:</strong> {{ readyCount() }}</div>
            <div><strong>itemInvoke:</strong> {{ itemInvokeCount() }}</div>
            <div><strong>actionInvoke:</strong> {{ actionInvokeCount() }}</div>
            <div><strong>expandChange:</strong> {{ expandChangeCount() }}</div>
            <div><strong>flyoutOpenChange:</strong> {{ flyoutOpenChangeCount() }}</div>
          </div>
        </div>

        <div class="nav-demo__section">
          <div class="nav-demo__title">Last event</div>
          <pre class="nav-demo__json">{{ lastEventText() }}</pre>
        </div>

        <div class="nav-demo__section">
          <div class="nav-demo__title">Current model</div>
          <pre class="nav-demo__json">{{ modelText() }}</pre>
        </div>
      </aside>

      <div class="nav-demo__stage">
        <div class="nav-demo__frame">
          <app-atlaskit-side-nav-host
            [model]="model()"
            [darkMode]="darkMode()"
            (ready)="handleReady()"
            (itemInvoke)="handleItemInvoke($event)"
            (actionInvoke)="handleActionInvoke($event)"
            (expandChange)="handleExpandChange($event)"
            (flyoutOpenChange)="handleFlyoutOpenChange($event)">
          </app-atlaskit-side-nav-host>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .nav-demo {
        display: grid;
        grid-template-columns: 320px minmax(0, 1fr);
        gap: 20px;
      }

      .nav-demo__panel {
        align-self: start;
        padding: 16px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.04);
      }

      :host-context(.playground-shell--light) .nav-demo__panel {
        border-color: #dfe1e6;
        background: #ffffff;
      }

      .nav-demo__section + .nav-demo__section {
        margin-top: 18px;
        padding-top: 18px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }

      :host-context(.playground-shell--light) .nav-demo__section + .nav-demo__section {
        border-top-color: #ebecf0;
      }

      .nav-demo__title {
        margin-bottom: 12px;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #9fadbc;
      }

      :host-context(.playground-shell--light) .nav-demo__title {
        color: #44546f;
      }

      .nav-demo__toggle {
        display: grid;
        grid-template-columns: 18px 1fr;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
        font-size: 14px;
      }

      .nav-demo__actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .nav-demo__actions button {
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

      :host-context(.playground-shell--light) .nav-demo__actions button {
        border-color: #c7d1db;
        background: #ffffff;
      }

      .nav-demo__output {
        display: grid;
        gap: 6px;
        font-size: 14px;
      }

      .nav-demo__json {
        max-height: 240px;
        margin: 0;
        overflow: auto;
        padding: 12px;
        border-radius: 10px;
        background: #16181d;
        color: #dfe1e6;
        font: 12px/1.5 Consolas, "SFMono-Regular", monospace;
      }

      :host-context(.playground-shell--light) .nav-demo__json {
        background: #f7f8f9;
        color: #172b4d;
      }

      .nav-demo__stage {
        min-width: 0;
      }

      .nav-demo__frame {
        width: min(980px, 100%);
        min-height: 820px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        overflow: hidden;
        background: #1d2125;
      }

      :host-context(.playground-shell--light) .nav-demo__frame {
        border-color: #dfe1e6;
        background: #ffffff;
      }

      @media (max-width: 1160px) {
        .nav-demo {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class SideNavDemoComponent {
  readonly darkMode = signal(true);
  readonly isLoading = signal(false);
  readonly model = signal<AtlasSideNavModel>(createSideNavModel());
  readonly readyCount = signal(0);
  readonly itemInvokeCount = signal(0);
  readonly actionInvokeCount = signal(0);
  readonly expandChangeCount = signal(0);
  readonly flyoutOpenChangeCount = signal(0);
  readonly lastEvent = signal<Record<string, unknown>>({ type: 'none' });
  readonly lastEventText = computed(() => JSON.stringify(this.lastEvent(), null, 2));
  readonly modelText = computed(() => JSON.stringify(this.model(), null, 2));

  resetModel(): void {
    this.model.set(createSideNavModel(this.isLoading()));
    this.lastEvent.set({ type: 'resetModel' });
  }

  toggleLoading(): void {
    this.isLoading.update((currentValue) => {
      const nextValue = !currentValue;
      this.model.update((currentModel) => ({ ...currentModel, isLoading: nextValue }));
      return nextValue;
    });
  }

  selectItem(itemId: string): void {
    this.model.update((currentModel) => ({
      ...currentModel,
      sections: currentModel.sections.map((section) => ({
        ...section,
        items: markSelectedItem(section.items, itemId)
      }))
    }));
  }

  mutateModelInPlace(): void {
    const currentModel = this.model();
    const targetSection = currentModel.sections[0];

    if (!targetSection) {
      return;
    }

    targetSection.items = [
      ...targetSection.items,
      {
        id: `dynamic-link-${Date.now()}`,
        kind: 'link',
        label: 'Dynamically added item',
        description: 'Added by mutating the existing JSON object',
        href: '/demo/dynamic-link',
        icon: 'page'
      }
    ];

    this.lastEvent.set({
      type: 'mutateModelInPlace',
      addedItemCount: targetSection.items.length
    });
  }

  handleItemInvoke(detail: AtlasSideNavInvokeDetail): void {
    this.itemInvokeCount.update((count) => count + 1);
    this.lastEvent.set({ type: 'itemInvoke', ...detail });
    this.selectItem(detail.itemId);
  }

  handleReady(): void {
    this.readyCount.update((count) => count + 1);
    this.lastEvent.set({ type: 'ready' });
  }

  handleActionInvoke(detail: AtlasSideNavActionDetail): void {
    this.actionInvokeCount.update((count) => count + 1);
    this.lastEvent.set({ type: 'actionInvoke', ...detail });
  }

  handleExpandChange(detail: AtlasSideNavExpandDetail): void {
    this.expandChangeCount.update((count) => count + 1);
    this.lastEvent.set({ type: 'expandChange', ...detail });
    this.model.update((currentModel) => ({
      ...currentModel,
      sections: currentModel.sections.map((section) => ({
        ...section,
        items: patchExpandableState(section.items, detail)
      }))
    }));
  }

  handleFlyoutOpenChange(detail: AtlasSideNavExpandDetail): void {
    this.flyoutOpenChangeCount.update((count) => count + 1);
    this.lastEvent.set({ type: 'flyoutOpenChange', ...detail });
  }
}

function createSideNavModel(isLoading = false): AtlasSideNavModel {
  return {
    label: 'Side nav items',
    header: {
      title: 'Side nav items',
      description: 'Atlaskit navigation package demo',
      icon: 'apps'
    },
    isLoading,
    sections: [
      {
        id: 'link-section',
        title: 'Link menu item',
        items: [
          {
            id: 'link-icon',
            kind: 'link',
            label: 'Link menu item (icon)',
            href: '/demo/link-icon',
            icon: 'home'
          },
          {
            id: 'link-avatar',
            kind: 'link',
            label: 'Link menu item (ContainerAvatar)',
            href: '/demo/link-avatar',
            elemBeforeAppearance: 'container-avatar',
            elemBeforeText: 'Atlas'
          },
          {
            id: 'link-app',
            kind: 'link',
            label: 'Link menu item (app tile)',
            href: '/demo/link-app',
            elemBeforeAppearance: 'app-tile'
          },
          {
            id: 'link-spacer',
            kind: 'link',
            label: 'Link menu item (spacer)',
            href: '/demo/link-spacer',
            elemBeforeAppearance: 'spacer'
          },
          {
            id: 'link-none',
            kind: 'link',
            label: 'Link menu item (no elemBefore)',
            href: '/demo/link-none',
            elemBeforeAppearance: 'none'
          },
          {
            id: 'link-description',
            kind: 'link',
            label: 'Link menu item',
            description: 'With description underneath',
            href: '/demo/link-description',
            icon: 'home'
          },
          {
            id: 'link-actions',
            kind: 'link',
            label: 'Link menu item (actions)',
            href: '/demo/link-actions',
            icon: 'home',
            actions: [
              { id: 'link-create', label: 'Create', icon: 'add' },
              { id: 'link-more', label: 'More actions', icon: 'more' }
            ]
          },
          {
            id: 'link-hover-actions',
            kind: 'link',
            label: 'Link menu item (actionsOnHover)',
            href: '/demo/link-hover-actions',
            icon: 'home',
            actionsOnHover: [{ id: 'link-hover-more', label: 'More actions', icon: 'more' }]
          },
          {
            id: 'link-after',
            kind: 'link',
            label: 'Link menu item (elemAfter)',
            href: '/demo/link-after',
            icon: 'home',
            elemAfter: [{ type: 'lozenge', text: 'NEW', appearance: 'new' }]
          }
        ]
      },
      {
        id: 'button-section',
        title: 'Button menu item',
        hasSeparator: true,
        items: [
          {
            id: 'button-icon',
            kind: 'button',
            label: 'Button menu item (icon)',
            icon: 'home'
          },
          {
            id: 'button-avatar',
            kind: 'button',
            label: 'Button menu item (ContainerAvatar)',
            elemBeforeAppearance: 'container-avatar',
            elemBeforeText: 'Atlas'
          },
          {
            id: 'button-app',
            kind: 'button',
            label: 'Button menu item (app tile)',
            elemBeforeAppearance: 'app-tile'
          },
          {
            id: 'button-spacer',
            kind: 'button',
            label: 'Button menu item (spacer)',
            elemBeforeAppearance: 'spacer'
          },
          {
            id: 'button-none',
            kind: 'button',
            label: 'Button menu item (no elemBefore)',
            elemBeforeAppearance: 'none'
          },
          {
            id: 'button-description',
            kind: 'button',
            label: 'Button menu item',
            description: 'With description underneath',
            icon: 'home'
          },
          {
            id: 'button-disabled',
            kind: 'button',
            label: 'Button menu item (disabled)',
            icon: 'home',
            isDisabled: true
          },
          {
            id: 'button-selected',
            kind: 'button',
            label: 'Button menu item (selected)',
            icon: 'home',
            isSelected: true
          }
        ]
      },
      {
        id: 'expandable-default',
        title: 'Expandable menu item (default)',
        hasSeparator: true,
        items: [
          {
            id: 'exp-default',
            kind: 'expandable',
            label: 'Exp default menu item (default)',
            isOpen: true,
            children: [
              {
                id: 'exp-default-icon',
                kind: 'button',
                label: 'Exp default menu item (icon)',
                icon: 'home'
              },
              {
                id: 'exp-default-avatar',
                kind: 'button',
                label: 'Exp default menu item (ContainerAvatar)',
                elemBeforeAppearance: 'container-avatar',
                elemBeforeText: 'Atlas'
              },
              {
                id: 'exp-default-app',
                kind: 'button',
                label: 'Exp default menu item (app tile)',
                elemBeforeAppearance: 'app-tile'
              },
              {
                id: 'exp-default-level0',
                kind: 'expandable',
                label: 'Exp default menu item (level 0)',
                isOpen: true,
                children: [
                  {
                    id: 'exp-default-level1-a',
                    kind: 'button',
                    label: 'Exp default menu item (level 1)',
                    icon: 'project'
                  },
                  {
                    id: 'exp-default-level1-b',
                    kind: 'button',
                    label: 'Exp default menu item (level 1)',
                    icon: 'project'
                  },
                  {
                    id: 'exp-default-level2',
                    kind: 'button',
                    label: 'Exp default menu item (level 2)',
                    icon: 'board'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'expandable-link',
        title: 'Expandable menu item (link)',
        hasSeparator: true,
        items: [
          {
            id: 'exp-link',
            kind: 'expandable',
            variant: 'link',
            label: 'Exp link menu item (default)',
            href: '/demo/exp-link',
            isOpen: true,
            children: [
              {
                id: 'exp-link-icon',
                kind: 'link',
                label: 'Exp link menu item (icon)',
                href: '/demo/exp-link-icon',
                icon: 'home'
              },
              {
                id: 'exp-link-avatar',
                kind: 'link',
                label: 'Exp link menu item (ContainerAvatar)',
                href: '/demo/exp-link-avatar',
                elemBeforeAppearance: 'container-avatar',
                elemBeforeText: 'Atlas'
              },
              {
                id: 'exp-link-actions',
                kind: 'link',
                label: 'Exp link menu item (actions & actionsOnHover)',
                href: '/demo/exp-link-actions',
                icon: 'home',
                actions: [{ id: 'exp-link-add', label: 'Add item', icon: 'add' }],
                actionsOnHover: [{ id: 'exp-link-more', label: 'More actions', icon: 'more' }]
              },
              {
                id: 'exp-link-after',
                kind: 'link',
                label: 'Exp link menu item (elemAfter)',
                href: '/demo/exp-link-after',
                icon: 'home',
                elemAfter: [{ type: 'lozenge', text: 'NEW', appearance: 'new' }]
              }
            ]
          }
        ]
      },
      {
        id: 'flyout-section',
        title: 'Flyout menu item',
        hasSeparator: true,
        items: [
          {
            id: 'flyout-selected',
            kind: 'flyout',
            label: 'Flyout menu item (selected state)',
            icon: 'recent',
            isSelected: true,
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
                      href: '/demo/recent-kanban',
                      icon: 'board'
                    },
                    {
                      id: 'recent-business',
                      kind: 'link',
                      label: 'Business projects',
                      description: '6 days ago',
                      href: '/demo/recent-business',
                      elemBeforeAppearance: 'app-tile'
                    }
                  ]
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
                      href: '/demo/recent-ko-board',
                      icon: 'board'
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    ]
  };
}

function markSelectedItem(nodes: AtlasSideNavNode[], selectedId: string): AtlasSideNavNode[] {
  return nodes.map((node) => {
    if (node.kind === 'spacer') {
      return node;
    }

    if (node.kind === 'expandable') {
      return {
        ...node,
        isSelected: node.id === selectedId,
        children: markSelectedItem(node.children, selectedId)
      };
    }

    if (node.kind === 'flyout') {
      return {
        ...node,
        isSelected: node.id === selectedId,
        flyout: {
          ...node.flyout,
          items: node.flyout.items ? markSelectedItem(node.flyout.items, selectedId) : undefined,
          sections: node.flyout.sections?.map((section) => ({
            ...section,
            items: markSelectedItem(section.items, selectedId)
          }))
        }
      };
    }

    return {
      ...node,
      isSelected: node.id === selectedId
    };
  });
}

function patchExpandableState(nodes: AtlasSideNavNode[], detail: AtlasSideNavExpandDetail): AtlasSideNavNode[] {
  return nodes.map((node) => {
    if (node.kind === 'spacer') {
      return node;
    }

    if (node.kind === 'expandable') {
      return {
        ...node,
        isOpen: node.id === detail.itemId ? detail.isOpen : node.isOpen,
        children: patchExpandableState(node.children, detail)
      };
    }

    if (node.kind === 'flyout') {
      return {
        ...node,
        flyout: {
          ...node.flyout,
          items: node.flyout.items ? patchExpandableState(node.flyout.items, detail) : undefined,
          sections: node.flyout.sections?.map((section) => ({
            ...section,
            items: patchExpandableState(section.items, detail)
          }))
        }
      };
    }

    return node;
  });
}
