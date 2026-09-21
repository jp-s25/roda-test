/* RODÁ — 17 Semanas Creando una Empresa · Digital Edition 2026 */
const CONFIG = {
  pdf: 'revista.pdf',   // Opción A: colocá tu PDF junto a index.html
  pages: [],            // Opción B: imágenes, p. ej. ['pages/page-01.jpg', 'pages/page-02.jpg', ...]
  shareText: '17 Semanas Creando una Empresa — la revista digital de Rodá EJ 2026.',
};

const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pad = n => String(n).padStart(2, '0');
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';

let pdf = null, N = 0, ratio = 0.707, single = false, pw = 0, L = 0, max = 0, cur = 0;
let leaves = [], faces = [], lock = false, z = 1, px = 0, py = 0, ready;

/* ---------- Carga ---------- */
async function load(src) {
  if (CONFIG.pages.length && !src) {
    N = CONFIG.pages.length;
    const i = new Image(); i.src = CONFIG.pages[0]; await i.decode();
    ratio = i.naturalWidth / i.naturalHeight; return;
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js';
  pdf = await pdfjsLib.getDocument(src || CONFIG.pdf).promise;
  N = pdf.numPages;
  const v = (await pdf.getPage(1)).getViewport({ scale: 1 });
  ratio = v.width / v.height;
}

async function fill(p, host, w) {                 // renderiza una página solo cuando hace falta
  if (host.dataset.s) return; host.dataset.s = 1;
  try {
    if (pdf) {
      const pg = await pdf.getPage(p + 1), v0 = pg.getViewport({ scale: 1 }), v = pg.getViewport({ scale: w / v0.width });
      const c = document.createElement('canvas'); c.width = v.width; c.height = v.height;
      await pg.render({ canvasContext: c.getContext('2d'), viewport: v }).promise; host.append(c);
    } else {
      const i = new Image(); i.src = CONFIG.pages[p]; await i.decode(); host.append(i);
    }
    host.classList.add('ok');
  } catch (e) { console.warn('Página', p + 1, e); host.dataset.s = ''; }
}

/* ---------- Libro ---------- */
const page = p => faces[p] || (faces[p] = Object.assign(document.createElement('div'), { className: 'pg' }));
const vis = () => single ? [cur] : cur === 0 ? [0] : [2 * cur - 1, 2 * cur].filter(p => p < N);
const toCur = p => single ? p : Math.ceil(p / 2);

function buildLeaves() {
  const b = $('#book'), per = single ? 1 : 2;
  b.innerHTML = ''; b.classList.toggle('single', single);
  L = Math.ceil(N / per); max = single ? N - 1 : (N % 2 ? L - 1 : L); leaves = [];
  for (let k = 0; k < L; k++) {
    const leaf = document.createElement('div'); leaf.className = 'leaf';
    for (let i = 0; i < per; i++) {
      const p = per * k + i; if (p >= N) break;
      const f = document.createElement('div'); f.className = 'face' + (i ? ' b' : ''); f.append(page(p)); leaf.append(f);
    }
    b.append(leaf); leaves.push(leaf);
  }
}

function sizePage() {
  const tight = innerWidth < 560;
  const aw = innerWidth - (single ? 16 : (tight ? 12 : 120)), ah = innerHeight - (tight ? 118 : 150);
  const h = Math.min(ah, aw / (single ? 1 : 2) / ratio); pw = h * ratio;
  const b = $('#book');
  b.style.width = pw * (single ? 1 : 2) + 'px'; b.style.height = h + 'px';
  b.style.setProperty('--pw', pw + 'px'); b.style.setProperty('--l', single ? '0px' : pw + 'px');
  document.documentElement.style.setProperty('--ar', ratio);
}

function layout(p0 = 0) {
  if (!leaves.length) { buildLeaves(); cur = clamp(toCur(p0), 0, max); }
  sizePage(); setZoom(z); apply(true);
}

function toggleView() {
  const p = leaves.length ? vis()[0] : 0;
  single = !single;
  buildLeaves(); cur = clamp(toCur(p), 0, max);
  sizePage(); setZoom(1); apply(true);
  $('#bview').classList.toggle('one', single);
  $('#bview').title = single ? 'Ver dos páginas' : 'Ver una página';
  $('#bview').setAttribute('aria-label', $('#bview').title);
}

function apply(instant) {
  const b = $('#book'), v = vis(), last = v[v.length - 1];
  if (instant) b.classList.add('inst');
  leaves.forEach((l, k) => l.classList.toggle('flipped', k < cur));
  zidx();
  b.style.transform = `translateX(${single || v.length > 1 ? 0 : (cur === 0 ? -pw / 2 : pw / 2)}px)`;   // portada / contraportada centradas
  if (instant) { void b.offsetWidth; b.classList.remove('inst'); }
  $('#lbl').innerHTML = `<em class="w">Página </em>${v.map(p => pad(p + 1)).join('–')} / ${pad(N)}`;
  $('#prog i').style.width = (last + 1) / N * 100 + '%';
  $('#prev').disabled = cur === 0;
  document.querySelectorAll('.th').forEach(t => t.classList.toggle('on', v.includes(+t.dataset.p)));
  const w = Math.min(2200, Math.round(pw * (devicePixelRatio || 1) * 2));
  for (let p = v[0] - 3; p <= last + 4; p++) if (p >= 0 && p < N) fill(p, page(p), w);
  try { history.replaceState(null, '', '#' + (v[0] + 1)); } catch (e) {}
}
const zidx = () => leaves.forEach((l, k) => l.style.zIndex = k < cur ? k : L - k);
const jump = p => { cur = clamp(toCur(p), 0, max); apply(true); };

function go(d) {
  if (lock) return;
  const n = cur + d;
  if (n < 0) return;
  if (n > max) return d > 0 ? showEnd() : 0;
  const l = leaves[d > 0 ? cur : n];
  lock = true; cur = n; apply();
  l.style.zIndex = L + 5; l.classList.add('turning');
  setTimeout(() => { l.classList.remove('turning'); zidx(); lock = false; }, 680);
}

/* ---------- Zoom y gestos ---------- */
function setZoom(v) {
  z = clamp(v, 1, 3.5);
  const lx = (z - 1) * innerWidth / 2, ly = (z - 1) * innerHeight / 2;
  px = z === 1 ? 0 : clamp(px, -lx, lx); py = z === 1 ? 0 : clamp(py, -ly, ly);
  $('#zoom').style.transform = `translate(${px}px,${py}px) scale(${z})`;
  $('#stage').style.cursor = z > 1 ? 'grab' : '';
}
function zone(x) {                                  // -1 anterior · 0 centro · 1 siguiente · null fuera
  const half = vis().length * pw / 2, t = (x - innerWidth / 2 + half) / (2 * half);
  return t < -.08 || t > 1.08 ? null : t < .33 ? -1 : t > .67 ? 1 : 0;
}
let lastTap = 0;
function tap(e) {
  const t = Date.now(), dbl = t - lastTap < 320; lastTap = dbl ? 0 : t;
  if (z > 1) return dbl ? setZoom(1) : 0;
  const zn = zone(e.clientX);
  if (zn === 0) { if (dbl) setZoom(2.2); } else if (zn) go(zn);
}
const st = $('#stage'), ptr = new Map(); let s0 = null, pinch = null;
st.addEventListener('pointerdown', e => {
  st.setPointerCapture(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
  $('#zoom').classList.add('g');
  if (ptr.size === 1) s0 = { x: e.clientX, y: e.clientY, t: Date.now(), moved: false };
  else { const [a, b] = [...ptr.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z }; s0 = null; }
});
st.addEventListener('pointermove', e => {
  const p = ptr.get(e.pointerId);
  if (!p) {                                         // cursor según la zona (solo mouse)
    if (z > 1 || e.pointerType !== 'mouse') return;
    const zn = zone(e.clientX);
    st.style.cursor = zn === -1 ? (cur > 0 ? 'w-resize' : '') : zn === 1 ? 'e-resize' : zn === 0 ? 'zoom-in' : '';
    return;
  }
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (pinch && ptr.size === 2) { const [a, b] = [...ptr.values()]; setZoom(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d); }
  else if (s0) {
    if (Math.hypot(e.clientX - s0.x, e.clientY - s0.y) > 8) s0.moved = true;
    if (z > 1) { px += dx; py += dy; setZoom(z); st.style.cursor = 'grabbing'; }
  }
});
const up = e => {
  ptr.delete(e.pointerId); $('#zoom').classList.remove('g');
  if (ptr.size < 2) pinch = null;
  if (!s0 || ptr.size) return;
  const dx = e.clientX - s0.x, dy = e.clientY - s0.y, s = s0; s0 = null;
  if (e.type === 'pointercancel') return;
  if (z === 1 && Math.abs(dx) > 50 && Math.abs(dx) > 1.5 * Math.abs(dy)) return go(dx < 0 ? 1 : -1);   // swipe / arrastre
  if (!s.moved && Date.now() - s.t < 500) tap(e);
};
st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
st.addEventListener('wheel', e => { if (e.ctrlKey) { e.preventDefault(); setZoom(z * (e.deltaY < 0 ? 1.08 : .92)); } }, { passive: false });

/* ---------- Paneles y acciones ---------- */
let built = false;
function thumbs(open) {
  const t = $('#thumbs'); t.hidden = !open; if (!open) return;
  if (!built) {
    built = true;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { fill(+e.target.dataset.p, e.target.firstChild, 240); io.unobserve(e.target); }
    }), { root: $('#tgrid') });
    for (let p = 0; p < N; p++) {
      const b = document.createElement('button'); b.className = 'th'; b.dataset.p = p;
      b.innerHTML = `<i class="pg"></i><span>${pad(p + 1)}</span>`;
      b.onclick = () => { jump(p); if (innerWidth < 700) thumbs(false); };
      $('#tgrid').append(b); io.observe(b);
    }
    apply(true);
  }
  setTimeout(() => t.querySelector('.th.on')?.scrollIntoView({ block: 'center', inline: 'center' }), 60);
}
function gotoPage() {
  const v = parseInt($('#gin').value, 10);
  if (v >= 1 && v <= N) { jump(v - 1); $('#gopop').hidden = true; } else toast('Elegí una página entre 1 y ' + N);
}
function fullscreen() {
  const d = document, r = d.documentElement;
  (d.fullscreenElement || d.webkitFullscreenElement) ? (d.exitFullscreen || d.webkitExitFullscreen).call(d) : (r.requestFullscreen || r.webkitRequestFullscreen).call(r);
}
async function share() {
  const url = location.href.split('#')[0];
  try {
    if (navigator.share) return await navigator.share({ title: document.title, text: CONFIG.shareText, url });
    await navigator.clipboard.writeText(url); toast('Enlace copiado');
  } catch (e) { if (e.name !== 'AbortError') prompt('Copiá el enlace:', url); }
}
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 2200); }
const showEnd = () => { $('#end').hidden = false; };

