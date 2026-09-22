(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  const loader = document.querySelector('#bootLoader');
  const finishBoot = () => {
    loader?.classList.add('complete');
    body.classList.remove('booting');
    window.setTimeout(() => loader?.remove(), 650);
  };
  body.classList.add('booting');
  window.setTimeout(finishBoot, prefersReducedMotion ? 80 : 1450);

  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.scroll-progress span');
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.primary-nav');

  const updateScrollUI = () => {
    const top = window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    header?.classList.toggle('scrolled', top > 24);
    if (progress) progress.style.width = `${Math.min(100, (top / max) * 100)}%`;
  };

  updateScrollUI();
  window.addEventListener('scroll', updateScrollUI, { passive: true });

  if (menuButton && nav) {
    const closeMenu = () => {
      menuButton.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
      body.classList.remove('menu-open');
    };

    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('open', !open);
      body.classList.toggle('menu-open', !open);
    });

    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => {
      if (window.innerWidth > 780) closeMenu();
    });
  }

  const navLinks = [...document.querySelectorAll('.primary-nav a[href^="#"]')];
  const observedSections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!current) return;
      navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${current.target.id}`));
    }, { rootMargin: '-32% 0px -58% 0px', threshold: [0, 0.1, 0.35] });
    observedSections.forEach((section) => sectionObserver.observe(section));
  }

  const typedRole = document.querySelector('#typedRole');
  const roleLines = [
    'Building scalable REST APIs...',
    'Developing enterprise .NET applications...',
    'Integrating banking & payment APIs...',
    'Building modern Angular applications...',
    'Developing AI-powered solutions...',
    'Optimizing production systems...'
  ];
  if (typedRole && !prefersReducedMotion) {
    let roleIndex = 0;
    let charIndex = roleLines[0].length;
    let deleting = true;
    const typeRole = () => {
      const line = roleLines[roleIndex];
      if (deleting) {
        charIndex -= 1;
        typedRole.textContent = line.slice(0, Math.max(0, charIndex));
        if (charIndex <= 0) {
          deleting = false;
          roleIndex = (roleIndex + 1) % roleLines.length;
          window.setTimeout(typeRole, 280);
          return;
        }
      } else {
        charIndex += 1;
        typedRole.textContent = roleLines[roleIndex].slice(0, charIndex);
        if (charIndex >= roleLines[roleIndex].length) {
          deleting = true;
          window.setTimeout(typeRole, 1750);
          return;
        }
      }
      window.setTimeout(typeRole, deleting ? 24 : 42);
    };
    window.setTimeout(typeRole, 2100);
  }

  const reveals = [...document.querySelectorAll('.reveal')];
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px' });
    reveals.forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index % 3, 2) * 70}ms`;
      revealObserver.observe(element);
    });
  } else {
    reveals.forEach((element) => element.classList.add('visible'));
  }

  if (finePointer && !prefersReducedMotion) {
    const cursorGlow = document.querySelector('.cursor-glow');
    let cursorX = -500;
    let cursorY = -500;
    let glowX = cursorX;
    let glowY = cursorY;

    window.addEventListener('pointermove', (event) => {
      cursorX = event.clientX;
      cursorY = event.clientY;
      cursorGlow?.classList.add('active');
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => cursorGlow?.classList.remove('active'));

    const moveGlow = () => {
      glowX += (cursorX - glowX) * 0.13;
      glowY += (cursorY - glowY) * 0.13;
      if (cursorGlow) cursorGlow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0)`;
      requestAnimationFrame(moveGlow);
    };
    moveGlow();

    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        card.style.setProperty('--ry', `${(x - 0.5) * 5.5}deg`);
        card.style.setProperty('--rx', `${(0.5 - y) * 5.5}deg`);
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--rx', '0deg');
      });
    });
  }

  const easterToast = document.querySelector('#easterToast');
  let toastTimer = 0;
  const showToast = (message) => {
    if (!easterToast) return;
    window.clearTimeout(toastTimer);
    easterToast.textContent = message;
    easterToast.classList.add('show');
    toastTimer = window.setTimeout(() => easterToast.classList.remove('show'), 2600);
  };
  document.querySelectorAll('[data-easter]').forEach((object) => {
    object.addEventListener('click', () => showToast(object.dataset.easter || 'System ready.'));
  });

  const stackCategory = document.querySelector('#stackCategory');
  document.querySelectorAll('[data-category]').forEach((technology) => {
    const updateCategory = () => {
      if (stackCategory) stackCategory.textContent = `${technology.textContent.trim()} — ${technology.dataset.category}`;
    };
    technology.addEventListener('mouseenter', updateCategory);
    technology.addEventListener('focus', updateCategory);
  });

  const terminalForm = document.querySelector('#terminalForm');
  const terminalInput = document.querySelector('#terminalInput');
  const terminalOutput = document.querySelector('#terminalOutput');
  const terminalCommands = {
    help: 'Available commands:\nhelp · whoami · about · skills · experience · projects · education · contact · clear',
    whoami: 'Zain Ali\nSoftware Engineer\nFull Stack .NET Developer',
    about: 'Full Stack .NET Software Engineer building enterprise, FinTech, API, real-time and AI-powered applications.',
    skills: 'ASP.NET Core · C# · Angular · SQL Server · MongoDB · Node.js · Azure OpenAI · REST APIs',
    experience: '5 years\nJuba Express · IBEX Global · Technomites · BDO Pakistan',
    projects: 'Juba Express · RefleCX.io · IBEX Messenger · Agentic AI · Fougito · Inventory Management System',
    education: 'BS Information Technology\nSindh Agriculture University · 2018—2022',
    contact: 'Email: Zain-Alii@outlook.com\nLinkedIn: /in/zain-ali-34123216a',
    status: 'Building scalable software...'
  };

  const appendTerminalLine = (command, response, success = false) => {
    if (!terminalOutput) return;
    const commandLine = document.createElement('p');
    const prompt = document.createElement('span');
    prompt.className = 'terminal-prompt';
    prompt.textContent = 'zain@portfolio:~$';
    commandLine.append(prompt, document.createTextNode(` ${command}`));
    const responseLine = document.createElement('p');
    if (success) responseLine.className = 'terminal-success';
    responseLine.textContent = response;
    terminalOutput.append(commandLine, responseLine);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  };

  terminalForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!(terminalInput instanceof HTMLInputElement)) return;
    const command = terminalInput.value.trim().toLowerCase();
    terminalInput.value = '';
    if (!command) return;
    if (command === 'clear') {
      if (terminalOutput) terminalOutput.textContent = '';
      return;
    }
    if (command === 'sudo hire zain') {
      appendTerminalLine(command, 'Checking developer profile...\n\n.NET Experience ........ PASS\nBackend Development .... PASS\nFrontend Development ... PASS\nREST APIs .............. PASS\nFinTech Experience ..... PASS\nAI Integration ......... PASS\n\nAccess granted ✓\nOpening contact channel...', true);
      window.setTimeout(() => document.querySelector('#contact')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' }), 1100);
      return;
    }
    if (terminalCommands[command]) {
      appendTerminalLine(command, terminalCommands[command], command === 'status');
      if (command === 'contact') window.setTimeout(() => document.querySelector('#contact')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' }), 700);
    } else {
      appendTerminalLine(command, `Command not found: ${command}. Type help to see available commands.`);
    }
  });

  const form = document.querySelector('#contactForm');
  const formStatus = document.querySelector('#formStatus');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const subjectText = String(formData.get('subject') || '').trim();
    const message = String(formData.get('message') || '').trim();
    const subject = encodeURIComponent(`${subjectText} — from ${name}`);
    const bodyText = [
      `Hi Zain,`,
      '',
      message,
      '',
      `From: ${name}`,
      `Email: ${email}`
    ].filter(Boolean).join('\n');
    const mailto = `mailto:Zain-Alii@outlook.com?subject=${subject}&body=${encodeURIComponent(bodyText)}`;

    if (formStatus) {
      formStatus.textContent = 'POST /api/contact\n201 CREATED\nMessage prepared ✓';
      formStatus.classList.add('success');
    }
    window.setTimeout(() => { window.location.href = mailto; }, prefersReducedMotion ? 0 : 650);
  });

  const year = document.querySelector('#currentYear');
  if (year) year.textContent = String(new Date().getFullYear());

  const networkCanvas = document.querySelector('#networkCanvas');
  if (!(networkCanvas instanceof HTMLCanvasElement)) return;
  const ctx = networkCanvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let ratio = 1;
  let nodes = [];
  let pulses = [];
  let frame = 0;
  let visible = !document.hidden;
  const pointer = { x: -1000, y: -1000 };

  const randomNode = () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.12,
    vy: (Math.random() - 0.5) * 0.12,
    radius: 0.6 + Math.random() * 1.25,
    alpha: 0.16 + Math.random() * 0.26
  });

  const findLinks = () => {
    const links = [];
    const threshold = width < 700 ? 135 : 175;
    for (let a = 0; a < nodes.length; a += 1) {
      for (let b = a + 1; b < nodes.length; b += 1) {
        const dx = nodes[a].x - nodes[b].x;
        const dy = nodes[a].y - nodes[b].y;
        const distance = Math.hypot(dx, dy);
        if (distance < threshold) links.push({ a, b, distance, threshold });
      }
    }
    return links;
  };

  const resizeNetwork = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    networkCanvas.width = Math.round(width * ratio);
    networkCanvas.height = Math.round(height * ratio);
    networkCanvas.style.width = `${width}px`;
    networkCanvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = width < 700 ? 20 : Math.min(48, Math.round((width * height) / 31000));
    nodes = Array.from({ length: count }, randomNode);
    const links = findLinks();
    pulses = Array.from({ length: Math.min(8, Math.max(3, Math.floor(links.length / 7))) }, (_, index) => ({
      link: links[index % Math.max(1, links.length)],
      t: Math.random(),
      speed: 0.0012 + Math.random() * 0.0015
    })).filter((pulse) => pulse.link);
  };

  const drawNetwork = (time = 0) => {
    if (!visible) return;
    ctx.clearRect(0, 0, width, height);
    const links = findLinks();

    if (!prefersReducedMotion) {
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < -20) node.x = width + 20;
        if (node.x > width + 20) node.x = -20;
        if (node.y < -20) node.y = height + 20;
        if (node.y > height + 20) node.y = -20;

        const pointerDistance = Math.hypot(node.x - pointer.x, node.y - pointer.y);
        if (pointerDistance < 130 && pointerDistance > 0) {
          node.x += ((node.x - pointer.x) / pointerDistance) * 0.12;
          node.y += ((node.y - pointer.y) / pointerDistance) * 0.12;
        }
      });
    }

    links.forEach((link) => {
      const start = nodes[link.a];
      const end = nodes[link.b];
      const opacity = (1 - link.distance / link.threshold) * 0.11;
      ctx.strokeStyle = `rgba(92, 164, 232, ${opacity})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    });

    nodes.forEach((node) => {
      ctx.fillStyle = `rgba(102, 211, 255, ${node.alpha})`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    if (!prefersReducedMotion && links.length) {
      pulses.forEach((pulse, index) => {
        if (!pulse.link || !nodes[pulse.link.a] || !nodes[pulse.link.b]) {
          pulse.link = links[Math.floor(Math.random() * links.length)];
          pulse.t = 0;
        }
        pulse.t += pulse.speed * Math.min(32, Math.max(8, time - (pulse.lastTime || time)));
        pulse.lastTime = time;
        if (pulse.t >= 1) {
          pulse.t = 0;
          pulse.link = links[Math.floor(Math.random() * links.length)];
        }
        const start = nodes[pulse.link.a];
        const end = nodes[pulse.link.b];
        const x = start.x + (end.x - start.x) * pulse.t;
        const y = start.y + (end.y - start.y) * pulse.t;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 7);
        gradient.addColorStop(0, index % 3 === 0 ? 'rgba(172,130,255,.8)' : 'rgba(96,226,255,.85)');
        gradient.addColorStop(1, 'rgba(96,226,255,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    frame = requestAnimationFrame(drawNetwork);
  };

  window.addEventListener('resize', resizeNetwork, { passive: true });
  window.addEventListener('pointermove', (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    cancelAnimationFrame(frame);
    if (visible) frame = requestAnimationFrame(drawNetwork);
  });

  resizeNetwork();
  if (prefersReducedMotion) drawNetwork(0);
  else frame = requestAnimationFrame(drawNetwork);

  root.classList.add('enhanced');
})();

(() => {
  const section = document.querySelector('#live-portfolio');
  const grid = document.querySelector('#livePortfolioGrid');
  if (!section || !grid) return;

  const categoryLabels = {
    project: 'Project update',
    experience: 'Experience update',
    skills: 'Skills update',
    education: 'Education update',
    contact: 'Contact update',
    profile: 'Profile update'
  };

  const node = (tag, className, value) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value) element.textContent = value;
    return element;
  };

  const detailsFor = (item) => {
    const title = String(item.title || item.project || item.company || 'Portfolio update');
    const escapedTitle = title.replace(/[\^$.*+?()[\]{}|]/g, '\\$&');
    return {
      category: String(item.category || 'profile'),
      title,
      content: String(item.content || '').replace(new RegExp('^' + escapedTitle + '\\.\\s*', 'i'), ''),
      meta: [item.company, item.role, item.project].filter(Boolean).map(String).slice(0, 5),
      mediaUrl: String(item.mediaUrl || ''),
      tags: []
    };
  };

  const parseManualText = (value) => {
    const tags = [];
    const lines = String(value || '').split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const body = [];
    const inlineBulletPattern = /(?:^|\s)[-*•]\s+(.+?)(?=\s+[-*•]\s+|$)/g;
    lines.forEach((line) => {
      if (/^[-*•]\s+/.test(line)) {
        const tag = line.replace(/^[-*•]\s+/, '').trim();
        if (tag) tags.push(tag);
        return;
      }
      const matches = [...line.matchAll(inlineBulletPattern)];
      if (matches.length) {
        matches.forEach((match) => {
          const tag = String(match[1] || '').trim();
          if (tag) tags.push(tag);
        });
        body.push(line.replace(inlineBulletPattern, ' ').trim());
      } else {
        body.push(line);
      }
    });
    return {
      body: body.join(' ').replace(/^#{1,6}\s+/g, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\x60([^\x60]+)\x60/g, '$1').replace(/\s+/g, ' ').trim(),
      tags
    };
  };

  const technologyCatalog = [
    ['ASP.NET Core', /\basp\.?net core\b/i], ['ASP.NET MVC', /\basp\.?net mvc\b/i], ['ASP.NET', /\basp\.?net\b/i],
    ['.NET Core', /\.net core\b/i], ['.NET', /\.net\b/i], ['C#', /\bc#\b/i], ['Angular', /\bangular\b/i],
    ['TypeScript', /\btypescript\b/i], ['JavaScript', /\bjavascript\b/i], ['jQuery', /\bjquery\b/i], ['AJAX', /\bajax\b/i],
    ['HTML', /\bhtml5?\b/i], ['CSS', /\bcss3?\b/i], ['Bootstrap', /\bbootstrap\b/i], ['Node.js', /\bnode(?:\.js|js)\b/i],
    ['Express.js', /\bexpress(?:\.js|js)\b/i], ['SQL Server', /\bsql server\b/i], ['MongoDB', /\bmongodb\b/i], ['MySQL', /\bmysql\b/i],
    ['PostgreSQL', /\bpostgres(?:ql)?\b/i], ['Redis', /\bredis\b/i], ['EF Core', /\b(?:entity framework core|ef core)\b/i],
    ['Dapper', /\bdapper\b/i], ['ADO.NET', /\bado\.?net\b/i], ['REST APIs', /\brest(?:ful)? api(?:s)?\b/i], ['Web APIs', /\bweb api(?:s)?\b/i],
    ['SOAP', /\bsoap\b/i], ['SignalR', /\bsignalr\b/i], ['WebSockets', /\bwebsocket(?:s)?\b/i], ['JWT', /\bjwt\b/i],
    ['Microservices', /\bmicroservices?\b/i], ['Docker', /\bdocker\b/i], ['Kubernetes', /\bkubernetes\b/i], ['Azure', /\bazure\b/i],
    ['Azure OpenAI', /\bazure openai\b/i], ['OpenAI', /\bopenai\b/i], ['GPT', /\bgpt(?:-\d+)?\b/i], ['React', /\breact(?:\.js)?\b/i],
    ['Flutter', /\bflutter\b/i], ['Python', /\bpython\b/i], ['Java', /\bjava\b/i], ['Git', /\bgit(?:hub|lab)?\b/i],
    ['Jenkins', /\bjenkins\b/i], ['Swagger', /\bswagger\b/i], ['Postman', /\bpostman\b/i], ['Salesforce', /\bsalesforce\b/i]
  ];

  const technologyTags = (text, candidates = []) => {
    const source = String(text || '');
    const found = technologyCatalog.filter(([, pattern]) => pattern.test(source)).map(([label]) => label);
    const candidateTech = candidates.filter((candidate) => technologyCatalog.some(([label, pattern]) => pattern.test(candidate) || label.toLowerCase() === candidate.toLowerCase()));
    const combined = [...new Set([...found, ...candidateTech])];
    return combined.filter((label) => !combined.some((other) => other !== label && other.toLowerCase().includes(label.toLowerCase()))).slice(0, 8);
  };

  const safeMediaUrl = (value) => {
    const candidate = String(value || '').trim();
    if (!candidate) return '';
    try {
      const parsed = new URL(candidate, window.location.origin);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href;
    } catch { /* Ignore invalid media URLs. */ }
    return '';
  };

  const appendProject = (item, details) => {
    const projectGrid = document.querySelector('.project-grid');
    if (!projectGrid) return false;
    const card = node('article', 'project-card dynamic-project-card');
    const number = node('div', 'project-no', 'LIVE / PROJECT');
    const body = node('div', 'project-body');
    body.append(node('p', 'project-kicker', details.meta[0] || 'Portfolio update'), node('h3', '', details.title), node('p', '', details.content));
    const tags = node('ul', 'tag-list');
    details.tags.slice(0, 8).forEach((tag) => tags.append(node('li', '', tag)));
    body.append(tags);
    const mediaUrl = safeMediaUrl(details.mediaUrl);
    if (mediaUrl) {
      const visual = node('div', 'project-visual dynamic-project-media');
      const image = document.createElement('img');
      image.src = mediaUrl;
      image.alt = `${details.title} preview`;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.addEventListener('error', () => visual.remove(), { once: true });
      visual.append(image);
      card.append(number, visual, body);
    } else {
      card.append(number, body);
    }
    projectGrid.append(card);
    return true;
  };

  const appendExperience = (item, details) => {
    const timeline = document.querySelector('.timeline');
    if (!timeline) return false;
    const entry = node('article', 'timeline-item dynamic-timeline-item');
    const date = node('div', 'timeline-date', 'Recently added');
    const marker = node('div', 'timeline-marker');
    marker.append(node('span'));
    const copy = node('div', 'timeline-copy');
    copy.append(node('p', details.meta[0] || 'Professional experience'), node('h3', '', details.title), node('span', '', details.content));
    const tags = node('div', 'timeline-tags');
    details.tags.slice(0, 8).forEach((tag) => tags.append(node('i', '', tag)));
    copy.append(tags);
    entry.append(date, marker, copy, node('b', 'LIVE'));
    timeline.append(entry);
    return true;
  };

  const appendSkill = (item, details) => {
    const expertiseGrid = document.querySelector('.expertise-grid');
    if (!expertiseGrid) return false;
    const card = node('article', 'expertise-card dynamic-expertise-card');
    card.append(node('span', 'expertise-icon', '{ }'), node('p', 'card-index', 'LIVE'), node('h3', '', details.title), node('p', '', details.content));
    const cloud = node('div', 'skill-cloud');
    [details.title, ...details.tags].slice(0, 8).forEach((tag) => cloud.append(node('span', '', tag)));
    card.append(cloud);
    expertiseGrid.append(card);
    return true;
  };

  const appendEducation = (item, details) => {
    const education = document.querySelector('.education');
    if (!education) return false;
    const copy = node('p');
    copy.append(node('strong', '', details.title), document.createElement('br'), document.createTextNode(details.content));
    education.parentElement?.append(node('div', 'education dynamic-education', ''));
    const entry = education.parentElement?.lastElementChild;
    if (!entry) return false;
    entry.append(node('span', '', 'UPDATED'), copy);
    return true;
  };

  const render = (items) => {
    if (!Array.isArray(items) || !items.length) return;
    const fallback = [];
    items.forEach((item) => {
      const details = detailsFor(item);
      const parsedContent = parseManualText(details.content);
      details.content = parsedContent.body || details.content;
      details.tags = Array.isArray(item.stack)
        ? [...new Set(item.stack.map((value) => String(value).trim()).filter(Boolean))].slice(0, 8)
        : technologyTags(details.title + ' ' + details.content, parsedContent.tags);
      const rendered = details.category === 'project' ? appendProject(item, details)
        : details.category === 'experience' ? appendExperience(item, details)
          : details.category === 'skills' ? appendSkill(item, details)
            : details.category === 'education' ? appendEducation(item, details)
              : false;
      if (!rendered) fallback.push({ item, details });
    });
    if (!fallback.length) return;
    const fragment = document.createDocumentFragment();
    fallback.forEach(({ details }) => {
      const card = node('article', 'live-portfolio-card');
      const kicker = node('p', 'live-kicker', categoryLabels[details.category] || 'Portfolio update');
      const heading = node('h3', '', details.title);
      const meta = details.meta.length ? node('p', 'live-meta', details.meta.join(' · ')) : null;
      const body = node('p', 'live-content', details.content || details.title);
      const tags = node('ul', 'live-tags');
      details.tags.slice(0, 6).forEach((tag) => tags.append(node('li', '', tag)));
      card.append(kicker, heading);
      if (meta) card.append(meta);
      card.append(body, tags);
      fragment.append(card);
    });
    grid.replaceChildren(fragment);
    section.hidden = false;
  };

  fetch('/api/portfolio/content', { headers: { accept: 'application/json' }, credentials: 'same-origin' })
    .then((response) => response.ok ? response.json() : null)
    .then((data) => render(data?.items))
    .catch(() => {});
})();
