(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var MAIL = 'aadimfoundation.info@gmail.com';
  var fmt = function (n) { return n.toLocaleString('en-IN'); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header / nav ---------- */
  var header = $('header'), nav = $('#nav'), burger = $('#burger');
  window.addEventListener('scroll', function () { header.classList.toggle('scrolled', window.scrollY > 10); }, { passive: true });
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  $$('#nav a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }); });

  /* ---------- Marquee ---------- */
  (function () {
    var words = ['Forest Protection', 'Climate Resilience', 'Livelihoods', 'Community Forest Rights', 'Water & Soil Security', 'Millets Revival', 'Organic Farming', 'Local Governance', 'Women & Youth'];
    var one = words.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('');
    if ($('#marquee')) $('#marquee').innerHTML = one + one;
  })();

  /* ---------- Reveal + counters ---------- */
  function count(el) {
    var target = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = target.toFixed(dec) + suf; return; }
    var t0 = null, dur = 1400;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * e).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        if (e.target.dataset.count) count(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: .15 });
    $$('.rv').forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 90 + 'ms'; io.observe(el); });
    $$('[data-count]').forEach(function (el) { io.observe(el); });
  } else {
    $$('.rv').forEach(function (el) { el.classList.add('in'); });
    $$('[data-count]').forEach(count);
  }

  /* ---------- Population + forest explorer (Projects page) ---------- */
  if ($('#dist')) {
  var DATA = window.DATA || {}, FOREST = window.FOREST || {}, FS = window.FOREST_STATE || {};
  var distSel = $('#dist'), talSel = $('#tal'), result = $('#result'), rank = $('#rank'), rtabs = $('#rtabs'), rankSrc = $('#rankSrc');
  var districts = Object.keys(DATA).sort();
  districts.forEach(function (d) { distSel.appendChild(new Option(d, d)); });
  var EMPTY = '<div class="res-empty"><svg class="dd" viewBox="0 0 100 100" aria-hidden="true"><use href="#d-tree"/></svg><p>Select a district to see its population and forest cover.</p></div>';
  var stateAvg = FS.ga ? FS.cover / FS.ga * 100 : 16.5;

  /* ---------- Motion graphics helpers ---------- */
  function motion(root) {
    var fmtK = { int: function (v) { return fmt(Math.round(v)); }, pct: function (v) { return v.toFixed(1) + '%'; }, km: function (v) { return n1(v) + ' km²'; } };
    var nums = $$('[data-to]', root), ring = $('.ring', root), segs = $$('.f-bar i', root);
    if (reduce) { if (ring) ring.style.setProperty('--p', ring.dataset.p); segs.forEach(function (i) { i.style.flex = i.dataset.f; }); return; }
    var t0 = null, dur = 1100;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      nums.forEach(function (el) { el.textContent = fmtK[el.dataset.k](parseFloat(el.dataset.to) * e); });
      if (ring) ring.style.setProperty('--p', (parseFloat(ring.dataset.p) * e).toFixed(2));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    requestAnimationFrame(function () { requestAnimationFrame(function () { segs.forEach(function (i) { i.style.flex = i.dataset.f; }); }); });
  }

  function pct(a, b) { return b ? (a / b) * 100 : 0; }
  function fpct(k) { var f = FOREST[k]; return f && f.ga ? f.cover / f.ga * 100 : null; }
  function n1(x) { return (+x).toLocaleString('en-IN', { maximumFractionDigits: 1 }); }

  function forestCard(k) {
    var f = FOREST[k]; if (!f) return '<div class="fcard"><p class="note">Forest data is not available for this district.</p></div>';
    var p = f.cover / f.ga * 100, diff = p - stateAvg;
    var cls = f.cls ? f.cls.split(' ')[0] : '';
    var seg = [['vdf', 'Very dense', f.vdf], ['mdf', 'Moderately dense', f.mdf], ['open', 'Open forest', f.open]];
    var tot = f.vdf + f.mdf + f.open || 1;
    var bar = seg.map(function (s) { return '<i class="s-' + s[0] + '" data-f="' + (s[2] / tot * 100).toFixed(2) + '" style="flex:.001" title="' + s[1] + ': ' + n1(s[2]) + ' km²"></i>'; }).join('');
    var legend = seg.map(function (s) { return '<li><i class="s-' + s[0] + '"></i>' + s[1] + '<b>' + n1(s[2]) + ' km²</b></li>'; }).join('');
    var ch = f.change, chTxt = (ch > 0 ? '+' : '') + n1(ch) + ' km²', chCls = ch > 0 ? 'up' : ch < 0 ? 'down' : '';
    var insight = 'Forest covers <b>' + p.toFixed(1) + '%</b> of ' + esc(k) + (f.combined ? ' (combined area)' : '') + ' — ' +
      (Math.abs(diff) < 1 ? 'about the same as' : diff > 0 ? '<b>' + diff.toFixed(1) + ' points above</b>' : '<b>' + Math.abs(diff).toFixed(1) + ' points below</b>') +
      ' the Maharashtra average of ' + stateAvg.toFixed(1) + '%.';
    var legal = f.legal && f.legal.total ?
      '<div class="f-row"><span>Legally notified forest</span><b>' + n1(f.legal.total) + ' km²</b></div>' +
      '<div class="f-sub">Reserved ' + n1(f.legal.rf) + ' · Protected ' + n1(f.legal.pf) + ' · Unclassed ' + n1(f.legal.uf) + ' km²</div>' : '';
    return '<div class="fcard"><h4><svg class="dd" aria-hidden="true"><use href="#d-tree"/></svg>Forest cover</h4>' +
      (f.combined ? '<p class="f-comb">ISFR reports <b>' + esc(f.combined) + '</b> together; the figures below describe the combined area.</p>' : '') +
      '<div class="f-top"><div class="ring" data-p="' + Math.min(p, 100).toFixed(1) + '"><span data-to="' + p + '" data-k="pct">' + p.toFixed(1) + '%</span></div>' +
      '<div class="f-main"><b data-to="' + f.cover + '" data-k="km">' + n1(f.cover) + ' km²</b><span>forest cover of ' + n1(f.ga) + ' km² area</span>' +
      (cls ? '<em class="cls c-' + cls.toLowerCase() + '">' + esc(f.cls) + '</em>' : '') + '</div></div>' +
      '<div class="f-bar">' + bar + '</div><ul class="f-leg">' + legend + '</ul>' +
      '<div class="f-row"><span>Change vs 2019 assessment</span><b class="' + chCls + '">' + chTxt + '</b></div>' +
      '<div class="f-row"><span>Scrub</span><b>' + n1(f.scrub) + ' km²</b></div>' +
      (f.mangrove ? '<div class="f-row"><span>Mangrove</span><b>' + n1(f.mangrove) + ' km²</b></div>' : '') +
      legal + '<p class="f-insight">' + insight + '</p></div>';
  }

  function render(title, kicker, o, approx, note, dk) {
    var p = pct(o.tribal, o.total);
    result.innerHTML =
      '<div class="anim"><div class="res-title"><small>' + esc(kicker) + '</small>' + esc(title) + '</div>' +
      '<div class="stats">' +
      '<div class="stat"><b data-to="' + o.total + '" data-k="int">' + fmt(o.total) + '</b><span>Total population' + (approx ? ' (approx.)' : '') + '</span></div>' +
      '<div class="stat"><b data-to="' + o.tribal + '" data-k="int">' + fmt(o.tribal) + '</b><span>Tribal (ST)' + (approx ? ' (approx.)' : '') + '</span></div>' +
      '<div class="stat"><b data-to="' + p + '" data-k="pct">' + p.toFixed(1) + '%</b><span>ST share</span></div></div>' +
      '<div class="share"><div class="share-top"><span>Scheduled Tribe share</span><span>' + p.toFixed(1) + '%</span></div>' +
      '<div class="share-bar"><i></i></div></div>' +
      (approx ? '<p class="f-scope">Forest data is reported at district level — showing <b>' + esc(dk) + '</b> district below.</p>' : '') +
      forestCard(dk) +
      '<p class="note">' + esc(note) + '</p></div>';
    motion(result);
    var bar = $('.share-bar i', result);
    requestAnimationFrame(function () { requestAnimationFrame(function () { bar.style.width = Math.min(p, 100) + '%'; }); });
  }
  function markRank(k) { $$('button', rank).forEach(function (b) { b.classList.toggle('on', b.dataset.d === k); }); }
  function showDistrict(k) {
    var d = DATA[k]; if (!d) return;
    render(k, 'District overall', d, false, (d.note ? d.note + ' · ' : '') + 'Population: Census 2011 / TRTI (approximate). Forest: ISFR 2021 and Forest Dept. 2023-24. Select a taluka for more detail.', k);
    markRank(k);
  }
  function showTaluka(dk, tk) {
    var t = DATA[dk].talukas[tk]; if (!t) return;
    render(tk, dk + ' district', t, true, 'Taluka population figures are approximate / illustrative. For official planning use the latest government sources.', dk);
  }
  function chooseDistrict(k) {
    distSel.value = k;
    talSel.innerHTML = '';
    if (!k) {
      talSel.disabled = true; talSel.appendChild(new Option('First select a district', ''));
      result.innerHTML = EMPTY; markRank(''); mapFocus('');
      return;
    }
    talSel.disabled = false;
    talSel.appendChild(new Option('All — district level', ''));
    Object.keys(DATA[k].talukas).sort().forEach(function (t) { talSel.appendChild(new Option(t, t)); });
    showDistrict(k); mapFocus(k);
  }
  distSel.addEventListener('change', function () { chooseDistrict(this.value); });
  talSel.addEventListener('change', function () {
    if (!distSel.value) return;
    this.value ? showTaluka(distSel.value, this.value) : showDistrict(distSel.value);
  });

  /* ranking with tabs */
  var RANKS = {
    forest: { label: 'Forest cover %', val: function (d) { return fpct(d); }, show: function (v) { return v.toFixed(1) + '%' }, src: 'Forest cover as % of geographic area (ISFR 2021).' },
    pop: { label: 'Population', val: function (d) { return DATA[d].total; }, show: function (v) { return fmt(Math.round(v)); }, src: 'Total population (Census 2011, approximate).' },
    tribal: { label: 'Tribal share', val: function (d) { return pct(DATA[d].tribal, DATA[d].total); }, show: function (v) { return v.toFixed(1) + '%'; }, src: 'Scheduled Tribe share of population (approximate).' }
  };
  var rkey = 'forest';
  rtabs.innerHTML = Object.keys(RANKS).map(function (k) { return '<button class="tab" role="tab" data-r="' + k + '" aria-selected="' + (k === rkey) + '">' + RANKS[k].label + '</button>'; }).join('');
  function drawRank() {
    var R = RANKS[rkey];
    var rows = districts.map(function (d) { return { d: d, v: R.val(d) }; }).filter(function (r) { return r.v != null; })
      .sort(function (a, b) { return b.v - a.v; }).slice(0, 8);
    var max = rows.length ? rows[0].v : 1;
    rank.innerHTML = rows.map(function (r, i) {
      return '<li><button type="button" data-d="' + esc(r.d) + '"><span class="pos">' + (i + 1) + '</span>' +
        '<span><span class="nm">' + esc(r.d) + '</span><span class="bar"><i style="width:' + (r.v / max * 100).toFixed(1) + '%"></i></span></span>' +
        '<span class="pc">' + R.show(r.v) + '</span></button></li>';
    }).join('');
    rankSrc.textContent = 'Top 8 districts · ' + R.src + ' Tap a district to open it.';
    markRank(distSel.value);
  }
  rtabs.addEventListener('click', function (e) {
    var b = e.target.closest('.tab'); if (!b) return;
    rkey = b.dataset.r;
    $$('.tab', rtabs).forEach(function (t) { t.setAttribute('aria-selected', t === b); });
    drawRank();
  });
  drawRank();
  function goPanel() { $('#exPanel').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); }
  rank.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    chooseDistrict(b.dataset.d); goPanel();
  });


  /* ---------- Zoom-motion map ---------- */
  var MAP = window.MAP || [], VB0 = window.MAPVB || [0, 0, 780, 642];
  var wmap = $('#wmap'), mapReset = $('#mapReset'), curVB = VB0.slice(), raf = null, mpaths = [];
  function ramp(t) { // light mint -> deep forest
    var a = [232, 245, 226], b = [13, 74, 55];
    return 'rgb(' + a.map(function (x, i) { return Math.round(x + (b[i] - x) * t); }).join(',') + ')';
  }
  var NS = 'http://www.w3.org/2000/svg', gM = null, pin = null, beacons = [], MC = window.MAPC || {};
  if (wmap && MAP.length) {
    var fmax = Math.max.apply(null, MAP.map(function (m) { return fpct(m.k[0]) || 0; })) || 1;
    wmap.setAttribute('viewBox', VB0.join(' '));
    wmap.innerHTML = MAP.map(function (m, i) {
      var p = fpct(m.k[0]) || 0;
      return '<path data-i="' + i + '" tabindex="0" role="button" aria-label="' + esc(m.k.join(' + ')) + '" d="' + m.d + '" pathLength="1" style="fill:' + ramp(p / fmax) + ';animation-delay:' + (i * 30) + 'ms"><title>' + esc(m.k.join(' + ')) + ' · ' + p.toFixed(1) + '% forest</title></path>';
    }).join('');
    mpaths = $$('path[data-i]', wmap);
    initMarkers();
    if ('IntersectionObserver' in window && !reduce) {
      var mio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { wmap.classList.add('go'); mio.disconnect(); } }, { threshold: .2 });
      mio.observe(wmap);
    } else wmap.classList.add('go', 'still');
  }
  /* location symbols: pulsing beacons on forest-rich districts + a dropping pin on the selected one */
  function cen(m) { var c = (window.MAPC || {})[m.k[0]]; return c || [m.bb[0] + m.bb[2] / 2, m.bb[1] + m.bb[3] / 2]; }
  function initMarkers() {
    gM = document.createElementNS(NS, 'g'); gM.setAttribute('class', 'mk');
    MAP.forEach(function (m, i) {
      if ((fpct(m.k[0]) || 0) < 30) return;
      var c = cen(m), g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'beacon'); g.dataset.x = c[0]; g.dataset.y = c[1]; g.style.setProperty('--dl', (beacons.length * .45) + 's');
      g.innerHTML = '<circle class="rip" r="10"/><circle class="rip r2" r="10"/><circle class="dot" r="4.5"/>';
      gM.appendChild(g); beacons.push(g);
    });
    pin = document.createElementNS(NS, 'g'); pin.setAttribute('class', 'pin'); pin.style.opacity = 0;
    pin.innerHTML = '<circle class="prip" r="8"/><circle class="prip p2" r="8"/><g class="bob"><path class="pinbody" d="M0 0C-9-12-17-19-17-29a17 17 0 0 1 34 0C17-19 9-12 0 0Z"/><circle cx="0" cy="-29" r="6.5" class="pinhole"/></g>';
    gM.appendChild(pin); wmap.appendChild(gM); scaleMarkers();
    if (!reduce && 'IntersectionObserver' in window) { gM.style.opacity = 0; setTimeout(function () { gM.style.opacity = 1; }, 2200); }
  }
  function scaleMarkers() {
    if (!gM) return;
    var z = Math.pow(VB0[2] / curVB[2], .7), k = 1 / z;
    beacons.forEach(function (g) { g.setAttribute('transform', 'translate(' + g.dataset.x + ' ' + g.dataset.y + ') scale(' + k + ')'); });
    if (pin && pin.dataset.x) pin.setAttribute('transform', 'translate(' + pin.dataset.x + ' ' + pin.dataset.y + ') scale(' + k + ')');
  }
  function setPin(idx) {
    if (!pin) return;
    if (idx < 0) { pin.style.opacity = 0; delete pin.dataset.x; return; }
    var c = cen(MAP[idx]); pin.dataset.x = c[0]; pin.dataset.y = c[1]; scaleMarkers(); pin.style.opacity = 1;
    pin.classList.remove('drop'); void pin.getBoundingClientRect(); pin.classList.add('drop');
  }
  function setVB(v) { curVB = v; wmap.setAttribute('viewBox', v.map(function (x) { return x.toFixed(1); }).join(' ')); scaleMarkers(); }
  function zoomTo(target) {
    if (raf) cancelAnimationFrame(raf);
    if (reduce) { setVB(target); return; }
    var from = curVB.slice(), t0 = null, dur = 1100;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      setVB(from.map(function (x, i) { return x + (target[i] - x) * e; }));
      if (p < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
  }
  function mapFocus(k) {
    if (!mpaths.length) return;
    var idx = -1;
    MAP.forEach(function (m, i) { if (k && m.k.indexOf(k) > -1) idx = i; });
    mpaths.forEach(function (p, i) { p.classList.toggle('sel', i === idx); p.classList.toggle('dim', idx > -1 && i !== idx); });
    mapReset.hidden = idx < 0; setPin(idx);
    if (idx < 0) { zoomTo(VB0.slice()); return; }
    mpaths[idx].parentNode.appendChild(mpaths[idx]); mpaths = $$('path[data-i]', wmap); wmap.appendChild(gM); // bring to front, markers above
    var b = MAP[idx].bb, pad = Math.max(b[2], b[3]) * .35, w = b[2] + pad * 2, h = b[3] + pad * 2, ar = VB0[2] / VB0[3];
    if (w / h < ar) w = h * ar; else h = w / ar;
    zoomTo([b[0] + b[2] / 2 - w / 2, b[1] + b[3] / 2 - h / 2, w, h]);
  }
  if (wmap) {
    wmap.addEventListener('click', function (e) {
      var p = e.target.closest('path'); if (!p) return;
      var m = MAP[+p.dataset.i], keep = m.k.indexOf(distSel.value) > -1 ? distSel.value : m.k[0];
      chooseDistrict(keep);
    });
    wmap.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset.i) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
    mapReset.addEventListener('click', function () { chooseDistrict(''); });
  }


  /* teaser: quick picks, hero hint, floating pill, rotating facts */
  var PICKS = ['Gadchiroli', 'Raigad', 'Pune', 'Nandurbar', 'Mumbai Suburban'].filter(function (k) { return DATA[k]; });
  $('#picks').innerHTML = PICKS.map(function (k) { return '<button type="button" class="pick" data-d="' + esc(k) + '">' + esc(k) + '</button>'; }).join('');
  $('#picks').addEventListener('click', function (e) {
    var b = e.target.closest('.pick'); if (!b) return; chooseDistrict(b.dataset.d); goPanel();
  });
  function focusExplorer() {
    $('#explorer').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setTimeout(function () { distSel.focus({ preventScroll: true }); }, reduce ? 0 : 700);
    $('#exPanel').classList.remove('pulse'); void $('#exPanel').offsetWidth; $('#exPanel').classList.add('pulse');
  }
  $('#teaserGo').addEventListener('click', focusExplorer);
  var fab = $('#fab');
  fab.addEventListener('click', focusExplorer);
  var exSec = $('#explorer'), heroSec = $('.hero');
  function fabState() {
    var y = window.scrollY, r = exSec.getBoundingClientRect();
    var hide = r.top < window.innerHeight * .6 && r.bottom > 0;
    fab.classList.toggle('show', y > 500 && !hide);
  }
  window.addEventListener('scroll', fabState, { passive: true }); fabState();

  var FACTS = (function () {
    var f = [], names = Object.keys(FOREST).filter(function (k) { return DATA[k]; });
    function top(fn, asc) { return names.slice().sort(function (a, b) { return asc ? fn(a) - fn(b) : fn(b) - fn(a); })[0]; }
    var hi = top(fpct), lo = top(fpct, true), big = top(function (k) { return FOREST[k].cover; }), gain = top(function (k) { return FOREST[k].change; });
    var pop = top(function (k) { return DATA[k].total; });
    if (hi) f.push('<b>' + esc(hi) + '</b> is the most forested district: ' + fpct(hi).toFixed(1) + '% of its land is forest.');
    if (big) f.push('<b>' + esc(big) + '</b> holds the most forest in absolute terms: ' + n1(FOREST[big].cover) + ' km².');
    if (lo) f.push('<b>' + esc(lo) + '</b> has the least forest cover: ' + fpct(lo).toFixed(1) + '% of its area.');
    if (gain && FOREST[gain].change > 0) f.push('<b>' + esc(gain) + '</b> gained the most forest cover since 2019: +' + n1(FOREST[gain].change) + ' km².');
    if (FS.cover) f.push('Forest covers <b>' + stateAvg.toFixed(1) + '%</b> of Maharashtra — ' + n1(FS.cover) + ' km² in all.');
    if (pop) f.push('<b>' + esc(pop) + '</b> is the most populous district, with about ' + fmt(DATA[pop].total) + ' people.');
    return f;
  })();
  var fi = 0, factsEl = $('#facts'), heroFact = $('#heroFact');
  factsEl.innerHTML = '<span class="f-lab">Did you know?</span><p id="factTxt" aria-live="polite"></p><div class="f-ctrl"><button type="button" id="factNext" aria-label="Next fact">Next fact <svg class="dd" aria-hidden="true"><use href="#d-go"/></svg></button></div>';
  var factTxt = $('#factTxt');
  function showFact() { factTxt.innerHTML = FACTS[fi % FACTS.length]; }
  showFact();
  $('#factNext').addEventListener('click', function () { fi++; showFact(); });
  if (!reduce && FACTS.length) {
    setInterval(function () { if (!document.hidden) { fi++; showFact(); } }, 9000);
  }
  if (heroFact && FACTS.length) {
    var hints = ['Click here and get info', FACTS[0].replace(/<[^>]+>/g, ''), 'Click here and get info', (FACTS[2] || FACTS[0]).replace(/<[^>]+>/g, '')], hi2 = 0;
    if (!reduce) setInterval(function () { hi2 = (hi2 + 1) % hints.length; heroFact.style.opacity = 0; setTimeout(function () { heroFact.textContent = hints[hi2]; heroFact.style.opacity = 1; }, 250); }, 5000);
  }

  }

  /* ---------- Other pages: link prompts to the explorer ---------- */
  if (!$('#dist')) {
    var goEx = function () { window.location.href = 'projects.html#explorer'; };
    var hh = $('#heroHint'), fb = $('#fab'), hf = $('#heroFact');
    if (hh) hh.addEventListener('click', goEx);
    if (fb) { fb.addEventListener('click', goEx); var fs = function () { fb.classList.toggle('show', window.scrollY > 500); }; window.addEventListener('scroll', fs, { passive: true }); fs(); }
    var FD = window.FOREST || {}, DD = window.DATA || {}, hints = ['Click here and get info'];
    var top = Object.keys(FD).filter(function (k) { return DD[k] && FD[k].ga; }).sort(function (a, b) { return FD[b].cover / FD[b].ga - FD[a].cover / FD[a].ga; })[0];
    if (top) hints.push(top + ' is the most forested district: ' + (FD[top].cover / FD[top].ga * 100).toFixed(1) + '% forest');
    if (window.FOREST_STATE && FOREST_STATE.ga) hints.push('Forest covers ' + (FOREST_STATE.cover / FOREST_STATE.ga * 100).toFixed(1) + '% of Maharashtra');
    if (hf && hints.length > 1 && !reduce) { var hi3 = 0; setInterval(function () { hi3 = (hi3 + 1) % hints.length; hf.style.opacity = 0; setTimeout(function () { hf.textContent = hints[hi3]; hf.style.opacity = 1; }, 250); }, 5000); }
  }

  /* ---------- Aadim Desk ---------- */
  if ($('#tabs')) {
  var T = 'https://tribal.maharashtra.gov.in';
  var mail = function (s) { return 'mailto:' + MAIL + '?subject=' + encodeURIComponent(s); };
  var ITEMS = [
    { c: 'gr', t: 'Forest Rights Act – Implementation GRs (Maharashtra)', d: 'Key GRs from the Tribal Development Department and related departments for FRA claim recognition and post-claim support.', l: 'Tribal Dept. Portal →', h: T, x: 1 },
    { c: 'gr', t: 'PVTG / Aadim Awas related Resolutions', d: 'Housing and habitat development for Particularly Vulnerable Tribal Groups (Katkari, Kolam, Madia Gond).', l: 'Reference →', h: T, x: 1 },
    { c: 'gr', t: 'Governor’s Office Notifications on FRA & Scheduled Areas', d: 'Notifications on appeals, village site extension and local recruitment in Scheduled Areas.', l: 'Raj Bhavan →', h: 'https://rajbhavan-maharashtra.gov.in', x: 1 },
    { c: 'acts', t: 'Scheduled Tribes and Other Traditional Forest Dwellers (Recognition of Forest Rights) Act, 2006', d: 'Primary legislation recognising Individual and Community Forest Rights.', l: 'Official text →', h: 'https://tribal.nic.in', x: 1 },
    { c: 'acts', t: 'Forest Rights Rules, 2007 (as amended)', d: 'Procedure for Gram Sabha, SDLC, DLC and claim verification.', l: 'Rules →', h: 'https://tribal.nic.in', x: 1 },
    { c: 'acts', t: 'PESA Act, 1996 & Maharashtra Provisions', d: 'Self-governance in Scheduled Areas and control over community resources.', l: 'Request a copy →', h: mail('Request: PESA Act material') },
    { c: 'guide', t: 'FRA Claim Filing & Documentation Guidelines', d: 'Practical steps for IFR, CFR and Community Resource rights claims, evidence and mapping.', l: 'Request via Aadim Desk →', h: mail('Request: FRA claim filing guidelines') },
    { c: 'guide', t: 'Community Forest Resource Management Plans (CFRMP)', d: 'Guidance for preparing and implementing management plans after CFR titles.', l: 'Contact for training module →', h: mail('Request: CFRMP training module') },
    { c: 'scheme', t: 'Maharashtra Aadim Awas Yojana', d: 'Housing assistance for eligible Katkari, Madia Gond and Kolam families (PVTGs).', l: 'Scheme details →', h: T, x: 1 },
    { c: 'scheme', t: 'Watershed, Farm Pond & Livelihood Schemes', d: 'Convergence under Tribal Sub-Plan, MGNREGA and state livelihood missions.', l: 'Request ICE material →', h: mail('Request: livelihood scheme ICE material') },
    { c: 'scheme', t: 'Nutrition, Education & Health Schemes', d: 'Key entitlements for tribal children, women and remote habitations.', l: 'Tribal Development Dept. →', h: T, x: 1 }
  ];
  var CATS = [['all', 'All'], ['gr', 'Government Resolutions'], ['acts', 'Acts & Rules'], ['guide', 'Guidelines'], ['scheme', 'Welfare Schemes']];
  var TAG = { gr: 'GR', acts: 'Act / Rule', guide: 'Guideline', scheme: 'Scheme' };
  var cat = 'all', tabs = $('#tabs'), dlist = $('#dlist'), q = $('#q');
  tabs.innerHTML = CATS.map(function (c) { return '<button class="tab" role="tab" data-c="' + c[0] + '" aria-selected="' + (c[0] === 'all') + '">' + esc(c[1]) + '</button>'; }).join('');
  function drawDesk() {
    var term = q.value.trim().toLowerCase();
    var rows = ITEMS.filter(function (i) { return (cat === 'all' || i.c === cat) && (!term || (i.t + ' ' + i.d).toLowerCase().indexOf(term) > -1); });
    dlist.innerHTML = rows.length ? rows.map(function (i) {
      return '<article class="d-item"><span class="d-tag">' + TAG[i.c] + '</span><h4>' + esc(i.t) + '</h4><p>' + esc(i.d) + '</p>' +
        '<a href="' + esc(i.h) + '"' + (i.x ? ' target="_blank" rel="noopener"' : '') + '>' + esc(i.l) + '</a></article>';
    }).join('') : '<p class="d-empty">No material matches your search. Try a different word, or write to us — we can help find it.</p>';
  }
  tabs.addEventListener('click', function (e) {
    var b = e.target.closest('.tab'); if (!b) return;
    cat = b.dataset.c;
    $$('.tab', tabs).forEach(function (t) { t.setAttribute('aria-selected', t === b); });
    drawDesk();
  });
  q.addEventListener('input', drawDesk);
  drawDesk();

  }

  /* ---------- Contact form → mailto ---------- */
  if ($('#cform')) $('#cform').addEventListener('submit', function (e) {
    e.preventDefault();
    var n = $('#cn').value.trim(), em = $('#ce').value.trim(), m = $('#cm').value.trim();
    var body = m + '\n\n— ' + n + ' (' + em + ')';
    window.location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Website enquiry from ' + n) + '&body=' + encodeURIComponent(body);
  });
})();
