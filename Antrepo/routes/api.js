// File: routes/api.js

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

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

// GET /api/customs/:id - Belirli bir gümrük kaydını getirir
router.get('/customs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM gumrukler WHERE gumruk_id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Gümrük bulunamadı.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("GET /api/customs/:id hatası:", error);
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
        a.antrepoKodu,
        a.antrepoAdi,
        at.name as antrepoTipi,
        g.gumruk_adi as gumruk,
        gm.bolge_mudurlugu as gumrukMudurlugu,
        s.sehir_ad as sehir,
        a.acikAdres,
        sr.company_name as antrepoSirketi,
        a.kapasite,
        a.aktif
      FROM antrepolar a
      LEFT JOIN antrepo_tipleri at ON a.antrepoTipi = at.id
      LEFT JOIN gumrukler g ON a.gumruk = g.gumruk_id
      LEFT JOIN bolge_mudurlukleri gm ON a.gumrukMudurlugu = gm.bolge_id
      LEFT JOIN sehirler s ON a.sehir = s.id
      LEFT JOIN sirketler sr ON a.antrepoSirketi = sr.sirket_id
      ORDER BY a.id DESC
    `;

    
    

    const [rows] = await db.query(sql);
    
   
    
    
    res.json(rows);
  } catch (error) {
    console.error("GET /antrepolar hatası:", error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack // Geliştirme ortamında stack trace'i görmek için
    });
  }
});

// GET /api/antrepolar/:id - Tekil kayıt; şehir ve gümrük adlarını metin olarak döndürür
router.get('/antrepolar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        a.*,
        at.name as antrepoTipi_name,
        g.gumruk_adi as gumruk_name,
        gm.bolge_mudurlugu as gumrukMudurlugu_name,
        s.sehir_ad as sehir_name,
        sr.company_name as antrepoSirketi_name
      FROM antrepolar a
      LEFT JOIN antrepo_tipleri at ON a.antrepoTipi = at.id
      LEFT JOIN gumrukler g ON a.gumruk = g.gumruk_id
      LEFT JOIN bolge_mudurlukleri gm ON a.gumrukMudurlugu = gm.bolge_id
      LEFT JOIN sehirler s ON a.sehir = s.id
      LEFT JOIN sirketler sr ON a.antrepoSirketi = sr.sirket_id
      WHERE a.id = ?
    `;
    const [rows] = await db.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Antrepo bulunamadı' });
    }
    console.log('Antrepo Detail API Response:', rows[0]); // Debug için
    res.json(rows[0]);
  } catch (error) {
    console.error("GET /api/antrepolar/:id hatası:", error);
    res.status(500).json({ error: error.message });
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
    console.log(`Fetching contract details for ID: ${id}`);
    
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
        id,
        start_day AS startDay,
        end_day AS endDay,
        base_fee AS baseFee,
        per_kg_rate AS perKgRate,
        cargo_type AS cargoType,
        para_birimi AS paraBirimi
      FROM gun_carpan_parametreleri
      WHERE sozlesme_id = ?
      ORDER BY start_day ASC
    `, [id]);
    
    console.log(`Retrieved ${gunCarpanRows.length} gun_carpan_parametreleri records`);
    contract.gun_carpan_parametreleri = gunCarpanRows;

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
// routes/api.js
router.get('/urunler', async (req, res) => {
  try {
    const sql = `
      SELECT
        u.id,
        u.name,
        u.code,
        u.paket_hacmi,
        -- Eğer tamamen description'a geçiyorsanız:
        u.description AS paketleme_tipi
        -- Veya COALESCE(pt.name, u.description) AS paketleme_tipi
      FROM urunler u
      -- LEFT JOIN paketleme_tipleri pt ON u.paketleme_tipi_id = pt.id
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
        u.paketleme_tipi_id AS paketleme_tipi_name,  -- Artık bu alan metin değer içeriyor
        u.description
      FROM urunler u
      WHERE u.id = ?
    `;
    const [rows] = await db.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Ürün bulunamadı" });
    }
    
    // Varyant bilgisini de ekleyelim (ürün kartında gösterilmesi için)
    const [variants] = await db.query(`
      SELECT id, paket_hacmi, description 
      FROM urun_varyantlari 
      WHERE urun_id = ?
    `, [id]);
    
    // Yanıta varyant bilgisini de ekle
    const product = rows[0];
    product.variants = variants;
    
    res.json(product);
  } catch (error) {
    console.error("GET /urunler/:id error:", error);
    res.status(500).json({ error: error.message });
  }
});

// File: routes/api.js
router.get('/antrepo-giris', async (req, res) => {
  try {
    const sql = `
      SELECT
        ag.id,
        ag.beyanname_no,
        ag.beyanname_form_tarihi,
        ag.antrepo_id,
        a.antrepoAdi AS antrepoAdi,
        ag.antrepo_sirket_adi,
        ag.antrepo_kodu,
        ag.gumruk,
        ag.adres,
        ag.sehir,
        ag.sozlesme_id,
        ag.gonderici_sirket,
        ag.alici_sirket,
        ag.urun_tanimi,
        ag.urun_kodu,
        ag.paket_boyutu,
        ag.paketleme_tipi,
        ag.paket_hacmi,
        ag.miktar,
        ag.kap_adeti,
        ag.birim_id,
        ag.brut_agirlik,
        ag.net_agirlik,
        ag.antrepo_giris_tarihi,
        ag.proforma_no,
        ag.proforma_tarihi,
        ag.ticari_fatura_no,
        ag.ticari_fatura_tarihi,
        ag.fatura_meblagi,
        ag.urun_birim_fiyat,
        ag.para_birimi,
        ag.depolama_suresi,
        ag.fatura_aciklama,
        ag.created_at,
        ag.updated_at,
        ag.urun_varyant_id,
        ag.description
      FROM antrepo_giris ag
      LEFT JOIN antrepolar a ON ag.antrepo_id = a.id
      ORDER BY ag.id DESC
    `;
    
    const [rows] = await db.query(sql);
    if (!rows || !Array.isArray(rows)) {
      return res.status(200).json([]);
    }
    res.status(200).json(rows);
  } catch (error) {
    console.error("GET /api/antrepo-giris hatası:", error);
    // Hata durumunda bile boş dizi döndürerek HTTP 200 ile yanıt veriyoruz
    res.status(200).json([]);
  }
});

// GET /api/antrepo-giris/:id - Belirli bir antrepo giriş kaydını getirir
router.get('/antrepo-giris/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Antrepo giriş ID=${id} için veri istendi`);
    
    const sql = `
      SELECT
        ag.id,
        ag.beyanname_no,
        ag.beyanname_form_tarihi,
        a.antrepoAdi AS antrepo_adi,
        ag.antrepo_id,
        ag.antrepo_sirket_adi,
        ag.antrepo_kodu,
        ag.gumruk,
        ag.adres,
        ag.sehir,
        ag.sozlesme_id,
        ag.gonderici_sirket,
        ag.alici_sirket,
        ag.urun_tanimi,
        ag.urun_kodu,
        ag.paket_boyutu,
        ag.paketleme_tipi,   -- Varyantın paketleme tipi metni
        ag.paket_hacmi,
        ag.miktar,
        ag.kap_adeti,
        ag.birim_id,
        ag.brut_agirlik,
        ag.net_agirlik,
        DATE_FORMAT(ag.antrepo_giris_tarihi, '%Y-%m-%d') AS antrepo_giris_tarihi,
        ag.proforma_no,
        DATE_FORMAT(ag.proforma_tarihi, '%Y-%m-%d') AS proforma_tarihi,
        ag.ticari_fatura_no,
        DATE_FORMAT(ag.ticari_fatura_tarihi, '%Y-%m-%d') AS ticari_fatura_tarihi,
        ag.fatura_meblagi,
        ag.urun_birim_fiyat,
        ag.para_birimi,
        ag.depolama_suresi,
        ag.fatura_aciklama,
        ag.urun_varyant_id,
        ag.description,       -- Ek açıklama (varsa)
        uv.description AS varyant_description,
        DATE_FORMAT(ag.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
        DATE_FORMAT(ag.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
      FROM antrepo_giris ag
      LEFT JOIN antrepolar a ON ag.antrepo_id = a.id
      LEFT JOIN urun_varyantlari uv ON ag.urun_varyant_id = uv.id
      WHERE ag.id = ?
    `;
    
    const [rows] = await db.query(sql, [id]);
    
    // Veri bulunamazsa 404 hatası döndür
    if (rows.length === 0) {
      console.log(`ID=${id} için kayıt bulunamadı`);
      return res.status(404).json({ error: 'Antrepo giriş kaydı bulunamadı.' });
    }
    
    console.log(`ID=${id} için veri başarıyla alındı:`, rows[0].beyanname_no);
    
    // Daha iyi bir yanıt yapısı için tekil nesne döndürelim
    res.json(rows[0]);
  } catch (error) {
    console.error("GET /antrepo-giris/:id hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

// FILE: routes/api.js
// routes/api.js

router.get('/maliyet-analizi', async (req, res) => {
  try {
    // Filtre parametresi varsa (ürün kodu veya antrepo ID) ekleyelim
    const { filter } = req.query; 
    let filterCondition = '';
    let filterParams = [];
    
    if (filter) {
      // Filtre, ürün kodu veya antrepo ID olabilir
      if (!isNaN(parseInt(filter))) {
        // Sayısal değer - antrepo ID olarak kabul et
        filterCondition = 'AND ag.antrepo_id = ?';
        filterParams.push(parseInt(filter));
      } else {
        // Metin değer - ürün kodu olarak kabul et
        filterCondition = 'AND u.code = ?';
        filterParams.push(filter);
      }
    }
    
    // Antrepo giriş verilerini, ürün ve antrepo bilgilerini çekiyoruz
    const sqlGiris = `
      SELECT 
        ag.id,
        ag.antrepo_id,
        ag.antrepo_giris_tarihi,
        ag.beyanname_no,
        ag.kap_adeti,
        u.name AS productName,
        u.code AS productCode,
        u.id AS productId,
        a.antrepoAdi AS antrepoName,
        ag.urun_kodu,
        ag.para_birimi
      FROM antrepo_giris ag
      LEFT JOIN urunler u ON ag.urun_kodu = u.code
      LEFT JOIN antrepolar a ON ag.antrepo_id = a.id
      WHERE 1=1 ${filterCondition}
      ORDER BY ag.id
      LIMIT 1000
    `;
    
    const [rowsGiris] = await db.query(sqlGiris, filterParams);
    const resultArray = [];
    
    // Her antrepo giriş kaydı için hesaplamaları yapıyoruz.
    for (const girisData of rowsGiris) {
      const girisId = girisData.id;
      
      // 1. Antrepo hareketleri (giriş/çıkış) verilerini çekelim.
      const sqlHareketler = `
        SELECT 
          islem_tarihi,
          islem_tipi,
          miktar,
          kap_adeti
        FROM antrepo_hareketleri
        WHERE antrepo_giris_id = ?
        ORDER BY islem_tarihi ASC
      `;
      const [rowsHareket] = await db.query(sqlHareketler, [girisId]);
      
      // Toplam giriş miktarını hesapla (ton)
      const totalGirisTon = rowsHareket
        .filter(r => r.islem_tipi === 'Giriş')
        .reduce((sum, r) => sum + parseFloat(r.miktar || 0), 0);
      
      // 2. İlk Giriş Tarihini belirle
      const sqlFirstGiris = `
        SELECT islem_tarihi
        FROM antrepo_hareketleri
        WHERE antrepo_giris_id = ? AND islem_tipi = 'Giriş'
        ORDER BY islem_tarihi ASC LIMIT 1
      `;
      const [firstGirisRows] = await db.query(sqlFirstGiris, [girisId]);
      const firstDate = (firstGirisRows && firstGirisRows.length)
        ? new Date(firstGirisRows[0].islem_tarihi).toISOString().split('T')[0]
        : "-";
      
      // 3. Hesaplama motoru placeholder – Günlük hesaplama (örnek değerler)
      const dailyBreakdown = [];
      if (rowsHareket.length > 0) {
        dailyBreakdown.push({ dayIndex: 1, date: firstDate, dayArdiye: 0, dayEkHizmet: 0, dayTotal: 0, cumulative: 0, stockAfter: totalGirisTon });
        dailyBreakdown.push({ dayIndex: 2, date: "2025-07-06", dayArdiye: 120, dayEkHizmet: 10, dayTotal: 130, cumulative: 130, stockAfter: totalGirisTon });
        dailyBreakdown.push({ dayIndex: 3, date: "2025-07-07", dayArdiye: 120, dayEkHizmet: 10, dayTotal: 130, cumulative: 260, stockAfter: totalGirisTon });
        dailyBreakdown.push({ dayIndex: 4, date: "2025-07-08", dayArdiye: 120, dayEkHizmet: 10, dayTotal: 130, cumulative: 390, stockAfter: totalGirisTon });
        dailyBreakdown.push({ dayIndex: 5, date: "2025-07-09", dayArdiye: 120, dayEkHizmet: 10, dayTotal: 130, cumulative: 520, stockAfter: totalGirisTon });
      }
      const lastDaily = dailyBreakdown[dailyBreakdown.length - 1] || { dayTotal: 0, cumulative: 0 };
      const lastDayTotal = lastDaily.dayTotal; // Mevcut Maliyet
      const lastCumulative = lastDaily.cumulative; // Toplam Maliyet
      const unitCostImpact = totalGirisTon > 0 ? lastCumulative / totalGirisTon : 0;
      
      // 4. Son çıkış tarih ve miktarını belirle
      let lastExitDate = "-";
      let lastExitAmount = "-";
      const cikislar = rowsHareket.filter(r => r.islem_tipi === 'Çıkış');
      if (cikislar.length > 0) {
        const lastCikis = cikislar[cikislar.length - 1];
        lastExitDate = new Date(lastCikis.islem_tarihi).toISOString().split('T')[0];
        lastExitAmount = lastCikis.miktar;
      }
      
      // 5. Mevcut stok ve kap adedini hesapla
      const currentStock = rowsHareket.reduce((acc, row) => {
        return row.islem_tipi === 'Giriş'
          ? acc + parseFloat(row.miktar || 0)
          : acc - parseFloat(row.miktar || 0);
      }, 0);
      const currentKap = rowsHareket.reduce((acc, row) => {
        return row.islem_tipi === 'Giriş'
          ? acc + (row.kap_adeti || 0)
          : acc - (row.kap_adeti || 0);
      }, 0);
      
      // Sonuçları resultArray'e ekle
      resultArray.push({
        productName: girisData.productName || '-',
        productCode: girisData.productCode || '-',
        productId: girisData.productId,
        antrepoName: girisData.antrepoName || '-',
        antrepoId: girisData.antrepo_id, // Yeni: Antrepo ID
        entryDate: firstDate,
        formNo: girisData.beyanname_no || '-',
        entryCount: parseFloat(totalGirisTon.toFixed(2)),
        entryKapCount: girisData.kap_adeti || "-",
        lastExitDate: lastExitDate,
        lastExitAmount: lastExitAmount,
        currentStock: parseFloat(currentStock.toFixed(2)),
        currentKapCount: currentKap,
        currentCost: parseFloat(lastDayTotal.toFixed(2)),
        totalCost: parseFloat(lastCumulative.toFixed(2)),
        unitCostImpact: parseFloat(unitCostImpact.toFixed(2)),
        entryId: girisId,
        paraBirimi: girisData.para_birimi || "USD"
      });
    }
    res.json(resultArray);
  } catch (error) {
    console.error("GET /api/maliyet-analizi hatası:", error);
    res.status(500).json({ error: error.message });
  }
});




// Yardımcı fonksiyon: Belirtilen giriş ID'si için hesaplama motorundan maliyet verilerini alır
async function fetchCostCalculationForEntry(girisId) {
  try {
    // Gerçek hesaplama motorundan veriyi al
    const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/api/hesaplama-motoru/${girisId}`);
    
    if (!response.ok) {
      console.warn(`Hesaplama motoru verileri alınamadı, ID: ${girisId}, HTTP status: ${response.status}`);
      return {
        currentCost: 0,
        totalCost: 0,
        unitCostImpact: 0
      };
    }
    
    const data = await response.json();
    
    return {
      currentCost: data.dailyBreakdown && data.dailyBreakdown.length > 0 
        ? parseFloat(data.dailyBreakdown[data.dailyBreakdown.length - 1].dayTotal) || 0 
        : 0,
      totalCost: parseFloat(data.totalCost) || 0,
      unitCostImpact: data.currentStock > 0 
        ? parseFloat(data.totalCost) / parseFloat(data.currentStock) 
        : 0
    };
  } catch (error) {
    console.error(`Maliyet hesaplama hatası (ID: ${girisId}):`, error);
    return {
      currentCost: 0,
      totalCost: 0,
      unitCostImpact: 0
    };
  }
}

router.get('/maliyet-analizi', async (req, res) => {
  try {
    // Eğer bir filtre parametresi varsa (ürün kodu veya antrepo ID)
    const { filter } = req.query; 
    let filterCondition = '';
    let filterParams = [];

    if (filter) {
      if (!isNaN(parseInt(filter))) {
        // Sayısal değer: antrepo ID olarak kabul et
        filterCondition = 'AND ag.antrepo_id = ?';
        filterParams.push(parseInt(filter));
      } else {
        // Metin değer: ürün kodu olarak kabul et
        filterCondition = 'AND u.code = ?';
        filterParams.push(filter);
      }
    }
    
    // Antrepo giriş verilerini, ürün ve antrepo bilgilerini çekiyoruz
    const sqlGiris = `
      SELECT 
        ag.id,
        ag.antrepo_id,
        ag.antrepo_giris_tarihi,
        ag.beyanname_no,
        ag.kap_adeti,
        u.name AS productName,
        u.code AS productCode,
        u.id AS productId,
        a.antrepoAdi AS antrepoName,
        ag.urun_kodu,
        ag.para_birimi
      FROM antrepo_giris ag
      LEFT JOIN urunler u ON ag.urun_kodu = u.code
      LEFT JOIN antrepolar a ON ag.antrepo_id = a.id
      WHERE 1=1 ${filterCondition}
      ORDER BY ag.id
      LIMIT 1000
    `;
    
    const [rowsGiris] = await db.query(sqlGiris, filterParams);
    console.log("Maliyet analizi ilk birkaç sonuç:", rowsGiris.slice(0, 2));
    res.json(rowsGiris);
  } catch (error) {
    console.error("GET /api/maliyet-analizi error:", error);
    res.status(500).json({ error: error.message });
  }
});


router.get('/hesaplama-motoru/:girisId', async (req, res) => {
  try {
    const girisId = req.params.girisId;
    
    // 1. Ana giriş bilgilerini al (ISO8601 tarih formatı ile)
    const sqlAntrepoGiris = `
      SELECT 
        ag.*,
        u.name as urun_adi,
        pb.iso_kodu as para_birimi_iso,
        pb.para_birimi_adi,
        pb.sembol as para_birimi_sembol,
        DATE_FORMAT(ag.antrepo_giris_tarihi, '%Y-%m-%dT%H:%i:%s%z') AS antrepo_giris_tarihi
      FROM antrepo_giris ag
      LEFT JOIN urunler u ON ag.urun_kodu = u.code
      LEFT JOIN para_birimleri pb ON ag.para_birimi = pb.id
      WHERE ag.id = ?
    `;
    const [antrepoGiris] = await db.query(sqlAntrepoGiris, [girisId]);
    if (!antrepoGiris || antrepoGiris.length === 0) {
      return res.status(404).json({ error: 'Antrepo giriş kaydı bulunamadı' });
    }

    // 2. Tüm hareketleri getir (islem_tarihi için aynı dönüşüm)
    const sqlHareketler = `
      SELECT 
        DATE_FORMAT(islem_tarihi, '%Y-%m-%dT%H:%i:%s%z') AS islem_tarihi,
        islem_tipi,
        miktar,
        created_at
      FROM antrepo_hareketleri
      WHERE antrepo_giris_id = ?
      ORDER BY islem_tarihi ASC, created_at ASC
    `;
    const [hareketler] = await db.query(sqlHareketler, [girisId]);

    // 3. Ek hizmetleri getir - Fix the SQL to correctly fetch services
    const sqlEkHizmetler = `
      SELECT 
        DATE_FORMAT(agh.ek_hizmet_tarihi, '%Y-%m-%d') AS ek_hizmet_tarihi,
        agh.toplam,
        h.hizmet_adi,
        pb.iso_kodu as para_birimi,
        agh.aciklama
      FROM antrepo_giris_hizmetler agh
      LEFT JOIN hizmetler h ON agh.hizmet_id = h.id
      LEFT JOIN para_birimleri pb ON agh.para_birimi_id = pb.id
      WHERE agh.antrepo_giris_id = ?
      ORDER BY agh.ek_hizmet_tarihi ASC
    `;
    const [ekHizmetler] = await db.query(sqlEkHizmetler, [girisId]);

    // 4. Tarih aralığını belirle - İlk günü hariç tutmak için
    const ilkGiris = hareketler.find(h => h.islem_tipi === 'Giriş');
    if (!ilkGiris) {
      return res.status(404).json({ error: 'Giriş hareketi bulunamadı' });
    }

    // DÜZELTME 1: Başlangıç tarihini bir gün ileri al
    const baslangicTarihi = dayjs(ilkGiris.islem_tarihi)
      .add(1, 'day')  // İlk günü hesaplamadan çıkarmak için
      .startOf('day')
      .toDate();

    // "now" değişkeni, bugünün gerçek zamanını içersin:
    const now = new Date();
    // Set end boundary to tomorrow's midnight to include the current day
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    console.log("Calculation start:", {
      now: now.toISOString(),
      todayEnd: todayEnd.toISOString()
    });

    // Sözleşme parametrelerini al
    const sqlSozlesme = `
      SELECT 
        gcp.sozlesme_id,
        gcp.start_day,
        gcp.end_day,
        gcp.base_fee,
        gcp.per_kg_rate,
        gcp.cargo_type,
        gcp.para_birimi
      FROM antrepo_giris ag
      JOIN sozlesmeler s ON ag.sozlesme_id = s.id
      JOIN gun_carpan_parametreleri gcp ON s.id = gcp.sozlesme_id
      WHERE ag.id = ?
      ORDER BY gcp.start_day ASC
    `;
    const [sozlesmeParams] = await db.query(sqlSozlesme, [girisId]);

    function hesaplaArdiye(kalanStok, gunSayisi, sozlesmeParams) {
      try {
        const stokMiktar = parseFloat(kalanStok) || 0;
        const gunNo = parseInt(gunSayisi) || 0;

        // DÜZELTME 2: Stok veya gün sayısı 0/negatif ise ardiye hesaplama
        if (stokMiktar <= 0 || gunNo < 1) {
          return 0;
        }

        // Gün aralığını bul
        const aralik = sozlesmeParams.find(p => 
          gunNo >= parseInt(p.start_day) && 
          (!p.end_day || gunNo <= parseInt(p.end_day))
        );

        if (!aralik) return 0;

        // Formül: Base Fee + (Kg Rate × Ton × 1000)
        const baseFee = parseFloat(aralik.base_fee);     
        const perKgRate = parseFloat(aralik.per_kg_rate);
        const ardiye = baseFee + (perKgRate * stokMiktar * 1000);

        // Debug log
        console.log('Ardiye calculation:', {
          gun: gunNo,
          stok: stokMiktar,
          baseFee,
          perKgRate,
          formula: `${baseFee} + (${perKgRate} × ${stokMiktar} × 1000)`,
          sonuc: ardiye
        });

        return Number(ardiye.toFixed(2));
      } catch (err) {
        console.error('hesaplaArdiye error:', err);
        return 0;
      }
    }

    function hesaplaStok(tarih, hareketler) {
      let stok = 0;
      const tarihStr = tarih.toISOString().split('T')[0];

      for (const hareket of hareketler) {
        // Hareketin tarihini saat bilgisi olmadan karşılaştır
        const hareketTarihStr = hareket.islem_tarihi.split('T')[0];
        
        // Sadece aynı gün veya önceki günlerin hareketlerini hesapla
        if (hareketTarihStr <= tarihStr) {
          if (hareket.islem_tipi === 'Giriş') {
            stok += parseFloat(hareket.miktar || 0);
          } else if (hareket.islem_tipi === 'Çıkış') {
            stok -= parseFloat(hareket.miktar || 0);
          }
        }
      }
      
      return Math.max(0, stok);
    }

    // 5. Günlük hesaplama döngüsü
    const dailyBreakdown = [];
    let currentDate = new Date(baslangicTarihi);
    let dayCounter = 1;
    let cumulativeCost = 0;

    const todayStr = now.toISOString().split('T')[0];

    // Döngüyü bugünü de kapsayacak şekilde çalıştır
    while (currentDate <= todayEnd) {
      try {
        const dateStr = currentDate.toISOString().split('T')[0];
        const kalanStok = hesaplaStok(currentDate, hareketler);
        
        // Son giriş tarihini bul
        const lastEntry = hareketler
          .filter(h => h.islem_tipi === 'Giriş')
          .sort((a, b) => new Date(b.islem_tarihi) - new Date(a.islem_tarihi))[0];
        
        // Gün sayısını son giriş tarihine göre hesapla
        const lastEntryDate = new Date(lastEntry.islem_tarihi);
        lastEntryDate.setHours(0, 0, 0, 0);
        // DÜZELTME 3: Gün sayısı hesaplamasında +1 kaldırıldı
        const gunSayisi = Math.floor((currentDate - lastEntryDate) / (1000 * 60 * 60 * 24));

        const dayArdiye = hesaplaArdiye(kalanStok, gunSayisi, sozlesmeParams);

        // DÜZELTME 4: Hem stok hem ardiye 0 ise günü tabloya ekleme 
        if (kalanStok > 0 || dayArdiye > 0) {
          const gunlukEkHizmetler = ekHizmetler
            .filter(eh => eh.ek_hizmet_tarihi === dateStr)
            .reduce((sum, eh) => sum + parseFloat(eh.toplam || 0), 0);

          const dayTotal = dayArdiye + gunlukEkHizmetler;
          cumulativeCost += dayTotal;

          dailyBreakdown.push({
            dayIndex: dayCounter,
            date: dateStr,
            dayArdiye: parseFloat(dayArdiye.toFixed(2)),
            dayEkHizmet: parseFloat(gunlukEkHizmetler.toFixed(2)),
            dayTotal: parseFloat(dayTotal.toFixed(2)),
            cumulative: parseFloat(cumulativeCost.toFixed(2)),
            stockAfter: parseFloat(kalanStok.toFixed(2))
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
        dayCounter++;
      } catch (err) {
        console.error('Daily calculation error:', err);
      }
    }

    console.log("Calculation complete", {
      firstDate: baslangicTarihi.toISOString().split('T')[0],
      lastDate: now.toISOString().split('T')[0],
      totalDays: dailyBreakdown.length,
      currentStock: hesaplaStok(now, hareketler)
    });

    res.json({
      antrepoGiris: antrepoGiris[0],
      dailyBreakdown,
      totalCost: parseFloat(cumulativeCost.toFixed(2)),
      firstDate: baslangicTarihi.toISOString().split('T')[0],
      lastDate: now.toISOString().split('T')[0],
      currentStock: parseFloat(hesaplaStok(now, hareketler).toFixed(2))
    });

  } catch (error) {
    console.error("Hesaplama motoru hatası:", error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
        DATE_FORMAT(agh.ek_hizmet_tarihi, '%Y-%m-%d') AS ek_hizmet_tarihi
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
    const { product, variant } = req.body;
    if (!product.name || !product.code) {
      return res.status(400).json({ error: "Ürün adı ve kodu zorunludur." });
    }
    
    // Ürün ekle
    const sqlProduct = `
      INSERT INTO urunler
      (name, code, paket_hacmi, paketleme_tipi_id, description)
      VALUES (?, ?, ?, ?, ?)
    `;
    // Eğer sistemde artık paketleme_tipi_id kullanılmıyorsa null gönderiyoruz,
    // description alanına ise varyanttaki paketleme tipi metnini kaydediyoruz.
    const productValues = [
      product.name,
      product.code,
      variant.paket_hacmi || 0,
      null,
      product.description || variant.description || null
    ];
    const [resultProduct] = await db.query(sqlProduct, productValues);
    const newProductId = resultProduct.insertId;
    
    // İsteğe bağlı: Eğer varyant ekleniyorsa, urun_varyantlari tablosuna da kayıt eklenir.
    if (variant) {
      const sqlVariant = `
        INSERT INTO urun_varyantlari
        (urun_id, paket_hacmi, description)
        VALUES (?, ?, ?)
      `;
      const variantValues = [newProductId, variant.paket_hacmi || 0, variant.description || null];
      await db.query(sqlVariant, variantValues);
    }
    
    res.json({ success: true, insertedId: newProductId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// POST /api/companies - Yeni şirket ekle
// POST /api/companies
router.post('/companies', async (req, res) => {
  try {
    const {
      firstName, lastName, companyName, displayName, emailAddress,
      phoneNumber, currency, taxRate, taxNumber, taxOffice, paymentTerms,
      address, customs
    } = req.body;
    
    const sql = `
      INSERT INTO sirketler 
      (first_name, last_name, company_name, display_name, email, phone_number,
       currency, tax_rate, tax_number, tax_office, payment_terms,
       address_city_id, address_district, address_postal_code, address_detail,
       customs_info, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const values = [
      firstName, lastName, companyName, displayName, emailAddress, phoneNumber,
      currency, parseFloat(taxRate), taxNumber, taxOffice, paymentTerms,
      address.city_id, address.district, address.postalCode, address.detail,
      JSON.stringify(customs || []),  // customs verisini JSON olarak ekliyoruz
    ];
    
    const [result] = await db.query(sql, values);
    res.json({ success: true, insertedId: result.insertId });
  } catch (error) {
    console.error("POST /api/companies hatası:", error);
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
  // Payload'da soslesme, hizmetler ve gun_carpan_parametreleri ayrı alınmalı
  const { sozlesme, hizmetler, gun_carpan_parametreleri, ek_hizmet_parametreleri } = req.body;

  if (!sozlesme || !sozlesme.sozlesme_adi) {
    return res.status(400).json({ error: "Sözleşme adı zorunludur." });
  }
  if (!sozlesme.sozlesme_kodu) {
    return res.status(400).json({ error: "Sözleşme kodu zorunludur." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Ek hizmet parametreleri JSON'a dönüştür
    const ekHizmetJSON = ek_hizmet_parametreleri
      ? JSON.stringify(ek_hizmet_parametreleri)
      : null;

    // Ana sözleşmeyi oluştur
    const sqlSozlesme = `
      INSERT INTO sozlesmeler
        (sozlesme_sirket_id, sozlesme_kodu, sozlesme_adi, baslangic_tarihi, bitis_tarihi,
         fatura_periyodu, min_fatura, para_birimi, giris_gunu_kural, kismi_gun_yontemi,
         hafta_sonu_carpani, kdv_orani, doviz_kuru,
         ek_hizmet_parametreleri,
         olusturulma_tarihi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
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
      ekHizmetJSON
    ];

    const [resultSozlesme] = await conn.query(sqlSozlesme, valuesSozlesme);
    const newSozlesmeId = resultSozlesme.insertId; 

    // Hizmetler tablosuna kaydet
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

    // GÜN ÇARPAN PARAMETRELERİNİ EKLE - Bu kısım eksikti
    if (Array.isArray(gun_carpan_parametreleri) && gun_carpan_parametreleri.length > 0) {
      for (const gc of gun_carpan_parametreleri) {
        if (!gc.startDay) {
          console.warn('Skipping invalid gun_carpan_parametresi (missing startDay):', gc);
          continue;
        }
        
        const sqlGunCarpan = `
          INSERT INTO gun_carpan_parametreleri 
            (sozlesme_id, start_day, end_day, base_fee, per_kg_rate, cargo_type, para_birimi, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const valsGunCarpan = [
          newSozlesmeId,
          gc.startDay,
          gc.endDay || null,
          parseFloat(gc.baseFee) || 0,
          parseFloat(gc.perKgRate) || 0,
          gc.cargoType || "Genel Kargo",
          gc.paraBirimi || sozlesme.para_birimi || "USD"
        ];
        
        await conn.query(sqlGunCarpan, valsGunCarpan);
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
    const payload = req.body;

    // Aşağıdaki sıralama tablo yapınıza bire bir uyuyor.
    // (paketleme_tipi_id sütunu yok varsayımıyla.)

    const sql = `
      INSERT INTO antrepo_giris (
        beyanname_no,             -- 2
        beyanname_form_tarihi,    -- 3
        antrepo_id,               -- 4
        antrepo_sirket_adi,       -- 5
        antrepo_kodu,             -- 6
        gumruk,                   -- 7
        adres,                    -- 8
        sehir,                    -- 9
        sozlesme_id,              -- 10
        gonderici_sirket,         -- 11
        alici_sirket,             -- 12
        urun_tanimi,              -- 13
        urun_kodu,                -- 14
        paket_boyutu,             -- 15
        paketleme_tipi,           -- 16 (Örn. "IBC-Plastic (Bulk)")
        paket_hacmi,              -- 17
        miktar,                   -- 18
        kap_adeti,                -- 19
        birim_id,                 -- 20
        brut_agirlik,             -- 21
        net_agirlik,              -- 22
        antrepo_giris_tarihi,     -- 23
        proforma_no,              -- 24
        proforma_tarihi,          -- 25
        ticari_fatura_no,         -- 26
        ticari_fatura_tarihi,     -- 27
        fatura_meblagi,           -- 28
        urun_birim_fiyat,         -- 29
        para_birimi,              -- 30
        depolama_suresi,          -- 31
        fatura_aciklama,          -- 32
        urun_varyant_id,          -- 35
        description               -- 36
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // 33 adet parametre
    const params = [
      payload.beyanname_no || null,            // 2
      payload.beyanname_form_tarihi || null,   // 3
      payload.antrepo_id || null,              // 4
      payload.antrepo_sirket_adi || null,      // 5
      payload.antrepo_kodu || null,            // 6
      payload.gumruk || null,                  // 7
      payload.adres || null,                   // 8
      payload.sehir || null,                   // 9
      payload.sozlesme_id || null,             // 10
      payload.gonderici_sirket || null,        // 11
      payload.alici_sirket || null,            // 12
      payload.urun_tanimi || null,             // 13
      payload.urun_kodu || null,               // 14
      payload.paket_boyutu || null,            // 15
      payload.paketleme_tipi || null,          // 16
      payload.paket_hacmi || null,             // 17
      payload.miktar || null,                  // 18
      payload.kap_adeti || null,               // 19
      payload.birim_id || null,                // 20
      payload.brut_agirlik || null,            // 21
      payload.net_agirlik || null,             // 22
      payload.antrepo_giris_tarihi || null,    // 23
      payload.proforma_no || null,             // 24
      payload.proforma_tarihi || null,         // 25
      payload.ticari_fatura_no || null,        // 26
      payload.ticari_fatura_tarihi || null,    // 27
      payload.fatura_meblagi || null,          // 28
      payload.urun_birim_fiyat || null,        // 29
      payload.para_birimi || null,             // 30
      payload.depolama_suresi || null,         // 31
      payload.fatura_aciklama || null,         // 32
      payload.urun_varyant_id || null,         // 35
      payload.description || null              // 36
    ];

    const [result] = await db.query(sql, params);

    res.json({
      success: true,
      insertedId: result.insertId,
      message: 'Antrepo giriş kaydı başarıyla eklendi.'
    });
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

// /api/antrepo-giris/:id/hareketler (POST)
router.post('/antrepo-giris/:girisId/hareketler', async (req, res) => {
  try {
    const girisId = req.params.girisId;
    const { 
      islem_tarihi, 
      islem_tipi, 
      miktar, 
      kap_adeti, 
      brut_agirlik, 
      net_agirlik, 
      birim_id, 
      paket_hacmi,       
      aciklama,
      description  // Yeni: description alanı
    } = req.body;
    
    // Zorunlu alan kontrolü
    if (!islem_tarihi || !miktar) {
      return res.status(400).json({ error: "Zorunlu alanlar eksik" });
    }
    
    const sql = `
      INSERT INTO antrepo_hareketleri
      (antrepo_giris_id, islem_tarihi, islem_tipi, miktar, kap_adeti, brut_agirlik, net_agirlik, birim_id, paket_hacmi, aciklama, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      girisId, 
      islem_tarihi, 
      islem_tipi, 
      miktar, 
      kap_adeti || 0, 
      brut_agirlik || 0, 
      net_agirlik || 0, 
      birim_id || 1, 
      paket_hacmi || null,       
      aciklama || "",
      description || ""
    ];
    
    const [result] = await db.query(sql, params);
    res.json({ success: true, insertedId: result.insertId });
  } catch (error) {
    console.error("POST /antrepo-giris/:girisId/hareketler hatası:", error);
    res.status(500).json({ error: error.message });
  }
});



router.get('/antrepo-giris/:girisId/hareketler', async (req, res) => {
  try {
    const { girisId } = req.params;
    const sql = `
      SELECT
        h.id,
        h.antrepo_giris_id,
        h.islem_tarihi,
        h.islem_tipi,
        h.miktar,
        h.birim_id,
        h.paket_hacmi,
        h.aciklama,
        h.kap_adeti,
        h.brut_agirlik,
        h.net_agirlik,
        h.urun_varyant_id,
        h.description,    -- Mesela ek bir açıklama sütunu
        h.created_at,
        h.updated_at
      FROM antrepo_hareketleri h
      WHERE h.antrepo_giris_id = ?
      ORDER BY h.islem_tarihi DESC, h.created_at DESC
    `;
    const [rows] = await db.query(sql, [girisId]);
    res.json(rows);
  } catch (error) {
    console.error("GET /antrepo-giris/:girisId/hareketler hatası:", error);
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

// POST /api/urun - Ürün ve Varyant ekleme endpoint'i
router.post('/urun', async (req, res) => {
  const { product, variant } = req.body;
  const conn = await db.getConnection();
  
  try {
    console.log("Received data:", {product, variant}); // Debug için gelen veriyi loglayalım
    await conn.beginTransaction();

    // Ürün tablosuna eklemek için SQL sorgusu
    const sqlProduct = `
      INSERT INTO urunler (name, code, description, paket_hacmi, paketleme_tipi_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    // Ürün tablosuna varyant bilgilerini de ekleyelim
    const [productResult] = await conn.query(sqlProduct, [
      product.name,
      product.code,
      product.description || '',
      variant && variant.paket_hacmi ? variant.paket_hacmi : 0,
      variant && variant.description ? variant.description : null
    ]);
    
    const urunId = productResult.insertId;
    
    // Varyant bilgilerini kaydet
    if (variant && (variant.paket_hacmi || variant.description)) {
      // Varyant verilerini kontrol edelim
      console.log("Saving variant:", {
        urun_id: urunId,
        paket_hacmi: variant.paket_hacmi || 0,
        description: variant.description || null
      });
      
      const sqlVariant = `
        INSERT INTO urun_varyantlari 
        (urun_id, paket_hacmi, description)
        VALUES (?, ?, ?)
      `;
      
      await conn.query(sqlVariant, [
        urunId,
        variant.paket_hacmi || 0,
        variant.description || null
      ]);
    }

    await conn.commit();
    
    // İşlem başarılı oldu
    res.json({ 
      success: true, 
      message: 'Ürün ve varyant başarıyla eklendi',
      productId: urunId
    });
  } catch (error) {
    await conn.rollback();
    console.error('POST /api/urun error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  } finally {
    conn.release();
  }
});

// POST /api/urun-varyantlari - Yeni varyant ekle
// routes/api.js (örnek)

router.post('/urun-varyantlari', async (req, res) => {
  try {
    const { urun_id, paket_hacmi, description } = req.body;
    
    // Validasyon: Tüm alanlar dolu olmalı
    if (!urun_id || !paket_hacmi || !description) {
      return res.status(400).json({ 
        error: "Tüm alanlar zorunludur: urun_id, paket_hacmi, description" 
      });
    }

    const sql = `
      INSERT INTO urun_varyantlari 
      (urun_id, paket_hacmi, description) 
      VALUES (?, ?, ?)
    `;
    
    const [result] = await db.query(sql, [urun_id, paket_hacmi, description]);
    
    res.json({ 
      success: true, 
      message: 'Varyant başarıyla eklendi',
      insertedId: result.insertId 
    });
  } catch (error) {
    console.error("Varyant ekleme hatası:", error);
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
      description,
      beyanname_no,
      beyanname_form_tarihi,
      antrepo_id,
      antrepo_sirket_adi,
      antrepo_kodu,
      gumruk,
      adres,
      sehir,
      sozlesme_id,
      gonderici_sirket,
      alici_sirket,
      urun_tanimi,
      urun_kodu,
      paket_boyutu,
      paketleme_tipi,
      paket_hacmi,
      miktar,
      kap_adeti,
      birim_id,
      brut_agirlik,
      net_agirlik,
      antrepo_giris_tarihi,
      proforma_no,
      proforma_tarihi,
      ticari_fatura_no,
      ticari_fatura_tarihi,
      fatura_meblagi,
      urun_birim_fiyat,
      para_birimi,
      depolama_suresi,
      fatura_aciklama,
      urun_varyant_id
    } = req.body;

    const sql = `
      UPDATE antrepo_giris
      SET
        beyanname_no = ?,
        beyanname_form_tarihi = ?,
        antrepo_id = ?,
        antrepo_sirket_adi = ?,
        antrepo_kodu = ?,
        gumruk = ?,
        adres = ?,
        sehir = ?,
        sozlesme_id = ?,
        gonderici_sirket = ?,
        alici_sirket = ?,
        urun_tanimi = ?,
        urun_kodu = ?,
        paket_boyutu = ?,
        paketleme_tipi = ?,
        paket_hacmi = ?,
        miktar = ?,
        kap_adeti = ?,
        birim_id = ?,
        brut_agirlik = ?,
        net_agirlik = ?,
        antrepo_giris_tarihi = ?,
        proforma_no = ?,
        proforma_tarihi = ?,
        ticari_fatura_no = ?,
        ticari_fatura_tarihi = ?,
        fatura_meblagi = ?,
        urun_birim_fiyat = ?,
        para_birimi = ?,
        depolama_suresi = ?,
        fatura_aciklama = ?,
        urun_varyant_id = ?,
        description = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      beyanname_no || null,
      beyanname_form_tarihi || null,
      antrepo_id || null,
      antrepo_sirket_adi || null,
      antrepo_kodu || null,
      gumruk || null,
      adres || null,
      sehir || null,
      sozlesme_id || null,
      gonderici_sirket || null,
      alici_sirket || null,
      urun_tanimi || null,
      urun_kodu || null,
      paket_boyutu || null,
      paketleme_tipi || null,
      paket_hacmi || null,
      miktar || null,
      kap_adeti || null,
      birim_id || null,
      brut_agirlik || null,
      net_agirlik || null,
      antrepo_giris_tarihi || null,
      proforma_no || null,
      proforma_tarihi || null,
      ticari_fatura_no || null,
      ticari_fatura_tarihi || null,
      fatura_meblagi || null,
      urun_birim_fiyat || null,
      para_birimi || null,
      depolama_suresi || null,
      fatura_aciklama || null,
      urun_varyant_id || null,
      description || null,
      id
    ];

    const [result] = await db.query(sql, params);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Kayıt güncellendi.' });
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
      birim_id, 
      paket_hacmi,        
      aciklama,
      kap_adeti,
      brut_agirlik,
      net_agirlik,
      urun_varyant_id,
      description  // Yeni eklenen alan
    } = req.body;

    if (!girisId || !hareketId || !islem_tarihi || !islem_tipi || !miktar) {
      return res.status(400).json({ error: "Zorunlu alanlar eksik" });
    }

    const sql = `
      UPDATE antrepo_hareketleri
      SET
        islem_tarihi = ?,
        islem_tipi = ?,
        miktar = ?,
        birim_id = ?,
        paket_hacmi = ?,
        aciklama = ?,
        kap_adeti = ?,
        brut_agirlik = ?,
        net_agirlik = ?,
        urun_varyant_id = ?,
        description = ?,
        updated_at = NOW()
      WHERE id = ? AND antrepo_giris_id = ?
    `;

    const params = [
      islem_tarihi,
      islem_tipi,
      miktar,
      birim_id || null,
      paket_hacmi || null,
      aciklama || null,
      kap_adeti || 0,
      brut_agirlik || 0.00,
      net_agirlik || 0.00,
      urun_varyant_id || null,
      description || null,
      hareketId,
      girisId
    ];

    const [result] = await db.query(sql, params);

    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Hareket kaydı bulunamadı.' });
    }
  } catch (error) {
    console.error("PUT /antrepo-giris/:girisId/hareketler/:hareketId hatası:", error);
    res.status(500).json({ error: error.message });
  }
});




// ============== 2) SÖZLEŞME GÜNCELLEME (PUT) ==============
router.put('/sozlesmeler/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`Updating contract ${id} with data:`, JSON.stringify(req.body, null, 2));
  
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

    // 1) Sözleşme ana kaydını güncelle
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
          parseFloat(h.temel_ucret) || 0,
          parseFloat(h.carpan) || 0,
          parseFloat(h.min_ucret) || 0
        ];
        await conn.query(sqlHizmet, valsHizmet);
      }
    }

    // 3) Gün Çarpanı Parametreleri işlemleri:
    console.log('Received gun_carpan_parametreleri:', JSON.stringify(gun_carpan_parametreleri, null, 2));
    
    // Öncelikle, gun_carpan_parametreleri tablosunda bu sözleşmeye ait mevcut kayıtları sil
    await conn.query('DELETE FROM gun_carpan_parametreleri WHERE sozlesme_id = ?', [id]);
    
    if (Array.isArray(gun_carpan_parametreleri) && gun_carpan_parametreleri.length > 0) {
      for (const gc of gun_carpan_parametreleri) {
        if (!gc.startDay) {
          console.warn('Skipping invalid gun_carpan_parametresi (missing startDay):', gc);
          continue;
        }
        
        const sqlGunCarpan = `
          INSERT INTO gun_carpan_parametreleri 
            (sozlesme_id, start_day, end_day, base_fee, per_kg_rate, cargo_type, para_birimi, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const valsGunCarpan = [
          id,
          gc.startDay,
          gc.endDay || null,
          parseFloat(gc.baseFee) || 0,
          parseFloat(gc.perKgRate) || 0,
          gc.cargoType || "Genel Kargo",
          gc.paraBirimi || sozlesme.para_birimi || "USD"
        ];
        
        try {
          await conn.query(sqlGunCarpan, valsGunCarpan);
          console.log(`Added gün çarpan parametresi with startDay: ${gc.startDay}, endDay: ${gc.endDay}`);
        } catch (err) {
          console.error('Failed to insert gun_carpan_parametresi:', err.message);
          // Continue with other parameters rather than failing completely
        }
      }
    } else {
      console.log('No gün çarpan parametreleri provided or empty array');
    }

    // 4) Ek Hizmet Parametreleri:
    const ekHizmetJSON = ek_hizmet_parametreleri
      ? JSON.stringify(ek_hizmet_parametreleri)
      : null;
    await conn.query('UPDATE sozlesmeler SET ek_hizmet_parametreleri = ? WHERE id = ?', [ekHizmetJSON, id]);

    await conn.commit();
    conn.release();
    console.log(`Contract ${id} updated successfully`);
    res.json({ success: true });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error('Error updating contract:', error);
    res.status(500).json({ 
      error: error.message,
      details: "Sözleşme güncellenirken bir hata oluştu."
    });
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



router.delete('/antrepo-giris/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `DELETE FROM antrepo_giris WHERE id = ?`;
    const [result] = await db.query(sql, [id]);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Kayıt bulunamadı.' });
    }
  } catch (error) {
    console.error("DELETE /api/antrepo-giris/:id hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM sirketler WHERE sirket_id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Şirket bulunamadı.' });
    }
    // rows[0].customs_info JSON string
    res.json(rows[0]);
  } catch (error) {
    console.error("GET /api/companies/:id hatası:", error);
    res.status(500).json({ error: error.message });
  }
});



router.put('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName, lastName, companyName, displayName, emailAddress,
      phoneNumber, currency, taxRate, taxNumber, taxOffice, paymentTerms,
      address, customs // customs burada seçilen gümrüklerin dizisi (örneğin, [3,5,7])
    } = req.body;
    
    const sql = `
      UPDATE sirketler
      SET
        first_name = ?,
        last_name = ?,
        company_name = ?,
        display_name = ?,
        email = ?,
        phone_number = ?,
        currency = ?,
        tax_rate = ?,
        tax_number = ?,
        tax_office = ?,
        payment_terms = ?,
        address_city_id = ?,
        address_district = ?,
        address_postal_code = ?,
        address_detail = ?,
        customs_info = ?,
        updated_at = NOW()
      WHERE sirket_id = ?
    `;
    const values = [
      firstName, lastName, companyName, displayName, emailAddress,
      phoneNumber, currency, parseFloat(taxRate), taxNumber, taxOffice,
      paymentTerms,
      address.city_id, address.district, address.postalCode, address.detail,
      JSON.stringify(customs || []), // JSON string olarak kaydediyoruz
      id
    ];
    
    const [result] = await db.query(sql, values);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Şirket bulunamadı.' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("PUT /api/companies/:id hatası:", error);
    res.status(500).json({ error: error.message });
  }
});


// File: routes/api.js
router.get('/companies/:id/customs', async (req, res) => {
  try {
    const { id } = req.params;
    // Örnek: Şirketin gümrükleri, 'sirket_gumrukler' tablosunda tutuluyorsa
    const [rows] = await db.query('SELECT gumruk_id FROM sirket_gumrukler WHERE sirket_id = ?', [id]);
    const gumrukIds = rows.map(row => row.gumruk_id);
    res.json(gumrukIds);
  } catch (error) {
    console.error("GET /api/companies/:id/customs hatası:", error);
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


// Hareket silme endpoint'ini ekleyelim (eğer yoksa)
router.delete('/antrepo-giris/:girisId/hareketler/:hareketId', async (req, res) => {
  try {
    const { girisId, hareketId } = req.params;
    const sql = `
      DELETE FROM antrepo_hareketleri 
      WHERE id = ? AND antrepo_giris_id = ?
    `;
    const [result] = await db.query(sql, [hareketId, girisId]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Hareket kaydı silindi.' });
    } else {
      res.status(404).json({ error: 'Hareket kaydı bulunamadı.' });
    }
  } catch (error) {
    console.error("DELETE /antrepo-giris/:girisId/hareketler/:hareketId hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

// File: routes/api.js (veya ilgili dosya)
router.delete('/antrepo-giris/:girisId/ek-hizmetler/:ekHizmetId', async (req, res) => {
  try {
    const { girisId, ekHizmetId } = req.params;
    // DELETE sorgusu: girisId ile uyumlu kaydı kontrol ederek silme işlemi
    const [result] = await db.query(
      'DELETE FROM antrepo_giris_hizmetler WHERE id = ? AND antrepo_giris_id = ?',
      [ekHizmetId, girisId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Ek hizmet kaydı bulunamadı' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/antrepo-giris/:girisId/ek-hizmetler/:ekHizmetId hatası:", error);
    res.status(500).json({ error: error.message });
  }
});


router.get('/hareketler', async (req, res) => {
  try {
    const sql = `
      SELECT
        id,
        antrepo_giris_id,
        islem_tarihi,
        islem_tipi,
        miktar,
        birim_id,
        paketleme_tipi_id,
        paket_hacmi,
        aciklama,
        created_at,
        updated_at,
        kap_adeti,
        brut_agirlik,
        net_agirlik,
        urun_varyant_id
      FROM antrepo_hareketleri
      ORDER BY id DESC
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (error) {
    console.error("GET /api/hareketler hatası:", error);
    res.status(500).json({ error: error.message });
  }
});


router.get('/hareketler/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT
        id,
        antrepo_giris_id,
        islem_tarihi,
        islem_tipi,
        miktar,
        birim_id,
        paketleme_tipi_id,
        paket_hacmi,
        aciklama,
        created_at,
        updated_at,
        kap_adeti,
        brut_agirlik,
        net_agirlik,
        urun_varyant_id
      FROM antrepo_hareketleri
      WHERE id = ?
    `;
    const [rows] = await db.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Hareket kaydı bulunamadı.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("GET /api/hareketler/:id hatası:", error);
    res.status(500).json({ error: error.message });
  }
});




// GET /api/urun_varyantlari
// Artık bağımlılık kaldırıldı: 
// - Paketleme tipi verisi için: ?urunId=... 
// - Paket boyutu verisi için: ?urunId=...&getSizes=true
router.get('/urun_varyantlari', async (req, res) => {
  try {
    const { urunId } = req.query;
    if (!urunId) {
      return res.status(400).json({ error: 'urunId parametresi gerekli.' });
    }
    const sql = `
      SELECT
        uv.id,
        uv.urun_id,
        uv.paket_hacmi,
        uv.description AS paketleme_tipi_adi,  -- Artık ID yerine description metni
        uv.olusturulma_tarihi
      FROM urun_varyantlari uv
      WHERE uv.urun_id = ?
      ORDER BY uv.id DESC
    `;
    const [rows] = await db.query(sql, [urunId]);
    res.json(rows);
  } catch (error) {
    console.error('GET /urun_varyantlari hata:', error);
    res.status(500).json({ error: error.message });
  }
});



// Bu endpoint, ilgili ürünün tüm farklı paket_hacmi (paket boyutu) değerlerini getirir.
router.get('/urun_varyantlari/paket-boyutlari', async (req, res) => {
  try {
    const { urunId } = req.query;
    if (!urunId) {
      return res.status(400).json({ error: 'urunId parametresi gerekli.' });
    }
    const sql = `
      SELECT DISTINCT paket_hacmi AS paket_boyutu
      FROM urun_varyantlari
      WHERE urun_id = ?
      ORDER BY paket_hacmi
    `;
    const [rows] = await db.query(sql, [urunId]);
    if (!rows.length) {
      return res.status(404).json({ error: 'Paket boyutu varyantı bulunamadı.' });
    }
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/urun_varyantlari/details', async (req, res) => {
  try {
    const { urunId } = req.query;
    if (!urunId) {
      return res.status(400).json({ error: 'urunId parametresi gerekli.' });
    }
    const sql = `
      SELECT
        uv.id,
        uv.urun_id,
        uv.paket_hacmi,
        uv.description,
        uv.olusturulma_tarihi,
        uv.guncellenme_tarihi
      FROM urun_varyantlari uv
      WHERE uv.urun_id = ?
    `;
    const [rows] = await db.query(sql, [urunId]);
    res.json(rows);
  } catch (error) {
    console.error('GET /api/urun_varyantlari/details hata:', error);
    res.status(500).json({ error: error.message });
  }
});



// GET /api/urun_varyantlari/:id - Tekil varyant getir
router.get('/urun_varyantlari/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        v.id,
        v.urun_id,
        v.paket_hacmi,
        v.description,
        u.name as urun_adi,
        u.code as urun_kodu
      FROM urun_varyantlari v
      LEFT JOIN urunler u ON v.urun_id = u.id
      WHERE v.id = ?
    `;
    const [rows] = await db.query(sql, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Varyant bulunamadı' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Varyant getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/urun_varyantlari', async (req, res) => {
  try {
    const { urun_id, paket_hacmi, description } = req.body;
    if (!urun_id || !paket_hacmi || !description) {
      return res.status(400).json({ error: "urun_id, paket_hacmi ve description zorunludur." });
    }
    
    const sqlVariant = `
      INSERT INTO urun_varyantlari
      (urun_id, paket_hacmi, description)
      VALUES (?, ?, ?)
    `;
    const values = [urun_id, paket_hacmi, description];
    const [result] = await db.query(sqlVariant, values);
    
    // Ürün tablosunu da güncelle (örneğin, ilk varyant verisini ürün kaydına yansıt)
    const sqlUpdateProduct = `
      UPDATE urunler 
      SET paket_hacmi = ?, description = ? 
      WHERE id = ?
    `;
    await db.query(sqlUpdateProduct, [paket_hacmi, description, urun_id]);
    
    res.json({ success: true, insertedId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/hareketler/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      antrepo_giris_id,
      islem_tarihi,
      islem_tipi,
      miktar,
      birim_id,
      paket_hacmi,
      aciklama,
      kap_adeti,
      brut_agirlik,
      net_agirlik,
      urun_varyant_id
    } = req.body;

    if (!antrepo_giris_id || !islem_tarihi || !islem_tipi || !miktar) {
      return res.status(400).json({ error: "Zorunlu alanlar eksik" });
    }

    const sql = `
      UPDATE antrepo_hareketleri
      SET
        antrepo_giris_id = ?,
        islem_tarihi = ?,
        islem_tipi = ?,
        miktar = ?,
        birim_id = ?,
        paket_hacmi = ?,
        aciklama = ?,
        kap_adeti = ?,
        brut_agirlik = ?,
        net_agirlik = ?,
        urun_varyant_id = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      antrepo_giris_id,
      islem_tarihi,
      islem_tipi,
      miktar,
      birim_id || null,
      paket_hacmi || null,
      aciklama || null,
      kap_adeti || 0,
      brut_agirlik || 0.00,
      net_agirlik || 0.00,
      urun_varyant_id || null,
      id
    ];

    const [result] = await db.query(sql, params);

    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Hareket kaydı bulunamadı.' });
    }
  } catch (error) {
    console.error("PUT /api/hareketler/:id hatası:", error);
    res.status(500).json({ error: error.message });
  }
});




// Varyant güncelleme endpoint'inde (örnek)
router.put('/urun_varyantlari/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { paket_hacmi, description } = req.body;

    if (!paket_hacmi || !description) {
      return res.status(400).json({ error: "paket_hacmi ve description zorunludur" });
    }

    // Varyantı güncelle
    const sqlVariant = `
      UPDATE urun_varyantlari 
      SET paket_hacmi = ?, description = ?
      WHERE id = ?
    `;
    const [result] = await db.query(sqlVariant, [paket_hacmi, description, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Varyant bulunamadı' });
    }

    // İlgili ürünün id'sini alalım:
    const [variantData] = await db.query("SELECT urun_id FROM urun_varyantlari WHERE id = ?", [id]);
    if (variantData.length > 0) {
      const urun_id = variantData[0].urun_id;
      // Ürün tablosunda description alanını da güncelleyelim:
      const sqlUpdateProduct = `
        UPDATE urunler 
        SET paket_hacmi = ?, description = ?
        WHERE id = ?
      `;
      await db.query(sqlUpdateProduct, [paket_hacmi, description, urun_id]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Varyant güncelleme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});


// DELETE /api/urun_varyantlari/:id - Varyant sil
router.delete('/urun_varyantlari/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM urun_varyantlari WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Varyant bulunamadı' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Varyant silme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/urun_varyantlari', async (req, res) => {
  try {
    const { urunId, paketlemeTipi } = req.query;
    if (!urunId) {
      return res.status(400).json({ error: 'urunId parametresi gerekli.' });
    }

    // Paketleme tiplerini döndür (paketlemeTipi parametresi boşsa)
    if (!paketlemeTipi) {
      const sqlTips = `
        SELECT DISTINCT 
          uv.id,
          uv.description as paketleme_tipi_name
        FROM urun_varyantlari uv
        WHERE uv.urun_id = ?
      `;
      const [rows] = await db.query(sqlTips, [urunId]);
      return res.json(rows);
    }

    // Paket boyutlarını döndür
    const sqlBoyut = `
      SELECT DISTINCT paket_hacmi
      FROM urun_varyantlari
      WHERE urun_id = ? AND description = ?
    `;
    const [rows] = await db.query(sqlBoyut, [urunId, paketlemeTipi]);
    if (!rows.length) {
      return res.status(404).json({ error: 'Varyant bulunamadı.' });
    }
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stok Kartı - Antrepo Bazlı Stok Miktarları
router.get('/stock-amounts/:urunKodu', async (req, res) => {
  try {
    const { urunKodu } = req.params;
    
    // 1. Her giriş formu için net miktar ve kap adetlerini hesapla
    const sql = `
      SELECT 
        a.antrepoAdi,
        a.id as antrepo_id,
        g.id as giris_id,
        SUM(CASE WHEN h.islem_tipi = 'Giriş' THEN h.miktar ELSE -h.miktar END) AS net_miktar,
        SUM(CASE WHEN h.islem_tipi = 'Giriş' THEN h.kap_adeti ELSE -h.kap_adeti END) AS net_kap_adeti
      FROM antrepo_hareketleri h
      JOIN antrepo_giris g ON h.antrepo_giris_id = g.id
      JOIN antrepolar a ON g.antrepo_id = a.id
      WHERE g.urun_kodu = ?
      GROUP BY a.antrepoAdi, a.id, g.id
    `;
    
    const [rows] = await db.query(sql, [urunKodu]);
    
    // 2. JavaScript ile her antrepo için toplam hesapla
    const antrepoMap = {};
    
    rows.forEach(row => {
      const { antrepoAdi, antrepo_id, giris_id, net_miktar, net_kap_adeti } = row;
      
      // Eğer bu antrepo ilk defa görülüyorsa initialize et
      if (!antrepoMap[antrepo_id]) {
        antrepoMap[antrepo_id] = {
          Antrepo: antrepoAdi,
          Miktar: 0,
          KapAdeti: 0,
          FormAdeti: 0
        };
      }
      
      // Toplam miktarları ekle
      antrepoMap[antrepo_id].Miktar += parseFloat(net_miktar) || 0;
      antrepoMap[antrepo_id].KapAdeti += parseInt(net_kap_adeti) || 0;
      
      // Net miktarı pozitif olan formları say
      if (parseFloat(net_miktar) > 0) {
        antrepoMap[antrepo_id].FormAdeti += 1;
      }
    });
    
    // 3. Sadece pozitif stokları içeren sonuç listesi oluştur ve miktar bazında sırala
    const result = Object.values(antrepoMap)
      .filter(item => item.Miktar > 0)
      .sort((a, b) => b.Miktar - a.Miktar);
    
    res.json(result);
    
  } catch (error) {
    console.error("Antrepo stok miktarları hesaplama hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/hareketler/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `DELETE FROM antrepo_hareketleri WHERE id = ?`;
    const [result] = await db.query(sql, [id]);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Hareket kaydı bulunamadı.' });
    }
  } catch (error) {
    console.error("DELETE /api/hareketler/:id hatası:", error);
    res.status(500).json({ error: error.message });
  }
});




// GET /api/find-variant?urunId=XX&paketlemeTipi=YY&paketBoyutu=ZZ
router.get('/find-variant', async (req, res) => {
  try {
    const { urunId, paketlemeTipi, paketBoyutu } = req.query;
    
    if (!urunId || !paketlemeTipi || !paketBoyutu) {
      return res.status(400).json({ error: "Eksik parametre: urunId, paketlemeTipi ve paketBoyutu gereklidir" });
    }
    
    // urun_varyantlari tablosunda ilgili varyantı ara
    // Not: Burada description alanı paketleme tipi olarak kullanılıyor
    const sql = `
      SELECT id AS variantId 
      FROM urun_varyantlari 
      WHERE urun_id = ? 
        AND description = ? 
        AND paket_hacmi = ?
      LIMIT 1
    `;
    
    const [rows] = await db.query(sql, [urunId, paketlemeTipi, paketBoyutu]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: "Varyant bulunamadı",
        message: "Bu ürün için belirtilen paketleme tipi ve paket boyutu kombinasyonu mevcut değil"
      });
    }
    
    res.json({ variantId: rows[0].variantId });
  } catch (error) {
    console.error('Varyant bulma hatası:', error);
    res.status(500).json({ error: error.message });
  }
});


// GET /api/stock-card/:productId - Ürün stok kartı bilgilerini getirir
router.get('/stock-card/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // 1. Ürün genel bilgilerini al
    const sqlUrun = `
      SELECT 
        u.id, 
        u.name, 
        u.code, 
        u.paket_hacmi,
        u.description
      FROM urunler u
      WHERE u.id = ?
    `;
    const [urunRows] = await db.query(sqlUrun, [productId]);
    
    if (urunRows.length === 0) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }
    
    const urun = urunRows[0];
    
    // 2. Ürüne ait hareketler ve stok miktarını hesapla
    const sqlStok = `
      SELECT 
        ag.id as giris_id,
        a.antrepoAdi,
        a.id as antrepo_id,
        SUM(CASE WHEN h.islem_tipi = 'Giriş' THEN h.miktar ELSE 0 END) AS giris_miktar,
        SUM(CASE WHEN h.islem_tipi = 'Çıkış' THEN h.miktar ELSE 0 END) AS cikis_miktar,
        SUM(CASE WHEN h.islem_tipi = 'Giriş' THEN h.kap_adeti ELSE 0 END) AS giris_kap,
        SUM(CASE WHEN h.islem_tipi = 'Çıkış' THEN h.kap_adeti ELSE 0 END) AS cikis_kap
      FROM antrepo_hareketleri h
      JOIN antrepo_giris ag ON h.antrepo_giris_id = ag.id
      JOIN antrepolar a ON ag.antrepo_id = a.id
      JOIN urunler u ON ag.urun_kodu = u.code
      WHERE u.id = ?
      GROUP BY a.antrepoAdi, a.id, ag.id
    `;
    
    const [stokRows] = await db.query(sqlStok, [productId]);
    
    // 3. Ürün varyantlarını al
    const sqlVaryant = `
      SELECT 
        uv.id, 
        uv.paket_hacmi, 
        uv.description,
        COUNT(*) as kullanim_sayisi
      FROM urun_varyantlari uv
      LEFT JOIN antrepo_giris ag ON ag.urun_varyant_id = uv.id
      WHERE uv.urun_id = ?
      GROUP BY uv.id, uv.paket_hacmi, uv.description
      ORDER BY uv.id
    `;
    
    const [varyantRows] = await db.query(sqlVaryant, [productId]);
    
    // 4. Stok durumunu hesapla
    const stokDurumu = stokRows.map(row => {
      const netMiktar = parseFloat(row.giris_miktar) - parseFloat(row.cikis_miktar);
      const netKap = parseInt(row.giris_kap) - parseInt(row.cikis_kap);
      
      return {
        antrepo_id: row.antrepo_id,
        antrepo_adi: row.antrepoAdi,
        giris_id: row.giris_id,
        net_miktar: netMiktar.toFixed(2),
        net_kap: netKap,
        stok_durumu: netMiktar > 0 ? 'Mevcut' : 'Tükendi'
      };
    });
    
    // Sonuç objesini oluştur
    const result = {
      urun: urun,
      stok_durumu: stokDurumu,
      toplam_stok: stokDurumu.reduce((sum, item) => sum + parseFloat(item.net_miktar), 0).toFixed(2),
      toplam_kap: stokDurumu.reduce((sum, item) => sum + parseInt(item.net_kap), 0),
      varyantlar: varyantRows
    };
    
    res.json(result);
    
  } catch (error) {
    console.error("GET /api/stock-card/:productId hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

// Düzeltilmiş: /api/urun_varyantlari endpoint'i 
// (paketleme_tipi_id referansı kaldırıldı)
router.get('/urun_varyantlari', async (req, res) => {
  try {
    const { urunId } = req.query;
    if (!urunId) {
      return res.status(400).json({ error: 'urunId parametresi gerekli.' });
    }
    const sql = `
      SELECT
        uv.id,
        uv.urun_id,
        uv.paket_hacmi,
        uv.description AS paketleme_tipi_adi,
        uv.olusturulma_tarihi
      FROM urun_varyantlari uv
      WHERE uv.urun_id = ?
      ORDER BY uv.id DESC
    `;
    const [rows] = await db.query(sql, [urunId]);
    res.json(rows);
  } catch (error) {
    console.error('GET /urun_varyantlari hata:', error);
    res.status(500).json({ error: error.message });
  }
});

// Düzeltilmiş: /api/urun_varyantlari/details endpoint'i
// (paketleme_tipi_id referansı kaldırıldı)
router.get('/urun_varyantlari/details', async (req, res) => {
  try {
    const { urunId } = req.query;
    if (!urunId) {
      return res.status(400).json({ error: 'urunId parametresi gerekli.' });
    }
    const sql = `
      SELECT
        uv.id,
        uv.urun_id,
        uv.paket_hacmi,
        uv.description,
        uv.olusturulma_tarihi,
        uv.guncellenme_tarihi
      FROM urun_varyantlari uv
      WHERE uv.urun_id = ?
    `;
    const [rows] = await db.query(sql, [urunId]);
    res.json(rows);
  } catch (error) {
    console.error('GET /api/urun_varyantlari/details hata:', error);
    res.status(500).json({ error: error.message });
  }
});

// Düzeltilmiş: /api/urun_varyantlari/:id endpoint'i 
// (paketleme_tipi_id referansı kaldırıldı)
router.get('/urun_varyantlari/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        v.id,
        v.urun_id,
        v.paket_hacmi,
        v.description,
        u.name as urun_adi,
        u.code as urun_kodu
      FROM urun_varyantlari v
      LEFT JOIN urunler u ON v.urun_id = u.id
      WHERE v.id = ?
    `;
    const [rows] = await db.query(sql, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Varyant bulunamadı' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Varyant getirme hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Düzeltilmiş: Bu eski endpoint'i de kontrol edelim
router.get('/urun_varyantlari', async (req, res) => {
  try {
    const { urunId, paketlemeTipi } = req.query;
    if (!urunId) {
      return res.status(400).json({ error: 'urunId parametresi gerekli.' });
    }

    // Paketleme tiplerini döndür (paketlemeTipi parametresi boşsa)
    if (!paketlemeTipi) {
      const sqlTips = `
        SELECT DISTINCT 
          uv.id,
          uv.description as paketleme_tipi_name
        FROM urun_varyantlari uv
        WHERE uv.urun_id = ?
      `;
      const [rows] = await db.query(sqlTips, [urunId]);
      return res.json(rows);
    }

    // Paket boyutlarını döndür
    const sqlBoyut = `
      SELECT DISTINCT paket_hacmi
      FROM urun_varyantlari
      WHERE urun_id = ? AND description = ?
    `;
    const [rows] = await db.query(sqlBoyut, [urunId, paketlemeTipi]);
    if (!rows.length) {
      return res.status(404).json({ error: 'Varyant bulunamadı.' });
    }
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Düzeltilmiş: /api/find-variant endpoint'i
router.get('/find-variant', async (req, res) => {
  try {
    const { urunId, paketlemeTipi, paketBoyutu } = req.query;
    
    if (!urunId || !paketlemeTipi || !paketBoyutu) {
      return res.status(400).json({ error: "Eksik parametre: urunId, paketlemeTipi ve paketBoyutu gereklidir" });
    }
    
    // urun_varyantlari tablosunda ilgili varyantı ara
    // description alanı paketleme tipi olarak kullanılıyor
    const sql = `
      SELECT id AS variantId 
      FROM urun_varyantlari 
      WHERE urun_id = ? 
        AND description = ? 
        AND paket_hacmi = ?
      LIMIT 1
    `;
    
    const [rows] = await db.query(sql, [urunId, paketlemeTipi, paketBoyutu]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: "Varyant bulunamadı",
        message: "Bu ürün için belirtilen paketleme tipi ve paket boyutu kombinasyonu mevcut değil"
      });
    }
    
    res.json({ variantId: rows[0].variantId });
  } catch (error) {
    console.error('Varyant bulma hatası:', error);
    res.status(500).json({ error: error.message });
  }
});


// GET /api/product-movements/:productId - Ürün ID'sine göre ilgili hareketleri getirir
router.get('/product-movements/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Önce ürünün kodunu bul
    const [productRows] = await db.query('SELECT code FROM urunler WHERE id = ?', [productId]);
    
    if (productRows.length === 0) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }
    
    const productCode = productRows[0].code;
    
    // Bu ürün koduna bağlı tüm antrepo_giris kayıtlarını bul
    const [girisRows] = await db.query('SELECT id FROM antrepo_giris WHERE urun_kodu = ?', [productCode]);
    
    if (girisRows.length === 0) {
      return res.json([]); // Bu ürün için kayıt bulunamadı
    }
    
    // Tüm antrepo_giris ID'lerini al
    const girisIds = girisRows.map(row => row.id);
    
    // Bu ID'lere bağlı tüm hareketleri getir
    const sqlHareketler = `
      SELECT
        h.*,
        a.antrepoAdi as antrepo_adi,
        b.birim_adi,
        ag.beyanname_no as beyanname_no
      FROM antrepo_hareketleri h
      LEFT JOIN antrepo_giris ag ON h.antrepo_giris_id = ag.id
      LEFT JOIN antrepolar a ON ag.antrepo_id = a.id
      LEFT JOIN birimler b ON h.birim_id = b.id
      WHERE h.antrepo_giris_id IN (?)
      ORDER BY h.islem_tarihi DESC, h.created_at DESC
    `;
    
    const [movementRows] = await db.query(sqlHareketler, [girisIds]);
    
    res.json(movementRows);
  } catch (error) {
    console.error("GET /api/product-movements/:productId hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

// Yeni endpoint: Varyantları stok bilgileriyle birlikte getir
router.get('/urun-varyantlari/with-stock/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // 1. Önce ürünün varyantlarını çekelim
    const sqlVaryants = `
      SELECT 
        uv.id,
        uv.urun_id,
        uv.paket_hacmi,
        uv.description,
        u.name as urun_adi,
        u.code as urun_kodu
      FROM urun_varyantlari uv
      LEFT JOIN urunler u ON uv.urun_id = u.id
      WHERE uv.urun_id = ?
      ORDER BY uv.id
    `;
    
    const [varyantRows] = await db.query(sqlVaryants, [productId]);
    
    if (varyantRows.length === 0) {
      return res.json([]); // Bu ürün için varyant yoksa boş dizi dön
    }
    
    // 2. Her varyant için stok bilgisini hesaplayalım
    for (const varyant of varyantRows) {
      // Bu varyanta ait antrepo giriş kayıtlarını bul
      const sqlStok = `
        SELECT 
          SUM(CASE WHEN h.islem_tipi = 'Giriş' THEN h.miktar ELSE -h.miktar END) as mevcut_stok
        FROM antrepo_hareketleri h
        JOIN antrepo_giris ag ON h.antrepo_giris_id = ag.id
        WHERE ag.urun_varyant_id = ?
      `;
      
      const [stokRows] = await db.query(sqlStok, [varyant.id]);
      
      // Stok verisini varyant nesnesine ekle
      varyant.mevcut_stok = stokRows[0]?.mevcut_stok || 0;
    }
    
    res.json(varyantRows);
  } catch (error) {
    console.error('GET /urun-varyantlari/with-stock/:productId hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/antrepolar/:antrepoId/hareketler - Belirli bir antrepoya ait tüm hareketleri listeler
router.get('/antrepo/:antrepoId/hareketler', async (req, res) => {
  try {
    const { antrepoId } = req.params;

    // Antrepo ID'ye ait tüm antrepo_giris kayıtlarını bulup,
    // antrepo_hareketleri tablosuyla join yaparak hareketleri alıyoruz
    const sql = `
      SELECT 
        h.id AS hareketId,
        h.antrepo_giris_id,
        h.islem_tarihi,
        h.islem_tipi,
        h.miktar,
        h.kap_adeti,
        h.aciklama,
        h.brut_agirlik,
        h.net_agirlik,
        h.created_at,
        h.updated_at,
        ag.beyanname_no AS form_no,
        ag.urun_tanimi,
        ag.urun_kodu,
        b.birim_adi
      FROM antrepo_hareketleri h
      JOIN antrepo_giris ag ON h.antrepo_giris_id = ag.id
      LEFT JOIN birimler b ON h.birim_id = b.id
      WHERE ag.antrepo_id = ?
      ORDER BY h.islem_tarihi DESC, h.created_at DESC
    `;
    
    const [rows] = await db.query(sql, [antrepoId]);
    res.json(rows);
  } catch (error) {
    console.error("GET /api/antrepo/:antrepoId/hareketler error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/antrepolar/:antrepoId/hareketler - Belirli bir antrepoya ait tüm hareketleri listeler
router.get('/antrepolar/:antrepoId/hareketler', async (req, res) => {
  try {
    const { antrepoId } = req.params;

    // Antrepo ID'ye ait tüm antrepo_giris kayıtlarını bulup,
    // antrepo_hareketleri tablosuyla join yaparak hareketleri alıyoruz
    const sql = `
      SELECT 
        h.id AS hareketId,
        h.antrepo_giris_id,
        h.islem_tarihi,
        h.islem_tipi,
        h.miktar,
        h.kap_adeti,
        h.aciklama,
        h.brut_agirlik,
        h.net_agirlik,
        h.created_at,
        h.updated_at,
        ag.beyanname_no AS form_no,
        ag.urun_tanimi,
        ag.urun_kodu,
        b.birim_adi
      FROM antrepo_hareketleri h
      JOIN antrepo_giris ag ON h.antrepo_giris_id = ag.id
      LEFT JOIN birimler b ON h.birim_id = b.id
      WHERE ag.antrepo_id = ?
      ORDER BY h.islem_tarihi DESC, h.created_at DESC
    `;
    
    const [rows] = await db.query(sql, [antrepoId]);
    res.json(rows);
  } catch (error) {
    console.error("GET /api/antrepolar/:antrepoId/hareketler error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/antrepolar/:antrepoId/stats - Antrepo istatistiklerini döndürür (stok, kap adedi, açık form sayısı)
router.get('/antrepolar/:antrepoId/stats', async (req, res) => {
  try {
    const { antrepoId } = req.params;
    
    // Giriş-çıkış farklarını hesaplayan sorgu
    const sql = `
      SELECT 
        ag.antrepo_giris_id,
        SUM(CASE WHEN ag.islem_tipi = 'Giriş' THEN ag.miktar ELSE -ag.miktar END) AS currentStock,
        SUM(CASE WHEN ag.islem_tipi = 'Giriş' THEN ag.kap_adeti ELSE -ag.kap_adeti END) AS currentKap
      FROM antrepo_hareketleri ag
      JOIN antrepo_giris g ON ag.antrepo_giris_id = g.id
      WHERE g.antrepo_id = ?
      GROUP BY ag.antrepo_giris_id
    `;
    
    const [rows] = await db.query(sql, [antrepoId]);
    
    // Toplam değerleri hesaplama
    let totalStock = 0, totalKap = 0, openFormsCount = 0;
    
    rows.forEach(row => {
      // Pozitif stoku olan kayıtlar için açık form sayısını artır
      if (parseFloat(row.currentStock) > 0) {
        openFormsCount++;
      }
      
      // Toplam stok ve kap adedi için değerleri topla
      totalStock += parseFloat(row.currentStock || 0);
      totalKap += parseInt(row.currentKap || 0);
    });
    
    // Antrepo kapasitesi bilgisini getir (eğer gösterilecekse)
    const [antrepoRows] = await db.query('SELECT kapasite FROM antrepolar WHERE id = ?', [antrepoId]);
    const kapasite = antrepoRows.length > 0 ? antrepoRows[0].kapasite : null;
    
    res.json({
      totalStock: parseFloat(totalStock.toFixed(2)),  // Ton (MT)
      totalKap,                                       // Kap adedi
      openFormsCount,                                 // Açık form sayısı
      kapasite: kapasite ? parseFloat(kapasite) : null // Toplam kapasite (varsa)
    });
  } catch (error) {
    console.error("GET /api/antrepolar/:antrepoId/stats error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Dashboard istatistikleri için endpoint
/*router.get('/dashboard-stats', async (req, res) => {
  try {
    // 1. Tüm Antrepolar Toplam Stok
    const [stockRows] = await db.query(`
      SELECT 
        SUM(CASE WHEN islem_tipi = 'Giriş' THEN miktar ELSE -miktar END) AS totalStock
      FROM antrepo_hareketleri
    `);
    const totalStock = stockRows[0]?.totalStock || 0;

    // 2. Tüm Antrepolar Toplam Kap Adeti
    const [kapRows] = await db.query(`
      SELECT 
        SUM(CASE WHEN islem_tipi = 'Giriş' THEN kap_adeti ELSE -kap_adeti END) AS totalKap
      FROM antrepo_hareketleri
    `);
    const totalKap = kapRows[0]?.totalKap || 0;

    // 3. Giriş Formları Gün Maliyeti
    const [dailyCostRows] = await db.query(`
      SELECT SUM(fatura_meblagi / NULLIF(depolama_suresi, 0)) AS dailyCost
      FROM antrepo_giris
      WHERE depolama_suresi > 0
    `);
    const dailyCost = dailyCostRows[0]?.dailyCost || 0;

    // 4. Giriş Formları Toplam Maliyeti
    const [totalCostRows] = await db.query(`
      SELECT SUM(fatura_meblagi) AS totalCost
      FROM antrepo_giris
    `);
    const totalCost = totalCostRows[0]?.totalCost || 0;

    // 5. Aktif Giriş Formu Adeti
    const [activeFormRows] = await db.query(`
      SELECT COUNT(*) AS activeFormCount
      FROM (
        SELECT ag.id, 
          SUM(CASE WHEN h.islem_tipi = 'Giriş' THEN h.miktar ELSE -h.miktar END) AS netStock
        FROM antrepo_giris ag
        LEFT JOIN antrepo_hareketleri h ON ag.id = h.antrepo_giris_id
        GROUP BY ag.id
        HAVING netStock > 0
      ) AS activeForms
    `);
    const activeFormCount = activeFormRows[0]?.activeFormCount || 0;

    // 6. Antrepodaki Ürün Kalemi Sayısı
    const [varietyRows] = await db.query(`
      SELECT COUNT(DISTINCT urun_id) AS productVarietyCount
      FROM antrepo_giris
      WHERE urun_id IS NOT NULL
    `);
    const productVarietyCount = varietyRows[0]?.productVarietyCount || 0;

    // Grafik verileri için aylık veriler
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran"];
    
    // Aylık envanter taşıma maliyeti
    const [inventoryCostRows] = await db.query(`
      SELECT 
        MONTH(tarih) as month,
        SUM(fatura_meblagi) as monthlyTotal
      FROM antrepo_giris
      WHERE tarih >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
      GROUP BY MONTH(tarih)
      ORDER BY MONTH(tarih)
    `);
    
    // Yanıtı oluştur
    res.json({
      totalStock,
      totalKap,
      dailyCost,
      totalCost,
      activeFormCount,
      productVarietyCount,
      charts: {
        inventoryCost: {
          labels: months,
          values: [75000, 82000, 95000, 88000, 102000, 110000] // Gerçek projede DB verilerinden oluşturulacak
        },
        turnoverRatio: {
          labels: months,
          values: [2.1, 2.3, 2.5, 2.2, 2.6, 2.8] // Gerçek projede hesaplanacak
        },
        salesRatio: {
          labels: months,
          values: [0.65, 0.70, 0.72, 0.68, 0.74, 0.78] // Gerçek projede hesaplanacak
        }
      }
    });
  } catch (error) {
    console.error("GET /dashboard-stats hatası:", error);
    res.status(500).json({ error: error.message });
  }
});*/


module.exports = router;
