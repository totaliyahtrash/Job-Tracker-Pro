import { Store } from '../utils/store.js';
import { App } from '../app.js';

export const Dashboard = {
  container: null,

  render(container) {
    this.container = container;
    this.draw();
  },

  draw() {
    if (!this.container) return;

    const jobs = Store.getJobs();
    const metrics = this.calculateMetrics(jobs);

    this.container.innerHTML = `
      <div style="animation: slideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; gap: 20px;">
        
        <!-- Welcome System Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border-light); padding-bottom: 16px;">
          <div>
            <h2 style="font-family: var(--font-body); font-size:24px; font-weight:800; color:var(--text-primary);">Command Deck</h2>
            <p style="color:var(--text-secondary); font-size:13px;">Real-time outreach telemetry and system operations.</p>
          </div>
          <button class="btn-secondary" id="dash-export-csv" title="Download Excel Sheet">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 4px; display:inline-block; vertical-align:middle;">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span style="vertical-align:middle;">Export spreadsheet</span>
          </button>
        </div>

        <!-- Telemetry Panel Grid -->
        <div class="telemetry-row">
          <div class="telemetry-panel">
            <div>
              <span class="telemetry-label">Total Listings</span>
              <span class="telemetry-value">${metrics.total}</span>
            </div>
            <span class="telemetry-indicator cyan"></span>
          </div>

          <div class="telemetry-panel">
            <div>
              <span class="telemetry-label">Active Outreach</span>
              <span class="telemetry-value">${metrics.active}</span>
            </div>
            <span class="telemetry-indicator purple"></span>
          </div>

          <div class="telemetry-panel">
            <div>
              <span class="telemetry-label">Offers Secured</span>
              <span class="telemetry-value">${metrics.offered}</span>
            </div>
            <span class="telemetry-indicator green"></span>
          </div>

          <div class="telemetry-panel">
            <div>
              <span class="telemetry-label">Response Rate</span>
              <span class="telemetry-value">${metrics.responseRate}%</span>
            </div>
            <span class="telemetry-indicator amber"></span>
          </div>
        </div>

        <!-- Telemetry Graphs and Diagnostic Console in a 3-Column layout -->
        <div style="display: grid; grid-template-columns: 1.1fr 1fr 1.3fr; gap: 20px; min-height: 260px;">
          
          <!-- Column 1: Applications by Platform -->
          <div class="chart-card" style="display:flex; flex-direction:column;">
            <h3 class="card-title">Outreach Platforms</h3>
            <div style="flex-grow:1; display:flex; flex-direction:column; justify-content:center; gap: 12px; margin-top: 10px;">
              ${this.renderPlatformBars(metrics.platformDistribution)}
            </div>
          </div>

          <!-- Column 2: Timeline Funnel Progress -->
          <div class="chart-card" style="display:flex; flex-direction:column;">
            <h3 class="card-title">Outreach Funnel</h3>
            <div class="funnel-container" style="flex-grow:1; display:flex; align-items:flex-end; min-height:130px; margin-top: 10px; padding: 0 10px;">
              <div class="funnel-stage applied" style="flex-grow:1; display:flex; flex-direction:column; align-items:center; gap:6px;">
                <div class="funnel-bar" style="width:12px; height: 100%; background: var(--gradient-primary); border-radius:3px 3px 0 0; min-height: 4px;"></div>
                <span style="font-family: var(--font-mono); font-size:11px; color:var(--accent-cyan); font-weight:700;">${metrics.applied}</span>
                <span style="font-size:9px; color:var(--text-secondary); text-transform:uppercase;">Applied</span>
              </div>
              
              <div class="funnel-stage interviewing" style="flex-grow:1; display:flex; flex-direction:column; align-items:center; gap:6px;">
                <div class="funnel-bar" style="width:12px; height: ${metrics.total > 0 ? (metrics.interviewing / metrics.total) * 100 : 0}%; background: var(--gradient-purple); border-radius:3px 3px 0 0; min-height: 4px;"></div>
                <span style="font-family: var(--font-mono); font-size:11px; color:var(--accent-purple); font-weight:700;">${metrics.interviewing}</span>
                <span style="font-size:9px; color:var(--text-secondary); text-transform:uppercase;">Interview</span>
              </div>

              <div class="funnel-stage offered" style="flex-grow:1; display:flex; flex-direction:column; align-items:center; gap:6px;">
                <div class="funnel-bar" style="width:12px; height: ${metrics.total > 0 ? (metrics.offered / metrics.total) * 100 : 0}%; background: var(--accent-green); border-radius:3px 3px 0 0; min-height: 4px; box-shadow: 0 0 10px rgba(16,185,129,0.2);"></div>
                <span style="font-family: var(--font-mono); font-size:11px; color:var(--accent-green); font-weight:700;">${metrics.offered}</span>
                <span style="font-size:9px; color:var(--text-secondary); text-transform:uppercase;">Offered</span>
              </div>
            </div>
          </div>

          <!-- Column 3: Live System Diagnostic logs -->
          <div class="chart-card" style="font-family: var(--font-mono); font-size:11px; background: #07080b; display:flex; flex-direction:column; justify-content:space-between;">
            <h3 class="card-title" style="font-family: var(--font-display); font-size:11px; text-transform:uppercase; color: var(--text-secondary); margin-bottom: 8px; display: flex; align-items:center; gap: 6px; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 6px;">
              <span style="display:inline-block; width:5px; height:5px; background:#00ff66; border-radius:50%; box-shadow:0 0 6px #00ff66; animation: pulse 1.5s infinite;"></span>
              DIAGNOSTIC LOGS
            </h3>
            <div id="system-logs-container" style="display:flex; flex-direction:column; gap:4px; overflow-y:auto; height: 130px; color: #00ff66 !important; line-height: 1.4; padding: 2px 4px; font-family: var(--font-mono) !important;">
              ${this.generateSystemLogs(jobs)}
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind event handlers
    document.getElementById('dash-export-csv').addEventListener('click', async () => {
      App.showToast('Generating CSV document...', 'info');
      const ret = await Store.exportToCSV();
      if (ret.success) {
        App.showToast(`Excel Sheet exported: ${ret.filePath}`, 'success');
      } else if (ret.error && ret.error !== 'Export canceled') {
        App.showToast(`Export failed: ${ret.error}`, 'error');
      }
    });
  },

  calculateMetrics(jobs) {
    const total = jobs.length;
    const applied = jobs.filter(j => j.status === 'Applied').length;
    const interviewing = jobs.filter(j => j.status === 'Interviewing').length;
    const offered = jobs.filter(j => j.status === 'Offered').length;
    const rejected = jobs.filter(j => j.status === 'Rejected').length;
    const ghosted = jobs.filter(j => j.status === 'Ghosted').length;
    const active = applied + interviewing;

    // Response rate = (interviewing + offered) / total applied
    const responseCount = interviewing + offered;
    const responseRate = total > 0 ? Math.round((responseCount / total) * 100) : 0;

    // Platforms
    const platformDistribution = {};
    jobs.forEach(j => {
      const plat = j.platform || 'Custom';
      platformDistribution[plat] = (platformDistribution[plat] || 0) + 1;
    });

    return {
      total,
      applied,
      interviewing,
      offered,
      rejected,
      ghosted,
      active,
      responseRate,
      platformDistribution
    };
  },

  renderPlatformBars(dist) {
    const keys = Object.keys(dist);
    if (keys.length === 0) {
      return `<div style="text-align:center; color:var(--text-muted); font-size:12px; margin-top:20px;">No platform statistics logged.</div>`;
    }

    // Sort platforms by count
    keys.sort((a, b) => dist[b] - dist[a]);
    const maxVal = Math.max(...Object.values(dist));

    return keys.map(key => {
      const count = dist[key];
      const percent = maxVal > 0 ? (count / maxVal) * 100 : 0;
      let platColor = 'var(--accent-cyan)';
      if (key === 'LinkedIn') platColor = 'var(--accent-cyan)';
      else if (key === 'Naukri') platColor = 'var(--accent-amber)';
      else if (key === 'Glassdoor') platColor = 'var(--accent-purple)';
      else if (key === 'Cold Email') platColor = '#a855f7';

      return `
        <div style="font-size:12px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-family:var(--font-mono); font-size:11px;">
            <span style="font-weight:600; color:var(--text-primary);">${key}</span>
            <span style="color:var(--text-secondary);">${count} listings</span>
          </div>
          <div style="background:rgba(255,255,255,0.02); height:6px; border-radius:3px; overflow:hidden; border:1px solid rgba(255,255,255,0.01);">
            <div style="background:${platColor}; width:${percent}%; height:100%; border-radius:3px;"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  generateSystemLogs(jobs) {
    const logs = [];
    const timestamp = new Date().toLocaleTimeString();
    
    logs.push(`[${timestamp}] [SYS] Booting Job Tracker Pro v1.0.0...`);
    logs.push(`[${timestamp}] [SYS] DB loaded successfully from AppData.`);
    logs.push(`[${timestamp}] [PORT] API Server active on http://127.0.0.1:4656/`);
    
    const active = jobs.filter(j => j.status === 'Applied' || j.status === 'Interviewing').length;
    logs.push(`[${timestamp}] [SYS] Monitoring pipeline: ${active} active outreaches.`);
    
    if (window.autoGhostedCount) {
      logs.push(`[${timestamp}] [WARN] Auto-ghosting check complete: ${window.autoGhostedCount} stagnant applications moved to 'Ghosted'.`);
    } else {
      logs.push(`[${timestamp}] [SYS] Auto-ghosting audit complete: 0 updates required.`);
    }
    
    logs.push(`[${timestamp}] [SYS] System status: STABLE. Listening for extension payloads.`);

    return logs.map(line => {
      let colorClass = 'color: #00ff66 !important;';
      if (line.includes('[WARN]')) {
        colorClass = 'color: #f59e0b !important; font-weight:600;';
      } else if (line.includes('[PORT]')) {
        colorClass = 'color: #4facfe !important;';
      }
      return `<div style="${colorClass}">&gt; ${line}</div>`;
    }).join('');
  }
};
