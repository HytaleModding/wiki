export type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  avatar_url?: string;
  email_verified_at: string | null;
  two_factor_enabled?: boolean;
  created_at: string;
  updated_at: string;
  is_admin?: boolean;
  is_suspended?: boolean;
  [key: string]: unknown;
};

export type Auth = {
  user: User;
};

export type TwoFactorSetupData = {
  svg: string;
  url: string;
};

export type TwoFactorSecretKey = {
  secretKey: string;
};
