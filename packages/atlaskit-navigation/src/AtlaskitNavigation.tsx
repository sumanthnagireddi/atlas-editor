import React, { memo } from 'react';
import DropdownMenu, { DropdownItem, DropdownItemGroup } from '@atlaskit/dropdown-menu';
import {
  ButtonItem,
  NavigationHeader,
  NestableNavigationContent,
  NestingItem,
  SideNavigation,
  Section
} from '@atlaskit/side-navigation';
import type { AtlaskitNavigationProps } from './types';
import './styles.css';

const PRIMARY_ITEMS = [
  { id: 'for-you', title: 'For you' },
  { id: 'recent', title: 'Recent' },
  { id: 'starred', title: 'Starred' },
  { id: 'spaces', title: 'Spaces' },
  { id: 'apps', title: 'Apps' }
];

const PAGE_ITEMS = [
  { id: 'js-topics', title: 'JS Topics' },
  { id: 'js-paradigms', title: 'JavaScript Paradigms' },
  { id: 'oops', title: 'Object Oriented Programming (OOPS)' },
  { id: 'polymorphism', title: 'Polymorphism' },
  { id: 'inheritance', title: 'Inheritance' },
  { id: 'execution-context', title: 'Execution Context' },
  { id: 'page-current', title: 'How JavaScript code Executes and allocates Memory' },
  { id: 'functions-work', title: 'How Functions works in JavaScript and V8' }
];

export const AtlaskitNavigation = memo(function AtlaskitNavigation({
  activeItem = 'page-current',
  onSelect
}: AtlaskitNavigationProps) {
  return (
    <div className="atlas-nav-root">
      <SideNavigation label="Confluence navigation">
        <NavigationHeader>
          <div className="atlas-nav-app-switcher">
            <button className="atlas-nav-apps-button" type="button" aria-label="Open apps">
              <span />
              <span />
              <span />
              <span />
            </button>

            <div className="atlas-nav-brand-row">
              <span className="atlas-nav-brand-mark" aria-hidden="true">✦</span>
              <div className="atlas-nav-brand-copy">
                <p className="atlas-nav-title">Confluence</p>
              </div>
            </div>

            <button className="atlas-nav-collapse-button" type="button" aria-label="Collapse sidebar">
              ↤
            </button>
          </div>
        </NavigationHeader>

        <NestableNavigationContent initialStack={['root', 'content-tree']}>
          <Section>
            {PRIMARY_ITEMS.map((item) => (
              <ButtonItem
                key={item.id}
                isSelected={item.id === activeItem}
                onClick={() => onSelect(item.id)}
              >
                <span className="atlas-nav-primary-item">
                  <span className="atlas-nav-primary-icon" aria-hidden="true" />
                  <span>{item.title}</span>
                </span>
              </ButtonItem>
            ))}
          </Section>

          <div className="atlas-nav-profile">
            <span className="atlas-nav-profile-avatar">S</span>
            <span className="atlas-nav-profile-name">Sumanth</span>
            <DropdownMenu
              trigger={({ triggerRef, ...triggerProps }) => (
                <button
                  {...triggerProps}
                  ref={triggerRef as React.Ref<HTMLButtonElement>}
                  className="atlas-nav-menu-trigger"
                  type="button"
                  aria-label="Profile options"
                >
                  ...
                </button>
              )}
            >
              <DropdownItemGroup>
                <DropdownItem>View profile</DropdownItem>
                <DropdownItem>Personal settings</DropdownItem>
                <DropdownItem isDisabled>Switch account</DropdownItem>
              </DropdownItemGroup>
            </DropdownMenu>
          </div>

          <Section>
            <div className="atlas-nav-section-heading">
              <span>Shortcuts</span>
              <button className="atlas-nav-inline-trigger atlas-nav-inline-trigger--plus" type="button" aria-label="Add shortcut">
                +
              </button>
            </div>
            <div className="atlas-nav-empty-state">No shortcuts in this space</div>
          </Section>

          <Section>
            <div className="atlas-nav-section-heading">
              <span>Content</span>
              <div className="atlas-nav-heading-actions">
                <button className="atlas-nav-inline-trigger atlas-nav-inline-trigger--plus" type="button" aria-label="Add content">
                  +
                </button>
                <button className="atlas-nav-inline-trigger" type="button" aria-label="More content actions">
                  ...
                </button>
              </div>
            </div>

            <label className="atlas-nav-search">
              <span className="atlas-nav-search-icon" aria-hidden="true">⌕</span>
              <input type="text" value="Search by title" readOnly aria-label="Search by title" />
            </label>

            <NestingItem id="content-tree" title="Javascript" isSelected>
              <Section>
                <div className="atlas-nav-tree-row atlas-nav-tree-row--folder">
                  <span className="atlas-nav-tree-caret" aria-hidden="true">⌄</span>
                  <span className="atlas-nav-tree-folder" aria-hidden="true">🗀</span>
                  <span>Javascript</span>
                </div>

                {PAGE_ITEMS.map((item) => (
                  <ButtonItem
                    key={item.id}
                    isSelected={item.id === activeItem}
                    onClick={() => onSelect(item.id)}
                  >
                    <span className={`atlas-nav-page-item${item.id === activeItem ? ' atlas-nav-page-item--active' : ''}`}>
                      <span className="atlas-nav-page-icon" aria-hidden="true">≣</span>
                      <span className="atlas-nav-page-label">{item.title}</span>
                    </span>
                  </ButtonItem>
                ))}
              </Section>
            </NestingItem>
          </Section>

          <div className="atlas-nav-footer">
            <button className="atlas-nav-invite-button" type="button">Invite people</button>
          </div>
        </NestableNavigationContent>
      </SideNavigation>
    </div>
  );
});
