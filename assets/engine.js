/* Browser-local query engine. No network, DOM, third-party packages or telemetry. */
(function (root) {
  'use strict';
  const normalize = typeof module !== 'undefined' && module.exports
    ? require('../static/normalize.js') : root.kesisimNormalize;
  const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
  const byName = (a, b) => compare(a.norm, b.norm) || a.id - b.id;
  const nullableYear = v => v == null ? -Infinity : v;
  const byPeriod = (a, b) => nullableYear(a.start_year) - nullableYear(b.start_year)
    || nullableYear(a.end_year) - nullableYear(b.end_year) || a.id - b.id;

  function lowerBound(words, query) {
    let lo = 0, hi = words.length;
    while (lo < hi) { const mid = (lo + hi) >>> 1; if (words[mid] < query) lo = mid + 1; else hi = mid; }
    return lo;
  }
  function matches(query, name) {
    const words = name.split(' ');
    return query.split(' ').every(token => words.some(word => word.startsWith(token)));
  }
  function similarity(a, b) {
    if (!a.length || !b.length) return 0;
    let prev = Array.from({length: b.length + 1}, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const next = [i];
      for (let j = 1; j <= b.length; j++) next[j] = Math.min(next[j - 1] + 1, prev[j] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = next;
    }
    return 100 * (1 - prev[b.length] / Math.max(a.length, b.length));
  }
  class SearchIndex {
    constructor(entities, aliases, weight = () => 0) {
      this.entities = entities; this.weight = weight;
      this.names = new Map([...entities].map(([id, row]) => [id, new Set([row.norm])]));
      for (const [id, name] of aliases) if (this.names.has(id) && normalize(name)) this.names.get(id).add(normalize(name));
      this.postings = new Map();
      for (const [id, names] of this.names) {
        for (const word of new Set([...names].flatMap(name => name.split(' ')))) {
          if (!this.postings.has(word)) this.postings.set(word, []);
          this.postings.get(word).push(id);
        }
      }
      this.words = [...this.postings.keys()].sort();
    }
    find(input, fuzzy = false, limit = 15) {
      const q = normalize(input).slice(0, 100);
      if (!q) return [];
      let candidates = null;
      for (const token of q.split(' ').sort((a, b) => b.length - a.length)) {
        const found = new Set();
        for (let i = lowerBound(this.words, token); i < this.words.length && this.words[i].startsWith(token); i++) {
          for (const id of this.postings.get(this.words[i])) if (candidates === null || candidates.has(id)) found.add(id);
        }
        candidates = found;
        if (!found.size) break;
      }
      let result = [];
      for (const id of candidates || []) {
        const names = [...this.names.get(id)].filter(name => matches(q, name));
        if (names.length) result.push({row: this.entities.get(id), score: Math.max(...names.map(n => n === q ? 110 : n.startsWith(q) ? 100 : 95))});
      }
      // Never add approximate player names to typed player results.
      if (fuzzy && !result.length && q.length >= 3) {
        for (const [id, names] of this.names) {
          const score = Math.max(...[...names].map(name => similarity(q, name)));
          if (score >= 75) result.push({row: this.entities.get(id), score});
        }
      }
      return result.sort((a, b) => b.score - a.score || this.weight(b.row) - this.weight(a.row) || byName(a.row, b.row)).slice(0, limit).map(r => r.row);
    }
  }
  class Engine {
    constructor(data) {
      if (data.schema !== 1 || !data.meta || !Array.isArray(data.memberships)) throw new Error('Veri paketi biçimi desteklenmiyor. Sayfayı yeniden yükleyin.');
      this.meta = data.meta;
      this.teams = new Map(data.teams.map(([id, name, country, country_code, level]) => [id, {id, name, norm: normalize(name), country, country_code, level, kind: 'kulüp', parent_id: null}]));
      this.players = new Map(data.players.map(([id, name, birth_year, nationality]) => [id, {id, name, norm: normalize(name), birth_year, nationality}]));
      this.byTeam = new Map([...this.teams.keys()].map(id => [id, new Map()]));
      this.byPlayer = new Map([...this.players.keys()].map(id => [id, []]));
      for (const [id, player_id, team_id, start_year, end_year, loan, source, precision, url] of data.memberships) {
        if (!this.teams.has(team_id) || !this.players.has(player_id)) throw new Error('Veri paketinde eşleşmeyen oyuncu veya takım kaydı var.');
        const team = this.teams.get(team_id);
        const record = {id, player_id, team_id, start_year, end_year, loan, source: data.sources[source], precision: data.precisions[precision], source_url: data.urls[url], team_name: team.name, country: team.country, country_code: team.country_code, kind: team.kind};
        this.byPlayer.get(player_id).push(record);
        const roster = this.byTeam.get(team_id);
        if (!roster.has(player_id)) roster.set(player_id, []);
        roster.get(player_id).push(record);
      }
      for (const roster of this.byTeam.values()) for (const periods of roster.values()) periods.sort(byPeriod);
      for (const periods of this.byPlayer.values()) periods.sort((a, b) => Number(a.start_year == null) - Number(b.start_year == null) || nullableYear(a.start_year) - nullableYear(b.start_year) || nullableYear(a.end_year) - nullableYear(b.end_year) || compare(this.teams.get(a.team_id).norm, this.teams.get(b.team_id).norm) || compare(a.source, b.source) || a.id - b.id);
      this.teamSearch = new SearchIndex(this.teams, data.team_aliases);
      // Among equally good matches the player with the longer recorded career comes first.
      this.playerSearch = new SearchIndex(this.players, data.player_aliases, row => this.byPlayer.get(row.id).length);
    }
    mainClubs(id, limit = 3) {
      // Clubs with the most recorded seasons, in career order: tells namesakes apart ("Ronaldo").
      const seasons = new Map();
      for (const r of this.byPlayer.get(id)) {
        const start = r.start_year ?? r.end_year;
        if (start == null) continue;
        const end = Math.min(r.end_year ?? start, start + 25);
        if (!seasons.has(r.team_id)) seasons.set(r.team_id, new Set());
        for (let y = start; y <= end; y++) seasons.get(r.team_id).add(y);
      }
      const first = years => Math.min(...years);
      return [...seasons].sort((a, b) => b[1].size - a[1].size || first(a[1]) - first(b[1])).slice(0, limit)
        .sort((a, b) => first(a[1]) - first(b[1])).map(([team]) => this.teams.get(team).name);
    }
    intersection(a, b) {
      a = Number(a); b = Number(b);
      if (!this.teams.has(a) || !this.teams.has(b)) throw new Error('Öneri listesinden geçerli bir takım seçin.');
      const first = this.byTeam.get(a), second = this.byTeam.get(b), smaller = first.size <= second.size ? first : second;
      const items = [];
      for (const id of smaller.keys()) if (first.has(id) && second.has(id)) items.push({...this.players.get(id), team1: first.get(id), team2: second.get(id)});
      items.sort(byName);
      return {items, count: items.length, teams: [this.teams.get(a), this.teams.get(b)], partial: !this.meta.complete};
    }
    handle(path, params = {}) {
      if (params.dataset && params.dataset !== 'live') throw new Error('Veri kümesi değişti. Yeniden seçim yapın.');
      if (path === '/api/takim-ara' || path === '/api/oyuncu-ara') {
        const q = params.q || '';
        if (q.length > 120) throw new Error('Arama metni en fazla 120 karakter olabilir.');
        if (path === '/api/takim-ara') return {dataset: 'live', items: this.teamSearch.find(q, true)};
        return {dataset: 'live', items: this.playerSearch.find(q).map(row => ({...row, clubs: this.mainClubs(row.id)}))};
      }
      if (path === '/api/kesisim') return this.intersection(params.t1, params.t2);
      if (/^\/api\/oyuncu\/\d+$/.test(path)) {
        const id = Number(path.split('/').pop());
        if (!this.players.has(id)) throw new Error('Oyuncu bulunamadı. Öneri listesinden yeniden seçin.');
        return {player: this.players.get(id), career: this.byPlayer.get(id)};
      }
      if (path === '/api/veri/durum') return {...this.meta, dataset: 'live', demo: false, web: true, local_search: true, updates_enabled: false};
      throw new Error('İstenen işlem bulunamadı.');
    }
  }
  const exported = {Engine, SearchIndex, matches};
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
  else root.KesisimWebEngine = exported;
})(globalThis);
