import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import { Editor, EditorContext } from '@atlaskit/editor-core';
import { JSONTransformer } from '@atlaskit/editor-json-transformer';
import type { EditorView } from '@atlaskit/editor-prosemirror/view';
import { normalizeADF, stableADFString } from './adf';
import { AtlaskitRenderer } from './AtlaskitRenderer';
import {
  createAnnotationProviders,
  createCardProvider,
  createEmojiProvider,
  createMentionProvider,
  createMockMediaProvider,
  createTaskDecisionProvider
} from './providers';
import type { ADFDoc, AtlaskitEditorProps } from './types';
import './styles.css';

type EditorActions = {
  replaceDocument?: (document: ADFDoc) => void;
};

export const AtlaskitEditor = memo(function AtlaskitEditor({
  value,
  onChange,
  readOnly = false,
  mode = 'editor',
  darkMode = false,
  debounceMs = 250,
  placeholder = 'Start writing...'
}: AtlaskitEditorProps) {
  const normalizedValue = useMemo(() => normalizeADF(value), [value]);

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

const EditorSurface = memo(function EditorSurface({
  value,
  onChange,
  darkMode,
  debounceMs,
  placeholder
}: Required<Pick<AtlaskitEditorProps, 'onChange' | 'darkMode' | 'debounceMs' | 'placeholder'>> & {
  value: ADFDoc;
}) {
  const incomingValueKey = useMemo(() => stableADFString(value), [value]);
  const lastEmittedKeyRef = useRef(incomingValueKey);
  const lastAppliedExternalKeyRef = useRef(incomingValueKey);
  const editorActionsRef = useRef<EditorActions | null>(null);
  const [editorReady, setEditorReady] = useState(false);

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

      if (key === lastEmittedKeyRef.current) {
        return;
      }

      lastEmittedKeyRef.current = key;
      onChange(normalized);
    }, debounceMs);
  }, [debounceMs, onChange]);

  useEffect(() => {
    return () => {
      emitChange.cancel();
      editorActionsRef.current = null;
      lastAppliedExternalKeyRef.current = incomingValueKey;
    };
  }, [emitChange, incomingValueKey]);

  useEffect(() => {
    if (!editorReady || !editorActionsRef.current?.replaceDocument) {
      return;
    }

    if (incomingValueKey === lastAppliedExternalKeyRef.current) {
      return;
    }

    lastAppliedExternalKeyRef.current = incomingValueKey;
    lastEmittedKeyRef.current = incomingValueKey;
    try {
      editorActionsRef.current.replaceDocument(value);
    } catch (error) {
      console.warn('Unable to apply external ADF update to Atlaskit editor', error);
    }
  }, [editorReady, incomingValueKey, value]);

  const handleEditorChange = useCallback(
    (editorView: EditorView) => {
      const adf = transformer.encode(editorView.state.doc as any) as ADFDoc;
      emitChange(adf);
    },
    [emitChange, transformer]
  );

  return (
    <EditorContext>
      <div className={darkMode ? 'atlas-editor atlas-editor--dark' : 'atlas-editor'}>
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
          codeBlock={{ allowCopyToClipboard: true, allowCompositionInputOverride: true }}
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
          defaultValue={value}
          skipValidation
          textFormatting={{}}
          useStickyToolbar
          annotationProviders={annotationProviders}
          contentTransformerProvider={() => transformer as never}
          mentionProvider={mentionProvider}
          emojiProvider={emojiProvider as never}
          media={{ provider: mediaProvider as never, allowMediaSingle: true, allowMediaGroup: true, allowResizing: true }}
          taskDecisionProvider={taskDecisionProvider}
          onEditorReady={(actions: EditorActions) => {
            editorActionsRef.current = actions;
            lastEmittedKeyRef.current = incomingValueKey;
            lastAppliedExternalKeyRef.current = incomingValueKey;
            setEditorReady(true);
          }}
          onChange={handleEditorChange}
        />
      </div>
    </EditorContext>
  );
});
