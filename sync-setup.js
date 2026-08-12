/**
 * Setup script to populate Supabase with checklist items
 * Run this once to initialize the database
 *
 * Usage: node sync-setup.js
 */

const https = require('https');
const fs = require('fs');

// Configuration - UPDATE THESE WITH YOUR ACTUAL VALUES
const SUPABASE_URL = 'https://ebvqxuwfiptcmlkhflfj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVidnF4dXdmaXB0Y21sa2hmbGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwOTkwNDQsImV4cCI6MjA2NjY3NTA0NH0.2JpXgHo7LKchMH83qEQf4r5d5dFAhCaWvz0c-FRFXEk';

const tasks = JSON.parse(fs.readFileSync('./checklist-data.json', 'utf8')).tasks;

async function insertTasks() {
  console.log(`Inserting ${tasks.length} tasks into Supabase...`);

  const payload = {
    tasks: tasks.map(t => ({
      task_key: t.key,
      task_name: t.name,
      owner: t.owner,
      section: t.section,
      is_completed: false
    }))
  };

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'ebvqxuwfiptcmlkhflfj.supabase.co',
      port: 443,
      path: '/rest/v1/checklist_items',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          console.error(`Error: ${res.statusCode}`);
          console.error(data);
          reject(new Error(`HTTP ${res.statusCode}`));
        } else {
          console.log(`✅ Successfully inserted ${tasks.length} tasks!`);
          resolve(JSON.parse(data));
        }
      });
    });

    req.on('error', reject);

    // Insert each task individually to avoid conflicts
    let completed = 0;
    tasks.forEach((task, index) => {
      const singlePayload = {
        task_key: task.key,
        task_name: task.name,
        owner: task.owner,
        section: task.section,
        is_completed: false
      };

      const opts = {
        hostname: 'ebvqxuwfiptcmlkhflfj.supabase.co',
        port: 443,
        path: '/rest/v1/checklist_items',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        }
      };

      const r = https.request(opts, (res) => {
        completed++;
        if (res.statusCode >= 400) {
          console.error(`Error inserting ${task.key}: ${res.statusCode}`);
        } else {
          console.log(`✓ ${completed}/${tasks.length} - ${task.name}`);
        }

        if (completed === tasks.length) {
          console.log('\n✅ All tasks inserted successfully!');
          resolve();
        }
      });

      r.on('error', (err) => {
        console.error(`Error: ${err.message}`);
        completed++;
        if (completed === tasks.length) resolve();
      });

      r.write(JSON.stringify(singlePayload));
      r.end();
    });
  });
}

insertTasks().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
