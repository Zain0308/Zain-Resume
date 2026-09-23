const knowledgeRateWindows = new Map();
const knowledgeSseEncoder = new TextEncoder();

function knowledgeJson(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: securityHeaders({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }) });
}

function knowledgeAdminReady(env) {
  return Boolean(env.NVIDIA_NIM_API_KEY && env.SUPABASE_URL && (env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY) && env.KNOWLEDGE_ADMIN_TOKEN);
}

function knowledgeIntegrationReady(env) {
  return Boolean(env.NVIDIA_NIM_API_KEY && env.SUPABASE_URL && (env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY));
}

function knowledgeText(value, maximum = 1200) {
  return String(value || '').normalize('NFKC').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maximum);
}

function knowledgeContent(value, maximum = 8000) {
  return String(value || '').normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maximum);
}

// The original portfolio content is kept as a small editable catalogue. Edits are
// stored as manual override chunks, so the static page remains the safe fallback
// and an owner can restore any hidden item without touching the source HTML.
const portfolioCatalog = [
  { contentKey: 'profile:name', category: 'profile', title: 'Zain Ali', content: 'Portfolio display name.' },
  { contentKey: 'profile:role', category: 'profile', title: 'Full Stack .NET Developer', content: 'Primary professional title shown across the portfolio.' },
  { contentKey: 'profile:intro', category: 'profile', title: 'Professional introduction', content: 'Full Stack .NET Software Engineer building enterprise, FinTech, API, real-time and AI-powered applications.' },
  { contentKey: 'education:degree', category: 'education', title: 'BS Information Technology', institution: 'Sindh Agriculture University · Software Architecture & Project Management', startDate: '2018-01-01', endDate: '2022-01-01', content: 'Formal education in information technology, software architecture and project management.' },
  { contentKey: 'project:juba-express', category: 'project', title: 'Cross-border payments engineered for trust.', company: 'Juba Express · Production platform', project: 'Juba Express', content: 'Secure remittance workflows integrating Mastercard payment gateways, banking APIs, real-time updates, and resilient backend services.', stack: ['.NET Core', 'Angular', 'Banking APIs', 'SQL Server'] },
  { contentKey: 'project:agentic-ai', category: 'project', title: 'AI agents that turn support data into action.', company: 'Enterprise customer experience', project: 'Agentic AI', content: 'Customer-support agents connecting chat, voice, authentication, account verification, order information, Salesforce, and workflow automation.', stack: ['Azure OpenAI', 'GPT-4', 'Web APIs'] },
  { contentKey: 'project:ibex-messenger', category: 'project', title: 'Real-time conversations, secured end to end.', company: 'IBEX Messenger', project: 'IBEX Messenger', content: 'A scalable messaging backend with WebSockets, authentication, live events, and AI-ready service integrations.', stack: ['Node.js', 'WebSockets', 'JWT', 'MongoDB'] },
  { contentKey: 'project:reflecx', category: 'project', title: 'Complex CX data, made decision-ready.', company: 'RefleCX.io', project: 'RefleCX.io', content: 'Reporting and analytics infrastructure for large-scale data processing, real-time CX insights, complex APIs, aggregation, performance, and scalability.', stack: ['ASP.NET', 'Angular', 'Reporting', 'Enterprise APIs'] },
  { contentKey: 'project:fougito', category: 'project', title: 'Restaurant & garage management system.', company: 'Fougito', project: 'Fougito', content: 'Backend APIs, frontend development, POS integration, order management, real-time analytics, and a launched mobile application.', stack: ['Web APIs', 'POS', 'Analytics', 'Full Stack'] },
  { contentKey: 'project:inventory', category: 'project', title: 'Stock control with secure role-based access.', company: 'Inventory Management System', project: 'Inventory Management System', content: 'Inventory tracking, stock management, reporting, authentication, and role-based access control.', stack: ['.NET Core', 'SQL Server', 'Bootstrap', 'jQuery'] },
  { contentKey: 'skill:backend', category: 'skills', title: 'Backend & Architecture', content: 'Scalable, secure application foundations designed for maintainability and real-world load.', stack: ['ASP.NET Core', 'C#', '.NET MVC', 'Web API', 'EF Core', 'Dapper', 'ADO.NET', 'Microservices', 'REST', 'SOAP', 'SignalR', 'Node.js', 'Express.js'] },
  { contentKey: 'skill:frontend', category: 'skills', title: 'Frontend Engineering', content: 'Responsive product experiences where complex workflows remain clear, fast, and usable.', stack: ['Angular', 'TypeScript', 'JavaScript', 'jQuery', 'AJAX', 'Bootstrap'] },
  { contentKey: 'skill:data-ai', category: 'skills', title: 'Data, AI & Integrations', content: 'Connecting platforms, payment providers, intelligence, and data with resilient contracts.', stack: ['SQL Server', 'MongoDB', 'MySQL', 'Agentic AI', 'Azure OpenAI', 'AI Automation', 'Salesforce', 'Payment APIs'] },
  { contentKey: 'experience:juba-express', category: 'experience', title: 'Full Stack Developer', company: 'Juba Express', role: 'Full Stack Developer', content: 'FinTech · payment infrastructure · production systems', startDate: '2025-02-01', endDate: '', stack: ['ASP.NET Core', 'Angular', 'Banking APIs', 'SQL Optimization', 'Deployments'] },
  { contentKey: 'experience:ibex-global', category: 'experience', title: 'Software Engineer', company: 'IBEX Global PVT', role: 'Software Engineer', content: 'Agentic AI · real-time messaging · CX analytics', startDate: '2023-03-01', endDate: '2025-01-01', stack: ['ASP.NET Core', 'Angular', 'MongoDB', 'Azure OpenAI', 'WebSockets', 'Salesforce'] },
  { contentKey: 'experience:technomites', category: 'experience', title: '.NET Core Developer', company: 'Technomites', role: '.NET Core Developer', content: 'Web applications · APIs · business systems', startDate: '2022-01-01', endDate: '2023-02-01', stack: ['ASP.NET Core MVC', 'Angular', 'jQuery', 'Payment Gateways', 'Microservices'] },
  { contentKey: 'experience:bdo', category: 'experience', title: 'Junior .NET Developer', company: 'BDO Pakistan', role: 'Junior .NET Developer', content: 'Web applications · backend development · technical support', startDate: '2021-06-01', endDate: '2022-01-01', stack: ['ASP.NET MVC', 'SQL Server', 'AJAX', 'jQuery DataTables', 'Optimization'] },
  { contentKey: 'site:hero-eyebrow', category: 'site', title: 'Hero eyebrow', siteValue: 'Software Engineer · Karachi, Pakistan', content: 'Hero section location and professional label.' },
  { contentKey: 'site:hero-experience', category: 'site', title: 'Hero experience line', siteValue: '5 Years of Software Development Experience', content: 'Experience highlight shown below the hero name.' },
  { contentKey: 'site:hero-typing-lines', category: 'site', title: 'Hero rotating lines', siteValue: 'Building scalable REST APIs...\nDeveloping enterprise .NET applications...\nIntegrating banking & payment APIs...\nBuilding modern Angular applications...\nDeveloping AI-powered solutions...\nOptimizing production systems...', content: 'One rotating line per row for the hero terminal.' },
  { contentKey: 'site:hero-button-explore', category: 'site', title: 'Explore button', siteValue: 'Explore my work', content: 'Hero primary button label.' },
  { contentKey: 'site:hero-button-projects', category: 'site', title: 'Projects button', siteValue: 'View projects', content: 'Hero projects button label.' },
  { contentKey: 'site:hero-button-resume', category: 'site', title: 'Résumé button', siteValue: 'Download résumé', content: 'Hero résumé button label.' },
  { contentKey: 'site:hero-button-contact', category: 'site', title: 'Contact button', siteValue: 'Contact me', content: 'Hero contact button label.' },
  { contentKey: 'site:hero-stack', category: 'site', title: 'Hero technology chips', siteValue: '.NET Core\nC#\nAngular\nNode.js\nSQL\nAzure AI', content: 'One core technology per row.' },
  { contentKey: 'site:scene-workspace', category: 'site', title: '3D workspace name', siteValue: 'DEV_WORKSPACE.OS', content: '3D workspace chrome label.' },
  { contentKey: 'site:scene-status', category: 'site', title: '3D workspace status', siteValue: 'SYSTEM ONLINE', content: '3D workspace status label.' },
  { contentKey: 'site:scene-api', category: 'site', title: '3D API label', siteValue: 'API GATEWAY', content: '3D API scene label.' },
  { contentKey: 'site:scene-data', category: 'site', title: '3D data label', siteValue: 'LIVE DATA', content: '3D data scene label.' },
  { contentKey: 'site:scene-hint', category: 'site', title: '3D scene hint', siteValue: 'Move to explore', content: '3D scene hint.' },
  { contentKey: 'site:metric:years', category: 'site', title: 'Years metric', siteValue: '5|Years building|production systems', content: 'First career metric.' },
  { contentKey: 'site:metric:companies', category: 'site', title: 'Companies metric', siteValue: '4|Companies across|software & fintech', content: 'Second career metric.' },
  { contentKey: 'site:metric:products', category: 'site', title: 'Products metric', siteValue: '6|Featured products|and platforms', content: 'Third career metric.' },
  { contentKey: 'site:metric:domains', category: 'site', title: 'Domains metric', siteValue: '3|Core domains:|FinTech, AI & APIs', content: 'Fourth career metric.' },
  { contentKey: 'site:about-eyebrow', category: 'site', title: 'About eyebrow', siteValue: 'About me', content: 'About section eyebrow.' },
  { contentKey: 'site:about-heading', category: 'site', title: 'About heading', siteValue: 'I engineer complete systems, not isolated features.', content: 'Main About section heading.' },
  { contentKey: 'site:about-summary', category: 'site', title: 'About summary', siteValue: 'Zain Ali is a Full Stack .NET Software Engineer with 5 years of experience developing enterprise and FinTech applications.', content: 'First About section paragraph.' },
  { contentKey: 'site:about-details', category: 'site', title: 'About details', siteValue: 'My work connects ASP.NET Core, C#, Angular, SQL Server, MongoDB, banking and payment APIs, production support, performance optimization, and AI-powered applications.', content: 'Second About section paragraph.' },
  { contentKey: 'site:about-principles', category: 'site', title: 'About principles', siteValue: 'Backend engineering & REST APIs\nFinTech & payment integrations\nAI-enabled enterprise workflows', content: 'One principle per row.' },
  { contentKey: 'site:fintech-eyebrow', category: 'site', title: 'FinTech eyebrow', siteValue: 'Current focus · Juba Express', content: 'FinTech section eyebrow.' },
  { contentKey: 'site:fintech-heading', category: 'site', title: 'FinTech heading', siteValue: 'FinTech architecture built for production.', content: 'FinTech section heading.' },
  { contentKey: 'site:fintech-summary', category: 'site', title: 'FinTech summary', siteValue: 'Full Stack Developer · Feb 2025 — Present. Building enterprise payment and remittance applications across user interfaces, services, integrations, data, and deployments.', content: 'FinTech section summary.' },
  { contentKey: 'site:fintech-security', category: 'site', title: 'FinTech security note', siteValue: 'Conceptual architecture — no customer data or credentials displayed.', content: 'FinTech security note.' },
  { contentKey: 'site:fintech-ownership-label', category: 'site', title: 'FinTech ownership label', siteValue: 'FULL-STACK OWNERSHIP', content: 'FinTech ownership card label.' },
  { contentKey: 'site:fintech-ownership-heading', category: 'site', title: 'FinTech ownership heading', siteValue: 'From application screens to post-deployment validation.', content: 'FinTech ownership card heading.' },
  { contentKey: 'site:fintech-responsibilities', category: 'site', title: 'FinTech responsibilities', siteValue: 'Business modules & dashboards\nReports & application screens\nMastercard payment gateway\nBanking API integrations\nPayment & remittance services\nRESTful APIs\nProduction issue investigation\nClient support\nDeployments & validation\nSQL/backend optimization\nCode reviews', content: 'One responsibility per row.' },
  { contentKey: 'site:ai-eyebrow', category: 'site', title: 'AI eyebrow', siteValue: 'AI & automation', content: 'AI section eyebrow.' },
  { contentKey: 'site:ai-heading', category: 'site', title: 'AI heading', siteValue: 'Intelligence connected to real workflows.', content: 'AI section heading.' },
  { contentKey: 'site:ai-body', category: 'site', title: 'AI description', siteValue: 'I have developed Agentic AI customer-support solutions for chat and voice workflows involving customer queries, authentication, account verification, order information, Salesforce, and business automation.', content: 'AI section description.' },
  { contentKey: 'site:ai-stack', category: 'site', title: 'AI technology chips', siteValue: 'Azure OpenAI\nGPT-4\nAgentic AI\nSalesforce\nEnterprise APIs', content: 'One AI technology per row.' },
  { contentKey: 'site:projects-eyebrow', category: 'site', title: 'Projects eyebrow', siteValue: 'Featured projects', content: 'Projects section eyebrow.' },
  { contentKey: 'site:projects-heading', category: 'site', title: 'Projects heading', siteValue: 'Systems with depth, purpose and impact.', content: 'Projects section heading.' },
  { contentKey: 'site:projects-intro', category: 'site', title: 'Projects intro', siteValue: 'From regulated payment flows to AI support agents, I design the architecture behind dependable digital products.', content: 'Projects section introduction.' },
  { contentKey: 'site:skills-eyebrow', category: 'site', title: 'Skills eyebrow', siteValue: 'My developer arsenal', content: 'Skills section eyebrow.' },
  { contentKey: 'site:skills-heading', category: 'site', title: 'Skills heading', siteValue: 'Across the stack. Strong at the core.', content: 'Skills section heading.' },
  { contentKey: 'site:skills-intro', category: 'site', title: 'Skills intro', siteValue: 'I connect clean interfaces to robust APIs, data layers, cloud services, and delivery pipelines.', content: 'Skills section introduction.' },
  { contentKey: 'site:orbit:csharp', category: 'site', title: 'C# orbit label', siteValue: 'C#|Backend Development', content: 'Technology orbit label and category.' },
  { contentKey: 'site:orbit:angular', category: 'site', title: 'Angular orbit label', siteValue: 'Angular|Frontend Development', content: 'Technology orbit label and category.' },
  { contentKey: 'site:orbit:sql', category: 'site', title: 'SQL Server orbit label', siteValue: 'SQL Server|Database Engineering', content: 'Technology orbit label and category.' },
  { contentKey: 'site:orbit:mongo', category: 'site', title: 'MongoDB orbit label', siteValue: 'MongoDB|Database Engineering', content: 'Technology orbit label and category.' },
  { contentKey: 'site:orbit:api', category: 'site', title: 'REST API orbit label', siteValue: 'REST API|API Architecture', content: 'Technology orbit label and category.' },
  { contentKey: 'site:orbit:azure', category: 'site', title: 'Azure AI orbit label', siteValue: 'Azure AI|AI & Cloud', content: 'Technology orbit label and category.' },
  { contentKey: 'site:skills-help', category: 'site', title: 'Technology orbit helper', siteValue: 'Hover or focus a technology to inspect its category.', content: 'Technology orbit helper text.' },
  { contentKey: 'site:tools-marquee', category: 'site', title: 'Tools marquee', siteValue: 'GitHub Actions\nJenkins\nAzure\nIIS\nSwagger\nPostman\nAgile / Scrum\nUnit Testing\nDesign Patterns', content: 'One delivery tool per row.' },
  { contentKey: 'site:experience-eyebrow', category: 'site', title: 'Experience eyebrow', siteValue: 'Experience', content: 'Experience section eyebrow.' },
  { contentKey: 'site:experience-heading', category: 'site', title: 'Experience heading', siteValue: 'A track record of shipping software.', conten