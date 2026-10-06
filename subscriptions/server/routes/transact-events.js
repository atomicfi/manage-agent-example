// Transact SDK events from the app, so the agent can follow up when the user
// leaves the Atomic screen.
import { Router } from "express";
import { getCurrentUser } from "../db.js";
import { enqueueSystemEvent } from "../queue.js";

export const transactEventsRouter = Router();

// event is 'finish' (onFinish) or 'close' (onClose); data is the SDK's payload.
// Only the fields the agent needs are passed on.
transactEventsRouter.post("/", (req, res) => {
  const { event, data = {} } = req.body ?? {};
  const user = getCurrentUser();
  if (event === "finish") {
    enqueueSystemEvent(user.id, "transact-finished", {
      taskId: data.taskId ?? null,
      action: data.action?.type ?? null,
      companyName: data.company?.name ?? null,
    }, "app");
  } else if (event === "close") {
    enqueueSystemEvent(user.id, "transact-closed", {
      reason: data.reason ?? "unknown",
      action: data.action?.type ?? null,
    }, "app");
  } else {
    return res.status(400).json({ error: "event must be 'finish' or 'close'" });
  }
  console.log(`[transact] user=${user.id} event=${event} ${JSON.stringify(data)}`);
  res.sendStatus(202);
});
