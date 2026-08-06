/**
 * POPUP CONTROLLER FOR CHROME EXTENSION
 * Injects content script, populates form panels, and pushes payload to local Electron API server.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Common Elements
  const jobPanel = document.getElementById('job-panel');
  const profilePanel = document.getElementById('profile-panel');
  const statusDiv = document.getElementById('status');
  const brandTitle = document.getElementById('brand-title');
  const modeBadge = document.getElementById('mode-badge');

  // Job Panel Fields
  const companyInput = document.getElementById('company');
  const roleInput = document.getElementById('role');
  const platformInput = document.getElementById('platform');
  const urlInput = document.getElementById('url');
  const jdTextarea = document.getElementById('jd');
  const syncJobBtn = document.getElementById('sync-job-btn');

  // Profile Panel Fields
  const profCompanyInput = document.getElementById('prof-company');
  const profRoleInput = document.getElementById('prof-role');
  const profRecNameInput = document.getElementById('prof-recruiter-name');
  const profRecEmailInput = document.getElementById('prof-recruiter-email');
  const profRecLinkedinInput = document.getElementById('prof-recruiter-linkedin');
  const syncProfileBtn = document.getElementById('sync-profile-btn');

  // Local state holding scraped info
  let scrapedData = null;

  showStatus('Scanning page content...', 'info');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      showStatus('No active browser window detected.', 'error');
      return;
    }

    // Inject scraper script into the active tab
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    if (results && results[0] && results[0].result) {
      scrapedData = results[0].result;

      if (scrapedData.type === 'profile') {
        // Switch to Profile Scraper panel (Cold Outreach logger)
        jobPanel.style.display = 'none';
        profilePanel.style.display = 'block';
        
        modeBadge.textContent = 'Profile Mode';
        modeBadge.style.color = '#10b981';
        modeBadge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        modeBadge.style.background = 'rgba(16, 185, 129, 0.05)';
        brandTitle.textContent = 'Outreach';

        // Prepopulate Recruiter details
        profCompanyInput.value = scrapedData.company || '';
        profRoleInput.value = scrapedData.headline || '';
        profRecNameInput.value = scrapedData.recruiterName || '';
        profRecEmailInput.value = scrapedData.recruiterEmail || '';
        profRecLinkedinInput.value = scrapedData.recruiterLinkedin || '';

        clearStatus();
      } else {
        // Render Job Page panel
        jobPanel.style.display = 'block';
        profilePanel.style.display = 'none';
        
        modeBadge.textContent = 'Job Mode';
        modeBadge.style.color = '#00f2fe';
        modeBadge.style.borderColor = 'rgba(0, 242, 254, 0.3)';
        modeBadge.style.background = 'rgba(0, 242, 254, 0.05)';
        brandTitle.textContent = 'Job Logger';

        // Prepopulate Job details
        companyInput.value = scrapedData.company || '';
        roleInput.value = scrapedData.role || '';
        platformInput.value = scrapedData.platform || 'Custom';
        urlInput.value = scrapedData.url || '';
        jdTextarea.value = scrapedData.jd || '';

        clearStatus();
      }
    } else {
      showStatus('Unable to parse listing details automatically.', 'error');
    }
  } catch (err) {
    console.error('Extension scraper error:', err);
    showStatus('Failed to run page scraper: ' + err.message, 'error');
  }

  // 1. Action: Log Standard Job Application
  syncJobBtn.addEventListener('click', async () => {
    const payload = {
      company: companyInput.value.trim(),
      role: roleInput.value.trim(),
      platform: platformInput.value.trim(),
      jobUrl: urlInput.value.trim(),
      jd: jdTextarea.value.trim(),
      status: 'Applied'
    };

    if (!payload.company || !payload.role) {
      showStatus('Company Name and Role Title are required fields.', 'error');
      return;
    }

    showStatus('Logging to Job Tracker app...', 'info');

    try {
      const response = await fetch('http://127.0.0.1:4656/add-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      
      if (response.ok && result.success) {
        showStatus('🎉 Successfully logged application to Job Tracker!', 'success');
        syncJobBtn.disabled = true;
        syncJobBtn.style.opacity = '0.5';
      } else {
        showStatus('Sync failed: ' + (result.error || 'Server error'), 'error');
      }
    } catch (err) {
      showStatus('Connection failed. Make sure your desktop Job Tracker application is open!', 'error');
    }
  });

  // 2. Action: Log Cold Email Outreach Listing (LinkedIn profile)
  syncProfileBtn.addEventListener('click', async () => {
    const payload = {
      company: profCompanyInput.value.trim(),
      role: profRoleInput.value.trim(),
      platform: 'Cold Email',
      jobUrl: profRecLinkedinInput.value.trim(),
      jd: `Target recruiter profile:\nName: ${profRecNameInput.value.trim()}\nHeadline: ${scrapedData?.headline || ''}\nLinkedIn: ${profRecLinkedinInput.value.trim()}`,
      status: 'Applied',
      recruiterName: profRecNameInput.value.trim(),
      recruiterEmail: profRecEmailInput.value.trim(),
      recruiterLinkedin: profRecLinkedinInput.value.trim()
    };

    if (!payload.company || !payload.role) {
      showStatus('Target Company and Target Role are required fields.', 'error');
      return;
    }

    showStatus('Logging Cold Email Listing...', 'info');

    try {
      const response = await fetch('http://127.0.0.1:4656/add-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      
      if (response.ok && result.success) {
        showStatus('✉️ Cold Email Listing logged! Recruiter contact attached.', 'success');
        syncProfileBtn.disabled = true;
        syncProfileBtn.style.opacity = '0.5';
      } else {
        showStatus('Sync failed: ' + (result.error || 'Server error'), 'error');
      }
    } catch (err) {
      showStatus('Connection failed. Make sure your desktop Job Tracker application is open!', 'error');
    }
  });

  function showStatus(msg, type) {
    statusDiv.textContent = msg;
    statusDiv.style.display = 'block';
    statusDiv.className = `status-msg ${type}`;
  }

  function clearStatus() {
    statusDiv.style.display = 'none';
    statusDiv.textContent = '';
  }
});
