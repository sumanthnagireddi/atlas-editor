import React, { useMemo, useState } from 'react';
import type { EmojiProvider } from '@atlaskit/emoji/resource';
import type { MentionProvider } from '@atlaskit/mention/resource';
import type { AnnotationProviders, InlineCommentCreateComponentProps, InlineCommentViewComponentProps } from '@atlaskit/editor-plugin-annotation';
import type { TaskDecisionProvider, TaskState } from '@atlaskit/task-decision';

type MentionRecord = {
  id: string;
  name: string;
  mentionName: string;
  avatarUrl?: string;
};

const people: MentionRecord[] = [
  {
    id: 'ada',
    name: 'Ada Lovelace',
    mentionName: 'ada'
  },
  {
    id: 'grace',
    name: 'Grace Hopper',
    mentionName: 'grace'
  },
  {
    id: 'katherine',
    name: 'Katherine Johnson',
    mentionName: 'katherine'
  }
];

export function createMentionProvider(): Promise<MentionProvider> {
  const provider: any = {
    subscribe(_key: string, callback: (mentions: MentionRecord[], query?: string) => void): void {
      callback(people, '');
    },
    unsubscribe(): void {
      return;
    },
    filter(query?: string): void {
      const normalizedQuery = query?.toLowerCase() ?? '';
      const results = people.filter((person) => {
        return person.name.toLowerCase().includes(normalizedQuery) || person.mentionName.includes(normalizedQuery);
      });

      provider.recordMentionSelection = () => undefined;
      provider._lastResults = results;
    },
    shouldHighlightMention(): boolean {
      return true;
    },
    isFiltering(): boolean {
      return false;
    },
    recordMentionSelection(): void {
      return;
    },
    _lastResults: people
  };

  return Promise.resolve(provider as MentionProvider);
}

export function createEmojiProvider(): Promise<EmojiProvider> {
  const fallbackProvider: any = {
    filter(query?: string) {
      const emojis = [
        { id: 'thumbsup', shortName: ':thumbsup:', name: 'Thumbs up', type: 'standard' },
        { id: 'white_check_mark', shortName: ':white_check_mark:', name: 'Check mark', type: 'standard' },
        { id: 'memo', shortName: ':memo:', name: 'Memo', type: 'standard' }
      ];

      const normalizedQuery = query?.replaceAll(':', '').toLowerCase() ?? '';
      return Promise.resolve({
        emojis: emojis.filter((emoji) => emoji.name.toLowerCase().includes(normalizedQuery) || emoji.shortName.includes(normalizedQuery))
      });
    },
    findByShortName(shortName: string) {
      return fallbackProvider.filter(shortName).then((result: { emojis: unknown[] }) => result.emojis[0]);
    }
  };

  return Promise.resolve(fallbackProvider as EmojiProvider);
}

type InlineCommentRecord = {
  id: string;
  resolved: boolean;
  text: string;
};

type CardAppearance = 'inline' | 'block' | 'embed';
type TaskDecisionHandlerState = TaskState | 'DECIDED';

const inlineCommentStore = new Map<string, InlineCommentRecord>();
const taskStateStore = new Map<string, TaskState>();
const taskSubscribers = new Map<string, Set<(state: TaskDecisionHandlerState) => void>>();

