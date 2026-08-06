import { Store } from '../utils/store.js';
import { App } from '../app.js';

export const Resumes = {
  container: null,

  render(container) {
    this.container = container;
    this.draw();
  },

  draw() {
    if (!this.container) return;

    const resumes = Store.getResumes();

    this.container.innerHTML = `
      <div style="animation: slideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; gap: 20px;">
        
        <!-- View Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border-light); padding-bottom: 16px;">
          <div>
            <h2 style="font-family: var(--font-body); font-size:24px; font-weight:800;">Document Vault</h2>
            <p style="color:var(--text-secondary); font-size:13px;">Upload and tag your resume versions to link to applications.</p>
          </div>
        </div>

        <!-- Layout Grid: Left uploader card, right files grid -->
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 24px;">
          
          <!-- LEFT: Uploader Card -->
          <div class="chart-card" style="height: fit-content;">
            <h3 class="card-title">Upload New Resume</h3>
            
            <form id="form-upload-resume" style="display:flex; flex-direction:column; gap:12px;">
              <div id="drop-zone" style="border: 1px dashed var(--border-light); border-radius:var(--border-radius-md); padding: 30px 10px; text-align:center; cursor:pointer; background:rgba(255,255,255,0.005); transition: border-color var(--transition-fast);">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--accent-purple); margin-bottom:8px; display:inline-block;">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <p style="font-size:12px; font-weight:600; color:var(--text-primary);">Click or Drag PDF file here</p>
                <span id="selected-file-label" style="font-family:var(--font-mono); font-size:10px; color:var(--accent-cyan); display:block; margin-top:6px; word-break:break-all;"></span>
                <input type="file" id="resume-file-input" accept=".pdf" style="display:none;" />
              </div>

              <div style="display:flex; flex-direction:column; gap:4px;">
                <label style="font-family:var(--font-mono); font-size:9px; color:var(--text-secondary);">Resume Alias/Name</label>
                <input type="text" id="resume-name-input" class="input-field" placeholder="e.g. Data Analyst CV 2026" style="background:var(--bg-main); border:1px solid var(--border-light); border-radius:4px; padding:8px; color:#fff; font-size:12px; outline:none;" required />
              </div>

              <div style="display:flex; flex-direction:column; gap:4px;">
                <label style="font-family:var(--font-mono); font-size:9px; color:var(--text-secondary);">Metadata Tags (Comma separated)</label>
                <input type="text" id="resume-tags-input" class="input-field" placeholder="e.g. Analytics, SQL, Python" style="background:var(--bg-main); border:1px solid var(--border-light); border-radius:4px; padding:8px; color:#fff; font-size:12px; outline:none;" />
              </div>

              <button type="submit" class="btn-primary" style="width:100%; margin-top:8px;">
                Save PDF to Vault
              </button>
            </form>
          </div>

          <!-- RIGHT: Files Grid -->
          <div style="display:flex; flex-direction:column; gap:14px;">
            <h3 class="card-title" style="margin-bottom:0;">Indexed Documents (${resumes.length} files)</h3>
            
            ${resumes.length === 0 
              ? `
                <div class="chart-card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px; color:var(--text-muted); font-size:13px; text-align:center;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:10px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                  <span>No documents saved in vault yet.</span>
                  <span style="font-family:var(--font-mono); font-size:10px; color:rgba(255,255,255,0.1); margin-top:4px;">&gt; document_vault_empty</span>
                </div>
                `
              : `
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                  ${resumes.map(res => {
                    const tagHtml = res.tags && res.tags.length > 0
                      ? res.tags.map(t => `<span style="font-family:var(--font-mono); font-size:9px; background:rgba(217,70,239,0.05); color:var(--accent-purple); border:1px solid rgba(217,70,239,0.2); padding:2px 6px; border-radius:3px;">${t}</span>`).join(' ')
                      : '';

                    return `
                      <div class="chart-card" style="display:flex; flex-direction:column; justify-content:space-between; gap:12px; min-height:140px;">
                        <div>
                          <div style="display:flex; align-items:flex-start; gap:8px; margin-bottom:8px;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--accent-purple); flex-shrink:0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                            <div style="overflow:hidden;">
                              <h4 style="font-size:14px; font-weight:700; color:var(--text-primary); text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">${res.name}</h4>
                              <span style="font-family:var(--font-mono); font-size:10px; color:var(--text-muted); word-break:break-all;">${res.originalName}</span>
                            </div>
                          </div>
                          <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:8px;">
                            ${tagHtml}
                          </div>
                        </div>

                        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-light); padding-top:10px; margin-top:10px;">
                          <span style="font-family:var(--font-mono); font-size:10px; color:var(--text-muted);">Uploaded: ${res.dateUploaded}</span>
                          <div style="display:flex; gap:6px;">
                            <button class="platform-tag btn-view-pdf" data-filename="${res.filename}" style="color:var(--accent-cyan); border-color:rgba(0,242,254,0.3); background:rgba(0,242,254,0.02); cursor:pointer;">View</button>
                            <button class="platform-tag btn-delete-pdf" data-resume-id="${res.id}" style="color:var(--accent-rose); border-color:rgba(244,63,94,0.3); background:rgba(244,63,94,0.02); cursor:pointer;">Delete</button>
                          </div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `
            }
          </div>

        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('resume-file-input');
    const selectedLabel = document.getElementById('selected-file-label');
    const uploadForm = document.getElementById('form-upload-resume');

    if (dropZone && fileInput && selectedLabel) {
      dropZone.addEventListener('click', () => fileInput.click());
      
      fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
          selectedLabel.textContent = fileInput.files[0].name;
          const nameInput = document.getElementById('resume-name-input');
          if (nameInput && !nameInput.value) {
            nameInput.value = fileInput.files[0].name.split('.')[0];
          }
        }
      });

      // Drag and drop event handlers
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--accent-cyan)';
      });

      dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = 'var(--border-light)';
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border-light)';
        if (e.dataTransfer.files.length > 0) {
          fileInput.files = e.dataTransfer.files;
          selectedLabel.textContent = fileInput.files[0].name;
          const nameInput = document.getElementById('resume-name-input');
          if (nameInput && !nameInput.value) {
            nameInput.value = fileInput.files[0].name.split('.')[0];
          }
        }
      });
    }

    if (uploadForm) {
      uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!fileInput.files || fileInput.files.length === 0) {
          App.showToast('Please select a PDF file first.', 'error');
          return;
        }

        const file = fileInput.files[0];
        const sourcePath = file.path;
        if (!sourcePath) {
          App.showToast('Failed to read local file path.', 'error');
          return;
        }

        const name = document.getElementById('resume-name-input').value.trim();
        const tagsStr = document.getElementById('resume-tags-input').value.trim();
        const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0) : [];

        App.showToast('Uploading PDF to database...', 'info');
        
        const destFilename = `${name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        
        // Copy file physically
        const copyResult = await window.api.saveResumeFile(sourcePath, destFilename);
        if (!copyResult.success) {
          App.showToast('Upload failed: ' + copyResult.error, 'error');
          return;
        }

        // Add to Store
        const resume = await Store.addResume({
          name,
          filename: destFilename,
          originalName: file.name,
          tags
        });

        if (resume) {
          App.showToast(`Resume "${name}" successfully indexed!`, 'success');
          this.draw();
        } else {
          App.showToast('Failed to save metadata to store.', 'error');
        }
      });
    }

    // View file
    const viewButtons = this.container.querySelectorAll('.btn-view-pdf');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const filename = btn.getAttribute('data-filename');
        App.showToast('Opening PDF file...', 'info');
        const ret = await window.api.openExternalFile(await window.api.getResumesDir() + '/' + filename);
        if (!ret.success) {
          App.showToast('Failed to open PDF resume: ' + ret.error, 'error');
        }
      });
    });

    // Delete file
    const deleteButtons = this.container.querySelectorAll('.btn-delete-pdf');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-resume-id');
        this.confirmDeleteResume(id);
      });
    });
  },

  confirmDeleteResume(id) {
    App.showModal(
      'Delete Document',
      '<p style="line-height:1.5; color:var(--text-primary);">Are you sure you want to permanently delete this resume from the vault? This will also unlink it from any applications.</p>',
      async () => {
        const success = await Store.deleteResume(id);
        if (success) {
          App.hideModal();
          App.showToast('Deleted document and cleared references.', 'info');
          this.draw();
        } else {
          App.showToast('Failed to delete resume.', 'error');
        }
      },
      'Delete Document'
    );
  }
};
