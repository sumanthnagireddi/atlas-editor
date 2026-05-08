import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Avatar from '@atlaskit/avatar';
import Button, { ButtonGroup } from '@atlaskit/button';
import DropdownMenu, { DropdownItemRadio, DropdownItemRadioGroup } from '@atlaskit/dropdown-menu';
import ChevronDownIcon from '@atlaskit/icon/core/chevron-down';
import StatusInformationIcon from '@atlaskit/icon/core/status-information';
import StatusVerifiedIcon from '@atlaskit/icon/core/status-verified';
import Spinner from '@atlaskit/spinner';
import Textfield from '@atlaskit/textfield';
import debounce from 'lodash.debounce';
import { Editor, EditorContext } from '@atlaskit/editor-core';
import { JSONTransformer } from '@atlaskit/editor-json-transformer';
import type { EditorView } from '@atlaskit/editor-prosemirror/view';
import { setGlobalTheme } from '@atlaskit/tokens';
import { EMPTY_ADF_DOCUMENT, normalizeADF, stableADFString } from './adf';
import { AtlaskitRenderer } from './AtlaskitRenderer';
import {
  createAnnotationProviders,
  createCardProvider,
  createEmojiProvider,
  createMentionProvider,
  createMockMediaProvider,
  createTaskDecisionProvider
} from './providers';
import type {
  ADFDoc,
  AtlasEditorPage,
  AtlasEditorSubmission,
  AtlaskitEditorProps,
  AtlasPageStatusAppearance,
  AtlasPageTitleAlignment,
  AtlasPageWidthMode
} from './types';
import './styles.css';

const EDITOR_THEME_THEME_ID = 'light:light dark:dark spacing:spacing typography:typography shape:shape motion:motion';

const STATUS_OPTIONS: Array<{ appearance: AtlasPageStatusAppearance; label: string; value: string }> = [
  { value: 'rough-draft', label: 'Rough draft', appearance: 'default' },
  { value: 'in-progress', label: 'In progress', appearance: 'inprogress' },
  { value: 'ready-for-review', label: 'Ready for review', appearance: 'new' },
  { value: 'verified', label: 'Verified', appearance: 'success' }
];

const LEGACY_STATUS_LABELS: Record<string, string> = {
  Draft: 'Rough draft',
  'In review': 'Ready for review',
  Approved: 'Verified'
};

const WIDTH_OPTIONS: Array<{ label: string; value: AtlasPageWidthMode }> = [
  { value: 'centered', label: 'Centered' },
  { value: 'wide', label: 'Wide' },
  { value: 'full-width', label: 'Full width' }
];

const TITLE_ALIGNMENT_OPTIONS: Array<{ label: string; value: AtlasPageTitleAlignment }> = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' }
];

// FIX 1: Added `showContextPanel` prop (default false, parent-controlled)
export const AtlaskitEditor = memo(function AtlaskitEditor({
  value,
  onChange,
  readOnly = false,
  mode = 'editor',
  darkMode = false,
  debounceMs = 250,
  placeholder = 'Start writing...',
  page = null,
  showContextPanel = false, // NEW: parent-controlled, default false
  onPageChange,
  onPageSubmit,
  onPageCancel,
  onEditModeChange
}: AtlaskitEditorProps & { showContextPanel?: boolean }) {
  const normalizedValue = useMemo(() => normalizeADF(value), [value]);
  const normalizedPage = useMemo(() => normalizePage(page), [page]);

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

    const { body } = document;
    const countKey = 'atlasEditorDarkPortalCount';
    const currentCount = Number(body.dataset[countKey] ?? '0');

    body.dataset[countKey] = String(currentCount + 1);

    if (darkMode) {
      body.classList.add('atlas-editor-dark-portal');
    } else if (currentCount === 0) {
      body.classList.remove('atlas-editor-dark-portal');
    }

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
        console.warn('Unable to apply Atlaskit global theme for editor surface', error);
      });

    return () => {
      disposed = true;
      unbindThemeListener?.();

      const nextCount = Math.max(0, Number(body.dataset[countKey] ?? '1') - 1);

      if (nextCount === 0) {
        delete body.dataset[countKey];
        body.classList.remove('atlas-editor-dark-portal');
        restoreThemeAttribute(html, 'data-theme', previousTheme.theme);
        restoreThemeAttribute(html, 'data-color-mode', previousTheme.colorMode);
        restoreThemeAttribute(html, 'data-contrast-mode', previousTheme.contrastMode);
        return;
      }

      body.dataset[countKey] = String(nextCount);
    };
  }, [darkMode]);

  if (normalizedPage) {
    return (
      <PageEditorShell
        value={normalizedValue}
        page={normalizedPage}
        onChange={onChange}
        readOnly={readOnly}
        mode={mode}
        darkMode={darkMode}
        debounceMs={debounceMs}
        placeholder={placeholder}
        showContextPanel={showContextPanel} // FIX 1: pass through
        onPageChange={onPageChange}
        onPageSubmit={onPageSubmit}
        onPageCancel={onPageCancel}
        onEditModeChange={onEditModeChange}
      />
    );
  }

  if (readOnly || mode === 'renderer') {
    return <AtlaskitRenderer value={normalizedValue} darkMode={darkMode} />;
  }

  return (
    <EditorSurface
      value={normalizedValue}
      onChange={onChange}
      darkMode={darkMode}
      debounceMs={debounceMs}
      placeholder={placeholder}
    />
  );
});

