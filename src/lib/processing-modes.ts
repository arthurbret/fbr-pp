import type { ProcessingMode } from "@/lib/portrait";

/** A mode is on unless its variable is explicitly set to "false" or "0". */
function isEnabled(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized !== "false" && normalized !== "0";
}

export function isCloudProcessingEnabled() {
  return isEnabled(process.env.ENABLE_CLOUD_PROCESSING);
}

export function isLocalProcessingEnabled() {
  return isEnabled(process.env.ENABLE_LOCAL_PROCESSING);
}

/**
 * Modes offered to the user, in order of preference: the first one is selected
 * by default. Read on the server at request time, so the same build can be
 * reconfigured by changing the environment and restarting.
 */
export function getEnabledProcessingModes(): ProcessingMode[] {
  const modes: ProcessingMode[] = [];
  if (isCloudProcessingEnabled()) modes.push("cloud");
  if (isLocalProcessingEnabled()) modes.push("local");

  if (modes.length === 0) {
    throw new Error(
      "ENABLE_CLOUD_PROCESSING and ENABLE_LOCAL_PROCESSING are both disabled: at least one processing mode must stay enabled.",
    );
  }

  return modes;
}
