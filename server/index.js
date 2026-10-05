import express from "express";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";

// Load the env before importing anything that reads it, such as the Atomic client.
const envPath = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);

const { getCurrentUser } = await import("./db.js");
const { subscribe } = await import("./bus.js");
const { threadIdFor } = await import("./queue.js");
const { userMessageRouter } = await import("./routes/user-message.js");
const { transactEventsRouter } = await import("./routes/transact-events.js");
const { webhookRouter } = await import("./routes/webhooks.js");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// The user's chat messages, at /user-message.
app.use("/user-message", userMessageRouter);

// Transact SDK onFinish and onClose events from the app, at /transact-events.
app.use("/transact-events", transactEventsRouter);

// Atomic webhooks, at /webhooks/atomic.
app.use("/webhooks", webhookRouter);

const server = app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});

// The app listens here for the agent's messages on the user's thread.
const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", (ws) => {
  subscribe(threadIdFor(getCurrentUser().id), ws);
});
