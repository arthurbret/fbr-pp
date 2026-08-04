"use client";

import { Cloud, Laptop } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ProcessingMode } from "@/lib/portrait";

const MODES: {
  value: ProcessingMode;
  label: string;
  icon: typeof Cloud;
  hint: string;
}[] = [
  {
    value: "cloud",
    label: "Cloud",
    icon: Cloud,
    hint: "Le détourage est calculé sur le serveur. Rien à télécharger et c'est rapide, mais votre photo y est envoyée le temps du traitement.",
  },
  {
    value: "local",
    label: "Local",
    icon: Laptop,
    hint: "Le détourage est calculé dans votre navigateur : votre photo ne quitte jamais votre appareil. En contrepartie, le modèle (~90 Mo) est téléchargé au premier détourage.",
  },
];

type ModeSelectorProps = {
  value: ProcessingMode;
  onChange: (mode: ProcessingMode) => void;
};

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <TooltipProvider>
      <Tabs
        value={value}
        onValueChange={(next) => onChange(next as ProcessingMode)}
      >
        <TabsList className="w-full">
          {MODES.map((mode) => (
            <Tooltip key={mode.value}>
              <TooltipTrigger render={<TabsTrigger value={mode.value} />}>
                <mode.icon />
                {mode.label}
              </TooltipTrigger>
              <TooltipContent>{mode.hint}</TooltipContent>
            </Tooltip>
          ))}
        </TabsList>
      </Tabs>
    </TooltipProvider>
  );
}
