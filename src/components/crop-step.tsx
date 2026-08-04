"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

type CropStepProps = {
  imageUrl: string;
  onCancel: () => void;
  onConfirm: (area: Area) => void;
};

export function CropStep({ imageUrl, onCancel, onConfirm }: CropStepProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [area, setArea] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, areaInPixels: Area) => {
    setArea(areaInPixels);
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={1}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <Slider
        aria-label="Zoom"
        value={zoom}
        min={MIN_ZOOM}
        max={MAX_ZOOM}
        step={0.01}
        onValueChange={(value) =>
          setZoom(Array.isArray(value) ? value[0] : value)
        }
      />

      <div className="flex gap-2">
        <Button variant="outline" size="lg" onClick={onCancel}>
          Changer de photo
        </Button>
        <Button
          size="lg"
          className="flex-1"
          disabled={!area}
          onClick={() => area && onConfirm(area)}
        >
          Détourer le visage
        </Button>
      </div>
    </div>
  );
}
