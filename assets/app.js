'use strict';
const $ = id => document.getElementById(id);
const state = {settings: {theme:'dark'}, dataset: null, rows: [], activeTab: 'intersection'};
const norm = globalThis.kesisimNormalize;
const el = (tag, cls, text) => {const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n;};
const flag = code => /^[A-Z]{2}$/.test(code || '') ? [...code].map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('') : '';
const years = globalThis.kesisimPeriods.years;
const teamMeta = t => [flag(t.country_code), t.country || 'Ülke bilinmiyor', t.level, t.kind].filter(Boolean).join(' · ');
const playerMeta = p => [p.birth_year ? `${p.birth_year} doğumlu` : 'Doğum yılı bilinmiyor', p.nationality || 'Uyruk bilinmiyor'].join(' · ');

async function api(url, method = 'GET', body, signal) {
  if (globalThis.kesisimWebApi) return globalThis.kesisimWebApi(url, method, body, signal);
  const options = {method, signal, headers: {'X-Kesisim': '1'}};
  if (body) { options.body = JSON.stringify(body); options.headers['Content-Type'] = 'application/json'; }
  const response = await fetch(url, options);
  const value = await response.json();
  if (!response.ok) throw new Error(typeof value.detail === 'string' ? value.detail : 'İstek işlenemedi. Girdiğiniz bilgileri kontrol edin.');
  return value;
}
function showError(error) {if (error.name === 'AbortError') return; $('error-message').textContent = error.message || String(error); $('error').hidden = false;}
$('dismiss-error').onclick = () => {$('error').hidden = true;};

class SearchBox {
  constructor(id, kind, onSelect) {
    this.id = id; this.kind = kind; this.onSelect = onSelect;
    this.input = $(id); this.list = $(id + '-options'); this.meta = $(id + '-meta');
    this.defaultMeta = this.meta.textContent;
    this.items = []; this.active = -1; this.selection = null; this.version = 0;
    this.input.addEventListener('input', () => {this.invalidate(); clearTimeout(this.timer); this.timer = setTimeout(() => this.search(), 30);});
    this.input.addEventListener('keydown', e => this.key(e));
    this.input.addEventListener('blur', () => {this.list.hidden = true; this.input.setAttribute('aria-expanded', 'false');});
    this.input.addEventListener('focus', () => {if (this.items.length && !this.selection) this.open();});
    $(id + '-field').querySelector('.clear-input').onclick = () => {this.clear(); this.input.focus();};
  }
  invalidate() {
    this.controller?.abort(); this.version++; this.selection = null; this.items = []; this.close();
    this.list.replaceChildren(); this.meta.textContent = this.defaultMeta; this.onSelect(null);
  }
  clear() {clearTimeout(this.timer); this.input.value = ''; this.invalidate();}
  close() {this.list.hidden = true; this.active = -1; this.input.setAttribute('aria-expanded', 'false'); this.input.removeAttribute('aria-activedescendant');}
  open() {this.list.hidden = false; this.input.setAttribute('aria-expanded', 'true');}
  async search() {
    const q = this.input.value.trim(); if (!q) return;
    const version = this.version; this.controller = new AbortController();
    try {
      const result = await api(`/api/${this.kind === 'team' ? 'takim' : 'oyuncu'}-ara?q=${encodeURIComponent(q)}`, 'GET', null, this.controller.signal);
      if (version !== this.version) return;
      this.items = result.items; this.dataset = result.dataset; this.list.replaceChildren(); this.active = -1;
      this.items.forEach((item, index) => {
        const option = el('li'); option.id = `${this.id}-option-${index}`; option.setAttribute('role', 'option'); option.setAttribute('aria-selected', 'false');
        option.append(el('span', 'option-name', item.name), el('span', 'option-meta', this.kind === 'team' ? teamMeta(item) : playerMeta(item)));
        option.addEventListener('mousedown', event => {event.preventDefault(); this.select(index);}); this.list.append(option);
      });
      if (this.items.length) this.open(); else {this.close(); this.meta.textContent = 'Yerel veride eşleşme bulunamadı.';}
    } catch (error) {showError(error);}
  }
  select(index) {this.selection = {...this.items[index], dataset: this.dataset}; this.input.value = this.selection.name; this.meta.textContent = this.kind === 'team' ? teamMeta(this.selection) : playerMeta(this.selection); this.close(); this.onSelect(this.selection);}
  key(event) {
    if (event.key === 'Escape') return;
    if (['ArrowDown', 'ArrowUp'].includes(event.key) && this.items.length) {
      event.preventDefault(); this.open(); const delta = event.key === 'ArrowDown' ? 1 : -1;
      this.active = (this.active + delta + this.items.length) % this.items.length;
      [...this.list.children].forEach((n, i) => n.setAttribute('aria-selected', String(i === this.active)));
      const option = this.list.children[this.active]; this.input.setAttribute('aria-activedescendant', option.id); option.scrollIntoView({block:'nearest'});
    } else if (event.key === 'Enter' && !this.list.hidden && this.items.length) {event.preventDefault(); this.select(this.active < 0 ? 0 : this.active);}
  }
}

