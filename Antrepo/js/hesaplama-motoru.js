// hesaplama-motoru.js
// Bu dosya, hesaplama motoru sayfasında (hesaplama-motoru.html) kullanılan JS kodudur.
// /api/hesaplama-motoru/:girisId endpoint'ine istek atarak gelen verileri tabloya doldurur.

import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async () => {
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
    const { antrepoGiris, dailyBreakdown = [], totalCost = 0, paraBirimi } = result;

    beyannameNoSpan.textContent = antrepoGiris?.beyanname_no || "-";
    girisTarihiSpan.textContent = antrepoGiris?.antrepo_giris_tarihi
      ? new Date(antrepoGiris.antrepo_giris_tarihi).toISOString().split('T')[0]
      : "-";
    urunAdiSpan.textContent = antrepoGiris?.urun_tanimi || "-";
    urunKoduSpan.textContent = antrepoGiris?.urun_kodu || "-";
    initialStockSpan.textContent = antrepoGiris?.initialStock || "0";

    dailyTableBody.innerHTML = "";
    dailyBreakdown.forEach((row) => {
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
        tdGun,
        tdTarih,
        tdArdiye,
        tdEkHizmet,
        tdDailyTotal,
        tdCumulative,
        tdStock
      );
      dailyTableBody.appendChild(tr);
    });

    totalMaliyetSpan.textContent = `${parseFloat(totalCost).toFixed(2)} ${paraBirimi}`;
  }

  await fetchCalculation();
});
