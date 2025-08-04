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
  const handleAddFavorite = (tag: { id: number; name: string }) => {
    const newFavorites = [...(initialFavorites || []), tag];
    onPreferencesChange(newFavorites, initialToAvoid || []);
  };

  const handleRemoveFavorite = (id: number) => {
    const newFavorites = (initialFavorites || []).filter((fav) => fav.id !== id);
    onPreferencesChange(newFavorites, initialToAvoid || []);
  };

  const handleAddToAvoid = (tag: { id: number; name: string }) => {
    const newToAvoid = [...(initialToAvoid || []), tag];
    onPreferencesChange(initialFavorites || [], newToAvoid);
  };

  const handleRemoveFromToAvoid = (id: number) => {
    const newToAvoid = (initialToAvoid || []).filter((avoid) => avoid.id !== id);
    onPreferencesChange(initialFavorites || [], newToAvoid);
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 text-lg font-medium">Favorite Game Systems</h3>
        <TagInput
          tags={initialFavorites || []}
          onAddTag={handleAddFavorite}
          onRemoveTag={handleRemoveFavorite}
          placeholder="Search and add favorite game systems..."
        />
      </div>

      <div>
        <h3 className="mb-2 text-lg font-medium">Game Systems to Avoid</h3>
        <TagInput
          tags={initialToAvoid || []}
          onAddTag={handleAddToAvoid}
          onRemoveTag={handleRemoveFromToAvoid}
          placeholder="Search and add game systems to avoid..."
        />
      </div>
    </div>
  );
}
