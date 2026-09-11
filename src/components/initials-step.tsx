"use client";

import { useEffect, useRef } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { downloadUrl } from "@/lib/download";
import {
  drawInitials,
  loadInitialsFont,
  normalizeInitials,
  OUTPUT_SIZE,
} from "@/lib/portrait";

type InitialsStepProps = {
  initials: string;
  onChange: (initials: string) => void;
};

export function InitialsStep({ initials, onChange }: InitialsStepProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // The canvas carries the font-initials class: its computed style resolves
    // the font stack, including the generated name of the fallback web font.
    const { fontFamily } = getComputedStyle(canvas);
    let isCurrent = true;

    loadInitialsFont(fontFamily, initials).finally(() => {
      if (isCurrent) drawInitials(ctx, initials, fontFamily);
    });

    return () => {
      isCurrent = false;
    };
  }, [initials]);

  function download() {
    const canvas = canvasRef.current;
    if (canvas) downloadUrl(canvas.toDataURL("image/png"), "initiales.png");
  }

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel htmlFor="initials">Vos initiales</FieldLabel>
        <Input
          id="initials"
          value={initials}
          placeholder="FBR"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          onChange={(event) => onChange(normalizeInitials(event.target.value))}
        />
      </Field>

      <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted">
        <canvas
          ref={canvasRef}
          width={OUTPUT_SIZE}
          height={OUTPUT_SIZE}
          role="img"
          aria-label={`Initiales ${initials} sur fond bleu`}
          className="size-full font-initials"
        />
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={!initials}
        onClick={download}
      >
        <Download />
        Télécharger
      </Button>
    </div>
  );
}
