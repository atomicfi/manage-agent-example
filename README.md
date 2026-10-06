# Subscription Assistant: Atomic + an AI agent

A deliberately small example of how an AI agent can use the [Atomic](https://atomicfi.com) API and Transact SDK to help a user find and cancel their subscriptions.

The user chats with an assistant in a mobile app. The agent looks merchants up through the Atomic API. When the user is ready to cancel, the agent puts a button in the app that opens Atomic's Transact SDK, where the user finishes the cancellation. Atomic's webhooks and the SDK's events go back to the agent, so it can tell the user how things went without being asked.

It's meant to be read, not deployed. There's no login, state lives in memory or a local SQLite file, and webhooks aren't verified. Each of those is a place where a real integration would do more.

## Tech stack

| Part | What it uses |
| --- | --- |
| Agent | [LangChain](https://js.langchain.com) `createAgent` with Claude (`claude-opus-5-5`) through `@langchain/anthropic`. Conversation memory is LangGraph's in-memory `MemorySaver`. |
| Server | Node.js 22+ and Express 5, a WebSocket server (`ws`), and SQLite through Node's built-in `node:sqlite` for webhook events. |
| Atomic | The Atomic API, called from the server with your API key and secret, and the Transact SDK, opened in the app with a public token. |
| Mobile app | Expo (SDK 57) / React Native with `@atomicfi/transact-react-native`. It needs a development build because the Transact SDK has native code, so Expo Go won't run it. |

## Architecture

Everything the agent responds to goes through one queue. Three things write to it: the user, Atomic's webhooks, and the Transact SDK's events. The agent takes items off the queue one at a time for each user and sends each reply to the app over a WebSocket.

```
 Mobile app                          Server                                   Atomic
┌──────────────┐  POST /user-message   ┌──────────────────────┐
│ Chat screen  │──────────────────────▶│                      │
│              │  POST /transact-events│   Message queue      │◀── POST /webhooks/atomic ── Atomic webhooks
│ Transact SDK │──────────────────────▶│   (one per thread)   │
│  onFinish /  │                       └──────────┬───────────┘
│  onClose     │                                  │ one turn at a time
│              │                                  ▼
│              │   WebSocket /ws       ┌──────────────────────┐   API calls
│              │◀──────────────────────│  Agent (Claude +     │─────────────────────▶ Atomic API
└──────────────┘  reply, busy, error   │  tools)              │
                                       └──────────────────────┘
```

- **The user's messages** go to `POST /user-message`, and the server queues them.
- **Transact SDK events**: when the user leaves the Atomic screen, the app sends the SDK's `onFinish` or `onClose` payload to `POST /transact-events`. The server queues it as a system event, so the agent can check on the task and follow up.
- **Atomic webhooks** arrive at `POST /webhooks/atomic`. `task-status-updated` and `pay-link-accounts-updated` events are saved to SQLite. When one changes something the user cares about, such as a cancellation finishing, the server also queues it.
- **The agent** sees system events as `<system_event type="…">` messages the user never sees. Its system prompt says how to respond to each type.
- **Replies** go to the app over the WebSocket, along with `busy` (for the typing indicator) and `error` events. Each user has one thread, keyed by their user ID.

When the agent wants the app to open Transact, a tool returns a `launch_transact` *client action* alongside its result. It travels with the agent's reply, and the app shows it as a button. The model never sees the public token or the action IDs.

### Where things live

```
agent/          The agent: model, system prompt, tools
  tools/        One file per tool
atomic/         A small client for the Atomic API
server/
  index.js      Express app and WebSocket server
  queue.js      Per-thread message queue; runs the agent's turns
  bus.js        Sends events to the WebSockets listening on a thread
  db.js         SQLite: the test user and stored webhook events
  routes/       /user-message, /transact-events, /webhooks/atomic
mobile/         Expo app: chat screen, API client, Transact launcher
```

## Tools

The agent has eight tools. Each runs on the server, so Atomic credentials never reach the model or the app.

| Tool | What it does | Atomic API |
| --- | --- | --- |
| `upsert_user` | Makes sure Atomic knows the user, by creating them if needed. Called at the start of each conversation. | `POST /access-token` |
| `find_merchant` | Searches for a merchant by name and says whether Atomic can cancel subscriptions there. | `POST /company/search` |
| `list_cancellable_merchants` | Lists every merchant where Atomic supports cancelling a plan. | `GET /company/list?actions=cancel-plan` |
| `get_user_subscriptions` | Shows the merchants the user has connected and the subscriptions and plans Atomic found there. | `GET /pay-link/accounts` |
| `get_actions_for_company` | Gets what Atomic can do for this user at a merchant: `cancel-plan` for a specific subscription, or `connect-account` if the user needs to sign in first. | `GET /pay-link/actions-for-company/:companyId` |
| `start_cancellation` | Creates a public token and gives the app a "Cancel \<merchant\>" button that opens Transact on that cancel action. Returns the settings the app needs to launch Transact on the right action. | `POST /access-token` |
| `start_connect_account` | Same, with a "Connect \<merchant\>" button so the user can sign in to the merchant. Returns the settings the app needs to launch Transact on the right action. | `POST /access-token` |
| `check_events` | Reads the latest task statuses from the stored webhooks, to tell the user whether a cancellation went through. | None. It reads the local database. |

## Running it locally

The project uses **Atomic's sandbox by default**. `.env.example` points at `https://sandbox-api.atomicfi.com`, and the Transact SDK uses the same environment.

### What you need

- **Node.js 22.13 or later**
- **macOS with Xcode** and an iOS simulator, plus CocoaPods, to build the app
- **An Atomic account**, to get sandbox API keys from the Atomic console. If you don't have one, contact Atomic to get set up.
- **An Anthropic account**, to get an API key from the [Claude Console](https://console.anthropic.com/settings/keys)
- **[ngrok](https://ngrok.com)** or another tunnel, if you want Atomic's webhooks to reach your machine

### 1. Install

```sh
npm install
cd mobile && npm install && cd ..
```

### 2. Configure

Copy the example env file and fill in your keys:

```sh
cp .env.example .env
```

```sh
ANTHROPIC_API_KEY=sk-ant-...
ATOMIC_API_BASE_URL=https://sandbox-api.atomicfi.com
ATOMIC_API_KEY=...       # sandbox key from the Atomic console
ATOMIC_API_SECRET=...    # sandbox secret from the Atomic console
```

Tell the app where the server is in `mobile/.env`:

```sh
# localhost works in the iOS simulator; on a real device use your Mac's LAN IP.
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 3. Start the server

```sh
npm run dev
```

It listens on `http://localhost:3000` and creates `data.db` with one test user, `test-user-1`. Every chat acts as that user.

### 4. Start the app

In another terminal:

```sh
npm run ios
```

This builds the app, installs it on the simulator and starts Metro. The first build takes a few minutes. The header shows **Online** once the app's WebSocket connects.

### 5. Receive webhooks (optional)

Without webhooks, the agent can still respond to the Transact SDK's events. To have it follow up when Atomic finishes a task, expose the server and register the URL with Atomic:

```sh
ngrok http 3000
```

Then set your webhook URL in the Atomic console to `https://<your-ngrok-domain>/webhooks/atomic`. On a free ngrok plan, the domain changes each time ngrok restarts.

To try the flow without Atomic, you can send a webhook yourself while the app is open:

```sh
curl -X POST localhost:3000/webhooks/atomic -H 'content-type: application/json' -d '{
  "eventType": "task-status-updated", "product": "action", "task": "demo-task-1",
  "user": { "identifier": "test-user-1" }, "company": { "name": "Netflix" },
  "data": { "status": "completed", "flow": "cancel-plan" }
}'
```

The agent's message should appear in the chat a few seconds later. Repeat deliveries of a finished task are ignored, so use a new `task` value each time.
