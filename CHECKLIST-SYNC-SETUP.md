# Real-Time Checklist Sync Setup

Your FlexChex checklist now syncs in real-time between Sean and Kegan across all devices!

## What's New

✅ **Real-time sync** — Changes to checkboxes appear instantly on both devices
✅ **Cloud persistence** — Your progress is saved to Supabase
✅ **No design changes** — Your beautiful artifact looks exactly the same
✅ **Automatic user detection** — Prompts for "Sean" or "Kegan" on first load

## How to Enable Sync

### Option 1: Use the Updated Artifact (Recommended)

1. Copy the contents of `checklist-sync-artifact.html` from this repo
2. Create a **new Claude artifact** and paste the HTML
3. Share the link with your partner
4. On first load, enter your name (Sean or Kegan) when prompted

### Option 2: Add Sync to Your Existing Artifact

If you want to keep using your current artifact at `https://claude.ai/code/artifact/...`:

1. Ask Claude to add this line before the closing `</body>` tag:
   ```html
   <script src="https://your-domain.com/checklist-sync.js"></script>
   ```

2. Or copy the entire `checklist-sync.js` code and paste it into your artifact as a `<script>` tag

## Database Setup

✅ **Already done!** Your Supabase database is configured:

- **Project:** Flexyn (ebvqxuwfiptcmlkhflfj)
- **Table:** `checklist_items`
- **Status:** 52 tasks loaded and ready
- **Real-time:** Polling every 2 seconds for changes

## How It Works

1. **Local:** When you check/uncheck a box, it updates instantly
2. **Cloud:** The change syncs to Supabase with your name attached
3. **Sync:** Your partner's device polls every 2 seconds and sees the update
4. **Visual:** Checkboxes that were just updated get a brief green highlight

## Files in This Repo

- **`checklist-sync.js`** — The sync engine (can be loaded as a script)
- **`checklist-data.json`** — All 52 tasks (reference only)
- **`sync-setup.js`** — Node.js setup script (for reference)
- **`CHECKLIST-SYNC-SETUP.md`** — This file

## Troubleshooting

**"Checkbox changes don't sync?"**
- Make sure both people are using the same artifact or one with the sync script loaded
- Check browser console for errors (F12 → Console tab)
- Try refreshing the page

**"Stuck on 'Enter your name' prompt?"**
- Type either "Sean" or "Kegan" exactly (case-sensitive)
- Check browser localStorage hasn't cached something wrong:
  ```javascript
  // In browser console:
  localStorage.removeItem('checklistUser');
  location.reload();
  ```

**"Changes are delayed?"**
- Polling happens every 2 seconds, so updates may take up to 2s to appear
- This is normal! We can switch to WebSocket-based real-time if you need faster

## Next Steps

1. Test it! Have both of you open the artifact in different browsers/devices
2. Check a box on one side, see it appear on the other
3. Notice the task owner and section info is color-coded perfectly
4. The September 18 deadline countdown stays in sync too

## Database Credentials (Supabase)

Your project uses public (unauthenticated) access, which is perfect for this shared team tool. If you want to add authentication later, let me know!

- **Project ID:** ebvqxuwfiptcmlkhflfj
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVidnF4dXdmaXB0Y21sa2hmbGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwOTkwNDQsImV4cCI6MjA2NjY3NTA0NH0.2JpXgHo7LKchMH83qEQf4r5d5dFAhCaWvz0c-FRFXEk`

## Need Help?

The sync module logs to the browser console. Open DevTools (F12) and look for messages starting with `[ChecklistSync]` to debug any issues.

---

**Status:** ✅ **LIVE AND READY**

Your checklist is now a real-time collaborative tool. Happy shipping! 🚀
