// Task status updates from the app: the Transact SDK's onTaskStatusUpdate
// event, which fires as a task moves through 'processing' to 'completed' or
// 'failed'. They're saved for check_events to read.
// https://docs.atomicfi.com/paylink/reference/transact-sdk#event-listeners__ontaskstatusupdate
import { Router } from "express";
import { getCurrentUser, saveTaskStatusUpdatedEvent } from "../db.js";

export const taskStatusUpdateRouter = Router();

// The body is the event's taskId, product, status, actionType, failReason, and
// company ({ _id, name }), which the app picks out.
taskStatusUpdateRouter.post("/", (req, res) => {
  const { taskId, product, status, actionType, failReason, company } = req.body ?? {};
  if (!taskId || !status) {
    return res.status(400).json({ error: "taskId and status are required" });
  }
  // Only actions, such as cancel-plan and connect-account, matter to the agent.
  if (product !== "action") return res.sendStatus(204);

  const user = getCurrentUser();
  const changed = saveTaskStatusUpdatedEvent({
    taskId,
    userIdentifier: user.id,
    action: actionType ?? null,
    companyId: company?._id ?? null,
    companyName: company?.name ?? null,
    status,
    reason: failReason ?? null,
  });
  console.log(
    `[task] task=${taskId} user=${user.id} action=${actionType} company=${company?.name} status=${status} reason=${failReason} changed=${changed}`,
  );
  res.sendStatus(204);
});
