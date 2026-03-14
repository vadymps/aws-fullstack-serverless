export type Movie = {
  _id: string;
  title?: string;
  year?: number;
  genres?: string[];
  runtime?: number;
};

export type MoviesResponse = {
  ok: boolean;
  page: number;
  page_size: number;
  total: number;
  data: Movie[];
  error?: string;
  details?: string;
};
