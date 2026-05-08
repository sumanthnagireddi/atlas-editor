import type { DocNode } from '@atlaskit/adf-schema';

export type ADFDoc = DocNode;

export type EditorMode = 'editor' | 'renderer';

export type AtlasPageWidthMode = 'centered' | 'wide' | 'full-width';
export type AtlasPageTitleAlignment = 'left' | 'center' | 'right';

export type AtlasPageStatusAppearance = 'default' | 'inprogress' | 'moved' | 'new' | 'removed' | 'success';

export interface AtlasEditorPage {
  title: string;
  authorName?: string;
  authorInitials?: string;
  updatedText?: string;
  metaItems?: string[];
  statusText?: string;
  statusAppearance?: AtlasPageStatusAppearance;
  widthMode?: AtlasPageWidthMode;
  titleAlignment?: AtlasPageTitleAlignment;
}

export interface AtlasEditorSubmission {
  page: AtlasEditorPage;
  value: ADFDoc;
}

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
  page?: AtlasEditorPage | null;
  onPageChange?: (page: AtlasEditorPage) => void;
  onPageSubmit?: (payload: AtlasEditorSubmission) => void;
  onPageCancel?: (payload: AtlasEditorSubmission) => void;
  onEditModeChange?: (isEditing: boolean) => void;
}

export interface AtlaskitEditorElement extends HTMLElement {
  value: ADFDoc;
  readOnly: boolean;
  mode: EditorMode;
  darkMode: boolean;
  debounceMs: number;
  page: AtlasEditorPage | null;
}
