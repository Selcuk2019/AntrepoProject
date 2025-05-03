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
        ag.paketleme_tipi,  -- Artık ID yerine bu metin sütununu alıyoruz
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
        ag.urun_varyant_id,
        ag.description,
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
    console.log(`Antrepo giriş ID=${id} için veri istendi`);
    
    // Ana kaydı çek
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
        ag.paketleme_tipi,
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
        ag.description,
        uv.description AS varyant_description,
        DATE_FORMAT(ag.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
        DATE_FORMAT(ag.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
      FROM antrepo_giris ag
      LEFT JOIN antrepolar a ON ag.antrepo_id = a.id
      LEFT JOIN urun_varyantlari uv ON ag.urun_varyant_id = uv.id
      WHERE ag.id = ?
    `;
    
    const [rows] = await db.query(sql, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Antrepo giriş kaydı bulunamadı.' });
    }
    
    // Ürün satırlarını ayrı sorgu ile çek - veritabanı yapısına göre güncellendi
    const sqlUrunler = `
      SELECT 
        agu.id,
        agu.antrepo_giris_id,
        agu.urun_id,
        u.name AS urunTanimi, 
        u.code AS urunKodu,
        agu.gtip_no AS gtipNo,
        agu.paketleme_tipi AS paketlemeTipi,
        agu.paket_boyutu AS paketBoyutu,
        agu.birim_fiyat AS birimFiyat,
        agu.miktar,
        agu.kap_adeti AS kapAdeti,
        agu.brut_agirlik AS brutAgirlik,
        agu.net_agirlik AS netAgirlik,
        DATE_FORMAT(agu.antrepo_giris_tarihi, '%Y-%m-%d') AS antrepoGirisTarihi
      FROM antrepo_giris_urunler agu
      LEFT JOIN urunler u ON agu.urun_id = u.id
      WHERE agu.antrepo_giris_id = ?
    `;
    
    const [urunRows] = await db.query(sqlUrunler, [id]);
    console.log(`ID=${id} için ${urunRows.length} adet ürün satırı bulundu`);
    
    // Ana veri ile ürün satırlarını birleştir
    const result = rows[0];
    result.urunler = urunRows;
    
    res.json(result);
  } catch (error) {
    console.error("GET /antrepo-giris/:id hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/maliyet-analizi', async (req, res) => {
  try {
    // Filtre parametreleri
    const { antrepoId, baslangicTarih, bitisTarih } = req.query;
    
    // Filtre koşulları oluştur
    let filterCondition = '';
    let filterParams = [];
    
    if (antrepoId) {
      filterCondition += ' AND ag.antrepo_id = ?';
      filterParams.push(antrepoId);
    }
    
    if (baslangicTarih) {
      filterCondition += ' AND ag.antrepo_giris_tarihi >= ?';
      filterParams.push(baslangicTarih);
    }
    
    if (bitisTarih) {
      filterCondition += ' AND ag.antrepo_giris_tarihi <= ?';
      filterParams.push(bitisTarih);
    }
    
    // Beyanname bazlı özet bilgileri çek - çoklu ürün desteği eklendi
    const sqlGiris = `
      SELECT 
        ag.id,
        ag.beyanname_no,
        a.antrepoAdi AS antrepoName,
        ag.para_birimi,
        pb.iso_kodu as para_birimi_kodu,
        pb.sembol as para_birimi_sembol,
        ag.antrepo_giris_tarihi,
        ag.fatura_aciklama,
        COUNT(DISTINCT agu.urun_id) as urun_cesidi_sayisi,
        SUM(agu.miktar) as toplam_miktar,
        SUM(agu.kap_adeti) as toplam_kap_adeti
      FROM antrepo_giris ag
      LEFT JOIN antrepo_giris_urunler agu ON ag.id = agu.antrepo_giris_id
      LEFT JOIN antrepolar a ON ag.antrepo_id = a.id
      LEFT JOIN para_birimleri pb ON ag.para_birimi = pb.id
      WHERE 1=1 ${filterCondition}
      GROUP BY ag.id, ag.beyanname_no, ag.antrepo_giris_tarihi
      ORDER BY ag.antrepo_giris_tarihi DESC
      LIMIT 1000
    `;
    
    const [results] = await db.query(sqlGiris, filterParams);
    
    // Her beyanname için ilave maliyet ve stok hesaplamaları yap
    const finalResults = await Promise.all(results.map(async (row) => {
      try {
        // Hesaplama motorundan güncel maliyet bilgisini al
        const costData = await fetchCostCalculationForEntry(row.id);
        
        // Kalan stok miktarını hesapla
        const [stockData] = await db.query(`
          SELECT 
            SUM(CASE WHEN islem_tipi = 'Giriş' THEN miktar ELSE -miktar END) as kalan_stok
          FROM antrepo_hareketleri
          WHERE antrepo_giris_id = ?
        `, [row.id]);
        
        // Sonuç objesini zenginleştir
        return {
          ...row,
          currentStock: stockData[0]?.kalan_stok || 0,
          currentCost: costData.currentCost,
          totalCost: costData.totalCost,
          unitCostImpact: costData.unitCostImpact,
          currency: row.para_birimi_kodu || 'USD',
          currencySymbol: row.para_birimi_sembol
        };
      } catch (error) {
        console.error(`Maliyet hesaplama hatası (ID: ${row.id}):`, error);
        return row;
      }
    }));
    
    res.json(finalResults);
  } catch (error) {
    console.error("GET /api/maliyet-analizi hatası:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Yardımcı fonksiyon: Belirtilen giriş ID'si için hesaplama motorundan maliyet verilerini al
async function fetchCostCalculationForEntry(girisId) {
  try {
    const response = await fetch(`http://localhost:3002/api/cost-calculation/${girisId}`);
    
    if (!response.ok) {
      throw new Error(`Hesaplama motoru yanıt hatası: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      currentCost: data.dailyBreakdown && data.dailyBreakdown.length > 0 
        ? parseFloat(data.dailyBreakdown[data.dailyBreakdown.length - 1].dailyTotal) || 0 
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
    const viewMode = req.query.viewMode || 'beyanname'; // 'beyanname' veya 'product'
    
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
      return res.status(404).json({ error: "Antrepo giriş kaydı bulunamadı" });
    }

    // 2. Ürün satırlarını al (yeni eklenen)
    const sqlUrunler = `
      SELECT 
        agu.*,
        u.name as urun_adi,
        u.code as urun_kodu
      FROM antrepo_giris_urunler agu
      LEFT JOIN urunler u ON agu.urun_id = u.id
      WHERE agu.antrepo_giris_id = ?
    `;
    const [urunSatirlari] = await db.query(sqlUrunler, [girisId]);

    // 3. Tüm hareketleri getir (islem_tarihi için aynı dönüşüm)
    const sqlHareketler = `
      SELECT 
        DATE_FORMAT(islem_tarihi, '%Y-%m-%dT%H:%i:%s%z') AS islem_tarihi,
        islem_tipi,
        miktar,
        urun_id,
        created_at
      FROM antrepo_hareketleri
      WHERE antrepo_giris_id = ?
      ORDER BY islem_tarihi ASC, created_at ASC
    `;
    const [hareketler] = await db.query(sqlHareketler, [girisId]);

    // 4. Ek hizmetleri getir - Güncellenmiş SQL sorgusu
    const sqlEkHizmetler = `
      SELECT 
        DATE_FORMAT(agh.ek_hizmet_tarihi, '%Y-%m-%d') AS ek_hizmet_tarihi,
        agh.toplam,
        h.hizmet_adi,
        pb.iso_kodu as para_birimi,
        agh.aciklama,
        agh.urun_id,
        agh.applies_to_all
      FROM antrepo_giris_hizmetler agh
      LEFT JOIN hizmetler h ON agh.hizmet_id = h.id
      LEFT JOIN para_birimleri pb ON agh.para_birimi_id = pb.id
      WHERE agh.antrepo_giris_id = ?
      ORDER BY agh.ek_hizmet_tarihi ASC
    `;
    const [ekHizmetler] = await db.query(sqlEkHizmetler, [girisId]);

    // 5. Tarih aralığını belirle
    const ilkGiris = hareketler.find(h => h.islem_tipi === 'Giriş');
    if (!ilkGiris) {
      return res.status(400).json({ error: "İlk giriş hareketi bulunamadı" });
    }

    // DÜZELTME: Başlangıç tarihini bir gün ileri al
    const baslangicTarihi = dayjs(ilkGiris.islem_tarihi)
      .add(1, 'day')
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

    // Yardımcı fonksiyon tanımları
    function hesaplaArdiye(kalanStok, gunSayisi, sozlesmeParams) {
      // ...existing code...
    }

    function hesaplaStok(tarih, hareketler, urunId = null) {
      // Eğer urunId belirtilmişse, sadece o ürüne ait hareketleri filtrele
      const filteredHareketler = urunId ? 
        hareketler.filter(h => h.urun_id === urunId) : 
        hareketler;
      
      let stok = 0;
      filteredHareketler.forEach(hareket => {
        const hareketTarihi = new Date(hareket.islem_tarihi);
        if (hareketTarihi <= tarih) {
          if (hareket.islem_tipi === 'Giriş') {
            stok += parseFloat(hareket.miktar);
          } else if (hareket.islem_tipi === 'Çıkış') {
            stok -= parseFloat(hareket.miktar);
          }
        }
      });
      return Math.max(0, stok); // Negatif stok olamaz
    }

    // Belirli bir tarihe kadar ilgili ürüne ait ek hizmetlerin maliyetini hesapla
    function hesaplaEkHizmetMaliyeti(tarih, ekHizmetler, urunId = null) {
      let maliyet = 0;
      const tarihString = tarih.toISOString().split('T')[0];

      ekHizmetler.forEach(hizmet => {
        // Tarihten önce verilen hizmetleri hesapla
        if (hizmet.ek_hizmet_tarihi <= tarihString) {
          // Ürün bazlı filtreleme:
          // 1. Eğer urunId belirtilmişse ve hizmet tüm ürünlere uygulanıyorsa, 
          //    toplam ürün sayısına göre oranla
          if (urunId && hizmet.applies_to_all) {
            const urunSayisi = new Set(urunSatirlari.map(u => u.urun_id)).size || 1;
            maliyet += parseFloat(hizmet.toplam) / urunSayisi;
          }
          // 2. Eğer urunId belirtilmişse ve hizmet belirli bir ürüne aitse, 
          //    sadece o ürün için hesapla
          else if (urunId && hizmet.urun_id === urunId) {
            maliyet += parseFloat(hizmet.toplam);
          }
          // 3. Eğer urunId belirtilmemişse ve beyanname bazlı bakıyorsak,
          //    tüm hizmetleri topla
          else if (!urunId) {
            maliyet += parseFloat(hizmet.toplam);
          }
        }
      });

      return maliyet;
    }

    let result;

    // View Mode'a göre sonuç hesaplama
    if (viewMode === 'product' && urunSatirlari && urunSatirlari.length > 0) {
      // Ürün bazlı hesaplama
      const productResults = [];
      
      // Her ürün için ayrı hesaplama yap
      for (const urun of urunSatirlari) {
        const urunId = urun.urun_id;
        const dailyBreakdown = [];
        let currentDate = new Date(baslangicTarihi);
        let dayCounter = 1;
        let cumulativeCost = 0;
        
        // Döngüyü bugünü de kapsayacak şekilde çalıştır
        while (currentDate <= todayEnd) {
          try {
            // Bu üründen kalan stok miktarını hesapla
            const kalanStok = hesaplaStok(currentDate, hareketler, urunId);
            
            // Eğer stok varsa ardiye hesapla
            let gunlukArdiye = 0;
            if (kalanStok > 0) {
              gunlukArdiye = hesaplaArdiye(kalanStok, dayCounter, sozlesmeParams);
            }
            
            // O güne kadar olan ek hizmet maliyetlerini hesapla (sadece bu ürün için)
            const gunlukEkHizmet = hesaplaEkHizmetMaliyeti(currentDate, ekHizmetler, urunId);
            
            // Toplam günlük maliyet
            const gunlukToplam = gunlukArdiye + gunlukEkHizmet;
            cumulativeCost += gunlukToplam;
            
            dailyBreakdown.push({
              date: currentDate.toISOString().split('T')[0],
              day: dayCounter,
              remainingStock: kalanStok,
              storageCost: parseFloat(gunlukArdiye.toFixed(2)),
              servicesCost: parseFloat(gunlukEkHizmet.toFixed(2)),
              dayTotal: parseFloat(gunlukToplam.toFixed(2)),
              cumulativeTotal: parseFloat(cumulativeCost.toFixed(2))
            });
            
            // Sonraki güne geç
            currentDate = new Date(currentDate);
            currentDate.setDate(currentDate.getDate() + 1);
            dayCounter++;
          } catch (err) {
            console.error(`Gün ${dayCounter} hesaplama hatası:`, err);
            currentDate = new Date(currentDate);
            currentDate.setDate(currentDate.getDate() + 1);
            dayCounter++;
          }
        }
        
        productResults.push({
          urunId: urunId,
          urunAdi: urun.urun_adi,
          urunKodu: urun.urun_kodu,
          dailyBreakdown,
          totalCost: parseFloat(cumulativeCost.toFixed(2)),
          currentStock: parseFloat(hesaplaStok(now, hareketler, urunId).toFixed(2))
        });
      }
      
      result = {
        viewMode: 'product',
        antrepoGiris: antrepoGiris[0],
        products: productResults,
        firstDate: baslangicTarihi.toISOString().split('T')[0],
        lastDate: now.toISOString().split('T')[0]
      };
      
    } else {
      // Beyanname bazlı hesaplama (mevcut mantık)
      const dailyBreakdown = [];
      let currentDate = new Date(baslangicTarihi);
      let dayCounter = 1;
      let cumulativeCost = 0;

      const todayStr = now.toISOString().split('T')[0];

      // Döngüyü bugünü de kapsayacak şekilde çalıştır
      while (currentDate <= todayEnd) {
        try {
          // Kalan stok miktarını hesapla
          const kalanStok = hesaplaStok(currentDate, hareketler);
          
          // Eğer stok varsa ardiye hesapla
          let gunlukArdiye = 0;
          if (kalanStok > 0) {
            gunlukArdiye = hesaplaArdiye(kalanStok, dayCounter, sozlesmeParams);
          }
          
          // O güne kadar olan ek hizmet maliyetlerini hesapla
          const gunlukEkHizmet = hesaplaEkHizmetMaliyeti(currentDate, ekHizmetler);
          
          // Toplam günlük maliyet
          const gunlukToplam = gunlukArdiye + gunlukEkHizmet;
          cumulativeCost += gunlukToplam;
          
          dailyBreakdown.push({
            date: currentDate.toISOString().split('T')[0],
            day: dayCounter,
            remainingStock: kalanStok,
            storageCost: parseFloat(gunlukArdiye.toFixed(2)),
            servicesCost: parseFloat(gunlukEkHizmet.toFixed(2)),
            dayTotal: parseFloat(gunlukToplam.toFixed(2)),
            cumulativeTotal: parseFloat(cumulativeCost.toFixed(2))
          });
          
          // Sonraki güne geç
          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 1);
          dayCounter++;
        } catch (err) {
          console.error(`Gün ${dayCounter} hesaplama hatası:`, err);
          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 1);
          dayCounter++;
        }
      }

      result = {
        viewMode: 'beyanname',
        antrepoGiris: antrepoGiris[0],
        dailyBreakdown,
        totalCost: parseFloat(cumulativeCost.toFixed(2)),
        firstDate: baslangicTarihi.toISOString().split('T')[0],
        lastDate: now.toISOString().split('T')[0],
        currentStock: parseFloat(hesaplaStok(now, hareketler).toFixed(2))
      };
    }

    res.json(result);

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
    // Form verilerini al
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
      paketleme_tipi_id,
      description,
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
      urun_varyant_id,
      urunler // Yeni eklenen ürün satırları
    } = req.body;

    // Ana kaydı oluştur
    const insertQuery = `
      INSERT INTO antrepo_giris (
        beyanname_form_tarihi, beyanname_no, antrepo_sirket_adi, sozlesme_id, 
        gumruk, antrepo_id, antrepo_kodu, adres, sehir,
        urun_tanimi, urun_kodu, paket_boyutu, description, 
        miktar, kap_adeti, brut_agirlik, net_agirlik, antrepo_giris_tarihi,
        gonderici_sirket, alici_sirket, proforma_no, proforma_tarihi,
        ticari_fatura_no, ticari_fatura_tarihi, depolama_suresi, fatura_meblagi, 
        urun_birim_fiyat, para_birimi, fatura_aciklama, 
        urun_varyant_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const result = await db.query(insertQuery, [
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
      description || null,
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
      urun_varyant_id || null
    ]);

    const insertId = result.insertId;
    
    // Ürün satırlarını kaydetme kontrolü
    if (req.body.urunler && Array.isArray(req.body.urunler) && req.body.urunler.length > 0) {
      console.log(`${req.body.urunler.length} adet ürün satırı kaydedilecek`);
      
      try {
        for (const urun of req.body.urunler) {
          const urunInsertQuery = `
            INSERT INTO antrepo_giris_urunler ( 
              antrepo_giris_id, urun_id, 
              gtip_no, paketleme_tipi, paket_boyutu, birim_fiyat,
              miktar, kap_adeti, brut_agirlik, net_agirlik,
              antrepo_giris_tarihi
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
          `;
          
          await db.query(urunInsertQuery, [
            insertId, 
            urun.urunId || null,
            urun.gtipNo || null,
            urun.paketlemeTipi || null,
            urun.paketBoyutu || null,
            urun.birimFiyat || null,
            urun.miktar || null,
            urun.kapAdeti || null,
            urun.brutAgirlik || null,
            urun.netAgirlik || null,
            urun.antrepoGirisTarihi || null // Frontend'den gelen 'antrepoGirisTarihi' alanı
          ]);
        }
        
        console.log("Ürün satırları başarıyla kaydedildi");
      } catch (error) {
        console.error("Ürün satırları kaydedilirken hata:", error);
        // Hata oluşsa bile ana kayıt işlemini etkilememesi için sadece log'luyoruz
      }
    }

    return res.json({
      success: true,
      message: 'Antrepo giriş kaydı başarıyla oluşturuldu.',
      data: { id: insertId }
    });
  } catch (error) {
    console.error('Antrepo giriş kaydı oluşturulurken hata:', error);
    return res.status(500).json({
      success: false,
      message: 'Kayıt oluşturulurken bir hata oluştu.',
      error: error.message
    });
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


// PUT /api/antrepo-giris/:girisId/urunler/:urunRowId - Belirli bir ürün satırını güncelle
router.put('/antrepo-giris/:girisId/urunler/:urunRowId', async (req, res) => {
  try {
    const { girisId, urunRowId } = req.params;
    const {
      urunId, urunTanimi, urunKodu, gtipNo, paketlemeTipi,
      paketBoyutu, birimFiyat, miktar, kapAdeti,
      brutAgirlik, netAgirlik, antrepoGirisTarihi
    } = req.body;

    // Veri doğrulama
    if (!urunId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ürün ID zorunludur' 
      });
    }

    // Güncelleme için SQL sorgusu
    const sql = `
      UPDATE antrepo_giris_urunler SET
        urun_id = ?,
        gtip_no = ?,
        paketleme_tipi = ?,
        paket_boyutu = ?,
        birim_fiyat = ?,
        miktar = ?,
        kap_adeti = ?,
        brut_agirlik = ?,
        net_agirlik = ?,
        antrepo_giris_tarihi = ?,
        updated_at = NOW()
      WHERE id = ? AND antrepo_giris_id = ?
    `;

    const params = [
      urunId,
      gtipNo,
      paketlemeTipi,
      paketBoyutu,
      birimFiyat,
      miktar,
      kapAdeti,
      brutAgirlik,
      netAgirlik,
      antrepoGirisTarihi,
      urunRowId,
      girisId
    ];

    const [result] = await db.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Güncellenecek ürün satırı bulunamadı' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Ürün satırı başarıyla güncellendi',
      urunRowId
    });
  } catch (error) {
    console.error('Ürün satırı güncelleme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ürün satırı güncellenirken bir hata oluştu', 
      error: error.message 
    });
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
      description,
      urun_id,
      urun_varyant_id
    } = req.body;
    
    // Zorunlu alan kontrolü
    if (!islem_tarihi || !miktar) {
      return res.status(400).json({ success: false, message: "Tarih ve miktar zorunludur!" });
    }
    
    // urun_bilgisi alanını SQL'den kaldırıyoruz, çünkü bu alan tabloda yok
    const sql = `
      INSERT INTO antrepo_hareketleri
      (antrepo_giris_id, islem_tarihi, islem_tipi, miktar, kap_adeti, brut_agirlik, net_agirlik, birim_id, paket_hacmi, aciklama, description, urun_id, urun_varyant_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      description || "",
      urun_id || null,
      urun_varyant_id || null
    ];
    
    const [result] = await db.query(sql, params);
    res.json({ success: true, insertedId: result.insertId });
  } catch (error) {
    console.error("POST /antrepo-giris/:girisId/hareketler hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /antrepo-giris/:girisId/hareketler - Ayrıca bu endpoint içerisinde sorguları güncelleyelim
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
        h.description,
        h.urun_id,
        u.name as urun_adi,
        u.code as urun_kodu,
        b.birim_adi
      FROM antrepo_hareketleri h
      LEFT JOIN urunler u ON h.urun_id = u.id
      LEFT JOIN birimler b ON h.birim_id = b.id
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


// POST /api/antrepo-giris/:girisId/ek-hizmetler
router.post('/antrepo-giris/:girisId/ek-hizmetler', async (req, res) => {
  try {
    const { girisId } = req.params;
    const {
      hizmet_id, hizmet_adi, hizmet_kodu, ucret_modeli, birim, para_birimi_id,
      temel_ucret, carpan, adet, toplam, aciklama, ek_hizmet_tarihi,
      // Yeni eklenen ürün ilişkilendirme alanları
      urun_id, applies_to_all
    } = req.body;
    
    // Ürün bilgisi oluşturma
    let urun_bilgisi = null;
    if (urun_id && !applies_to_all) {
      // Ürün bilgisini veritabanından çek
      const [urunRows] = await db.query('SELECT name, code FROM urunler WHERE id = ?', [urun_id]);
      if (urunRows.length > 0) {
        urun_bilgisi = `${urunRows[0].name} (${urunRows[0].code})`;
      }
    }
    
    const sql = `
      INSERT INTO antrepo_giris_hizmetler 
        (antrepo_giris_id, hizmet_id, hizmet_adi, hizmet_kodu, ucret_modeli, birim, 
        para_birimi_id, temel_ucret, carpan, adet, toplam, aciklama, ek_hizmet_tarihi,
        urun_id, applies_to_all, urun_bilgisi, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const values = [
      girisId, hizmet_id, hizmet_adi, hizmet_kodu, ucret_modeli, birim,
      para_birimi_id, temel_ucret, carpan, adet, toplam, aciklama, ek_hizmet_tarihi,
      urun_id, applies_to_all ? 1 : 0, urun_bilgisi, // Yeni eklenen değerler
    ];
    
    const [result] = await db.query(sql, values);
    
    if (result.affectedRows > 0) {
      res.json({ success: true, insertId: result.insertId });
    } else {
      res.status(400).json({ success: false, message: "Ek hizmet eklenemedi" });
    }
  } catch (error) {
    console.error("Ek hizmet ekleme hatası:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/urun - Ürün ve Varyant ekleme endpoint'i
router.post('/urun', async (req, res) => {
  const { product, variant } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Zorunlu alan kontrolleri
    if (!variant || !variant.paket_hacmi) {
      throw new Error("Paket hacmi zorunludur.");
    }
    if (!variant || !variant.description) {
      throw new Error("Paketleme tipi zorunludur.");
    }

    // 2. Paketleme tipi ID'sini bul
    const [tipRows] = await conn.query(
      'SELECT id FROM paketleme_tipleri WHERE name = ?',
      [variant.description]
    );
    if (!tipRows.length) {
      throw new Error(`Geçersiz paketleme tipi: ${variant.description}`);
    }
    const paketlemeTipiId = tipRows[0].id;

    // 3. Ürünü ekle
    const sqlProduct = `
      INSERT INTO urunler (name, code, paket_hacmi, paketleme_tipi_id, description)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [productResult] = await conn.query(sqlProduct, [
      product.name,
      product.code,
      variant.paket_hacmi,
      paketlemeTipiId,
      product.description || null
    ]);
    const urunId = productResult.insertId;

    // 4. Varyantı urun_varyantlari tablosuna ekle (Yorum kaldırıldı ve düzeltildi)
    if (variant && variant.paket_hacmi && paketlemeTipiId) {
      const sqlVariant = `
        INSERT INTO urun_varyantlari 
        (urun_id, paket_hacmi, description) -- paketleme_tipi_id yerine description kullanılıyor
        VALUES (?, ?, ?)
      `;
      await conn.query(sqlVariant, [
        urunId,
        variant.paket_hacmi,
        variant.description // Frontend'den gelen paketleme tipi adı
      ]);
    }

    await conn.commit();
    res.json({ 
      success: true, 
      message: 'Ürün başarıyla eklendi',
      productId: urunId 
    });
  } catch (error) {
    await conn.rollback();
    // Özel hata mesajları
    if (error.message && (
      error.message.includes("Paket hacmi zorunludur.") ||
      error.message.includes("Paketleme tipi zorunludur.") ||
      error.message.startsWith("Geçersiz paketleme tipi:")
    )) {
      return res.status(400).json({ success: false, error: error.message });
    }
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.sqlMessage && error.sqlMessage.includes('urunler.code')) {
        return res.status(400).json({ error: 'Bu ürün kodu zaten kullanımda!' });
      }
      if (error.sqlMessage && error.sqlMessage.includes('urunler.name')) {
        return res.status(400).json({ error: 'Bu ürün adı zaten kullanımda!' });
      }
    }
    console.error('POST /urun error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

// PUT /api/urunler/:id - Mevcut ürünü güncelle
router.put('/urunler/:id', async (req, res) => {
  const { id } = req.params;
  // Artık paketleme tipi ID ve paket hacmini de alıyoruz
  const { name, code, description, paketleme_tipi_id, paket_hacmi } = req.body;

  // Basit validasyon
  if (!name || !code) {
    return res.status(400).json({ error: "Ürün adı ve kodu zorunludur." });
  }

  const sql = `
    UPDATE urunler
    SET
      name = ?,
      code = ?,
      description = ?,
      paketleme_tipi_id = ?,
      paket_hacmi = ?,
      guncellenme_tarihi = NOW()
    WHERE id = ?
  `;
  const values = [
    name,
    code,
    description || null, // Boşsa NULL yap
    paketleme_tipi_id || null, // Paketleme tipi ID'si
    paket_hacmi || 0, // Paket hacmi
    id
  ];

  try {
    const [result] = await db.query(sql, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Güncellenecek ürün bulunamadı." });
    }
    res.json({ success: true, message: "Ürün başarıyla güncellendi." });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "Bu ürün adı veya kodu zaten mevcut!" });
    }
    console.error('PUT /api/urunler/:id error:', error);
    res.status(500).json({ error: error.message });
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
    
    // Form verilerini al
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
      paketleme_tipi_id,
      description,
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
      urun_varyant_id
    } = req.body;

    // Ana kaydı güncelle
    const updateQuery = `
      UPDATE antrepo_giris SET
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
        description = ?,
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
        urun_varyant_id = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    await db.query(updateQuery, [
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
      description || null,
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
      urun_varyant_id || null,
      id
    ]);
    
    // Ürün satırlarını güncelleme
    if (req.body.urunler && Array.isArray(req.body.urunler)) {
      console.log(`${req.body.urunler.length} adet ürün satırı güncelleniyor/ekleniyor`);
      
      try {
        // Önce mevcut ürün satırlarını silelim (Daha basit yaklaşım)
        await db.query('DELETE FROM antrepo_giris_urunler WHERE antrepo_giris_id = ?', [id]);
        
        // Sonra yeni satırları ekleyelim
        for (const urun of req.body.urunler) {
          const urunInsertQuery = `
            INSERT INTO antrepo_giris_urunler ( 
              antrepo_giris_id, urun_id, 
              gtip_no, paketleme_tipi, paket_boyutu, birim_fiyat,
              miktar, kap_adeti, brut_agirlik, net_agirlik,
              antrepo_giris_tarihi
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
          `;
          
          await db.query(urunInsertQuery, [
            id, 
            urun.urunId || null,
            urun.gtipNo || null,
            urun.paketlemeTipi || null,
            urun.paketBoyutu || null,
            urun.birimFiyat || null,
            urun.miktar || null,
            urun.kapAdeti || null,
            urun.brutAgirlik || null,
            urun.netAgirlik || null,
            urun.antrepoGirisTarihi || null
          ]);
        }
        
        console.log("Ürün satırları başarıyla güncellendi");
      } catch (error) {
        console.error("Ürün satırları güncellenirken hata:", error);
        // Hata oluşsa bile ana güncelleme işlemini etkilememesi için sadece log'luyoruz
      }
    }

    return res.json({
      success: true,
      message: 'Antrepo giriş kaydı başarıyla güncellendi.'
    });
  } catch (error) {
    console.error('Antrepo giriş kaydı güncellenirken hata:', error);
    return res.status(500).json({
      success: false,
      message: 'Kayıt güncellenirken bir hata oluştu.',
      error: error.message
    });
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
    res.status  (500).json({ error: error.message });
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
    res.json(rows);
  } catch (error) {
    console.error("GET /api/urun_varyantlari/paket-boyutlari hatası:", error);
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
    res.status  (500).json({ error: error.message });
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


router.put('/urun_varyantlari/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { paket_hacmi, description } = req.body;

    // Validasyon
    if (!paket_hacmi || !description) {
      return res.status(400).json({ 
        error: "paket_hacmi ve description zorunludur" 
      });
    }

    const sql = `
      UPDATE urun_varyantlari 
      SET paket_hacmi = ?, description = ?
      WHERE id = ?
    `;

    const [result] = await db.query(sql, [paket_hacmi, description, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Varyant bulunamadı' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Varyant güncelleme hatası:', error);
    res.status  (500).json({ error: error.message });
  }
});

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
    res.status  (500).json({ error: error.message });
  }
});


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
    res.status  (500).json({ error: error.message });
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
    console.error("GET /antrepo/:antrepoId/hareketler error:", error);
    res.status(500).json({ error: error.message });
  }
});

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

