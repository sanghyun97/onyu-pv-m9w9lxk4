// 공개 페이지 동작: 헤더, 모바일 메뉴, 대표 사진 전환, 검색, 등장 효과
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 헤더: 스크롤하면 작아짐 (메인은 사진 위 → 흰 바탕)
  const hd = document.getElementById('hd');
  const onScroll = () => {
    if (!hd) return;
    const past = window.scrollY > (hd.classList.contains('hd--overlay') ? window.innerHeight * 0.85 : 30);
    hd.classList.toggle('is-scrolled', past);
    document.body.classList.toggle('past-hero', window.scrollY > window.innerHeight * 0.6);
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });

  // 모바일 메뉴
  const burger = document.getElementById('burger');
  const mnav = document.getElementById('mnav');
  if (burger && mnav) {
    const set = (open) => {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
      mnav.hidden = !open;
      document.body.classList.toggle('menu-open', open);
    };
    burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
  }

  // 대표 사진 천천히 전환
  const slides = [...document.querySelectorAll('.hero-s')];
  if (slides.length > 1 && !reduce) {
    const cap = document.getElementById('heroCap');
    const idx = document.getElementById('heroIdx');
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      slides[i].classList.remove('is-on');
      i = (i + 1) % slides.length;
      slides[i].classList.add('is-on');
      if (cap) { cap.style.opacity = 0; setTimeout(() => { cap.textContent = slides[i].dataset.cap; cap.style.opacity = 1; }, 500); }
      if (idx) idx.textContent = String(i + 1).padStart(2, '0');
    }, 6500);
  }

  // WORKS 한 페이지: 분류(본식/야외) · 보기(작업별/홀별) · 홀 걸러보기 · 검색
  const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, '');
  const root = document.getElementById('works');
  if (root) {
    const grid = document.getElementById('grid');
    const halls = document.getElementById('halls');
    const q = document.getElementById('q');
    const chip = document.getElementById('chip');
    const none = document.getElementById('noresult');
    const vt = root.querySelector('.vt');
    const cards = [...grid.querySelectorAll('.card')];
    const rows = [...halls.querySelectorAll('li')];
    const st = { cat: root.dataset.cat, view: root.dataset.view, hall: root.dataset.hall || '' };
    const params = new URLSearchParams(location.search);
    if (params.get('q')) q.value = params.get('q');
    if (params.get('hall')) { st.hall = params.get('hall'); st.view = 'works'; st.cat = 'ceremony'; } else { if (params.get('cat') === 'outdoor') st.cat = 'outdoor'; if (params.get('view') === 'halls') st.view = 'halls'; }

    const url = () => {
      const u = new URLSearchParams();
      if (st.hall) u.set('hall', st.hall);
      else { if (st.cat !== 'ceremony') u.set('cat', st.cat); if (st.view !== 'works') u.set('view', st.view); }
      if (q.value) u.set('q', q.value);
      return '/onyu-pv-m9w9lxk4/works/' + (u.toString() ? '?' + u : '');
    };
    const apply = (push) => {
      if (st.cat === 'outdoor') { st.view = 'works'; st.hall = ''; }
      const v = norm(q.value);
      root.querySelectorAll('button[data-cat]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === st.cat)));
      root.querySelectorAll('button[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === st.view)));
      if (vt) vt.hidden = st.cat === 'outdoor';
      chip.hidden = !st.hall;
      document.getElementById('chipName').textContent = st.hall;
      grid.hidden = st.view !== 'works';
      halls.hidden = st.view !== 'halls';
      let n = 0;
      if (st.view === 'works') {
        for (const c of cards) {
          const ok = c.dataset.cat === st.cat && (!st.hall || c.dataset.venue === st.hall) && (!v || norm(c.dataset.q).includes(v));
          c.hidden = !ok;
          if (ok) { n++; c.classList.add('is-in'); const num = c.querySelector('.card-n'); if (num) num.textContent = String(n).padStart(2, '0'); }
        }
      } else {
        for (const li of rows) { const ok = !v || norm(li.dataset.q).includes(v); li.hidden = !ok; if (ok) n++; }
        halls.querySelectorAll('.hg').forEach(g => { g.hidden = ![...g.querySelectorAll('li')].some(li => !li.hidden); });
      }
      none.hidden = n > 0;
      if (push) history.pushState({ ...st }, '', url()); else history.replaceState({ ...st }, '', url());
    };
    const top = () => { const y = root.getBoundingClientRect().top + scrollY - 90; if (scrollY > y) scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); };

    root.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-cat], button[data-view], a[data-hall], #chipClear');
      if (!b) return;
      e.preventDefault();
      if (b.dataset.cat) { st.cat = b.dataset.cat; st.hall = ''; }
      else if (b.dataset.view) { st.view = b.dataset.view; st.hall = ''; }
      else if (b.dataset.hall) { st.hall = b.dataset.hall; st.view = 'works'; st.cat = 'ceremony'; q.value = ''; }
      else if (b.id === 'chipClear') { st.hall = ''; }
      apply(true); top();
    });
    q.addEventListener('input', () => apply(false));
    addEventListener('popstate', (e) => { if (e.state) { Object.assign(st, e.state); q.value = ''; apply(false); } });
    apply(false);
  }

  // 스크롤하면 천천히 나타나기
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.manifesto > *, .fx-main, .fx-side, .card, .row, .st-f, .st-tx, .proc-l li, .team > *, .pb, .stat a, .band > *').forEach((el) => {
      if (el.getBoundingClientRect().top < innerHeight) return; // 첫 화면에 보이는 건 그대로
      el.classList.add('rv'); io.observe(el);
    });
  }
})();

// 미리보기 사본: 문의는 전송되지 않음
document.querySelectorAll('form[method="post" i]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); let n = f.querySelector('.pv-note'); if (!n) { n = document.createElement('p'); n.className = 'pv-note'; n.style.cssText = 'margin-top:16px;color:#a8977b;font-size:14px'; f.appendChild(n); } n.textContent = '미리보기 화면이라 문의가 전송되지 않습니다.'; }));
