export function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  link.click();
  URL.revokeObjectURL(url);
}

/** Draws a baked SVG onto a canvas of its own size and returns it as PNG. */
export async function svgToPng(baked: string, size: number): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([baked], { type: "image/svg+xml" }));
  try {
    const image = new Image(size, size);
    image.src = url;
    await image.decode();
    const canvas = Object.assign(document.createElement("canvas"), { width: size, height: size });
    canvas.getContext("2d")!.drawImage(image, 0, 0, size, size);
    return await new Promise((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))), "image/png"),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
