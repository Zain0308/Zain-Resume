(() => {
  const trigger = document.querySelector('#askAiTrigger');
  const panel = document.querySelector('#askAiPanel');
  const closeButton = document.querySelector('#askAiClose');
  const clearButton = document.querySelector('#askAiClear');
  const messages = document.querySelector('#askAiMessages');
  const suggestions = document.querySelector('#askAiSuggestions');
  const form = document.querySelector('#askAiForm');
  const input = document.querySelector('#askAiInput');
  const sendButton = document.querySelector('#askAiSend');
  const count = document.querySelector('#askAiCount');
  const contact = document.querySelector('#askAiContact');
  const root = document.querySelector('.ask-ai-root');
  if (!trigger || !panel || !messages || !form || !input) return;

  const storageKey = 'zain-portfolio-ai-history-v1';
  const greeting = "Hi! 👋 I'm Zain's AI portfolio assistant.\n\nYou can ask me about Zain's professional experience, .NET expertise, FinTech work, AI projects, technical skills and projects.\n\nWhat would you like to know?";
  const transcript = [];
  let pendingController = null;

  const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const renderMarkdown = (value) => {
    const escaped = escapeHtml(value || '').replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.trim()}</code></pre>`);
    const blocks = escaped.split(/\n{2,}/).map((block) => {
      if (block.startsWith('<pre><code>')) return block;
      if (block.split('\n').every((line) => /^\s*[-*]\s/.test(line))) {
        return `<ul>${block.split('\n').map((line) => `<li>${line.replace(/^\s*[-*]\s/, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>')}</li>`).join('')}</ul>`;
      }
      return `<p>${block.replace(/\n/g, '<br>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>')}</p>`;
    });
    return blocks.join('');
  };

  try { localStorage.removeItem(storageKey); } catch { /* Storage is optional. */ }
  const scrollToLatest = () => { messages.scrollTop = messages.scrollHeight; };
  const createMessage = (role, text = '', sources = [], options = {}) => {
    const bubble = document.createElement('article');
    bubble.className = `ask-ai-message ${role}${options.error ? ' error' : ''}`;
    if (options.typing) {
      bubble.innerHTML = '<span class="ask-ai-status">Searching Zain’s portfolio…</span><span class="ask-ai-typing" aria-label="Zain AI is thinking"><i></i><i></i><i></i></span>';
    } else {
      bubble.innerHTML = renderMarkdown(text);
    }
    if (options.retry) {
      const retry = document.createElement('button');
      retry.className = 'ask-ai-retry';
      retry.type = 'button';
      retry.textContent = 'Try again';
      retry.addEventListener('click', () => submitQuestion(options.retry, true));
      bubble.append(document.createElement('br'), retry);
    }
    messages.append(bubble);
    if (sources.length) {
      const labels = [...new Set(sources.map((source) => source.label).filter(Boolean))].slice(0, 5);
      if (labels.length) {
        const chips = document.createElement('div');
        chips.className = 'ask-ai-sources';
        chips.setAttribute('aria-label', 'Answer sources');
        labels.forEach((label) => { const chip = document.createElement('span'); chip.textContent = label; chips.append(chip); });
        messages.append(chips);
      }
    }
    scrollToLatest();
    return bubble;
  };

  const showGreeting = () => {
    messages.replaceChildren();
    createMessage('assistant', greeting);
    transcript.forEach(({ role, content }) => createMessage(role, content));
    suggestions.hidden = transcript.length > 0;
  };
  showGreeting();

  const openPanel = () => {
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    input.focus({ preventScroll: true });
    scrollToLatest();
  };
  const closePanel = () => {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (pendingController) pendingController.abort();
    trigger.focus({ preventScroll: true });
  };
  trigger.addEventListener('click', () => panel.hidden ? openPanel() : closePanel());
  closeButton?.addEventListener('click', closePanel);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) closePanel();
  });
  clearButton?.addEventListener('click', () => {
    transcript.length = 0;
    try { localStorage.removeItem(storageKey); } catch { /* Storage is optional. */ }
    showGreeting();
    contact.hidden = true;
    input.focus();
  });

  const updateCount = () => { count.textContent = String(input.value.length); };
  input.addEventListener('input', () => {
    updateCount();
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  suggestions?.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (button) submitQuestion(button.textContent.trim());
  });

  const sendEvent = (controller, type, value) => {
    if (controller.signal.aborted) return;
    if (type === 'meta') {
      contact.hidden = !value.contactIntent;
    } else if (type === 'status') {
      const status = typingBubble?.querySelector('.ask-ai-status');
      if (status) status.textContent = value.text || 'Preparing a reply…';
    } else if (type === 'delta') {
      assistantText += value.text || '';
      if (typingBubble?.isConnected) {
        typingBubble.classList.remove('typing');
        typingBubble.innerHTML = renderMarkdown(assistantText);
      }
      scrollToLatest();
    } else if (type === 'done') {
      latestSources = Array.isArray(value.sources) ? value.sources : [];
    } else if (type === 'error') {
      throw new Error(value.message || 'Zain AI is temporarily unavailable. Please try again shortly.');
    }
  };

  let assistantText = '';
  let typingBubble = null;
  let latestSources = [];
  const contactPattern = /\b(contact|hire|hiring|available|availability|opportunit|speak|talk|reach|email|phone|discuss|project proposal)\b/i;
  async function submitQuestion(rawQuestion, retrying = false) {
    const question = String(rawQuestion || '').trim().slice(0, 1200);
    if (!question || sendButton.disabled) return;
    if (!retrying) {
      transcript.push({ role: 'user', content: question });
      createMessage('user', question);
    }
    input.value = '';
    updateCount();
    input.style.height = 'auto';
    suggestions.hidden = true;
    root.classList.add('busy');
    sendButton.disabled = true;
    assistantText = '';
    latestSources = [];
    contact.hidden = !contactPattern.test(question);
    typingBubble = createMessage('assistant', '', [], { typing: true });
    const controller = new AbortController();
    pendingController = controller;

    try {
      const history = transcript.slice(-9, -1).map(({ role, content }) => ({ role, content: content.slice(0, 1000) }));
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
        body: JSON.stringify({ question, history }),
        signal: controller.signal
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Zain AI is temporarily unavailable. Please try again shortly.');
      }
      if (!response.body) throw new Error('The answer stream could not be opened. Please try again.');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let eventName = 'message';
      const handleFrame = (frame) => {
        if (!frame.trim()) return;
        const data = [];
        for (const line of frame.split('\n')) {
          if (line.startsWith('event:')) eventName = line.slice(6).trim();
          if (line.startsWith('data:')) data.push(line.slice(5).trim());
        }
        if (data.length) sendEvent(controller, eventName, JSON.parse(data.join('\n')));
        eventName = 'message';
      };
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true }).replace(/\r/g, '');
        const frames = buffer.split('\n\n');
        buffer = frames.pop() || '';
        frames.forEach(handleFrame);
      }
      buffer += decoder.decode();
      if (buffer.trim()) handleFrame(buffer);
      if (!assistantText) throw new Error('Zain AI did not return an answer. Please try again.');
      transcript.push({ role: 'assistant', content: assistantText });
      createSourcesAfter(typingBubble, latestSources);
    } catch (error) {
      if (error.name === 'AbortError') return;
      typingBubble?.remove();
      createMessage('assistant', error.message || 'Zain AI is temporarily unavailable. Please try again shortly.', [], { error: true, retry: question });
    } finally {
      pendingController = null;
      sendButton.disabled = false;
      root.classList.remove('busy');
      if (!panel.hidden) input.focus({ preventScroll: true });
    }
  }

  function createSourcesAfter(anchor, sources) {
    if (!anchor?.isConnected || !sources.length) return;
    const labels = [...new Set(sources.map((source) => source.label).filter(Boolean))].slice(0, 5);
    if (!labels.length) return;
    const chips = document.createElement('div');
    chips.className = 'ask-ai-sources';
    chips.setAttribute('aria-label', 'Answer sources');
    labels.forEach((label) => { const chip = document.createElement('span'); chip.textContent = label; chips.append(chip); });
    anchor.after(chips);
    scrollToLatest();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitQuestion(input.value);
  });
  contact?.addEventListener('click', () => {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    document.querySelector('#contact')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
})();
