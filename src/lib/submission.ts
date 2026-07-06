import type { CreateLeadResponse } from "../types";

interface SubmissionState {
  submissionId: string;
  completedLead?: CreateLeadResponse;
  completedAt?: string;
}

export function getSubmissionId(storageKey: string): string {
  const state = readSubmissionState(storageKey);
  if (state?.submissionId) {
    return state.submissionId;
  }

  const submissionId = crypto.randomUUID();
  writeSubmissionState(storageKey, { submissionId });
  return submissionId;
}

export function readCompletedLead(storageKey: string): CreateLeadResponse | null {
  const state = readSubmissionState(storageKey);
  return state?.completedLead ?? null;
}

export function markSubmissionCompleted(storageKey: string, completedLead: CreateLeadResponse) {
  const submissionId = getSubmissionId(storageKey);
  writeSubmissionState(storageKey, {
    submissionId,
    completedLead,
    completedAt: new Date().toISOString(),
  });
}

export function resetSubmission(storageKey: string) {
  localStorage.removeItem(storageKey);
}

function readSubmissionState(storageKey: string): SubmissionState | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SubmissionState>;
    if (!parsed.submissionId) return null;
    return {
      submissionId: parsed.submissionId,
      completedLead: parsed.completedLead,
      completedAt: parsed.completedAt,
    };
  } catch {
    return null;
  }
}

function writeSubmissionState(storageKey: string, state: SubmissionState) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}
