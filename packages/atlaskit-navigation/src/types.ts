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

export interface AtlaskitSideNavProps {
  model: AtlasSideNavModel;
  darkMode?: boolean;
  onInvoke?: (detail: AtlasSideNavInvokeDetail) => void;
  onActionInvoke?: (detail: AtlasSideNavActionDetail) => void;
  onExpandChange?: (detail: AtlasSideNavExpandDetail) => void;
  onFlyoutOpenChange?: (detail: AtlasSideNavExpandDetail) => void;
}

export interface AtlaskitSideNavElement extends HTMLElement {
  model: AtlasSideNavModel;
  darkMode: boolean;
}
