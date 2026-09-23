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
  let roleLines = [
    'Building scalable REST APIs...',
    'Developing enterprise .NET applications...',
    'Integrating banking & payment APIs...',
    'Building modern Angular applications...',
    'Developing AI-powered solutions...',
    'Optimizing production systems...'
  ];
  window.__setPortfolioTypingLines = (value) => {
    const lines = String(value || '').split(/\n+/).map((line) => line.trim()).filter(Boolean).slice(0, 12);
    if (lines.length) roleLines = lines;
  };
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

    const networkMotion = document.documentElement.dataset.portfolioNetwork || 'full';
    if (networkMotion !== 'off' && !prefersReducedMotion) {
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

    if (networkMotion !== 'off' && !prefersReducedMotion && links.length) {
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
 