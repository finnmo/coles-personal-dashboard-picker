# Apple Shortcuts Setup

The dashboard sends items to your shared Apple Reminders list via a Shortcut. This is a one-time setup on the iPad.

## Step 1: Create the Shortcut

1. Open the **Shortcuts** app on your iPad
2. Tap **+** to create a new shortcut
3. Tap the shortcut name at the top and rename it to exactly: **`AddToShopping`**
   _(or whatever you set `APPLE_SHORTCUTS_NAME` to in your `.env`)_

## Step 2: Add Actions

Add these actions in order:

1. **Get Shortcut Input**
   - This receives the JSON sent by the dashboard

2. **Get Dictionary from Input**
   - Input: Shortcut Input

3. **Get Value for Key in Dictionary**
   - Dictionary: Dictionary (from step 2)
   - Key: `item`

4. **Add New Reminder**
   - Reminder: Value (from step 3)
   - List: _(select your shared household Reminders list)_

## Step 3: Test the Shortcut

In a browser on the iPad, open:

```
shortcuts://run-shortcut?name=AddToShopping&input=%7B%22item%22%3A%22Test%20Item%22%2C%22store%22%3A%22Coles%22%7D
```

You should see "Test Item" appear in your Reminders list.

## Step 4: Allow Background Execution

- Open **Settings → Shortcuts**
- Enable **Allow Untrusted Shortcuts** (if not already)
- In the Shortcuts app, open your shortcut settings and ensure it can run without confirmation

## Troubleshooting

**Shortcut doesn't open**: Ensure the `APPLE_SHORTCUTS_NAME` in `.env` matches the shortcut name exactly (case-sensitive).

**Reminder doesn't appear**: Check that step 4 "Add New Reminder" has the correct list selected (not the default Reminders list).

**Shortcut asks for confirmation each time**: In Shortcuts app, tap the shortcut → tap the share icon → "Add to Home Screen" — shortcuts added to home screen run without prompting.
