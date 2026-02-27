export interface DashboardStats {
  ownedModsCount: number;
  collaborativeModsCount: number;
  totalModsCount: number;
  totalPagesCount: number;
  totalCollaborators: number;
  totalFiles: number;
  publicViewsCount: number;
  recentMods: RecentMod[];
}

export interface Collaborator {
  id: string;
  username: string;
  avatar: string;
}

export interface RecentMod {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: 'public' | 'private' | 'unlisted';
  updated_at: string;
  is_owner: boolean;
  pages_count: number;
  collaborators_count: number;
  collaborators: Collaborator[];
}

export interface ModInfo {
  id: string;
  name: string;
  slug: string;
}

export interface UserInfo {
  id: string;
  username: string;
  avatar: string;
}

export interface RecentPage {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  updated_at: string;
  mod: ModInfo;
  updated_by: UserInfo | null;
}

export interface PendingInvitation {
  id: string;
  token: string;
  role: 'viewer' | 'editor' | 'admin';
  expires_at: string;
  mod: ModInfo;
  invited_by: UserInfo;
}

export interface DashboardProps {
  stats: DashboardStats;
  recentMods: RecentMod[];
  recentPages: RecentPage[];
  pendingInvitations: PendingInvitation[];
}
