import React, { memo, useEffect, useMemo, useState } from 'react';
import Avatar from '@atlaskit/avatar';
import Button from '@atlaskit/button';
import Badge from '@atlaskit/badge';
import AddIcon from '@atlaskit/icon/core/add';
import BoardIcon from '@atlaskit/icon/core/board';
import ChevronDownIcon from '@atlaskit/icon/core/chevron-down';
import ChevronRightIcon from '@atlaskit/icon/core/chevron-right';
import ClockIcon from '@atlaskit/icon/core/clock';
import CloseIcon from '@atlaskit/icon/core/close';
import DashboardIcon from '@atlaskit/icon/core/dashboard';
import FilterIcon from '@atlaskit/icon/core/filter';
import FolderClosedIcon from '@atlaskit/icon/core/folder-closed';
import HomeIcon from '@atlaskit/icon/core/home';
import PageIcon from '@atlaskit/icon/core/page';
import PersonIcon from '@atlaskit/icon/core/person';
import ProjectIcon from '@atlaskit/icon/core/project';
import SearchIcon from '@atlaskit/icon/core/search';
import ShowMoreHorizontalIcon from '@atlaskit/icon/core/show-more-horizontal';
import StarStarredIcon from '@atlaskit/icon/core/star-starred';
import Lozenge from '@atlaskit/lozenge';
import Popup from '@atlaskit/popup';
import { Section, SideNavigation, Header, NavigationContent, NavigationFooter, NavigationHeader, SkeletonHeadingItem, SkeletonItem } from '@atlaskit/side-navigation';
import Textfield from '@atlaskit/textfield';
import { setGlobalTheme } from '@atlaskit/tokens';
import type {
  AtlasSideNavAction,
  AtlasSideNavActionDetail,
  AtlasSideNavAffix,
  AtlasSideNavExpandDetail,
  AtlasSideNavFlyout,
  AtlasSideNavFlyoutItem,
  AtlasSideNavFlyoutSection,
  AtlasSideNavIconKey,
  AtlasSideNavInvokeDetail,
  AtlasSideNavItem,
  AtlasSideNavModel,
  AtlasSideNavNode,
  AtlasSideNavSection,
  AtlaskitSideNavProps
} from './types';
import './styles.css';

const THEME_THEME_ID = 'light:light dark:dark spacing:spacing typography:typography shape:shape motion:motion';

type IconComponentProps = {
  label?: string;
  size?: string | number;
  color?: string;
  primaryColor?: string;
  secondaryColor?: string;
};

type IconComponent = React.ComponentType<IconComponentProps>;

const ICONS: Record<AtlasSideNavIconKey, IconComponent> = {
  home: HomeIcon,
  project: ProjectIcon,
  star: StarStarredIcon,
  recent: ClockIcon,
  apps: DashboardIcon,
  folder: FolderClosedIcon,
  dashboard: DashboardIcon,
  board: BoardIcon,
  settings: ShowMoreHorizontalIcon,
  page: PageIcon,
  person: PersonIcon,
  add: AddIcon,
  more: ShowMoreHorizontalIcon,
  search: SearchIcon,
  filter: FilterIcon,
  'chevron-right': ChevronRightIcon,
  clock: ClockIcon
};

