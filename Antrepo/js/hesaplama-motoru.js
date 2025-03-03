// File: hesaplama-motoru.js
import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async () => {
  // URL'den entryId parametresini alıyoruz
  const urlParams = new URLSearchParams(window.location.search);
  const girisId = urlParams.get("entryId"); 

  if (!girisId) {
    alert("Geçersiz giriş ID");
    return;
  }

  // HTML Elemanları
  const beyannameNoSpan = document.getElementById("beyannameNo");
  const girisTarihiSpan = document.getElementById("girisTarihi");
  const urunAdiSpan = document.getElementById("urunAdi");
  const urunKoduSpan = document.getElementById("urunKodu");
  const initialStockSpan = document.getElementById("initialStock");
  const dailyTableBody = document.getElementById("dailyTableBody");
  const backBtn = document.getElementById("backBtn");

  backBtn.addEventListener("click", () => {
    history.back();
  });

  // 1) API'den hesaplama sonuçlarını çek
  async function fetchCalculation(girisId) {
    try {
      // Bu endpoint'i routes/api.js içinde tanımlamalısınız: /api/hesaplama-motoru/:girisId
      const resp = await fetch(`${baseUrl}/api/hesaplama-motoru/${girisId}`);
      if (!resp.ok) {
        throw new Error(`Sunucu hatası: ${resp.status}`);
      }
      const data = await resp.json();
      populateResults(data);
    } catch (err) {
      console.error("Hesaplama motoru verisi alınırken hata:", err);
      alert("Hesaplama verisi alınamadı. " + err.message);
    }
  }

  // 2) Gelen verileri tabloya bas
  function populateResults(result) {
    const { antrepoGiris, dailyBreakdown } = result;

    // Üst taraftaki özet
    beyannameNoSpan.textContent = antrepoGiris.beyanname_no || "-";
    girisTarihiSpan.textContent = antrepoGiris.giris_tarihi || "-";
    urunAdiSpan.textContent = antrepoGiris.urun_adi || "-";
    urunKoduSpan.textContent = antrepoGiris.urun_kodu || "-";
    initialStockSpan.textContent = antrepoGiris.initialStock || 0;

    // Günlük tablo
    dailyTableBody.innerHTML = "";
    dailyBreakdown.forEach(row => {
      const tr = document.createElement("tr");

      const tdDay = document.createElement("td");
      tdDay.textContent = row.dayIndex;
      
      const tdDate = document.createElement("td");
      tdDate.textContent = row.date; // "YYYY-MM-DD"

      const tdEvent = document.createElement("td");
      tdEvent.textContent = row.event;
      
      const tdArdiye = document.createElement("td");
      tdArdiye.textContent = row.ardiye.toFixed(2);
      
      const tdIndiBindi = document.createElement("td");
      tdIndiBindi.textContent = row.indiBindi.toFixed(2);
      
      const tdMesai = document.createElement("td");
      tdMesai.textContent = row.mesai.toFixed(2);
      
      const tdDailyTotal = document.createElement("td");
      tdDailyTotal.textContent = row.dailyTotal.toFixed(2);
      
      const tdCumulative = document.createElement("td");
      tdCumulative.textContent = row.cumulativeTotal.toFixed(2);
      
      const tdStock = document.createElement("td");
      tdStock.textContent = row.stockAfter.toFixed(2);

      tr.append(
        tdDay, tdDate, tdEvent, tdArdiye, tdIndiBindi, 
        tdMesai, tdDailyTotal, tdCumulative, tdStock
      );
      dailyTableBody.appendChild(tr);
    });
  }

  // 3) Başlat
  await fetchCalculation(girisId);
});
