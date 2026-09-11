import { removeBackground } from "@imgly/background-removal-node";
import { NextResponse } from "next/server";

import { isCloudProcessingEnabled } from "@/lib/processing-modes";

export const runtime = "nodejs";
export const maxDuration = 60;

/** The client only ever uploads a square crop, which stays well under this. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  // Hiding the selector is not enough: the endpoint must refuse to process too.
  if (!isCloudProcessingEnabled()) {
    return NextResponse.json(
      { error: "Le traitement cloud est désactivé." },
      { status: 404 },
    );
  }

  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File) || !image.type.startsWith("image/")) {
    return NextResponse.json({ error: "Image manquante." }, { status: 400 });
  }

  if (image.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image trop lourde." }, { status: 413 });
  }

  try {
    const cutout = await removeBackground(image, {
      output: { format: "image/png" },
    });

    return new NextResponse(await cutout.arrayBuffer(), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (cause) {
    console.error("Background removal failed", cause);
    return NextResponse.json(
      { error: "Détourage impossible." },
      { status: 500 },
    );
  }
}
