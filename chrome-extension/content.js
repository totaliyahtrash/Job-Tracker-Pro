/**
 * ADVANCED CONTENT SCRAPER SCRIPT
 * Injected dynamically by the extension popup to scrape job listing or recruiter profile details.
 */

(() => {
  const url = window.location.href;
  
  // Helper: Extract company name from LinkedIn Profile Headline
  function parseCompanyFromHeadline(headline) {
    if (!headline) return '';
    
    // Patterns: "Recruiter at Google", "HR @ Stripe", "Talent Acquisition | Netflix"
    const atMatches = headline.match(/(?:at|@)\s+([A-Za-z0-9\s&]+)/i);
    if (atMatches && atMatches[1]) {
      return atMatches[1].trim();
    }
    
    const dividerMatches = headline.split(/\||-|•/);
    if (dividerMatches.length > 1) {
      return dividerMatches[dividerMatches.length - 1].trim();
    }
    
    return '';
  }

  // 1. Check if we are on a LinkedIn Profile page
  if (url.includes('linkedin.com/in/') || url.includes('/in/')) {
    // BULLETPROOF: Scrape recruiter name from the Document Title first!
    let recruiterName = '';
    const title = document.title;
    if (title && title.includes('|')) {
      recruiterName = title.split('|')[0].replace(/^\(\d+\)\s+/, '').trim();
    }

    // Fallback name selectors if title isn't available
    if (!recruiterName) {
      const nameSelectors = [
        '.text-heading-xlarge',
        'h1.v-align-middle',
        'h1.top-card-layout__title',
        '[class*="profile-display-name"]',
        '.pv-top-card-layout__name',
        'main h1',
        'h1'
      ];
      for (const selector of nameSelectors) {
        const el = document.querySelector(selector);
        if (el && el.innerText.trim().length > 0) {
          recruiterName = el.innerText.trim();
          break;
        }
      }
    }
    recruiterName = recruiterName.split(/[,(|\u2011]/)[0].replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();

    // Scrape recruiter headline / job title
    const headlineSelectors = [
      '.text-body-medium',
      'div.text-body-medium',
      '[class*="headline"]',
      'h2[class*="headline"]',
      '.pv-text-details__left-panel h2'
    ];
    let headline = '';
    for (const selector of headlineSelectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText.trim().length > 0) {
        headline = el.innerText.trim();
        break;
      }
    }

    // Scrape recruiter company
    let currentCompany = '';
    
    // Method A: Check right-panel current company item
    const rightPanelEl = document.querySelector('.pv-text-details__right-panel-item, button[aria-label*="Current company"], [data-field="experience_company"], [class*="right-panel-item"]');
    if (rightPanelEl) {
      currentCompany = rightPanelEl.innerText.split('\n')[0].replace(/Current company:/i, '').trim();
    }
    
    // Method B: Parse from profile experience list
    if (!currentCompany || currentCompany.length === 0) {
      const expSection = document.querySelector('#experience, [id*="experience"]');
      if (expSection) {
        const firstItem = expSection.nextElementSibling?.querySelector('.pvs-list__item-container') || expSection.querySelector('.pvs-list__item-container');
        if (firstItem) {
          const boldTexts = Array.from(firstItem.querySelectorAll('span[aria-hidden="true"]')).map(el => el.innerText.trim());
          if (boldTexts.length > 0) {
            const firstLine = boldTexts[0];
            const secondLine = boldTexts.length > 1 ? boldTexts[1] : '';
            
            if (secondLine && (secondLine.includes('Full-time') || secondLine.includes('Part-time') || secondLine.includes('Contract') || secondLine.includes('yr') || secondLine.includes('mos'))) {
              currentCompany = firstLine;
            } else if (secondLine) {
              currentCompany = secondLine.split('·')[0].split('•')[0].trim();
            } else {
              currentCompany = firstLine;
            }
          }
        }
      }
    }

    // Method C: Parse from profile headline
    if (!currentCompany || currentCompany.length === 0) {
      currentCompany = parseCompanyFromHeadline(headline);
    }
    
    currentCompany = currentCompany.replace(/&amp;/g, '&').trim();

    // Scrape email from page DOM ( Apollo / contact details injection )
    const pageText = document.body.innerText;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = pageText.match(emailRegex);
    let recruiterEmail = '';
    
    if (matches && matches.length > 0) {
      const uniqueEmails = [...new Set(matches)];
      const filtered = uniqueEmails.filter(e => !e.endsWith('.png') && !e.endsWith('.jpg') && !e.includes('example.com') && !e.includes('sentry.io') && !e.includes('wix.com'));
      if (filtered.length > 0) recruiterEmail = filtered[0];
    }

    return {
      type: 'profile',
      recruiterName,
      recruiterEmail,
      recruiterLinkedin: url,
      company: currentCompany,
      headline
    };
  }

  // 2. Otherwise, treat as a Job Page Scraper (LinkedIn Jobs, Naukri, Glassdoor, Career Sites)
  let company = '';
  let role = '';
  let jd = '';
  let platform = 'Custom';

  if (url.includes('linkedin.com')) {
    platform = 'LinkedIn';
    
    const roleEl = document.querySelector('.jobs-unified-top-card__job-title, .job-details__topcard-title, h1.t-24, h2.jobs-details-top-card__job-title');
    if (roleEl) role = roleEl.innerText;

    const companyEl = document.querySelector('.jobs-unified-top-card__company-name, .job-details__topcard-org-name, .jobs-details-top-card__company-url, .jobs-details-top-card__company-name');
    if (companyEl) company = companyEl.innerText;

    const jdEl = document.querySelector('#job-details, .jobs-description__content, .jobs-box__html-content');
    if (jdEl) jd = jdEl.innerText;

  } else if (url.includes('naukri.com')) {
    platform = 'Naukri';

    const roleSelectors = ['.jd-header-title', 'h1.job-title', '.jd-header h1', '[class*="jd-header-title"]', '[class*="job-title"]', 'h1[class*="title"]'];
    for (const s of roleSelectors) {
      const el = document.querySelector(s);
      if (el) { role = el.innerText; break; }
    }

    const companySelectors = ['.jd-header-comp-name', '.jd-header-comp-name a', '.company-info a', '[class*="jd-header-comp-name"]', '[class*="company-name"]'];
    for (const s of companySelectors) {
      const el = document.querySelector(s);
      if (el) { company = el.innerText; break; }
    }

    const jdSelectors = ['.job-desc', '.job-description', '#job-description', '[class*="job-desc"]', '.jd-desc'];
    for (const s of jdSelectors) {
      const el = document.querySelector(s);
      if (el) { jd = el.innerText; break; }
    }

  } else if (url.includes('glassdoor.com')) {
    platform = 'Glassdoor';

    const roleEl = document.querySelector('[data-test="job-title"], .job-title, h1.css-1vg6q84');
    if (roleEl) role = roleEl.innerText;

    const companyEl = document.querySelector('[data-test="employer-name"], .employer-name, .css-164r41r');
    if (companyEl) company = companyEl.innerText;

    const jdEl = document.querySelector('#JobDescriptionContainer, .jobDescriptionContent, .css-1768b5a');
    if (jdEl) jd = jdEl.innerText;

  } else {
    // Smart Career Site Scraper
    platform = 'Career Website';

    const h1 = document.querySelector('h1');
    if (h1) {
      role = h1.innerText;
    } else {
      const title = document.title;
      role = title.split('|')[0].split('-')[0].trim();
    }

    const hostname = window.location.hostname;
    const parts = hostname.replace('www.', '').replace('careers.', '').split('.');
    if (parts.length > 0) {
      company = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    } else {
      company = 'Career Portal';
    }

    const jdSelectors = [
      '[class*="description"]', '[class*="jd"]', '[id*="description"]', '[id*="jd"]',
      'article', 'main', '.job-info', '.job-details', '.job-post'
    ];
    
    let jdEl = null;
    for (const selector of jdSelectors) {
      const found = document.querySelector(selector);
      if (found && found.innerText.trim().length > 200) {
        jdEl = found;
        break;
      }
    }

    if (jdEl) {
      jd = jdEl.innerText;
    } else {
      jd = Array.from(document.querySelectorAll('p, li'))
        .map(el => el.innerText.trim())
        .filter(text => text.length > 40)
        .slice(0, 15)
        .join('\n\n');
    }
  }

  // Clean values
  company = company.replace(/\r?\n|\r/g, ' ').replace(/•.*/, '').trim();
  role = role.replace(/\r?\n|\r/g, ' ').trim();
  jd = jd.trim();

  // Strip common footer boilerplate text from JD
  const footerKeywords = ['about us', 'equal opportunity', 'privacy policy', 'share this job'];
  footerKeywords.forEach(keyword => {
    const idx = jd.toLowerCase().indexOf(keyword);
    if (idx !== -1 && idx > 300) {
      jd = jd.substring(0, idx).trim();
    }
  });

  return {
    type: 'job',
    company,
    role,
    platform,
    url,
    jd
  };
})();
