"use strict";
// src/controllers/profileController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = void 0;
const profileStore_1 = require("../profileStore");
const memoryExtractor_1 = require("../utils/memoryExtractor");
const getProfile = (req, res) => {
    return res.json({
        success: true,
        profile: (0, profileStore_1.getMomProfile)(),
    });
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    const update = req.body || {};
    let profileUpdate = {};
    // If notes are provided, try to auto-structure them
    if (typeof update.notes === "string" && update.notes.trim().length > 0) {
        try {
            const extracted = await (0, memoryExtractor_1.extractProfileFromNotes)(update.notes.trim());
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
            }
            else {
                // Fallback: just store the raw notes
                profileUpdate = { notes: update.notes };
            }
        }
        catch (e) {
            console.error("Error extracting profile from notes:", e);
            // Fallback: just store raw notes
            profileUpdate = { notes: update.notes };
        }
    }
    else {
        // No notes provided → normal partial update
        profileUpdate = update;
    }
    const profile = (0, profileStore_1.updateMomProfile)(profileUpdate);
    return res.json({
        success: true,
        profile,
    });
};
exports.updateProfile = updateProfile;
