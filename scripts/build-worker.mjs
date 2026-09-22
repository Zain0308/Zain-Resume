import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const distRoot = resolve(projectRoot, 'dist');
const serverRoot = resolve(distRoot, 'server');

const [html, css, mainJs, sceneJs, resume, aiJs, adminKnowledgeJs, adminKnowledgePage, knowledgeSeed, ragRuntime] = await Promise.all([
  readFile(resolve(distRoot, 'index.html'), 'utf8'),
  readFile(resolve(distRoot, 'styles.css'), 'utf8'),
  readFile(resolve(distRoot, 'main.js'), 'utf8'),
  readFile(resolve(distRoot, 'scene.js'), 'utf8'),
  readFile(resolve(distRoot, 'ZainResume.pdf')),
  readFile(resolve(distRoot, 'ai.js'), 'utf8'),
  readFile(resolve(distRoot, 'admin-knowledge.js'), 'utf8'),
  readFile(resolve(projectRoot, 'scripts/admin-knowledge.html'), 'utf8'),
  readFile(resolve(projectRoot, 'scripts/portfolio-knowledge.json'), 'utf8').then(JSON.parse),
  readFile(resolve(projectRoot, 'scripts/rag-runtime.js'), 'utf8')
]);

const adminPage = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>CV Manager — Zain Ali</title>
  <style>
    :root{color-scheme:dark;--bg:#04060d;--panel:#0b1322;--line:rgba(145,188,255,.18);--cyan:#63e4ff;--blue:#4389ff;--muted:#8796ad;--green:#5ff6b0}
    *{box-sizing:border-box}body{min-height:100vh;margin:0;display:grid;place-items:center;padding:24px;color:#f4f8ff;background:radial-gradient(circle at 75% 15%,rgba(67,137,255,.16),transparent 30rem),var(--bg);font-family:Inter,ui-sans-serif,system-ui,sans-serif}.shell{width:min(760px,100%)}.brand{display:flex;align-items:center;gap:12px;margin-bottom:24px;color:#cbd7e7;text-decoration:none}.mark{display:grid;place-items:center;width:42px;height:42px;border:1px solid rgba(99,228,255,.35);border-radius:12px;color:var(--cyan);background:#0b1526;font:800 13px monospace}.brand small{display:block;margin-top:3px;color:#60718a;font:11px monospace}.panel{padding:clamp(24px,5vw,50px);border:1px solid var(--line);border-radius:28px;background:linear-gradient(145deg,rgba(14,24,43,.94),rgba(6,11,21,.92));box-shadow:0 35px 100px rgba(0,0,0,.48)}.eyebrow{margin:0 0 14px;color:var(--cyan);font:700 12px monospace;letter-spacing:.1em;text-transform:uppercase}h1{margin:0;font-size:clamp(2.2rem,7vw,4.5rem);line-height:1;letter-spacing:-.055em}p{color:var(--muted);line-height:1.7}.current{margin:30px 0 18px;padding:18px 20px;border:1px solid var(--line);border-radius:14px;background:rgba(4,10,19,.65)}.current span{display:block;color:#60718a;font:11px monospace;text-transform:uppercase}.current strong{display:block;margin-top:6px;color:#c8d6e8;font-size:14px}.current small{display:block;margin-top:5px;color:#64758e}.drop{position:relative;padding:36px 22px;text-align:center;border:1px dashed rgba(99,228,255,.35);border-radius:18px;background:rgba(7,14,26,.58);cursor:pointer;transition:.2s ease}.drop:hover,.drop:focus-visible,.drop.drag{outline:0;border-color:var(--cyan);background:rgba(44,128,195,.1);box-shadow:0 0 0 3px rgba(99,228,255,.06)}.file-input{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}.drop b{display:block;color:#d3e0ef;font-size:17px}.drop span{display:block;margin-top:8px;color:#61718a;font-size:12px}.browse{position:relative;z-index:2;margin-top:18px;padding:10px 16px;color:#07111c;border:0;border-radius:9px;background:var(--cyan);cursor:pointer;font-weight:800}.file{min-height:24px;margin:14px 0;color:#8193ab;font:12px monospace}.actions{display:flex;gap:10px;margin-top:16px}.button{min-height:50px;padding:0 20px;display:inline-flex;align-items:center;justify-content:center;border:1px solid transparent;border-radius:12px;cursor:pointer;font-weight:750;text-decoration:none}.primary{flex:1;color:#031017;background:linear-gradient(110deg,var(--cyan),var(--blue))}.primary:disabled{cursor:not-allowed;opacity:.45}.secondary{color:#b7c6da;border-color:var(--line);background:rgba(7,14,26,.7)}.status{min-height:60px;margin-top:20px;padding:13px 15px;color:#74869f;border:1px solid var(--line);border-radius:11px;background:#060c17;white-space:pre-wrap;font:12px/1.55 monospace}.status.success{color:var(--green);border-color:rgba(95,246,176,.25)}.status.error{color:#ff8fa5;border-color:rgba(255,110,140,.25)}.note{margin:18px 0 0;color:#5e6e85;font-size:12px}@media(max-width:520px){.actions{flex-direction:column}.panel{border-radius:22px}}
  </style>
</head>
<body>
  <main class="shell">
    <a class="brand" href="/"><span class="mark">ZA</span><span>Zain Ali<small>SECURE CV MANAGER</small></span></a>
    <section class="panel">
      <p class="eyebrow">Owner-only workspace</p>
      <h1>Update your résumé.</h1>
      <p>Upload a new PDF here. Once saved, every Download Résumé button on your portfolio will use the latest version automatically.</p>
      <div class="current"><span>Current résumé</span><strong id="currentName">Loading...</strong><small id="currentDate"></small></div>
      <div class="drop" id="dropZone" role="button" tabindex="0" aria-label="Drop a PDF or browse for a résumé file">
        <input class="file-input" id="resumeFile" type="file" accept="application/pdf,.pdf" aria-label="Choose résumé PDF" />
        <b>Drop your PDF here</b><span>PDF only · Maximum 8 MB</span>
        <button class="browse" id="browseButton" type="button">Browse PDF</button>
      </div>
      <div class="file" id="selectedFile">No new file selected.</div>
      <div class="actions"><button class="button primary" id="uploadButton" type="button" disabled>Replace current résumé</button><a class="button secondary" href="/ZainResume.pdf" target="_blank">View current PDF</a></div>
      <pre class="status" id="status">Ready for a new résumé.</pre>
      <p class="note">Only the signed-in portfolio owner can access this page or upload files.</p>
    </section>
  </main>
  <script>
    const input=document.querySelector('#resumeFile');const drop=document.querySelector('#dropZone');const browse=document.querySelector('#browseButton');const button=document.querySelector('#uploadButton');const status=document.querySelector('#status');const selected=document.querySelector('#selectedFile');let file=null;
    const setStatus=(message,type='')=>{status.textContent=message;status.className='status '+type};
    const choose=(candidate)=>{file=candidate||null;if(!file){selected.textContent='No new file selected.';button.disabled=true;return}const valid=file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf');if(!valid){file=null;selected.textContent='Please choose a PDF file.';button.disabled=true;setStatus('Unsupported file type. Only PDF files are accepted.','error');return}if(file.size>8*1024*1024){file=null;selected.textContent='The selected file is larger than 8 MB.';button.disabled=true;setStatus('File too large. Please use a PDF under 8 MB.','error');return}selected.textContent=file.name+' · '+(file.size/1024/1024).toFixed(2)+' MB';button.disabled=false;setStatus('PDF validated. Ready to upload.');};
    input.addEventListener('change',()=>choose(input.files?.[0]));browse.addEventListener('click',event=>{event.stopPropagation();input.click()});drop.addEventListener('click',()=>input.click());drop.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();input.click()}});['dragenter','dragover','dragleave','drop'].forEach(name=>document.addEventListener(name,event=>event.preventDefault()));['dragenter','dragover'].forEach(name=>drop.addEventListener(name,event=>{event.preventDefault();event.stopPropagation();drop.classList.add('drag')}));['dragleave','drop'].forEach(name=>drop.addEventListener(name,event=>{event.preventDefault();event.stopPropagation();drop.classList.remove('drag')}));drop.addEventListener('drop',event=>choose(event.dataTransfer?.files?.[0]));
    async function loadInfo(){try{const response=await fetch('/api/admin/resume',{cache:'no-store'});if(!response.ok)throw new Error('Unable to load résumé details.');const data=await response.json();document.querySelector('#currentName').textContent=data.name||'Zain-Ali-Resume.pdf';document.querySelector('#currentDate').textContent=data.uploadedAt?'Updated '+new Date(data.uploadedAt).toLocaleString():'Original portfolio résumé';}catch(error){setStatus(error.message,'error')}}
    button.addEventListener('click',async()=>{if(!file)return;button.disabled=true;setStatus('Uploading résumé...\\nValidating PDF...');try{const response=await fetch('/api/admin/resume',{method:'POST',headers:{'content-type':'application/pdf','x-file-name':encodeURIComponent(file.name)},body:file});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Upload failed.');setStatus('POST /api/admin/resume\\n201 CREATED\\nLatest résumé is now live ✓','success');file=null;input.value='';selected.textContent='No new file selected.';await loadInfo();}catch(error){setStatus(error.message,'error');button.disabled=false;}});loadInfo();
  </script>
</body>
</html>`;

const workerSource = `const assets = ${JSON.stringify({
  '/': { body: html, type: 'text/html; charset=utf-8' },
  '/index.html': { body: html, type: 'text/html; charset=utf-8' },
  '/styles.css': { body: css, type: 'text/css; charset=utf-8' },
  '/main.js': { body: mainJs, type: 'text/javascript; charset=utf-8' },
  '/scene.js': { body: sceneJs, type: 'text/javascript; charset=utf-8' },
  '/ai.js': { body: aiJs, type: 'text/javascript; charset=utf-8' },
  '/admin-knowledge.js': { body: adminKnowledgeJs, type: 'text/javascript; charset=utf-8' }
})};
const adminPage = ${JSON.stringify(adminPage)};
const adminKnowledgePage = ${JSON.stringify(adminKnowledgePage)};
const defaultKnowledgeSeed = ${JSON.stringify(knowledgeSeed)};
${ragRuntime}
const fallbackResumeBase64 = ${JSON.stringify(resume.toString('base64'))};
const resumeKey = 'portfolio/current-resume.pdf';
const maxUploadBytes = 8 * 1024 * 1024;

function securityHeaders(extra = {}) {
  return {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'SAMEORIGIN',
    'referrer-policy': 'strict-origin-when-cross-origin',
    ...extra
  };
}

function isAdmin(request, env) {
  const email = request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
  const allowed = String(env.ADMIN_EMAIL || '').trim().toLowerCase();
  return Boolean(email && allowed && email === allowed);
}

function forbiddenPage() {
  return new Response('<!doctype html><meta name="viewport" content="width=device-width"><title>Access denied</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;color:#dbe8f8;background:#050812;font-family:system-ui"><main style="max-width:520px;padding:32px;text-align:center"><h1>Owner access required</h1><p style="color:#8493aa;line-height:1.6">Open this page while signed in with the portfolio owner account.</p><a href="/" style="color:#63e4ff">Return to portfolio</a></main>', { status: 403, headers: securityHeaders({ 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }) });
}

function decodeFallbackResume() {
  const binary = atob(fallbackResumeBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function resumeResponse(request, env) {
  let object = null;
  try { object = env.BUCKET ? await env.BUCKET.get(resumeKey) : null; } catch { object = null; }
  const headers = securityHeaders({
    'content-type': 'application/pdf',
    'content-disposition': 'attachment; filename="Zain-Ali-Resume.pdf"',
    'cache-control': 'no-store, max-age=0'
  });
  if (request.method === 'HEAD') return new Response(null, { headers });
  return new Response(object ? object.body : decodeFallbackResume(), { headers });
}

async function resumeInfo(env) {
  let object = null;
  try { object = env.BUCKET ? await env.BUCKET.head(resumeKey) : null; } catch { object = null; }
  return {
    name: object?.customMetadata?.originalName || 'Zain-Ali-Resume.pdf',
    uploadedAt: object?.customMetadata?.uploadedAt || null,
    size: object?.size || null
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const knowledgeResponse = await handleKnowledgeRequest(request, env);
    if (knowledgeResponse) return knowledgeResponse;

    if ((path === '/ZainResume.pdf' || path === '/resume') && (request.method === 'GET' || request.method === 'HEAD')) {
      return resumeResponse(request, env);
    }

    if (path === '/manage-cv' && request.method === 'GET') {
      if (!isAdmin(request, env)) return forbiddenPage();
      return Response.redirect(new URL('/admin/knowledge', request.url), 302);
    }

    if (path === '/api/admin/resume') {
      if (!isAdmin(request, env)) return Response.json({ error: 'Owner access required.' }, { status: 403, headers: securityHeaders({ 'cache-control': 'no-store' }) });
      if (request.method === 'GET') return Response.json(await resumeInfo(env), { headers: securityHeaders({ 'cache-control': 'no-store' }) });
      if (request.method === 'POST') return Response.json({ error: 'Upload your résumé through /admin/knowledge so the AI knowledge index updates with it.' }, { status: 410, headers: securityHeaders({ 'cache-control': 'no-store' }) });
      return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, POST' } });
    }

    const asset = assets[path];
    if (asset && request.method === 'GET') {
      const isAppAsset = /\.(?:js|css)$/.test(path);
      return new Response(asset.body, { headers: securityHeaders({ 'content-type': asset.type, 'cache-control': path === '/' || path === '/index.html' || isAppAsset ? 'no-cache' : 'public, max-age=3600' }) });
    }
    return new Response('Not found', { status: 404, headers: securityHeaders({ 'content-type': 'text/plain; charset=utf-8' }) });
  }
};
`;

await mkdir(serverRoot, { recursive: true });
await writeFile(resolve(serverRoot, 'index.js'), workerSource, 'utf8');
console.log(`Built Worker at ${resolve(serverRoot, 'index.js')}`);
