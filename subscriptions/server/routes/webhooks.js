// Atomic webhooks. task-status-updated (for the action product) is stored, and queued for the
// agent when a task finishes; other events are acknowledged so Atomic doesn't retry them.
import { Router } from "express";
import { saveTaskStatusUpdatedEvent } from "../db.js";
import { enqueueSystemEvent } from "../queue.js";

// Where Atomic sends this app's webhooks. index.js mounts this router at /webhooks.
export const WEBHOOK_PATH = "/webhooks/atomic/manage-agent";

export const webhookRouter = Router();

webhookRouter.post("/atomic/manage-agent", (req, res) => {
  const event = req.body ?? {};
  if (event.eventType === "task-status-updated" && event.product === "action") {
    handleTaskStatusUpdated(event);
  }
  res.sendStatus(204);
});

// Tells the agent when a task finishes. A cancellation is followed by a
// refresh task that resyncs the user's data; once the refresh completes, the
// new data is ready to read.
// https://docs.atomicfi.com/paylink/reference/webhooks#tasks__task-status-updated
function handleTaskStatusUpdated(event) {
  const taskId = event.task;
  const userIdentifier = event.user?.identifier;
  const status = event.data?.status;
  const reason = event.data?.reason ?? null;

  const action = event.data.flow ?? null;
  const companyId = event.company?._id ?? null;
  const companyName = event.company?.name ?? null;
  const changed = saveTaskStatusUpdatedEvent({
    taskId,
    userIdentifier,
    action,
    companyId,
    companyName,
    status,
    reason,
  });
  console.log(
    `[webhook] task=${taskId} user=${userIdentifier} action=${action} company=${companyName} status=${status} reason=${reason} changed=${changed}`,
  );

  const finished = status === "completed" || status === "failed";
  if (changed && finished) {
    // Only these fields go to the agent: the raw webhook also carries the
    // user's public token, which the model shouldn't see.
    enqueueSystemEvent(userIdentifier, "task-status-updated", {
      action,
      companyId,
      companyName,
      status,
      reason,
    });
  }
}
