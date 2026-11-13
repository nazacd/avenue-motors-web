import type { Image } from "@/data/cars";

type PictureProps = {
  image: Image;
  alt: string;
  // How wide the image is drawn, as a CSS sizes value, so the browser picks the right file.
  sizes: string;
  // Set for the one image that is visible as the page opens.
  eager?: boolean;
  className?: string;
};

export function avifSrcSet(image: Image) {
  return image.widths.map((w) => `${image.base}-${w}.avif ${w}w`).join(", ");
}

export function fallbackSrc(image: Image) {
  return `${image.base}-${image.fallbackWidth}.jpg`;
}

export function Picture({ image, alt, sizes, eager = false, className }: PictureProps) {
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={avifSrcSet(image)} sizes={sizes} />
      <img
        src={fallbackSrc(image)}
        alt={alt}
        width={image.width}
        height={image.height}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        decoding="async"
        style={{ background: `center / cover no-repeat url(${image.blur})` }}
      />
    </picture>
  );
}