export const AtlaskitSideNav = memo(function AtlaskitSideNav({
  model,
  darkMode = false,
  onInvoke,
  onActionInvoke,
  onExpandChange,
  onFlyoutOpenChange
}: AtlaskitSideNavProps): React.JSX.Element {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(() =>
    collectExpandableState(model)
  );
  const [openFlyouts, setOpenFlyouts] = useState<Record<string, boolean>>({});
  const [flyoutSearch, setFlyoutSearch] = useState<Record<string, string>>({});

  useEffect(() => {
    setExpandedItems((currentState) => syncExpandableState(currentState, model));
  }, [model]);

  useEffect(() => {
    setOpenFlyouts((currentState) => syncFlyoutState(currentState, model));
  }, [model]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const html = document.documentElement;
    const previousTheme = {
      theme: html.getAttribute('data-theme'),
      colorMode: html.getAttribute('data-color-mode'),
      contrastMode: html.getAttribute('data-contrast-mode')
    };

    let disposed = false;
    let unbindThemeListener: (() => void) | undefined;

    void setGlobalTheme({
      colorMode: darkMode ? 'dark' : 'light',
      dark: 'dark',
      light: 'light',
      spacing: 'spacing',
      typography: 'typography',
      shape: 'shape',
      motion: 'motion'
    })
      .then((unbind) => {
        if (disposed) {
          unbind?.();
          return;
        }

        unbindThemeListener = unbind;
      })
      .catch((error) => {
        console.warn('Unable to apply Atlaskit global theme for side navigation surface', error);
      });

    return () => {
      disposed = true;
      unbindThemeListener?.();
      restoreThemeAttribute(html, 'data-theme', previousTheme.theme);
      restoreThemeAttribute(html, 'data-color-mode', previousTheme.colorMode);
      restoreThemeAttribute(html, 'data-contrast-mode', previousTheme.contrastMode);
    };
  }, [darkMode]);

  const sections = model.sections ?? [];
  const footerSections = model.footerSections ?? [];
  const isLoading = model.isLoading === true;

  const emitInvoke = (detail: AtlasSideNavInvokeDetail): void => {
    onInvoke?.(detail);
  };

  const emitAction = (detail: AtlasSideNavActionDetail): void => {
    onActionInvoke?.(detail);
  };

  const handleExpandToggle = (itemId: string): void => {
    setExpandedItems((currentState) => {
      const nextOpen = !currentState[itemId];
      const nextState = { ...currentState, [itemId]: nextOpen };
      onExpandChange?.({ itemId, isOpen: nextOpen });
      return nextState;
    });
  };

  const handleFlyoutToggle = (itemId: string, nextOpen?: boolean): void => {
    setOpenFlyouts((currentState) => {
      const resolvedOpen = nextOpen ?? !currentState[itemId];
      const nextState = { ...currentState, [itemId]: resolvedOpen };
      onFlyoutOpenChange?.({ itemId, isOpen: resolvedOpen });
      return nextState;
    });
  };

  const renderNode = (node: AtlasSideNavNode, depth: number, inFlyout = false): React.JSX.Element | null => {
    if (node.kind === 'spacer') {
      return <div key={node.id} className="atlas-side-nav__spacer" aria-hidden="true" />;
    }

    if (node.kind === 'expandable') {
      const isOpen = expandedItems[node.id] ?? node.isOpen ?? false;
      const expandIcon = isOpen ? ChevronDownIcon : ChevronRightIcon;
      const leading = renderElemBefore(node, {
        depth,
        fallbackIcon: expandIcon,
        applyChevronSlot: true
      });

      const primaryRow = (
        <div className={`atlas-side-nav__row atlas-side-nav__row--depth-${depth}`}>
          <div className="atlas-side-nav__row-main">
            {node.variant === 'link' ? (
              <>
                <button
                  type="button"
                  className="atlas-side-nav__toggle-button"
                  aria-label={isOpen ? `Collapse ${node.label}` : `Expand ${node.label}`}
                  aria-expanded={isOpen}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleExpandToggle(node.id);
                  }}>
                  <ChevronIcon icon={expandIcon} />
                </button>

                <a
                  href={node.href ?? '#'}
                  className={buildPrimarySurfaceClassName(node, isOpen)}
                  aria-current={node.isSelected ? 'page' : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    emitInvoke({ itemId: node.id, kind: node.kind, href: node.href });
                  }}>
                  <span className="atlas-side-nav__surface-leading">
                    {leading}
                  </span>
                  <ItemCopy item={node} />
                </a>
              </>
            ) : (
              <button
                type="button"
                className={buildPrimarySurfaceClassName(node, isOpen)}
                aria-expanded={isOpen}
                onClick={() => handleExpandToggle(node.id)}>
                <span className="atlas-side-nav__surface-leading">
                  {leading}
                </span>
                <ItemCopy item={node} />
              </button>
            )}
          </div>

          <EndCluster item={node} onActionInvoke={emitAction} disableHoverActions={isOpen} />
        </div>
      );

      return (
        <div
          key={node.id}
          className={`atlas-side-nav__group atlas-side-nav__group--depth-${depth}${isOpen ? ' atlas-side-nav__group--open' : ''}`}>
          {primaryRow}
          {isOpen ? (
            <div className="atlas-side-nav__children" role="group" aria-label={node.label}>
              {node.children.map((child) => renderNode(child, depth + 1, inFlyout))}
            </div>
          ) : null}
        </div>
      );
    }

    if (node.kind === 'flyout') {
      return (
        <FlyoutMenuItem
          key={node.id}
          item={node}
          depth={depth}
          isOpen={openFlyouts[node.id] === true}
          searchValue={flyoutSearch[node.id] ?? ''}
          darkMode={darkMode}
          onSearchChange={(nextValue) => {
            setFlyoutSearch((currentState) => ({ ...currentState, [node.id]: nextValue }));
          }}
          onToggle={(nextOpen) => handleFlyoutToggle(node.id, nextOpen)}
          onInvoke={emitInvoke}
          onActionInvoke={emitAction}
          renderNode={(childNode, childDepth) => renderNode(childNode, childDepth, true)}
        />
      );
    }

    const primarySurfaceProps = {
      className: buildPrimarySurfaceClassName(node),
      'aria-current': node.isSelected ? ('page' as const) : undefined
    };

    const leading = renderElemBefore(node, { depth });

    return (
      <div key={node.id} className={`atlas-side-nav__row atlas-side-nav__row--depth-${depth}`}>
        <div className="atlas-side-nav__row-main">
          {node.kind === 'link' ? (
            <a
              {...primarySurfaceProps}
              href={node.href}
              onClick={(event) => {
                event.preventDefault();
                emitInvoke({ itemId: node.id, kind: node.kind, href: node.href });
              }}>
              <span className="atlas-side-nav__surface-leading">{leading}</span>
              <ItemCopy item={node} />
            </a>
          ) : (
            <button
              {...primarySurfaceProps}
              type="button"
              disabled={node.isDisabled}
              onClick={() => emitInvoke({ itemId: node.id, kind: node.kind })}>
              <span className="atlas-side-nav__surface-leading">{leading}</span>
              <ItemCopy item={node} />
            </button>
          )}
        </div>

        <EndCluster item={node} onActionInvoke={emitAction} />
      </div>
    );
  };

  const renderSection = (section: AtlasSideNavSection, sectionIndex: number): React.JSX.Element => (
    <Section key={section.id} isList={false} hasSeparator={section.hasSeparator && sectionIndex > 0}>
      {section.title ? <div className="atlas-side-nav__section-heading">{section.title}</div> : null}
      <div className="atlas-side-nav__section-body">
        {section.items.map((node) => renderNode(node, 0))}
      </div>
    </Section>
  );

  const renderLoadingSection = (sectionId: string): React.JSX.Element => (
    <Section key={sectionId} isList={false}>
      <SkeletonHeadingItem width="40%" />
      <div className="atlas-side-nav__section-body atlas-side-nav__section-body--loading">
        <SkeletonItem hasIcon width="80%" />
        <SkeletonItem hasIcon width="70%" />
        <SkeletonItem hasIcon width="76%" />
      </div>
    </Section>
  );

  return (
    <div
      className={`atlas-side-nav${darkMode ? ' atlas-side-nav--dark' : ''}`}
      data-color-mode={darkMode ? 'dark' : 'light'}
      data-theme={THEME_THEME_ID}>
      <SideNavigation label={model.label}>
        <>
          {model.header ? (
            <NavigationHeader>
              <Header
                iconBefore={renderHeaderIcon(model)}
                description={model.header.description}>
                {model.header.title}
              </Header>
            </NavigationHeader>
          ) : (
            <></>
          )}

          <NavigationContent>
            {isLoading ? sections.map((section, index) => renderLoadingSection(`${section.id}-${index}`)) : sections.map(renderSection)}
          </NavigationContent>

          {footerSections.length ? (
            <NavigationFooter>
              {footerSections.map(renderSection)}
            </NavigationFooter>
          ) : (
            <></>
          )}
        </>
      </SideNavigation>
    </div>
  );
});

