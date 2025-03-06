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


// routes/api.js
router.get('/sozlesmeler/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // 1) Sözleşme ana kaydını al
    const [contractRows] = await db.query('SELECT * FROM sozlesmeler WHERE id = ?', [id]);
    if (contractRows.length === 0) {
      return res.status(404).json({ error: 'Sözleşme bulunamadı.' });
    }
    const contract = contractRows[0];

    // 2) sozlesme_hizmetleri tablosundan bu sözleşmeye ait hizmetleri al
    const [hizmetRows] = await db.query(`
      SELECT 
        id,
        sozlesme_id,
        hizmet_tipi,
        oran,
        birim,
        min_ucret,
        temel_ucret,
        carpan,
        ek_hesaplama_kosullari
      FROM sozlesme_hizmetler
      WHERE sozlesme_id = ?
    `, [id]);
    contract.hizmetler = hizmetRows;

    // 3) gun_carpan_parametreleri tablosundan bu sözleşmeye ait gün çarpanı parametrelerini al
    const [gunCarpanRows] = await db.query(`
      SELECT 
        start_day AS startDay,
        end_day AS endDay,
        base_fee AS baseFee,
        per_kg_rate AS perKgRate,
        cargo_type AS cargoType,
        para_birimi AS paraBirimi
      FROM gun_carpan_parametreleri
      WHERE sozlesme_id = ?
    `, [id]);
    contract.gun_carpan_parametreleri = gunCarpanRows;

    // Eğer başka parametreler (ör. mesai saat ücretleri) da varsa, onlar da eklenebilir

    res.json(contract);
  } catch (error) {
    console.error("GET /sozlesmeler/:id hatası:", error);
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

router.get('/antrepo-giris/:girisId/hareketler', async (req, res) => {
  try {
    const girisId = req.params.girisId;
    const sql = `
      SELECT 
      h.id,
      h.antrepo_giris_id,
      h.islem_tarihi,
      h.islem_tipi,
      h.miktar,
      h.kap_adeti,
      h.brut_agirlik,
      h.net_agirlik,
      h.birim_id,
      b.birim_adi,
      h.aciklama
      FROM antrepo_hareketleri h
      LEFT JOIN birimler b ON h.birim_id = b.id
      WHERE h.antrepo_giris_id = ?
      ORDER BY h.islem_tarihi DESC
    `;
    const [rows] = await db.query(sql, [girisId]);
    res.json(rows);
  } catch (error) {
    console.error("GET /api/antrepo-giris/:girisId/hareketler hatası:", error);
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
    const sqlGirisler = `
      SELECT 
        ag.id,
        ag.antrepo_giris_tarihi,
        ag.beyanname_no,
        ag.beyanname_form_tarihi,
        ag.sozlesme_id,
        ag.urun_kodu,
        u.name AS productName,
        u.code AS productCode,
        ag.kap_adeti
      FROM antrepo_giris ag
      LEFT JOIN urunler u ON ag.urun_kodu = u.code
      ORDER BY ag.id
    `;
    const [rowsGiris] = await db.query(sqlGirisler);
    const resultArray = [];

    for (const girisData of rowsGiris) {
      const girisId = girisData.id;

      // Sözleşme bilgisini çek
      let sozlesme = null;
      if (girisData.sozlesme_id) {
        const [rowsSoz] = await db.query(
          `SELECT * FROM sozlesmeler WHERE id = ?`,
          [girisData.sozlesme_id]
        );
        sozlesme = rowsSoz[0] || null;
      }

      // Hareketleri çek (giriş-çıkış)
      const sqlHareketler = `
        SELECT 
          islem_tarihi,
          islem_tipi,
          miktar,
          kap_adeti
        FROM antrepo_hareketleri
        WHERE antrepo_giris_id = ?
        ORDER BY islem_tarihi
      `;
      const [rowsHareket] = await db.query(sqlHareketler, [girisId]);

      // Toplam giriş miktarı
      const totalGirisTon = rowsHareket
        .filter(r => r.islem_tipi === 'Giriş')
        .reduce((sum, r) => sum + parseFloat(r.miktar || 0), 0);

      // Mevcut stok
      const currentStock = rowsHareket.reduce((acc, row) => {
        return row.islem_tipi === 'Giriş'
          ? acc + parseFloat(row.miktar || 0)
          : acc - parseFloat(row.miktar || 0);
      }, 0);

      // Mevcut kap adedi
      const currentKap = rowsHareket.reduce((acc, row) => {
        return row.islem_tipi === 'Giriş'
          ? acc + (row.kap_adeti || 0)
          : acc - (row.kap_adeti || 0);
      }, 0);

      // Son çıkış bilgisi
      let lastExitDate = null;
      let lastExitAmount = null;
      const cikislar = rowsHareket.filter(r => r.islem_tipi === 'Çıkış');
      if (cikislar.length > 0) {
        const last = cikislar[cikislar.length - 1];
        lastExitDate = last.islem_tarihi;
        lastExitAmount = last.miktar;
      }

      // Basit maliyet hesaplaması (örnek)
      const currentCost = currentStock * 0.5; 
      const totalCost = currentCost;
      let unitCost = totalGirisTon > 0 ? totalCost / totalGirisTon : 0;
      const paraBirimi = sozlesme ? sozlesme.para_birimi : "USD";

      resultArray.push({
        productName: girisData.productName || '-',
        productCode: girisData.productCode || '-',
        entryDate: girisData.antrepo_giris_tarihi,
        formNo: girisData.beyanname_no || '-',
        entryCount: parseFloat(totalGirisTon.toFixed(2)),
        entryKapCount: girisData.kap_adeti || "-",
        lastExitDate: lastExitDate,
        lastExitAmount: lastExitAmount,
        currentStock: parseFloat(currentStock.toFixed(2)),
        currentKapCount: currentKap,
        currentCost: parseFloat(currentCost.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        unitCostImpact: parseFloat(unitCost.toFixed(2)),
        entryId: girisId,
        paraBirimi: paraBirimi
      });
    }

    res.json(resultArray);
  } catch (error) {
    console.error("GET /api/maliyet-analizi hatası:", error);
    res.status(500).json({ error: error.message });
  }
});


// API Endpoint: /api/hesaplama-motoru/:girisId
// routes/api.js (içindeki /api/hesaplama-motoru/:girisId endpoint'i)

// routes/api.js içinde

router.get('/hesaplama-motoru/:girisId', async (req, res) => {
  try {
    const girisId = req.params.girisId;

    // 1) "antrepo_giris" kaydını çekiyoruz (sözleşme_id vb. için gerekli)
    const sqlGiris = `
      SELECT 
        id, 
        beyanname_no, 
        antrepo_giris_tarihi,
        miktar AS initialStock,
        urunAdi,
        kap_adeti,
        urun_kodu,
        sozlesme_id
      FROM antrepo_giris
      WHERE id = ?
    `;
    const [rowsGiris] = await db.query(sqlGiris, [girisId]);
    if (rowsGiris.length === 0) {
      return res.status(404).json({ error: 'Antrepo girişi bulunamadı.' });
    }
    const antrepoGiris = rowsGiris[0];

    // 2) Sözleşme bilgisi (parametreleri çekiyoruz)
    let sozlesme = null;
    if (antrepoGiris.sozlesme_id) {
      const sqlSoz = `SELECT * FROM sozlesmeler WHERE id = ?`;
      const [rowsSoz] = await db.query(sqlSoz, [antrepoGiris.sozlesme_id]);
      sozlesme = rowsSoz[0] || null;
    }

    // Örnek sözleşme parametreleri (giris_gunu_kural vb.)
    const girisGunuKural = sozlesme?.giris_gunu_kural || "dahil";
    const haftaSonuCarpani = parseFloat(sozlesme?.hafta_sonu_carpani || 1.0);
    const gunlukArdiyeOrani = parseFloat(sozlesme?.gunluk_ardiye_orani || 0.5);
    const minArdiye = parseFloat(sozlesme?.min_ardiye || 50);

    // 3) Tüm hareketleri (Giriş/Çıkış) çekiyoruz
    const sqlHareket = `
      SELECT
        id,
        islem_tarihi,
        islem_tipi,
        miktar,
        kap_adeti
      FROM antrepo_hareketleri
      WHERE antrepo_giris_id = ?
      ORDER BY islem_tarihi ASC
    `;
    const [rowsHareket] = await db.query(sqlHareket, [girisId]);

    // 3.1) Eğer hiçbir hareket yoksa, hesaplama yapamayız veya stok 0 sayılabilir
    if (rowsHareket.length === 0) {
      // Dilerseniz bir uyarı dönebilirsiniz
      return res.json({
        antrepoGiris,
        sozlesme,
        dailyBreakdown: [],
        totalCost: 0,
        unitCostImpact: 0,
        paraBirimi: sozlesme?.para_birimi || "USD",
        warning: "Bu kayda ait antrepo_hareketleri bulunamadı."
      });
    }

    // 4) Ek hizmetleri (antrepo_giris_hizmetler) çekiyoruz
    const sqlEkHizmet = `
      SELECT
        id,
        antrepo_giris_id,
        hizmet_id,
        para_birimi_id,
        adet,
        temel_ucret,
        carpan,
        toplam,
        aciklama,
        ek_hizmet_tarihi
      FROM antrepo_giris_hizmetler
      WHERE antrepo_giris_id = ?
      ORDER BY ek_hizmet_tarihi ASC
    `;
    const [rowsEkHizmet] = await db.query(sqlEkHizmet, [girisId]);

    // 5) HESAPLAMA BAŞLANGIÇ TARİHİ:
    //    Bu kısım "antrepo_hareketleri" tablosundan, işlem_tipi = 'Giriş' olan ilk kaydın islem_tarihi.
    //    Yani, en erken Giriş işleminin tarihini bulalım:
    const [rowsFirstGiris] = await db.query(`
      SELECT islem_tarihi
      FROM antrepo_hareketleri
      WHERE antrepo_giris_id = ?
        AND islem_tipi = 'Giriş'
      ORDER BY islem_tarihi ASC
      LIMIT 1
    `, [girisId]);

    if (!rowsFirstGiris || rowsFirstGiris.length === 0) {
      // Yani Giriş kaydı yok, sadece Çıkış kaydı varsa
      // O zaman hesaplama mantığınız ne olmalı?
      // Örnek olarak, "Hareket yok" veya "Giriş yok" diyebilirsiniz:
      return res.json({
        antrepoGiris,
        sozlesme,
        dailyBreakdown: [],
        totalCost: 0,
        unitCostImpact: 0,
        paraBirimi: sozlesme?.para_birimi || "USD",
        warning: "Bu kayda ait 'Giriş' hareketi yok. Hesaplama başlatılamıyor."
      });
    }

    // Artık ilk Giriş'in tarihini alıyoruz:
    const earliestGirisDate = rowsFirstGiris[0].islem_tarihi;
    let startDate = new Date(earliestGirisDate);

    // 6) Bitiş tarihi = son hareketin tarihi mi? Yoksa "bugün" mü?
    const lastMovementDate = rowsHareket[rowsHareket.length - 1].islem_tarihi;
    let endDate = new Date(lastMovementDate);
    const today = new Date();
    if (endDate > today) {
      endDate = today;
    }

    // 7) Gün bazında Giriş/Çıkış toplamlarını gruplayalım
    const movementMap = {};
    rowsHareket.forEach(h => {
      const isoDate = new Date(h.islem_tarihi).toISOString().split('T')[0];
      if (!movementMap[isoDate]) {
        movementMap[isoDate] = { giris: 0, cikis: 0 };
      }
      if (h.islem_tipi === 'Giriş') {
        movementMap[isoDate].giris += parseFloat(h.miktar || 0);
      } else if (h.islem_tipi === 'Çıkış') {
        movementMap[isoDate].cikis += parseFloat(h.miktar || 0);
      }
    });

    // 8) Ek hizmetleri gün bazında gruplayalım
    const ekHizmetMap = {};
    rowsEkHizmet.forEach(eh => {
      if (!eh.ek_hizmet_tarihi) return;
      const isoDate = new Date(eh.ek_hizmet_tarihi).toISOString().split('T')[0];
      if (!ekHizmetMap[isoDate]) {
        ekHizmetMap[isoDate] = [];
      }
      ekHizmetMap[isoDate].push(eh);
    });

    // 9) Günlük hesaplama döngüsü
    const maxDays = 365; 
    let dayCounter = 0;
    let cumulativeCost = 0;
    let simStock = 0;  // Hesaplama sırasında stoğu güncel tutacağız
    const dailyBreakdown = [];

    let currentDate = new Date(startDate);

    // Hafta sonu kontrolü
    const isWeekend = (date) => {
      const day = date.getDay(); // 0: Pazar, 6: Cumartesi
      return (day === 0 || day === 6);
    };

    while (dayCounter < maxDays && currentDate <= endDate) {
      const isoDate = currentDate.toISOString().split('T')[0];
      const dayMovement = movementMap[isoDate] || { giris: 0, cikis: 0 };

      // 1) Gün içi Giriş (stoğu artır)
      if (dayMovement.giris > 0) {
        simStock += dayMovement.giris;
      }

      // 2) Günlük ardiye (stok > 0 ise)
      let dayArdiye = 0;
      if (simStock > 0) {
        // Giriş günü kuralı
        if (dayCounter === 0 && girisGunuKural.toLowerCase() === "hariç") {
          dayArdiye = 0;
        } else {
          let calcArdiye = gunlukArdiyeOrani * simStock;
          if (calcArdiye < minArdiye) calcArdiye = minArdiye;
          if (isWeekend(currentDate)) {
            calcArdiye *= haftaSonuCarpani;
          }
          dayArdiye = calcArdiye;
        }
      }

      // 3) Ek hizmet hesaplaması
      let dayEkHizmet = 0;
      if (ekHizmetMap[isoDate]) {
        ekHizmetMap[isoDate].forEach(eh => {
          dayEkHizmet += parseFloat(eh.toplam || 0);
        });
      }

      const dayTotal = dayArdiye + dayEkHizmet;
      cumulativeCost += dayTotal;

      // 4) Gün içi Çıkış (stoğu azalt)
      if (dayMovement.cikis > 0) {
        simStock -= dayMovement.cikis;
        if (simStock < 0) simStock = 0;
      }

      // Kaydı diziye ekle
      dailyBreakdown.push({
        dayIndex: dayCounter + 1,
        date: isoDate,
        dayArdiye: parseFloat(dayArdiye.toFixed(2)),
        dayEkHizmet: parseFloat(dayEkHizmet.toFixed(2)),
        dayTotal: parseFloat(dayTotal.toFixed(2)),
        cumulative: parseFloat(cumulativeCost.toFixed(2)),
        stockAfter: parseFloat(simStock.toFixed(2)),
        event: (dayMovement.giris > 0 || dayMovement.cikis > 0)
          ? `Giriş(+${dayMovement.giris}) / Çıkış(-${dayMovement.cikis})`
          : ""
      });

      // Sonraki güne geç
      currentDate.setDate(currentDate.getDate() + 1);
      dayCounter++;
    }

    // 10) Toplam maliyet
    const totalCost = cumulativeCost;
    // Birim maliyet (örnek: antrepoGiris.initialStock'a bölüyoruz)
    let unitCost = 0;
    if (parseFloat(antrepoGiris.initialStock) > 0) {
      unitCost = totalCost / parseFloat(antrepoGiris.initialStock);
    }

    // Yanıt
    res.json({
      antrepoGiris,
      sozlesme,
      dailyBreakdown,
      totalCost: parseFloat(totalCost.toFixed(2)),
      unitCostImpact: parseFloat(unitCost.toFixed(2)),
      paraBirimi: sozlesme?.para_birimi || "USD"
    });
  } catch (error) {
    console.error("Hesaplama motoru hatası:", error);
    res.status(500).json({ error: error.message });
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
// routes/api.js (örnek)
// Antrepo giriş POST route
router.post('/antrepo-giris', async (req, res) => {
  try {
    const payload = req.body;

    // Burada tablo alanları ile payload eşleşmesi yapalım
    // Soru işareti sayısı -> param sayısı
    const sql = `
      INSERT INTO antrepo_giris(
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
      ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;

    const params = [
      payload.beyanname_form_tarihi || null,
      payload.beyanname_no || null,
      payload.antrepo_sirket_adi || null,
      payload.sozlesme_id || null,
      payload.gumruk || null,
      payload.antrepo_id || null, // tablo tipiniz int/bigint uyumlu olmalı
      payload.antrepo_kodu || null,
      payload.adres || null,
      payload.sehir || null,
      payload.urun_tanimi || null,
      payload.urun_kodu || null,
      payload.paket_boyutu || null,
      payload.paketleme_tipi || null,
      payload.miktar || null,
      payload.kap_adeti || null,
      payload.brut_agirlik || null,
      payload.net_agirlik || null,
      payload.antrepo_giris_tarihi || null,
      payload.gonderici_sirket || null,
      payload.alici_sirket || null,
      payload.proforma_no || null,
      payload.proforma_tarihi || null,
      payload.ticari_fatura_no || null,
      payload.ticari_fatura_tarihi || null,
      payload.depolama_suresi || null,
      payload.fatura_meblagi || null,
      payload.urun_birim_fiyat || null,
      payload.para_birimi || null,
      payload.fatura_aciklama || null
    ];

    const [result] = await db.query(sql, params);

    res.json({
      success: true,
      insertedId: result.insertId,
      message: 'Antrepo giriş kaydı başarıyla eklendi.'
    });
  } catch (error) {
    console.error("POST /api/antrepo-giris hatası:", error);
    res.status(500).json({ error: "Sunucu hatası: " + error.message });
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

// /api/antrepo-giris/:id/hareketler (POST)
router.post('/antrepo-giris/:girisId/hareketler', async (req, res) => {
  try {
    const girisId = req.params.girisId;
    const { islem_tarihi, islem_tipi, miktar, kap_adeti, brut_agirlik, net_agirlik, birim_id, aciklama } = req.body;
    
    // Basit zorunlu alan kontrolü
    if (!islem_tarihi || !miktar) {
      return res.status(400).json({ error: "Zorunlu alanlar eksik" });
    }
    
    const sql = `
      INSERT INTO antrepo_hareketleri
      (antrepo_giris_id, islem_tarihi, islem_tipi, miktar, kap_adeti, brut_agirlik, net_agirlik, birim_id, aciklama)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      girisId, 
      islem_tarihi, 
      islem_tipi, 
      miktar, 
      kap_adeti || 0, 
      brut_agirlik || 0, 
      net_agirlik || 0, 
      birim_id || 1, 
      aciklama || ""
    ]);
    res.json({ success: true, insertedId: result.insertId });
  } catch (error) {
    console.error("POST /api/antrepo-giris/:girisId/hareketler hatası:", error);
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
  // Payload'da sözleşme, hizmetler ve gun_carpan_parametreleri ayrı gönderiliyor.
  const { sozlesme, hizmetler, gun_carpan_parametreleri, ek_hizmet_parametreleri } = req.body;

  // Temel kontroller
  if (!sozlesme || !sozlesme.sozlesme_adi) {
    return res.status(400).json({ error: "Sözleşme adı zorunludur." });
  }
  if (!sozlesme.sozlesme_kodu) {
    return res.status(400).json({ error: "Sözleşme kodu zorunludur." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Sözleşme ana kaydını güncelle (gun_carpan_parametreleri ve ek_hizmet_parametreleri JSON sütunu kullanmıyoruz)
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
      id
    ];
    const [resultSozlesme] = await conn.query(sqlSozlesme, valsSoz);
    if (resultSozlesme.affectedRows === 0) {
      throw new Error("Sözleşme bulunamadı.");
    }

    // 2) Hizmet kalemlerini güncelle
    // Önce eski hizmet kayıtlarını sil
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

    // 3) Gün Çarpanı Parametreleri işlemleri:
    // Öncelikle, gun_carpan_parametreleri tablosunda bu sözleşmeye ait mevcut kayıtları silin
    await conn.query('DELETE FROM gun_carpan_parametreleri WHERE sozlesme_id = ?', [id]);
    if (Array.isArray(gun_carpan_parametreleri) && gun_carpan_parametreleri.length > 0) {
      for (const gc of gun_carpan_parametreleri) {
        const sqlGunCarpan = `
          INSERT INTO gun_carpan_parametreleri 
            (sozlesme_id, start_day, end_day, base_fee, per_kg_rate, cargo_type, para_birimi, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        const valsGunCarpan = [
          id,
          gc.startDay,
          gc.endDay || null,
          gc.baseFee,
          gc.perKgRate,
          gc.cargoType || "Genel Kargo",
          gc.paraBirimi || "USD"
        ];
        await conn.query(sqlGunCarpan, valsGunCarpan);
      }
    } else {
      // Eğer gun_carpan_parametreleri boş ise, isteğe bağlı olarak hata dönebilirsiniz:
      // return res.status(400).json({ error: "Gün Çarpanı Parametreleri doldurulmalıdır!" });
    }

    // 4) Ek Hizmet Parametreleri:
    // Eğer ek hizmet parametreleri için ayrı bir tablo yoksa, bu alanı JSON olarak saklayabilirsiniz.
    // Aksi halde, benzer şekilde DELETE-INSERT yapabilirsiniz. Bu örnekte JSON olarak saklıyoruz.
    const ekHizmetJSON = ek_hizmet_parametreleri
      ? JSON.stringify(ek_hizmet_parametreleri)
      : null;
    await conn.query('UPDATE sozlesmeler SET ek_hizmet_parametreleri = ? WHERE id = ?', [ekHizmetJSON, id]);

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
    const girisId = req.params.girisId;
    const hareketId = req.params.hareketId;
    const sql = `DELETE FROM antrepo_hareketleri WHERE id = ? AND antrepo_giris_id = ?`;
    const [result] = await db.query(sql, [hareketId, girisId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Hareket bulunamadı.' });
    }
    res.json({ success: true, message: 'Hareket kaydı silindi.' });
  } catch (error) {
    console.error("DELETE /:girisId/hareketler/:hareketId hatası:", error);
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

router.delete('/sozlesmeler/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await db.getConnection();
    await conn.beginTransaction();

    // 1) Gun çarpanı parametrelerini sil
    await conn.query('DELETE FROM gun_carpan_parametreleri WHERE sozlesme_id = ?', [id]);

    // 2) Sözleşme hizmet kalemlerini sil (sozlesme_hizmetler tablosu)
    await conn.query('DELETE FROM sozlesme_hizmetler WHERE sozlesme_id = ?', [id]);

    // 3) Ana sözleşme kaydını sil
    const [result] = await conn.query('DELETE FROM sozlesmeler WHERE id = ?', [id]);

    if (result.affectedRows > 0) {
      await conn.commit();
      conn.release();
      res.json({ success: true });
    } else {
      await conn.rollback();
      conn.release();
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
