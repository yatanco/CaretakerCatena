"use strict";
// src/profileStore.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMomProfile = getMomProfile;
exports.updateMomProfile = updateMomProfile;
exports.addConcern = addConcern;
exports.setConcerns = setConcerns;
// ---- In-memory store ----
// (You can later replace this with a DB, file storage, or 0G-backed storage.)
let momProfile = {
    name: "Mom",
    diagnosis: "",
    livingSituation: "",
    personality: "",
    keyConcerns: [],
    notes: ""
};
// ---- Get entire profile ----
function getMomProfile() {
    return momProfile;
}
// ---- Update part of the profile ----
function updateMomProfile(update) {
    momProfile = { ...momProfile, ...update };
    return momProfile;
}
// ---- Add a new concern ----
function addConcern(concern) {
    momProfile.keyConcerns = momProfile.keyConcerns || [];
    momProfile.keyConcerns.push(concern);
    return momProfile;
}
// ---- Replace concerns entirely ----
function setConcerns(concerns) {
    momProfile.keyConcerns = concerns;
    return momProfile;
}
