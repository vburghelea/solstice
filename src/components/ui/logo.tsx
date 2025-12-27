import { useEffect, useState } from "react";
import { getBrand } from "~/tenant";

interface LogoProps {
  className?: string;
  alt?: string;
}

const logoSources = {
  qc: {
    src: "/quadball-canada-logo.svg",
    fallback: "/quadball-canada-logo.jpg",
  },
  viasport: {
    src: "/viasport-logo.svg",
    fallback: "/viasport-logo.svg",
  },
} as const;

export function Logo({ className, alt }: LogoProps) {
  const brand = getBrand();
  const source = brand.logoVariant === "viasport" ? logoSources.viasport : logoSources.qc;
  const [src, setSrc] = useState<string>(source.src);

  useEffect(() => {
    setSrc(source.src);
  }, [source.src]);

  return (
    <img
      src={src}
      alt={alt ?? `${brand.name} logo`}
      className={"object-contain " + (className ?? "")}
      onError={() => setSrc(source.fallback)}
    />
  );
}
