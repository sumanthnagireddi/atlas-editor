import {
  AfterViewInit,
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  DoCheck,
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

export type AtlasSideNavIconKey =
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

export type AtlasSideNavAffix = {
  type: 'badge' | 'lozenge' | 'text';
  text: string;
  appearance?: 'default' | 'new' | 'inprogress' | 'moved' | 'removed' | 'success';
};

export type AtlasSideNavElemBeforeAppearance =
  | 'icon'
  | 'container-avatar'
  | 'app-tile'
  | 'spacer'
  | 'none';

export type AtlasSideNavAction = {
  id: string;
  label: string;
  icon: AtlasSideNavIconKey;
};

export type AtlasSideNavItemBase = {
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

export type AtlasSideNavLinkItem = AtlasSideNavItemBase & {
  kind: 'link';
  href: string;
};

export type AtlasSideNavButtonItem = AtlasSideNavItemBase & {
  kind: 'button';
};

export type AtlasSideNavExpandableItem = AtlasSideNavItemBase & {
  kind: 'expandable';
  variant?: 'button' | 'link';
  href?: string;
  isOpen?: boolean;
  children: AtlasSideNavNode[];
};

export type AtlasSideNavFlyout = {
  title: string;
  searchPlaceholder?: string;
  footerLabel?: string;
  emptyStateText?: string;
  items?: AtlasSideNavNode[];
  sections?: AtlasSideNavFlyoutSection[];
};

export type AtlasSideNavFlyoutItem = AtlasSideNavItemBase & {
  kind: 'flyout';
  flyout: AtlasSideNavFlyout;
};

export type AtlasSideNavSpacer = {
  kind: 'spacer';
  id: string;
};

export type AtlasSideNavItem =
  | AtlasSideNavLinkItem
  | AtlasSideNavButtonItem
  | AtlasSideNavExpandableItem
  | AtlasSideNavFlyoutItem;

export type AtlasSideNavNode = AtlasSideNavItem | AtlasSideNavSpacer;

export type AtlasSideNavSection = {
  id: string;
  title?: string;
  hasSeparator?: boolean;
  items: AtlasSideNavNode[];
};

export type AtlasSideNavFlyoutSection = {
  id: string;
  title?: string;
  items: AtlasSideNavNode[];
};

export type AtlasSideNavHeader = {
  title: string;
  description?: string;
  icon?: AtlasSideNavIconKey;
};

export type AtlasSideNavModel = {
  label: string;
  header?: AtlasSideNavHeader | null;
  sections: AtlasSideNavSection[];
  footerSections?: AtlasSideNavSection[];
  isLoading?: boolean;
};

export type AtlasSideNavInvokeDetail = {
  itemId: string;
  kind: AtlasSideNavItem['kind'];
  href?: string;
};

export type AtlasSideNavActionDetail = {
  itemId: string;
  actionId: string;
  source: 'actions' | 'actionsOnHover' | 'flyout-footer';
};

export type AtlasSideNavExpandDetail = {
  itemId: string;
  isOpen: boolean;
};

type AtlaskitSideNavElementContract = HTMLElement & {
  model: AtlasSideNavModel;
  darkMode: boolean;
};

const NAVIGATION_ASSET_VERSION = '2026-05-08-angular-lib-1';
const LOCAL_NAVIGATION_MODULE_SPECIFIER = '@sumanthnagireddi/atlas-angular/runtime/atlas-side-nav.js';
const EMPTY_MODEL: AtlasSideNavModel = {
  label: 'Atlas side navigation',
  header: {
    title: 'Navigation',
    description: 'Host wrapper'
  },
  sections: []
};

@Component({
  selector: 'app-atlaskit-side-nav-host, app-atlaskit-side-nav',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <atlas-side-nav
      #sideNavElement
      class="side-nav-element"
      [attr.dark-mode]="darkMode ? '' : null">
    </atlas-side-nav>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .side-nav-element {
        display: block;
      }
    `
  ]
})
export class AtlaskitSideNavComponent implements AfterViewInit, OnChanges, DoCheck, OnDestroy {
  @Input() model: AtlasSideNavModel | null | undefined = EMPTY_MODEL;
  @Input() darkMode = true;
  @Input() assetBaseUrl: string | null = null;

  @Output() readonly itemInvoke = new EventEmitter<AtlasSideNavInvokeDetail>();
  @Output() readonly actionInvoke = new EventEmitter<AtlasSideNavActionDetail>();
  @Output() readonly expandChange = new EventEmitter<AtlasSideNavExpandDetail>();
  @Output() readonly flyoutOpenChange = new EventEmitter<AtlasSideNavExpandDetail>();
  @Output() readonly ready = new EventEmitter<void>();
  @Output() readonly sideNavError = new EventEmitter<unknown>();

  @ViewChild('sideNavElement', { static: true })
  private sideNavRef?: ElementRef<AtlaskitSideNavElementContract>;

  private removeItemInvokeListener?: () => void;
  private removeActionInvokeListener?: () => void;
  private removeExpandChangeListener?: () => void;
  private removeFlyoutOpenChangeListener?: () => void;
  private removeReadyListener?: () => void;
  private initialized = false;
  private lastAppliedModelFingerprint = '';
  private lastAppliedDarkMode = this.darkMode;

  constructor(private readonly zone: NgZone) {}

  async ngAfterViewInit(): Promise<void> {
    try {
      await loadNavigationElementModule(this.assetBaseUrl);
      this.initialized = true;
      this.bindElementEvents();
      this.syncElementProperties();
    } catch (error) {
      this.sideNavError.emit(error);
    }
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.syncElementProperties();
  }

  ngDoCheck(): void {
    this.syncElementProperties();
  }

  ngOnDestroy(): void {
    this.removeItemInvokeListener?.();
    this.removeActionInvokeListener?.();
    this.removeExpandChangeListener?.();
    this.removeFlyoutOpenChangeListener?.();
    this.removeReadyListener?.();
  }

  private bindElementEvents(): void {
    const element = this.sideNavRef?.nativeElement;

    if (!element || this.removeItemInvokeListener) {
      return;
    }

    this.zone.runOutsideAngular(() => {
      const handleItemInvoke = (event: Event): void => {
        const detail = (event as CustomEvent<AtlasSideNavInvokeDetail>).detail;
        this.zone.run(() => this.itemInvoke.emit(detail));
      };

      const handleActionInvoke = (event: Event): void => {
        const detail = (event as CustomEvent<AtlasSideNavActionDetail>).detail;
        this.zone.run(() => this.actionInvoke.emit(detail));
      };

      const handleExpandChange = (event: Event): void => {
        const detail = (event as CustomEvent<AtlasSideNavExpandDetail>).detail;
        this.zone.run(() => this.expandChange.emit(detail));
      };

      const handleFlyoutOpenChange = (event: Event): void => {
        const detail = (event as CustomEvent<AtlasSideNavExpandDetail>).detail;
        this.zone.run(() => this.flyoutOpenChange.emit(detail));
      };

      const handleReady = (): void => {
        this.zone.run(() => this.ready.emit());
      };

      element.addEventListener('item-invoke', handleItemInvoke);
      element.addEventListener('action-invoke', handleActionInvoke);
      element.addEventListener('expand-change', handleExpandChange);
      element.addEventListener('flyout-open-change', handleFlyoutOpenChange);
      element.addEventListener('ready', handleReady);

      this.removeItemInvokeListener = () => element.removeEventListener('item-invoke', handleItemInvoke);
      this.removeActionInvokeListener = () => element.removeEventListener('action-invoke', handleActionInvoke);
      this.removeExpandChangeListener = () => element.removeEventListener('expand-change', handleExpandChange);
      this.removeFlyoutOpenChangeListener = () => element.removeEventListener('flyout-open-change', handleFlyoutOpenChange);
      this.removeReadyListener = () => element.removeEventListener('ready', handleReady);
    });
  }

  private syncElementProperties(): void {
    if (!this.initialized) {
      return;
    }

    const element = this.sideNavRef?.nativeElement;

    if (!element) {
      return;
    }

    const normalizedModel = normalizeModel(this.model);
    const nextModelFingerprint = JSON.stringify(normalizedModel);
    const shouldUpdateModel = nextModelFingerprint !== this.lastAppliedModelFingerprint;
    const shouldUpdateDarkMode = this.darkMode !== this.lastAppliedDarkMode;

    if (!shouldUpdateModel && !shouldUpdateDarkMode) {
      return;
    }

    if (shouldUpdateModel) {
      element.model = normalizedModel;
      this.lastAppliedModelFingerprint = nextModelFingerprint;
    }

    if (shouldUpdateDarkMode) {
      element.darkMode = this.darkMode;
      this.lastAppliedDarkMode = this.darkMode;
    }
  }
}

export { AtlaskitSideNavComponent as AtlaskitSideNavHostComponent };

function normalizeModel(model: AtlasSideNavModel | null | undefined): AtlasSideNavModel {
  if (!model || typeof model !== 'object') {
    return structuredClone(EMPTY_MODEL);
  }

  return structuredClone({
    label: model.label?.trim() || EMPTY_MODEL.label,
    header: model.header ?? EMPTY_MODEL.header,
    sections: Array.isArray(model.sections) ? model.sections : [],
    footerSections: Array.isArray(model.footerSections) ? model.footerSections : [],
    isLoading: model.isLoading === true
  });
}

async function loadNavigationElementModule(assetBaseUrl: string | null | undefined): Promise<void> {
  const importNavigation = new Function('path', 'return import(path)') as (
    path: string
  ) => Promise<unknown>;

  const normalizedBaseUrl = normalizeAssetBaseUrl(assetBaseUrl);

  if (normalizedBaseUrl) {
    await importNavigation(`${normalizedBaseUrl}/atlas-side-nav.js?v=${NAVIGATION_ASSET_VERSION}`);
  } else {
    await importNavigation(LOCAL_NAVIGATION_MODULE_SPECIFIER);
  }

  await customElements.whenDefined('atlas-side-nav');
}

function normalizeAssetBaseUrl(assetBaseUrl: string | null | undefined): string | null {
  const normalized = (assetBaseUrl ?? '').trim();

  if (!normalized) {
    return null;
  }

  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
}
