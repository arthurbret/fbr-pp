import { connection } from "next/server";

import { BrandHeader } from "@/components/brand-header";
import { PortraitEditor } from "@/components/portrait-editor";
import { getEnabledProcessingModes } from "@/lib/processing-modes";

export default async function Home() {
  // Render per request so the processing modes follow the runtime environment
  // instead of being frozen at build time.
  await connection();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <BrandHeader />
      <PortraitEditor modes={getEnabledProcessingModes()} />
    </main>
  );
}