function InlineCommentCreateView(props: InlineCommentCreateComponentProps) {
  const [text, setText] = useState(props.textSelection ?? '');

  return React.createElement(
    'div',
    { className: 'atlas-inline-comment' },
    React.createElement(
      'div',
      { className: 'atlas-inline-comment__title' },
      'Inline comment'
    ),
    React.createElement(
      'div',
      { className: 'atlas-inline-comment__selection' },
      props.textSelection || 'Create a comment for this selection.'
    ),
    React.createElement('textarea', {
      className: 'atlas-inline-comment__textarea',
      value: text,
      rows: 4,
      placeholder: 'Add a comment...',
      onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => setText(event.target.value)
    }),
    React.createElement(
      'div',
      { className: 'atlas-inline-comment__actions' },
      React.createElement(
        'button',
        {
          className: 'atlas-inline-comment__button atlas-inline-comment__button--secondary',
          type: 'button',
          onClick: () => props.onClose?.()
        },
        'Cancel'
      ),
      React.createElement(
        'button',
        {
          className: 'atlas-inline-comment__button atlas-inline-comment__button--primary',
          type: 'button',
          disabled: text.trim().length === 0,
          onClick: () => {
            const id = `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            inlineCommentStore.set(id, {
              id,
              resolved: false,
              text: text.trim()
            });
            props.onCreate(id);
            props.onClose?.();
          }
        },
        'Comment'
      )
    )
  );
}

function InlineCommentView(props: InlineCommentViewComponentProps) {
  const activeAnnotation = useMemo(() => {
    return props.annotations.find((annotation) => inlineCommentStore.has(annotation.id));
  }, [props.annotations]);

  const activeRecord = activeAnnotation ? inlineCommentStore.get(activeAnnotation.id) : undefined;

  if (!activeAnnotation || !activeRecord) {
    return React.createElement(
      'div',
      { className: 'atlas-inline-comment atlas-inline-comment--empty' },
      'No comment data available.'
    );
  }

  return React.createElement(
    'div',
    { className: 'atlas-inline-comment' },
    React.createElement(
      'div',
      { className: 'atlas-inline-comment__title' },
      activeRecord.resolved ? 'Resolved comment' : 'Open comment'
    ),
    React.createElement(
      'div',
      { className: 'atlas-inline-comment__selection' },
      activeRecord.text
    ),
    React.createElement(
      'div',
      { className: 'atlas-inline-comment__actions' },
      React.createElement(
        'button',
        {
          className: 'atlas-inline-comment__button atlas-inline-comment__button--secondary',
          type: 'button',
          onClick: () => props.onClose?.()
        },
        'Close'
      ),
      React.createElement(
        'button',
        {
          className: 'atlas-inline-comment__button atlas-inline-comment__button--primary',
          type: 'button',
          onClick: () => {
            inlineCommentStore.set(activeRecord.id, {
              ...activeRecord,
              resolved: !activeRecord.resolved
            });
            props.onClose?.();
          }
        },
        activeRecord.resolved ? 'Reopen' : 'Resolve'
      )
    )
  );
}

export function createAnnotationProviders(): AnnotationProviders {
  return {
    createCommentExperience: {
      initExperience: {
        start: () => undefined
      },
      start: () => undefined
    },
    inlineComment: {
      contentType: 'atlaskit/adf',
      getCanAddComments: () => true,
      getState: (annotationIds) =>
        Promise.resolve(
          annotationIds.map((id) => ({
            annotationType: 'inlineComment' as never,
            id,
            state: {
              resolved: inlineCommentStore.get(id)?.resolved ?? false
            }
          }))
        ),
      supportedBlockNodes: ['mediaSingle', 'media', 'paragraph', 'heading', 'blockquote', 'panel'],
      createComponent: InlineCommentCreateView,
      viewComponent: InlineCommentView
    },
    selectCommentExperience: {
      selectAnnotation: {
        complete: () => undefined
      }
    }
  };
}

export function createTaskDecisionProvider(): Promise<TaskDecisionProvider> {
  const provider: TaskDecisionProvider = {
    notifyRecentUpdates: () => undefined,
    subscribe(objectKey, handler, item) {
      const cacheKey = `${objectKey.objectAri}:${objectKey.localId}`;
      const listeners = taskSubscribers.get(cacheKey) ?? new Set<(state: TaskDecisionHandlerState) => void>();
      listeners.add(handler as (state: TaskDecisionHandlerState) => void);
      taskSubscribers.set(cacheKey, listeners);

      const taskItemState: TaskState | undefined =
        item?.type === 'TASK' && (item.state === 'TODO' || item.state === 'DONE') ? item.state : undefined;
      const initialState =
        taskStateStore.get(cacheKey) ??
        taskItemState ??
        'TODO';
      taskStateStore.set(cacheKey, initialState);
      handler(initialState);
    },
    async toggleTask(objectKey, state) {
      const cacheKey = `${objectKey.objectAri}:${objectKey.localId}`;
      taskStateStore.set(cacheKey, state);
      const listeners = taskSubscribers.get(cacheKey);
      listeners?.forEach((listener) => listener(state));
      return state;
    },
    unsubscribe(objectKey, handler) {
      const cacheKey = `${objectKey.objectAri}:${objectKey.localId}`;
      taskSubscribers.get(cacheKey)?.delete(handler as (state: TaskDecisionHandlerState) => void);
    },
    unsubscribeRecentUpdates: () => undefined
  };

  return Promise.resolve(provider);
}

export function createCardProvider(): Promise<{
  resolve: (url: string, appearance: CardAppearance) => Promise<Record<string, unknown>>;
}> {
  return Promise.resolve({
    resolve: async (url: string, appearance: CardAppearance) => {
      if (appearance === 'block') {
        return {
          type: 'blockCard',
          attrs: { url }
        };
      }

      if (appearance === 'embed') {
        return {
          type: 'embedCard',
          attrs: {
            url,
            layout: 'center'
          }
        };
      }

      return {
        type: 'inlineCard',
        attrs: { url }
      };
    }
  });
}

export function createMockMediaProvider(): Promise<unknown> {
  const uploadContext = {
    config: {
      authProvider: () =>
        Promise.resolve({
          clientId: 'mock-client',
          token: 'mock-token',
          baseUrl: 'https://api.media.atlassian.com'
        })
    }
  };

  return Promise.resolve({
    uploadParams: {
      collection: 'atlas-editor'
    },
    viewContext: uploadContext,
    uploadContext
  } as unknown as MediaProvider);
}
