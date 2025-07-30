import { useEffect, useState } from "react";
import { TagInput } from "~/shared/ui/tag-input";

export function GamePreferencesStep({
  initialFavorites,
  initialToAvoid,
  onPreferencesChange,
}: {
  initialFavorites?: { id: number; name: string }[];
  initialToAvoid?: { id: number; name: string }[];
  onPreferencesChange: (
    favorites: { id: number; name: string }[],
    toAvoid: { id: number; name: string }[],
  ) => void;
}) {
  const [favorites, setFavorites] = useState(initialFavorites || []);
  const [toAvoid, setToAvoid] = useState(initialToAvoid || []);

  useEffect(() => {
    setFavorites(initialFavorites || []);
  }, [initialFavorites]);

  useEffect(() => {
    setToAvoid(initialToAvoid || []);
  }, [initialToAvoid]);

  const handleAddFavorite = (tag: { id: number; name: string }) => {
    const newFavorites = [...favorites, tag];
    setFavorites(newFavorites);
    onPreferencesChange(newFavorites, toAvoid);
  };

  const handleRemoveFavorite = (id: number) => {
    const newFavorites = favorites.filter((fav) => fav.id !== id);
    setFavorites(newFavorites);
    onPreferencesChange(newFavorites, toAvoid);
  };

  const handleAddToAvoid = (tag: { id: number; name: string }) => {
    const newToAvoid = [...toAvoid, tag];
    setToAvoid(newToAvoid);
    onPreferencesChange(favorites, newToAvoid);
  };

  const handleRemoveFromToAvoid = (id: number) => {
    const newToAvoid = toAvoid.filter((avoid) => avoid.id !== id);
    setToAvoid(newToAvoid);
    onPreferencesChange(favorites, newToAvoid);
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 text-lg font-medium">Favorite Game Systems</h3>
        <TagInput
          tags={favorites}
          onAddTag={handleAddFavorite}
          onRemoveTag={handleRemoveFavorite}
          placeholder="Search and add favorite game systems..."
        />
      </div>

      <div>
        <h3 className="mb-2 text-lg font-medium">Game Systems to Avoid</h3>
        <TagInput
          tags={toAvoid}
          onAddTag={handleAddToAvoid}
          onRemoveTag={handleRemoveFromToAvoid}
          placeholder="Search and add game systems to avoid..."
        />
      </div>
    </div>
  );
}
