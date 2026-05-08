import type { ADFDoc, VersionedADFDocument } from './types';

export const EMPTY_ADF_DOCUMENT = Object.freeze({
  version: 1,
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: []
    }
  ]
}) as ADFDoc;

export function isADFDocument(value: unknown): value is ADFDoc {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ADFDoc>;
  return candidate.version === 1 && candidate.type === 'doc';
}

export function normalizeADF(value: unknown): ADFDoc {
  if (!value || typeof value !== 'object') {
    return structuredClone(EMPTY_ADF_DOCUMENT);
  }

  const candidate = value as Partial<ADFDoc> & {
    content?: unknown;
  };

  if (candidate.type !== 'doc') {
    return structuredClone(EMPTY_ADF_DOCUMENT);
  }

  return structuredClone({
    ...candidate,
    version: 1,
    content: Array.isArray(candidate.content) ? candidate.content : []
  }) as ADFDoc;
}

export function stableADFString(value: unknown): string {
  return JSON.stringify(normalizeADF(value));
}

export function toVersionedDocument(doc: ADFDoc, version: number): VersionedADFDocument {
  return {
    version,
    updatedAt: new Date().toISOString(),
    doc: normalizeADF(doc)
  };
}
