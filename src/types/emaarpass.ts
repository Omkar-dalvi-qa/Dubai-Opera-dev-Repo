export type EmaarPassUserProfile = {
  sub?: string;
  email?: string;
  phone_number?: string;
  first_name?: string | null;
  last_name?: string | null;
  [key: string]: unknown;
};

