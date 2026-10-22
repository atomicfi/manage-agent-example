// What a task row says for each kind of task, while it runs (followed by a
// timer) and once it ends.
const TASK_LABELS = {
  "cancel-plan": {
    processing: (name) => `Canceling ${name}`,
    completed: (name) => `${name} Canceled`,
    failed: (name) => `Couldn't cancel ${name}`,
  },
  refresh: {
    processing: (name) => `Refreshing ${name}`,
    completed: (name) => `${name} Refreshed`,
    failed: (name) => `Couldn't refresh ${name}`,
  },
  "connect-account": {
    processing: (name) => `Connecting ${name}`,
    completed: (name) => `${name} Connected`,
    failed: (name) => `Couldn't connect ${name}`,
  },
};

// For a kind of task without its own labels.
const DEFAULT_LABELS = {
  processing: (name) => `Working with ${name}`,
  completed: (name) => `Done with ${name}`,
  failed: (name) => `Something went wrong with ${name}`,
};

// The label for a task row, such as "Canceling Netflix". A status without a
// label shows just the company's name.
export function taskLabel({ actionType, status, companyName }) {
  const name = companyName ?? "the company";
  const labels = TASK_LABELS[actionType] ?? DEFAULT_LABELS;
  return labels[status]?.(name) ?? name;
}

// Whether a status update of an action task means a cancellation is over: it
// failed, or the refresh after it finished. A refresh only ever follows a
// cancellation.
export function tasksAreFinishedProcessing({ status, actionType }) {
  let finished = false;

  if (status === "failed" || status === "completed") {
    if (actionType === "cancel-plan") {
      // A completed cancellation still waits for the refresh after it.
      finished = status === "failed";
    } else if (actionType === "refresh") {
      finished = true;
    }
  }

  return finished;
}

// Only the fields of a task status update that the agent uses:
// https://docs.atomicfi.com/paylink/reference/transact-sdk#event-listeners__ontaskstatusupdate
export function pickTaskStatusFields({
  taskId,
  product,
  status,
  actionType,
  failReason,
  company,
}) {
  return {
    taskId,
    product,
    status,
    actionType,
    failReason,
    company: { _id: company._id, name: company.name },
  };
}
