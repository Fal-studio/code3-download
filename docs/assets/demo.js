// the app preview at the top of the download page: its tabs, check boxes and install button work like the real app
(function () {
  var app = document.querySelector('.app');
  if (!app) return;
  var en = document.documentElement.lang === 'en';
  var side = app.querySelector('.app-side'), list = app.querySelector('.app-list'), tag = app.querySelector('.tag');
  var G = {
    blue: '#1c2a44,#3b5a8c', red: '#3a1d1d,#a2342f', green: '#1b3326,#2f7a52', gray: '#2c2c2c,#6b6b6b',
    sand: '#3b3222,#9a7b45', teal: '#14303a,#2b7c8c', plum: '#2c1d38,#6d4594', night: '#0f141d,#33435e'
  };
  var L = en ? {
    tabs: ['Smart install', 'Plugins', 'Cars', 'OIV files', 'Crash check'],
    inst: 'Installed', go: 'Install {n}', none: 'Pick something to install', run: 'Installing {n}…', done: 'Done · {n} installed',
    goOne: 'Install', scan: 'Check now', scanning: 'Reading the game logs…', clean: 'No problems found',
    conflict: 'Conflict fixed for you', ok: 'Everything installed', mods: '{n} mods', mod: '1 mod'
  } : {
    tabs: ['التثبيت الذكي', 'الإضافات', 'السيارات', 'ملفات OIV', 'فحص الكراش'],
    inst: 'مثبّت', go: 'تثبيت {n}', none: 'اختر ما تريد تثبيته', run: 'جارٍ تثبيت {n}…', done: 'تم · ثُبّت {n}',
    goOne: 'تثبيت', scan: 'افحص الآن', scanning: 'جارٍ قراءة سجلات اللعبة…', clean: 'لا توجد مشاكل',
    conflict: 'تعارض محلول تلقائيًا', ok: 'تم التثبيت بنجاح', mods: '{n} مودات', mod: 'مود واحد'
  };
  // what each tab holds: [name, badge, colour, checked, installed]
  var D = [
    { pick: 1, rows: en
      ? [['Realistic', '17 add-ons', 'red', 1], ['Classic', '6 add-ons', 'blue'], ['Arabic', '17 add-ons', 'green']]
      : [['الواقعية', '17 إضافة', 'red', 1], ['الكلاسيكية', '6 إضافات', 'blue'], ['العربية', '17 إضافة', 'green']] },
    { rows: [['LSPD First Response', '', 'blue', 1, 1], ['Policing Redefined', en ? 'New' : 'جديد', 'red', 1], ['Emergency Lighting System', en ? 'Updated' : 'محدّث', 'green', 1], ['EUP Menu', en ? 'Plugin' : 'إضافة', 'gray']] },
    { rows: [['LSPD Explorer 2020', 'ELS', 'night', 1], ['LSPD Charger 2018', 'ELS', 'blue'], ['Highway Patrol Tahoe', 'ELS', 'sand', 1], ['K9 Unit Durango', 'ELS', 'gray']] },
    { rows: [['Realistic Sirens', 'OIV', 'red', 1], ['Police Lights Remastered', 'OIV', 'plum'], ['Better Road Textures', 'OIV', 'teal'], ['Radio Chatter Pack', 'OIV', 'gray', 1]] },
    { scan: 1, rows: [['RagePluginHook.log', '', 'gray'], ['ScriptHookV.log', '', 'teal'], ['ELS.log', '', 'green'], ['LSPDFR plugins', '', 'blue']] }
  ];
  var cur = 1, busy = false, tagT = null;
  // the note pops up for a moment, then gets out of the way of the progress bar
  function flash() { if (!tag) return; tag.querySelector('span').textContent = L.conflict; tag.classList.add('show'); clearTimeout(tagT); tagT = setTimeout(function () { tag.classList.remove('show'); }, 2600); }
  side.innerHTML = L.tabs.map(function (t, i) { return '<button type="button" data-t="' + i + '"' + (i === cur ? ' class="on"' : '') + '>' + t + '</button>'; }).join('');
  app.removeAttribute('aria-hidden');
  var fmt = function (s, n) { return s.replace('{n}', n === 1 ? L.mod : L.mods.replace('{n}', n)); };
  function picked() { return D[cur].rows.filter(function (r) { return r[3] && !r[4]; }); }
  function draw(state, pct) {
    var d = D[cur], h = '';
    d.rows.forEach(function (r, i) {
      var badge = r[4] ? '<small class="ok">' + L.inst + '</small>' : d.scan && r[5] ? '<small class="ok">✓</small>' : r[1] ? '<small>' + r[1] + '</small>' : '<small></small>';
      h += '<button type="button" class="row' + (r[3] || r[4] ? ' on' : '') + (d.pick ? ' rad' : '') + (d.scan ? ' log' : '') + '" data-r="' + i + '"' + (d.scan || (r[4] && !d.pick) || busy ? ' disabled' : '') +
        '><span class="ck"></span><span class="th" style="background:linear-gradient(135deg,' + G[r[2]] + ')"></span><b>' + r[0] + '</b>' + badge + '</button>';
    });
    var n = d.pick ? 1 : picked().length, txt, val = '';
    if (state === 'run') { txt = d.scan ? L.scanning : fmt(L.run, n); val = pct + '%'; }
    else if (state === 'done') { txt = d.scan ? L.clean : L.ok; val = '100%'; pct = 100; }
    else { txt = d.scan ? L.scan : d.pick ? L.goOne + ' · ' + d.rows.filter(function (r) { return r[3]; })[0][0] : n ? fmt(L.go, n) : L.none; pct = 0; }
    h += '<button type="button" class="prog' + (state ? ' ' + state : '') + '"' + ((!d.scan && !d.pick && !n && !state) || busy ? ' disabled' : '') + '><div><span>' + txt + '</span><b>' + val + '</b></div><p><i style="width:' + pct + '%"></i></p></button>';
    list.innerHTML = h;
  }
  function run() {
    var d = D[cur], tab = cur, p = 0, told = false;
    busy = true;
    if (tag) tag.classList.remove('show');
    draw('run', 0);
    var t = setInterval(function () {
      p = Math.min(100, p + 4 + Math.round(Math.random() * 6));
      if (tab !== cur) { clearInterval(t); busy = false; return; }
      // a conflict pops up half way, like in the app
      if (p > 40 && !d.scan && !told) { told = true; flash(); }
      if (p >= 100) {
        clearInterval(t); busy = false;
        d.rows.forEach(function (r) { if (d.scan) r[5] = 1; else if (r[3] && !d.pick) r[4] = 1; });
        if (d.pick) d.rows.forEach(function (r) { r[4] = r[3] ? 1 : 0; });
        draw('done');
        setTimeout(function () { if (tab === cur && !busy) { if (d.scan) d.rows.forEach(function (r) { r[5] = 0; }); draw(); } }, 2600);
        return;
      }
      draw('run', p);
    }, 140);
  }
  side.addEventListener('click', function (e) {
    var b = e.target.closest('[data-t]'); if (!b || busy) return;
    cur = +b.dataset.t;
    [].forEach.call(side.children, function (x) { x.classList.toggle('on', x === b); });
    draw();
  });
  list.addEventListener('click', function (e) {
    if (busy) return;
    var r = e.target.closest('[data-r]'), d = D[cur];
    if (r) {
      var row = d.rows[+r.dataset.r];
      if (d.pick) d.rows.forEach(function (x) { x[3] = x === row ? 1 : 0; x[4] = 0; });
      else row[3] = row[3] ? 0 : 1;
      return draw();
    }
    if (e.target.closest('.prog')) run();
  });
  draw();
  setTimeout(flash, 600);
})();
