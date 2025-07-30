import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GameSystem } from "~/db/schema/game-systems.schema";
import { useDebounce } from "~/shared/lib/hooks/useDebounce";
import { cn } from "~/shared/lib/utils";
import { getGameSystems } from "../../features/profile/profile.queries";
import { Button } from "./button";
import { Input } from "./input";

interface TagInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tags: { id: number; name: string }[];
  onAddTag: (tag: { id: number; name: string }) => void;
  onRemoveTag: (id: number) => void;
  placeholder?: string;
}

type GetGameSystemsFn = (params?: {
  data?: { searchTerm?: string } | undefined;
}) => Promise<{ success: boolean; data: GameSystem[]; errors?: unknown[] }>;

export function TagInput({
  tags,
  onAddTag,
  onRemoveTag,
  placeholder,
  ...props
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const debouncedInputValue = useDebounce(inputValue, 500);

  const { data: gameSystems } = useQuery({
    queryKey: ["gameSystems", debouncedInputValue],
    queryFn: ({ queryKey }) => {
      const [, currentSearchTerm] = queryKey;
      const data =
        currentSearchTerm && currentSearchTerm.length >= 3
          ? { searchTerm: currentSearchTerm as string }
          : undefined;
      return (getGameSystems as GetGameSystemsFn)({ data });
    },
  });

  const [filteredSuggestions, setFilteredSuggestions] = useState<
    {
      id: number;
      name: string;
    }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const allGameSystems = gameSystems?.data || [];

  // Calculate derived state using useMemo
  const memoizedFilteredSuggestions = useMemo(() => {
    return inputValue
      ? allGameSystems.filter(
          (suggestion) =>
            !tags.some((tag) => tag.id === suggestion.id) &&
            suggestion.name.toLowerCase().includes(inputValue.toLowerCase()),
        )
      : [];
  }, [inputValue, allGameSystems, tags]);

  const memoizedShowSuggestions = useMemo(() => {
    return Boolean(inputValue) && memoizedFilteredSuggestions.length > 0;
  }, [inputValue, memoizedFilteredSuggestions]);

  // Use useEffect to set state based on memoized values
  useEffect(() => {
    setFilteredSuggestions(memoizedFilteredSuggestions);
    setShowSuggestions(memoizedShowSuggestions);
  }, [memoizedFilteredSuggestions, memoizedShowSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleAddSuggestion = (suggestion: { id: number; name: string }) => {
    onAddTag(suggestion);
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
            className="bg-primary text-primary-foreground flex items-center gap-1 rounded-md px-2 py-1 text-sm"
          >
            {tag.name}
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground/80 hover:bg-primary/80 hover:text-primary-foreground ml-1 h-auto p-0"
              onClick={() => handleRemoveTag(tag.id)}
            >
              &times;
            </Button>
          </span>
        ))}
      </div>
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
        {...props}
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul
          className={cn(
            "bg-popover border-border absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border shadow-lg",
            props.className, // Allow external classNames to be applied
          )}
        >
          {filteredSuggestions.map((suggestion) => (
            <li
              key={suggestion.id}
              className="hover:bg-accent hover:text-accent-foreground cursor-pointer px-4 py-2"
              onMouseDown={() => handleAddSuggestion(suggestion)}
            >
              {suggestion.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
