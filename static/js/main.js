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
    var ciele = document.querySelectorAll('.sekcia-hlava, .ubyt-mriezka figure, .cennik, .tenis, .hala, .dvojica article, .turnaje figure, .rest-mriezka figure, .trasa li, .pamiatky-zoznam article, .apartman-pas, .druzstva, .treningy, .oslavy-text, .lk, .wellness-fotky figure');
    var io = new IntersectionObserver(function (zaznamy) {
      zaznamy.forEach(function (z) { if (z.isIntersecting) { z.target.classList.add('je-videt'); io.unobserve(z.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    ciele.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.classList.add('odhal'); io.observe(el);
    });
  }

  // hala: zvýraznenie aktuálnej hodiny (len v sezóne, čas Betliara)
  var hala = document.getElementById('hala');
  if (hala && hala.dataset.pasma) {
    try {
      var casti = {};
      new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bratislava', weekday: 'short', hour: 'numeric', hourCycle: 'h23', day: 'numeric', month: 'numeric' })
        .formatToParts(new Date()).forEach(function (c) { casti[c.type] = c.value; });
      var den = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(casti.weekday);
      var hod = parseInt(casti.hour, 10), mes = parseInt(casti.month, 10), dd = parseInt(casti.day, 10);
      var vSezone = (mes > 10 || mes < 4) || (mes === 10 && dd >= 15) || (mes === 4 && dd <= 15);
      if (vSezone && den > -1 && hod >= +hala.dataset.od && hod < +hala.dataset.do) {
        JSON.parse(hala.dataset.pasma).forEach(function (p, i) {
          if (p.dni.indexOf(den) > -1 && p.od <= hod && hod < p.do) {
            var li = hala.querySelector('[data-pasmo="' + i + '"]');
            if (li) li.classList.add('je-teraz');
          }
        });
        var bunka = hala.querySelector('.rozpis-slot[data-d="' + den + '"][data-h="' + hod + '"]');
        if (bunka) bunka.classList.add('je-teraz');
      }
    } catch (e) {}
  }

  // galérie: šípky pre myš
  var jemny = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.querySelectorAll('.turnaje-pas').forEach(function (pas) {
    if (!jemny) return;
    var obal = document.createElement('div');
    obal.className = 'pas-obal';
    pas.parentNode.insertBefore(obal, pas);
    obal.appendChild(pas);
    var spat = document.createElement('button'), dalej = document.createElement('button');
    spat.type = dalej.type = 'button';
    spat.className = 'pas-sipka pas-spat'; dalej.className = 'pas-sipka pas-dalej';
    spat.setAttribute('aria-label', 'Predchádzajúce fotky'); dalej.setAttribute('aria-label', 'Ďalšie fotky');
    spat.innerHTML = dalej.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    obal.appendChild(spat); obal.appendChild(dalej);
    function krok(s) { pas.scrollBy({ left: s * pas.clientWidth * 0.8, behavior: 'smooth' }); }
    spat.addEventListener('click', function () { krok(-1); });
    dalej.addEventListener('click', function () { krok(1); });
    function stav() {
      var max = pas.scrollWidth - pas.clientWidth - 2;
      spat.hidden = pas.scrollLeft <= 2;
      dalej.hidden = pas.scrollLeft >= max;
    }
    pas.addEventListener('scroll', stav, { passive: true });
    window.addEventListener('resize', stav);
    stav();
  });

  // galérie: fotka na celú obrazovku
  var skupiny = document.querySelectorAll('.turnaje-pas, .rest-mriezka, .wellness-fotky, .druzstva-foto, .hala-foto, .dvojica, .ubyt-mriezka');
  if (skupiny.length && window.HTMLDialogElement) {
    var lupa = document.createElement('dialog');
    lupa.className = 'lupa'; lupa.tabIndex = -1;
    lupa.setAttribute('aria-label', 'Fotka');
    lupa.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button type="button" class="lupa-zavri" aria-label="Zavrieť"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button>' +
      '<button type="button" class="lupa-sipka lupa-spat" aria-label="Predchádzajúca fotka"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<button type="button" class="lupa-sipka lupa-dalej" aria-label="Ďalšia fotka"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
    document.body.appendChild(lupa);
    var lImg = lupa.querySelector('img'), lPop = lupa.querySelector('figcaption'), aktualne = [], idx = 0;
    function zobraz(i) {
      idx = (i + aktualne.length) % aktualne.length;
      var o = aktualne[idx];
      lImg.src = o.getAttribute('src'); lImg.alt = o.alt; lPop.textContent = o.alt;
      lupa.querySelector('.lupa-spat').hidden = lupa.querySelector('.lupa-dalej').hidden = aktualne.length < 2;
    }
    skupiny.forEach(function (sk) {
      var obr = Array.prototype.slice.call(sk.querySelectorAll('figure img'));
      obr.forEach(function (o, i) {
        var f = o.closest('figure');
        f.classList.add('da-sa-zvacsit');
        f.tabIndex = 0;
        f.setAttribute('role', 'button');
        f.setAttribute('aria-label', 'Zväčšiť fotku: ' + o.alt);
        function otvor() { aktualne = obr; zobraz(i); lupa.showModal(); lupa.focus(); }
        f.addEventListener('click', otvor);
        f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); otvor(); } });
      });
    });
    lupa.querySelector('.lupa-zavri').addEventListener('click', function () { lupa.close(); });
    lupa.querySelector('.lupa-spat').addEventListener('click', function () { zobraz(idx - 1); });
    lupa.querySelector('.lupa-dalej').addEventListener('click', function () { zobraz(idx + 1); });
    lupa.addEventListener('click', function (e) { if (e.target === lupa) lupa.close(); });
    lupa.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') zobraz(idx + 1);
      if (e.key === 'ArrowLeft') zobraz(idx - 1);
    });
    var tx = null;
    lupa.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lupa.addEventListener('touchend', function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 50 && aktualne.length > 1) zobraz(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  // jedálny lístok: záložky
  var lk = document.getElementById('listok');
  if (lk && lk.querySelector('[role="tab"]')) {
    var taby = Array.prototype.slice.call(lk.querySelectorAll('[role="tab"]'));
    var panely = lk.querySelectorAll('.lk-panel');
    lk.querySelector('.lk-zalozky').hidden = false;
    lk.classList.add('lk-taby');
    var vyberTab = function (id, fokus) {
      taby.forEach(function (t) {
        var ano = t.getAttribute('aria-controls') === id;
        t.setAttribute('aria-selected', ano);
        t.tabIndex = ano ? 0 : -1;
        if (ano && fokus) { t.focus(); t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
      });
      panely.forEach(function (p) { p.hidden = p.id !== id; });
    };
    taby.forEach(function (t, i) {
      t.addEventListener('click', function () { vyberTab(t.getAttribute('aria-controls')); });
      t.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? taby.length - 1 : null;
        if (n === null) return;
        e.preventDefault();
        vyberTab(taby[(n + taby.length) % taby.length].getAttribute('aria-controls'), true);
      });
    });
    vyberTab(taby[0].getAttribute('aria-controls'));
    var naPanel = function (id) {
      if (!document.getElementById(id) || id.indexOf('listok-') !== 0) return false;
      vyberTab(id);
      lk.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      return true;
    };
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#listok-"]');
      if (a && naPanel(a.getAttribute('href').slice(1))) { e.preventDefault(); history.replaceState(null, '', a.getAttribute('href')); }
    });
    if (location.hash.indexOf('#listok-') === 0) naPanel(location.hash.slice(1));
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