$('#prev').onclick = () => go(-1);
$('#next').onclick = () => go(1);
$('#lbl').onclick = () => { const g = $('#gopop'); g.hidden = !g.hidden; if (!g.hidden) { $('#gin').max = N; $('#gin').value = ''; $('#gin').focus(); } };
$('#go').onclick = gotoPage;
$('#bview').onclick = toggleView;
$('#bpages').onclick = () => thumbs($('#thumbs').hidden);
$('#tclose').onclick = () => thumbs(false);
$('#bzoom').onclick = () => setZoom(z < 1.5 ? 1.8 : z < 2.4 ? 2.6 : 1);
$('#bfs').onclick = fullscreen;
$('#bshare').onclick = $('#eshare').onclick = share;
$('#again').onclick = () => { $('#end').hidden = true; jump(0); };
$('#eclose').onclick = () => { $('#end').hidden = true; };
if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) $('#bfs').hidden = true;   // iPhone: sin API de pantalla completa

addEventListener('keydown', e => {
  if ($('#viewer').hidden) return;
  const k = e.key;
  if (!$('#end').hidden) { if (k === 'Escape') $('#end').hidden = true; return; }
  if (k === 'Escape') { thumbs(false); $('#gopop').hidden = true; return; }
  if (e.target.tagName === 'INPUT') { if (k === 'Enter') gotoPage(); return; }
  if (k === 'ArrowRight') go(1); else if (k === 'ArrowLeft') go(-1);
  else if (k === 'f' || k === 'F') fullscreen();
  else if (k === '+' || k === '=') setZoom(z * 1.3); else if (k === '-') setZoom(z / 1.3);
});
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => !$('#viewer').hidden && sizePage(), 120); });

