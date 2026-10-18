(function (root) {
  'use strict';
  const special = {'ı':'i','ø':'o','ł':'l','đ':'d','ð':'d','æ':'ae','œ':'oe','þ':'th','ß':'ss','ɨ':'i','ɪ':'i','ħ':'h','ŋ':'n','ŧ':'t','ƒ':'f','ə':'e','ſ':'s'};
  function normalize(value) {
    return String(value ?? '').toLowerCase().replace(/[ıøłđðæœþßɨɪħŋŧƒəſ]/gu, c => special[c])
      .normalize('NFKD').replace(/[\p{M}\p{Cf}]/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = normalize;
  else root.kesisimNormalize = normalize;
})(globalThis);
