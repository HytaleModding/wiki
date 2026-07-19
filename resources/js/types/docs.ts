export interface DocUser {
  id: number;
  name: string;
  username: string;
}

export interface DocPageNode {
  id: string;
  title: string;
  slug: string;
  kind: 'page' | 'category';
  content?: string;
  published?: boolean;
  updated_at?: string;
  children?: DocPageNode[];
}

export interface DocMod {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_url?: string;
  visibility: 'public' | 'private' | 'unlisted';
  custom_css?: string | null;
  owner: DocUser;
}
