const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getDbPath: () => ipcRenderer.invoke('get-db-path'),
  getResumesDir: () => ipcRenderer.invoke('get-resumes-dir'),
  openExternalFile: (filePath) => ipcRenderer.invoke('open-external-file', filePath),
  saveResumeFile: (sourcePath, destFilename) => ipcRenderer.invoke('save-resume-file', sourcePath, destFilename),
  deleteResumeFile: (filename) => ipcRenderer.invoke('delete-resume-file', filename),
  exportCsvFile: (defaultName, csvContent) => ipcRenderer.invoke('export-csv-file', defaultName, csvContent),
  saveDatabase: (dbData) => ipcRenderer.invoke('save-database', dbData),
  
  // Real-time Event listeners
  onAutoLoggedJob: (callback) => {
    const listener = (event, job) => callback(job);
    ipcRenderer.on('auto-logged-job', listener);
    return () => ipcRenderer.removeListener('auto-logged-job', listener);
  },
  onLinkRecruiterContact: (callback) => {
    const listener = (event, job) => callback(job);
    ipcRenderer.on('linked-recruiter-contact', listener);
    return () => ipcRenderer.removeListener('linked-recruiter-contact', listener);
  }
});
