/* ============================================================
   AGRAJ PORTFOLIO — script.js (vanilla JS, no libraries)
   What this file does:
   1. Mobile menu + navbar + scroll effects
   2. Fade-in animation on scroll
   3. Contact form handling
   4. OWNER MODE + Add Project with IndexedDB (images stay after refresh)
============================================================ */

// ---------- 1. Year + scroll progress ----------
document.getElementById('year').textContent = new Date().getFullYear();

const progressBar = document.getElementById('progressBar');
window.addEventListener('scroll', () => {
  const h = document.documentElement;
  const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
  progressBar.style.width = pct + '%';
}, { passive: true });

// ---------- 2. Mobile hamburger menu ----------
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('show');
  hamburger.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', open);
});
// Close menu when a link is clicked
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  mobileMenu.classList.remove('show');
  hamburger.classList.remove('open');
}));

// ---------- 3. Active nav link on scroll ----------
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');
window.addEventListener('scroll', () => {
  let current = 'home';
  sections.forEach(s => {
    if (scrollY >= s.offsetTop - 120) current = s.id;
  });
  navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
}, { passive: true });

// ---------- 4. Fade-in animation (IntersectionObserver) ----------
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      // Animate skill bars when visible
      const fill = e.target.querySelector?.('.fill');
      if (fill) fill.style.width = fill.style.getPropertyValue('--w');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
// Fallback: animate any bars already in view
document.querySelectorAll('.fill').forEach(f => {
  if (f.getBoundingClientRect().top < innerHeight) f.style.width = f.style.getPropertyValue('--w');
});

// ---------- 5. Toast helper (small popup message) ----------
const toast = document.getElementById('toast');
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.hidden = true, 2800);
}

// ---------- 6. Contact form (opens WhatsApp with message) ----------
const form = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');
form.addEventListener('submit', (e) => {
  e.preventDefault(); // stop page reload
  const name = document.getElementById('cName').value.trim();
  const email = document.getElementById('cEmail').value.trim();
  const msg = document.getElementById('cMsg').value.trim();

  if (!name || !email || !msg) {
    formNote.textContent = '⚠️ Please fill name, email and message.';
    formNote.className = 'form-note err';
    return;
  }
  if (!email.includes('@')) {
    formNote.textContent = '⚠️ Please enter a valid email.';
    formNote.className = 'form-note err';
    return;
  }
  // Success: show note + open WhatsApp with pre-filled text
  formNote.textContent = '✅ Thanks ' + name + '! Opening WhatsApp…';
  formNote.className = 'form-note ok';
  showToast('Message ready — sending via WhatsApp ✓');
  const text = encodeURIComponent(`Hi Agraj! I'm ${name} (${email}). ${msg}`);
  setTimeout(() => window.open(`https://wa.me/917302705904?text=${text}`, '_blank'), 800);
  form.reset();
});

/* ============================================================
   7. OWNER MODE (#admin)
   - Add + Delete buttons are hidden by default (CSS .admin-only)
   - They appear ONLY when URL ends with #admin
   - Example: yoursite.com/#admin
============================================================ */
function checkOwnerMode() {
  const isOwner = location.hash === '#admin';
  document.body.classList.toggle('owner-mode', isOwner);
  // Re-apply delete-button visibility for existing cards
  document.querySelectorAll('.delete-btn').forEach(b => {
    b.hidden = !isOwner;
  });
}
window.addEventListener('hashchange', checkOwnerMode);

/* ============================================================
   8. IndexedDB setup (saves images even after refresh)
   Why IndexedDB and not localStorage?
   -> localStorage can only store text (~5MB). IndexedDB can store
      image files (Blobs) of many MBs.
============================================================ */
const DB_NAME = 'AgrajPortfolioDB';
const STORE = 'projects';
let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      // Create table on first run
      req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => { db = req.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });
}
function dbAdd(project) {
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add(project).onsuccess = (e) => res(e.target.result);
    tx.onerror = () => rej(tx.error);
  });
}
function dbGetAll() {
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => res(req.result || []);
    req.onerror = () => rej(req.error);
  });
}
function dbDelete(id) {
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id).onsuccess = res;
    tx.onerror = () => rej(tx.error);
  });
}

// ---------- 9. Render a project card ----------
const grid = document.getElementById('projectGrid');

