import React, { memo, type ReactNode, useEffect, useMemo, useState } from 'react';
import Button from '@atlaskit/button';
import CopyIcon from '@atlaskit/icon/core/copy';
import { normalizeADF } from './adf';
import type { ADFDoc } from './types';

type AtlaskitRendererProps = {
  value: ADFDoc;
  darkMode?: boolean;
  embedded?: boolean;
};

type ADFMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

type ADFNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: ADFMark[];
  content?: ADFNode[];
};

const EDITOR_THEME_THEME_ID = 'light:light dark:dark spacing:spacing typography:typography shape:shape motion:motion';

export const AtlaskitRenderer = memo(function AtlaskitRenderer({
  value,
  darkMode = false,
  embedded = false
}: AtlaskitRendererProps) {
  const document = useMemo(() => normalizeADF(value), [value]);

  const content = (
    <article className="atlas-renderer">
      {document.content?.map((node, index) => (
        <React.Fragment key={getNodeKey(node as ADFNode, index)}>{renderNode(node as ADFNode, index)}</React.Fragment>
      ))}
    </article>
  );

  if (embedded) {
    return content;
  }

  return (
    <div
      className={darkMode ? 'atlas-editor atlas-editor--dark' : 'atlas-editor'}
      data-color-mode={darkMode ? 'dark' : 'light'}
      data-subtree-theme
      data-theme={EDITOR_THEME_THEME_ID}
    >
      {content}
    </div>
  );
});

function renderNode(node: ADFNode, index: number, listDepth = 0): ReactNode {
  const key = getNodeKey(node, index);

  switch (node.type) {
    case 'paragraph':
      if (!node.content?.length) {
        return <p key={key} className="atlas-renderer-empty-paragraph" aria-hidden="true">&nbsp;</p>;
      }

      return <p key={key}>{renderInlineContent(node.content)}</p>;

    case 'heading': {
      const level = getHeadingLevel(node.attrs?.['level']);

      if (level === 1) {
        return <h1 key={key}>{renderInlineContent(node.content)}</h1>;
      }

      if (level === 2) {
        return <h2 key={key}>{renderInlineContent(node.content)}</h2>;
      }

      if (level === 3) {
        return <h3 key={key}>{renderInlineContent(node.content)}</h3>;
      }

      if (level === 4) {
        return <h4 key={key}>{renderInlineContent(node.content)}</h4>;
      }

      return <h5 key={key}>{renderInlineContent(node.content)}</h5>;
    }

    case 'bulletList':
      return (
        <ul key={key} className={listDepth > 0 ? 'atlas-renderer-sublist' : undefined}>
          {node.content?.map((child, childIndex) => renderNode(child, childIndex, listDepth + 1))}
        </ul>
      );

    case 'orderedList':
      return (
        <ol key={key} className={listDepth > 0 ? 'atlas-renderer-sublist' : undefined}>
          {node.content?.map((child, childIndex) => renderNode(child, childIndex, listDepth + 1))}
        </ol>
      );

    case 'listItem':
      return <li key={key}>{node.content?.map((child, childIndex) => renderNode(child, childIndex, listDepth))}</li>;

    case 'blockquote':
      return <blockquote key={key}>{node.content?.map((child, childIndex) => renderNode(child, childIndex))}</blockquote>;

    case 'rule':
      return <hr key={key} />;

    case 'codeBlock': {
      const language = typeof node.attrs?.['language'] === 'string' ? String(node.attrs?.['language']) : '';
      const textContent = flattenText(node.content);

      return (
        <RendererCodeBlock key={key} code={textContent} language={language} />
      );
    }

    case 'inlineCard':
      return <RendererCard key={key} url={getCardUrl(node)} appearance="inline" />;

    case 'blockCard':
      return <RendererCard key={key} url={getCardUrl(node)} appearance="block" />;

    case 'embedCard':
      return <RendererCard key={key} url={getCardUrl(node)} appearance="embed" />;

    case 'panel':
      return <section key={key} className="atlas-renderer-panel">{node.content?.map((child, childIndex) => renderNode(child, childIndex))}</section>;

    case 'expand':
      return (
        <details key={key} className="atlas-renderer-expand" open>
          <summary>{typeof node.attrs?.['title'] === 'string' ? String(node.attrs?.['title']) : 'Details'}</summary>
          <div>{node.content?.map((child, childIndex) => renderNode(child, childIndex))}</div>
        </details>
      );

    case 'mediaSingle':
    case 'mediaGroup':
      return (
        <div key={key} className="atlas-renderer-media-placeholder">
          Media
        </div>
      );

    case 'table':
      return (
        <div key={key} className="atlas-renderer-table-wrap">
          <table className="atlas-renderer-table">
            <tbody>{node.content?.map((child, childIndex) => renderNode(child, childIndex))}</tbody>
          </table>
        </div>
      );

    case 'tableRow':
      return <tr key={key}>{node.content?.map((child, childIndex) => renderNode(child, childIndex))}</tr>;

    case 'tableCell':
    case 'tableHeader': {
      const CellTag = node.type === 'tableHeader' ? 'th' : 'td';
      return <CellTag key={key}>{node.content?.map((child, childIndex) => renderNode(child, childIndex))}</CellTag>;
    }

    default:
      return node.content?.length ? (
        <div key={key}>{node.content.map((child, childIndex) => renderNode(child, childIndex, listDepth))}</div>
      ) : null;
  }
}

