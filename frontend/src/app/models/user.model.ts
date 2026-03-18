export type User = {
  _id: string;
  name?: string;
  email?: string;
};

export type UsersResponse = {
  ok: boolean;
  page: number;
  page_size: number;
  total: number;
  data: User[];
  error?: string;
  details?: string;
};
