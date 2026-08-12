/**
 * Checklist Real-Time Sync Module
 * Syncs checkbox states between Supabase and the DOM in real-time
 *
 * Usage:
 * const sync = new ChecklistSync(userName, supabaseUrl, supabaseKey);
 * await sync.init();
 */

class ChecklistSync {
  constructor(userName = 'anonymous', supabaseUrl = '', supabaseKey = '') {
    this.userName = userName;
    this.supabaseUrl = supabaseUrl || 'https://ebvqxuwfiptcmlkhflfj.supabase.co';
    this.supabaseKey = supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVidnF4dXdmaXB0Y21sa2hmbGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwOTkwNDQsImV4cCI6MjA2NjY3NTA0NH0.2JpXgHo7LKchMH83qEQf4r5d5dFAhCaWvz0c-FRFXEk';
    this.realtimeUrl = this.supabaseUrl.replace('https://', 'wss://');
    this.socket = null;
    this.subscriptions = new Map();
    this.localChanges = new Map(); // Track local changes to avoid sync loops
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    console.log('[ChecklistSync] Initializing...');

    // Load initial state from Supabase
    await this.loadInitialState();

    // Setup real-time subscriptions
    this.setupRealtimeListener();

    // Setup local change listeners
    this.setupLocalListeners();

    this.initialized = true;
    console.log('[ChecklistSync] ✅ Ready - real-time sync active');
  }

  async loadInitialState() {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/checklist_items?select=*`,
        {
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'apikey': this.supabaseKey,
            'Accept': 'application/json'
          }
        }
      );

      const tasks = await response.json();
      console.log(`[ChecklistSync] Loaded ${tasks.length} tasks from Supabase`);

      // Update all checkboxes based on database state
      tasks.forEach(task => {
        const checkbox = this.findCheckboxByTaskKey(task.task_key);
        if (checkbox) {
          checkbox.checked = task.is_completed;
          // Mark as synced locally to avoid triggering onChange
          this.localChanges.set(task.task_key, task.is_completed);
        }
      });

      // Clear the tracking map after loading
      setTimeout(() => this.localChanges.clear(), 100);
    } catch (error) {
      console.error('[ChecklistSync] Failed to load initial state:', error);
    }
  }

  setupLocalListeners() {
    // Find all checkboxes in the page
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', (e) => this.handleLocalChange(e, checkbox));
    });

    console.log(`[ChecklistSync] Watching ${checkboxes.length} checkboxes`);
  }

  async handleLocalChange(event, checkbox) {
    const taskKey = this.getTaskKeyFromCheckbox(checkbox);
    if (!taskKey) return;

    const isCompleted = checkbox.checked;
    console.log(`[ChecklistSync] Local change: ${taskKey} = ${isCompleted}`);

    // Update Supabase
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/checklist_items?task_key=eq.${taskKey}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'apikey': this.supabaseKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            is_completed: isCompleted,
            updated_at: new Date().toISOString(),
            updated_by: this.userName
          })
        }
      );

      if (!response.ok) {
        console.error('[ChecklistSync] Failed to sync to Supabase:', response.status);
      }
    } catch (error) {
      console.error('[ChecklistSync] Sync error:', error);
      // Revert checkbox if sync failed
      checkbox.checked = !isCompleted;
    }
  }

  setupRealtimeListener() {
    // For real-time updates, we'll use polling as a fallback
    // since WebSocket might not be available in all contexts
    console.log('[ChecklistSync] Setting up real-time listener...');

    // Poll for changes every 2 seconds
    setInterval(() => this.pollForRemoteChanges(), 2000);
  }

  async pollForRemoteChanges() {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/checklist_items?select=*&order=updated_at.desc&limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'apikey': this.supabaseKey,
            'Accept': 'application/json',
            'Prefer': 'count=exact'
          }
        }
      );

      const tasks = await response.json();

      tasks.forEach(task => {
        // Skip if it was just changed locally
        if (this.localChanges.get(task.task_key) === task.is_completed) {
          return;
        }

        const checkbox = this.findCheckboxByTaskKey(task.task_key);
        if (checkbox && checkbox.checked !== task.is_completed) {
          console.log(`[ChecklistSync] Remote update: ${task.task_key} = ${task.is_completed} (by ${task.updated_by})`);
          checkbox.checked = task.is_completed;

          // Show subtle visual feedback
          checkbox.style.transition = 'background-color 0.3s';
          checkbox.style.backgroundColor = '#5FCB9B';
          setTimeout(() => checkbox.style.backgroundColor = '', 300);
        }
      });
    } catch (error) {
      // Silently fail - don't spam console on network errors
      // console.error('[ChecklistSync] Poll error:', error);
    }
  }

  getTaskKeyFromCheckbox(checkbox) {
    // Get the text content from the sibling span
    const textSpan = checkbox.parentElement?.querySelector('.txt');
    if (!textSpan) return null;

    const taskName = textSpan.textContent.trim();
    return this.generateTaskKey(taskName);
  }

  generateTaskKey(taskName) {
    // Convert task name to key format (lowercase, hyphens)
    return taskName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 50);
  }

  findCheckboxByTaskKey(taskKey) {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    for (const checkbox of checkboxes) {
      const textSpan = checkbox.parentElement?.querySelector('.txt');
      if (!textSpan) continue;

      const taskName = textSpan.textContent.trim();
      const currentKey = this.generateTaskKey(taskName);

      if (currentKey === taskKey) {
        return checkbox;
      }
    }

    return null;
  }

  // Allow manual setting of user name
  setUserName(name) {
    this.userName = name;
    console.log(`[ChecklistSync] User set to: ${name}`);
  }
}

// Auto-initialize if this is loaded in the artifact
if (typeof window !== 'undefined') {
  // Detect user from localStorage or prompt
  let userName = localStorage.getItem('checklistUser');
  if (!userName) {
    const name = prompt('Enter your name (Sean or Kegan):') || 'anonymous';
    if (name) {
      localStorage.setItem('checklistUser', name);
      userName = name;
    }
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const sync = new ChecklistSync(userName);
      sync.init();
      window.checklistSync = sync;
    });
  } else {
    const sync = new ChecklistSync(userName);
    sync.init();
    window.checklistSync = sync;
  }
}
