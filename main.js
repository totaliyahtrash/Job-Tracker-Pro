import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// Storage Paths (Electron Standard userData directory)
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'jobs_db.json');
const resumesDirPath = path.join(userDataPath, 'resumes');

// Ensure database and resumes folders exist
if (!fs.existsSync(resumesDirPath)) {
  fs.mkdirSync(resumesDirPath, { recursive: true });
}

// Automatic Data Migration from old app data folder (job-tracker-app) to job-tracker-pro
try {
  const oldUserDataPath = path.join(path.dirname(userDataPath), 'job-tracker-app');
  const oldDbPath = path.join(oldUserDataPath, 'jobs_db.json');
  const oldResumesPath = path.join(oldUserDataPath, 'resumes');

  if (!fs.existsSync(dbPath) && fs.existsSync(oldDbPath)) {
    console.log('Migrating database from job-tracker-app...');
    fs.copyFileSync(oldDbPath, dbPath);
    
    if (fs.existsSync(oldResumesPath)) {
      const files = fs.readdirSync(oldResumesPath);
      files.forEach(file => {
        const src = path.join(oldResumesPath, file);
        const dest = path.join(resumesDirPath, file);
        if (fs.statSync(src).isFile()) {
          fs.copyFileSync(src, dest);
        }
      });
    }
    console.log('Migration completed successfully!');
  }
} catch (err) {
  console.error('Error during data migration:', err);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1250,
    height: 820,
    minWidth: 950,
    minHeight: 650,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'Job Tracker Pro',
    backgroundColor: '#040406', // Pitch-black paint early load
    show: false
  });

  // Hide default electron menu bar
  mainWindow.setMenuBarVisibility(false);

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ==========================================================================
// LOCAL HTTP API SERVER (PORT 4656) FOR CHROME EXTENSION COMMUNICATION
// ==========================================================================
let localServer;

function startLocalServer() {
  localServer = http.createServer((req, res) => {
    // CORS Headers Injection
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // CORS Preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // 1. GET /active-jobs: Fetch currently active applications for linking
    if (req.method === 'GET' && req.url === '/active-jobs') {
      try {
        let dbData = { jobs: [] };
        if (fs.existsSync(dbPath)) {
          dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        }
        
        // Filter jobs in Applied or Interviewing state
        const activeJobs = (dbData.jobs || []).filter(j => 
          j.status === 'Applied' || j.status === 'Interviewing'
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(activeJobs));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // 2. POST /add-job: Log a scraped application from the extension
    if (req.method === 'POST' && req.url === '/add-job') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const newJob = JSON.parse(body);
          if (!newJob.company || !newJob.role) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Company and Role are required' }));
            return;
          }

          // Read database
          let dbData = { jobs: [], resumes: [] };
          if (fs.existsSync(dbPath)) {
            dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
          }

          // Populate default values
          const jobRecord = {
            id: 'job_' + Date.now(),
            company: newJob.company,
            role: newJob.role,
            salary: newJob.salary || { value: null, currency: 'INR', frequency: 'Annual' },
            platform: newJob.platform || 'Custom',
            customPlatformName: newJob.customPlatformName || '',
            status: newJob.status || 'Applied',
            jd: newJob.jd || '',
            resumeId: newJob.resumeId || '',
            jobUrl: newJob.jobUrl || '',
            dateApplied: new Date().toISOString().split('T')[0],
            dateUpdated: new Date().toISOString().split('T')[0],
            recruiterName: newJob.recruiterName || '',
            recruiterEmail: newJob.recruiterEmail || '',
            recruiterLinkedin: newJob.recruiterLinkedin || ''
          };

          dbData.jobs = dbData.jobs || [];
          dbData.jobs.push(jobRecord);
          fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');

          // Notify renderer thread to reload state dynamically
          if (mainWindow) {
            mainWindow.webContents.send('auto-logged-job', jobRecord);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, job: jobRecord }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // 3. POST /add-contact: Link recruiter contact details to an active application
    if (req.method === 'POST' && req.url === '/add-contact') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (!data.jobId || !data.recruiterName) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Job ID and Recruiter Name are required' }));
            return;
          }

          // Read database
          let dbData = { jobs: [] };
          if (fs.existsSync(dbPath)) {
            dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
          }

          const job = (dbData.jobs || []).find(j => j.id === data.jobId);
          if (!job) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Job record not found' }));
            return;
          }

          job.recruiterName = data.recruiterName;
          job.recruiterEmail = data.recruiterEmail || '';
          job.recruiterLinkedin = data.recruiterLinkedin || '';
          job.dateUpdated = new Date().toISOString().split('T')[0];

          fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');

          // Notify renderer thread of changes
          if (mainWindow) {
            mainWindow.webContents.send('linked-recruiter-contact', job);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, job }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // Default 404
    res.writeHead(404);
    res.end();
  });

  localServer.listen(4656, '127.0.0.1', () => {
    console.log('Local Server listening on port 4656 (127.0.0.1)');
  });
}

// ==========================================================================
// ELECTRON APP EVENT HANDLERS
// ==========================================================================
app.whenReady().then(() => {
  startLocalServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (localServer) {
    localServer.close();
  }
});

// ==========================================================================
// IPC CHANNEL BINDERS FOR DATABASE / FILE HANDLING
// ==========================================================================

// 1. Fetch DB Path
ipcMain.handle('get-db-path', () => dbPath);

// 2. Fetch Resumes Directory Path
ipcMain.handle('get-resumes-dir', () => resumesDirPath);

// 3. Open External File (preview PDF, open links)
ipcMain.handle('open-external-file', async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('File does not exist: ' + filePath);
    }
    await shell.openPath(filePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 4. Save Resume PDF (coping file to local database folder)
ipcMain.handle('save-resume-file', async (event, sourcePath, destFilename) => {
  try {
    const destPath = path.join(resumesDirPath, destFilename);
    fs.copyFileSync(sourcePath, destPath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 5. Delete Resume PDF from disk
ipcMain.handle('delete-resume-file', async (event, filename) => {
  try {
    const filePath = path.join(resumesDirPath, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 6. Native Save File dialog for CSV exports
ipcMain.handle('export-csv-file', async (event, defaultName, csvContent) => {
  if (!mainWindow) return { success: false, error: 'App Window unavailable' };
  
  try {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Job Applications',
      defaultPath: path.join(app.getPath('documents'), defaultName),
      filters: [{ name: 'CSV Document', extensions: ['csv'] }]
    });

    if (canceled || !filePath) {
      return { success: false, error: 'Export canceled' };
    }

    fs.writeFileSync(filePath, csvContent, 'utf8');
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 7. Save Database payload to file
ipcMain.handle('save-database', async (event, dbData) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
