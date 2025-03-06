// maliyet-analizi-index.js
// Bu dosya, maliyet analizi özet sayfasında (maliyet-analizi-index.html) kullanılan JS kodudur.
// /api/maliyet-analizi endpoint'ine istek atarak gelen verileri tabloya doldurur.

import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("maliyetTableBody");

  async function fetchMaliyetAnalizi() {
    try {
      const resp = await fetch(`${baseUrl}/api/maliyet-analizi`);
      if (!resp.ok) throw new Error(`Hata: ${resp.status}`);
      const data = await resp.json();
      populateTable(data);
    } catch (error) {
      console.error("Maliyet analizi verisi alınırken hata:", error);
      tableBody.innerHTML = `<tr><td colspan="14">Veri alınamadı: ${error.message}</td></tr>`;
    }
  }

  function populateTable(data) {
    tableBody.innerHTML = "";
    data.forEach(item => {
      const tr = document.createElement("tr");

      const tdProductName = document.createElement("td");
      tdProductName.textContent = item.productName || "-";

      const tdProductCode = document.createElement("td");
      tdProductCode.textContent = item.productCode || "-";

      const tdEntryDate = document.createElement("td");
      tdEntryDate.textContent = item.entryDate
        ? new Date(item.entryDate).toISOString().split('T')[0]
        : "-";

      const tdFormNo = document.createElement("td");
      tdFormNo.textContent = item.formNo || "-";

      const tdEntryCount = document.createElement("td");
      tdEntryCount.textContent = item.entryCount != null ? item.entryCount : "-";

      const tdEntryKap = document.createElement("td");
      tdEntryKap.textContent = item.entryKapCount != null ? item.entryKapCount : "-";

      const tdLastExitDate = document.createElement("td");
      tdLastExitDate.textContent = item.lastExitDate
        ? new Date(item.lastExitDate).toISOString().split('T')[0]
        : "-";

      const tdLastExitAmount = document.createElement("td");
      tdLastExitAmount.textContent = item.lastExitAmount != null
        ? item.lastExitAmount
        : "-";

      const tdCurrentStock = document.createElement("td");
      tdCurrentStock.textContent = (item.currentStock != null)
        ? parseFloat(item.currentStock).toFixed(2)
        : "-";

      const tdCurrentKap = document.createElement("td");
      tdCurrentKap.textContent = item.currentKapCount != null
        ? item.currentKapCount
        : "-";

      const tdCurrentCost = document.createElement("td");
      if (item.currentCost != null) {
        const costVal = parseFloat(item.currentCost).toFixed(2);
        const currency = item.paraBirimi ? item.paraBirimi : "USD";
        tdCurrentCost.textContent = `${costVal} ${currency}`;
      } else {
        tdCurrentCost.textContent = "-";
      }

      const tdTotalCost = document.createElement("td");
      if (item.totalCost != null) {
        const costVal = parseFloat(item.totalCost).toFixed(2);
        const currency = item.paraBirimi ? item.paraBirimi : "USD";
        tdTotalCost.textContent = `${costVal} ${currency}`;
      } else {
        tdTotalCost.textContent = "-";
      }

      const tdUnitImpact = document.createElement("td");
      tdUnitImpact.textContent = item.unitCostImpact != null
        ? parseFloat(item.unitCostImpact).toFixed(2)
        : "-";

      // "Detay" linki (hesaplama motoru sayfasına yönlendirir)
      const tdDetail = document.createElement("td");
      const detailLink = document.createElement("a");
      detailLink.textContent = "Detay";
      detailLink.href = `hesaplama-motoru.html?entryId=${encodeURIComponent(item.entryId)}`;
      detailLink.classList.add("btn-detail");
      tdDetail.appendChild(detailLink);

      tr.append(
        tdProductName,
        tdProductCode,
        tdEntryDate,
        tdFormNo,
        tdEntryCount,
        tdEntryKap,
        tdLastExitDate,
        tdLastExitAmount,
        tdCurrentStock,
        tdCurrentKap,
        tdCurrentCost,
        tdTotalCost,
        tdUnitImpact,
        tdDetail
      );
      tableBody.appendChild(tr);
    });
  }

  await fetchMaliyetAnalizi();
});
