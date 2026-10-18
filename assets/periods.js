'use strict';
// A transfer-window observation is not a career interval or an appearance.
(function (root) {
  const transfer = row => /^transfer_(in|out|both)$/.test(row.precision || '');
  const years = row => transfer(row) || row.precision === 'season'
    ? (row.start_year === row.end_year ? String(row.start_year) : `${row.start_year}/${String(row.end_year).slice(-2)}`)
    : `${row.start_year ?? '?'}–${row.end_year ?? '?'}`;
  const detail = row => ({
    transfer_in:'Giriş transferi kaydı; kesin başlangıç tarihi bilinmiyor',
    transfer_out:'Çıkış transferi kaydı; kesin bitiş tarihi bilinmiyor',
    transfer_both:'Giriş/çıkış transfer kayıtları; kesin dönem bilinmiyor',
    season:'Sezon kadrosu'
  }[row.precision] || '');
  const compact = row => {
    const notes = [transfer(row) ? 'transfer kaydı' : row.precision === 'season' ? 'sezon' : '', row.loan ? 'kiralık' : ''].filter(Boolean);
    return `${years(row)}${notes.length ? ` (${notes.join(', ')})` : ''}`;
  };
  const api = {years, detail, compact, transfer};
  root.kesisimPeriods = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