type FlyoutMenuItemProps = {
  item: AtlasSideNavFlyoutItem;
  depth: number;
  isOpen: boolean;
  searchValue: string;
  darkMode: boolean;
  onSearchChange: (nextValue: string) => void;
  onToggle: (nextOpen?: boolean) => void;
  onInvoke?: (detail: AtlasSideNavInvokeDetail) => void;
  onActionInvoke?: (detail: AtlasSideNavActionDetail) => void;
  renderNode: (node: AtlasSideNavNode, depth: number) => React.JSX.Element | null;
};

function FlyoutMenuItem({
  item,
  depth,
  isOpen,
  searchValue,
  darkMode,
  onSearchChange,
  onToggle,
  onInvoke,
  onActionInvoke,
  renderNode
}: FlyoutMenuItemProps): React.JSX.Element {
  const filteredSections = useMemo(() => {
    const sections = getFlyoutSections(item.flyout);
    const query = searchValue.trim().toLowerCase();

    if (!query) {
      return sections;
    }

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((node) => matchesNodeSearch(node, query))
      }))
      .filter((section) => section.items.length > 0);
  }, [item.flyout, searchValue]);

  return (
    <Popup
      isOpen={isOpen}
      placement="right-start"
      offset={[12, 0]}
      onClose={() => onToggle(false)}
      content={({ setInitialFocusRef }) => (
        <div
          ref={setInitialFocusRef as React.Ref<HTMLDivElement>}
          className={`atlas-side-nav__flyout${darkMode ? ' atlas-side-nav__flyout--dark' : ''}`}>
          <div className="atlas-side-nav__flyout-header">
            <strong>{item.flyout.title}</strong>
            <Button
              appearance="subtle"
              spacing="none"
              className="atlas-side-nav__flyout-close"
              iconBefore={<CloseIcon label="" />}
              aria-label={`Close ${item.label}`}
              onClick={() => onToggle(false)}>
              <span className="atlas-side-nav__sr-only">Close</span>
            </Button>
          </div>

          <div className="atlas-side-nav__flyout-search">
            <Textfield
              elemBeforeInput={<SearchIcon label="" />}
              placeholder={item.flyout.searchPlaceholder ?? 'Search items'}
              value={searchValue}
              onChange={(event) => onSearchChange((event.target as HTMLInputElement).value)}
            />
            <Button
              appearance="subtle"
              spacing="none"
              className="atlas-side-nav__filter-button"
              iconBefore={<FilterIcon label="" />}
            >
              <span className="atlas-side-nav__sr-only">Filter</span>
            </Button>
          </div>

          <div className="atlas-side-nav__flyout-body">
            {filteredSections.length ? (
              filteredSections.map((section) => (
                <div key={section.id} className="atlas-side-nav__flyout-section">
                  {section.title ? (
                    <div className="atlas-side-nav__flyout-section-heading">{section.title}</div>
                  ) : null}
                  <div className="atlas-side-nav__flyout-section-body">
                    {section.items.map((node) => renderNode(node, depth + 1))}
                  </div>
                </div>
              ))
            ) : (
              <div className="atlas-side-nav__flyout-empty">
                {item.flyout.emptyStateText ?? 'No items match this filter.'}
              </div>
            )}
          </div>

          {item.flyout.footerLabel ? (
            <div className="atlas-side-nav__flyout-footer">
              <Button
                appearance="subtle"
                spacing="compact"
                className="atlas-side-nav__flyout-footer-button"
                iconBefore={<ClockIcon label="" />}
                onClick={() =>
                  onActionInvoke?.({
                    itemId: item.id,
                    actionId: 'flyout-footer',
                    source: 'flyout-footer'
                  })
                }>
                {item.flyout.footerLabel}
              </Button>
            </div>
          ) : null}
        </div>
      )}
      trigger={(triggerProps) => (
        <div className={`atlas-side-nav__row atlas-side-nav__row--depth-${depth}`}>
          <button
            type="button"
            ref={triggerProps.ref as React.Ref<HTMLButtonElement>}
            aria-haspopup={triggerProps['aria-haspopup']}
            aria-expanded={triggerProps['aria-expanded']}
            aria-controls={triggerProps['aria-controls']}
            className={buildPrimarySurfaceClassName(item, isOpen)}
            onClick={() => {
              onToggle(!isOpen);
              onInvoke?.({ itemId: item.id, kind: item.kind });
            }}>
            <span className="atlas-side-nav__surface-leading">
              {renderElemBefore(item, { depth })}
            </span>
            <ItemCopy item={item} />
            <span className="atlas-side-nav__surface-chevron">
              <ChevronRightIcon label="" />
            </span>
          </button>
        </div>
      )}
    />
  );
}

