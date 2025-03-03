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
      tableBody.innerHTML = `<tr><td colspan="14">Veri alınamadı: ${error.message}</td></tr>`;
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
        // YYYY-MM-DD formatını TR formatına dönüştürmek isterseniz:
        const dt = new Date(item.entryDate);
        tdEntryDate.textContent = dt.toLocaleDateString("tr-TR");
      } else {
        tdEntryDate.textContent = "-";
      }

      // 4) Antrepo Giriş Form No
      const tdFormNo = document.createElement("td");
      tdFormNo.textContent = item.formNo || "-";

      // 5) Antrepo Giriş Adedi (aslında toplam giren ton)
      const tdEntryCount = document.createElement("td");
      tdEntryCount.textContent = item.entryCount != null ? item.entryCount : "-";

      // 6) Antrepo Giriş Kap Adedi (isteğe bağlı, tabloya eklenebilir)
      const tdKap = document.createElement("td");
      tdKap.textContent = item.entryKapCount != null ? item.entryKapCount : "-";

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
      tdLastExitAmount.textContent = item.lastExitAmount != null ? item.lastExitAmount : "-";

      // 9) Mevcut Stok (Ton)
      const tdCurrentStock = document.createElement("td");
      tdCurrentStock.textContent = (item.currentStock != null) ? parseFloat(item.currentStock).toFixed(2) : "-";

      // 10) Mevcut Kap Adedi
      const tdCurrentKap = document.createElement("td");
      tdCurrentKap.textContent = item.currentKapCount != null ? item.currentKapCount : "-";

      // 11) Mevcut Maliyet (USD)
      const tdCurrentCost = document.createElement("td");
      tdCurrentCost.textContent = (item.currentCost != null) 
        ? parseFloat(item.currentCost).toFixed(2) 
        : "-";

      // 12) Toplam Maliyet (USD)
      const tdTotalCost = document.createElement("td");
      tdTotalCost.textContent = (item.totalCost != null)
        ? parseFloat(item.totalCost).toFixed(2)
        : "-";

      // 13) Birim Maliyete Etkisi
      const tdUnitCost = document.createElement("td");
      tdUnitCost.textContent = (item.unitCostImpact != null)
        ? parseFloat(item.unitCostImpact).toFixed(2)
        : "-";

      // 14) İşlemler (Detay Linki)
      const tdDetail = document.createElement("td");
      const detailLink = document.createElement("a");
      detailLink.textContent = "Detay";
      // hesaplama-motoru.html sayfasına entryId parametresiyle git
      detailLink.href = `hesaplama-motoru.html?entryId=${encodeURIComponent(item.entryId)}`;
      detailLink.classList.add("btn-detail");
      tdDetail.appendChild(detailLink);

      tr.append(
        tdProductName,
        tdProductCode,
        tdEntryDate,
        tdFormNo,
        tdEntryCount,
        tdKap,
        tdLastExitDate,
        tdLastExitAmount,
        tdCurrentStock,
        tdCurrentKap,
        tdCurrentCost,
        tdTotalCost,
        tdUnitCost,
        tdDetail
      );
      tableBody.appendChild(tr);
    });
  }

  await fetchMaliyetAnalizi();
});
