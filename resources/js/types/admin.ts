export type PaginationLink = {
  url: string | null;
  label: string;
  active: boolean;
};
export type Paginated<T> = {
  data: T[];
  links: PaginationLink[];
  current_page: number;
  last_page: number;
  total: number;
  from: number | null;
  to: number | null;
};
export type AuditItem = {
  id: number;
  actor: string;
  action: string;
  description: string;
  subject_type: string;
  subject_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};
export type AdminUser = {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar: string;
  is_admin: boolean;
  is_suspended: boolean;
  owned_mods_count: number;
  api_keys_count: number;
  created_at: string;
};
export type AdminMod = {
  id: string;
  name: string;
  slug: string;
  owner: string | { name: string; username: string; email: string };
  pages_count: number;
  collaborators_count: number | null;
  is_suspended: boolean;
  github_connected: boolean;
  visibility: string;
  updated_at: string;
};
export type AdminApiKey = {
  id: number;
  name: string;
  prefix: string;
  user: { name: string; email: string | null };
  scopes: string[];
  rate_limit: number;
  logs_count: number;
  last_used_at: string | null;
  expires_at: string | null;
  expired: boolean;
  created_at: string;
};
