export type Favorite = {
  _id: string;
  movie_id: string;
  title?: string;
  year?: number;
  genres?: string[];
  runtime?: number;
  poster?: string;
  created_at?: string;
};

export type FavoritesResponse = {
  ok: boolean;
  page: number;
  page_size: number;
  total: number;
  data: Favorite[];
  error?: string;
  details?: string;
};

export type FavoriteIdsResponse = {
  ok: boolean;
  data: string[];
  error?: string;
  details?: string;
};

export type FavoriteMutationResponse = {
  ok: boolean;
  added?: boolean;
  removed?: boolean;
  data?: Favorite | null;
  error?: string;
  details?: string;
};
