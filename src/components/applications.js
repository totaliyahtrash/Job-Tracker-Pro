import { Store } from '../utils/store.js';
import { App } from '../app.js';
import { Dialogs } from './dialogs.js';

export const Applications = {
  container: null,
  activeStatus: 'Applied',
  selectedJobId: null,

  render(container) {
    this.container = container;
    this.draw();
  },

  draw() {
    if (!this.container) return;

    const jobs = Store.getJobs();
    const resumes = Store.getResumes();

    // 1. Get filtered list matching selected timeline node
    const filteredJobs = jobs.filter(j => j.status === this.activeStatus);

    // If selected job is not in the active filtered list, select the first one
    if (filteredJobs.length > 0) {
      const exists = filteredJobs.some(j => j.id === this.selectedJobId);
      if (!exists) this.selectedJobId = filteredJobs[0].id;
    } else {
      this.selectedJobId = null;
    }

    const selectedJob = jobs.find(j => j.id === this.selectedJobId);

    // Calculate node counts for horizontal timeline
    const counts = {
      Wishlist: jobs.filter(j => j.status === 'Wishlist').length,
      Applied: jobs.filter(j => j.status === 'Applied').length,
      Interviewing: jobs.filter(j => j.status === 'Interviewing').length,
      Offered: jobs.filter(j => j.status === 'Offered').length,
      Ghosted: jobs.filter(j => j.status === 'Ghosted' || j.status === 'Rejected').length
    };

    this.container.innerHTML = `
      <div class="pipeline-timeline-wrapper" style="animation: slideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);">
        
        <!-- Header Actions -->
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h2 style="font-family: var(--font-body); font-size:24px; font-weight:800;">Pipeline Timeline</h2>
            <p style="color:var(--text-secondary); font-size:13px;">Manage application flow stages and recruiter outreach targets.</p>
          </div>
          <button class="btn-primary" id="btn-add-application">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 4px; display:inline-block; vertical-align:middle;">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span style="vertical-align:middle;">Add new application</span>
          </button>
        </div>

        <!-- Horizontal Stage Flow Timeline Bar -->
        <div class="timeline-bar-container">
          <div class="timeline-line"></div>
          
          <button class="timeline-node ${this.activeStatus === 'Wishlist' ? 'active' : ''}" data-status="Wishlist">
            <div class="timeline-node-circle">${counts.Wishlist}</div>
            <span class="timeline-node-label">Wishlist</span>
          </button>

          <button class="timeline-node ${this.activeStatus === 'Applied' ? 'active' : ''}" data-status="Applied">
            <div class="timeline-node-circle">${counts.Applied}</div>
            <span class="timeline-node-label">Applied</span>
          </button>

          <button class="timeline-node ${this.activeStatus === 'Interviewing' ? 'active' : ''}" data-status="Interviewing">
            <div class="timeline-node-circle">${counts.Interviewing}</div>
            <span class="timeline-node-label">Interviewing</span>
          </button>

          <button class="timeline-node ${this.activeStatus === 'Offered' ? 'active' : ''}" data-status="Offered">
            <div class="timeline-node-circle">${counts.Offered}</div>
            <span class="timeline-node-label">Offered</span>
          </button>

          <button class="timeline-node ${this.activeStatus === 'Ghosted' ? 'active' : ''}" data-status="Ghosted">
            <div class="timeline-node-circle">${counts.Ghosted}</div>
            <span class="timeline-node-label">Archived / Ghosted</span>
          </button>
        </div>

        <!-- Bottom Split Console Workspace -->
        <div class="split-deck-area">
          
          <!-- LEFT COLUMN: Tech list of jobs -->
          <div class="deck-column-left">
            <h3 class="card-title" style="margin-bottom: 12px; font-family: var(--font-mono); font-size:10px; color:var(--text-secondary);">
              // Applications list - ${this.activeStatus} (${filteredJobs.length} records)
            </h3>
            
            <div class="tech-table-container">
              ${filteredJobs.length === 0 
                ? `
                  <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); font-size:13px; gap:8px;">
                    <span>No applications tracked in this stage.</span>
                    <span style="font-size:11px; font-family:var(--font-mono); color:rgba(255,255,255,0.1);">&gt; empty_timeline_stage_signal</span>
                  </div>
                  ` 
                : `
                  <table class="tech-table">
                    <thead>
                      <tr>
                        <th>Company & Role</th>
                        <th>Platform</th>
                        <th>Salary Pack</th>
                        <th style="text-align:right;">Date Applied</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${filteredJobs.map(job => {
                        const salaryStr = job.salary && job.salary.value 
                          ? this.formatSalarySymbol(job.salary) 
                          : '—';
                        const isSelected = job.id === this.selectedJobId;
                        const platName = job.platform === 'Custom' ? (job.customPlatformName || 'Custom') : job.platform;
                        const platClass = job.platform.toLowerCase().replace(' ', '_');

                        return `
                          <tr class="job-row-item ${isSelected ? 'selected' : ''}" data-job-id="${job.id}">
                            <td>
                              <span class="text-role">${job.role}</span>
                              <span class="text-company">${job.company}</span>
                            </td>
                            <td>
                              <span class="platform-tag ${platClass}">${platName}</span>
                            </td>
                            <td>
                              <span style="font-family: var(--font-mono); font-size:11px;">${salaryStr}</span>
                            </td>
                            <td style="text-align:right; font-family: var(--font-mono); font-size:11px; color:var(--text-secondary);">
                              ${job.dateApplied}
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                `
              }
            </div>
          </div>

          <!-- RIGHT COLUMN: Detail Drawer Inspector -->
          <div class="deck-column-right">
            ${selectedJob 
              ? this.renderDetailsDrawer(selectedJob, resumes)
              : `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); font-size:13px; gap:6px; font-family: var(--font-mono);">
                  <span>&gt; inspect_telemetry_idle</span>
                  <span style="font-size:11px; color:rgba(255,255,255,0.15)">Select an application entry to view detailed logs</span>
                </div>
                `
            }
          </div>
        </div>

      </div>
    `;

    // Bind Event Listeners
    this.bindEvents();
  },

  renderDetailsDrawer(job, resumes) {
    const hasResume = !!job.resumeId;
    const attachedResume = hasResume ? resumes.find(r => r.id === job.resumeId) : null;
    const salaryStr = job.salary && job.salary.value 
      ? this.formatSalarySymbol(job.salary) 
      : 'No salary set';

    return `
      <!-- Drawer Header -->
      <div class="drawer-header">
        <span class="drawer-company">${job.company}</span>
        <h3 class="drawer-role">${job.role}</h3>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
          <span style="font-family: var(--font-mono); font-size:11px; color:var(--accent-cyan);">${salaryStr}</span>
          <span style="font-family: var(--font-mono); font-size:10px; color:var(--text-muted);">Applied: ${job.dateApplied}</span>
        </div>
      </div>

      <!-- Recruiter Outreach Section (Apollo support) -->
      <div>
        <h4 class="drawer-section-title">// Hiring Contact (Apollo Telemetry)</h4>
        <div class="drawer-contact-card">
          ${job.recruiterName || job.recruiterEmail || job.recruiterLinkedin
            ? `
              <div style="display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:13px; font-weight:600; color:var(--text-primary);">${job.recruiterName || 'Unnamed Contact'}</span>
                  ${job.recruiterLinkedin 
                    ? `<a href="#" class="btn-open-linkedin" data-url="${job.recruiterLinkedin}" style="color:var(--accent-cyan); display:flex; align-items:center; gap:3px; text-decoration:none; font-size:11px;">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>LinkedIn
                       </a>` 
                    : ''}
                </div>
                ${job.recruiterEmail 
                  ? `
                    <div style="display:flex; flex-direction:column; gap:4px; margin-top:4px;">
                      <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-secondary); word-break:break-all;">${job.recruiterEmail}</span>
                      <a href="mailto:${job.recruiterEmail}?subject=Application Status: ${job.role} - ${job.company}" class="btn-primary" style="text-align:center; padding: 6px; border-radius:4px; font-size:10px; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:4px; margin-top:4px;">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        Send Cold Email
                      </a>
                    </div>
                    ` 
                  : '<span style="font-size:11px; color:var(--text-muted);">No email parsed. Unlock via Apollo LinkedIn extension popup.</span>'}
              </div>
              `
            : `<span style="font-size:11px; color:var(--text-muted); font-style:italic;">No hiring contact linked to this outreach listing.</span>`
          }
        </div>
      </div>

      <!-- Resumes Vault Section -->
      <div>
        <h4 class="drawer-section-title">// Shared Document Vault</h4>
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.01); border:1px solid var(--border-light); padding:10px 14px; border-radius:var(--border-radius-md);">
          <div style="display:flex; align-items:center; gap:8px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--accent-purple);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <span style="font-size:12px; color:var(--text-primary); font-weight:500;">
              ${attachedResume ? attachedResume.name : 'No resume attached'}
            </span>
          </div>
          ${attachedResume 
            ? `<button class="platform-tag btn-view-resume" data-filename="${attachedResume.filename}" style="cursor:pointer; color:var(--accent-cyan); border-color:rgba(0,242,254,0.3); background:rgba(0,242,254,0.02);">View</button>`
            : ''
          }
        </div>
      </div>

      <!-- Job Description Scrollable Block -->
      <div style="flex-grow:1; display:flex; flex-direction:column; overflow:hidden;">
        <h4 class="drawer-section-title">// Job Description (JD)</h4>
        <div style="flex-grow:1; overflow-y:auto; font-family:var(--font-mono); font-size:11px; color:var(--text-secondary); line-height:1.5; background:#08090d; border:1px solid var(--border-light); padding:12px; border-radius:var(--border-radius-md); white-space:pre-wrap; word-break:break-word;">
          ${job.jd || 'No JD details logged. Paste the JD inside edit options to save details.'}
        </div>
      </div>

      <!-- Drawer Actions Row -->
      <div style="display:flex; gap:8px; border-top:1px solid var(--border-light); padding-top:14px; margin-top:auto;">
        <button class="btn-secondary btn-edit-application" data-job-id="${job.id}" style="flex-grow:1;">
          Edit Details
        </button>
        <button class="btn-danger btn-delete-application" data-job-id="${job.id}" style="flex-shrink:0;">
          Delete Record
        </button>
      </div>
    `;
  },

  bindEvents() {
    // 1. Timeline node tabs switching
    const nodes = this.container.querySelectorAll('.timeline-node');
    nodes.forEach(node => {
      node.addEventListener('click', (e) => {
        const targetNode = e.currentTarget;
        this.activeStatus = targetNode.getAttribute('data-status');
        this.draw();
      });
    });

    // 2. Table row selection
    const rows = this.container.querySelectorAll('.job-row-item');
    rows.forEach(row => {
      row.addEventListener('click', () => {
        this.selectedJobId = row.getAttribute('data-job-id');
        this.draw();
      });
    });

    // 3. Add Application Dialog launcher
    const addBtn = document.getElementById('btn-add-application');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openAddJobModal());
    }

    // 4. Edit Application Dialog launcher
    const editBtn = this.container.querySelector('.btn-edit-application');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        const jobId = editBtn.getAttribute('data-job-id');
        this.openEditJobModal(jobId);
      });
    }

    // 5. Delete Application action
    const deleteBtn = this.container.querySelector('.btn-delete-application');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        const jobId = deleteBtn.getAttribute('data-job-id');
        this.confirmDeleteJob(jobId);
      });
    }

    // 6. View Attached Resume action
    const viewResumeBtn = this.container.querySelector('.btn-view-resume');
    if (viewResumeBtn) {
      viewResumeBtn.addEventListener('click', async () => {
        const filename = viewResumeBtn.getAttribute('data-filename');
        App.showToast('Opening attached PDF resume...', 'info');
        const ret = await window.api.openExternalFile(await window.api.getResumesDir() + '/' + filename);
        if (!ret.success) {
          App.showToast('Failed to open PDF resume: ' + ret.error, 'error');
        }
      });
    }

    // 7. Open Recruiter LinkedIn link external
    const openLinkedinBtn = this.container.querySelector('.btn-open-linkedin');
    if (openLinkedinBtn) {
      openLinkedinBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const url = openLinkedinBtn.getAttribute('data-url');
        shell.openExternal(url); // Opens default system browser
      });
    }
  },

  openAddJobModal() {
    const resumes = Store.getResumes();
    const formHtml = Dialogs.getJobFormHtml(null, resumes);
    
    App.showModal(
      'Log New Pipeline Application',
      formHtml,
      async () => {
        const formData = this.parseJobForm();
        if (!formData) return; // Validation failed

        App.showToast('Saving listing...', 'info');
        const directResumeId = await this.handleDirectResumeUpload();
        if (directResumeId) {
          formData.resumeId = directResumeId;
        }

        const job = await Store.addJob(formData);
        if (job) {
          App.hideModal();
          App.showToast(`Logged outreach card for ${job.company}.`, 'success');
          this.draw();
        } else {
          App.showToast('Failed to save listing.', 'error');
        }
      },
      'Log Application'
    );

    this.bindJobFormToggles();
  },

  openEditJobModal(jobId) {
    const jobs = Store.getJobs();
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    const resumes = Store.getResumes();
    const formHtml = Dialogs.getJobFormHtml(job, resumes);

    App.showModal(
      `Edit application: ${job.company}`,
      formHtml,
      async () => {
        const formData = this.parseJobForm();
        if (!formData) return;

        App.showToast('Saving updates...', 'info');
        const directResumeId = await this.handleDirectResumeUpload();
        if (directResumeId) {
          formData.resumeId = directResumeId;
        }

        const updated = await Store.updateJob(jobId, formData);
        if (updated) {
          App.hideModal();
          App.showToast(`Updated details for ${updated.company}.`, 'success');
          this.draw();
        } else {
          App.showToast('Failed to save updates.', 'error');
        }
      },
      'Save Changes'
    );

    this.bindJobFormToggles();
  },

  confirmDeleteJob(jobId) {
    const jobs = Store.getJobs();
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    App.showModal(
      'Confirm Deletion',
      `<p style="line-height:1.5; color:var(--text-primary);">Are you sure you want to permanently delete the application record for <strong>${job.role}</strong> at <strong>${job.company}</strong>?</p>`,
      async () => {
        const success = await Store.deleteJob(jobId);
        if (success) {
          App.hideModal();
          App.showToast(`Deleted ${job.company} record.`, 'info');
          this.selectedJobId = null;
          this.draw();
        } else {
          App.showToast('Failed to delete record.', 'error');
        }
      },
      'Delete Application'
    );
  },

  parseJobForm() {
    const company = document.getElementById('form-company').value.trim();
    const role = document.getElementById('form-role').value.trim();
    
    if (!company || !role) {
      App.showToast('Company Name and Role Title are required.', 'error');
      return null;
    }

    const value = document.getElementById('form-salary-val').value;
    const currency = document.getElementById('form-salary-curr').value;
    const frequency = document.getElementById('form-salary-freq').value;
    const status = document.getElementById('form-status').value;
    const platform = document.getElementById('form-platform').value;
    const customPlatformName = document.getElementById('form-custom-platform')?.value || '';
    const jobUrl = document.getElementById('form-job-url').value.trim();
    const resumeId = document.getElementById('form-resume').value;
    const jd = document.getElementById('form-jd').value;
    const dateApplied = document.getElementById('form-date-applied').value;
    const recruiterName = document.getElementById('form-recruiter-name').value.trim();
    const recruiterEmail = document.getElementById('form-recruiter-email').value.trim();
    const recruiterLinkedin = document.getElementById('form-recruiter-linkedin').value.trim();

    return {
      company,
      role,
      salary: { value, currency, frequency },
      status,
      platform,
      customPlatformName,
      jobUrl,
      resumeId,
      jd,
      dateApplied,
      recruiterName,
      recruiterEmail,
      recruiterLinkedin
    };
  },

  bindJobFormToggles() {
    const platSelect = document.getElementById('form-platform');
    const customContainer = document.getElementById('custom-platform-container');
    
    if (platSelect && customContainer) {
      platSelect.addEventListener('change', (e) => {
        if (e.target.value === 'Custom') {
          customContainer.style.display = 'block';
          document.getElementById('form-custom-platform').setAttribute('required', 'true');
        } else {
          customContainer.style.display = 'none';
          document.getElementById('form-custom-platform').removeAttribute('required');
        }
      });
    }

    // Direct resume PDF uploader trigger
    const uploadBtn = document.getElementById('btn-form-direct-resume');
    const fileInput = document.getElementById('form-direct-resume-file');
    const filenameLabel = document.getElementById('form-direct-resume-name');
    const resumeSelect = document.getElementById('form-resume');

    if (uploadBtn && fileInput && filenameLabel) {
      uploadBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
          const file = fileInput.files[0];
          filenameLabel.textContent = file.name;
          
          // Clear select dropdown selection since we have a direct file
          if (resumeSelect) resumeSelect.value = '';
        }
      });
    }
  },

  async handleDirectResumeUpload() {
    const fileInput = document.getElementById('form-direct-resume-file');
    if (!fileInput || fileInput.files.length === 0) return null;

    const file = fileInput.files[0];
    const sourcePath = file.path;
    if (!sourcePath) return null;

    const destFilename = `${file.name.split('.')[0]}_${Date.now()}.pdf`;
    
    // Copy file to resumes folder
    const copyResult = await window.api.saveResumeFile(sourcePath, destFilename);
    if (!copyResult.success) {
      App.showToast('Failed to upload PDF file: ' + copyResult.error, 'error');
      return null;
    }

    // Add to Store resumes list
    const resume = await Store.addResume({
      name: file.name.split('.')[0],
      filename: destFilename,
      originalName: file.name,
      tags: ['Direct Upload']
    });

    return resume ? resume.id : null;
  },

  formatSalarySymbol(salary) {
    const val = parseFloat(salary.value);
    if (isNaN(val)) return '';

    const symbols = {
      USD: '$', INR: '₹', EUR: '€', GBP: '£', CAD: 'CA$', SGD: 'S$', AUD: 'A$'
    };
    const sym = symbols[salary.currency] || salary.currency;
    const valStr = val.toLocaleString(undefined, { maximumFractionDigits: 0 });
    
    return `${sym}${valStr} ${salary.frequency === 'Annual' ? '/yr' : '/mo'}`;
  }
};
