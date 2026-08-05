"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { Area } from "react-easy-crop";

import { CropStep } from "@/components/crop-step";
import { ImageDropzone } from "@/components/image-dropzone";
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

const PROGRESS_LABELS: Record<ProgressReport["stage"], string> = {
  download: "Téléchargement du modèle",
  compute: "Détourage en cours",
};

export function PortraitEditor() {
  const [step, setStep] = useState<Step>("upload");
  const [mode, setMode] = useState<ProcessingMode>("cloud");
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
        <CardTitle>Portrait sur fond bleu</CardTitle>
        <CardDescription>{STEP_DESCRIPTIONS[step]}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
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
                <ProgressLabel>{PROGRESS_LABELS[progress.stage]}</ProgressLabel>
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
      </CardContent>
    </Card>
  );
}
