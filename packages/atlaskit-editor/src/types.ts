import type { DocNode } from '@atlaskit/adf-schema';

export type ADFDoc = DocNode;

export type EditorMode = 'editor' | 'renderer';

export interface VersionedADFDocument {
  version: number;
  updatedAt: string;
  doc: ADFDoc;
}

export interface AtlaskitEditorProps {
  value: ADFDoc;
  onChange: (data: ADFDoc) => void;
  readOnly?: boolean;
  mode?: EditorMode;
  darkMode?: boolean;
  debounceMs?: number;
  placeholder?: string;
}

export interface AtlaskitEditorElement extends HTMLElement {
  value: ADFDoc;
  readOnly: boolean;
  mode: EditorMode;
  darkMode: boolean;
  debounceMs: number;
}
