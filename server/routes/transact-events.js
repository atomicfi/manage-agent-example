// Transact SDK events from the app, so the agent can follow up when the user
// leaves the Atomic screen.
import { Router } from "express";
import { getCurrentUser } from "../db.js";
import { enqueueSystemEvent } from "../queue.js";

export const transactEventsRouter = Router();

// event is 'finish' (onFinish) or 'close' (onClose); data is the SDK's payload,
// which goes to the agent as the SDK sent it.
const EVENT_TYPES = { finish: "transact-finished", close: "transact-closed" };

transactEventsRouter.post("/", (req, res) => {
  const { event, data = {} } = req.body ?? {};
  const type = EVENT_TYPES[event];
  if (!type) {
    return res.status(400).json({ error: "event must be 'finish' or 'close'" });
  }
  const user = getCurrentUser();
  enqueueSystemEvent(user.id, type, data, "app");
  console.log(`[transact] user=${user.id} event=${event} ${JSON.stringify(data)}`);
  res.sendStatus(202);
});
