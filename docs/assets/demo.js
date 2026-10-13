// the app preview at the top of the download page: its tabs, check boxes and install button work like the real app.
// The install button plays the whole story: checking requirements and conflicts, downloading each mod, copying it
// into the game, then done.
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
    inst: 'Installed', btn: 'Install', scanBtn: 'Check', none: 'Pick something to install', ready: '{n} ready to install',
    readyPack: '{p} pack ready', check: 'Checking requirements and conflicts…', dl: 'Downloading {m}', cp: 'Installing {m} into the game',
    done: 'Done · {n} installed', wait: 'Waiting', copying: 'Installing', speed: 'MB/s', scan: 'Find out why the game stopped',
    scanning: 'Reading {m}…', clean: 'No problems found', fine: 'OK', conflict: 'Conflict fixed for you',
    reqs: 'RAGENativeUI added (needed)', mods: '{n} mods', mod: '1 mod'
  } : {
    tabs: ['التثبيت الذكي', 'الإضافات', 'السيارات', 'ملفات OIV', 'فحص الكراش'],
    inst: 'مثبّت', btn: 'تثبيت', scanBtn: 'افحص', none: 'اختر ما تريد تثبيته', ready: '{n} جاهزة للتثبيت',
    readyPack: 'باقة {p} جاهزة', check: 'جارٍ فحص المتطلبات والتعارضات…', dl: 'جارٍ تحميل {m}', cp: 'جارٍ تثبيت {m} في اللعبة',
    done: 'تم تثبيت {n}', wait: 'بالانتظار', copying: 'تثبيت', speed: 'MB/s', scan: 'اعرف سبب توقف اللعبة',
    scanning: 'جارٍ قراءة {m}…', clean: 'لا توجد مشاكل', fine: 'سليم', conflict: 'تعارض محلول تلقائيًا',
    reqs: 'أُضيف RAGENativeUI لأنه مطلوب', mods: '{n} مودات', mod: 'مود واحد'
  };
  // what each tab holds: [name, badge, colour, checked, installed, size MB]
  var D = [
    { pick: 1, rows: en
      ? [['Realistic', '20 add-ons', 'red', 1, 0, 2140], ['Classic', '8 add-ons', 'blue', 0, 0, 610], ['Arabic', '19 add-ons', 'green', 0, 0, 2380]]
      : [['الواقعية', '20 إضافة', 'red', 1, 0, 2140], ['الكلاسيكية', '8 إضافات', 'blue', 0, 0, 610], ['العربية', '19 إضافة', 'green', 0, 0, 2380]] },
    { rows: [['LSPD First Response', '', 'blue', 1, 1], ['Policing Redefined', en ? 'New' : 'جديد', 'red', 1, 0, 186], ['Emergency Lighting System', en ? 'Updated' : 'محدّث', 'green', 1, 0, 24], ['EUP Menu', en ? 'Plugin' : 'إضافة', 'gray', 0, 0, 12]] },
    { rows: [['LSPD Explorer 2020', 'ELS', 'night', 1, 0, 148], ['LSPD Charger 2018', 'ELS', 'blue', 0, 0, 131], ['Highway Patrol Tahoe', 'ELS', 'sand', 1, 0, 162], ['K9 Unit Durango', 'ELS', 'gray', 0, 0, 119]] },
    { rows: [['Realistic Sirens', 'OIV', 'red', 1, 0, 38], ['Police Lights Remastered', 'OIV', 'plum', 0, 0, 22], ['Better Road Textures', 'OIV', 'teal', 0, 0, 410], ['Radio Chatter Pack', 'OIV', 'gray', 1, 0, 64]] },
    { scan: 1, rows: [['RagePluginHook.log', '', 'gray'], ['ScriptHookV.log', '', 'teal'], ['ELS.log', '', 'green'], ['LSPDFR plugins', '', 'blue']] }
  ];
  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l-5-5m5 5l5-5M4 19h16"/></svg>';
  var cur = 1, busy = false, tagT = null, live = {}, foot = null;
  var n2 = function (n) { return n === 1 ? L.mod : L.mods.replace('{n}', n); };
  // the note pops up for a moment, then gets out of the way of the progress bar
  function flash(txt) {
    if (!tag) return;
    tag.querySelector('span').textContent = txt || L.conflict;
    tag.classList.add('show'); clearTimeout(tagT);
    tagT = setTimeout(function () { tag.classList.remove('show'); }, 2400);
  }
  side.innerHTML = L.tabs.map(function (t, i) { return '<button type="button" data-t="' + i + '"' + (i === cur ? ' class="on"' : '') + '>' + t + '</button>'; }).join('');
  app.removeAttribute('aria-hidden');
  function queue() { var d = D[cur]; return d.rows.filter(function (r) { return d.pick ? r[3] : r[3] && !r[4]; }); }
  // a row's badge: its own state while the story plays (waiting, downloading %, installing, done)
  function badge(r, i) {
    var s = live[i];
    if (s) {
      if (s.k === 'wait') return '<small class="st">' + L.wait + '</small>';
      if (s.k === 'dl') return '<small class="st dn">' + s.p + '%</small>';
      if (s.k === 'cp') return '<small class="st cp">' + L.copying + '</small>';
      if (s.k === 'read') return '<small class="st dn">…</small>';
      if (s.k === 'fine') return '<small class="ok">✓ ' + L.fine + '</small>';
    }
    if (r[4]) return '<small class="ok">' + L.inst + '</small>';
    return r[1] ? '<small>' + r[1] + '</small>' : '<small></small>';
  }
  function draw() {
    var d = D[cur], h = '';
    d.rows.forEach(function (r, i) {
      h += '<button type="button" class="row' + (r[3] || (r[4] && !d.pick) ? ' on' : '') + (d.pick ? ' rad' : '') + (d.scan ? ' log' : '') + (live[i] && live[i].k !== 'wait' ? ' hot' : '') + '" data-r="' + i + '"' +
        (d.scan || (r[4] && !d.pick) || busy ? ' disabled' : '') + '><span class="ck"></span><span class="th" style="background:linear-gradient(135deg,' + G[r[2]] + ')"></span><b>' + r[0] + '</b>' + badge(r, i) + '</button>';
    });
    var q = queue(), f = foot, pct = f ? f.p : 0, cls = f ? f.k : '';
    var title = f ? f.t : d.scan ? L.scan : d.pick ? L.readyPack.replace('{p}', q[0][0]) : q.length ? L.ready.replace('{n}', n2(q.length)) : L.none;
    // under the title: how much will be downloaded (or which logs get read)
    var mb = q.reduce(function (t, r) { return t + (r[5] || 0); }, 0);
    var sub = f ? f.s || '' : d.scan ? d.rows.map(function (r) { return r[0].replace(/\.log$/, ''); }).join(' · ') : mb ? (mb >= 1000 ? (mb / 1024).toFixed(1) + ' GB' : mb + ' MB') : '';
    var btn = f ? (f.k === 'done' ? '' : '<b class="pc">' + pct + '%</b>')
      : '<button type="button" class="go"' + (!d.scan && !q.length ? ' disabled' : '') + '>' + (d.scan ? '' : ICON) + '<span>' + (d.scan ? L.scanBtn : L.btn) + '</span></button>';
    h += '<div class="prog' + (cls ? ' ' + cls : '') + '"><div><span><em>' + title + '</em><small>' + (sub || '&nbsp;') + '</small></span>' + btn + '</div><p><i style="width:' + pct + '%"></i></p></div>';
    list.innerHTML = h;
  }
  // the story, step by step; each step is [ticks it lasts, what happens on each tick]
  function play() {
    var d = D[cur], tab = cur, q = queue(), steps = [];
    busy = true; live = {};
    q.forEach(function (r) { live[d.rows.indexOf(r)] = { k: 'wait' }; });
    if (d.scan) d.rows.forEach(function (r, i) { live[i] = { k: 'wait' }; });
    var done = 0, all = d.scan ? d.rows.length * 6 : 8 + q.length * 19;
    var bump = function () { done++; return Math.min(99, Math.round(done / all * 100)); };
    if (d.scan) {
      d.rows.forEach(function (r, i) {
        steps.push([6, function (t) { live[i] = { k: t === 5 ? 'fine' : 'read' }; foot = { k: 'run', t: L.scanning.replace('{m}', r[0]), p: bump() }; }]);
      });
    } else {
      steps.push([8, function (t) {
        foot = { k: 'run', t: L.check, p: bump() };
        if (t === 4) flash(cur === 1 ? L.conflict : L.reqs);
      }]);
      q.forEach(function (r) {
        var i = d.rows.indexOf(r), mb = r[5] || 50, sp = (6 + Math.random() * 9).toFixed(1);
        steps.push([14, function (t) {
          var p = Math.round((t + 1) / 14 * 100);
          live[i] = { k: 'dl', p: p };
          foot = { k: 'run', t: L.dl.replace('{m}', r[0]), s: Math.round(mb * p / 100) + ' / ' + mb + ' MB · ' + sp + ' ' + L.speed, p: bump() };
        }]);
        steps.push([5, function (t) {
          live[i] = { k: 'cp' }; foot = { k: 'run', t: L.cp.replace('{m}', r[0]), p: bump() };
          if (t === 4) { live[i] = null; r[4] = 1; if (d.pick) d.rows.forEach(function (x) { x[4] = x === r ? 1 : 0; }); }
        }]);
      });
    }
    var si = 0, ti = 0;
    var timer = setInterval(function () {
      if (tab !== cur) { clearInterval(timer); busy = false; live = {}; foot = null; return; }
      if (si >= steps.length) {
        clearInterval(timer); busy = false;
        foot = { k: 'done', t: d.scan ? L.clean : L.done.replace('{n}', n2(q.length)), p: 100 };
        draw();
        setTimeout(function () { if (tab === cur && !busy) { live = {}; foot = null; draw(); } }, 2800);
        return;
      }
      steps[si][1](ti);
      if (++ti >= steps[si][0]) { si++; ti = 0; }
      draw();
    }, 110);
  }
  side.addEventListener('click', function (e) {
    var b = e.target.closest('[data-t]'); if (!b || busy) return;
    cur = +b.dataset.t; live = {}; foot = null;
    [].forEach.call(side.children, function (x) { x.classList.toggle('on', x === b); });
    draw();
  });
  list.addEventListener('click', function (e) {
    if (busy) return;
    var r = e.target.closest('[data-r]'), d = D[cur];
    if (r) {
      var row = d.rows[+r.dataset.r];
      if (d.pick) d.rows.forEach(function (x) { x[3] = x === row ? 1 : 0; });
      else row[3] = row[3] ? 0 : 1;
      foot = null; return draw();
    }
    if (e.target.closest('.go')) play();
  });
  draw();
  setTimeout(function () { flash(); }, 600);
})();
