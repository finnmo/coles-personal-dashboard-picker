# Apple Shortcuts Setup

The dashboard sends grocery items to your shared Apple Reminders list via an iOS Shortcut. This is a one-time setup on the iPad (or iPhone).

## What the dashboard sends

When you tap the purchase button, the app opens a URL of this form:

```
shortcuts://run-shortcut?name=AddToShopping&input={"name":"Full Cream Milk 2L","store":"COLES"}
```

Your Shortcut receives the JSON payload and adds the product name as a new Reminder.

---

## Step 1 — Create the Shortcut

1. Open the **Shortcuts** app on your iPad
2. Tap **+** to create a new shortcut
3. Tap the shortcut name at the top and rename it to exactly: **`AddToShopping`**

   > The name must match `APPLE_SHORTCUTS_NAME` in your `.env` exactly (case-sensitive).

---

## Step 2 — Add Actions

Add these five actions in order:

### Action 1 — Receive Shortcut Input

- Search for **"Receive Shortcut Input"**
- Input type: **Text**

### Action 2 — Get Dictionary from Input

- Search for **"Get Dictionary from Input"**
- Input: **Shortcut Input** (the variable from Action 1)

### Action 3 — Get Value for Key

- Search for **"Get Value for Key in Dictionary"**
- Dictionary: **Dictionary** (the variable from Action 2)
- Key: **`name`**

### Action 4 — Add New Reminder

- Search for **"Add New Reminder"**
- Reminder: **Value** (the variable from Action 3)
- List: _select your shared household Reminders list_

### Action 5 (optional) — Show Result

- Search for **"Show Result"**
- Input: `Done — added to shopping list`
- This confirms to the user that the item was added.

---

## Step 3 — Test the Shortcut

In Safari on the iPad, navigate to:

```
shortcuts://run-shortcut?name=AddToShopping&input=%7B%22name%22%3A%22Test%20Milk%22%2C%22store%22%3A%22COLES%22%7D
```

You should see "Test Milk" appear in your shared Reminders list.

---

## Step 4 — Allow Untrusted Shortcuts (if prompted)

1. Open **Settings → Shortcuts**
2. Enable **Allow Untrusted Shortcuts**
3. In the Shortcuts app, open your shortcut → tap the **•••** menu → **Shortcut Details**
4. Disable **"Ask Before Running"** so the shortcut runs silently in the background

---

## Troubleshooting

| Symptom                                   | Fix                                                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Shortcut doesn't open                     | Check that `APPLE_SHORTCUTS_NAME` in `.env` matches the shortcut name exactly (case-sensitive, no trailing spaces) |
| Reminder doesn't appear                   | Verify Action 4 has the correct list selected — not the default personal Reminders list                            |
| Shortcut asks for confirmation every time | Disable "Ask Before Running" in Shortcut Details (Step 4)                                                          |
| Wrong item name added                     | Confirm Action 3 uses key **`name`** (not `item` or `product`)                                                     |
| App shows "List provider unavailable"     | Check that `LIST_PROVIDER=apple_reminders` and `APPLE_SHORTCUTS_NAME` are set in `.env` and restart the container  |
