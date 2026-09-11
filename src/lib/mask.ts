/**
 * Smooths the alpha mask of a cutout so the outline drawn around it follows the
 * overall shape of the subject rather than every stray hair: the mask is
 * blurred then thresholded, which rounds off thin strands and narrow notches,
 * and the small blobs left detached from the subject are dropped.
 */

/** Box blur radius, in pixels. Higher values give a rounder, less detailed shape. */
const SMOOTHING_RADIUS = 10;

/** Three box blurs in a row approximate a Gaussian blur. */
const SMOOTHING_PASSES = 3;

/** Detached blobs covering less than this share of the image are noise. */
const MIN_REGION_SHARE = 0.005;

/**
 * Blurs every line of `src` into `dst` with a moving average. Pixels past the
 * edges repeat the border one, so a subject cut by the frame stays solid there.
 */
function blurLines(
  src: Float32Array,
  dst: Float32Array,
  lineCount: number,
  lineLength: number,
  lineStride: number,
  step: number,
) {
  const windowSize = 2 * SMOOTHING_RADIUS + 1;

  for (let line = 0; line < lineCount; line++) {
    const start = line * lineStride;
    const at = (i: number) =>
      src[start + Math.min(lineLength - 1, Math.max(0, i)) * step];

    let sum = 0;
    for (let i = -SMOOTHING_RADIUS; i <= SMOOTHING_RADIUS; i++) sum += at(i);

    for (let i = 0; i < lineLength; i++) {
      dst[start + i * step] = sum / windowSize;
      sum += at(i + SMOOTHING_RADIUS + 1) - at(i - SMOOTHING_RADIUS);
    }
  }
}

function blur(field: Float32Array, width: number, height: number) {
  const buffer = new Float32Array(field.length);
  for (let pass = 0; pass < SMOOTHING_PASSES; pass++) {
    blurLines(field, buffer, height, width, width, 1);
    blurLines(buffer, field, width, height, 1, width);
  }
}

/** Flags the pixels of the inside regions large enough to belong to the subject. */
function findSubjectRegions(inside: Uint8Array, width: number, height: number) {
  const kept = new Uint8Array(inside.length);
  const visited = new Uint8Array(inside.length);
  const minArea = inside.length * MIN_REGION_SHARE;
  const stack: number[] = [];
  const region: number[] = [];

  for (let seed = 0; seed < inside.length; seed++) {
    if (!inside[seed] || visited[seed]) continue;

    region.length = 0;
    stack.push(seed);
    visited[seed] = 1;

    while (stack.length > 0) {
      const index = stack.pop()!;
      region.push(index);

      const x = index % width;
      const y = (index - x) / width;
      const neighbors = [
        x > 0 ? index - 1 : -1,
        x < width - 1 ? index + 1 : -1,
        y > 0 ? index - width : -1,
        y < height - 1 ? index + width : -1,
      ];

      for (const neighbor of neighbors) {
        if (neighbor >= 0 && inside[neighbor] && !visited[neighbor]) {
          visited[neighbor] = 1;
          stack.push(neighbor);
        }
      }
    }

    if (region.length >= minArea) {
      for (const index of region) kept[index] = 1;
    }
  }

  return kept;
}

/** Returns the smoothed alpha channel of a cutout, one byte per pixel. */
export function smoothMask({ data, width, height }: ImageData) {
  const count = width * height;

  const field = new Float32Array(count);
  for (let i = 0; i < count; i++) field[i] = data[i * 4 + 3] / 255;
  blur(field, width, height);

  const inside = new Uint8Array(count);
  for (let i = 0; i < count; i++) inside[i] = field[i] >= 0.5 ? 1 : 0;
  const kept = findSubjectRegions(inside, width, height);

  // Across a straight edge the blurred field rises with a slope of
  // 1 / (sigma * sqrt(2 * pi)): scaling by its inverse gives a one pixel wide
  // anti-aliased transition around the 0.5 threshold.
  const sigma = Math.sqrt(
    (SMOOTHING_PASSES * SMOOTHING_RADIUS * (SMOOTHING_RADIUS + 1)) / 3,
  );
  const gain = sigma * Math.sqrt(2 * Math.PI);

  const touchesKept = (index: number) => {
    const x = index % width;
    return (
      (x > 0 && kept[index - 1] === 1) ||
      (x < width - 1 && kept[index + 1] === 1) ||
      kept[index - width] === 1 ||
      kept[index + width] === 1
    );
  };

  const alpha = new Uint8ClampedArray(count);
  for (let i = 0; i < count; i++) {
    const coverage = (field[i] - 0.5) * gain + 0.5;
    if (coverage <= 0) continue;
    // The faint fringe just outside the threshold belongs to its neighbor's region.
    if (inside[i] ? kept[i] : touchesKept(i)) alpha[i] = coverage * 255;
  }

  return alpha;
}