function createCard({ id, title, description, link, imageURL, isCustom }) {
  const card = document.createElement('article');
  card.className = 'project-card reveal visible';
  card.dataset.id = id ?? '';

  card.innerHTML = `
    <div class="p-img">
      <img src="${imageURL}" alt="${title} preview" loading="lazy" />
      <span class="p-tag">${isCustom ? 'New' : 'Featured'}</span>
    </div>
    <div class="p-body">
      <h3></h3>
      <p></p>
      <div class="p-foot">
        ${link ? `<a class="p-link" href="${link}" target="_blank" rel="noopener">Live Demo →</a>` : `<a class="p-link" href="#contact">Enquire →</a>`}
        <span class="p-stack">HTML • CSS • JS</span>
      </div>
    </div>
    <button class="delete-btn" aria-label="Delete project" hidden>✕</button>
  `;
  // Use textContent to avoid HTML injection from user input
  card.querySelector('h3').textContent = title;
  card.querySelector('p').textContent = description;

  // Delete button (owner only)
  const del = card.querySelector('.delete-btn');
  del.hidden = !document.body.classList.contains('owner-mode');
  del.addEventListener('click', async () => {
    if (!confirm(`Delete "${title}"?`)) return;
    if (isCustom && id != null) await dbDelete(id); // remove from IndexedDB
    else card.remove(), showToast('Demo card hidden for this view (refresh to restore)');
    card.remove();
    showToast('Project deleted 🗑️');
  });

  // Custom (saved) cards go on top
  if (isCustom) grid.prepend(card);
  else grid.appendChild(card);
  return card;
}

// ---------- 10. "+ Add New" flow ----------
const addBtn = document.getElementById('addProjectBtn');
const fileInput = document.getElementById('fileInput');
const modal = document.getElementById('projectModal');
const previewRow = document.getElementById('previewRow');
const fileCountText = document.getElementById('fileCountText');
const pTitle = document.getElementById('pTitle');
const pDesc = document.getElementById('pDesc');
const pLink = document.getElementById('pLink');
let pickedFiles = []; // holds File objects chosen from explorer
let previewURLs = [];

// Click "+ Add New" -> open computer file explorer
addBtn.addEventListener('click', () => fileInput.click());

// After files chosen -> show modal asking title/desc/link
fileInput.addEventListener('change', () => {
  pickedFiles = [...fileInput.files].filter(f => f.type.startsWith('image/'));
  if (!pickedFiles.length) { showToast('No image selected'); return; }

  // Show thumbnails preview
  previewURLs.forEach(u => URL.revokeObjectURL(u));
  previewURLs = pickedFiles.map(f => URL.createObjectURL(f));
  previewRow.innerHTML = '';
  previewURLs.forEach(u => {
    const img = document.createElement('img');
    img.src = u; img.alt = 'Selected preview';
    previewRow.appendChild(img);
  });
  fileCountText.textContent = `${pickedFiles.length} image${pickedFiles.length > 1 ? 's' : ''} selected — one card per image`;
  pTitle.value = ''; pDesc.value = ''; pLink.value = '';
  modal.hidden = false;
  pTitle.focus();
});

// Modal buttons
document.getElementById('modalCancel').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
function closeModal() {
  modal.hidden = true;
  fileInput.value = ''; // allow picking same file again
}

// Save -> store each image + details in IndexedDB, then show cards
document.getElementById('modalSave').addEventListener('click', async () => {
  const title = pTitle.value.trim();
  const desc = pDesc.value.trim();
  const link = pLink.value.trim();

  if (!title || !desc) { showToast('⚠️ Add a title + short description'); return; }

  for (let i = 0; i < pickedFiles.length; i++) {
    const file = pickedFiles[i];
    const numberedTitle = pickedFiles.length > 1 ? `${title}${i === 0 ? '' : ' — ' + (i + 1)}` : title;
    // Save Blob (image) + text in IndexedDB
    const id = await dbAdd({ title: numberedTitle, description: desc, link, image: file, createdAt: Date.now() });
    const url = URL.createObjectURL(file);
    createCard({ id, title: numberedTitle, description: desc, link, imageURL: url, isCustom: true });
  }
  closeModal();
  showToast(`✅ ${pickedFiles.length} project${pickedFiles.length > 1 ? 's' : ''} added!`);
  document.getElementById('projects').scrollIntoView({ behavior: 'smooth' });
});

// ---------- 11. Load saved projects on start ----------
(async function init() {
  checkOwnerMode();
  try {
    await openDB();
    const saved = await dbGetAll();
    // Newest first
    saved.sort((a, b) => b.createdAt - a.createdAt).forEach(p => {
      const url = URL.createObjectURL(p.image); // Blob -> viewable image
      createCard({ id: p.id, title: p.title, description: p.description, link: p.link, imageURL: url, isCustom: true });
    });
    if (saved.length && document.body.classList.contains('owner-mode')) {
      showToast(`🔓 Owner mode: ${saved.length} saved project(s) loaded`);
    }
  } catch (err) {
    console.warn('IndexedDB not available:', err);
  }
})();
