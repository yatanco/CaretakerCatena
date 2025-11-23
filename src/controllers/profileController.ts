// src/controllers/profileController.ts

import { Request, Response } from "express";
import {
  getMomProfile,
  updateMomProfile,
} from "../profileStore";
import { extractProfileFromNotes } from "../utils/memoryExtractor";

export const getProfile = (req: Request, res: Response) => {
  return res.json({
    success: true,
    profile: getMomProfile(),
  });
};

export const updateProfile = async (req: Request, res: Response) => {
  const update = req.body || {};
  let profileUpdate: any = {};

  // If notes are provided, try to auto-structure them
  if (typeof update.notes === "string" && update.notes.trim().length > 0) {
    try {
      const extracted = await extractProfileFromNotes(update.notes.trim());

      if (extracted) {
        profileUpdate = {
          // Only overwrite fields that model filled in
          ...(extracted.diagnosis !== null && { diagnosis: extracted.diagnosis }),
          ...(extracted.livingSituation !== null && {
            livingSituation: extracted.livingSituation,
          }),
          ...(extracted.personality !== null && {
            personality: extracted.personality,
          }),
          ...(Array.isArray(extracted.keyConcerns) &&
            extracted.keyConcerns.length > 0 && {
              keyConcerns: extracted.keyConcerns,
            }),
          notes: extracted.notes ?? update.notes,
        };
      } else {
        // Fallback: just store the raw notes
        profileUpdate = { notes: update.notes };
      }
    } catch (e) {
      console.error("Error extracting profile from notes:", e);
      // Fallback: just store raw notes
      profileUpdate = { notes: update.notes };
    }
  } else {
    // No notes provided → normal partial update
    profileUpdate = update;
  }

  const profile = updateMomProfile(profileUpdate);

  return res.json({
    success: true,
    profile,
  });
};
