'use strict';
importScripts('normalize.js', 'engine.js');
let engine = null;
let initialization;

async function readData() {
  const response = await fetch('../data/manifest.json', {cache: 'no-cache'});
  if (!response.ok) throw new Error('Veri bilgisi yüklenemedi. Bağlantınızı kontrol edip sayfayı yenileyin.');
  const manifest = await response.json();
  const compressed = typeof DecompressionStream !== 'undefined';
  const asset = compressed ? manifest.gzip : manifest.json;
  if (!/^records-[a-f0-9]+\.json(?:\.gz)?$/.test(asset.file)) throw new Error('Veri dosyasının adı geçersiz.');
  const dataResponse = await fetch('../data/' + asset.file);
  if (!dataResponse.ok) throw new Error('Oyuncu verileri yüklenemedi. Bağlantınızı kontrol edip sayfayı yenileyin.');
  let bytes = new Uint8Array(await dataResponse.arrayBuffer());
  // Verify the immutable asset before parsing, including files served from caches.
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(v => v.toString(16).padStart(2, '0')).join('');
  if (digest !== asset.sha256) throw new Error('Veri dosyası eksik veya bozuk. Sayfayı yeniden yükleyin.');
  if (compressed) bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  const data = JSON.parse(new TextDecoder().decode(bytes));
  engine = new KesisimWebEngine.Engine(data);
}
self.onmessage = async event => {
  const {id, path, params} = event.data;
  try {
    if (!initialization) initialization = readData().catch(error => {initialization = null; throw error;});
    await initialization;
    self.postMessage({id, value: engine.handle(path, params)});
  } catch (error) {self.postMessage({id, error: error.message || 'Arama tamamlanamadı.'});}
};
