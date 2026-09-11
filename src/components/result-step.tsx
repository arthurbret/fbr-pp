"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { downloadUrl } from "@/lib/download";

type ResultStepProps = {
  imageUrl: string;
  onRestart: () => void;
};

export function ResultStep({ imageUrl, onRestart }: ResultStepProps) {
  return (
    <div className="space-y-4">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- blob URL generated in the browser */}
        <img
          src={imageUrl}
          alt="Portrait détouré sur fond bleu"
          className="size-full object-cover"
        />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="lg" onClick={onRestart}>
          Nouvelle photo
        </Button>
        <Button
          size="lg"
          className="flex-1"
          onClick={() => downloadUrl(imageUrl, "portrait.png")}
        >
          <Download />
          Télécharger
        </Button>
      </div>
    </div>
  );
}
