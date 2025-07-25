import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react"; // Import useMemo
import { cn } from "~/shared/lib/utils";
import { Button } from "./button";
import { Input } from "./input";

interface TagInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tags: { id: number; name: string }[];
  onAddTag: (tag: { id: number; name: string }) => void;
  onRemoveTag: (id: number) => void;
  suggestions: { id: number; name: string }[];
  placeholder?: string;
}

export function TagInput({
  tags,
  onAddTag,
  onRemoveTag,
  suggestions,
  placeholder,
  ...props
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<
    {
      id: number;
      name: string;
    }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate derived state using useMemo
  const memoizedFilteredSuggestions = useMemo(() => {
    return inputValue
      ? suggestions.filter(
          (suggestion) =>
            !tags.some((tag) => tag.id === suggestion.id) &&
            suggestion.name.toLowerCase().includes(inputValue.toLowerCase()),
        )
      : [];
  }, [inputValue, suggestions, tags]);

  const memoizedShowSuggestions = useMemo(() => {
    return Boolean(inputValue) && memoizedFilteredSuggestions.length > 0;
  }, [inputValue, memoizedFilteredSuggestions]);

  // Use useEffect to set state based on memoized values
  useEffect(() => {
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setFilteredSuggestions(memoizedFilteredSuggestions);
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
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
