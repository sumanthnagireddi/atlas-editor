import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
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

type AtlaskitNavigationElementContract = HTMLElement & {
  activeItem: string;
};

const NAVIGATION_ASSET_VERSION = '2026-05-04-3';

@Component({
  selector: 'app-atlaskit-navigation-host',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <atlas-sidebar
      #navigationElement
      class="navigation-element"
      [attr.active-item]="activeItem">
    </atlas-sidebar>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      .navigation-element {
        display: block;
        height: 100%;
      }
    `
  ]
})
export class AtlaskitNavigationHostComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() activeItem = 'editor';

  @Output() readonly itemSelect = new EventEmitter<string>();
  @Output() readonly navigationError = new EventEmitter<unknown>();

  @ViewChild('navigationElement', { static: true })
  private navigationRef?: ElementRef<AtlaskitNavigationElementContract>;

  private removeSelectListener?: () => void;
  private initialized = false;

  constructor(private readonly zone: NgZone) {}

  async ngAfterViewInit(): Promise<void> {
    try {
      const { defineAtlaskitNavigationElement } = await loadNavigationElementModule();
      defineAtlaskitNavigationElement();
      this.initialized = true;
      this.bindEvents();
      this.syncElementProperties();
    } catch (error) {
      this.navigationError.emit(error);
    }
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.syncElementProperties();
  }

  ngOnDestroy(): void {
    this.removeSelectListener?.();
  }

  private bindEvents(): void {
    const navigation = this.navigationRef?.nativeElement;

    if (!navigation || this.removeSelectListener) {
      return;
    }

    this.zone.runOutsideAngular(() => {
      const handleSelect = (event: Event): void => {
        const detail = (event as CustomEvent<string>).detail;
        this.zone.run(() => this.itemSelect.emit(detail));
      };

      navigation.addEventListener('item-select', handleSelect);
      this.removeSelectListener = () => navigation.removeEventListener('item-select', handleSelect);
    });
  }

  private syncElementProperties(): void {
    if (!this.initialized) {
      return;
    }

    const navigation = this.navigationRef?.nativeElement;

    if (!navigation) {
      return;
    }

    navigation.activeItem = this.activeItem;
  }
}

async function loadNavigationElementModule(): Promise<{
  defineAtlaskitNavigationElement: () => void;
}> {
  ensureBrowserProcessShim();
  ensureNavigationStylesheet();

  const importNavigation = new Function('path', 'return import(path)') as (
    path: string
  ) => Promise<{ defineAtlaskitNavigationElement: () => void }>;

  return importNavigation(
    `/assets/atlaskit-navigation/atlas-atlaskit-navigation.js?v=${NAVIGATION_ASSET_VERSION}`
  );
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
}

function ensureNavigationStylesheet(): void {
  const href = '/assets/atlaskit-navigation/atlaskit-navigation.css';

  if (document.querySelector(`link[href="${href}"]`)) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.append(link);
}
