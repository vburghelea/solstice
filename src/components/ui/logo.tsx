import { useState } from "react";

interface LogoProps {
  className?: string;
  alt?: string;
}

export function Logo({ className, alt = "Quadball Canada logo" }: LogoProps) {
  const [src, setSrc] = useState<string>("/quadball-canada-logo.svg");

  return (
    <img
      src={src}
      alt={alt}
      className={"object-contain " + (className ?? "")}
      onError={() => setSrc("/quadball-canada-logo.jpg")}
    />
  );
}
