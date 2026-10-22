import express from "express";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Load the env before importing anything that reads it, such as the Atomic client.
const envPath = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);

// The app doesn't work without these; .env.example says what each one is for.
// USER_IDENTIFIER is the user every chat acts as, and the identifier Atomic
// knows them by.
const REQUIRED_ENV = [
  "ANTHROPIC_API_KEY",
  "ATOMIC_API_BASE_URL",
  "ATOMIC_API_KEY",
  "ATOMIC_API_SECRET",
  "USER_IDENTIFIER",
];
const missingEnv = REQUIRED_ENV.filter((name) => !process.env[name]);
if (missingEnv.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnv.join(", ")}. ` +
      "Add them to .env; see .env.example.",
  );
}

const { userMessageRouter } = await import("./routes/user-message.js");
const { taskStatusUpdateRouter } = await import("./routes/task-status-update.js");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// The user's chat messages, at /user-message.
app.use("/user-message", userMessageRouter);

// Task status updates from the app's Transact SDK, at /task-status-update.
app.use("/task-status-update", taskStatusUpdateRouter);

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