type ItemCopyProps = {
  item: AtlasSideNavItem;
};

function ItemCopy({ item }: ItemCopyProps): React.JSX.Element {
  return (
    <span className="atlas-side-nav__copy">
      <span className="atlas-side-nav__label" title={item.label}>
        {item.label}
      </span>
      {item.description ? (
        <span className="atlas-side-nav__description" title={item.description}>
          {item.description}
        </span>
      ) : null}
    </span>
  );
}

type EndClusterProps = {
  item: AtlasSideNavItem;
  onActionInvoke?: (detail: AtlasSideNavActionDetail) => void;
  disableHoverActions?: boolean;
};

function EndCluster({ item, onActionInvoke, disableHoverActions = false }: EndClusterProps): React.JSX.Element | null {
  const elemAfter = item.elemAfter ?? [];
  const actions = item.actions ?? [];
  const actionsOnHover = disableHoverActions ? [] : item.actionsOnHover ?? [];

  if (!elemAfter.length && !actions.length && !actionsOnHover.length) {
    return null;
  }

  return (
    <div className="atlas-side-nav__end-cluster">
      {elemAfter.length ? <div className="atlas-side-nav__affixes">{elemAfter.map(renderAffix)}</div> : null}

      {actions.length ? (
        <div className="atlas-side-nav__actions">
          {actions.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              onClick={() =>
                onActionInvoke?.({
                  itemId: item.id,
                  actionId: action.id,
                  source: 'actions'
                })
              }
            />
          ))}
        </div>
      ) : null}

      {actionsOnHover.length ? (
        <div className="atlas-side-nav__hover-actions">
          {actionsOnHover.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              onClick={() =>
                onActionInvoke?.({
                  itemId: item.id,
                  actionId: action.id,
                  source: 'actionsOnHover'
                })
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

type ActionButtonProps = {
  action: AtlasSideNavAction;
  onClick: () => void;
};

function ActionButton({ action, onClick }: ActionButtonProps): React.JSX.Element {
  const Icon = ICONS[action.icon] ?? ShowMoreHorizontalIcon;

  return (
    <Button
      appearance="subtle"
      spacing="none"
      className="atlas-side-nav__action-button"
      iconBefore={<Icon label="" />}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      testId={`action-${action.id}`}>
      <span className="atlas-side-nav__sr-only">{action.label}</span>
    </Button>
  );
}

function renderAffix(affix: AtlasSideNavAffix, index: number): React.JSX.Element {
  if (affix.type === 'badge' && /^\d+$/.test(affix.text)) {
    return (
      <Badge key={`${affix.type}-${affix.text}-${index}`} appearance="primary">
        {Number(affix.text)}
      </Badge>
    );
  }

  if (affix.type === 'text') {
    return (
      <span key={`${affix.type}-${affix.text}-${index}`} className="atlas-side-nav__plain-affix">
        {affix.text}
      </span>
    );
  }

  return (
    <Lozenge
      key={`${affix.type}-${affix.text}-${index}`}
      appearance={affix.appearance ?? 'default'}
      isBold={affix.type === 'lozenge'}>
      {affix.text}
    </Lozenge>
  );
}

function renderHeaderIcon(model: AtlasSideNavModel): React.JSX.Element {
  const icon = model.header?.icon;

  if (!icon) {
    return <DashboardIcon label="" />;
  }

  const Icon = ICONS[icon] ?? DashboardIcon;
  return <Icon label="" />;
}

type ElemBeforeOptions = {
  depth: number;
  fallbackIcon?: IconComponent;
  applyChevronSlot?: boolean;
};

function renderElemBefore(item: AtlasSideNavItem, options: ElemBeforeOptions): React.ReactNode {
  const appearance = item.elemBeforeAppearance ?? (item.icon ? 'icon' : 'none');

  if (options.applyChevronSlot && options.fallbackIcon) {
    return <ChevronIcon icon={options.fallbackIcon} />;
  }

  if (appearance === 'spacer') {
    return <span className="atlas-side-nav__before-spacer" aria-hidden="true" />;
  }

  if (appearance === 'none') {
    return null;
  }

  if (appearance === 'container-avatar') {
    return (
      <span className="atlas-side-nav__container-avatar" aria-hidden="true">
        <Avatar
          size="small"
          name={item.elemBeforeText ?? item.label}
          label={item.elemBeforeText ?? item.label}
        />
      </span>
    );
  }

  if (appearance === 'app-tile') {
    return (
      <span className="atlas-side-nav__app-tile" aria-hidden="true">
        <DashboardIcon label="" />
      </span>
    );
  }

  const Icon = options.fallbackIcon ?? (item.icon ? ICONS[item.icon] : PageIcon);
  return (
    <span className="atlas-side-nav__icon-slot" aria-hidden="true">
      <Icon label="" />
    </span>
  );
}

type ChevronIconProps = {
  icon: IconComponent;
};

function ChevronIcon({ icon: Icon }: ChevronIconProps): React.JSX.Element {
  return (
    <span className="atlas-side-nav__chevron-slot" aria-hidden="true">
      <Icon label="" />
    </span>
  );
}

function buildPrimarySurfaceClassName(item: AtlasSideNavItem, isOpen = false): string {
  return [
    'atlas-side-nav__surface',
    item.isSelected ? 'atlas-side-nav__surface--selected' : '',
    item.isDisabled ? 'atlas-side-nav__surface--disabled' : '',
    isOpen ? 'atlas-side-nav__surface--open' : ''
  ]
    .filter(Boolean)
    .join(' ');
}

function collectExpandableState(model: AtlasSideNavModel): Record<string, boolean> {
  const state: Record<string, boolean> = {};
  const allSections = [...(model.sections ?? []), ...(model.footerSections ?? [])];

  for (const section of allSections) {
    walkNodes(section.items, (item) => {
      if (item.kind === 'expandable') {
        state[item.id] = item.isOpen ?? false;
      }
    });
  }

  return state;
}

function syncExpandableState(currentState: Record<string, boolean>, model: AtlasSideNavModel): Record<string, boolean> {
  const nextState: Record<string, boolean> = {};
  const seedState = collectExpandableState(model);

  for (const [itemId, isOpen] of Object.entries(seedState)) {
    nextState[itemId] = currentState[itemId] ?? isOpen;
  }

  return nextState;
}

function syncFlyoutState(currentState: Record<string, boolean>, model: AtlasSideNavModel): Record<string, boolean> {
  const nextState: Record<string, boolean> = {};
  const allSections = [...(model.sections ?? []), ...(model.footerSections ?? [])];

  for (const section of allSections) {
    walkNodes(section.items, (item) => {
      if (item.kind === 'flyout' && currentState[item.id]) {
        nextState[item.id] = true;
      }
    });
  }

  return nextState;
}

function walkNodes(nodes: AtlasSideNavNode[], visit: (item: AtlasSideNavItem) => void): void {
  for (const node of nodes) {
    if (node.kind === 'spacer') {
      continue;
    }

    visit(node);

    if (node.kind === 'expandable') {
      walkNodes(node.children, visit);
    }

    if (node.kind === 'flyout') {
      for (const section of getFlyoutSections(node.flyout)) {
        walkNodes(section.items, visit);
      }
    }
  }
}

function getFlyoutSections(flyout: AtlasSideNavFlyout): AtlasSideNavFlyoutSection[] {
  if (Array.isArray(flyout.sections) && flyout.sections.length > 0) {
    return flyout.sections;
  }

  return [
    {
      id: `${flyout.title.toLowerCase().replace(/\s+/g, '-')}-items`,
      items: flyout.items ?? []
    }
  ];
}

function matchesNodeSearch(node: AtlasSideNavNode, query: string): boolean {
  if (node.kind === 'spacer') {
    return false;
  }

  if (node.label.toLowerCase().includes(query) || node.description?.toLowerCase().includes(query)) {
    return true;
  }

  if (node.kind === 'expandable') {
    return node.children.some((child) => matchesNodeSearch(child, query));
  }

  if (node.kind === 'flyout') {
    return getFlyoutSections(node.flyout).some((section) =>
      section.items.some((child) => matchesNodeSearch(child, query))
    );
  }

  return false;
}

function restoreThemeAttribute(target: HTMLElement, attributeName: string, value: string | null): void {
  if (value === null) {
    target.removeAttribute(attributeName);
    return;
  }

  target.setAttribute(attributeName, value);
}
