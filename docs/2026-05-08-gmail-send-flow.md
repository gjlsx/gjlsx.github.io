# Gmail Send Flow

## Purpose

This document records a reusable computer-operation flow for sending a simple Gmail message through an already-open Chrome instance that exposes a Chrome DevTools remote debugging port.

The goal is not to form a formal skill yet. The goal is to keep a stable reference that can later be refined into a local toolset or a Codex skill.

## Scope

Use this flow when all of the following are true:

- Chrome is already running with a `--remote-debugging-port`
- The Chrome profile is already logged into Gmail
- The task is a simple send action such as a short greeting or notification
- The operator wants a repeatable CDP-based process instead of manual clicking

This flow is intentionally narrow. It is not a general Gmail automation framework.

## Output Layout

- Main doc: `docs/2026-05-08-gmail-send-flow.md`
- Companion directory: `docs/2026-05-08-gmail-send-flow/`

The companion directory stores scripts, screenshots, and later notes that support this flow.

## Preconditions

### Browser

- Chrome executable can be launched normally
- The active Chrome instance is started with a user profile, for example:
  - `"C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir=D:\work\tools\chromes\8\ --remote-debugging-port=10008`
- The remote debugging endpoint responds on `http://127.0.0.1:10008`

### Account

- Gmail is already logged in inside that Chrome profile
- The task has explicit authorization to send mail

### Environment

- Node.js is available
- The local Playwright skill runtime is available when needed
- Scripts can use CDP directly through WebSocket and `fetch`

## Key Constraints Learned

### 1. The in-app browser plugin is not the right surface

The `@browser-use` / in-app browser plugin controls the Codex in-app browser, not an external Chrome process that was started manually with a CDP port.

### 2. Whole-browser CDP attach was unstable here

Attaching Playwright to the full browser with `connectOverCDP("http://127.0.0.1:10008")` timed out after handshake.

Likely reason:

- This Chrome instance had many open page, iframe, and background targets
- Full browser attach was heavier than needed for this task

### 3. Single-page CDP was the stable path

The reliable path was:

1. Create or locate the specific Gmail page target
2. Attach to that page target's `webSocketDebuggerUrl`
3. Drive only that page through raw CDP commands

### 4. DOM `.click()` was not enough for final send

For the compose page:

- Pre-filling recipient, subject, and body worked
- Inspecting the send button worked
- A plain DOM `element.click()` did not produce a confirmed send
- A real mouse event sequence through CDP did produce `Message sent`

## Standard Flow

### Step 1. Verify the CDP endpoint

Check:

- `http://127.0.0.1:10008/json/version`
- `http://127.0.0.1:10008/json/list`

Success means:

- The endpoint responds
- A `webSocketDebuggerUrl` is present

### Step 2. Smoke-test Gmail login state

Open or create a Gmail page target and confirm:

- URL resolves to Gmail inbox or another Gmail-authenticated page
- Not on `accounts.google.com` login prompts
- Inbox signals exist such as `Compose`, `Inbox`, or search box

Reference script:

- `docs/2026-05-08-gmail-send-flow/scripts/gmail_smoke_test.js`

### Step 3. Build the compose URL

Use Gmail compose URL parameters to prefill the message:

- `to`
- `su`
- `body`

This avoids fragile field-by-field typing for simple messages.

Reference script:

- `docs/2026-05-08-gmail-send-flow/scripts/gmail_send_mail.js`

### Step 4. Inspect compose state before sending

Verify:

- Compose page is open
- Recipient is present
- Subject is present
- Message body is present
- The `Send` button is visible and has a usable selector or geometry

Reference script:

- `docs/2026-05-08-gmail-send-flow/scripts/gmail_inspect_compose.js`

### Step 5. Send with real input events

Final send should use CDP mouse events:

1. Locate send button geometry
2. Move mouse to center
3. Dispatch `mousePressed`
4. Dispatch `mouseReleased`

This was the first method that produced a confirmed send in this environment.

Reference script:

- `docs/2026-05-08-gmail-send-flow/scripts/gmail_send_existing_compose.js`

### Step 6. Verify send result

Treat the send as successful only after one of these signals appears:

- `Message sent`
- `Undo`
- `View message`
- Inbox state or URL transition if applicable

Store a screenshot after the success signal.

## Recommended Operational Sequence

For repeat use, follow this sequence:

1. Confirm the remote debugging port is alive
2. Run the unified script in `status` mode
3. Open compose with the unified script in `compose` mode
4. Inspect compose state with `inspect-compose` if anything looks uncertain
5. Send through the unified script in `send-compose` mode
6. Save evidence screenshot

## Unified CLI Usage

Run from the script directory or with absolute paths.

### 1. Check Gmail status

```powershell
node scripts/gmail_flow.js status
```

### 2. Open a prefilled compose page

```powershell
node scripts/gmail_flow.js compose --to "lovemoney.top@gmail.com" --subject "Hello" --body "hello by chatgpt 5.4"
```

### 3. Inspect the currently open compose page

```powershell
node scripts/gmail_flow.js inspect-compose
```

### 4. Send the currently open compose page

```powershell
node scripts/gmail_flow.js send-compose
```

### 5. Override the CDP endpoint when needed

```powershell
node scripts/gmail_flow.js status --debug-url "http://127.0.0.1:10008"
```

## Artifacts In This Companion Directory

### Scripts

- `scripts/gmail_flow.js`
  - Unified repeat-use CLI for `status`, `compose`, `inspect-compose`, and `send-compose`
- `scripts/gmail_flow_lib.js`
  - Shared helper logic for argument parsing, compose URL creation, CDP attach, waiting, and screenshot capture
- `scripts/gmail_smoke_test.js`
  - Legacy single-purpose smoke-test reference script
- `scripts/gmail_send_mail.js`
  - Legacy first send attempt through compose URL plus DOM send click
- `scripts/gmail_inspect_compose.js`
  - Legacy compose-page evidence collector
- `scripts/gmail_send_existing_compose.js`
  - Legacy final successful send path using real CDP mouse events

### Screenshots

- `artifacts/gmail-smoke.png`
  - Inbox evidence
- `artifacts/gmail-compose-inspect.png`
  - Compose-page evidence before final send
- `artifacts/gmail-send-existing-result.png`
  - Confirmed `Message sent` evidence

## Failure Modes

### CDP endpoint works but full-browser attach times out

Use single-page CDP attach instead of whole-browser attach.

### Gmail compose opens but send does not complete

Do not assume the button is broken. Check:

- Whether the compose target is still open
- Whether `Send` is actually visible
- Whether the send was attempted via DOM click instead of real mouse events

### No Gmail target exists

Create a new target using `/json/new` with the Gmail or compose URL, then attach to that target only.

### Login page appears

Stop the automation path and treat it as a different flow. This document assumes an already-authenticated Gmail session.

## Why This Is Useful Later

This structure is intentionally close to a future skill layout:

- Main document explains intent and stable procedure
- Companion directory holds reusable scripts and evidence
- Later refinement can split this into:
  - a concise trigger description
  - a reusable workflow guide
  - smaller final-form helper scripts

## Next Refinement Candidates

- Remove or archive legacy one-off scripts once the unified entrypoint proves stable
- Add one shared helper for target discovery patterns beyond Gmail compose
- Add parameterized recipient, subject, and body input
- Separate "smoke test" from "send" into distinct reusable tools
- Convert the final process into a local reusable skill only after the workflow stabilizes
