import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { useMemo, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  getGameSystems,
  type GameSystemSummary,
} from "~/features/profile/profile.queries";
import { useDebounce } from "~/shared/hooks/useDebounce";
import { cn } from "~/shared/lib/utils";
import type { OperationResult, OptionalFetcher } from "~/shared/types/common";

interface GameTagInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tags: { id: number; name: string }[];
  onAddTag: (tag: { id: number; name: string }) => void;
  onRemoveTag: (id: number) => void;
  placeholder?: string;
  isDestructive?: boolean;
}

export function GameTagInput({
  tags,
  onAddTag,
  onRemoveTag,
  placeholder,
  isDestructive, // Add this line
  ...props
}: GameTagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const debouncedInputValue = useDebounce(inputValue, 500);

  const getGameSystemsQuery: OptionalFetcher<
    { searchTerm?: string },
    OperationResult<GameSystemSummary[]>
  > = getGameSystems;

  const { data: gameSystems } = useQuery<
    OperationResult<GameSystemSummary[]>,
    Error,
    OperationResult<GameSystemSummary[]>,
    readonly [string, string]
  >({
    queryKey: ["gameSystems", debouncedInputValue] as const,
    queryFn: ({ queryKey }) => {
      const [, currentSearchTerm] = queryKey;
      const data =
        currentSearchTerm.length >= 3 ? { searchTerm: currentSearchTerm } : undefined;
      return data ? getGameSystemsQuery({ data }) : getGameSystemsQuery();
    },
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate derived state using useMemo
  const memoizedFilteredSuggestions = useMemo(() => {
    const allGameSystems = gameSystems && gameSystems.success ? gameSystems.data : [];
    return inputValue
      ? allGameSystems.filter(
          (suggestion: GameSystemSummary) =>
            !tags.some((tag) => tag.id === suggestion.id) &&
            suggestion.name.toLowerCase().includes(inputValue.toLowerCase()),
        )
      : [];
  }, [inputValue, gameSystems, tags]);

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
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-sm",
              isDestructive
                ? "bg-destructive text-destructive-foreground"
                : "bg-primary text-primary-foreground",
            )}
          >
            {tag.name}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "ml-1 h-auto p-0",
                isDestructive
                  ? "text-destructive-foreground/80 hover:bg-destructive/80 hover:text-destructive-foreground"
                  : "text-primary-foreground/80 hover:bg-primary/80 hover:text-primary-foreground",
              )}
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
      {showSuggestions && memoizedFilteredSuggestions.length > 0 && (
        <ul
          className={cn(
            "bg-popover border-border absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border shadow-lg",
            props.className, // Allow external classNames to be applied
          )}
        >
          {memoizedFilteredSuggestions.map((suggestion: GameSystemSummary) => (
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
