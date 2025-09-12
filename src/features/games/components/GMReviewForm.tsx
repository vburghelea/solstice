import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { gmStrengthLabels, gmStrengthOptions } from "~/shared/types/common";

type Props = {
  gameId: string;
  gmId: string;
  onSubmitted?: () => void;
};

// Simple thumbs input mapped to -2..2
const THUMBS: Array<{ value: number; label: string }> = [
  { value: -2, label: "👎👎" },
  { value: -1, label: "👎" },
  { value: 0, label: "👌" },
  { value: 1, label: "👍" },
  { value: 2, label: "👍👍" },
];

export function GMReviewForm({ gameId, gmId, onSubmitted }: Props) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState<number | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [comment, setComment] = useState<string>("");

  const mutation = useMutation({
    mutationFn: async (vars: {
      data: {
        gmId: string;
        gameId: string;
        rating: number;
        selectedStrengths: string[];
        comment?: string;
      };
    }) => {
      const { submitGMReview } = await import("~/features/profile/social.mutations");
      return submitGMReview(vars);
    },
    onSuccess: async (res) => {
      if (res.success) {
        toast.success("Thanks for your review!");
        await queryClient.invalidateQueries({ queryKey: ["gmReviews", gmId] });
        onSubmitted?.();
        setRating(null);
        setSelected([]);
        setComment("");
      } else {
        toast.error(res.message || "Failed to submit review");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit review");
    },
  });

  const toggle = (key: string) => {
    setSelected((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }
      if (prev.length >= 3) return prev; // exactly 3 allowed
      return [...prev, key];
    });
  };

  const canSubmit = rating !== null && selected.length <= 3 && !mutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review this GM</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label className="mb-2 block">Rate the GM</Label>
          <div className="flex flex-wrap gap-2">
            {THUMBS.map((t) => (
              <Button
                key={t.value}
                type="button"
                variant={rating === t.value ? "default" : "outline"}
                onClick={() => setRating(t.value)}
                size="sm"
              >
                {t.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <Label className="mb-2 block">Select up to 3 strengths</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {gmStrengthOptions.map((key) => (
              <label key={key} className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={selected.includes(key)}
                  onCheckedChange={() => toggle(key)}
                />
                <span>{gmStrengthLabels[key] ?? key}</span>
              </label>
            ))}
          </div>
          <div className="text-muted-foreground mt-2 text-xs">Choose up to 3 of 10</div>
        </div>

        <div className="mb-4">
          <Label className="mb-2 block">Comments (optional)</Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What stood out in this session?"
          />
        </div>

        <Button
          disabled={!canSubmit}
          onClick={() => {
            const payload: {
              gmId: string;
              gameId: string;
              rating: number;
              selectedStrengths: string[];
              comment?: string;
            } = {
              gmId,
              gameId,
              rating: rating as number,
              selectedStrengths: selected,
            };
            if (comment.trim().length > 0) payload.comment = comment;
            mutation.mutate({ data: payload });
          }}
        >
          {mutation.isPending ? "Submitting..." : "Submit Review"}
        </Button>
      </CardContent>
    </Card>
  );
}
