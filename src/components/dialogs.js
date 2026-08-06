/**
 * DIALOGS HTML FACTORY
 * Generates custom HTML form modals for adding, editing, and inspecting jobs.
 */

export const Dialogs = {
  getJobFormHtml(job = null, resumes = []) {
    // Default values if adding a new job
    const data = job || {
      company: '',
      role: '',
      status: 'Applied',
      platform: 'LinkedIn',
      customPlatformName: '',
      jobUrl: '',
      jd: '',
      resumeId: '',
      dateApplied: new Date().toISOString().split('T')[0],
      salary: { value: '', currency: 'INR', frequency: 'Annual' },
      recruiterName: '',
      recruiterEmail: '',
      recruiterLinkedin: ''
    };

    const isEdit = !!job;
    const isCustomPlat = data.platform === 'Custom';

    // Populate resume dropdown select options
    const resumeOptions = resumes.map(r => `
      <option value="${r.id}" ${r.id === data.resumeId ? 'selected' : ''}>${r.name} (${r.originalName})</option>
    `).join('');

    return `
      <div style="font-family: var(--font-body); display:flex; flex-direction:column; gap:14px; max-height: 70vh; padding-right: 4px;">
        
        <!-- Primary row: Company and Role -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-family:var(--font-mono); font-size:9px; color:var(--text-secondary); text-transform:uppercase;">Company Name *</label>
            <input type="text" id="form-company" class="input-field" value="${data.company}" placeholder="e.g. Google" style="background:#13141f; border:1px solid var(--border-light); border-radius:4px; padding:8px 10px; color:#fff; font-size:12px; outline:none;" required />
          </div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-family:var(--font-mono); font-size:9px; color:var(--text-secondary); text-transform:uppercase;">Role Title *</label>
            <input type="text" id="form-role" class="input-field" value="${data.role}" placeholder="e.g. Software Engineer" style="background:#13141f; border:1px solid var(--border-light); border-radius:4px; padding:8px 10px; color:#fff; font-size:12px; outline:none;" required />
          </div>
        </div>

        <!-- Secondary row: Status and Platform -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-family:var(--font-mono); font-size:9px; color:var(--text-secondary); text-transform:uppercase;">Status Stage</label>
            <select id="form-status" style="background:#13141f; border:1px solid var(--border-light); border-radius:4px; padding:8px 10px; color:#fff; font-size:12px; outline:none; cursor:pointer;">
              <option value="Wishlist" ${data.status === 'Wishlist' ? 'selected' : ''}>Wishlist</option>
              <option value="Applied" ${data.status === 'Applied' ? 'selected' : ''}>Applied</option>
              <option value="Interviewing" ${data.status === 'Interviewing' ? 'selected' : ''}>Interviewing</option>
              <option value="Offered" ${data.status === 'Offered' ? 'selected' : ''}>Offered</option>
              <option value="Ghosted" ${data.status === 'Ghosted' ? 'selected' : ''}>Ghosted / Stagnant</option>
              <option value="Rejected" ${data.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
            </select>
          </div>

          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-family:var(--font-mono); font-size:9px; color:var(--text-secondary); text-transform:uppercase;">Application Platform</label>
            <select id="form-platform" style="background:#13141f; border:1px solid var(--border-light); border-radius:4px; padding:8px 10px; color:#fff; font-size:12px; outline:none; cursor:pointer;">
              <option value="LinkedIn" ${data.platform === 'LinkedIn' ? 'selected' : ''}>LinkedIn</option>
              <option value="Naukri" ${data.platform === 'Naukri' ? 'selected' : ''}>Naukri</option>
              <option value="Glassdoor" ${data.platform === 'Glassdoor' ? 'selected' : ''}>Glassdoor</option>
              <option value="Cold Email" ${data.platform === 'Cold Email' ? 'selected' : ''}>Cold Email</option>
              <option value="Custom" ${data.platform === 'Custom' ? 'selected' : ''}>Custom Platform</option>
            </select>
          </div>
        </div>

        <!-- Custom Platform Text input -->
        <div id="custom-platform-container" style="display: ${isCustomPlat ? 'block' : 'none'}; flex-direction:column; gap:4px;">
          <label style="font-family:var(--font-mono); font-size:9px; color:var(--text-secondary); text-transform:uppercase;">Custom Platform Name</label>
          <input type="text" id="form-custom-platform" class="input-field" value="${data.customPlatformName}" placeholder="e.g. Careers Page" style="background:#13141f; border:1px solid var(--border-light); border-radius:4px; padding:8px; color:#fff; font-size:12px; outline:none;" />
        </div>

        <!-- Link and date -->
        <div style="display:grid; grid-template-columns: 1.4fr 1fr; gap:12px;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-family:var(--font-mono); font-size:9px; color:var(--text-secondary); text-transform:uppercase;">Listing URL</label>
            <input type="url" id="form-job-url" class="input-field" value="${data.jobUrl}" placeholder="e.g. https://careers.company.com/..." style="background:#13141f; border:1px solid var(--border-light); border-radius:4px; padding:8px; color:#fff; font-size:12px; outline:none;" />
          </div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-family:var(--font-mono); font-size:9px; color:var(--text-secondary); text-transform:uppercase;">Date Applied</label>
            <input type="date" id="form-date-applied" class="input-field" value="${data.dateApplied}" style="background:#13141f; border:1px solid var(--border-light); border-radius:4px; padding:8px; color:#fff; font-size:12px; outline:none; font-family:var(--font-mono);" />
          </div>
        </div>

        <!-- Salary components -->
        <div style="display:flex; flex-direction:column; gap:4px;">
          <label style="font-family:var(--font-mono); font-size:9px; color:var(--text-secondary); text-transform:uppercase;">Compensation Package</label>
          <div style="display:flex; gap:8px;">
            <input type="number" id="form-salary-val" value="${data.salary ? data.salary.value : ''}" placeholder="e.g. 1200000" style="flex-grow:1; background:#13141f; border:1px solid var(--border-light); border-radius:4px; padding:8px; color:#fff; font-size:12px; outline:none;" />
            <select id="form-salary-curr" style="background:#13141f; border:1px solid var(--border-light); border-radius:4px; padding:8px; color:#fff; font-size:12px; outline:none; cursor:pointer;">
              <option value="INR" ${data.salary && data.salary.currency === 'INR' ? 'selected' : ''}>INR (₹)</option>
              <option value="USD" ${data.salary && data.salary.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
              <option value="EUR" ${data.salary && data.salary.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
              <option value="GBP" ${data.salary && data.salary.currency === 'GBP' ? 'selected' : ''}>GBP (£)</option>
            </select>
            <select id="form-salary-freq" style="background:#13141f; border:1px solid var(--border-light); border-radius:4px; padding:8px; color:#fff; font-size:12px; outline:none; cursor:pointer;">
              <option value="Annual" ${data.salary && data.salary.frequency === 'Annual' ? 'selected' : ''}>Annual</option>
              <option value="Monthly" ${data.salary && data.salary.frequency === 'Monthly' ? 'selected' : ''}>Monthly</option>
            </select>
          </div>
        </div>

        <!-- Shared Resume dropdown & Direct PDF File Upload -->
        <div style="display:grid; grid-template-columns: 1.4fr 1fr; gap:12px; align-items:flex-end;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-family:var(--font-mono); font-size:9px; color:var(--text-secondary); text-transform:uppercase;">Vault Resume Link</label>
            <select id="form-resume" style="background:#13141f; border:1px solid var(--border-light); border-radius:4px; padding:8px 10px; color:#fff; font-size:12px; outline:none; cursor:pointer; width:100%;">
              <option value="">-- No Resume Linked --</option>
              ${resumeOptions}
            </select>
          </div>

          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-family:var(--font-mono); font-size:9px; color:var(--text-secondary); text-transform:uppercase;">Or Upload PDF Direct</label>
            <button type="button" id="btn-form-direct-resume" class="btn-secondary" style="width:100%; display:flex; align-items:center; justify-content:center; gap:6px; font-size:11px; padding:8.5px;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Select File
            </button>
            <input type="file" id="form-direct-resume-file" accept=".pdf" style="display:none;" />
            <span id="form-direct-resume-name" style="font-family:var(--font-mono); font-size:9px; color:var(--accent-cyan); display:block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width: 140px; margin-top:2px;"></span>
          </div>
        </div>

        <!-- Recruiter Contact Fields (Apollo support) -->
        <div style="border-top:1px solid var(--border-light); padding-top:12px; display:flex; flex-direction:column; gap:10px;">
          <h4 style="font-family:var(--font-mono); font-size:9.5px; text-transform:uppercase; color:var(--text-secondary); letter-spacing:0.5px;">// Recruiter Contact Details (Apollo)</h4>
          
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
            <div style="display:flex; flex-direction:column; gap:4px;">
              <label style="font-family:var(--font-mono); font-size:9px; color:var(--text-secondary);">Recruiter Name</label>
              <input type="text" id="form-recruiter-name" class="input-field" value="${data.recruiterName}" placeholder="e.g. Sarah Jenkins" style="background:#13141f; border:1px solid var(--border-light); border-radius:4px; padding:8px; color:#fff; font-size:12px; outline:none;" />
            </div>
            <div style="display:flex; flex-direction:column; gap:4px;">
              <label style="font-family:var(--font-mono); font-size:9px; color:var(--text-secondary);">Recruiter Email</label>
              <input type="email" id="form-recruiter-email" class="input-field" value="${data.recruiterEmail}" placeholder="e.g. s.jenkins@google.com" style="background:#13141f; border:1px solid var(--border-light); border-radius:4px; padding:8px; color:#fff; font-size:12px; outline:none;" />
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-family:var(--font-mono); font-size:9px; color:var(--text-secondary);">Recruiter LinkedIn Link</label>
            <input type="url" id="form-recruiter-linkedin" class="input-field" value="${data.recruiterLinkedin}" placeholder="e.g. https://www.linkedin.com/in/sarah-jenkins/" style="background:#13141f; border:1px solid var(--border-light); border-radius:4px; padding:8px; color:#fff; font-size:12px; outline:none;" />
          </div>
        </div>

        <!-- Job Description (JD) text block -->
        <div style="display:flex; flex-direction:column; gap:4px;">
          <label style="font-family:var(--font-mono); font-size:9px; color:var(--text-secondary); text-transform:uppercase;">Job Description (JD)</label>
          <textarea id="form-jd" class="input-field" placeholder="Paste the JD text specifications here..." style="background:#13141f; border:1px solid var(--border-light); border-radius:4px; padding:8px 10px; color:#fff; font-size:12px; outline:none; min-height: 80px; font-family:var(--font-mono); line-height:1.4;">${data.jd}</textarea>
        </div>

      </div>
    `;
  }
};
