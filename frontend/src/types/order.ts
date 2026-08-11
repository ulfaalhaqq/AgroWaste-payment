export interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
  };
}
