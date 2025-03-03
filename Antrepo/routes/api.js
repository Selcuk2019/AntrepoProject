// File: routes/api.js

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/customs - Gümrükler tablosundan verileri çek
router.get('/customs', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT gumruk_id, gumruk_adi, sinif, sehir_ad, bolge_mudurlugu FROM gumrukler ORDER BY gumruk_id'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/cities - Şehirler tablosundan şehir verilerini çek
router.get('/cities', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, sehir_ad FROM sehirler ORDER BY sehir_ad');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/regions - Bölge Müdürlükleri tablosundan verileri çek
router.get('/regions', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT bolge_id, bolge_mudurlugu FROM bolge_mudurlukleri ORDER BY bolge_mudurlugu'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/packaging-types - Paketleme tipleri tablosundan verileri çek
router.get('/packaging-types', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name FROM paketleme_tipleri ORDER BY name'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/companies - Şirket verilerini çek (örneğin, display_name için)
router.get('/companies', async (req, res) => {
  try {
    const sql = `
      SELECT s.sirket_id, s.company_name, s.display_name, s.phone_number, s.email,
             se.sehir_ad AS city_name, s.created_at, s.updated_at
      FROM sirketler s
      LEFT JOIN sehirler se ON s.address_city_id = se.id
      ORDER BY s.sirket_id
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/antrepolar - Tüm antrepolar (ID yerine metin değerler döndürülür)
// routes/api.js içinde
router.get('/antrepolar', async (req, res) => {
  try {
    const sql = `
      SELECT
        a.id,
        a.antrepoAdi,
        a.antrepoKodu,
        a.acikAdres,
        -- JOIN ile şehir adı
        s.sehir_ad   AS sehir,
        -- JOIN ile gümrük adı
        g.gumruk_adi AS gumruk,
        -- İhtiyacınız varsa:
        a.kapasite,
        a.notlar,
        a.aktif
      FROM antrepolar a
      LEFT JOIN sehirler s  ON a.sehir  = s.id
      LEFT JOIN gumrukler g ON a.gumruk = g.gumruk_id
      ORDER BY a.id DESC
    `;
    const [rows] = await db.query(sql);
    res.json(rows);  // ID yerine s.sehir_ad ve g.gumruk_adi dönmüş olacak
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/antrepolar/:id - Tekil kayıt; şehir ve gümrük adlarını metin olarak döndürür
router.get('/antrepolar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT
        a.id,
        a.antrepoAdi,
        a.antrepoKodu,
        a.acikAdres,
        s.sehir_ad   AS sehir,
        g.gumruk_adi AS gumruk
      FROM antrepolar a
      LEFT JOIN sehirler s  ON a.sehir  = s.id
      LEFT JOIN gumrukler g ON a.gumruk = g.gumruk_id
      WHERE a.id = ?
    `;
    const [rows] = await db.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Antrepo not found' });
    }
    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/* GET /api/antrepolar - Tüm antrepolar (lokasyon bilgisi)
router.get('/antrepolar', async (req, res) => {
  try {
    const sql = `
      SELECT
        id,
        antrepoAdi,
        antrepoKodu
      FROM antrepolar
      WHERE aktif = 1
      ORDER BY antrepoAdi
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});*/



// GET /api/antrepo-types - Antrepo tiplerini getir
router.get('/antrepo-types', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name FROM antrepo_tipleri ORDER BY name');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/birimler - Tüm birimleri getir
router.get('/birimler', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM birimler ORDER BY id');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/birimler/:id - Belirli birimi getir
router.get('/birimler/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM birimler WHERE id = ?', [id]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'Birim bulunamadı.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/hizmetler - Tüm hizmetleri getir
router.get('/hizmetler', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        h.*,
        b.birim_adi,
        pb.para_birimi_adi AS para_birimi_adi,
        pb.iso_kodu AS para_iso_kodu,
        pb.sembol AS para_sembol
      FROM hizmetler h
      LEFT JOIN birimler b ON h.birim_id = b.id
      LEFT JOIN para_birimleri pb ON h.para_birimi_id = pb.id
      ORDER BY h.id
    `);
    res.json(rows);
  } catch (error) {
    console.error("GET /api/hizmetler hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/hizmetler/:id - Belirli hizmeti getir
router.get('/hizmetler/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT 
        h.*,
        b.birim_adi,
        pb.para_birimi_adi AS para_birimi_adi,
        pb.iso_kodu AS para_iso_kodu,
        pb.sembol AS para_sembol
      FROM hizmetler h
      LEFT JOIN birimler b ON h.birim_id = b.id
      LEFT JOIN para_birimleri pb ON h.para_birimi_id = pb.id
      WHERE h.id = ?
    `, [id]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'Hizmet bulunamadı.' });
    }
  } catch (error) {
    console.error("GET /api/hizmetler/:id hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/para-birimleri - Tüm para birimlerini getir
router.get('/para-birimleri', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM para_birimleri ORDER BY id');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/para-birimleri/:id - Belirli para birimini getir
router.get('/para-birimleri/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM para_birimleri WHERE id = ?', [id]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'Para birimi bulunamadı.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sozlesmeler - Tüm sözleşmeleri getir (şirket display_name eklenmiş)
// Sözleşmeleri Getiren Endpoint
router.get('/sozlesmeler', async (req, res) => {
  try {
    const sql = `
      SELECT 
        s.id,
        s.sozlesme_kodu,
        s.sozlesme_adi,
        s.baslangic_tarihi,
        s.bitis_tarihi,
        s.fatura_periyodu,
        s.min_fatura,
        s.para_birimi,
        s.giris_gunu_kural,
        s.kismi_gun_yontemi,
        s.hafta_sonu_carpani,
        s.kdv_orani,
        s.doviz_kuru,
        s.sozlesme_sirket_id,
        c.display_name AS display_name
      FROM sozlesmeler s
      LEFT JOIN sirketler c ON s.sozlesme_sirket_id = c.sirket_id
      ORDER BY s.id
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET /api/sozlesmeler/:id - Belirli sözleşmeyi getir
// Belirli Sözleşmeyi Getiren Endpoint
router.get('/sozlesmeler/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM sozlesmeler WHERE id = ?', [id]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'Sözleşme bulunamadı.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sozlesmeler/:id/hizmetler - Belirli sözleşmenin hizmet kalemlerini getir
router.get('/api/sozlesmeler/:id/hizmetler', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM sozlesme_hizmetler WHERE sozlesme_id = ? ORDER BY id', [id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/urunler
router.get('/urunler', async (req, res) => {
  try {
    const sql = `
      SELECT
        u.id,
        u.name,
        u.code,
        u.paket_hacmi,
        u.paketleme_tipi_id,
        pt.name AS paketleme_tipi_name,  -- Eklendi
        u.description
      FROM urunler u
      LEFT JOIN paketleme_tipleri pt ON u.paketleme_tipi_id = pt.id
      ORDER BY u.name
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2) Tekil ürün (stok kartında kullanılacak)
router.get('/urunler/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT
        u.id,
        u.name,
        u.code,
        u.paket_hacmi,
        u.paketleme_tipi_id,
        pt.name AS paketleme_tipi_name,  -- Eklendi
        u.description
      FROM urunler u
      LEFT JOIN paketleme_tipleri pt ON u.paketleme_tipi_id = pt.id
      WHERE u.id = ?
    `;
    const [rows] = await db.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Ürün bulunamadı" });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/antrepo-giris', async (req, res) => {
  try {
    const sql = `
      SELECT 
         ag.id,
         ag.beyanname_no,
         ag.beyanname_form_tarihi,
         IFNULL(a.antrepoAdi, '') AS antrepo_adi,  -- antrepo_id yerine antrepoAdi
         ag.antrepo_sirket_adi,
         ag.gumruk,
         ag.gonderici_sirket,
         ag.alici_sirket,
         ag.urun_tanimi,
         ag.miktar,
         ag.kap_adeti,
         ag.antrepo_giris_tarihi,
         ag.proforma_no,
         ag.ticari_fatura_no,
         ag.depolama_suresi,
         -- Diğer tüm sütunlar da eklensin, böylece "sütun ekle" için kullanılabilir:
         ag.urun_kodu,
         ag.paket_boyutu,
         ag.paketleme_tipi,
         ag.brut_agirlik,
         ag.net_agirlik,
         ag.proforma_tarihi,
         ag.ticari_fatura_tarihi,
         ag.fatura_meblagi,
         ag.urun_birim_fiyat,
         ag.para_birimi,
         ag.created_at,
         ag.updated_at
      FROM antrepo_giris ag
      LEFT JOIN antrepolar a ON ag.antrepo_id = a.id
      ORDER BY ag.id DESC
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (error) {
    console.error("GET /api/antrepo-giris hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/antrepo-giris/:id - Belirli bir antrepo giriş kaydını getirir
router.get('/antrepo-giris/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
         ag.id,
         ag.beyanname_no,
         ag.beyanname_form_tarihi,
         IFNULL(a.antrepoAdi, '') AS antrepo_adi,
         ag.antrepo_sirket_adi,
         ag.gumruk,
         ag.gonderici_sirket,
         ag.alici_sirket,
         ag.urun_tanimi,
         ag.miktar,
         ag.kap_adeti,
         ag.antrepo_giris_tarihi,
         ag.proforma_no,
         ag.ticari_fatura_no,
         ag.depolama_suresi,
         ag.antrepo_kodu,
         ag.urun_kodu,
         ag.paket_boyutu,
         ag.paketleme_tipi,
         ag.brut_agirlik,
         ag.net_agirlik,
         ag.proforma_tarihi,
         ag.ticari_fatura_tarihi,
         ag.fatura_meblagi,
         ag.urun_birim_fiyat,
         ag.para_birimi,
         ag.adres,
         ag.sehir,
         ag.sozlesme_id,
         ag.fatura_aciklama,
         ag.created_at,
         ag.updated_at
      FROM antrepo_giris ag
      LEFT JOIN antrepolar a ON ag.antrepo_id = a.id
      WHERE ag.id = ?
    `;
    const [rows] = await db.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("GET /api/antrepo-giris/:id hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/antrepo-giris/:id/hareketler', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
         id,
         antrepo_giris_id,
         islem_tarihi,
         islem_tipi,
         miktar,
         kap_adeti,
         brut_agirlik,
         net_agirlik,
         birim_id,
         aciklama,
         created_at,
         updated_at
      FROM antrepo_hareketleri
      WHERE antrepo_giris_id = ?
      ORDER BY islem_tarihi DESC
    `;
    const [rows] = await db.query(sql, [id]);
    res.json(rows);
  } catch (error) {
    console.error("GET /api/antrepo-giris/:id/hareketler hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

// routes/api.js

router.get('/sozlesmeler/:id/parametreler', async (req, res) => {
  try {
    const { id } = req.params;
    // Sözleşme bilgilerini çekelim
    const contractSql = `
      SELECT 
        id, sozlesme_sirket_id, sozlesme_kodu, sozlesme_adi, baslangic_tarihi, bitis_tarihi,
        fatura_periyodu, min_fatura, para_birimi, giris_gunu_kural, kismi_gun_yontemi,
        hafta_sonu_carpani, kdv_orani, doviz_kuru
      FROM sozlesmeler
      WHERE id = ?
    `;
    const [contractRows] = await db.query(contractSql, [id]);
    if (!contractRows || contractRows.length === 0) {
      return res.status(404).json({ error: "Sözleşme bulunamadı." });
    }
    const contract = contractRows[0];

    // Sözleşmeye bağlı hizmet kalemlerini çekelim
    const serviceSql = `
      SELECT 
        id, sozlesme_id, hizmet_tipi, oran, birim, min_ucret, temel_ucret, carpan
      FROM sozlesme_hizmetler
      WHERE sozlesme_id = ?
    `;
    const [serviceRows] = await db.query(serviceSql, [id]);

    res.json({ contract, services: serviceRows });
  } catch (error) {
    console.error("GET /sozlesmeler/:id/parametreler hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/stock-card/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    // Ürün kodunu alalım
    const productSql = 'SELECT code FROM urunler WHERE id = ?';
    const [productRows] = await db.query(productSql, [productId]);
    if (!productRows || productRows.length === 0) {
      return res.status(404).json({ error: 'Ürün bulunamadı.' });
    }
    const productCode = productRows[0].code;
  
    // Stok hesaplaması: antrepo_hareketleri tablosundaki giriş/çıkış hareketlerini toplayalım
    const sql = `
      SELECT 
        SUM(CASE WHEN islem_tipi = 'Giriş' THEN miktar ELSE -miktar END) AS currentStock
      FROM antrepo_hareketleri
      WHERE antrepo_giris_id IN (
         SELECT id FROM antrepo_giris WHERE urun_kodu = ?
      )
    `;
    const [rows] = await db.query(sql, [productCode]);
    const currentStock = rows[0].currentStock || 0;
    res.json({ currentStock });
  } catch (error) {
    console.error("GET /stock-card/:productId hatası:", error);
    res.status(500).json({ error: error.message });
  }
});


// GET /api/maliyet-analizi - Tüm antrepo_giris kayıtları için maliyet analizi özet verisi
// routes/api.js
router.get('/maliyet-analizi', async (req, res) => {
  try {
    // 1) Tüm antrepo_giris kayıtlarını çek
    const sqlGirisler = `
      SELECT ag.id,
             ag.antrepo_giris_tarihi,
             ag.beyanname_no,
             ag.beyanname_form_tarihi,
             ag.sozlesme_id,
             ag.urun_kodu,
             u.name AS productName,
             u.code AS productCode
      FROM antrepo_giris ag
      LEFT JOIN urunler u ON ag.urun_kodu = u.code
      ORDER BY ag.id
    `;
    const [rowsGiris] = await db.query(sqlGirisler);

    // Sonuçları bu diziye push edeceğiz
    const resultArray = [];

    for (const girisData of rowsGiris) {
      const girisId = girisData.id;

      // 2) Sözleşmeyi bul
      let sozlesme = null;
      if (girisData.sozlesme_id) {
        const [rowsSoz] = await db.query(`SELECT * FROM sozlesmeler WHERE id = ?`, [girisData.sozlesme_id]);
        sozlesme = rowsSoz[0] || null;
      }

      // 3) Sözleşme hizmetlerini (Ardiye, Mesai vb.) bul
      let rowsHizmetler = [];
      if (girisData.sozlesme_id) {
        const [rowsH] = await db.query(`SELECT * FROM sozlesme_hizmetler WHERE sozlesme_id = ?`, [girisData.sozlesme_id]);
        rowsHizmetler = rowsH;
      }

      // Ardiye hizmet parametresini yakala (örnek: hizmet_tipi='Ardiye')
      const ardiyeHizmet = rowsHizmetler.find(h => h.hizmet_tipi.toLowerCase() === 'ardiye');
      // Mesai hizmet parametresini yakala (örnek: hizmet_tipi='Mesai')
      const mesaiHizmet = rowsHizmetler.find(h => h.hizmet_tipi.toLowerCase() === 'mesai');

      // 4) Giriş-Çıkış hareketlerini çek
      const sqlHareketler = `
        SELECT 
          islem_tarihi,
          islem_tipi,
          miktar,
          kap_adeti,
          aciklama
        FROM antrepo_hareketleri
        WHERE antrepo_giris_id = ?
        ORDER BY islem_tarihi
      `;
      const [rowsHareket] = await db.query(sqlHareketler, [girisId]);

      // 4.1) Toplam giriş miktarı (ton) => "Antrepo Giriş Adedi" (Aslında "toplam giren ton")
      const totalGirisTon = rowsHareket
        .filter(r => r.islem_tipi === 'Giriş')
        .reduce((sum, r) => sum + parseFloat(r.miktar || 0), 0);

      // 4.2) Mevcut stok (ton) => sum(giriş) - sum(çıkış)
      const currentStock = rowsHareket.reduce((acc, row) => {
        if (row.islem_tipi === 'Giriş') return acc + parseFloat(row.miktar || 0);
        else return acc - parseFloat(row.miktar || 0);
      }, 0);

      // 4.3) Mevcut kap adedi => benzer mantık
      const currentKap = rowsHareket.reduce((acc, row) => {
        if (row.islem_tipi === 'Giriş') return acc + (row.kap_adeti || 0);
        else return acc - (row.kap_adeti || 0);
      }, 0);

      // 4.4) Son çıkış tarihi (varsa)
      let lastExitDate = null;
      let lastExitAmount = null;
      const cikislar = rowsHareket.filter(r => r.islem_tipi === 'Çıkış');
      if (cikislar.length > 0) {
        // En son çıkış
        const last = cikislar[cikislar.length - 1];
        lastExitDate = last.islem_tarihi;
        lastExitAmount = last.miktar;
      }

      // 5) Günlük iterasyonla ardiye/mesai hesaplama (örnek)
      //    - Basit mantık: Başlangıç: antrepo_giris_tarihi
      //    - Bitiş: "bugün" veya stok sıfırlanana kadar
      //    - Her gün: cost += (temel_ucret + carpan * stok) [Ardiye]
      //               + eğer o gün çıkış varsa mesai vb.
      let dailyCost = 0;
      const dailyBreakdown = [];
      const startDate = new Date(girisData.antrepo_giris_tarihi);
      const nowDate = new Date();  // veya sabit 30 gün
      const maxDays = 60; // Örnek: 60 gün kısıt

      // Stok takibi için kopya
      let simStock = 0;
      // Gün gün gidebilmek için önce "giriş" olayları da hesaba katacağız.
      // En basit yöntem: 0. gün stok 0, ilk "Giriş" islem_tarihi = antrepo_giris_tarihi
      // gerçekte hareket tablosunu da gün bazında parçalayıp iter etmek daha doğru.
      // Bu örnekte, "antrepo_giris_tarihi"nde 'initial' stoğu kabul edeceğiz:
      simStock = totalGirisTon; 

      // Çıkışları map'leyelim: (günDiff => toplam çıkış)
      // (Gerçek kodda saat/dakika farkları vs. mesai hesapları girer.)
      const exitMap = {};
      for (let c of cikislar) {
        const diff = Math.floor((new Date(c.islem_tarihi) - startDate) / (1000*3600*24));
        if (!exitMap[diff]) exitMap[diff] = 0;
        exitMap[diff] += parseFloat(c.miktar || 0);
      }

      let cumulativeCost = 0;
      for (let d = 0; d < maxDays; d++) {
        if (simStock <= 0) break;  // stok bittiyse dur

        // Ardiye hesapla
        let dayArdiye = 0;
        if (ardiyeHizmet) {
          const temel = parseFloat(ardiyeHizmet.temel_ucret || 0);
          const carp = parseFloat(ardiyeHizmet.carpan || 0);
          const minUcret = parseFloat(ardiyeHizmet.min_ucret || 0);

          dayArdiye = temel + carp * simStock;
          if (dayArdiye < minUcret) dayArdiye = minUcret;
        }

        // Mesai örneği (çok basit: her çıkış olduğunda +200 USD)
        // Gerçek hayatta saat ve hafta sonu kontrolü vb. yapılır
        let dayMesai = 0;
        let dayExit = 0;
        if (exitMap[d]) {
          dayExit = exitMap[d];
          if (mesaiHizmet) {
            // Örnek: sabit 200
            dayMesai = 200;
          }
          // stok düş
          simStock -= dayExit;
          if (simStock < 0) simStock = 0;
        }

        const dayTotal = dayArdiye + dayMesai;
        cumulativeCost += dayTotal;

        dailyBreakdown.push({
          dayIndex: d,
          event: (dayExit > 0) ? `Çıkış (${dayExit} ton)` : 'Ardiye',
          ardiye: dayArdiye,
          mesai: dayMesai,
          dailyTotal: dayTotal,
          cumulativeTotal: cumulativeCost,
          stockAfter: simStock
        });
      }

      // Mevcut Maliyet = cumulativeCost (hesaplama bittiğinde)
      const currentCost = cumulativeCost;
      // Toplam Maliyet = aynı (bu örnekte stok bitmediği sürece)
      const totalCost = cumulativeCost;

      // Birim Maliyet = totalCost / totalGirisTon
      let unitCost = 0;
      if (totalGirisTon > 0) {
        unitCost = totalCost / totalGirisTon;
      }

      // 6) Tabloda göstereceğimiz özet
      const rowItem = {
        productName: girisData.productName || '-',
        productCode: girisData.productCode || '-',
        // *** Giriş Tarihi Olarak "antrepo_giris_tarihi" kullanalım
        entryDate: girisData.antrepo_giris_tarihi,
        formNo: girisData.beyanname_no || '-',
        // "Antrepo Giriş Adedi" => toplam giren miktar (ton)
        entryCount: parseFloat(totalGirisTon.toFixed(2)),
        entryKapCount: null, // Sadece tabloya yazacaksan istersen
        lastExitDate: lastExitDate,
        lastExitAmount: lastExitAmount,
        currentStock: parseFloat(currentStock.toFixed(2)),
        currentKapCount: currentKap,
        currentCost: parseFloat(currentCost.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        unitCostImpact: parseFloat(unitCost.toFixed(2)),
        entryId: girisId
      };

      resultArray.push(rowItem);
    }

    res.json(resultArray);
  } catch (error) {
    console.error("GET /api/maliyet-analizi hatası:", error);
    res.status(500).json({ error: error.message });
  }
});


// GET /api/hesaplama-motoru/:girisId - Antrepo giriş formu bazlı hesaplama motoru
router.get('/api/hesaplama-motoru/:girisId', async (req, res) => {
  try {
    const girisId = req.params.girisId;

    // 1) Antrepo giriş verisini çek
    const sqlGiris = `
      SELECT 
        ag.id, 
        ag.beyanname_no, 
        ag.beyanname_form_tarihi,
        ag.miktar AS initialStock, -- Toplam stok (ör. ton cinsinden)
        ag.kap_adeti,
        ag.antrepo_giris_tarihi,
        ag.sozlesme_id,
        u.name AS urun_adi,
        u.code AS urun_kodu
      FROM antrepo_giris ag
      LEFT JOIN urunler u ON ag.urun_kodu = u.code
      WHERE ag.id = ?
    `;
    const [rowsGiris] = await db.query(sqlGiris, [girisId]);
    if (!rowsGiris || rowsGiris.length === 0) {
      return res.status(404).json({ error: 'Antrepo girişi bulunamadı.' });
    }
    const girisData = rowsGiris[0];

    // 2) İlgili sözleşmeyi çek (antrepo girişte belirtilen sözleşme_id üzerinden)
    const sqlSozlesme = `SELECT * FROM sozlesmeler WHERE id = ?`;
    const [rowsSozlesme] = await db.query(sqlSozlesme, [girisData.sozlesme_id]);
    if (!rowsSozlesme || rowsSozlesme.length === 0) {
      return res.status(404).json({ error: 'Sözleşme bulunamadı.' });
    }
    const sozlesme = rowsSozlesme[0];

    // 3) Sözleşmeye bağlı hizmet kalemlerini çek (örneğin, "ardiye" hizmeti)
    const sqlHizmetler = `SELECT * FROM sozlesme_hizmetler WHERE sozlesme_id = ?`;
    const [rowsHizmetler] = await db.query(sqlHizmetler, [girisData.sozlesme_id]);

    // 4) Antrepo girişine ait çıkış hareketlerini çek (sadece "Çıkış" tipi)
    const sqlCikislar = `
      SELECT 
        islem_tarihi, 
        miktar, 
        islem_tipi,
        aciklama
      FROM antrepo_hareketleri
      WHERE antrepo_giris_id = ? 
        AND islem_tipi = 'Çıkış'
      ORDER BY islem_tarihi
    `;
    const [rowsCikislar] = await db.query(sqlCikislar, [girisId]);

    // --------------------------------------------------
    // HESAPLAMA LOJİĞİ
    // --------------------------------------------------
    const MAX_DAYS = 30; // Örnek: 30 gün boyunca hesaplama yapılıyor
    const entryDate = new Date(girisData.antrepo_giris_tarihi);
    let currentStock = parseFloat(girisData.initialStock) || 0;
    let cumulativeCost = 0;
    const dailyBreakdown = [];

    // Çıkış hareketlerini gün bazında toplamak için bir harita (diffDays => toplam çıkış miktarı)
    const cikisMap = {};
    rowsCikislar.forEach(c => {
      const diffDays = Math.floor(
        (new Date(c.islem_tarihi) - entryDate) / (1000 * 60 * 60 * 24)
      );
      cikisMap[diffDays] = (cikisMap[diffDays] || 0) + parseFloat(c.miktar || 0);
    });

    // "Ardiye" hizmeti örneği (sözleşme_hizmetler içinden arıyoruz)
    const ardiyeHizmet = rowsHizmetler.find(h => h.hizmet_tipi.toLowerCase() === 'ardiye');

    // Günlük hesaplamayı başlat
    for (let day = 0; day <= MAX_DAYS; day++) {
      if (currentStock <= 0) break;
      const thisDate = new Date(entryDate);
      thisDate.setDate(thisDate.getDate() + day);

      // 1) Günlük Ardiye hesaplaması
      let dailyArdiye = 0;
      if (ardiyeHizmet) {
        const temel = parseFloat(ardiyeHizmet.temel_ucret) || 0;
        const carpan = parseFloat(ardiyeHizmet.carpan) || 0;
        dailyArdiye = temel + carpan * currentStock;
        if (ardiyeHizmet.min_ucret) {
          dailyArdiye = Math.max(dailyArdiye, parseFloat(ardiyeHizmet.min_ucret));
        }
      }

      // 2) Eğer gün için çıkış hareketi varsa hesaplama
      let cikisMiktar = 0;
      let indiBindi = 0;
      let mesaiUcreti = 0;
      if (cikisMap[day]) {
        cikisMiktar = cikisMap[day];
        // Örnek indiBindi oranı: 2 USD/ton
        indiBindi = 2 * cikisMiktar;

        // Örnek mesai hesaplaması: Hafta sonu ise mesai ücreti ekle (örnek 200 USD)
        const dayOfWeek = thisDate.getDay(); // 0: Pazar, 6: Cumartesi
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          mesaiUcreti = 200;
        }

        // Stok düşürülür
        currentStock -= cikisMiktar;
        if (currentStock < 0) currentStock = 0;
      }

      // 3) Günlük toplam maliyet
      const dailyTotal = dailyArdiye + indiBindi + mesaiUcreti;
      cumulativeCost += dailyTotal;

      // 4) Günlük detayları diziye ekle
      dailyBreakdown.push({
        dayIndex: day,
        date: thisDate.toISOString().substring(0,10),
        event: (cikisMiktar > 0) ? `Çıkış (${cikisMiktar} ton)` : 'Ardiye',
        stockAfter: currentStock,
        ardiye: dailyArdiye,
        indiBindi: indiBindi,
        mesai: mesaiUcreti,
        dailyTotal: dailyTotal,
        cumulativeTotal: cumulativeCost
      });
    }

    // Sonuç verisini hazırla
    const result = {
      antrepoGiris: {
        id: girisData.id,
        beyanname_no: girisData.beyanname_no,
        giris_tarihi: girisData.antrepo_giris_tarihi,
        initialStock: girisData.initialStock,
        urun_adi: girisData.urun_adi,
        urun_kodu: girisData.urun_kodu
      },
      sozlesme: sozlesme,
      dailyBreakdown,
      finalCumulativeCost: cumulativeCost
    };

    res.json(result);
  } catch (err) {
    console.error("Hesaplama motoru hata:", err);
    res.status(500).json({ error: err.message });
  }
});


// Örnek: routes/api.js

router.get('/antrepo-giris/:girisId/ek-hizmetler', async (req, res) => {
  try {
    const { girisId } = req.params;
    const sql = `
      SELECT 

        agh.id,
        agh.antrepo_giris_id,
        agh.hizmet_id,
        h.hizmet_adi,
        agh.para_birimi_id,
        pb.iso_kodu AS para_iso,
        agh.adet,
        agh.temel_ucret,
        agh.carpan,
        agh.toplam,
        agh.aciklama,
        agh.created_at,
+       DATE_FORMAT(agh.ek_hizmet_tarihi, '%Y-%m-%d') AS ek_hizmet_tarihi
      FROM antrepo_giris_hizmetler agh
      LEFT JOIN hizmetler h ON agh.hizmet_id = h.id
      LEFT JOIN para_birimleri pb ON agh.para_birimi_id = pb.id
      WHERE agh.antrepo_giris_id = ?
      ORDER BY agh.id
    `;
    const [rows] = await db.query(sql, [girisId]);
    res.json(rows);
  } catch (error) {
    console.error("GET /api/antrepo-giris/:girisId/ek-hizmetler hata:", error);
    res.status(500).json({ error: error.message });
  }
});


// POST /api/urunler
router.post('/urunler', async (req, res) => {
  try {
    const { name, code, paket_hacmi, paketleme_tipi_id, description } = req.body;

    // Basit validasyon
    if (!name || !code) {
      return res.status(400).json({ error: "Ürün adı ve kodu zorunludur." });
    }

    const sql = `
      INSERT INTO urunler
      (name, code, paket_hacmi, paketleme_tipi_id, description)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [
      name,
      code,
      paket_hacmi || 0,
      paketleme_tipi_id || null,
      description || null
    ];

    const [result] = await db.query(sql, values);
    res.json({ success: true, insertedId: result.insertId });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      // MySQL duplicate hatası
      // Hangi index'in tetiklendiğini error.sqlMessage veya error.message içinde bulabiliriz
      if (error.sqlMessage.includes('idx_urun_code')) {
        return res.status(400).json({ error: "Bu ürün kodu zaten mevcut!" });
      } else if (error.sqlMessage.includes('idx_urun_name')) {
        return res.status(400).json({ error: "Bu ürün adı zaten mevcut!" });
      }
      // Genel mesaj
      return res.status(400).json({ error: "Tekrarlı kayıt hatası (code veya name)!" });
    }
    // Diğer hatalar
    res.status(500).json({ error: error.message });
  }
});





// POST /api/companies - Yeni şirket ekle
router.post('/companies', async (req, res) => {
  try {
    const {
      firstName, lastName, companyName, displayName, emailAddress, phoneNumber,
      currency, taxRate, taxNumber, taxOffice, paymentTerms,
      address, customs
    } = req.body;

    const sqlInsert = `
      INSERT INTO sirketler 
      (first_name, last_name, company_name, display_name, phone_number, email, 
       currency, tax_rate, tax_number, tax_office, payment_terms, 
       address_city_id, address_district, address_postal_code, address_detail)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      firstName || null,
      lastName || null,
      companyName,
      displayName,
      phoneNumber,
      emailAddress || null,
      currency,
      taxRate || null,
      taxNumber || null,
      taxOffice || null,
      paymentTerms || null,
      address.city_id,
      address.district || '',
      address.postalCode || '',
      address.detail
    ];
    const [result] = await db.query(sqlInsert, values);
    res.json({ success: true, insertedId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/antrepolar - Yeni antrepo ekle
router.post('/antrepolar', async (req, res) => {
  try {
    const {
      id,
      antrepoKodu,
      antrepoAdi,
      antrepoTipi,
      gumruk,
      gumrukMudurlugu,
      sehir,
      acikAdres,
      antrepoSirketi,
      kapasite,
      notlar,
      aktif
    } = req.body;

    const sql = `
      INSERT INTO antrepolar
      (id, antrepoKodu, antrepoAdi, antrepoTipi, gumruk, gumrukMudurlugu, sehir, acikAdres,
       antrepoSirketi, kapasite, notlar, aktif)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      id,
      antrepoKodu,
      antrepoAdi,
      antrepoTipi,
      gumruk,
      gumrukMudurlugu,
      sehir,
      acikAdres,
      antrepoSirketi,
      kapasite || null,
      notlar || null,
      aktif !== undefined ? aktif : true
    ];
    const [result] = await db.query(sql, values);
    res.json({ success: true, insertedId: id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/birimler - Yeni birim ekle
router.post('/birimler', async (req, res) => {
  try {
    const { birim_adi, kategori, sembol, kisa_kod, durum } = req.body;
    const sql = 'INSERT INTO birimler (birim_adi, kategori, sembol, kisa_kod, durum) VALUES (?, ?, ?, ?, ?)';
    const values = [birim_adi, kategori, sembol, kisa_kod, durum];
    const [result] = await db.query(sql, values);
    res.json({ success: true, insertedId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/hizmetler - Yeni hizmet ekle
router.post('/hizmetler', async (req, res) => {
  const { 
    hizmet_adi, hizmet_kodu, hizmet_tipi, birim_id, temel_ucret, min_ucret, carpan, 
    para_birimi_id, aciklama, durum, hesaplama_kosullari, mesai_saatleri 
  } = req.body;
  const sql = `
    INSERT INTO hizmetler 
      (hizmet_adi, hizmet_kodu, hizmet_tipi, birim_id, temel_ucret, min_ucret, carpan, 
      para_birimi_id, aciklama, durum, hesaplama_kosullari, mesai_saatleri, olusturulma_tarihi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;
  try {
    const [result] = await db.query(sql, [
      hizmet_adi, hizmet_kodu, hizmet_tipi, birim_id, temel_ucret, min_ucret, carpan, 
      para_birimi_id, aciklama, durum, JSON.stringify(hesaplama_kosullari), mesai_saatleri
    ]);
    res.json({ success: true, insertedId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// POST /api/para-birimleri - Yeni para birimi ekle
router.post('/para-birimleri', async (req, res) => {
  try {
    const { ulke_adi, para_birimi_adi, iso_kodu, sembol, durum } = req.body;
    const sql = `
      INSERT INTO para_birimleri 
      (ulke_adi, para_birimi_adi, iso_kodu, sembol, durum)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [ulke_adi, para_birimi_adi, iso_kodu, sembol, durum];
    const [result] = await db.query(sql, values);
    res.json({ success: true, insertedId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/contracts', async (req, res) => {
  const { 
    sozlesme_sirket_id, sozlesme_kodu, sozlesme_adi, baslangic_tarihi, bitis_tarihi, fatura_periyodu, 
    min_fatura, para_birimi, giris_gunu_kural, kismi_gun_yontemi, hafta_sonu_carpani, kdv_orani, doviz_kuru,
    ardiye_oranlari, ek_hizmet_parametreleri
  } = req.body;
  const sql = `
    INSERT INTO sozlesmeler 
      (sozlesme_sirket_id, sozlesme_kodu, sozlesme_adi, baslangic_tarihi, bitis_tarihi, fatura_periyodu, 
       min_fatura, para_birimi, giris_gunu_kural, kismi_gun_yontemi, hafta_sonu_carpani, kdv_orani, doviz_kuru, 
       ardiye_oranlari, ek_hizmet_parametreleri, olusturulma_tarihi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;
  try {
    const [result] = await db.query(sql, [
      sozlesme_sirket_id, sozlesme_kodu, sozlesme_adi, baslangic_tarihi, bitis_tarihi, fatura_periyodu,
      min_fatura, para_birimi, giris_gunu_kural, kismi_gun_yontemi, hafta_sonu_carpani, kdv_orani, doviz_kuru,
      JSON.stringify(ardiye_oranlari), JSON.stringify(ek_hizmet_parametreleri)
    ]);
    res.json({ success: true, insertedId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// POST /api/sozlesmeler - Yeni sözleşme + hizmet kalemleri ekle
router.post('/sozlesmeler', async (req, res) => {
  const { sozlesme, hizmetler } = req.body;

  if (!sozlesme || !sozlesme.sozlesme_adi) {
    return res.status(400).json({ error: "Sözleşme adı zorunludur." });
  }
  if (!sozlesme.sozlesme_kodu) {
    return res.status(400).json({ error: "Sözleşme kodu zorunludur." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const ekHizmetJSON = sozlesme.ek_hizmet_parametreleri
      ? JSON.stringify(sozlesme.ek_hizmet_parametreleri)
      : null;
    const gunCarpanJSON = sozlesme.gun_carpan_parametreleri
      ? JSON.stringify(sozlesme.gun_carpan_parametreleri)
      : null;

    const sqlSozlesme = `
      INSERT INTO sozlesmeler
        (sozlesme_sirket_id, sozlesme_kodu, sozlesme_adi, baslangic_tarihi, bitis_tarihi,
         fatura_periyodu, min_fatura, para_birimi, giris_gunu_kural, kismi_gun_yontemi,
         hafta_sonu_carpani, kdv_orani, doviz_kuru,
         ek_hizmet_parametreleri, gun_carpan_parametreleri,
         olusturulma_tarihi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const valuesSozlesme = [
      sozlesme.sozlesme_sirket_id || null,
      sozlesme.sozlesme_kodu,
      sozlesme.sozlesme_adi,
      sozlesme.baslangic_tarihi || null,
      sozlesme.bitis_tarihi || null,
      sozlesme.fatura_periyodu || 'Aylık',
      sozlesme.min_fatura || 0,
      sozlesme.para_birimi || 'USD',
      sozlesme.giris_gunu_kural || '',
      sozlesme.kismi_gun_yontemi || '',
      sozlesme.hafta_sonu_carpani || 1,
      sozlesme.kdv_orani || 20,
      sozlesme.doviz_kuru || null,
      ekHizmetJSON,
      gunCarpanJSON
    ];

    const [resultSozlesme] = await conn.query(sqlSozlesme, valuesSozlesme);
    const newSozlesmeId = resultSozlesme.insertId;

    if (Array.isArray(hizmetler) && hizmetler.length > 0) {
      const sqlHiz = `
        INSERT INTO sozlesme_hizmetler
          (sozlesme_id, hizmet_tipi, birim, temel_ucret, carpan, min_ucret, olusturulma_tarihi)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;
      for (const h of hizmetler) {
        const hVals = [
          newSozlesmeId,
          h.hizmet_tipi,
          h.birim || '',
          h.temel_ucret || 0,
          h.carpan || 0,
          h.min_ucret || 0
        ];
        await conn.query(sqlHiz, hVals);
      }
    }

    await conn.commit();
    conn.release();
    res.json({ success: true, insertedId: newSozlesmeId });
  } catch (error) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ error: error.message });
  }
});

// routes/api.js (içinde) - POST /api/antrepo-giris
router.post('/antrepo-giris', async (req, res) => {
  try {
    const {
      beyanname_form_tarihi,
      beyanname_no,
      antrepo_sirket_adi,
      sozlesme_id,
      gumruk,
      antrepo_id,
      antrepo_kodu,
      adres,
      sehir,

      // Ürün & Miktar
      urun_tanimi,
      urun_kodu,
      paket_boyutu,
      paketleme_tipi,
      miktar,
      kap_adeti,
      brut_agirlik,
      net_agirlik,
      antrepo_giris_tarihi,

      // Fatura & Depolama
      gonderici_sirket,
      alici_sirket,
      proforma_no,
      proforma_tarihi,
      ticari_fatura_no,
      ticari_fatura_tarihi,
      depolama_suresi,
      fatura_meblagi,
      urun_birim_fiyat,
      para_birimi,
      fatura_aciklama
    } = req.body;

    if (!beyanname_form_tarihi || !antrepo_giris_tarihi) {
      return res.status(400).json({ error: "Tarih alanları zorunludur." });
    }

    // Veritabanına kaydetmek istediğiniz tablo kolonlarıyla eşleştirin:
    const sql = `
      INSERT INTO antrepo_giris (
        beyanname_form_tarihi,
        beyanname_no,
        antrepo_sirket_adi,
        sozlesme_id,
        gumruk,
        antrepo_id,
        antrepo_kodu,
        adres,
        sehir,
        urun_tanimi,
        urun_kodu,
        paket_boyutu,
        paketleme_tipi,
        miktar,
        kap_adeti,
        brut_agirlik,
        net_agirlik,
        antrepo_giris_tarihi,
        gonderici_sirket,
        alici_sirket,
        proforma_no,
        proforma_tarihi,
        ticari_fatura_no,
        ticari_fatura_tarihi,
        depolama_suresi,
        fatura_meblagi,
        urun_birim_fiyat,
        para_birimi,
        fatura_aciklama,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const values = [
      beyanname_form_tarihi || null,
      beyanname_no || null,
      antrepo_sirket_adi || null,
      sozlesme_id || null,
      gumruk || null,
      antrepo_id || null,
      antrepo_kodu || null,
      adres || null,
      sehir || null,
      urun_tanimi || null,
      urun_kodu || null,
      paket_boyutu || null,
      paketleme_tipi || null,
      miktar || null,
      kap_adeti || null,
      brut_agirlik || null,
      net_agirlik || null,
      antrepo_giris_tarihi || null,
      gonderici_sirket || null,
      alici_sirket || null,
      proforma_no || null,
      proforma_tarihi || null,
      ticari_fatura_no || null,
      ticari_fatura_tarihi || null,
      depolama_suresi || null,
      fatura_meblagi || null,
      urun_birim_fiyat || null,
      para_birimi || null,
      fatura_aciklama || null
    ];

    const [result] = await db.query(sql, [
      beyanname_form_tarihi,  // "YYYY-MM-DD"
      antrepo_giris_tarihi
     
    ]);
    res.json({ success: true, insertedId: result.insertId });
  } catch (error) {
    console.error("POST /api/antrepo-giris hatası:", error);
    res.status(500).json({ error: error.message });
  }
});


// POST /api/customs - Yeni gümrük ekleme
// routes/api.js
router.post('/customs', async (req, res) => {
  try {
    const { gumruk_adi, sinif, sehir_ad, bolge_mudurlugu, notes } = req.body;

    const sql = `
      INSERT INTO gumrukler
      (gumruk_adi, sinif, sehir_ad, bolge_mudurlugu, notes)
      VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
      gumruk_adi,
      sinif,
      sehir_ad,
      bolge_mudurlugu,
      notes || null
    ];

    const [result] = await db.query(sql, values);
    res.json({ success: true, insertedId: result.insertId });
  } catch (error) {
    console.error('POST /api/customs hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/antrepo-giris/:id/hareketler', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      islem_tarihi,
      islem_tipi,
      miktar,
      kap_adeti,
      brut_agirlik,
      net_agirlik,
      birim_id,
      aciklama
    } = req.body;
    
    const sql = `
      INSERT INTO antrepo_hareketleri (
        antrepo_giris_id,
        islem_tarihi,
        islem_tipi,
        miktar,
        kap_adeti,
        brut_agirlik,
        net_agirlik,
        birim_id,
        aciklama,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const values = [
      id,
      islem_tarihi,
      islem_tipi,
      miktar,
      kap_adeti,
      brut_agirlik,
      net_agirlik,
      birim_id,
      aciklama
    ];
    const [result] = await db.query(sql, values);
    res.json({ success: true, insertedId: result.insertId });
  } catch (error) {
    console.error("POST /api/antrepo-giris/:id/hareketler hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/sozlesme_hizmetler', async (req, res) => {
  const { sozlesme_id, hizmet_tipi, oran, birim, min_ucret, temel_ucret, carpan, ek_hesaplama_kosullari } = req.body;
  const sql = `
    INSERT INTO sozlesme_hizmetler 
      (sozlesme_id, hizmet_tipi, oran, birim, min_ucret, temel_ucret, carpan, ek_hesaplama_kosullari, olusturulma_tarihi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;
  try {
    const [result] = await db.query(sql, [
      sozlesme_id, hizmet_tipi, oran, birim, min_ucret, temel_ucret, carpan, JSON.stringify(ek_hesaplama_kosullari)
    ]);
    res.json({ success: true, insertedId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/hizmetler - Yeni hizmet ekle
router.post('/api/hizmetler', async (req, res) => {
  const { 
    hizmet_adi, hizmet_kodu, hizmet_tipi, birim_id, temel_ucret, min_ucret, carpan, 
    para_birimi_id, aciklama, durum, hesaplama_kosullari, mesai_saatleri 
  } = req.body;
  const sql = `
    INSERT INTO hizmetler 
      (hizmet_adi, hizmet_kodu, hizmet_tipi, birim_id, temel_ucret, min_ucret, carpan, para_birimi_id, aciklama, durum, hesaplama_kosullari, mesai_saatleri, olusturulma_tarihi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;
  try {
    const [result] = await db.query(sql, [
      hizmet_adi, hizmet_kodu, hizmet_tipi, birim_id, temel_ucret, min_ucret, carpan, 
      para_birimi_id, aciklama, durum, JSON.stringify(hesaplama_kosullari), mesai_saatleri
    ]);
    res.json({ success: true, insertedId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/antrepo-giris/:girisId/ek-hizmetler
router.post('/antrepo-giris/:girisId/ek-hizmetler', async (req, res) => {
  try {
    const { girisId } = req.params;
    const {
      hizmet_id,
      para_birimi_id,
      adet,
      temel_ucret,
      carpan,
      toplam,
      aciklama,
      ek_hizmet_tarihi  // <-- Tarih
    } = req.body;

    const sql = `
      INSERT INTO antrepo_giris_hizmetler
        (antrepo_giris_id, hizmet_id, para_birimi_id, adet, temel_ucret, carpan, toplam, aciklama, ek_hizmet_tarihi, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const [result] = await db.query(sql, [
      girisId,
      hizmet_id,
      para_birimi_id,
      adet,
      temel_ucret,
      carpan,
      toplam,
      aciklama,
      ek_hizmet_tarihi || null  // <-- Tarihi ekliyoruz
    ]);

    res.json({ success: true, insertedId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.put('/api/sozlesme_hizmetler/:id', async (req, res) => {
  const { id } = req.params;
  const { sozlesme_id, hizmet_tipi, oran, birim, min_ucret, temel_ucret, carpan, ek_hesaplama_kosullari } = req.body;
  const sql = `
    UPDATE sozlesme_hizmetler
    SET sozlesme_id = ?, hizmet_tipi = ?, oran = ?, birim = ?, min_ucret = ?, temel_ucret = ?, carpan = ?,
        ek_hesaplama_kosullari = ?, guncellenme_tarihi = NOW()
    WHERE id = ?
  `;
  try {
    const [result] = await db.query(sql, [
      sozlesme_id, hizmet_tipi, oran, birim, min_ucret, temel_ucret, carpan,
      JSON.stringify(ek_hesaplama_kosullari), id
    ]);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Sözleşme hizmet kalemi bulunamadı" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// PUT /api/antrepo-giris/:id - Mevcut kaydı güncelle
router.put('/antrepo-giris/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      beyanname_form_tarihi,
      beyanname_no,
      antrepo_sirket_adi,
      sozlesme_id,
      gumruk,
      antrepo_id,
      antrepo_kodu,
      adres,
      sehir,

      urun_tanimi,
      urun_kodu,
      paket_boyutu,
      paketleme_tipi,
      miktar,
      kap_adeti,
      brut_agirlik,
      net_agirlik,
      antrepo_giris_tarihi,

      gonderici_sirket,
      alici_sirket,
      proforma_no,
      proforma_tarihi,
      ticari_fatura_no,
      ticari_fatura_tarihi,
      depolama_suresi,
      fatura_meblagi,
      urun_birim_fiyat,
      para_birimi,
      fatura_aciklama
    } = req.body;

    const sql = `
      UPDATE antrepo_giris
      SET
        beyanname_form_tarihi = ?,
        beyanname_no = ?,
        antrepo_sirket_adi = ?,
        sozlesme_id = ?,
        gumruk = ?,
        antrepo_id = ?,
        antrepo_kodu = ?,
        adres = ?,
        sehir = ?,
        urun_tanimi = ?,
        urun_kodu = ?,
        paket_boyutu = ?,
        paketleme_tipi = ?,
        miktar = ?,
        kap_adeti = ?,
        brut_agirlik = ?,
        net_agirlik = ?,
        antrepo_giris_tarihi = ?,
        gonderici_sirket = ?,
        alici_sirket = ?,
        proforma_no = ?,
        proforma_tarihi = ?,
        ticari_fatura_no = ?,
        ticari_fatura_tarihi = ?,
        depolama_suresi = ?,
        fatura_meblagi = ?,
        urun_birim_fiyat = ?,
        para_birimi = ?,
        fatura_aciklama = ?,
        updated_at = NOW()
      WHERE id = ?
    `;
    const values = [
      beyanname_form_tarihi || null,
      beyanname_no || null,
      antrepo_sirket_adi || null,
      sozlesme_id || null,
      gumruk || null,
      antrepo_id || null,
      antrepo_kodu || null,
      adres || null,
      sehir || null,
      urun_tanimi || null,
      urun_kodu || null,
      paket_boyutu || null,
      paketleme_tipi || null,
      miktar || null,
      kap_adeti || null,
      brut_agirlik || null,
      net_agirlik || null,
      antrepo_giris_tarihi || null,
      gonderici_sirket || null,
      alici_sirket || null,
      proforma_no || null,
      proforma_tarihi || null,
      ticari_fatura_no || null,
      ticari_fatura_tarihi || null,
      depolama_suresi || null,
      fatura_meblagi || null,
      urun_birim_fiyat || null,
      para_birimi || null,
      fatura_aciklama || null,
      id
    ];

    const [result] = await db.query(sql, values);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Kayıt bulunamadı.' });
    }
  } catch (error) {
    console.error("PUT /api/antrepo-giris/:id hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/antrepo-giris/:girisId/hareketler/:hareketId', async (req, res) => {
  try {
    const { girisId, hareketId } = req.params;
    const {
      islem_tarihi,
      islem_tipi,
      miktar,
      kap_adeti,
      brut_agirlik,
      net_agirlik,
      birim_id,
      aciklama
    } = req.body;

    // Zorunlu alan kontrolü
    if (!islem_tarihi || !islem_tipi || !miktar) {
      return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
    }

    const sql = `
      UPDATE antrepo_hareketleri
      SET
        islem_tarihi = ?,
        islem_tipi = ?,
        miktar = ?,
        kap_adeti = ?,
        brut_agirlik = ?,
        net_agirlik = ?,
        birim_id = ?,
        aciklama = ?,
        updated_at = NOW()
      WHERE id = ? AND antrepo_giris_id = ?
    `;
    const values = [
      islem_tarihi,
      islem_tipi,
      miktar,
      kap_adeti || 0,
      brut_agirlik || 0,
      net_agirlik || 0,
      birim_id,
      aciklama,
      hareketId,
      girisId
    ];

    const [result] = await db.query(sql, values);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Hareket bulunamadı.' });
    }
  } catch (error) {
    console.error("PUT /antrepo-giris/:girisId/hareketler/:hareketId hatası:", error);
    res.status(500).json({ error: error.message });
  }
});


// ============== 2) SÖZLEŞME GÜNCELLEME (PUT) ==============
router.put('/sozlesmeler/:id', async (req, res) => {
  const { id } = req.params;
  const { sozlesme, hizmetler } = req.body;

  if (!sozlesme || !sozlesme.sozlesme_adi) {
    return res.status(400).json({ error: "Sözleşme adı zorunludur." });
  }
  if (!sozlesme.sozlesme_kodu) {
    return res.status(400).json({ error: "Sözleşme kodu zorunludur." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const ekHizmetJSON = sozlesme.ek_hizmet_parametreleri
      ? JSON.stringify(sozlesme.ek_hizmet_parametreleri)
      : null;
    const gunCarpanJSON = sozlesme.gun_carpan_parametreleri
      ? JSON.stringify(sozlesme.gun_carpan_parametreleri)
      : null;

    const sqlSozlesme = `
      UPDATE sozlesmeler
      SET
        sozlesme_sirket_id = ?,
        sozlesme_kodu = ?,
        sozlesme_adi = ?,
        baslangic_tarihi = ?,
        bitis_tarihi = ?,
        fatura_periyodu = ?,
        min_fatura = ?,
        para_birimi = ?,
        giris_gunu_kural = ?,
        kismi_gun_yontemi = ?,
        hafta_sonu_carpani = ?,
        kdv_orani = ?,
        doviz_kuru = ?,
        ek_hizmet_parametreleri = ?,
        gun_carpan_parametreleri = ?,
        guncellenme_tarihi = NOW()
      WHERE id = ?
    `;
    const valsSoz = [
      sozlesme.sozlesme_sirket_id || null,
      sozlesme.sozlesme_kodu,
      sozlesme.sozlesme_adi,
      sozlesme.baslangic_tarihi || null,
      sozlesme.bitis_tarihi || null,
      sozlesme.fatura_periyodu || 'Aylık',
      sozlesme.min_fatura || 0,
      sozlesme.para_birimi || 'USD',
      sozlesme.giris_gunu_kural || '',
      sozlesme.kismi_gun_yontemi || '',
      sozlesme.hafta_sonu_carpani || 1,
      sozlesme.kdv_orani || 20,
      sozlesme.doviz_kuru || null,
      ekHizmetJSON,
      gunCarpanJSON,
      id
    ];

    const [resultSozlesme] = await conn.query(sqlSozlesme, valsSoz);
    if (resultSozlesme.affectedRows === 0) {
      throw new Error("Sözleşme bulunamadı.");
    }

    // Hizmet kalemleri -> önce sil, sonra yeniden ekle
    await conn.query('DELETE FROM sozlesme_hizmetler WHERE sozlesme_id = ?', [id]);
    if (Array.isArray(hizmetler) && hizmetler.length > 0) {
      for (const h of hizmetler) {
        const sqlHizmet = `
          INSERT INTO sozlesme_hizmetler
            (sozlesme_id, hizmet_tipi, birim, temel_ucret, carpan, min_ucret, olusturulma_tarihi)
          VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        const valsHizmet = [
          id,
          h.hizmet_tipi,
          h.birim || '',
          h.temel_ucret || 0,
          h.carpan || 0,
          h.min_ucret || 0
        ];
        await conn.query(sqlHizmet, valsHizmet);
      }
    }

    await conn.commit();
    conn.release();
    res.json({ success: true });
  } catch (error) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ error: error.message });
  }
});

// ============== 3) HİZMET EKLEME (POST) ==============
router.post('/hizmetler', async (req, res) => {
  try {
    const {
      hizmet_adi,
      hizmet_kodu,
      hizmet_tipi,
      birim_id,
      temel_ucret,
      min_ucret,
      carpan,
      para_birimi_id,
      aciklama,
      durum
    } = req.body;

    const sql = `
      INSERT INTO hizmetler
        (hizmet_adi, hizmet_kodu, hizmet_tipi, birim_id,
         temel_ucret, min_ucret, carpan, para_birimi_id,
         aciklama, durum, olusturulma_tarihi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const vals = [
      hizmet_adi,
      hizmet_kodu,
      hizmet_tipi,
      birim_id || null,
      temel_ucret || 0,
      min_ucret || 0,
      carpan || 0,
      para_birimi_id || null,
      aciklama || '',
      durum || 'Aktif'
    ];
    const [result] = await db.query(sql, vals);
    res.json({ success: true, insertedId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




router.put('/api/hizmetler/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    hizmet_adi, hizmet_kodu, hizmet_tipi, birim_id, temel_ucret, min_ucret, carpan, 
    para_birimi_id, aciklama, durum, hesaplama_kosullari, mesai_saatleri 
  } = req.body;
  const sql = `
    UPDATE hizmetler
    SET hizmet_adi = ?, hizmet_kodu = ?, hizmet_tipi = ?, birim_id = ?, temel_ucret = ?, min_ucret = ?,
        carpan = ?, para_birimi_id = ?, aciklama = ?, durum = ?,
        hesaplama_kosullari = ?, mesai_saatleri = ?, guncellenme_tarihi = NOW()
    WHERE id = ?
  `;
  try {
    const [result] = await db.query(sql, [
      hizmet_adi, hizmet_kodu, hizmet_tipi, birim_id, temel_ucret, min_ucret, carpan,
      para_birimi_id, aciklama, durum, JSON.stringify(hesaplama_kosullari), mesai_saatleri, id
    ]);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Hizmet bulunamadı" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/api/contracts/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    sozlesme_sirket_id, sozlesme_kodu, sozlesme_adi, baslangic_tarihi, bitis_tarihi, fatura_periyodu, 
    min_fatura, para_birimi, giris_gunu_kural, kismi_gun_yontemi, hafta_sonu_carpani, kdv_orani, doviz_kuru,
    ardiye_oranlari, ek_hizmet_parametreleri
  } = req.body;
  const sql = `
    UPDATE sozlesmeler
    SET sozlesme_sirket_id = ?, sozlesme_kodu = ?, sozlesme_adi = ?, baslangic_tarihi = ?, bitis_tarihi = ?,
        fatura_periyodu = ?, min_fatura = ?, para_birimi = ?, giris_gunu_kural = ?, kismi_gun_yontemi = ?,
        hafta_sonu_carpani = ?, kdv_orani = ?, doviz_kuru = ?,
        ardiye_oranlari = ?, ek_hizmet_parametreleri = ?,
        guncellenme_tarihi = NOW()
    WHERE id = ?
  `;
  try {
    const [result] = await db.query(sql, [
      sozlesme_sirket_id, sozlesme_kodu, sozlesme_adi, baslangic_tarihi, bitis_tarihi,
      fatura_periyodu, min_fatura, para_birimi, giris_gunu_kural, kismi_gun_yontemi, hafta_sonu_carpani,
      kdv_orani, doviz_kuru,
      JSON.stringify(ardiye_oranlari), JSON.stringify(ek_hizmet_parametreleri), id
    ]);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Sözleşme bulunamadı" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



router.delete('/antrepo-giris/:girisId/hareketler/:hareketId', async (req, res) => {
  try {
    const { hareketId } = req.params;
    const sql = 'DELETE FROM antrepo_hareketleri WHERE id = ?';
    const [result] = await db.query(sql, [hareketId]);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Hareket bulunamadı.' });
    }
  } catch (error) {
    console.error("DELETE /api/antrepo-giris/hareketler/:hareketId hatası:", error);
    res.status(500).json({ error: error.message });
  }
});


// DELETE /api/antrepo-giris/:id - Antrepo giriş kaydını sil
router.delete('/antrepo-giris/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM antrepo_giris WHERE id = ?', [id]);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Kayıt bulunamadı.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/companies/:id
router.delete('/companies/:id', async (req, res) => {
  try {
    const companyId = req.params.id;
    const [result] = await db.query('DELETE FROM sirketler WHERE sirket_id = ?', [companyId]);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Şirket bulunamadı.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/customs/:id
router.delete('/customs/:id', async (req, res) => {
  try {
    const gumrukId = req.params.id;
    const [result] = await db.query('DELETE FROM gumrukler WHERE gumruk_id = ?', [gumrukId]);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Kayıt bulunamadı.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/antrepolar/:id
router.delete('/antrepolar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM antrepolar WHERE id = ?', [id]);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Antrepo not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/birimler/:id
router.delete('/birimler/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM birimler WHERE id = ?', [id]);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Birim bulunamadı.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/hizmetler/:id
router.delete('/api/hizmetler/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM hizmetler WHERE id = ?', [id]);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Hizmet bulunamadı" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/para-birimleri/:id
router.delete('/para-birimleri/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM para_birimleri WHERE id = ?', [id]);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Para birimi bulunamadı.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/sozlesmeler/:id
router.delete('/sozlesmeler/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM sozlesmeler WHERE id = ?', [id]);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Sözleşme bulunamadı.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/antrepo-giris/:girisId/hareketler/:hareketId', async (req, res) => {
  try {
    const { hareketId } = req.params;
    const sql = 'DELETE FROM antrepo_hareketleri WHERE id = ?';
    const [result] = await db.query(sql, [hareketId]);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Hareket bulunamadı.' });
    }
  } catch (error) {
    console.error("DELETE /api/antrepo-giris/hareketler/:hareketId hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api/contracts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM sozlesmeler WHERE id = ?', [id]);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Sözleşme bulunamadı" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api/sozlesme_hizmetler/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM sozlesme_hizmetler WHERE id = ?', [id]);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Sözleşme hizmet kalemi bulunamadı" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/antrepo-giris/:girisId/ek-hizmetler/:ekHizmetId
router.delete('/antrepo-giris/:girisId/ek-hizmetler/:ekHizmetId', async (req, res) => {
  try {
    const { girisId, ekHizmetId } = req.params;
    const sql = `
      DELETE FROM antrepo_giris_hizmetler
      WHERE id = ? AND antrepo_giris_id = ?
    `;
    const [result] = await db.query(sql, [ekHizmetId, girisId]);
    if (result.affectedRows > 0) {
      return res.json({ success: true });
    } else {
      return res.status(404).json({ error: "Kayıt bulunamadı" });
    }
  } catch (error) {
    console.error("DELETE /api/antrepo-giris/:girisId/ek-hizmetler/:ekHizmetId hata:", error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