function renderInlineContent(content?: ADFNode[]): ReactNode {
  return content?.map((node, index) => {
    if (node.type === 'text') {
      return <React.Fragment key={getNodeKey(node, index)}>{renderTextWithMarks(node.text ?? '', node.marks)}</React.Fragment>;
    }

    if (node.type === 'hardBreak') {
      return <br key={getNodeKey(node, index)} />;
    }

    if (node.type === 'emoji') {
      return <span key={getNodeKey(node, index)}>{String(node.attrs?.['text'] ?? node.attrs?.['shortName'] ?? '')}</span>;
    }

    if (node.type === 'mention') {
      return <span key={getNodeKey(node, index)} className="atlas-renderer-mention">@{String(node.attrs?.['text'] ?? 'mention')}</span>;
    }

    return <React.Fragment key={getNodeKey(node, index)}>{renderNode(node, index)}</React.Fragment>;
  }) ?? null;
}

function renderTextWithMarks(text: string, marks?: ADFMark[]): ReactNode {
  return (marks ?? []).reduce<ReactNode>((content, mark, index) => {
    const key = `${mark.type}-${index}`;

    switch (mark.type) {
      case 'strong':
        return <strong key={key}>{content}</strong>;
      case 'em':
        return <em key={key}>{content}</em>;
      case 'strike':
        return <s key={key}>{content}</s>;
      case 'underline':
        return <u key={key}>{content}</u>;
      case 'code':
        return <code key={key} className="atlas-inline-code">{content}</code>;
      case 'textColor':
        return <span key={key} style={{ color: String(mark.attrs?.['color'] ?? '') }}>{content}</span>;
      case 'link':
        return (
          <a
            key={key}
            href={typeof mark.attrs?.['href'] === 'string' ? String(mark.attrs?.['href']) : '#'}
            target="_blank"
            rel="noreferrer"
          >
            {content}
          </a>
        );
      default:
        return content;
    }
  }, text);
}

function flattenText(content?: ADFNode[]): string {
  return (
    content?.map((node) => {
      if (node.type === 'text') {
        return node.text ?? '';
      }

      if (node.type === 'hardBreak') {
        return '\n';
      }

      return flattenText(node.content);
    }).join('') ?? ''
  );
}

function getCardUrl(node: ADFNode): string {
  return typeof node.attrs?.['url'] === 'string' ? String(node.attrs['url']) : '';
}

const RendererCodeBlock = memo(function RendererCodeBlock({
  code,
  language
}: {
  code: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 1500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copied]);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.setAttribute('readonly', 'true');
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.append(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      setCopied(true);
    } catch (error) {
      console.warn('Unable to copy renderer code block', error);
    }
  };

  return (
    <figure className="atlas-renderer-code-block">
      <div className="atlas-renderer-code-block__header">
        <span className="atlas-renderer-code-block__language">{language || 'Plain text'}</span>
        <Button
          appearance="subtle"
          spacing="compact"
          iconBefore={<CopyIcon label="" />}
          onClick={handleCopy}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </figure>
  );
});

const RendererCard = memo(function RendererCard({
  url,
  appearance
}: {
  url: string;
  appearance: 'inline' | 'block' | 'embed';
}) {
  const hostname = getHostName(url);

  if (!url) {
    return null;
  }

  if (appearance === 'inline') {
    return (
      <a className="atlas-renderer-inline-card" href={url} target="_blank" rel="noreferrer">
        {hostname}
      </a>
    );
  }

  return (
    <a
      className={`atlas-renderer-card atlas-renderer-card--${appearance}`}
      href={url}
      target="_blank"
      rel="noreferrer"
    >
      <span className="atlas-renderer-card__eyebrow">{appearance === 'embed' ? 'Embed card' : 'Smart link'}</span>
      <span className="atlas-renderer-card__title">{hostname}</span>
      <span className="atlas-renderer-card__url">{url}</span>
    </a>
  );
});

function getHostName(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function getHeadingLevel(level: unknown): number {
  const parsed = Number(level);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 1;
}

function getNodeKey(node: ADFNode, index: number): string {
  const localId = node.attrs?.['localId'];
  return typeof localId === 'string' && localId.length > 0 ? localId : `${node.type}-${index}`;
}
