// File: hesaplama-motoru.js
import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async () => {
  // URL'den entryId parametresini al
  const urlParams = new URLSearchParams(window.location.search);
  const girisId = urlParams.get("entryId"); 

  if (!girisId) {
    alert("Geçersiz 'entryId' parametresi.");
    return;
  }

  // HTML Elemanları
  const beyannameNoSpan = document.getElementById("beyannameNo");
  const girisTarihiSpan = document.getElementById("girisTarihi");
  const urunAdiSpan = document.getElementById("urunAdi");
  const urunKoduSpan = document.getElementById("urunKodu");
  const initialStockSpan = document.getElementById("initialStock");
  const dailyTableBody = document.getElementById("dailyTableBody");

  // KDV kaldırıldığı için bu alanlar yok
  // const totalMaliyetKdvHaricSpan = document.getElementById("totalMaliyetKdvHaric");
  // const kdvTutariSpan = document.getElementById("kdvTutari");
  // const totalMaliyetKdvDahilSpan = document.getElementById("totalMaliyetKdvDahil");

  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      history.back();
    });
  }

  // 1) API'den hesaplama sonuçlarını çek
  async function fetchCalculation(girisId) {
    try {
      // /api/hesaplama-motoru/:girisId endpointini çağırıyoruz
      const resp = await fetch(`${baseUrl}/api/hesaplama-motoru/${girisId}`);
      if (!resp.ok) {
        throw new Error(`Sunucu hatası: ${resp.status}`);
      }
      const data = await resp.json();
      populateResults(data);
    } catch (err) {
      console.error("Hesaplama motoru verisi alınırken hata:", err);
      alert("Hesaplama verisi alınamadı: " + err.message);
    }
  }

  // 2) Gelen verileri tabloya bas
  function populateResults(result) {
    // Örnek: { antrepoGiris, dailyBreakdown, totalCost } vb. 
    // KDV yoksa totalWithoutKdv vs. gibi alanları iptal ediyoruz.
    const {
      antrepoGiris,
      dailyBreakdown,
      totalCost,  // backend de “toplam” tutarı böyle bir alanda döndürebilirsiniz
    } = result;

    // Üst taraftaki özet alanları
    beyannameNoSpan.textContent = antrepoGiris.beyanname_no || "-";
    girisTarihiSpan.textContent = antrepoGiris.antrepo_giris_tarihi || "-";
    urunAdiSpan.textContent = antrepoGiris.urun_tanimi || "-"; 
    urunKoduSpan.textContent = antrepoGiris.urun_kodu || "-";
    initialStockSpan.textContent = antrepoGiris.initialStock || 0;

    // Günlük tablo
    dailyTableBody.innerHTML = "";

    // dailyBreakdown: [{ date, dayArdiye, dayEkHizmet, dayTotal, cumulative, stockAfter }, ...]
    dailyBreakdown.forEach((row, index) => {
      const tr = document.createElement("tr");

      // 1) Gün (index + 1)
      const tdGun = document.createElement("td");
      tdGun.textContent = (index + 1).toString();

      // 2) Tarih
      const tdTarih = document.createElement("td");
      tdTarih.textContent = row.date;

      // 3) Ardiye
      const tdArdiye = document.createElement("td");
      tdArdiye.textContent = row.dayArdiye.toFixed(2);

      // 4) Ek Hizmet
      const tdEkHizmet = document.createElement("td");
      tdEkHizmet.textContent = row.dayEkHizmet.toFixed(2);

      // 5) Günlük Toplam
      const tdDailyTotal = document.createElement("td");
      tdDailyTotal.textContent = row.dayTotal.toFixed(2);

      // 6) Kümülatif Toplam
      const tdCumulative = document.createElement("td");
      tdCumulative.textContent = row.cumulative.toFixed(2);

      // 7) Kalan Stok
      const tdStock = document.createElement("td");
      tdStock.textContent = row.stockAfter.toFixed(2);

      tr.append(tdGun, tdTarih, tdArdiye, tdEkHizmet, tdDailyTotal, tdCumulative, tdStock);
      dailyTableBody.appendChild(tr);
    });

    // Toplam tutarı ekranda göstermek istiyorsanız, bir span'a basabilirsiniz
    // Örneğin:
    const totalSpan = document.getElementById("totalMaliyet");
    if (totalSpan && totalCost != null) {
      totalSpan.textContent = totalCost.toFixed(2);
    }
  }

  // 3) Başlat
  await fetchCalculation(girisId);
});
