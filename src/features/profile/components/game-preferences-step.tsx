import { useEffect, useState } from "react";
import { useProfileTranslation } from "~/hooks/useTypedTranslation";
import { GameTagInput } from "~/shared/ui/game-tag-input";

const EMPTY_GAME_SYSTEM_ARRAY: { id: number; name: string }[] = [];

export function GamePreferencesStep({
  initialFavorites = EMPTY_GAME_SYSTEM_ARRAY,
  initialToAvoid = EMPTY_GAME_SYSTEM_ARRAY,
  onPreferencesChange,
}: {
  initialFavorites?: { id: number; name: string }[];
  initialToAvoid?: { id: number; name: string }[];
  onPreferencesChange: (
    favorites: { id: number; name: string }[],
    toAvoid: { id: number; name: string }[],
  ) => void;
}) {
  const { t } = useProfileTranslation();
  const [favorites, setFavorites] = useState(initialFavorites);
  const [toAvoid, setToAvoid] = useState(initialToAvoid);

  useEffect(() => {
    // Sync favorites when the initial values change (e.g. after fetching profile data)
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setFavorites(initialFavorites || []);
  }, [initialFavorites]);

  useEffect(() => {
    // Sync avoid list when the initial values change (e.g. after fetching profile data)
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setToAvoid(initialToAvoid || []);
  }, [initialToAvoid]);

  const handleAddFavorite = (tag: { id: number; name: string }) => {
    if (!favorites.some((fav) => fav.id === tag.id)) {
      const newFavorites = [...favorites, tag];
      setFavorites(newFavorites);
      onPreferencesChange(newFavorites, toAvoid);
    }
  };

  const handleRemoveFavorite = (id: number) => {
    const newFavorites = favorites.filter((fav) => fav.id !== id);
    setFavorites(newFavorites);
    onPreferencesChange(newFavorites, toAvoid);
  };

  const handleAddToAvoid = (tag: { id: number; name: string }) => {
    if (!toAvoid.some((avoid) => avoid.id === tag.id)) {
      const newToAvoid = [...toAvoid, tag];
      setToAvoid(newToAvoid);
      onPreferencesChange(favorites, newToAvoid);
    }
  };

  const handleRemoveFromToAvoid = (id: number) => {
    const newToAvoid = toAvoid.filter((avoid) => avoid.id !== id);
    setToAvoid(newToAvoid);
    onPreferencesChange(favorites, newToAvoid);
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 text-lg font-medium">
          {t("game_preferences_step.favorite_systems_title")}
        </h3>
        <GameTagInput
          tags={favorites}
          onAddTag={handleAddFavorite}
          onRemoveTag={handleRemoveFavorite}
          placeholder={t("game_preferences_step.favorite_systems_placeholder")}
        />
      </div>

      <div>
        <h3 className="mb-2 text-lg font-medium">
          {t("game_preferences_step.avoid_systems_title")}
        </h3>
        <GameTagInput
          tags={toAvoid}
          onAddTag={handleAddToAvoid}
          onRemoveTag={handleRemoveFromToAvoid}
          placeholder={t("game_preferences_step.avoid_systems_placeholder")}
          isDestructive={true}
        />
      </div>
    </div>
  );
}
