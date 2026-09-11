import Image, { type StaticImageData } from "next/image";

import esncfSolutionsLogo from "@/assets/logos/esncf-solutions.png";
import teamLogo from "@/assets/logos/expertise-metier.png";
import { Separator } from "@/components/ui/separator";

/** Renders a logo at a fixed height, so only a small version is downloaded. */
function Logo({
  src,
  alt,
  height,
}: {
  src: StaticImageData;
  alt: string;
  height: number;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      height={height}
      width={Math.round((src.width / src.height) * height)}
      loading="eager"
    />
  );
}

export function BrandHeader() {
  return (
    <header className="flex items-center justify-center gap-5">
      <Logo src={esncfSolutionsLogo} alt="e.SNCF Solutions" height={56} />
      <Separator
        orientation="vertical"
        className="h-10 data-vertical:self-center"
      />
      <Logo src={teamLogo} alt="Expertise métier" height={44} />
    </header>
  );
}
