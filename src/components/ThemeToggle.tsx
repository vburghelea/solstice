import { useTheme } from "~/shared/hooks/useTheme";
import { Button } from "~/shared/ui/button";
import { MoonIcon, SunIcon } from "~/shared/ui/icons";

export default function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <Button variant="outline" size="icon" type="button" onClick={toggleTheme}>
      <SunIcon className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <MoonIcon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
