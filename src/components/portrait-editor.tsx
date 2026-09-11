"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { Area } from "react-easy-crop";

import { CropStep } from "@/components/crop-step";
import { ImageDropzone } from "@/components/image-dropzone";
import { InitialsStep } from "@/components/initials-step";
import { KindSelector } from "@/components/kind-selector";
import { ResultStep } from "@/components/result-step";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import {
  processPortrait,
  type PortraitKind,
  type ProcessingMode,
  type ProgressReport,
} from "@/lib/portrait";

type Step = "upload" | "crop" | "processing" | "result";

/** A blob together with the object URL used to display it. */
type Preview = { blob: Blob; url: string };

function createPreview(blob: Blob): Preview {
  return { blob, url: URL.createObjectURL(blob) };
}

const STEP_DESCRIPTIONS: Record<Step, string> = {
  upload: "Commencez par déposer une photo de votre visage.",
  crop: "Cadrez votre visage dans le carré.",
  processing: "Le fond est retiré, cela prend quelques secondes.",
  result: "Votre portrait est prêt à être téléchargé.",
};

const INITIALS_DESCRIPTION = "Saisissez vos initiales, jusqu'à trois lettres.";

const PROGRESS_LABELS: Record<ProgressReport["stage"], string> = {
  download: "Téléchargement du modèle",
  compute: "Détourage en cours",
};

type PortraitEditorProps = {
  /** Modes enabled on the server, the first one being the default. */
  modes: ProcessingMode[];
};

export function PortraitEditor({ modes }: PortraitEditorProps) {
  const [kind, setKind] = useState<PortraitKind>("photo");
  const [initials, setInitials] = useState("");
  const [step, setStep] = useState<Step>("upload");
  const [mode, setMode] = useState<ProcessingMode>(modes[0]);
  const [source, setSource] = useState<Preview | null>(null);
  const [result, setResult] = useState<Preview | null>(null);
  const [progress, setProgress] = useState<ProgressReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    if (source) URL.revokeObjectURL(source.url);
    if (result) URL.revokeObjectURL(result.url);
    setSource(null);
    setResult(null);
    setError(null);
    setStep("upload");
  }

  async function handleConfirm(area: Area) {
    if (!source) return;

    setStep("processing");
    setProgress(null);
    setError(null);

    try {
      setResult(
        createPreview(
          await processPortrait(source.blob, area, mode, setProgress),
        ),
      );
      setStep("result");
    } catch (cause) {
      console.error(cause);
      setError(
        "Le traitement de l'image a échoué. Vérifiez votre connexion et réessayez.",
      );
      setStep("crop");
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Photo de profil FBR</CardTitle>
        <CardDescription>
          {kind === "initials" ? INITIALS_DESCRIPTION : STEP_DESCRIPTIONS[step]}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Hidden while a photo is processed, so the result cannot land unseen. */}
        {step !== "processing" && (
          <KindSelector value={kind} onChange={setKind} />
        )}

        {kind === "initials" ? (
          <InitialsStep initials={initials} onChange={setInitials} />
        ) : (
          <>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Une erreur est survenue</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === "upload" && (
              <ImageDropzone
                onSelect={(file) => {
                  setSource(createPreview(file));
                  setError(null);
                  setStep("crop");
                }}
              />
            )}

            {step === "crop" && source && (
              <CropStep
                imageUrl={source.url}
                modes={modes}
                mode={mode}
                onModeChange={setMode}
                onCancel={reset}
                onConfirm={handleConfirm}
              />
            )}

            {step === "processing" && (
              <div className="flex aspect-square w-full flex-col items-center justify-center gap-4 rounded-lg bg-muted p-8">
                {progress ? (
                  <Progress value={progress.percent} className="w-full">
                    <ProgressLabel>
                      {PROGRESS_LABELS[progress.stage]}
                    </ProgressLabel>
                    <ProgressValue />
                  </Progress>
                ) : (
                  <>
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    <p className="text-center text-sm text-muted-foreground">
                      Détourage en cours…
                    </p>
                  </>
                )}
              </div>
            )}

            {step === "result" && result && (
              <ResultStep imageUrl={result.url} onRestart={reset} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
