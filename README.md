# Subscription Assistant: Atomic + an AI agent

A deliberately small example of how an AI agent can use the [Atomic](https://atomicfi.com) API and Transact SDK to help a user find and cancel their subscriptions.

The user chats with an assistant in a mobile app. The agent looks merchants up through the Atomic API. When the user is ready to cancel, the agent puts a button in the app that opens Atomic's Transact SDK, where the user finishes the cancellation. The app shows each task's status from the SDK in the chat and sends it to the server, which saves it. Once the cancellation is over, the app asks the agent for an update, and the agent tells the user how it went.

It's meant to be read, not deployed. There's no login, state lives in memory or a local SQLite file, and task status updates from the app are trusted as is. Each of those is a place where a real integration would do more.

## Tech stack

| Part | What it uses |
| --- | --- |
| Agent | [LangChain](https://js.langchain.com) `createAgent` with Claude (`claude-opus-5-5`) through `@langchain/anthropic`. Conversation memory is LangGraph's in-memory `MemorySaver`. |
| Server | Node.js 22+ and Express 5, and SQLite through Node's built-in `node:sqlite` for task status updates. |
| Atomic | The Atomic API, called from the server with your API key and secret, and the Transact SDK, opened in the app with a public token. |
| Mobile app | Expo (SDK 57) / React Native with `@atomicfi/transact-react-native`. It needs a development build because the Transact SDK has native code, so Expo Go won't run it. |

## Architecture

The app talks to the server with plain HTTP requests, and the agent only acts when the user sends a message.

- **The user's messages** go to `POST /user-message`. The server runs one agent turn and returns the agent's reply in the response. Each user has one conversation, keyed by their user ID.
- **Task status updates** come from the Transact SDK's `onTaskStatusUpdate` event. The app shows each one in the chat and posts it to `POST /task-status-update`, and the server saves the task's latest status to SQLite. A completed cancellation is followed by a `refresh` task that resyncs the user's account.
- **Status updates:** the agent can't message the user on its own, so the app asks for it. Once a cancellation fails, or the refresh after it finishes, the app sends the agent "provide cancel-plan of \<company\> update". The request isn't shown in the chat; only the reply is. The agent reads the saved statuses with `check_events` and, when the cancellation completed, the account with `get_user_subscriptions`. The user can also ask for a status update at any time.

When the agent wants the app to open Transact, a tool returns a `launch_transact` *client action* alongside its result. It travels with the agent's reply, and the app shows it as a button. The model only learns that the button is ready; it never sees the launch configuration.

### Where things live

```
agent/          The agent: model, system prompt, tools
  tools/        One file per tool
atomic/         A small client for the Atomic API
server/
  index.js      Express app
  db.js         SQLite: the test user and saved task statuses
  routes/       /user-message and /task-status-update
mobile/         Expo app: chat screen, API client, Transact launcher
```

## Tools

The agent has seven tools. Each runs on the server, so Atomic credentials never reach the model or the app.

| Tool | What it does | Atomic API |
| --- | --- | --- |
| `upsert_user` | Makes sure Atomic knows the user, by creating them if needed. Called at the start of each conversation. | `POST /access-token` |
| `find_company` | Searches for a company by name and says whether Atomic can cancel subscriptions there. | `POST /company/search` |
| `list_cancellable_companies` | Lists every company where Atomic supports cancelling a plan. | `GET /company/list?actions=cancel-plan` |
| `get_user_subscriptions` | Shows the user's connected accounts, with the bills and plans Atomic found on each. | `GET /pay-link/accounts` |
| `get_actions_for_company` | Gets what Atomic can do for this user at a merchant: `cancel-plan` for a specific subscription, or `connect-account` if the user needs to sign in first. | `GET /pay-link/actions-for-company/:companyId` |
| `get_action_config` | Creates a public token and gives the app a "Cancel \<company\>" or "Connect \<company\>" button that opens Transact on a `cancel-plan` or `connect-account` action. Returns the settings the app needs to launch Transact on the right action. | `POST /access-token` |
| `check_events` | Reads the latest task statuses the app saved from Transact, to tell the user whether a cancellation went through. | None. It reads the local database. |

## Running it locally

The project uses **Atomic's sandbox by default**. `.env.example` points at `https://sandbox-api.atomicfi.com`, and the Transact SDK uses the same environment.

### What you need

- **Node.js 22.13 or later**, with npm
- **macOS with Xcode** and an iOS simulator running iOS 16.4 or later, plus CocoaPods, to build the app. It has been built with Xcode 27.0 and CocoaPods 1.16.2. The app is iOS only: there's an `android` script, but it hasn't been built or tested for Android. It needs a native build because the Transact SDK has native code, so Expo Go won't run it.
- **Ports 3000 and 8081 free**, for the server and Metro. If another dev server is on port 3000, the app's requests reach it instead and fail with a 404. To use a different port, start the server with `PORT=3001 npm run dev` and set `EXPO_PUBLIC_API_URL` in `mobile/.env` to match, then restart Metro with `npx expo start -c` so the app picks it up.
- **An Atomic account**, to get sandbox API keys from the Atomic console. If you don't have one, contact Atomic to get set up.
- **An Anthropic account**, to get an API key from the [Claude Console](https://console.anthropic.com/settings/keys)

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
USER_IDENTIFIER=...      # required: the user every chat acts as, such as test-user-1
```

All of these are required. If any is missing, the server stops at startup and lists the ones it needs.

Tell the app where the server is in `mobile/.env`:

```sh
# localhost works in the iOS simulator; on a real device use your Mac's LAN IP.
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 3. Start the server

```sh
npm run dev
```

It listens on `http://localhost:3000` and creates `data.db` with one test user, `USER_IDENTIFIER` from `.env`. Every chat acts as that user.

### 4. Start the app

In another terminal:

```sh
npm run ios
```

This builds the app, installs it on the simulator and starts Metro. The first build takes a few minutes.

### 5. Check a task's status

After a cancellation in Transact, the agent tells you how it went once it's over. You can also ask it "what's the status of my last task?" at any time.

To try it without Transact, you can send a task status update yourself:

```sh
curl -X POST localhost:3000/task-status-update -H 'content-type: application/json' -d '{
  "taskId": "demo-task-1", "product": "action", "status": "completed",
  "actionType": "cancel-plan", "company": { "name": "Netflix" }
}'
```

Only the app asks the agent for an update on its own, so then ask the agent "what's the status of my last task?". Once a task is completed or failed, later updates to it are ignored, so use a new `taskId` each time.