let intersectionVersion = 0, playerVersion = 0;
const team1 = new SearchBox('team1', 'team', refreshIntersection);
const team2 = new SearchBox('team2', 'team', refreshIntersection);
const player = new SearchBox('player', 'player', refreshPlayer);

async function refreshIntersection() {
  const version = ++intersectionVersion;
  if (!team1.selection || !team2.selection) {$('intersection-results').hidden = true; $('intersection-empty').hidden = false; state.rows = []; return;}
  try {
    const a = team1.selection, b = team2.selection;
    if (a.dataset !== b.dataset) throw new Error('Veri kümesi değişti. İki takımı da yeniden seçin.');
    const result = await api(`/api/kesisim?t1=${a.id}&t2=${b.id}&dataset=${a.dataset}`);
    if (version !== intersectionVersion) return;
    state.rows = result.items; $('intersection-empty').hidden = true; $('intersection-results').hidden = false;
    $('common-count').textContent = result.count.toLocaleString('tr');
    $('result-note').textContent = a.dataset === 'demo' ? 'Demo verideki kurgusal kayıtlar' : 'Yerel veritabanında bulunan kayıtlar';
    $('same-team-note').hidden = a.id !== b.id;
    renderCommon();
  } catch (error) {if (version === intersectionVersion) {showError(error); $('intersection-results').hidden = true;}}
}
function periodText(records, chosen) {
  const entries = [...new Set(records.map(r => `${r.team_name !== chosen.name ? r.team_name + ' ' : ''}${globalThis.kesisimPeriods.compact(r)}`))];
  return `${chosen.name} ${entries.join(', ')}`;
}
function renderCommon() {
  const query = norm($('result-filter').value); const fragment = document.createDocumentFragment();
  const filtered = state.rows.filter(p => norm(p.name).includes(query));
  for (const p of filtered) {
    const row = el('div', 'player-row'); const name = el('div', 'player-name', p.name); name.append(el('span', 'birth-year', p.birth_year || '?'));
    row.append(name, el('div', 'periods', `${periodText(p.team1, team1.selection)} · ${periodText(p.team2, team2.selection)}`)); fragment.append(row);
  }
  $('common-list').replaceChildren(fragment); $('filtered-empty').hidden = filtered.length > 0;
  $('filtered-empty').textContent = state.rows.length ? 'Bu isimle eşleşen oyuncu bulunamadı.' : 'Yerel veride ortak oyuncu bulunamadı. Kaynak verisi eksik olabilir.';
}
$('result-filter').addEventListener('input', renderCommon);

