import { useMemo, useRef, useState } from "react";
import * as Crypto from "expo-crypto";
import { sendMessage, sendTaskStatusUpdate } from "../api";
import { pickTaskStatusFields, tasksAreFinishedProcessing } from "../lib/tasks";

// The conversation with the agent: the chat's messages, whether the agent is
// working on a reply, and the Transact tasks it started.
export function useAgent() {
  const [messages, setMessages] = useState([]);
  // Whether the agent is working on a reply.
  const [busy, setBusy] = useState(false);

  // Messages to the agent go one at a time, so an update the app asks for
  // waits for any reply the agent is still working on. The queue is a promise
  // chain: it holds the promise for the last queued message, and askAgent adds
  // each new message with .then(), so it's sent only once the one before it
  // has finished. It starts as an already-resolved promise, so the first
  // message goes right away.
  const agentQueue = useRef(Promise.resolve());

  // Adds a row for a Transact task the first time it reports, and updates that
  // row as its status changes. Updates arrive once each, in order.
  function updateChatScreenWithTaskState({
    taskId,
    status,
    actionType,
    company,
  }) {
    setMessages((m) => {
      const existing = m.find((x) => x.id === taskId);
      let nextMessages;
      if (!existing) {
        // First update for this task: add its row.
        const task = {
          id: taskId,
          role: "task",
          actionType,
          companyName: company.name,
          status,
          startedAt: Date.now(),
        };
        nextMessages = [...m, task];
      } else {
        // A later update: change its row to the new status.
        nextMessages = m.map((x) => (x === existing ? { ...x, status } : x));
      }
      return nextMessages;
    });
  }

  // Sends a message to the agent and adds its reply. busy is true while the
  // agent works on it.
  function askAgent(text) {
    agentQueue.current = agentQueue.current.then(async () => {
      setBusy(true);
      try {
        const { reply, action } = await sendMessage(text);
        setMessages((m) => [
          ...m,
          { id: Crypto.randomUUID(), role: "agent", text: reply, action },
        ]);
      } catch (err) {
        const text =
          err instanceof TypeError
            ? "Could not reach the server. Please try again."
            : err.message;
        setMessages((m) => [
          ...m,
          { id: Crypto.randomUUID(), role: "agent", text, error: true },
        ]);
      } finally {
        setBusy(false);
      }
    });
  }

  // Adds the user's message to the chat and sends it to the agent.
  function sendUserMessage(text) {
    setMessages((m) => [...m, { id: Crypto.randomUUID(), role: "user", text }]);
    askAgent(text);
  }

  // Each status update of a Transact task: shown in the chat, and sent to the
  // backend so the agent can read it. Once a cancellation is over (it failed, or
  // the refresh after it finished), the app asks the agent for an update. That
  // request isn't shown in the chat; only the agent's reply is. Only action
  // tasks show in the chat, but the backend gets every update.
  async function handleTaskStatusUpdate(data) {
    updateChatScreenWithTaskState(data);

    await sendTaskStatusUpdate(pickTaskStatusFields(data));

    if (tasksAreFinishedProcessing(data)) {
      askAgent(`provide cancel-plan of ${data.company.name} update`);
    }
  }

  // The latest Transact action from the agent, or null.
  const transactAction = useMemo(
    () =>
      messages.findLast((m) => m.action?.type === "launch_transact")?.action ??
      null,
    [messages],
  );

  return {
    messages,
    busy,
    sendUserMessage,
    transactAction,
    handleTaskStatusUpdate,
  };
}
