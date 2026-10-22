// The user's chat messages, from the app.
import { Router } from "express";
import { createSubscriptionAgent } from "../../agent/index.js";
import { getCurrentUser } from "../db.js";

export const userMessageRouter = Router();

const { sendMessage } = createSubscriptionAgent();

// Runs one agent turn and returns the agent's reply. Each user has one
// conversation, keyed by their user ID.
// action: something for the app to do, such as { type: 'launch_transact', ... }, or null.
userMessageRouter.post("/", async (req, res) => {
  const { message } = req.body ?? {};
  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "message is required" });
  }
  const user = getCurrentUser();
  try {
    const { reply, action } = await sendMessage(message, {
      threadId: user.id,
      userIdentifier: user.id,
    });
    res.json({ reply, action });
  } catch (err) {
    console.error(`[agent] user=${user.id} turn failed`, err);
    res.status(500).json({ error: "The agent failed to respond." });
  }
});
