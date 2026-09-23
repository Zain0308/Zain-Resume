(() => {
  const $ = (selector) => document.querySelector(selector);
  const statusNotice = $('#statusNotice');
  const resumeFile = $('#resumeFile');
  const resumeDrop = $('#resumeDrop');
  const uploadButton = $('#uploadResume');
  const manualForm = $('#manualForm');
  const manualKey = $('#manualKey');
  const manualList = $('#manualList');
  const portfolioList = document.createElement('div');
  portfolioList.id = 'portfolioList';
  portfolioList.style.cssText = 'display:grid;gap:10px;margin:0 0 24px';
  const portfolioHeading = document.createElement('h3');
  portfolioHeading.textContent = 'Existing portfolio content · organized by category';
  portfolioHeading.style.cssText = 'margin:0;color:#d6e5f7;font-size:16px';
  const portfolioHint = document.createElement('p');
  portfolioHint.textContent = 'Open the category you need, then edit or hide the content already shown on the public portfolio. Hidden items can be restored.';
  portfolioHint.style.cssText = 'margin:0 0 4px;color:#71829a;font-size:12px;line-height:1.5';
  const portfolioTools = document.createElement('div');
  portfolioTools.style.cssText = 'display:grid;grid-template-columns:minmax(220px,1fr) 170px 150px;gap:8px;margin:4px 0 6px';
  portfolioTools.innerHTML = '<input id="portfolioSearch" aria-label="Search portfolio content" placeholder="Search content…" style="width:100%;padding:9px 11px;color:#e1ebf8;border:1px solid rgba(145,188,255,.18);border-radius:9px;background:#050b15" /><select id="portfolioCategoryFilter" aria-label="Filter portfolio category" style="width:100%;padding:9px 11px;color:#e1ebf8;border:1px solid rgba(145,188,255,.18);border-radius:9px;background:#050b15"><option value="all">All categories</option><option value="profile">Profile</option><option value="project">Projects</option><option value="experience">Experience</option><option value="skills">Skills</option><option value="education">Education</option><option value="contact">Contact</option><option value="site">Site content</option></select><select id="portfolioVisibilityFilter" aria-label="Filter portfolio visibility" style="width:100%;padding:9px 11px;color:#e1ebf8;border:1px solid rgba(145,188,255,.18);border-radius:9px;background:#050b15"><option value="all">All visibility</option><option value="published">Published</option><option value="draft">Drafts</option><option value="hidden">Hidden</option></select>';
  portfolioList.append(portfolioHeading, portfolioHint, portfolioTools);
  const backupActions = document.createElement('div');
  backupActions.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 6px';
  backupActions.innerHTML = '<button id="exportPortfolio" type="button" class="button secondary" style="min-height:36px;font-size:12px">Export backup</button><label class="button secondary" style="min-height:36px;font-size:12px;cursor:pointer">Import backup<input id="importPortfolio" type="file" accept="application/json,.json" style="display:none" /></label><span style="color:#71829a;font-size:11px">Backup includes editable content and settings.</span>';
  portfolioList.append(backupActions);
  manualList?.before(portfolioList);
  const deleteDialog = $('#deleteConfirm');
  const confirmDeleteButton = $('#confirmDelete');
  const previewDialog = document.createElement('dialog');
  previewDialog.style.cssText = 'width:min(620px,calc(100% - 28px));padding:0;color:#f4f8ff;border:1px solid rgba(145,188,255,.22);border-radius:18px;background:#0b1322;box-shadow:0 30px 100px rgba(0,0,0,.62)';
  previewDialog.innerHTML = '<div style="padding:22px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:start"><div><p style="margin:0 0 7px;color:#63e4ff;font:700 11px monospace;letter-spacing:.1em;text-transform:uppercase">Public preview</p><h2 id="portfolioPreviewTitle" style="margin:0;font-size:22px"></h2></div><button id="closePortfolioPreview" type="button" style="padding:6px 10px;color:#c8d8ea;border:1px solid rgba(145,188,255,.2);border-radius:8px;background:#091321;cursor:pointer">Close</button></div><p id="portfolioPreviewMeta" style="color:#8fa2ba;font-size:13px"></p><div id="portfolioPreviewMedia"></div><p id="portfolioPreviewContent" style="color:#d2dfed;line-height:1.7;white-space:pre-wrap"></p><div id="portfolioPreviewTags" style="display:flex;flex-wrap:wrap;gap:7px"></div><div id="portfolioPreviewLinks" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px"></div></div>';
  document.body.append(previewDialog);
  $('#closePortfolioPreview', previewDialog)?.addEventListener('click', () => previewDialog.close());
  const manualCategory = $('#manualCategory');
  if (manualCategory && ![...manualCategory.options].some((option) => option.value === 'site')) {
    const siteOption = document.createElement('option');
    siteOption.value = 'site';
    siteOption.textContent = 'site';
    manualCategory.append(siteOption);
  }
  const contentField = $('#manualContent')?.closest('.field');
  const makeField = (id, label, type = 'text', placeholder = '') => {
    const field = document.createElement('div');
    field.className = 'field';
    field.innerHTML = `<label for="${id}">${label}</label><input id="${id}" type="${type}"${placeholder ? ` placeholder="${placeholder}"` : ''} />`;
    return field;
  };
  if (contentField) {
    const stackField = document.createElement('div');
    stackField.className = 'field full';
    stackField.innerHTML = '<label for="manualStack">Technology stack</label><input id="manualStack" maxlength="500" placeholder="ASP.NET Core, Angular, SQL Server" /><small style="display:block;margin-top:6px;color:#71829a;font-size:11px">Comma-separated technologies used in this project. Only these values become portfolio chips.</small>';
    contentField.before(stackField);
    const mediaField = document.createElement('div');
    mediaField.className = 'field full';
    mediaField.innerHTML = '<label for="manualMediaUrl">Card image / GIF URL (optional)</label><input id="manualMediaUrl" maxlength="1000" type="url" placeholder="https://example.com/project-preview.gif" /><small style="display:block;margin-top:6px;color:#71829a;font-size:11px">Paste a direct image or GIF URL. It will appear at the top of this project card.</small>';
    const institutionField = makeField('manualInstitution', 'Institution / university', 'text', 'Sindh Agriculture University');
    const startDateField = makeField('manualStartDate', 'Start date', 'date');
    const endDateField = makeField('manualEndDate', 'End date', 'date');
    const contactValueField = makeField('manualContactValue', 'Contact value', 'text', 'email@example.com');
    const contactUrlField = makeField('manualContactUrl', 'Contact URL', 'url', 'https://linkedin.com/in/username');
    const githubUrlField = makeField('manualGithubUrl', 'GitHub URL', 'url', 'https://github.com/username/project');
    const demoUrlField = makeField('manualDemoUrl', 'Live demo URL', 'url', 'https://example.com');
    const sortOrderField = makeField('manualSortOrder', 'Display order', 'number', '0');
    sortOrderField.querySelector('input').min = '0';
    sortOrderField.querySelector('input').max = '9999';
    const featuredField = document.createElement('div');
    featuredField.className = 'field';
    featuredField.innerHTML = '<label><input id="manualFeatured" type="checkbox" style="width:auto;margin-right:7px" /> Featured project</label><small style="color:#71829a;font-size:11px">Highlights this project on the public portfolio.</small>';
    const draftField = document.createElement('div');
    draftField.className = 'field';
    draftField.innerHTML = '<label><input id="manualDraft" type="checkbox" style="width:auto;margin-right:7px" /> Save as draft</label><small style="color:#71829a;font-size:11px">Drafts stay in Admin Manager and are hidden from the public site.</small>';
    const sectionVisibleField = document.createElement('div');
    sectionVisibleField.className = 'field';
    sectionVisibleField.innerHTML = '<label><input id="manualSectionVisible" type="checkbox" checked style="width:auto;margin-right:7px" /> Visible on public site</label><small style="color:#71829a;font-size:11px">Turn off to temporarily remove this item without deleting it.</small>';
    const mediaFileField = document.createElement('div');
    mediaFileField.className = 'field full';
    mediaFileField.innerHTML = '<label for="manualMediaFile">Upload card image / GIF</label><input id="manualMediaFile" type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml" /><small id="mediaUploadNotice" style="display:block;color:#71829a;font-size:11px">Optional. Upload a local image/GIF or paste a URL above.</small>';
    const siteValueField = document.createElement('div');
    siteValueField.className = 'field full';
    siteValueField.innerHTML = '<label for="manualSiteValue">Public site value</label><textarea id="manualSiteValue" maxlength="8000" rows="5" placeholder="Text shown on the public portfolio. Use one item per line for lists."></textarea><small style="display:block;margin-top:6px;color:#71829a;font-size:11px">For site content, this is the exact visible value. Use one item per line for chips, lists, or rotating lines.</small>';
    contentField.before(stackField, mediaField, mediaFileField, institutionField, startDateField, endDateField, contactValueField, contactUrlField, githubUrlField, demoUrlField, sortOrderField, featuredField, draftField, sectionVisibleField, siteValueField);
  }
  const manualStack = $('#manualStack');
  const manualMediaUrl = $('#manualMediaUrl');
  const manualInstitution = $('#manualInstitution');
  const manualStartDate = $('#manualStartDate');
  const manualEndDate = $('#manualEndDate');
  const manualContactValue = $('#manualContactValue');
  const manualContactUrl = $('#manualContactUrl');
  const manualGithubUrl = $('#manualGithubUrl');
  const manualDemoUrl = $('#manualDemoUrl');
  const manualSortOrder = $('#manualSortOrder');
  const manualFeatured = $('#manualFeatured');
  const manualDraft = $('#manualDraft');
  const manualSectionVisible = $('#manualSectionVisible');
  const manualMediaFile = $('#manualMediaFile');
  const manualSiteValue = $('#manualSiteValue');
  const previewFormButton = document.createElement('button');
  previewFormButton.type = 'button';
  previewFormButton.className = 'button secondary';
  previewFormButton.textContent = 'Preview changes';
  manualForm.querySelector('.actions')?.append(previewFormButton);
  let selectedFile = null;
  let selectedMediaFile = null;
  let manualItems = [];
  let portfolioItems = [];
  let editingPortfolioKey = '';
  let editingPortfolioItem = null;
  let pendingDelete = null;
  let deleteInvoker = null;

  const setNotice = (element, message, type = '') => {
    if (!element) return;
    element.textContent = message;
    element.className = `notice ${type}`.trim();
  };
  const setFieldVisible = (id, visible) => {
    const field = document.querySelector(`#${id}`)?.closest('.field');
    if (field) {
      field.hidden = !visible;
      field.style.display = visible ? '' : 'none';
    }
  };
  const updateCategoryFields = () => {
    const category = manualCategory?.value || 'profile';
    const isProject = category === 'project';
    const isExperience = category === 'experience';
    const isSkills = category === 'skills';
    const isEducation = category === 'education';
    const isContact = category === 'contact';
    const isSite = category === 'site';
    setFieldVisible('manualCompany', isProject || isExperience);
    setFieldVisible('manualRole', isExperience);
    setFieldVisible('manualProject', isProject);
    setFieldVisible('manualStack', isProject || isExperience || isSkills);
    setFieldVisible('manualMediaUrl', isProject);
    setFieldVisible('manualInstitution', isEducation);
    setFieldVisible('manualStartDate', isExperience || isEducation);
    setFieldVisible('manualEndDate', isExperience || isEducation);
    setFieldVisible('manualContactValue', isContact);
    setFieldVisible('manualContactUrl', isContact);
    setFieldVisible('manualGithubUrl', isProject);
    setFieldVisible('manualDemoUrl', isProject);
    setFieldVisible('manualMediaFile', isProject);
    setFieldVisible('manualSortOrder', isProject || isExperience || isSkills || isSite);
    setFieldVisible('manualFeatured', isProject);
    setFieldVisible('manualDraft', true);
    setFieldVisible('manualSectionVisible', true);
    setFieldVisible('manualSiteValue', isSite);
    const detailsField = document.querySelector('#manualContent')?.closest('.field');
    if (detailsField) {
      detailsField.style.display = isSite ? 'none' : '';
      document.querySelector('#manualContent').required = !isSite;
    }
    if (manualSiteValue) manualSiteValue.required = isSite;
    const companyLabel = document.querySelector('label[for="manualCompany"]');
    if (companyLabel) companyLabel.textContent = isProject ? 'Company / client' : 'Company';
  };
  const formatDate = (value) => value ? new Date(value).toLocaleString() : 'Not indexed yet';

  async function api(path, options = {}) {
    const response = await fetch(path, { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) }, cache: 'no-store' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'This operation could not be completed.');
    return result;
  }

  async function refreshStatus() {
    try {
      setNotice(statusNotice, 'Loading current résumé and index status…');
      const data = await api('/api/admin/knowledge/status');
      $('#resumeName').textContent = data.resume?.name || 'Zain-Ali-Resume.pdf';
      $('#updatedAt').textContent = formatDate(data.index?.updatedAt || data.resume?.uploadedAt);
      $('#chunkCount').textContent = String(data.index?.indexedChunks || 0);
      const categories = $('#categories');
      categories.replaceChildren();
      (data.index?.categories || []).forEach((item) => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = `${item.name} · ${item.count}`;
        categories.append(chip);
      });
      manualItems = Array.isArray(data.index?.manualDocuments) ? data.index.manualDocuments : [];
      portfolioItems = Array.isArray(data.portfolioContent) ? data.portfolioContent : [];
      renderPortfolioItems();
      renderManualItems();
      const indexed = Number(data.index?.indexedChunks || 0);
      $('#reindexButton').textContent = indexed ? 'Re-index portfolio knowledge' : 'Index portfolio knowledge';
      setNotice(statusNotice, indexed ? `Knowledge base ready · version updated ${formatDate(data.index?.updatedAt)}.` : 'No knowledge is indexed yet. Index Zain’s portfolio profile to start the assistant.', indexed ? 'success' : '');
    } catch (error) {
      setNotice(statusNotice, error.message, 'error');
    }
  }

  $('#exportPortfolio')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(portfolioItems, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `zain-portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setNotice($('#manualNotice'), 'Portfolio backup downloaded.', 'success');
  });
  $('#importPortfolio')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!Array.isArray(imported) || !imported.length) throw new Error('The backup file has no portfolio items.');
      if (!window.confirm(`Import ${imported.length} portfolio items? Existing matching items will be updated.`)) return;
      setNotice($('#manualNotice'), `Importing ${imported.length} items…`);
      for (const item of imported) {
        await api('/api/admin/knowledge/manual', { method: 'POST', body: JSON.stringify({ ...item, chunkKey: item.chunkKey || `manual:${crypto.randomUUID()}`, contentKey: item.contentKey || '', kind: item.contentKey ? 'portfolioOverride' : 'manual', content: item.siteValue || item.content || item.title || 'Imported portfol