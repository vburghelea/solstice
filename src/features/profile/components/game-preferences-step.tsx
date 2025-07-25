import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TagInput } from "~/shared/ui/tag-input";
import { getGameSystems } from "../profile.queries";

export function GamePreferencesStep({
  initialFavorites,
  initialToAvoid,
  onPreferencesChange,
}: {
  initialFavorites?: number[];
  initialToAvoid?: number[];
  onPreferencesChange: (favorites: number[], toAvoid: number[]) => void;
}) {
  const { data: gameSystems, isLoading } = useQuery({
    queryKey: ["gameSystems"],
    queryFn: () => getGameSystems(),
  });

  const [favorites, setFavorites] = useState(initialFavorites || []);
  const [toAvoid, setToAvoid] = useState(initialToAvoid || []);

  const handleAddFavorite = (tag: { id: number; name: string }) => {
    const newFavorites = [...favorites, tag.id];
    setFavorites(newFavorites);
    onPreferencesChange(newFavorites, toAvoid);
  };

  const handleRemoveFavorite = (id: number) => {
    const newFavorites = favorites.filter((favId) => favId !== id);
    setFavorites(newFavorites);
    onPreferencesChange(newFavorites, toAvoid);
  };

  const handleAddToAvoid = (tag: { id: number; name: string }) => {
    const newToAvoid = [...toAvoid, tag.id];
    setToAvoid(newToAvoid);
    onPreferencesChange(favorites, newToAvoid);
  };

  const handleRemoveFromToAvoid = (id: number) => {
    const newToAvoid = toAvoid.filter((avoidId) => avoidId !== id);
    setToAvoid(newToAvoid);
    onPreferencesChange(favorites, newToAvoid);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const allGameSystems = gameSystems?.data || [];

  const favoriteTags = favorites.map((id) => ({
    id,
    name: allGameSystems.find((system) => system.id === id)?.name || "",
  }));

  const toAvoidTags = toAvoid.map((id) => ({
    id,
    name: allGameSystems.find((system) => system.id === id)?.name || "",
  }));

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 text-lg font-medium">Favorite Game Systems</h3>
        <TagInput
          tags={favoriteTags}
          onAddTag={handleAddFavorite}
          onRemoveTag={handleRemoveFavorite}
          suggestions={allGameSystems.filter(
            (system) => !favorites.includes(system.id) && !toAvoid.includes(system.id),
          )}
          placeholder="Search and add favorite game systems..."
        />
      </div>

      <div>
        <h3 className="mb-2 text-lg font-medium">Game Systems to Avoid</h3>
        <TagInput
          tags={toAvoidTags}
          onAddTag={handleAddToAvoid}
          onRemoveTag={handleRemoveFromToAvoid}
          suggestions={allGameSystems.filter(
            (system) => !favorites.includes(system.id) && !toAvoid.includes(system.id),
          )}
          placeholder="Search and add game systems to avoid..."
        />
      </div>
    </div>
  );
}
