export type Movie = {
  _id: string;
  title?: string;
  year?: number;
  genres?: string[];
  runtime?: number;
  poster?: string;
};

export type MovieDetail = Movie & {
  plot?: string;
  fullplot?: string;
  cast?: string[];
  directors?: string[];
  countries?: string[];
  language?: string;
  rated?: string;
  released?: string;
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

export type MovieDetailResponse = {
  ok: boolean;
  data: MovieDetail;
  error?: string;
  details?: string;
};
