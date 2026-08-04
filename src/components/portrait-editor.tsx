"use client";

import { useState } from "react";
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
import { processPortrait, type ProgressReport } from "@/lib/portrait";

type Step = "upload" | "crop" | "processing" | "result";

const STEP_DESCRIPTIONS: Record<Step, string> = {
  upload: "Commencez par déposer une photo de votre visage.",
  crop: "Cadrez votre visage dans le carré.",
  processing: "Le fond est retiré directement dans votre navigateur.",
  result: "Votre portrait est prêt à être téléchargé.",
};

const PROGRESS_LABELS: Record<ProgressReport["stage"], string> = {
  download: "Téléchargement du modèle",
  compute: "Détourage en cours",
};

export function PortraitEditor() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [progress, setProgress] = useState<ProgressReport>({
    stage: "download",
    percent: 0,
  });
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setStep("upload");
    setFile(null);
    setResult(null);
    setError(null);
  }

  async function handleConfirm(area: Area) {
    if (!file) return;

    setStep("processing");
    setProgress({ stage: "download", percent: 0 });
    setError(null);

    try {
      setResult(await processPortrait(file, area, setProgress));
      setStep("result");
    } catch (cause) {
      console.error(cause);
      setError(
        "Le traitement de l'image a échoué. Vérifiez votre connexion et réessayez."
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
            onSelect={(selected) => {
              setFile(selected);
              setError(null);
              setStep("crop");
            }}
          />
        )}

        {step === "crop" && file && (
          <CropStep file={file} onCancel={reset} onConfirm={handleConfirm} />
        )}

        {step === "processing" && (
          <div className="flex aspect-square w-full flex-col items-center justify-center gap-4 rounded-lg bg-muted p-8">
            <Progress value={progress.percent}>
              <ProgressLabel>{PROGRESS_LABELS[progress.stage]}</ProgressLabel>
              <ProgressValue />
            </Progress>
            <p className="text-center text-sm text-muted-foreground">
              Le premier traitement peut prendre un moment, le modèle est
              téléchargé une seule fois.
            </p>
          </div>
        )}

        {step === "result" && result && (
          <ResultStep image={result} onRestart={reset} />
        )}
      </CardContent>
    </Card>
  );
}
