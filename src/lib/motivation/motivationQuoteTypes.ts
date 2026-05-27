export type RemoteMotivationQuote = {
  text: string;
  author: string | null;
  categories: string[];
  source: 'api-ninjas';
};

export type MotivationQuoteApiResponse = {
  quote: RemoteMotivationQuote | null;
};
