import { Store } from './utils/store.js';
import { Dashboard } from './components/dashboard.js';
import { Applications } from './components/applications.js';
import { Resumes } from './components/resumes.js';

export const App = {
  currentView: 'dashboard',
  modalResolve: null,

  async init() {
    console.log('App starting...');

    // 1. Initialize Store
    await Store.init();

    // 2. Setup Top Nav Listeners
    this.setupNavigation();

    // 3. Setup Clock
    this.startClock();

    // 4. Setup Modals close
    document.getElementById('modal-close-btn').addEventListener('click', () => this.hideModal());
    document.getElementById('btn-modal-cancel').addEventListener('click', () => this.hideModal());

    // 5. Connect Realtime IPC listeners from Chrome Extension server
    if (window.api) {
      window.api.onAutoLoggedJob((job) => {
        this.showToast(`Scraped Application logged for: ${job.company}`, 'success');
        Store.init(); // Refresh store data
      });

      window.api.onLinkRecruiterContact((job) => {
        this.showToast(`Recruiter linked to: ${job.company}`, 'success');
        Store.init(); // Refresh store data
      });
    }

    // 6. Navigate to initial default view
    this.navigateTo(this.currentView);
  },

  setupNavigation() {
    const tabs = document.querySelectorAll('.nav-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const viewName = e.target.getAttribute('data-view');
        
        // Update active tab buttons
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        this.navigateTo(viewName);
      });
    });
  },

  navigateTo(viewName) {
    this.currentView = viewName;
    const workspace = document.getElementById('main-workspace');
    if (!workspace) return;

    // Clear and draw matching component
    workspace.innerHTML = '';
    
    if (viewName === 'dashboard') {
      Dashboard.render(workspace);
    } else if (viewName === 'applications') {
      Applications.render(workspace);
    } else if (viewName === 'resumes') {
      Resumes.render(workspace);
    }
  },

  startClock() {
    const clockEl = document.getElementById('system-time-clock');
    if (!clockEl) return;

    const updateClock = () => {
      const timeStr = new Date().toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      clockEl.textContent = timeStr;
    };

    updateClock();
    setInterval(updateClock, 1000);
  },

  // Global UI Modal Handler
  showModal(title, bodyHtml, onSubmit = null, submitLabel = 'Save Changes') {
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const submitBtn = document.getElementById('btn-modal-submit');

    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;
    overlay.classList.add('active');

    // Bind submit
    if (onSubmit) {
      submitBtn.style.display = 'block';
      submitBtn.textContent = submitLabel;
      
      // Clear previous listeners by cloning node
      const newSubmitBtn = submitBtn.cloneNode(true);
      submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
      
      newSubmitBtn.addEventListener('click', async () => {
        await onSubmit();
      });
    } else {
      submitBtn.style.display = 'none';
    }
  },

  hideModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('active');
  },

  // Toast System
  showToast(msg, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Choose icons
    let icon = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `;
    if (type === 'success') {
      icon = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--accent-green)">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
    } else if (type === 'error') {
      icon = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--accent-rose)">
          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
          <line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      `;
    }

    toast.innerHTML = `
      ${icon}
      <span>${msg}</span>
    `;

    container.appendChild(toast);

    // Fade out and remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
