import type { Area } from "react-easy-crop";

import { smoothMask } from "@/lib/mask";

/** Side of the exported square image, in pixels. */
export const OUTPUT_SIZE = 1024;

/** Solid teal blue used to replace the original background. */
export const BACKGROUND_COLOR = "#009AA6";

/** Thin white stroke drawn around the subject. */
export const OUTLINE_COLOR = "#ffffff";
/** Stroke thickness in pixels of the exported image. */
const OUTLINE_WIDTH = 7;
const OUTLINE_STEPS = 64;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("Impossible de lire cette image.")),
    );
    image.src = src;
  });
}

function createCanvas(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D non disponible dans ce navigateur.");
  return { canvas, ctx };
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Échec de la génération de l'image."));
    }, "image/png");
  });
}

async function withObjectUrl<T>(
  blob: Blob,
  fn: (url: string) => Promise<T>,
): Promise<T> {
  const url = URL.createObjectURL(blob);
  try {
    return await fn(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Extracts the selected area and rescales it to a square of OUTPUT_SIZE. */
export async function cropToSquare(source: Blob, area: Area): Promise<Blob> {
  const image = await withObjectUrl(source, loadImage);
  const { canvas, ctx } = createCanvas(OUTPUT_SIZE);

  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  return canvasToBlob(canvas);
}

/** Turns a cutout into a flat white version of its smoothed shape. */
function createSilhouette(subject: CanvasRenderingContext2D) {
  const alpha = smoothMask(
    subject.getImageData(0, 0, OUTPUT_SIZE, OUTPUT_SIZE),
  );

  const { canvas, ctx } = createCanvas(OUTPUT_SIZE);
  const mask = ctx.createImageData(OUTPUT_SIZE, OUTPUT_SIZE);
  for (let i = 0; i < alpha.length; i++) mask.data[i * 4 + 3] = alpha[i];
  ctx.putImageData(mask, 0, 0);

  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = OUTLINE_COLOR;
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  return canvas;
}

/**
 * Draws the cutout on the solid background, with a thin white outline obtained
 * by stamping its silhouette all around it before the subject is drawn on top.
 * The subject is trimmed to that same smoothed silhouette, so stray hair
 * strands do not stick out of the outline.
 */
export async function composePortrait(cutout: Blob): Promise<Blob> {
  const image = await withObjectUrl(cutout, loadImage);

  const subject = createCanvas(OUTPUT_SIZE);
  subject.ctx.drawImage(image, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  const silhouette = createSilhouette(subject.ctx);
  subject.ctx.globalCompositeOperation = "destination-in";
  subject.ctx.drawImage(silhouette, 0, 0);

  const { canvas, ctx } = createCanvas(OUTPUT_SIZE);

  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  for (let step = 0; step < OUTLINE_STEPS; step++) {
    const angle = (step / OUTLINE_STEPS) * Math.PI * 2;
    ctx.drawImage(
      silhouette,
      Math.cos(angle) * OUTLINE_WIDTH,
      Math.sin(angle) * OUTLINE_WIDTH,
    );
  }

  ctx.drawImage(subject.canvas, 0, 0);

  return canvasToBlob(canvas);
}

/** What the portrait shows: the user's photo, or their initials. */
export type PortraitKind = "photo" | "initials";

const INITIALS_MAX_LENGTH = 3;
const INITIALS_COLOR = "#ffffff";
const INITIALS_FONT_WEIGHT = 600;
/** Font size of the initials, and widest share of the image they may span. */
const INITIALS_FONT_SIZE = OUTPUT_SIZE * 0.4;
const INITIALS_MAX_WIDTH = OUTPUT_SIZE * 0.7;

/** Keeps letters only, uppercased, up to INITIALS_MAX_LENGTH of them. */
export function normalizeInitials(value: string) {
  return Array.from(value.replace(/\P{L}/gu, "").toLocaleUpperCase("fr"))
    .slice(0, INITIALS_MAX_LENGTH)
    .join("");
}

function initialsFont(fontFamily: string, size = INITIALS_FONT_SIZE) {
  return `${INITIALS_FONT_WEIGHT} ${size}px ${fontFamily}`;
}

/** Web fonts load lazily: waits for the glyphs drawInitials is about to use. */
export async function loadInitialsFont(fontFamily: string, initials: string) {
  await document.fonts.load(initialsFont(fontFamily), initials);
}

/**
 * Draws the initials in white, centered on the portrait background.
 * `fontFamily` is a CSS font stack, loaded beforehand with loadInitialsFont.
 */
export function drawInitials(
  ctx: CanvasRenderingContext2D,
  initials: string,
  fontFamily: string,
) {
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  if (!initials) return;

  ctx.font = initialsFont(fontFamily);
  const width = ctx.measureText(initials).width;
  if (width > INITIALS_MAX_WIDTH) {
    ctx.font = initialsFont(
      fontFamily,
      (INITIALS_FONT_SIZE * INITIALS_MAX_WIDTH) / width,
    );
  }

  // Center the drawn glyphs themselves rather than the font's line box and
  // advance widths, which leave uneven room around capitals.
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const {
    actualBoundingBoxLeft: left,
    actualBoundingBoxRight: right,
    actualBoundingBoxAscent: ascent,
    actualBoundingBoxDescent: descent,
  } = ctx.measureText(initials);
  ctx.fillStyle = INITIALS_COLOR;
  ctx.fillText(
    initials,
    (OUTPUT_SIZE + left - right) / 2,
    (OUTPUT_SIZE + ascent - descent) / 2,
  );
}

/** Where the segmentation model runs. */
export type ProcessingMode = "cloud" | "local";

export type ProgressReport = { stage: "download" | "compute"; percent: number };

/** Asks the server to run the segmentation model and return a transparent cutout. */
async function removeInCloud(image: Blob): Promise<Blob> {
  const body = new FormData();
  body.append("image", image, "crop.png");

  const response = await fetch("/api/remove-background", {
    method: "POST",
    body,
  });

  if (!response.ok) {
    throw new Error(`Le détourage a échoué (HTTP ${response.status}).`);
  }

  return response.blob();
}

/** Runs the segmentation model in the browser, so the photo never leaves the device. */
async function removeInBrowser(
  image: Blob,
  onProgress: (report: ProgressReport) => void,
): Promise<Blob> {
  const { removeBackground } = await import("@imgly/background-removal");

  return removeBackground(image, {
    output: { format: "image/png" },
    progress: (key, current, total) => {
      onProgress({
        stage: key.startsWith("fetch") ? "download" : "compute",
        percent: total > 0 ? Math.round((current / total) * 100) : 0,
      });
    },
  });
}

/** Full pipeline: crop, remove the background, then recompose the portrait. */
export async function processPortrait(
  source: Blob,
  area: Area,
  mode: ProcessingMode,
  onProgress: (report: ProgressReport) => void,
): Promise<Blob> {
  const cropped = await cropToSquare(source, area);
  const cutout =
    mode === "local"
      ? await removeInBrowser(cropped, onProgress)
      : await removeInCloud(cropped);

  return composePortrait(cutout);
}
