# 3-2-1 Oyunu

**Futbolun ortak geçmişi.**

İki kulübün ortak futbolcularını ve bir futbolcunun A takım kariyerini saniyeler içinde arayın.
Canlı futbol içeriklerinde söylenen isimleri kontrol etmek için hazırlanmıştır.

## Tarayıcıda aç

**[3-2-1 Oyunu'nu aç](https://mustafaerkin.github.io/3-2-1-oyunu/)**

Bu adres GitHub Pages yayını etkinleştiğinde çalışır. Dosya indirmek, EXE çalıştırmak,
Python kurmak veya GitHub hesabıyla giriş yapmak gerekmez. Bilgisayarın ve telefonun
güncel tarayıcısından bağlantıyı açmak yeterlidir.

## Kullanım

- **Takım Kesişimi:** İki kulübü önerilerden seçin. Ortak oyuncular ve iki kulüpteki
  dönemleri hemen listelenir. Liste üstündeki kutuyla söylenen oyuncuyu bulun.
- **Oyuncu Ara:** İsmi yazıp oyuncuyu seçin. Paketteki kulüplerde geçen kariyerini,
  yılları, bilinen kiralık dönemleri ve kaynak etiketlerini görün.

`FB`, `Cimbom`, `Barça` gibi takma adlar kullanılabilir. Türkçe harfler ve aksanlar
aramayı engellemez: `İ/ı/í → i`, `ş → s`, `ñ → n`, `ø → o`.
Oyuncu önerilerinde yazılan kelimelere uymayan benzer isimler gösterilmez.

Sağ üstteki düğmeyle koyu veya açık temayı seçebilirsiniz. Tema tercihi bu tarayıcıda saklanır.

| Kısayol | İşlev |
| --- | --- |
| Ctrl + 1 | Takım Kesişimi |
| Ctrl + 2 | Oyuncu Ara |
| Esc | Aktif sekmedeki seçimi temizle |
| Tab | Alanlar arasında ilerle |
| ↑ / ↓ ve Enter | Önerilerde gezin ve seç |

## Veri kapsamı

| Bilgi | Bu paket |
| --- | --- |
| Oyuncu kimliği | 36.213 |
| Kulüp | 1.963 |
| Kaynaklı kariyer / transfer / sezon kaydı | 311.217 |
| Paket tarihi | 18.10.2026 |
| Başlıkta gösterilen dönem | 2026 Yaz |

Emekli futbolcular ve tarihî kayıtlar dahildir. Yalnız A takımlar gösterilir;
altyapı, B/C, rezerv ve millî takım dönemleri kapsam dışındadır.

**Bu paket bütün liglerin ve tarihî kadroların eksiksiz veritabanı değildir.**
Kulüp sayısı, o kulüplerin tüm kadrolarının mevcut olduğu anlamına gelmez.
Sonuç bulunmaması, oyuncunun o kulüpte hiç oynamadığını kanıtlamaz.
Eşleştirilemeyen aynı kişiye ait kimlikler ayrı kalabilir.

`2005–2008` kaynakta verilen kariyer dönemidir. `2005/06 (transfer kaydı)` veya
`2005/06 (sezon)` yalnız ilgili sezonun gözlemidir; kesin başlangıç/bitiş tarihi
veya resmî maçta oynama kanıtı değildir. `?` bilinmeyen yılı gösterir.

“Son Geçerli Transfer Dönemi” etiketi paket tarihinden üretilir. O dönemin bütün
transferlerinin doğrulandığı anlamına gelmez ve zaman geçince kendiliğinden ilerlemez.
Uygulama yeni veri taramaz; otomatik güncelleme veya çevrimiçi tamamlama yoktur.

## İnternet ve gizlilik

İlk açılışta siteyle birlikte yaklaşık **3,34 MiB** sıkıştırılmış veri yüklenir.
Veri yüklendikten sonra aramalar cihazın içinde çalışır; yazılan isimler sunucuya
gönderilmez. Açık sekmede internet kesilse de arama devam eder. İnternetsiz yeniden
açılış garanti edilmez; kalıcı çevrimdışı kullanım için ayrı Windows paketi vardır.

Uygulamada reklam, analiz kodu veya ziyaretçi hesabı yoktur. GitHub Pages, site
dosyalarını sunarken kendi erişim kayıtlarını tutabilir. Tema için tarayıcının
yerel depolaması kullanılır; özel modda tercih kalıcı olmayabilir.

## Kaynaklar

- [Wikipedia](https://en.wikipedia.org/) kariyer tabloları — ilgili içerik için
  [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- [eordo/transfermarkt-data](https://github.com/eordo/transfermarkt-data) transfer arşivi.
- [ewenme/squads](https://github.com/ewenme/squads) sezon kadroları.
- [salimt/football-datasets](https://github.com/salimt/football-datasets) kulüp ilişkileri.
- [Wikidata](https://www.wikidata.org/) kulüp dönemleri, kiralık işaretleri, doğum yılları ve
  kalıcı kimlik eşleştirmeleri ([CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)).

Veriler ortak bir şemaya dönüştürülmüş, kulüp kapsamı süzülmüş ve adlar eşleştirilmiştir.
Kaynak adresleri her kayıtta korunmuştur. Arşivlerin asıl sağlayıcısı Transfermarkt'tır;
kaynakların kullanım koşulları geçerlidir. Tüm veri paketine tek bir yazılım lisansı
atfedilmez. [Kaynak adresleri ve kapsam notları](KAYNAKLAR.txt).
