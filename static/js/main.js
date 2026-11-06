document.documentElement.classList.add('js');
(function () {
  // menu na mobile
  var burger = document.querySelector('.burger'), menu = document.getElementById('menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var otv = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', otv);
      menu.classList.toggle('je-otvorene', otv);
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) { burger.setAttribute('aria-expanded', 'false'); menu.classList.remove('je-otvorene'); }
    });
  }

  // plán areálu: body v schéme + voľby + panely
  var volby = document.querySelectorAll('.plan-volby [data-bod]');
  function ukaz(id, fokus) {
    volby.forEach(function (b) {
      var ano = b.dataset.bod === id;
      b.setAttribute('aria-selected', ano);
      b.tabIndex = ano ? 0 : -1;
      if (ano && fokus) b.focus();
    });
    document.querySelectorAll('.bod').forEach(function (g) { g.classList.toggle('je-aktivny', g.dataset.bod === id); });
    document.querySelectorAll('.bod-panel').forEach(function (p) { p.hidden = p.id !== 'bod-' + id; });
  }
  volby.forEach(function (b, i) {
    b.tabIndex = b.getAttribute('aria-selected') === 'true' ? 0 : -1;
    b.addEventListener('click', function () { ukaz(b.dataset.bod); });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      ukaz(volby[(i + d + volby.length) % volby.length].dataset.bod, true);
    });
  });
  document.querySelectorAll('.plan-svg [data-bod]').forEach(function (g) {
    g.addEventListener('click', function () {
      ukaz(g.dataset.bod);
      if (window.matchMedia('(max-width: 960px)').matches) {
        var panel = document.getElementById('bod-' + g.dataset.bod);
        if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
    g.style.cursor = 'pointer';
  });

  // jemné odhalenie pri scrolle
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var ciele = document.querySelectorAll('.sekcia-hlava, .ubyt-mriezka figure, .cennik, .tenis, .hala, .dvojica article, .turnaje figure, .rest-mriezka figure, .trasa li, .pamiatky-zoznam article, .apartman-pas');
    var io = new IntersectionObserver(function (zaznamy) {
      zaznamy.forEach(function (z) { if (z.isIntersecting) { z.target.classList.add('je-videt'); io.unobserve(z.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    ciele.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.classList.add('odhal'); io.observe(el);
    });
  }

  // formulár: v návrhu ukážkový režim
  document.querySelectorAll('form.formular').forEach(function (f) {
    var stav = f.querySelector('.formular-stav');
    f.addEventListener('submit', function (e) {
      var endpoint = f.getAttribute('data-endpoint'), demo = f.getAttribute('data-demo') === '1';
      e.preventDefault();
      if (f.querySelector('.past input').value) return;
      if (demo || !endpoint) { stav.textContent = 'Ukážka formulára: nič sa neodosiela. Po spustení webu príde dopyt priamo do penziónu.'; return; }
      stav.textContent = 'Odosielam…';
      fetch(endpoint, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); f.reset(); stav.textContent = 'Ďakujeme, dopyt sme prijali. Ozveme sa vám.'; })
        .catch(function () { stav.textContent = 'Odoslanie sa nepodarilo. Zavolajte nám alebo napíšte e-mail.'; });
    });
  });
})();
