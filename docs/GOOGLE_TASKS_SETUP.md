# Google Tasks Setup

This app uses Google Tasks as the shared shopping list. Items added from the
dashboard appear in the Google Tasks app on any phone — tap to check off and
they disappear from the dashboard within 30 seconds.

## Step 1 — Create a Google Cloud project

1. Go to https://console.cloud.google.com
2. Click **New Project** → give it any name (e.g. `household-dashboard`) → **Create**
3. Make sure the new project is selected in the top bar

## Step 2 — Enable the Tasks API

1. In the left menu go to **APIs & Services → Library**
2. Search for **Tasks API** → click it → **Enable**

## Step 3 — Create OAuth credentials

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. If prompted, configure the **OAuth consent screen** first:
   - User type: **External** → **Create**
   - Fill in App name (anything), User support email, Developer email → **Save and Continue**
   - Skip Scopes → **Save and Continue**
   - Add your Google account as a test user → **Save and Continue**
4. Back in **Create OAuth client ID**:
   - Application type: **Desktop app**
   - Name: anything
   - **Create**
5. Copy the **Client ID** and **Client Secret** — you'll need them in Step 5

## Step 4 — Get a refresh token

Run the helper script (it opens a browser for you to approve access):

```bash
GOOGLE_CLIENT_ID=<your-client-id> \
GOOGLE_CLIENT_SECRET=<your-client-secret> \
npx tsx scripts/google-oauth-setup.ts
```

Follow the prompts. The script prints a **refresh token** — copy it.

## Step 5 — Find your Task List ID

The script also prints your available task lists and their IDs.
Copy the ID of the list you want to use (usually `@default` for the default list,
but you can create a dedicated "Shopping" list in the Google Tasks app first).

## Step 6 — Update your .env

```env
LIST_PROVIDER="google_tasks"
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REFRESH_TOKEN="your-refresh-token"
GOOGLE_TASK_LIST_ID="@default"
```

Then rebuild the Docker image:

```bash
docker build -t dashboard . && docker run -d \
  --env-file <(sed 's/^export //' .env | grep -v '^#' | grep -v '^$') \
  -p 3000:3000 -v "$(pwd)/data:/app/data" dashboard
```

## How it works

- **Dashboard → Google Tasks**: tapping a product tile adds it as a task
- **Google Tasks app → Dashboard**: checking off an item in the app removes it
  from the dashboard sidebar within 30 seconds (auto-refresh)
- **Clear all**: the "Clear" button in the sidebar completes all tasks at once
