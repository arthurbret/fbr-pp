"use client";

import { useRef, useState } from "react";
import { ImageUp } from "lucide-react";

import { cn } from "@/lib/utils";

type ImageDropzoneProps = {
  onSelect: (file: File) => void;
};

export function ImageDropzone({ onSelect }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file?.type.startsWith("image/")) onSelect(file);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        "flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-6 text-center transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
        isDragging && "border-primary bg-muted"
      )}
    >
      <ImageUp className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-medium">
          Déposez une photo ou cliquez pour parcourir
        </p>
        <p className="text-sm text-muted-foreground">JPG, PNG ou WebP</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
