(() => {
  const $ = (selector) => document.querySelector(selector);
  const statusNotice = $('#statusNotice');
  const resumeFile = $('#resumeFile');
  const resumeDrop = $('#resumeDrop');
  const uploadButton = $('#uploadResume');
  const manualForm = $('#manualForm');
  const manualKey = $('#manualKey');
  const manualList = $('#manualList');
  const deleteDialog = $('#deleteConfirm');
  const confirmDeleteButton = $('#confirmDelete');
  const contentField = $('#manualContent')?.closest('.field');
  if (contentField) {
    const stackField = document.createElement('div');
    stackField.className = 'field full';
    stackField.innerHTML = '<label for="manualStack">Technology stack</label><input id="manualStack" maxlength="500" placeholder="ASP.NET Core, Angular, SQL Server" /><small style="display:block;margin-top:6px;color:#71829a;font-size:11px">Comma-separated technologies used in this project. Only these values become portfolio chips.</small>';
    contentField.before(stackField);
  }
  const manualStack = $('#manualStack');
  let selectedFile = null;
  let manualItems = [];
  let pendingDelete = null;
  let deleteInvoker = null;

  const setNotice = (element, message, type = '') => {
    if (!element) return;
    element.textContent = message;
    element.className = `notice ${type}`.trim();
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
      renderManualItems();
      const indexed = Number(data.index?.indexedChunks || 0);
      $('#reindexButton').textContent = indexed ? 'Re-index portfolio knowledge' : 'Index portfolio knowledge';
      setNotice(statusNotice, indexed ? `Knowledge base ready · version updated ${formatDate(data.index?.updatedAt)}.` : 'No knowledge is indexed yet. Index Zain’s portfolio profile to start the assistant.', indexed ? 'success' : '');
    } catch (error) {
      setNotice(statusNotice, error.message, 'error');
    }
  }

  function chooseFile(file) {
    selectedFile = file || null;
    $('#resumeFilename').value = selectedFile ? selectedFile.name : 'No file selected';
    uploadButton.disabled = !selectedFile;
    if (!selectedFile) return;
    const valid = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');
    if (!valid) {
      chooseFile(null);
      setNotice($('#uploadNotice'), 'Only PDF résumés are accepted.', 'error');
      return;
    }
    if (selectedFile.size > 8 * 1024 * 1024) {
      chooseFile(null);
      setNotice($('#uploadNotice'), 'The PDF must be smaller than 8 MB.', 'error');
      return;
    }
    setNotice($('#uploadNotice'), `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Ready to upload.`);
  }

  $('#browseResume').addEventListener('click', (event) => { event.stopPropagation(); resumeFile.click(); });
  resumeDrop.addEventListener('click', (event) => { if (!event.target.closest('button')) resumeFile.click(); });
  resumeDrop.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); resumeFile.click(); } });
  resumeFile.addEventListener('change', () => chooseFile(resumeFile.files?.[0]));
  ['dragenter', 'dragover'].forEach((name) => resumeDrop.addEventListener(name, (event) => { event.preventDefault(); resumeDrop.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach((name) => resumeDrop.addEventListener(name, (event) => { event.preventDefault(); resumeDrop.classList.remove('drag'); }));
  resumeDrop.addEventListener('drop', (event) => chooseFile(event.dataTransfer?.files?.[0]));

  uploadButton.addEventListener('click', () => {
    if (!selectedFile || uploadButton.disabled) return;
    const xhr = new XMLHttpRequest();
    const progress = $('#uploadProgress');
    uploadButton.disabled = true;
    $('#browseResume').disabled = true;
    progress.style.width = '0%';
    setNotice($('#uploadNotice'), 'Uploading résumé…');
    xhr.open('POST', '/api/admin/knowledge/upload');
    xhr.setRequestHeader('content-type', 'application/pdf');
    xhr.setRequestHeader('x-file-name', encodeURIComponent(selectedFile.name));
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
        progress.style.width = `${percent}%`;
        setNotice($('#uploadNotice'), percent < 100 ? `Uploading résumé… ${percent}%` : 'PDF received · extracting text and generating embeddings…');
      }
    };
    xhr.onload = async () => {
      const result = (() => { try { return JSON.parse(xhr.responseText); } catch { return {}; } })();
      if (xhr.status < 200 || xhr.status >= 300) {
        setNotice($('#uploadNotice'), result.error || 'The résumé could not be indexed. The previous knowledge base is still active.', 'error');
      } else {
        progress.style.width = '100%';
        setNotice($('#uploadNotice'), `Résumé indexed · ${result.indexedChunks} chunks are now active.`, 'success');
        chooseFile(null);
        resumeFile.value = '';
        await refreshStatus();
      }
      uploadButton.disabled = !selectedFile;
      $('#browseResume').disabled = false;
    };
    xhr.onerror = () => {
      setNotice($('#uploadNotice'), 'Connection interrupted. The existing index was kept; you can retry.', 'error');
      uploadButton.disabled = false;
      $('#browseResume').disabled = false;
    };
    xhr.send(selectedFile);
  });

  $('#reindexButton').addEventListener('click', async () => {
    const button = $('#reindexButton');
    button.disabled = true;
    setNotice(statusNotice, 'Creating profile chunks and embeddings…');
    try {
      const result = await api('/api/admin/knowledge/reindex', { method: 'POST', body: '{}' });
      setNotice(statusNotice, `Portfolio knowledge indexed · ${result.indexedChunks} chunks are active.`, 'success');
      await refreshStatus();
    } catch (error) {
      setNotice(statusNotice, error.message, 'error');
    } finally { button.disabled = false; }
  });
  $('#refreshButton').addEventListener('click', refreshStatus);

  function resetManualForm() {
    manualForm.reset();
    manualKey.value = '';
    manualStack.value = '';
    $('#manualTitleInput').value = '';
    $('#cancelEdit').hidden = true;
    $('#saveManual').textContent = 'Save knowledge';
  }
  function renderManualItems() {
    manualList.replaceChildren();
    if (!manualItems.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'No manual entries yet. Add professional details above.';
      manualList.append(empty);
      return;
    }
    manualItems.forEach((item) => {
      const wrapper = document.createElement('article');
      wrapper.className = 'manual-item';
      const top = document.createElement('div');
      top.className = 'manual-top';
      const title = document.createElement('strong');
      title.textContent = item.title || item.project || item.company || 'Professional knowledge';
      const actions = document.createElement('div');
      actions.className = 'manual-actions';
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.textContent = 'Edit';
      edit.addEventListener('click', () => {
        manualKey.value = item.chunkKey;
        $('#manualTitleInput').value = item.title || '';
        $('#manualCategory').value = item.category || 'project';
        $('#manualCompany').value = item.company || '';
        $('#manualRole').value = item.role || '';
        $('#manualProject').value = item.project || '';
        manualStack.value = Array.isArray(item.stack) ? item.stack.join(', ') : '';
        $('#manualContent').value = item.content || '';
        $('#cancelEdit').hidden = false;
        $('#saveManual').textContent = 'Update knowledge';
        $('#manualTitleInput').focus();
        manualForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Delete';
      remove.addEventListener('click', () => {
        pendingDelete = item;
        deleteInvoker = remove;
        $('#deleteTarget').textContent = item.title || item.project || item.company || 'Professional knowledge';
        $('#deleteNotice').hidden = true;
        $('#deleteNotice').textContent = '';
        confirmDeleteButton.disabled = false;
        confirmDeleteButton.textContent = 'Delete entry';
        deleteDialog.showModal();
        $('#cancelDelete').focus();
      });
      actions.append(edit, remove);
      top.append(title, actions);
      const body = document.createElement('p');
      body.textContent = item.content || '';
      wrapper.append(top, body);
      manualList.append(wrapper);
    });
  }

  $('#cancelDelete').addEventListener('click', () => deleteDialog.close());
  deleteDialog.addEventListener('click', (event) => { if (event.target === deleteDialog) deleteDialog.close(); });
  deleteDialog.addEventListener('close', () => {
    pendingDelete = null;
    if (deleteInvoker?.isConnected) deleteInvoker.focus();
    deleteInvoker = null;
  });
  confirmDeleteButton.addEventListener('click', async () => {
    if (!pendingDelete || confirmDeleteButton.disabled) return;
    confirmDeleteButton.disabled = true;
    confirmDeleteButton.textContent = 'Deleting…';
    $('#deleteNotice').hidden = true;
    try {
      await api('/api/admin/knowledge/manual', { method: 'DELETE', body: JSON.stringify({ id: pendingDelete.id }) });
      deleteDialog.close();
      setNotice($('#manualNotice'), 'Knowledge entry and its searchable chunk removed.', 'success');
      await refreshStatus();
    } catch (error) {
      $('#deleteNotice').textContent = error.message || 'The entry could not be deleted. Please try again.';
      $('#deleteNotice').hidden = false;
      confirmDeleteButton.disabled = false;
      confirmDeleteButton.textContent = 'Try again';
    }
  });

  $('#cancelEdit').addEventListener('click', resetManualForm);
  manualForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = $('#saveManual');
    button.disabled = true;
    setNotice($('#manualNotice'), 'Generating a fresh embedding and saving…');
    const payload = {
      chunkKey: manualKey.value || `manual:${crypto.randomUUID()}`,
      title: $('#manualTitleInput').value.trim(),
      category: $('#manualCategory').value,
      company: $('#manualCompany').value.trim(),
      role: $('#manualRole').value.trim(),
      project: $('#manualProject').value.trim(),
      stack: manualStack.value.trim(),
      content: $('#manualContent').value.trim()
    };
    try {
      await api('/api/admin/knowledge/manual', { method: 'POST', body: JSON.stringify(payload) });
      setNotice($('#manualNotice'), 'Knowledge saved and searchable by Ask Zain AI.', 'success');
      resetManualForm();
      await refreshStatus();
    } catch (error) { setNotice($('#manualNotice'), error.message, 'error'); }
    finally { button.disabled = false; }
  });

  refreshStatus();
})();