/* ---------- Flujo: portada → intro → carga → revista ---------- */
let skipIntro = false;
const nap = async ms => { for (let t = 0; t < ms && !skipIntro; t += 50) await sleep(50); };
async function intro() {
  const el = $('#intro'), t = $('#itxt'); el.hidden = false;
  $('#skip').onclick = () => skipIntro = true;
  const steps = [['Hace 17 semanas…', '', 2400], ['decidimos crear una empresa.', '', 2600], ['', '', 800], ['RODÁ', 'big', 2000], ['17 SEMANAS CREANDO UNA EMPRESA', 'mid', 2600]];
  for (const [txt, cls, ms] of steps) {
    if (skipIntro) break;
    t.className = ''; await nap(600); if (skipIntro) break;
    t.textContent = txt; t.className = 'in ' + cls; await nap(ms);
  }
  t.className = ''; el.style.opacity = 0; await sleep(700); el.hidden = true;
}

async function openMag(src) {
  const ld = $('#loader'), tm = setTimeout(() => ld.hidden = false, 250);
  ld.classList.remove('bad'); $('#err').hidden = true;
  try { await (src ? load(src) : ready); }
  catch (e) {
    console.warn(e); clearTimeout(tm); ld.hidden = false; ld.classList.add('bad'); $('#err').hidden = false;
    $('#err p').textContent = 'No se pudo cargar revista.pdf. Abrí el proyecto con un servidor local (ver README) o elegí el PDF desde tu dispositivo.';
    return;
  }
  clearTimeout(tm); ld.hidden = true; $('#landing').hidden = true;
  $('#viewer').hidden = false;
  layout(Math.max(0, (parseInt(location.hash.slice(1), 10) || 1) - 1));
  requestAnimationFrame(() => requestAnimationFrame(() => $('#viewer').classList.add('on')));
}
$('#pick').onchange = e => { const f = e.target.files[0]; if (f) openMag(URL.createObjectURL(f)); };
$('#open').onclick = async () => {
  $('#landing').classList.add('out');
  let seen = false;
  try { seen = sessionStorage.getItem('roda-intro'); sessionStorage.setItem('roda-intro', 1); } catch (e) {}
  if (!seen) await intro();
  openMag();
};

ready = load(); ready.catch(() => {});             // precarga el PDF mientras se lee la portada