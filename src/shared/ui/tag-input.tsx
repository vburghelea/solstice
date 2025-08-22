import * as React from "react";
import { useMemo, useRef, useState } from "react";
import { useDebounce } from "~/shared/lib/hooks/useDebounce";
import { cn } from "~/shared/lib/utils";
import { Button } from "./button";
import { Input } from "./input";

interface Tag {
  id: string;
  name: string;
}

interface TagInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tags: Tag[];
  onAddTag: (tag: Tag) => void;
  onRemoveTag: (id: string) => void;
  placeholder?: string;
  isDestructive?: boolean;
  availableSuggestions?: Tag[];
}

const EMPTY_TAG_SUGGESTIONS: Tag[] = [];

export function TagInput({
  tags,
  onAddTag,
  onRemoveTag,
  placeholder,
  isDestructive,
  availableSuggestions = EMPTY_TAG_SUGGESTIONS,
  ...props
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const debouncedInputValue = useDebounce(inputValue, 300); // Debounce for client-side filtering
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate derived state using useMemo for filtered suggestions
  const memoizedFilteredSuggestions = useMemo(() => {
    if (!debouncedInputValue) {
      return [];
    }

    const lowercasedInput = debouncedInputValue.toLowerCase();
    return availableSuggestions.filter(
      (suggestion) =>
        !tags.some((tag) => tag.id === suggestion.id) && // Exclude already added tags
        suggestion.name.toLowerCase().includes(lowercasedInput),
    );
  }, [debouncedInputValue, availableSuggestions, tags]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(true); // Show suggestions as soon as user types
  };

  const handleAddSuggestion = (suggestion: { id: string; name: string }) => {
    onAddTag(suggestion);
    setInputValue("");
    setShowSuggestions(false);
  };

  const handleAddTag = () => {
    if (inputValue.trim() !== "") {
      const existingSuggestion = availableSuggestions.find(
        (suggestion) => suggestion.name.toLowerCase() === inputValue.trim().toLowerCase(),
      );
      // Only add tag if it exists in suggestions
      if (existingSuggestion) {
        onAddTag(existingSuggestion);
      }
      setInputValue("");
      setShowSuggestions(false);
    }
  };

  const handleRemoveTag = (id: string) => {
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
      <div className="relative flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 100)} // Delay to allow click on suggestions
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddTag();
            }
          }}
          {...props}
        />
        <Button type="button" onClick={handleAddTag}>
          Add
        </Button>
        {showSuggestions && memoizedFilteredSuggestions.length > 0 && (
          <ul
            className={cn(
              "bg-popover border-border absolute top-full right-0 left-0 z-10 mt-1 max-h-60 overflow-auto rounded-md border shadow-lg",
              props.className, // Allow external classNames to be applied
            )}
          >
            {memoizedFilteredSuggestions.map((suggestion) => (
              <li
                key={suggestion.id}
                className="hover:bg-accent hover:text-accent-foreground cursor-pointer px-4 py-2"
                onMouseDown={() => handleAddSuggestion(suggestion)} // Use onMouseDown to prevent onBlur
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