// This is a function that would be called elsewhere in the code
router.post('/antrepo-giris/:id/urunler', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      urun_id,
      gtip_no,
      paketleme_tipi,
      paket_boyutu,
      birim_fiyat,
      miktar,
      kap_adeti,
      brut_agirlik,
      net_agirlik,
      antrepo_giris_tarihi  // Yeni eklenen alan
    } = req.body;
    
    // Antrepo giriş ID'si ve ürün ID'si zorunlu
    if (!id || !urun_id) {
      return res.status(400).json({
        error: "Antrepo giriş ID'si ve ürün ID'si zorunludur."
      });
    }
    
    const sql = `
      INSERT INTO antrepo_giris_urunler (
        antrepo_giris_id,
        urun_id,
        gtip_no,
        paketleme_tipi,
        paket_boyutu,
        birim_fiyat,
        miktar,
        kap_adeti,
        brut_agirlik,
        net_agirlik,
        antrepo_giris_tarihi
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      id,
      urun_id,
      gtip_no || null,
      paketleme_tipi || null,
      paket_boyutu || null,
      birim_fiyat || 0,
      miktar || 0,
      kap_adeti || 0,
      brut_agirlik || 0,
      net_agirlik || 0,
      antrepo_giris_tarihi || null  // Yeni eklenen tarih alanı
    ];
    
    const [result] = await db.query(sql, values);
    
    res.json({
      success: true,
      insertedId: result.insertId,
      message: "Ürün satırı başarıyla eklendi."
    });
  } catch (error) {
    console.error("POST /antrepo-giris/:id/urunler hatası:", error);
    res.status(500).json({ error: error.message });
  }
});


/********************************************************
 *  ANTREPO_GIRIS_URUNLER CRUD ENDPOINT'LERI
 ********************************************************/
 
// 1) Belirli bir antrepo_giris'e ait ürünleri listeleme
router.get('/antrepo-giris-urunler', async (req, res) => {
  try {
    const { antrepoGirisId } = req.query;
    if (!antrepoGirisId) {
      return res.status(400).json({ error: "antrepoGirisId parametresi gerekli." });
    }

    const sql = `
      SELECT
        agu.id,
        agu.antrepo_giris_id,
        agu.urun_id,
        u.name AS urun_adi,         -- urunler tablosundan ürün adı
        u.code AS urun_kodu,        -- urunler tablosundan ürün kodu
        agu.paketleme_tipi,
        agu.paket_boyutu,
        agu.miktar,
        agu.kap_adeti,
        agu.brut_agirlik,
        agu.net_agirlik,
        agu.gtip_no,
        agu.birim_fiyat,
        agu.created_at,
        agu.updated_at
      FROM antrepo_giris_urunler agu
      LEFT JOIN urunler u ON agu.urun_id = u.id
      WHERE agu.antrepo_giris_id = ?
      ORDER BY agu.id ASC
    `;
    const [rows] = await db.query(sql, [antrepoGirisId]);
    res.json(rows);
  } catch (error) {
    console.error("GET /antrepo-giris-urunler hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2) Yeni bir ürün satırı ekleme
router.post('/antrepo-giris-urunler', async (req, res) => {
  try {
    const {
      antrepo_giris_id,
      urun_id,
      paketleme_tipi,
      paket_boyutu,
      miktar,
      kap_adeti,
      brut_agirlik,
      net_agirlik,
      gtip_no,
      birim_fiyat
    } = req.body;

    if (!antrepo_giris_id || !urun_id) {
      return res.status(400).json({ error: "antrepo_giris_id ve urun_id zorunludur." });
    }

    const sql = `
      INSERT INTO antrepo_giris_urunler
        (antrepo_giris_id, urun_id, paketleme_tipi, paket_boyutu, miktar, kap_adeti,
         brut_agirlik, net_agirlik, gtip_no, birim_fiyat)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      antrepo_giris_id,
      urun_id,
      paketleme_tipi || null,
      paket_boyutu || null,
      miktar || 0,
      kap_adeti || 0,
      brut_agirlik || 0,
      net_agirlik || 0,
      gtip_no || null,
      birim_fiyat || 0
    ];

    const [result] = await db.query(sql, params);
    if (result.insertId) {
      res.json({ success: true, insertedId: result.insertId });
    } else {
      res.json({ success: false, message: "Ürün eklenemedi." });
    }
  } catch (error) {
    console.error("POST /antrepo-giris-urunler hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3) Belirli bir ürün satırını güncelleme
router.put('/antrepo-giris-urunler/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      urun_id,
      gtip_no,
      paketleme_tipi,
      paket_boyutu,
      birim_fiyat,
      miktar,
      kap_adeti,
      brut_agirlik,
      net_agirlik,
      antrepo_giris_tarihi  // Yeni eklenen alan
    } = req.body;
    
    const sql = `
      UPDATE antrepo_giris_urunler
      SET 
        urun_id = ?,
        gtip_no = ?,
        paketleme_tipi = ?,
        paket_boyutu = ?,
        birim_fiyat = ?,
        miktar = ?,
        kap_adeti = ?,
        brut_agirlik = ?,
        net_agirlik = ?,
        antrepo_giris_tarihi = ?
      WHERE id = ?
    `;
    
    const values = [
      urun_id,
      gtip_no || null,
      paketleme_tipi || null,
      paket_boyutu || null,
      birim_fiyat || 0,
      miktar || 0,
      kap_adeti || 0,
      brut_agirlik || 0,
      net_agirlik || 0,
      antrepo_giris_tarihi || null,  // Yeni eklenen tarih alanı
      id
    ];
    
    const [result] = await db.query(sql, values);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Ürün satırı bulunamadı." });
    }
    
    res.json({
      success: true,
      message: "Ürün satırı başarıyla güncellendi."
    });
  } catch (error) {
    console.error("PUT /antrepo-giris-urunler/:id hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4) Belirli bir ürün satırını silme
router.delete('/antrepo-giris-urunler/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      DELETE FROM antrepo_giris_urunler
      WHERE id = ?
    `;
    const [result] = await db.query(sql, [id]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Ürün satırı silindi.' });
    } else {
      res.status(404).json({ error: 'Silinecek kayıt bulunamadı.' });
    }
  } catch (error) {
    console.error("DELETE /antrepo-giris-urunler/:id hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET route to calculate stock levels for a product in an antrepo
router.get('/antrepo/:antrepoId/urun/:urunId/stock', async (req, res) => {
  try {
    const { antrepoId, urunId } = req.params;
    
    const sql = `
      SELECT
        SUM(CASE WHEN islem_tipi = 'Giriş' THEN miktar ELSE 0 END) AS total_giris,
        SUM(CASE WHEN islem_tipi = 'Çıkış' THEN miktar ELSE 0 END) AS total_cikis,
        (SUM(CASE WHEN islem_tipi = 'Giriş' THEN miktar ELSE 0 END) - 
         SUM(CASE WHEN islem_tipi = 'Çıkış' THEN miktar ELSE 0 END)) AS current_stock
      FROM antrepo_hareketleri
      WHERE antrepo_giris_id = ? AND urun_id = ?
    `;
    
    const [results] = await db.query(sql, [antrepoId, urunId]);
    res.json(results[0]);
  } catch (error) {
    console.error("Stock calculation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE endpoint for ek-hizmetler
router.delete('/antrepo-giris/:girisId/ek-hizmetler/:ekHizmetId', async (req, res) => {
  try {
    const { girisId, ekHizmetId } = req.params;
    
    // İlişki kontrolü: Bu ek hizmetin, belirtilen antrepo girişine ait olduğundan emin ol
    const [checkRows] = await db.query(
      'SELECT id FROM antrepo_giris_hizmetler WHERE id = ? AND antrepo_giris_id = ?',
      [ekHizmetId, girisId]
    );
    
    if (checkRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: `Ek hizmet bulunamadı veya bu antrepo girişine ait değil (ID: ${ekHizmetId})`
      });
    }
    
    // Silme işlemi
    const [result] = await db.query(
      'DELETE FROM antrepo_giris_hizmetler WHERE id = ?',
      [ekHizmetId]
    );
    
    if (result.affectedRows > 0) {
      res.json({ success: true, message: "Ek hizmet başarıyla silindi" });
    } else {
      res.status(400).json({ success: false, message: "Ek hizmet silinemedi" });
    }
  } catch (error) {
    console.error("Ek hizmet silme hatası:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// This should be the very last line of the file
module.exports = router;