async function refreshPlayer() {
  const version = ++playerVersion, selection = player.selection;
  if (!selection) {$('player-results').hidden = true; $('player-empty').hidden = false; return;}
  try {
    const result = await api(`/api/oyuncu/${selection.id}?dataset=${selection.dataset}`);
    if (version !== playerVersion) return;
    $('player-empty').hidden = true; $('player-results').hidden = false; $('player-name').textContent = result.player.name; $('player-details').textContent = playerMeta(result.player);
    const fragment = document.createDocumentFragment();
    for (const period of result.career) {
      const row = el('div', 'career-row'), club = el('div');
      club.append(el('div', 'career-club', [flag(period.country_code), period.team_name].filter(Boolean).join(' ')),
        el('div', 'career-sub', [period.country || 'Ülke bilinmiyor', period.kind, period.loan ? 'Kiralık' : '', globalThis.kesisimPeriods.detail(period)].filter(Boolean).join(' · ')));
      row.append(el('div', 'career-years', years(period)), club, el('span', 'source-tag', {wikidata:'Wikidata', wikipedia:'Wikipedia', transfermarkt:'Transfermarkt arşivi', demo:'Demo · kurgusal'}[period.source] || period.source)); fragment.append(row);
    }
    if (!result.career.length) fragment.append(el('p', 'empty-message', 'Bu oyuncunun kariyer kaydı henüz yok.'));
    $('career-list').replaceChildren(fragment);
  } catch (error) {if (version === playerVersion) showError(error);}
}

function switchTab(name, focus = true) {
  state.activeTab = name;
  for (const tab of ['intersection', 'player']) {const active = tab === name; $('tab-' + tab).setAttribute('aria-selected', String(active)); $('tab-' + tab).tabIndex = active ? 0 : -1; $(tab + '-panel').hidden = !active;}
  if (focus) (name === 'intersection' ? team1.input : player.input).focus();
}
document.querySelectorAll('[data-tab]').forEach(button => {button.onclick = () => switchTab(button.dataset.tab); button.onkeydown = e => {if (['ArrowLeft','ArrowRight'].includes(e.key)) {e.preventDefault(); switchTab(state.activeTab === 'player' ? 'intersection' : 'player', false); $('tab-' + state.activeTab).focus();}};});
document.addEventListener('keydown', event => {
  if (event.ctrlKey && ['1','2'].includes(event.key)) {event.preventDefault(); switchTab(event.key === '1' ? 'intersection' : 'player');}
  if (event.key === 'Escape') {if (state.activeTab === 'intersection') {team1.clear(); team2.clear(); $('result-filter').value = ''; team1.input.focus();} else {player.clear(); player.input.focus();}}
});

let savingTheme = false;
$('theme-toggle').onclick = async () => {
  if (savingTheme) return;
  savingTheme = true;
  const previous = state.settings.theme;
  state.settings.theme = previous === 'light' ? 'dark' : 'light'; syncSettings();
  try {state.settings = await api('/api/ayarlar', 'PUT', {theme:state.settings.theme});}
  catch (error) {state.settings.theme = previous; showError(error);}
  finally {savingTheme = false; syncSettings();}
};
function syncSettings() {
  const light = state.settings.theme === 'light';
  document.documentElement.dataset.theme = light ? 'light' : 'dark';
  $('theme-toggle').textContent = light ? '☾ Koyu tema' : '☀ Açık tema';
  $('theme-toggle').setAttribute('aria-label', light ? 'Koyu temaya geç' : 'Açık temaya geç');
  $('theme-toggle').setAttribute('aria-pressed', String(light));
}

let polling = false;
async function poll() {
  if (polling) return; polling = true;
  try {
    const status = await api('/api/veri/durum');
    if (state.dataset && state.dataset !== status.dataset) {team1.clear(); team2.clear(); player.clear(); $('result-filter').value = '';}
    state.dataset = status.dataset; if (!savingTheme) state.settings = status.settings;
    $('calendar-period').textContent = `Son Geçerli Transfer Dönemi: ${status.calendar_period}`;
    $('db-status').textContent = `${status.players.toLocaleString('tr')} oyuncu · ${status.teams.toLocaleString('tr')} takım · ${status.demo ? 'DEMO — kurgusal kayıtlar, hakem kararı için kullanmayın' : status.complete ? 'Yerel veri' : 'Sınırlı gerçek veri paketi'} · ${status.web ? 'Aramalar bu cihazda' : 'Çevrimdışı'}`;
    syncSettings();
  } catch (error) {showError(error);} finally {polling = false;}
}
poll();
