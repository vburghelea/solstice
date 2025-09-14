export interface PendingGMReviewItem {
  gameId: string;
  gameName: string;
  dateTime: Date;
  gm: { id: string; name: string | null; gmRating?: number | null };
}
