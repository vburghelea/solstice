import { useState } from "react";

interface LogoProps {
  className?: string;
  alt?: string;
}

export function Logo({ className, alt = "Roundup Games logo" }: LogoProps) {
  const [src, setSrc] = useState<string>("/roundup-games-logo.svg");

  return (
    <img
      src={src}
      alt={alt}
      className={"object-contain " + (className ?? "")}
      onError={() => setSrc("/icons/roundup-games-icon.svg")}
    />
  );
}
