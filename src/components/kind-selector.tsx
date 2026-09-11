"use client";

import { Camera, CaseUpper } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PortraitKind } from "@/lib/portrait";

const KINDS: { value: PortraitKind; label: string; icon: typeof Camera }[] = [
  { value: "photo", label: "Photo", icon: Camera },
  { value: "initials", label: "Initiales", icon: CaseUpper },
];

type KindSelectorProps = {
  value: PortraitKind;
  onChange: (kind: PortraitKind) => void;
};

export function KindSelector({ value, onChange }: KindSelectorProps) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as PortraitKind)}>
      <TabsList className="w-full">
        {KINDS.map((kind) => (
          <TabsTrigger key={kind.value} value={kind.value}>
            <kind.icon />
            {kind.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
