// Atomic webhooks. task-status-updated (for the action product) and pay-link-accounts-updated are
// stored, and queued for the agent when they matter to the user; other events are acknowledged so
// Atomic doesn't retry them.
import { Router } from "express";
import {
  saveTaskStatusUpdatedEvent,
  savePayLinkAccountsUpdatedEvent,
} from "../db.js";
import { enqueueSystemEvent } from "../queue.js";

export const webhookRouter = Router();

webhookRouter.post("/atomic", (req, res) => {
  const event = req.body ?? {};
  if (event.eventType === "task-status-updated" && event.product === "action") {
    handleTaskStatusUpdated(event);
  } else if (event.eventType === "pay-link-accounts-updated") {
    handlePayLinkAccountsUpdated(event);
  }
  res.sendStatus(204);
});

// Tells the agent when a task finishes
function handleTaskStatusUpdated(event) {
  const taskId = event.task;
  const userIdentifier = event.user?.identifier;
  const status = event.data?.status;

  const action = event.data.flow ?? null;
  const companyName = event.company?.name ?? null;
  const changed = saveTaskStatusUpdatedEvent({
    taskId,
    userIdentifier,
    action,
    companyName,
    status,
  });
  console.log(
    `[webhook] task=${taskId} user=${userIdentifier} action=${action} company=${companyName} status=${status} changed=${changed}`,
  );

  // Only these fields go to the agent: the raw webhook also carries the user's
  // public token, which the model shouldn't see.
  const finished = status === "completed" || status === "failed";
  if (changed && finished) {
    enqueueSystemEvent(userIdentifier, "task-status-updated", {
      action,
      companyName,
      status,
    });
  }
}

// Tells the agent when the user's PayLink accounts change, such as subscriptions
// finishing loading after they connect a merchant.
function handlePayLinkAccountsUpdated(event) {
  const userIdentifier = event.user?.identifier;
  const eventTime = event.eventTime ?? new Date().toISOString();
  const accounts = event.data?.accounts ?? [];

  savePayLinkAccountsUpdatedEvent({ userIdentifier, eventTime, accounts });
  console.log(
    `[webhook] pay-link-accounts-updated user=${userIdentifier} updates=${accounts.map((a) => a.updateType).join(",")}`,
  );

  // The webhook's data as Atomic sent it. It doesn't name the company; the agent
  // looks the accounts up with get_user_subscriptions.
  enqueueSystemEvent(userIdentifier, "pay-link-accounts-updated", event.data);
}