const PageEditorShell = memo(function PageEditorShell({
  value,
  page,
  onChange,
  readOnly,
  mode,
  darkMode,
  debounceMs,
  placeholder,
  showContextPanel, // FIX 1: receive from parent
  onPageChange,
  onPageSubmit,
  onPageCancel,
  onEditModeChange
}: Required<Pick<AtlaskitEditorProps, 'onChange' | 'darkMode' | 'debounceMs' | 'placeholder'>> & {
  value: ADFDoc;
  page: AtlasEditorPage;
  readOnly: boolean;
  mode: 'editor' | 'renderer';
  showContextPanel: boolean; // FIX 1
  onPageChange?: (page: AtlasEditorPage) => void;
  onPageSubmit?: (payload: AtlasEditorSubmission) => void;
  onPageCancel?: (payload: AtlasEditorSubmission) => void;
  onEditModeChange?: (isEditing: boolean) => void;
}) {
  const incomingValueKey = useMemo(() => stableADFString(value), [value]);
  const incomingPageKey = useMemo(() => stablePageString(page), [page]);
  const [committedValue, setCommittedValue] = useState(value);
  const [draftValue, setDraftValue] = useState(value);
  const [committedPage, setCommittedPage] = useState(page);
  const [draftPage, setDraftPage] = useState(page);
  const [isEditing, setIsEditing] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const previousModeRef = useRef(mode);
  const hasResolvedInitialModeRef = useRef(false);
  const hasInitializedValueRef = useRef(false);
  const hasInitializedPageRef = useRef(false);
  const busyTokenRef = useRef(0);
  const busyContextRef = useRef<'action' | 'sync' | null>(null);
  const busyTimeoutRef = useRef<number | null>(null);

  const startBusyState = useCallback((label: string, minimumMs = 320, context: 'action' | 'sync' = 'sync') => {
    if (context === 'sync' && busyContextRef.current === 'action') {
      return () => undefined;
    }

    busyTokenRef.current += 1;
    const token = busyTokenRef.current;
    busyContextRef.current = context;

    if (busyTimeoutRef.current !== null) {
      window.clearTimeout(busyTimeoutRef.current);
    }

    setBusyLabel(label);

    return () => {
      if (busyTimeoutRef.current !== null) {
        window.clearTimeout(busyTimeoutRef.current);
      }

      busyTimeoutRef.current = window.setTimeout(() => {
        if (busyTokenRef.current === token) {
          busyContextRef.current = null;
          setBusyLabel(null);
        }
      }, minimumMs);
    };
  }, []);

  useEffect(() => {
    if (!hasInitializedValueRef.current) {
      hasInitializedValueRef.current = true;
      setCommittedValue(value);
      setDraftValue(value);
      return;
    }

    const finishBusyState = startBusyState('Reflecting latest editor content...', 320, 'sync');
    setCommittedValue(value);
    setDraftValue(value);
    finishBusyState();
  }, [incomingValueKey, startBusyState]);

  useEffect(() => {
    if (!hasInitializedPageRef.current) {
      hasInitializedPageRef.current = true;
      setCommittedPage(page);
      setDraftPage(page);
      return;
    }

    const finishBusyState = startBusyState('Reflecting latest page details...', 320, 'sync');
    setCommittedPage(page);
    setDraftPage(page);
    finishBusyState();
  }, [incomingPageKey, startBusyState]);

  useEffect(() => {
    if (readOnly) {
      setIsEditing(false);
      previousModeRef.current = mode;
      return;
    }

    if (!hasResolvedInitialModeRef.current) {
      hasResolvedInitialModeRef.current = true;
      previousModeRef.current = mode;
      setIsEditing(false);
      return;
    }

    if (previousModeRef.current === mode) {
      return;
    }

    previousModeRef.current = mode;
    setIsEditing(mode === 'editor');
  }, [mode, readOnly]);

  useEffect(() => {
    onEditModeChange?.(isEditing);
  }, [isEditing, onEditModeChange]);

  useEffect(() => {
    return () => {
      if (busyTimeoutRef.current !== null) {
        window.clearTimeout(busyTimeoutRef.current);
      }
    };
  }, []);

  const handleEditorChange = useCallback(
    (nextDocument: ADFDoc) => {
      const normalized = normalizeADF(nextDocument);
      setDraftValue(normalized);
      onChange(normalized);
    },
    [onChange]
  );

  const updateDraftPage = useCallback(
    (patch: Partial<AtlasEditorPage>) => {
      setDraftPage((currentPage) => {
        const nextPage = normalizePage({ ...currentPage, ...patch }) as AtlasEditorPage;
        onPageChange?.(nextPage);
        return nextPage;
      });
    },
    [onPageChange]
  );

  const handleStartEdit = useCallback(() => {
    if (readOnly) return;
    setDraftValue(committedValue);
    setDraftPage(committedPage);
    setIsEditing(true);
  }, [committedPage, committedValue, readOnly]);

  const handleSubmit = useCallback(() => {
    const finishBusyState = startBusyState('Updating page content...', 420, 'action');
    const nextValue = normalizeADF(draftValue);
    const nextPage = normalizePage(draftPage) as AtlasEditorPage;

    setCommittedValue(nextValue);
    setCommittedPage(nextPage);
    setDraftValue(nextValue);
    setDraftPage(nextPage);
    setIsEditing(false);
    onPageSubmit?.({ page: nextPage, value: nextValue });
    finishBusyState();
  }, [draftPage, draftValue, onPageSubmit, startBusyState]);

  const handleCancel = useCallback(() => {
    const finishBusyState = startBusyState('Closing editor changes...', 420, 'action');
    setDraftValue(committedValue);
    setDraftPage(committedPage);
    setIsEditing(false);
    onPageCancel?.({ page: committedPage, value: committedValue });
    finishBusyState();
  }, [committedPage, committedValue, onPageCancel, startBusyState]);

  const displayPage = isEditing ? draftPage : committedPage;

  // FIX 2: Proper dark mode class — use Atlaskit design token naming
  const surfaceDarkClass = darkMode ? 'atlas-editor atlas-editor--dark' : 'atlas-editor';

  const widthMode = displayPage.widthMode ?? 'centered';

  // FIX 3: Title alignment defaults to 'left' always (no prop default to center)
  const titleAlignment = displayPage.titleAlignment ?? 'left';

  const topbarUpdatedLabel = getTopbarUpdatedLabel(isEditing, displayPage.updatedText);

  const rootClassName = [
    surfaceDarkClass,
    'atlas-page-shell',
    `atlas-page-shell--${widthMode}`,
    isEditing ? 'atlas-page-shell--editing' : ''
  ]
    .filter(Boolean)
    .join(' ');

  const statusControl = (
    <PageStatusField
      statusText={displayPage.statusText ?? STATUS_OPTIONS[0].label}
      statusAppearance={displayPage.statusAppearance ?? STATUS_OPTIONS[0].appearance}
      onChange={(nextStatusText, nextStatusAppearance) => {
        updateDraftPage({ statusText: nextStatusText, statusAppearance: nextStatusAppearance });
      }}
    />
  );

  const widthControl = (
    <DropdownMenu trigger={`Content width: ${getWidthLabel(widthMode)}`} shouldRenderToParent>
      <DropdownItemRadioGroup id="atlas-page-width-options">
        {WIDTH_OPTIONS.map((option) => (
          <DropdownItemRadio
            key={option.value}
            id={option.value}
            isSelected={widthMode === option.value}
            onClick={() => updateDraftPage({ widthMode: option.value })}
          >
            {option.label}
          </DropdownItemRadio>
        ))}
      </DropdownItemRadioGroup>
    </DropdownMenu>
  );

  const titleAlignmentControl = (
    <DropdownMenu trigger={`Title align: ${getTitleAlignmentLabel(titleAlignment)}`} shouldRenderToParent>
      <DropdownItemRadioGroup id="atlas-page-title-alignment-options">
        {TITLE_ALIGNMENT_OPTIONS.map((option) => (
          <DropdownItemRadio
            key={option.value}
            id={option.value}
            isSelected={titleAlignment === option.value}
            onClick={() => updateDraftPage({ titleAlignment: option.value })}
          >
            {option.label}
          </DropdownItemRadio>
        ))}
      </DropdownItemRadioGroup>
    </DropdownMenu>
  );

  return (
    <section
      className={rootClassName}
      data-color-mode={darkMode ? 'dark' : 'light'}
      data-subtree-theme
      data-theme={EDITOR_THEME_THEME_ID}
    >
      {busyLabel ? <SurfaceLoader label={busyLabel} /> : null}

      {/*
        FIX 4: Topbar is now position:sticky top:0 with proper z-index and
        background synced to dark/light tokens — no more desync with content scroll.
        The topbar aligns its content to match the editor's max-width container.
      */}
      <header className={`atlas-page-shell__topbar${darkMode ? ' atlas-page-shell__topbar--dark' : ''}`}>
        {/*
          FIX 4: Topbar inner wraps content so it aligns with the
          constrained editor body — same max-width as the page content.
        */}
        <div className="atlas-page-shell__topbar-inner">
          {isEditing ? (
            <div className="atlas-page-shell__topbar-title">
              <span className="atlas-page-shell__editing-label">{getPageDisplayTitle(draftPage.title)}</span>
            </div>
          ) : null}

          <div className="atlas-page-shell__topbar-actions">
            {topbarUpdatedLabel ? (
              <span className="atlas-page-shell__updated-text">{topbarUpdatedLabel}</span>
            ) : null}

            <Avatar
              size="small"
              name={displayPage.authorName}
              label={displayPage.authorName}
              testId="atlas-page-author-avatar"
            />

            {isEditing ? (
              <ButtonGroup>
                <Button appearance="primary" onClick={handleSubmit}>
                  Update
                </Button>
                <Button appearance="subtle" onClick={handleCancel}>
                  Close
                </Button>
              </ButtonGroup>
            ) : (
              !readOnly && (
                <Button appearance="subtle" onClick={handleStartEdit}>
                  Edit
                </Button>
              )
            )}
          </div>
        </div>
      </header>

      <div className="atlas-page-shell__body">
        {/*
          FIX 3: Hero / title section — always left-aligned by default.
          max-width is controlled by the width mode (centered/wide/full-width)
          and matches the editor surface width exactly.
        */}
        <div className={`atlas-page-shell__hero atlas-page-shell__hero--title-${titleAlignment}`}>
          {isEditing ? (
            <div className="atlas-page-shell__edit-toolbar">
              {statusControl}
              {widthControl}
              {titleAlignmentControl}
            </div>
          ) : null}

          {isEditing ? (
            <Textfield
              aria-label="Page title"
              className="atlas-page-shell__title-input"
              value={draftPage.title}
              onChange={(event) => updateDraftPage({ title: event.currentTarget.value })}
              placeholder="Give this page a title..."
            />
          ) : (
            /*
              FIX 3: The h1 now has text-align controlled by CSS class derived
              from titleAlignment (default 'left'), not centered by default.
              It also respects max-width of the parent editor surface.
            */
            <h1 className={`atlas-page-shell__title atlas-page-shell__title--align-${titleAlignment}`}>
              {getPageDisplayTitle(committedPage.title)}
            </h1>
          )}

          <div className="atlas-page-shell__meta">
            <Avatar
              size="small"
              name={displayPage.authorName}
              label={displayPage.authorName}
              testId="atlas-page-author-inline-avatar"
            />
            <span className="atlas-page-shell__meta-item">By {displayPage.authorName}</span>

            {displayPage.statusText ? (
              <PageStatusInline
                statusText={displayPage.statusText}
                statusAppearance={displayPage.statusAppearance ?? STATUS_OPTIONS[0].appearance}
              />
            ) : null}

            {displayPage.metaItems?.map((item) => (
              <span key={item} className="atlas-page-shell__meta-item">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="atlas-page-shell__surface">
          <div className="atlas-page-shell__surface-layout">
            <div className="atlas-page-shell__surface-main">
              {isEditing ? (
                <EditorSurface
                  value={draftValue}
                  onChange={handleEditorChange}
                  darkMode={darkMode}
                  debounceMs={debounceMs}
                  placeholder={placeholder}
                  embedded
                />
              ) : (
                <AtlaskitRenderer value={committedValue} darkMode={darkMode} embedded />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

const EditorSurface = memo(function EditorSurface({
  value,
  onChange,
  darkMode,
  debounceMs,
  placeholder,
  embedded = false
}: Required<Pick<AtlaskitEditorProps, 'onChange' | 'darkMode' | 'debounceMs' | 'placeholder'>> & {
  value: ADFDoc;
  embedded?: boolean;
}) {
  const incomingValueKey = useMemo(() => stableADFString(value), [value]);
  const lastEmittedKeyRef = useRef(incomingValueKey);
  const lastKnownEditorDocumentKeyRef = useRef(incomingValueKey);
  const [editorSessionKey, setEditorSessionKey] = useState(0);
  const [surfaceBusyLabel, setSurfaceBusyLabel] = useState<string | null>(null);
  const hasInitializedIncomingValueRef = useRef(false);
  const surfaceBusyTimeoutRef = useRef<number | null>(null);

  const transformer = useMemo(() => new JSONTransformer(), []);
  const mentionProvider = useMemo(() => createMentionProvider(), []);
  const emojiProvider = useMemo(() => createEmojiProvider(), []);
  const mediaProvider = useMemo(() => createMockMediaProvider(), []);
  const taskDecisionProvider = useMemo(() => createTaskDecisionProvider(), []);
  const annotationProviders = useMemo(() => createAnnotationProviders(), []);
  const cardProvider = useMemo(() => createCardProvider(), []);
  const initialPluginConfiguration = useMemo(
    () =>
      ({
        blockControlsPlugin: {
          enabled: true,
          quickInsertButtonEnabled: true,
          rightSideControlsEnabled: true
        },
        blockMenuPlugin: {
          enabled: true,
          useStandardNodeWidth: true
        },
        insertBlockPlugin: {
          toolbarShowPlusInsertOnly: false
        },
        quickInsertPlugin: {
          enableElementBrowser: true
        },
        toolbarPlugin: {
          contextualFormattingEnabled: 'always-pinned',
          enableNewToolbarExperience: true
        }
      }) as never,
    []
  );

  const emitChange = useMemo(() => {
    return debounce((doc: ADFDoc) => {
      const normalized = normalizeADF(doc);
      const key = stableADFString(normalized);

      if (key === lastEmittedKeyRef.current) return;

      lastEmittedKeyRef.current = key;
      onChange(normalized);
    }, debounceMs);
  }, [debounceMs, onChange]);

  useEffect(() => {
    return () => {
      emitChange.cancel();
      lastKnownEditorDocumentKeyRef.current = stableADFString(EMPTY_ADF_DOCUMENT);

      if (surfaceBusyTimeoutRef.current !== null) {
        window.clearTimeout(surfaceBusyTimeoutRef.current);
      }
    };
  }, [emitChange]);

  useEffect(() => {
    if (!hasInitializedIncomingValueRef.current) {
      hasInitializedIncomingValueRef.current = true;
      lastEmittedKeyRef.current = incomingValueKey;
      lastKnownEditorDocumentKeyRef.current = incomingValueKey;
      return;
    }

    if (incomingValueKey === lastKnownEditorDocumentKeyRef.current) return;

    if (surfaceBusyTimeoutRef.current !== null) {
      window.clearTimeout(surfaceBusyTimeoutRef.current);
    }

    setSurfaceBusyLabel('Applying latest content...');
    lastKnownEditorDocumentKeyRef.current = incomingValueKey;
    lastEmittedKeyRef.current = incomingValueKey;
    setEditorSessionKey((currentKey) => currentKey + 1);
    surfaceBusyTimeoutRef.current = window.setTimeout(() => {
      setSurfaceBusyLabel(null);
    }, 320);
  }, [incomingValueKey]);

  const handleEditorChange = useCallback(
    (editorView: EditorView) => {
      const adf = normalizeADF(transformer.encode(editorView.state.doc as never) as ADFDoc);
      lastKnownEditorDocumentKeyRef.current = stableADFString(adf);
      emitChange(adf);
    },
    [emitChange, transformer]
  );

  const surface = (
    <Editor
      appearance="full-page"
      allowAnalyticsGASV3={false}
      allowBorderMark
      allowBreakout
      allowConfluenceInlineComment
      allowTextColor
      allowTextAlignment
      allowTables={{
        advanced: true,
        allowColumnResizing: true,
        allowControls: true,
        allowHeaderRow: true,
        allowHeaderColumn: true,
        permittedLayouts: 'all'
      }}
      allowRule
      allowPanel
      allowStatus
      allowDate
      allowNestedTasks
      allowTasksAndDecisions
      allowLayouts
      allowExtension
      allowExpand
      allowFragmentMark
      allowIndentation
      allowTemplatePlaceholders
      allowFindReplace
      allowHelpDialog
      allowUndoRedoButtons
      autoScrollIntoView
      codeBlock={{
        allowCopyToClipboard: true,
        allowCompositionInputOverride: true,
        appearance: 'full-page'
      }}
      elementBrowser={{ showModal: true, replacePlusMenu: true }}
      initialPluginConfiguration={initialPluginConfiguration}
      maxContentSize={50000}
      placeholder={placeholder}
      quickInsert={{ disableDefaultItems: false }}
      saveOnEnter
      shouldFocus
      showIndentationButtons
      linking={{
        smartLinks: {
          allowBlockCards: true,
          allowDatasource: true,
          allowEmbeds: true,
          allowResizing: true,
          allowWrapping: true,
          provider: cardProvider as never
        }
      }}
      key={editorSessionKey}
      defaultValue={value}
      textFormatting={{}}
      useStickyToolbar
      annotationProviders={annotationProviders}
      mentionProvider={mentionProvider}
      emojiProvider={emojiProvider as never}
      media={{ provider: mediaProvider as never, allowMediaSingle: true, allowMediaGroup: true, allowResizing: true }}
      taskDecisionProvider={taskDecisionProvider}
      onChange={handleEditorChange}
    />
  );

  const editorSurface = (
    <div className={`atlas-editor-surface${embedded ? ' atlas-editor-surface--embedded' : ''}`}>
      {surfaceBusyLabel ? <SurfaceLoader label={surfaceBusyLabel} compact={embedded} /> : null}
      {surface}
    </div>
  );

  if (embedded) {
    return <EditorContext>{editorSurface}</EditorContext>;
  }

  return (
    <EditorContext>
      <div
        className={darkMode ? 'atlas-editor atlas-editor--dark' : 'atlas-editor'}
        data-color-mode={darkMode ? 'dark' : 'light'}
        data-subtree-theme
        data-theme={EDITOR_THEME_THEME_ID}
      >
        {editorSurface}
      </div>
    </EditorContext>
  );
});

const SurfaceLoader = memo(function SurfaceLoader({
  label,
  compact = false
}: {
  label: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`atlas-editor-surface-loader${compact ? ' atlas-editor-surface-loader--compact' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="atlas-editor-surface-loader__card">
        <Spinner size="medium" />
        <span>{label}</span>
      </div>
    </div>
  );
});

const AtlasEditorContextPanel = memo(function AtlasEditorContextPanel({
  page,
  value
}: {
  page: AtlasEditorPage;
  value: ADFDoc;
}) {
  const stats = useMemo(() => collectDocumentStats(value), [value]);

  return (
    <aside className="atlas-context-panel" aria-label="Editor context panel">
      <section className="atlas-context-panel__section">
        <div className="atlas-context-panel__eyebrow">Page context</div>
        <h2 className="atlas-context-panel__title">{getPageDisplayTitle(page.title)}</h2>
        <div className="atlas-context-panel__meta">
          <span className="atlas-context-panel__meta-label">Status</span>
          <PageStatusInline
            statusText={page.statusText ?? STATUS_OPTIONS[0].label}
            statusAppearance={page.statusAppearance ?? STATUS_OPTIONS[0].appearance}
            compact
          />
        </div>
        <div className="atlas-context-panel__meta">
          <span className="atlas-context-panel__meta-label">Content width</span>
          <span className="atlas-context-panel__meta-value">{getWidthLabel(page.widthMode ?? 'centered')}</span>
        </div>
        <div className="atlas-context-panel__meta">
          <span className="atlas-context-panel__meta-label">Title align</span>
          <span className="atlas-context-panel__meta-value">{getTitleAlignmentLabel(page.titleAlignment ?? 'left')}</span>
        </div>
      </section>

      <section className="atlas-context-panel__section">
        <div className="atlas-context-panel__eyebrow">Document stats</div>
        <dl className="atlas-context-panel__stats">
          <div><dt>Words</dt><dd>{stats.words}</dd></div>
          <div><dt>Headings</dt><dd>{stats.headings}</dd></div>
          <div><dt>Code blocks</dt><dd>{stats.codeBlocks}</dd></div>
          <div><dt>Tables</dt><dd>{stats.tables}</dd></div>
          <div><dt>Smart links</dt><dd>{stats.cards}</dd></div>
        </dl>
      </section>

      <section className="atlas-context-panel__section">
        <div className="atlas-context-panel__eyebrow">Actions</div>
        <div className="atlas-context-panel__actions">
          <Button
            appearance="subtle"
            spacing="compact"
            onClick={() => void copyTextSafely(getPageDisplayTitle(page.title))}
          >
            Copy title
          </Button>
          <Button
            appearance="subtle"
            spacing="compact"
            onClick={() => void copyTextSafely(JSON.stringify(value, null, 2))}
          >
            Copy ADF
          </Button>
        </div>
      </section>
    </aside>
  );
});

const PageStatusField = memo(function PageStatusField({
  statusText,
  statusAppearance,
  onChange
}: {
  statusText: string;
  statusAppearance: AtlasPageStatusAppearance;
  onChange: (statusText: string, statusAppearance: AtlasPageStatusAppearance) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAppearanceMenuOpen, setIsAppearanceMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsAppearanceMenuOpen(false);
      return;
    }

    const handlePointerDown = (event: MouseEvent): void => {
      if (containerRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
      setIsAppearanceMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  return (
    <div className={`atlas-status-field${isOpen ? ' atlas-status-field--open' : ''}`} ref={containerRef}>
      <button
        type="button"
        className={`atlas-page-shell__property-button${isOpen ? ' atlas-page-shell__property-button--active' : ''}`}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <StatusPropertyIcon active={isOpen} />
        <span>Status</span>
      </button>

      {isOpen ? (
        <div className="atlas-status-field__panel" role="dialog" aria-label="Set status">
          <div className="atlas-status-field__title">Set status</div>

          <div className="atlas-status-field__composer">
            <button
              type="button"
              className={`atlas-status-field__appearance-trigger${isAppearanceMenuOpen ? ' atlas-status-field__appearance-trigger--open' : ''}`}
              onClick={() => setIsAppearanceMenuOpen((currentValue) => !currentValue)}
              aria-haspopup="menu"
              aria-expanded={isAppearanceMenuOpen}
            >
              <PageStatusIcon statusAppearance={statusAppearance} />
              <ChevronDownIcon label="" />
            </button>

            <Textfield
              aria-label="Custom status text"
              value={statusText}
              placeholder="Add custom status"
              onChange={(event) => onChange(event.currentTarget.value, statusAppearance)}
            />

            {isAppearanceMenuOpen ? (
              <div className="atlas-status-field__appearance-menu" role="menu">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`atlas-status-field__appearance-option${statusAppearance === option.appearance ? ' atlas-status-field__appearance-option--selected' : ''}`}
                    onClick={() => {
                      onChange(statusText, option.appearance);
                      setIsAppearanceMenuOpen(false);
                    }}
                  >
                    <PageStatusIcon statusAppearance={option.appearance} />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="atlas-status-field__divider"></div>

          <div className="atlas-status-field__label">Suggested</div>
          <div className="atlas-status-field__suggestions">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`atlas-status-field__suggestion${statusText === option.label ? ' atlas-status-field__suggestion--selected' : ''}`}
                onClick={() => {
                  onChange(option.label, option.appearance);
                  setIsOpen(false);
                  setIsAppearanceMenuOpen(false);
                }}
              >
                <PageStatusIcon statusAppearance={option.appearance} />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
});

const PageStatusInline = memo(function PageStatusInline({
  statusText,
  statusAppearance,
  compact = false
}: {
  statusText: string;
  statusAppearance: AtlasPageStatusAppearance;
  compact?: boolean;
}) {
  return (
    <span className={`atlas-page-status${compact ? ' atlas-page-status--compact' : ''}`}>
      <PageStatusIcon statusAppearance={statusAppearance} />
      <span>{statusText}</span>
    </span>
  );
});

const StatusPropertyIcon = memo(function StatusPropertyIcon({ active }: { active: boolean }) {
  return <StatusInformationIcon label="" color={active ? '#0C66E4' : '#44546F'} />;
});

const PageStatusIcon = memo(function PageStatusIcon({
  statusAppearance
}: {
  statusAppearance: AtlasPageStatusAppearance;
}) {
  if (statusAppearance === 'success') {
    return <StatusVerifiedIcon label="" color={getStatusColor(statusAppearance)} />;
  }

  return (
    <span
      className={`atlas-page-status__dot atlas-page-status__dot--${statusAppearance}`}
      aria-hidden="true"
    />
  );
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizePage(page?: AtlaskitEditorProps['page']): AtlasEditorPage | null {
  if (!page) return null;

  const title = getPageDisplayTitle(page.title);
  const authorName =
    typeof page.authorName === 'string' && page.authorName.trim().length > 0
      ? page.authorName.trim()
      : 'Unknown author';
  const metaItems = Array.isArray(page.metaItems)
    ? page.metaItems.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
  const normalizedStatusText = normalizeStatusText(page.statusText);
  const matchingStatus =
    STATUS_OPTIONS.find((option) => option.label === normalizedStatusText) ??
    STATUS_OPTIONS.find((option) => option.appearance === page.statusAppearance);

  return {
    title,
    authorName,
    authorInitials:
      typeof page.authorInitials === 'string' && page.authorInitials.trim().length > 0
        ? page.authorInitials.trim().slice(0, 2).toUpperCase()
        : deriveInitials(authorName),
    updatedText:
      typeof page.updatedText === 'string' && page.updatedText.trim().length > 0
        ? page.updatedText.trim()
        : 'Updated just now',
    metaItems,
    statusText: normalizedStatusText,
    statusAppearance: page.statusAppearance ?? matchingStatus?.appearance ?? STATUS_OPTIONS[0].appearance,
    // FIX 3: Default widthMode to 'centered' and titleAlignment to 'left'
    widthMode:
      page.widthMode === 'wide' || page.widthMode === 'full-width' || page.widthMode === 'centered'
        ? page.widthMode
        : 'centered',
    titleAlignment:
      page.titleAlignment === 'center' || page.titleAlignment === 'right' || page.titleAlignment === 'left'
        ? page.titleAlignment
        : 'left' // always default to left
  };
}

function stablePageString(page: AtlasEditorPage | null): string {
  return JSON.stringify(page ?? null);
}

function getPageDisplayTitle(title: string | undefined): string {
  return typeof title === 'string' && title.trim().length > 0 ? title.trim() : 'Untitled page';
}

function deriveInitials(name: string): string {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return 'U';
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

function getTopbarUpdatedLabel(isEditing: boolean, updatedText?: string): string | null {
  const normalizedUpdatedText = normalizeUpdatedText(updatedText);

  if (!normalizedUpdatedText) {
    return isEditing ? 'Edited just now' : null;
  }

  if (!isEditing) return normalizedUpdatedText;

  if (/^edited\b/i.test(normalizedUpdatedText)) return normalizedUpdatedText;

  return normalizedUpdatedText.replace(/^updated\b/i, 'Edited');
}

function normalizeUpdatedText(updatedText?: string): string | null {
  if (typeof updatedText !== 'string') return null;

  const trimmedText = updatedText.trim();
  if (!trimmedText) return null;

  if (/^(updated|edited)\b/i.test(trimmedText)) return trimmedText;

  if (
    /^(just now|moments? ago|today|yesterday)\b/i.test(trimmedText) ||
    /\bago$/i.test(trimmedText) ||
    /^\d+\s*(s|sec|secs|second|seconds|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|week|weeks|mo|month|months|y|year|years)\b/i.test(trimmedText)
  ) {
    return `Updated ${trimmedText}`;
  }

  return null;
}

function getWidthLabel(widthMode: AtlasPageWidthMode): string {
  return WIDTH_OPTIONS.find((option) => option.value === widthMode)?.label ?? WIDTH_OPTIONS[0].label;
}

function getTitleAlignmentLabel(titleAlignment: AtlasPageTitleAlignment): string {
  return (
    TITLE_ALIGNMENT_OPTIONS.find((option) => option.value === titleAlignment)?.label ??
    TITLE_ALIGNMENT_OPTIONS[0].label
  );
}

function normalizeStatusText(statusText: string | undefined): string {
  if (typeof statusText !== 'string' || statusText.trim().length === 0) {
    return STATUS_OPTIONS[0].label;
  }

  const trimmedStatusText = statusText.trim();
  return LEGACY_STATUS_LABELS[trimmedStatusText] ?? trimmedStatusText;
}

function getStatusColor(statusAppearance: AtlasPageStatusAppearance): string {
  switch (statusAppearance) {
    case 'inprogress':
      return '#579DFF';
    case 'new':
      return '#4BCE97';
    case 'success':
      return '#1D7AFC';
    case 'removed':
      return '#F15B50';
    case 'moved':
      return '#8F7EE7';
    case 'default':
    default:
      return '#F5CD47';
  }
}

function restoreThemeAttribute(target: HTMLElement, name: string, value: string | null): void {
  if (value === null) {
    target.removeAttribute(name);
    return;
  }
  target.setAttribute(name, value);
}

type DocumentStats = {
  words: number;
  headings: number;
  codeBlocks: number;
  tables: number;
  cards: number;
};

function collectDocumentStats(document: ADFDoc): DocumentStats {
  const stats: DocumentStats = { words: 0, headings: 0, codeBlocks: 0, tables: 0, cards: 0 };

  const visit = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;

    const record = node as { type?: unknown; text?: unknown; content?: unknown[] };

    if (typeof record.text === 'string') {
      stats.words += record.text.trim().split(/\s+/).filter(Boolean).length;
    }

    switch (record.type) {
      case 'heading':
        stats.headings += 1;
        break;
      case 'codeBlock':
        stats.codeBlocks += 1;
        break;
      case 'table':
        stats.tables += 1;
        break;
      case 'inlineCard':
      case 'blockCard':
      case 'embedCard':
        stats.cards += 1;
        break;
    }

    if (Array.isArray(record.content)) {
      record.content.forEach(visit);
    }
  };

  visit(document);
  return stats;
}

async function copyTextSafely(text: string): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', 'true');
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.append(textArea);
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
  } catch (error) {
    console.warn('Unable to copy text from editor context panel', error);
  }
}