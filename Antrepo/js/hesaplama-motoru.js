// File: hesaplama-motoru.js
import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async () => {
  // HTML Elemanlarını toplayalım
  const urlParams = new URLSearchParams(window.location.search);
  const girisId = urlParams.get("entryId");

  if (!girisId) {
    alert("Geçersiz 'entryId' parametresi.");
    return;
  }

  const beyannameNoSpan = document.getElementById("beyannameNo");
  const girisTarihiSpan = document.getElementById("girisTarihi");
  const urunAdiSpan = document.getElementById("urunAdi");
  const urunKoduSpan = document.getElementById("urunKodu");
  const initialStockSpan = document.getElementById("initialStock");
  const dailyTableBody = document.getElementById("dailyTableBody");
  const totalMaliyetSpan = document.getElementById("totalMaliyet");
  const backBtn = document.getElementById("backBtn");

  backBtn.addEventListener("click", () => {
    history.back();
  });

  async function fetchCalculation() {
    try {
      const resp = await fetch(`${baseUrl}/api/hesaplama-motoru/${girisId}`);
      if (!resp.ok) {
        throw new Error(`Sunucu hatası: ${resp.status}`);
      }
      const data = await resp.json();
      populateResults(data);
    } catch (err) {
      console.error("Hesaplama verisi alınamadı:", err);
      alert("Hesaplama verisi alınamadı: " + err.message);
    }
  }

  function populateResults(result) {
    // Beklenen alanlar: { antrepoGiris, sozlesme, dailyBreakdown, totalCost, unitCostImpact }
    const { antrepoGiris, sozlesme, dailyBreakdown = [], totalCost = 0 } = result;

    // Üst taraftaki özet
    beyannameNoSpan.textContent = antrepoGiris?.beyanname_no || "-";
    girisTarihiSpan.textContent = antrepoGiris?.antrepo_giris_tarihi || "-";
    urunAdiSpan.textContent = antrepoGiris?.urun_tanimi || "-";
    urunKoduSpan.textContent = antrepoGiris?.urun_kodu || "-";
    initialStockSpan.textContent = antrepoGiris?.initialStock || "0";

    // Tabloyu temizle
    dailyTableBody.innerHTML = "";

    // Para birimi (eğer sözleşmede varsa)
    const paraBirimi = sozlesme?.para_birimi || ""; // "USD", "TRY" vb.

    // dailyBreakdown: [{ dayIndex, date, dayArdiye, dayEkHizmet, dayTotal, cumulative, stockAfter }, ...]
    dailyBreakdown.forEach((row, index) => {
      const tr = document.createElement("tr");

      const tdGun = document.createElement("td");
      tdGun.textContent = row.dayIndex;

      const tdTarih = document.createElement("td");
      tdTarih.textContent = row.date;

      const tdArdiye = document.createElement("td");
      tdArdiye.textContent = `${row.dayArdiye.toFixed(2)} ${paraBirimi}`;

      const tdEkHizmet = document.createElement("td");
      tdEkHizmet.textContent = `${row.dayEkHizmet.toFixed(2)} ${paraBirimi}`;

      const tdDailyTotal = document.createElement("td");
      tdDailyTotal.textContent = `${row.dayTotal.toFixed(2)} ${paraBirimi}`;

      const tdCumulative = document.createElement("td");
      tdCumulative.textContent = `${row.cumulative.toFixed(2)} ${paraBirimi}`;

      const tdStock = document.createElement("td");
      tdStock.textContent = row.stockAfter.toFixed(2);

      tr.append(
        tdGun, tdTarih, tdArdiye, tdEkHizmet,
        tdDailyTotal, tdCumulative, tdStock
      );
      dailyTableBody.appendChild(tr);
    });

    // Toplam Maliyet
    totalMaliyetSpan.textContent = `${parseFloat(totalCost).toFixed(2)} ${paraBirimi}`;
  }

  await fetchCalculation();
});
