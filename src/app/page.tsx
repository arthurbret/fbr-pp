import { connection } from "next/server";

import { PortraitEditor } from "@/components/portrait-editor";
import { getEnabledProcessingModes } from "@/lib/processing-modes";

export default async function Home() {
  // Render per request so the processing modes follow the runtime environment
  // instead of being frozen at build time.
  await connection();

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <PortraitEditor modes={getEnabledProcessingModes()} />
    </main>
  );
}
