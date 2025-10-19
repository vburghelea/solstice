import { useRouterState } from "@tanstack/react-router";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useLanguageSwitcher } from "~/hooks/useLanguageDetection";
import { SupportedLanguage } from "~/lib/i18n/config";
import { getSupportedLanguages } from "~/lib/i18n/utils";

interface LanguageSwitcherProps {
  variant?: "default" | "compact" | "flags";
  showLabel?: boolean;
  className?: string;
}

export function LanguageSwitcher({
  variant = "default",
  showLabel = true,
  className = "",
}: LanguageSwitcherProps) {
  const { location } = useRouterState();
  const { currentLanguage, switchLanguage, isUpdating } = useLanguageSwitcher(
    location.pathname,
  );
  const [isOpen, setIsOpen] = useState(false);
  const supportedLanguages = getSupportedLanguages();

  const currentLanguageInfo = supportedLanguages.find(
    (lang) => lang.code === currentLanguage,
  );

  const handleLanguageChange = async (language: SupportedLanguage) => {
    setIsOpen(false);
    await switchLanguage(language);
  };

  if (variant === "compact") {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${className}`}
            disabled={isUpdating}
          >
            {currentLanguageInfo?.flag}
            {showLabel && (
              <span className="hidden sm:inline">{currentLanguageInfo?.nativeName}</span>
            )}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {supportedLanguages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className="gap-2"
            >
              <span>{language.flag}</span>
              <span>{language.nativeName}</span>
              {language.code === currentLanguage && (
                <Check className="ml-auto h-4 w-4" data-testid="check-icon" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "flags") {
    return (
      <div className={`flex gap-1 ${className}`}>
        {supportedLanguages.map((language) => (
          <Button
            key={language.code}
            variant={language.code === currentLanguage ? "default" : "ghost"}
            size="sm"
            onClick={() => handleLanguageChange(language.code)}
            disabled={isUpdating}
            className="p-2"
            title={language.nativeName}
          >
            <span className="text-lg">{language.flag}</span>
          </Button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`gap-2 ${className}`} disabled={isUpdating}>
          <Globe className="h-4 w-4" />
          {showLabel && (
            <span className="hidden sm:inline">{currentLanguageInfo?.nativeName}</span>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="text-muted-foreground px-2 py-1.5 text-sm font-medium">
          Language / Sprache / Język
        </div>
        <DropdownMenuSeparator />
        {supportedLanguages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="gap-3"
          >
            <span className="text-base">{language.flag}</span>
            <div className="flex flex-col">
              <span className="font-medium">{language.nativeName}</span>
              <span className="text-muted-foreground text-xs">{language.name}</span>
            </div>
            {language.code === currentLanguage && (
              <Check className="text-primary ml-auto h-4 w-4" data-testid="check-icon" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
