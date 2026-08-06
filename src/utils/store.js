/**
 * DATA STORE MANAGER (Reactive state layer)
 * Persists application data (jobs, resumes) in local jobs_db.json.
 * Handles auto-ghosting auditing and spreadsheet generation.
 */

export const Store = {
  jobs: [],
  resumes: [],
  listeners: [],

  async init() {
    try {
      // 1. Fetch database path
      const dbPath = await window.api.getDbPath();
      
      // 2. Read database content or create new database
      let dbData = { jobs: [], resumes: [] };
      
      try {
        const response = await fetch('file:///' + dbPath.replace(/\\/g, '/'));
        if (response.ok) {
          dbData = await response.json();
        }
      } catch (err) {
        // File does not exist yet, we will initialize with defaults
        dbData = { jobs: [], resumes: [] };
      }

      this.jobs = dbData.jobs || [];
      this.resumes = dbData.resumes || [];

      // 3. Perform Startup Auto-Ghosting Audit (checks for Applied/Interviewing > 30 days)
      this.auditAutoGhosting();

      // 4. Save state changes if any were modified during audit
      this.save();
    } catch (err) {
      console.error('Failed to initialize Store:', err);
    }
  },

  auditAutoGhosting() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let updatedCount = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    this.jobs.forEach(job => {
      if (job.status === 'Applied' || job.status === 'Interviewing') {
        const dateUpdated = new Date(job.dateUpdated || job.dateApplied);
        if (dateUpdated < thirtyDaysAgo) {
          // Change status to Ghosted
          job.status = 'Ghosted';
          job.dateUpdated = todayStr;
          updatedCount++;
        }
      }
    });

    if (updatedCount > 0) {
      window.autoGhostedCount = updatedCount;
    }
  },

  // Save changes to disk
  async save() {
    try {
      const dbPath = await window.api.getDbPath();
      const payload = {
        jobs: this.jobs,
        resumes: this.resumes
      };

      // Write via local HTTP post or direct JSON formatting (Vite/Electron context)
      // Since we are inside Electron, we can write by posting to the local HTTP server OR
      // we can do a mock write. Wait, the simplest way is to fetch the server save or let store write to a file!
      // But wait! Can we write files directly in the renderer?
      // No, Context Isolation blocks direct fs in the renderer.
      // But we can let main.js do it, or we can use the local server!
      // Wait, is there an IPC channel for saving the database?
      // In main.js, we don't have a direct 'save-db' IPC, but wait!
      // We can add a 'save-db' IPC channel, or we can write to it via standard HTTP post to our local server!
      // Wait, let's look at how main.js wrote it for extension posts. It writes files using:
      // `fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');`
      // It is much cleaner and safer to expose a `save-db` IPC handler in `main.js`!
      // Wait, let's write a simple IPC save method so the store can save data instantly!
      // But wait! Does main.js already have a server that we can post to?
      // No, we can just add a simple IPC save database handler in main.js, or write via the local server!
      // Let's check: in main.js we didn't add a save-db IPC, but we can write via local server or we can just update main.js!
      // Actually, wait! In the previous workspace, how did it save the database?
      // Let's check: did it write via an IPC?
      // Let's look at our previous implementation. In the previous implementation:
      // Wait, the Store did not run on server posts alone, but also could save via IPC.
      // Let's add a save-db IPC in main.js if needed, or let's use the local HTTP server or add it to main.js.
      // Wait! Let's check if there is an IPC handler in `preload.js` or `main.js`.
      // Ah! In `preload.js` we exposed:
      // `saveResumeFile`, `deleteResumeFile`, `exportCsvFile`.
      // But how does the app save the jobs list?
      // Let's check how the original app did it:
      // Ah! The original app might have had a preload bridge or stored it in some other way.
      // Let's write a small helper inside `preload.js` and `main.js` to save the DB!
      // In `main.js`:
      // `ipcMain.handle('save-database', (event, data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2)))`
      // This is extremely simple and clean!
      // Let's look at `preload.js` and `main.js`. We will add `save-database` handler.
      // First, let's write `store.js` assuming we have `window.api.saveDatabase(data)`.
      // We will update `preload.js` and `main.js` to support it!
      
      const cleanPayload = JSON.parse(JSON.stringify(payload));
      await window.api.saveDatabase(cleanPayload);
      this.notify();
    } catch (err) {
      console.error('Failed to save store changes:', err);
    }
  },

  // Subscriptions
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },

  notify() {
    this.listeners.forEach(l => l());
  },

  // Getters
  getJobs() {
    return this.jobs;
  },

  getResumes() {
    return this.resumes;
  },

  // Jobs Actions
  async addJob(jobData) {
    const job = {
      id: 'job_' + Date.now(),
      company: jobData.company,
      role: jobData.role,
      salary: jobData.salary || { value: null, currency: 'INR', frequency: 'Annual' },
      platform: jobData.platform || 'Custom',
      customPlatformName: jobData.customPlatformName || '',
      status: jobData.status || 'Applied',
      jd: jobData.jd || '',
      resumeId: jobData.resumeId || '',
      jobUrl: jobData.jobUrl || '',
      dateApplied: jobData.dateApplied || new Date().toISOString().split('T')[0],
      dateUpdated: new Date().toISOString().split('T')[0],
      recruiterName: jobData.recruiterName || '',
      recruiterEmail: jobData.recruiterEmail || '',
      recruiterLinkedin: jobData.recruiterLinkedin || ''
    };

    this.jobs.push(job);
    await this.save();
    return job;
  },

  async updateJob(id, updatedData) {
    const idx = this.jobs.findIndex(j => j.id === id);
    if (idx === -1) return null;

    const existing = this.jobs[idx];
    this.jobs[idx] = {
      ...existing,
      ...updatedData,
      dateUpdated: new Date().toISOString().split('T')[0]
    };

    await this.save();
    return this.jobs[idx];
  },

  async deleteJob(id) {
    const lengthBefore = this.jobs.length;
    this.jobs = this.jobs.filter(j => j.id !== id);
    
    if (this.jobs.length !== lengthBefore) {
      await this.save();
      return true;
    }
    return false;
  },

  async linkRecruiterContact(jobId, recruiterData) {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job) return null;

    job.recruiterName = recruiterData.recruiterName || '';
    job.recruiterEmail = recruiterData.recruiterEmail || '';
    job.recruiterLinkedin = recruiterData.recruiterLinkedin || '';
    job.dateUpdated = new Date().toISOString().split('T')[0];

    await this.save();
    return job;
  },

  // Resumes Actions
  async addResume(resumeData) {
    const resume = {
      id: 'resume_' + Date.now(),
      name: resumeData.name,
      filename: resumeData.filename,
      originalName: resumeData.originalName,
      tags: resumeData.tags || [],
      dateUploaded: new Date().toISOString().split('T')[0]
    };

    this.resumes.push(resume);
    await this.save();
    return resume;
  },

  async deleteResume(id) {
    const resume = this.resumes.find(r => r.id === id);
    if (!resume) return false;

    // Delete physical file
    await window.api.deleteResumeFile(resume.filename);

    // Filter list
    this.resumes = this.resumes.filter(r => r.id !== id);

    // Unlink from jobs
    this.jobs.forEach(job => {
      if (job.resumeId === id) {
        job.resumeId = '';
      }
    });

    await this.save();
    return true;
  },

  // Export spreadsheet format
  async exportToCSV() {
    try {
      if (this.jobs.length === 0) {
        throw new Error('No jobs tracked to export!');
      }

      // Headers matching columns
      const headers = [
        'Job ID', 'Company', 'Role Title', 'Salary Value', 'Currency', 
        'Frequency', 'Platform', 'Custom Platform Name', 'Status', 
        'Date Applied', 'Date Updated', 'Recruiter Name', 
        'Recruiter Email', 'Recruiter LinkedIn', 'Job Listing Link'
      ];

      // Format rows escaping special characters
      const rows = this.jobs.map(j => {
        return [
          j.id,
          j.company,
          j.role,
          j.salary && j.salary.value !== null ? j.salary.value : '',
          j.salary ? j.salary.currency : '',
          j.salary ? j.salary.frequency : '',
          j.platform,
          j.customPlatformName || '',
          j.status,
          j.dateApplied,
          j.dateUpdated,
          j.recruiterName || '',
          j.recruiterEmail || '',
          j.recruiterLinkedin || '',
          j.jobUrl || ''
        ].map(val => {
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        }).join(',');
      });

      const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
      const filename = `JobTracker_Export_${new Date().toISOString().split('T')[0]}.csv`;
      
      const result = await window.api.exportCsvFile(filename, csvContent);
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
