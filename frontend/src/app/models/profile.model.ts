export interface ProfileData {
  email: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export interface ProfileResponse {
  ok: boolean;
  data: ProfileData;
}
