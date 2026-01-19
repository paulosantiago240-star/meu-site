// script.js - funcionalidades dinâmicas sugeridas
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initSmoothScroll();
  initProjects();       // busca projects.json e renderiza
  initModal();          // cria modal reutilizável
  initContactForm();    // validação básica
  initScrollAnimations();
});

/* ---------------------- Tema claro/escuro ---------------------- */
function initThemeToggle() {
  const btn = document.querySelector('#theme-toggle');
  const stored = localStorage.getItem('theme');
  if (stored) document.documentElement.setAttribute('data-theme', stored);

  if (!btn) return;
  // definir ícone inicial conforme tema armazenado
  const initial = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀' : '🌙';
  btn.textContent = initial;
  btn.setAttribute('aria-pressed', document.documentElement.getAttribute('data-theme') === 'dark');

  btn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    localStorage.setItem('theme', cur);
    btn.setAttribute('aria-pressed', cur === 'dark');
    btn.textContent = cur === 'dark' ? '☀' : '🌙';
  });
}

/* ---------------------- Scroll suave ---------------------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', a.getAttribute('href'));
    });
  });
}

/* ---------------------- Projetos dinâmicos ---------------------- */
async function initProjects() {
  const container = document.querySelector('#projects-list') || findProjectsListFallback();
  if (!container) return;
  try {
    // Primeiro tenta ler JSON embutido no HTML (suporta file://)
    const embedded = document.getElementById('projects-data');
    let projects;
    if (embedded) {
      try {
        projects = JSON.parse(embedded.textContent);
      } catch (e) {
        console.warn('Erro ao parsear projects-data embutido:', e);
      }
    }

    if (!projects) {
      const res = await fetch('projects.json', {cache: "no-store"});
      if (!res.ok) throw new Error('No projects');
      projects = await res.json();
    }
    renderProjects(container, projects);
  } catch (err) {
    console.warn('Não foi possível carregar projects.json — usando conteúdo estático.', err);
  }
}

function findProjectsListFallback() {
  // tenta encontrar a primeira <ul> depois do título "Projetos"
  const headings = Array.from(document.querySelectorAll('h1,h2,h3'));
  const h = headings.find(x => /projeto/i.test(x.textContent));
  if (!h) return document.querySelector('ul');
  let el = h.nextElementSibling;
  while (el) {
    if (el.tagName.toLowerCase() === 'ul' || el.classList.contains('projects')) return el;
    el = el.nextElementSibling;
  }
  return null;
}

function renderProjects(container, projects) {
  container.innerHTML = '';
  projects.forEach((p, i) => {
    const li = document.createElement('li');
    li.className = 'project-item';
    li.innerHTML = `
      <strong>${escapeHtml(p.title)}</strong>
      <p class="short">${escapeHtml(p.short || '')}</p>
      <button class="details" data-idx="${i}">Ver detalhes</button>
    `;
    container.appendChild(li);
  });

  container.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button.details');
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    fetch('projects.json').then(r => r.json()).then(list => showModalFor(list[idx]));
  });
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ---------------------- Modal simples ---------------------- */
function initModal() {
  if (document.querySelector('.js-modal')) return; // já existe
  const modal = document.createElement('div');
  modal.className = 'js-modal modal hidden';
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-body" role="dialog" aria-modal="true">
      <button class="modal-close" aria-label="Fechar">×</button>
      <div class="modal-content"></div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('.modal-close').addEventListener('click', () => modalClose(modal));
  modal.querySelector('.modal-backdrop').addEventListener('click', () => modalClose(modal));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') modalClose(modal); });

  window.showModalFor = (project) => {
    const content = modal.querySelector('.modal-content');
    content.innerHTML = `
      <h2>${escapeHtml(project.title)}</h2>
      <p>${escapeHtml(project.description || project.short || '')}</p>
      ${project.image ? `<img src="${project.image}" alt="${escapeHtml(project.title)}" />` : ''}
      ${project.link ? `<p><a href="${project.link}" target="_blank" rel="noopener">Ver projeto</a></p>` : ''}
    `;
    modal.classList.remove('hidden');
  };

  function modalClose(m) { m.classList.add('hidden'); }
}

/* ---------------------- Formulário de contato (básico) ---------------------- */
function initContactForm() {
  const form = document.querySelector('#contact-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = data.get('name')?.trim();
    const email = data.get('email')?.trim();
    const message = data.get('message')?.trim();
    if (!name || !email || !message) return alert('Preencha todos os campos.');
    if (!validateEmail(email)) return alert('Email inválido.');

    // Exemplo: enviar para Formspree (ou backend próprio)
    const action = form.action || 'https://formspree.io/f/your-form-id';
    try {
      await fetch(action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      alert('Mensagem enviada!');
      form.reset();
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar. Tente novamente mais tarde.');
    }
  });
}

function validateEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/* ---------------------- Animações com IntersectionObserver ---------------------- */
function initScrollAnimations() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) en.target.classList.add('in-view');
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('[data-animate]').forEach(el => {
    el.classList.add('pre-animate');
    io.observe(el);
  });
}