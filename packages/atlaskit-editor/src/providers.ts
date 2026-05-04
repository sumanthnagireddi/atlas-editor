import type { EmojiProvider } from '@atlaskit/emoji/resource';
import type { MentionProvider } from '@atlaskit/mention/resource';

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
