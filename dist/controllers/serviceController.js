"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listServices = exports.runService = void 0;
const brokerService_1 = require("../services/brokerService");
/**
 * Build a caretaking-focused LLM prompt with conversation history.
 */
function buildCaretakerPrompt(latestInput, history) {
    const system = `
You are CaretakerCatena, a calm, practical companion for people caring for relatives with Alzheimer's disease or other dementias.

Your goals:
- Help caregivers feel seen, understood, and less alone.
- Offer practical, concrete suggestions about routines, environment, and communication.
- Support the caregiver's own emotional wellbeing and boundaries.

Safety rules:
- You are NOT a doctor and you do NOT diagnose or prescribe.
- You never change medications, doses, or recommend starting/stopping treatments.
- For anything medical (medications, new or worsening symptoms, emergencies), you encourage the user to talk to a qualified healthcare professional or call local emergency services.
- If the user mentions self-harm, harming others, or feeling unable to go on, you encourage them to seek immediate help from local emergency services or a trusted person.

Style:
- Warm, kind, and grounded.
- Short paragraphs, clear bullet points when giving strategies.
- Validate the caregiver's feelings (guilt, overwhelm, sadness, frustration) without judgment.
- Focus on what is in their control: routines, environment, how they respond, seeking support.
`.trim();
    let convo = "";
    if (Array.isArray(history) && history.length > 0) {
        const trimmedHistory = history.slice(-10); // last 10 turns to keep prompt small
        convo =
            "\n\nConversation so far:\n" +
                trimmedHistory
                    .map((m) => {
                    const role = m.role === "assistant"
                        ? "Assistant"
                        : m.role === "user"
                            ? "User"
                            : "Other";
                    return `${role}: ${m.content}`;
                })
                    .join("\n");
    }
    const finalPrompt = `${system}${convo}\n\nUser: ${latestInput}\nAssistant:`;
    return finalPrompt;
}
/**
 * POST /api/services/run
 * Sends a query to an AI model through 0G Compute
 */
const runService = async (req, res) => {
    const { input, history } = req.body || {};
    if (!input || typeof input !== "string" || input.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: "Input is required"
        });
    }
    const prompt = buildCaretakerPrompt(input, history);
    try {
        // Primary path: real 0G call
        const providerAddress = brokerService_1.OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"];
        const result = await brokerService_1.brokerService.sendQuery(providerAddress, prompt);
        const reply = result?.response?.content ??
            result?.output ??
            (typeof result === "string" ? result : JSON.stringify(result, null, 2));
        return res.status(200).json({
            success: true,
            reply,
            raw: result
        });
    }
    catch (error) {
        // Fallback: graceful local reply so the chat never breaks
        console.error("runService error:", error);
        const friendlyReply = `
I'm having trouble connecting to the 0G compute network right now, so I'm answering directly.

You asked: "${input}"

Some general guidance that often helps caregivers:

• People with Alzheimer's or memory loss repeat questions because the brain can't hold onto the answer — it's not stubbornness or manipulation.
• Correcting them (“I already told you…”) usually increases anxiety or shame.
• Instead, give the same calm, reassuring answer each time in a neutral tone.
• If the question is about comparison (who is older, who is better), you can gently soften it:
  - “Both of you are very important to me.”
  - “I love you both so much.”
• After answering, redirect to something comforting or familiar: an old photo, music they like, a simple activity, or a small snack.

If you tell me more about your routine and what tends to trigger these questions, I can suggest ways to structure the day so there’s a bit less stress for both of you.
`.trim();
        return res.status(200).json({
            success: true,
            reply: friendlyReply,
            fallback: true,
            error: error?.message
        });
    }
};
exports.runService = runService;
/**
 * GET /api/services/list
 */
const listServices = async (req, res) => {
    try {
        const list = await brokerService_1.brokerService.listServices();
        return res.json({
            success: true,
            services: list
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.listServices = listServices;
