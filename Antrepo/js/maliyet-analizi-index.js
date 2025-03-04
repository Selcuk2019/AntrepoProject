// File: maliyet-analizi-index.js
import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("maliyetTableBody");

  async function fetchMaliyetAnalizi() {
    try {
      // API'yi çağır
      const resp = await fetch(`${baseUrl}/api/maliyet-analizi`);
      if (!resp.ok) throw new Error(`Hata: ${resp.status}`);
      const data = await resp.json();
      populateTable(data);
    } catch (error) {
      console.error("Maliyet analizi verisi alınırken hata:", error);
      tableBody.innerHTML = `<tr><td colspan="16">Veri alınamadı: ${error.message}</td></tr>`;
    }
  }

  function populateTable(data) {
    tableBody.innerHTML = "";
  
    data.forEach(item => {
      const tr = document.createElement("tr");
  
      // 1) Ürün Adı
      const tdProductName = document.createElement("td");
      tdProductName.textContent = item.productName || "-";
  
      // 2) Ürün Kodu
      const tdProductCode = document.createElement("td");
      tdProductCode.textContent = item.productCode || "-";
  
      // 3) Antrepo Giriş Tarihi
      const tdEntryDate = document.createElement("td");
      if (item.entryDate) {
        const dt = new Date(item.entryDate);
        tdEntryDate.textContent = dt.toLocaleDateString("tr-TR");
      } else {
        tdEntryDate.textContent = "-";
      }
  
      // 4) Form No
      const tdFormNo = document.createElement("td");
      tdFormNo.textContent = item.formNo || "-";
  
      // 5) Antrepo Giriş Adedi
      const tdEntryCount = document.createElement("td");
      tdEntryCount.textContent = (item.entryCount != null) ? item.entryCount : "-";
  
      // 6) Antrepo Giriş Kap Adedi
      const tdEntryKap = document.createElement("td");
      tdEntryKap.textContent = (item.entryKapCount != null) ? item.entryKapCount : "-";
  
      // 7) Son Antrepo Çıkış Tarihi
      const tdLastExitDate = document.createElement("td");
      if (item.lastExitDate) {
        const dt = new Date(item.lastExitDate);
        tdLastExitDate.textContent = dt.toLocaleDateString("tr-TR");
      } else {
        tdLastExitDate.textContent = "-";
      }
  
      // 8) Son Çıkış Adedi
      const tdLastExitAmount = document.createElement("td");
      tdLastExitAmount.textContent = (item.lastExitAmount != null) ? item.lastExitAmount : "-";
  
      // 9) Mevcut Stok (Ton)
      const tdCurrentStock = document.createElement("td");
      tdCurrentStock.textContent = (item.currentStock != null) 
        ? parseFloat(item.currentStock).toFixed(2)
        : "-";
  
      // 10) Mevcut Kap Adedi
      const tdCurrentKap = document.createElement("td");
      tdCurrentKap.textContent = (item.currentKapCount != null)
        ? item.currentKapCount
        : "-";
  
      // 11) Mevcut Maliyet (USD)
      const tdCurrentCost = document.createElement("td");
      if (item.currentCost != null) {
        tdCurrentCost.textContent = parseFloat(item.currentCost).toFixed(2);
      } else {
        tdCurrentCost.textContent = "-";
      }
  
      // 12) Toplam Maliyet (USD)
      const tdTotalCost = document.createElement("td");
      if (item.totalCost != null) {
        tdTotalCost.textContent = parseFloat(item.totalCost).toFixed(2);
      } else {
        tdTotalCost.textContent = "-";
      }
  
      // 13) Birim Maliyete Etkisi
      const tdUnitImpact = document.createElement("td");
      if (item.unitCostImpact != null) {
        tdUnitImpact.textContent = parseFloat(item.unitCostImpact).toFixed(2);
      } else {
        tdUnitImpact.textContent = "-";
      }
  
      // 14) İşlemler (Detay Linki)
      const tdDetail = document.createElement("td");
      const detailLink = document.createElement("a");
      detailLink.textContent = "Detay";
      detailLink.href = `hesaplama-motoru.html?entryId=${encodeURIComponent(item.entryId)}`;
      detailLink.classList.add("btn-detail");
      tdDetail.appendChild(detailLink);
  
      // Artık 14 hücreyi tablo satırına ekliyoruz
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
