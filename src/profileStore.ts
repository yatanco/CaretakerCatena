// src/profileStore.ts

export type CareProfile = {
  name: string;
  diagnosis?: string;
  livingSituation?: string;
  personality?: string;
  keyConcerns?: string[];
  notes?: string;
};

// ---- In-memory store ----
// (You can later replace this with a DB, file storage, or 0G-backed storage.)
let momProfile: CareProfile = {
  name: "Mom",
  diagnosis: "",
  livingSituation: "",
  personality: "",
  keyConcerns: [],
  notes: ""
};

// ---- Get entire profile ----
export function getMomProfile(): CareProfile {
  return momProfile;
}

// ---- Update part of the profile ----
export function updateMomProfile(update: Partial<CareProfile>): CareProfile {
  momProfile = { ...momProfile, ...update };
  return momProfile;
}

// ---- Add a new concern ----
export function addConcern(concern: string): CareProfile {
  momProfile.keyConcerns = momProfile.keyConcerns || [];
  momProfile.keyConcerns.push(concern);
  return momProfile;
}

// ---- Replace concerns entirely ----
export function setConcerns(concerns: string[]): CareProfile {
  momProfile.keyConcerns = concerns;
  return momProfile;
}
