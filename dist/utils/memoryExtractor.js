"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractProfileFromNotes = extractProfileFromNotes;
// src/utils/memoryExtractor.ts
const brokerService_1 = require("../services/brokerService");
async function extractProfileFromNotes(notes) {
    const providerAddress = brokerService_1.OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"];
    const prompt = `
You are a memory extraction assistant for an Alzheimer's caregiving app.

A caregiver wrote freeform notes about their loved one. Your task is to CONVERT these notes into the following JSON shape:

{
  "diagnosis": string | null,
  "livingSituation": string | null,
  "personality": string | null,
  "keyConcerns": string[] | null,
  "notes": string | null
}

Rules:
- Do NOT invent medical diagnoses. If diagnosis is not explicitly mentioned, use null.
- "livingSituation" is about where and with whom they live.
- "personality" is about preferences, likes/dislikes, temperament.
- "keyConcerns" is an array of 1–6 short phrases describing the main worries or behavior patterns.
- "notes" should be a short summary of the caregiver's text in your own words.
- If you are not sure about a field, set it to null.

Caregiver notes:
"""${notes}"""

Return ONLY the JSON. Do not include any explanation or commentary.
  `.trim();
    const result = await brokerService_1.brokerService.sendQuery(providerAddress, prompt);
    const content = result?.content ??
        result?.response?.content ??
        (typeof result === "string" ? result : null);
    if (!content)
        return null;
    try {
        const parsed = JSON.parse(content);
        return parsed;
    }
    catch (err) {
        console.error("Memory extraction JSON parse error:", err, "content:", content);
        return null;
    }
}
