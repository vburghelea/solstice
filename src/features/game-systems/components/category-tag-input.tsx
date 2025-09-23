import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { searchCategories } from "~/features/game-systems/game-systems.queries";
import type { GameSystemCategoryTag } from "~/features/game-systems/game-systems.types";
import { useDebounce } from "~/shared/lib/hooks/useDebounce";
import { cn } from "~/shared/lib/utils";

interface CategoryTagInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tags: GameSystemCategoryTag[];
  onAddTag: (tag: GameSystemCategoryTag) => void;
  onRemoveTag: (id: number) => void;
  placeholder?: string;
  limit?: number;
}

const EMPTY_SUGGESTIONS: GameSystemCategoryTag[] = [];

export function CategoryTagInput({
  tags,
  onAddTag,
  onRemoveTag,
  placeholder,
  limit = 20,
  ...props
}: CategoryTagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const debouncedValue = useDebounce(inputValue, 300);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchTerm = debouncedValue.trim();

  const { data: suggestionsResult } = useQuery({
    queryKey: ["game-system-categories", searchTerm, limit] as const,
    queryFn: async () =>
      searchCategories({
        data: {
          q: searchTerm.length > 0 ? searchTerm : undefined,
          limit,
        },
      }),
    staleTime: 60_000,
  });

  const suggestions = useMemo(() => {
    const allSuggestions = suggestionsResult ?? EMPTY_SUGGESTIONS;
    const selectedIds = new Set(tags.map((tag) => tag.id));
    return allSuggestions.filter((suggestion) => !selectedIds.has(suggestion.id));
  }, [suggestionsResult, tags]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setShowSuggestions(true);
  };

  const handleAddTag = (tag: GameSystemCategoryTag) => {
    onAddTag(tag);
    setInputValue("");
    setShowSuggestions(false);
  };

  const handleRemoveTag = (id: number) => {
    onRemoveTag(id);
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="bg-primary/10 text-primary flex items-center gap-1 rounded-md px-2 py-1 text-sm"
          >
            {tag.name}
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/10 ml-1 h-auto p-0"
              onClick={() => handleRemoveTag(tag.id)}
            >
              &times;
            </Button>
          </span>
        ))}
      </div>
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
          {...props}
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul
            className={cn(
              "bg-popover border-border absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border shadow-lg",
              props.className,
            )}
          >
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.id}
                className="hover:bg-accent hover:text-accent-foreground cursor-pointer px-4 py-2 text-sm"
                onMouseDown={() => handleAddTag(suggestion)}
              >
                {suggestion.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
