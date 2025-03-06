// maliyet-analizi-index.js
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

  // Her satır için, hesaplama motoru endpoint'ine istek atarak
  // son satır dayTotal (Mevcut Maliyet), cumulative (Toplam Maliyet),
  // ve paraBirimi bilgilerini çekiyoruz.
  async function fetchHesaplamaMotoru(girisId) {
    try {
      const resp = await fetch(`${baseUrl}/api/hesaplama-motoru/${girisId}`);
      if (!resp.ok) throw new Error(`Hesaplama Motoru Hatası: ${resp.status}`);
      const calcData = await resp.json();

      // dailyBreakdown dizisi
      const breakdown = calcData.dailyBreakdown || [];
      if (breakdown.length === 0) {
        return {
          mevcutMaliyet: 0,
          toplamMaliyet: 0,
          birimMaliyet: 0,
          paraBirimi: calcData.paraBirimi || "USD"
        };
      }

      // Son satır
      const lastRow = breakdown[breakdown.length - 1];
      const mevcutMaliyet = lastRow.dayTotal;      // Günlük Toplam (dayTotal)
      const toplamMaliyet = lastRow.cumulative;    // Kümülatif Toplam (cumulative)

      // Birim Maliyete Etkisi
      // calcData.unitCostImpact => orada top-level'da gelebilir
      // ama isterseniz kendiniz de hesaplayabilirsiniz
      let birimMaliyet = calcData.unitCostImpact || 0;

      // Örneğin: birimMaliyet = toplamMaliyet / totalGirisMiktari
      // totalGirisMiktari => item.entryCount'tan da gelebilir
      // Veya calcData.antrepoGiris.initialStock'tan
      // Bu örnekte calcData.unitCostImpact'ı kullanıyoruz:
      // (calcData da totalCost, unitCostImpact alanları var)

      return {
        mevcutMaliyet,
        toplamMaliyet,
        birimMaliyet: birimMaliyet,
        paraBirimi: calcData.paraBirimi || "USD"
      };
    } catch (err) {
      console.error("Hesaplama motoru çağrısı hatası:", err);
      return {
        mevcutMaliyet: 0,
        toplamMaliyet: 0,
        birimMaliyet: 0,
        paraBirimi: "USD"
      };
    }
  }

  function populateTable(data) {
    tableBody.innerHTML = "";

    // data.forEach => her satır, Maliyet Analizi endpoint'inden gelen temel bilgiler
    data.forEach(async (item) => {
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
        const d = new Date(item.entryDate);
        tdEntryDate.textContent = isNaN(d.getTime()) ? "-" : d.toISOString().split('T')[0];
      } else {
        tdEntryDate.textContent = "-";
      }

      // 4) Antrepo Giriş Form No
      const tdFormNo = document.createElement("td");
      tdFormNo.textContent = item.formNo || "-";

      // 5) Antrepo Giriş Adedi
      const tdEntryCount = document.createElement("td");
      tdEntryCount.textContent = item.entryCount != null ? item.entryCount : "-";

      // 6) Antrepo Giriş Kap Adedi
      const tdEntryKap = document.createElement("td");
      tdEntryKap.textContent = item.entryKapCount != null ? item.entryKapCount : "-";

      // 7) Son Antrepo Çıkış Tarihi
      const tdLastExitDate = document.createElement("td");
      if (item.lastExitDate) {
        const d2 = new Date(item.lastExitDate);
        tdLastExitDate.textContent = isNaN(d2.getTime()) ? "-" : d2.toISOString().split('T')[0];
      } else {
        tdLastExitDate.textContent = "-";
      }

      // 8) Son Çıkış Adedi
      const tdLastExitAmount = document.createElement("td");
      tdLastExitAmount.textContent = item.lastExitAmount != null ? item.lastExitAmount : "-";

      // 9) Mevcut Stok (Ton)
      const tdCurrentStock = document.createElement("td");
      tdCurrentStock.textContent = (item.currentStock != null)
        ? parseFloat(item.currentStock).toFixed(2)
        : "-";

      // 10) Mevcut Kap Adedi
      const tdCurrentKap = document.createElement("td");
      tdCurrentKap.textContent = item.currentKapCount != null
        ? item.currentKapCount
        : "-";

      // 11) Mevcut Maliyet
      const tdCurrentCost = document.createElement("td");
      // Burada "mirror" yaklaşımı: 
      // fetchHesaplamaMotoru ile son satır dayTotal değerini alacağız.
      // item.entryId => girisId
      let mirrorMevcutMaliyet = "...";
      let mirrorParaBirimi = "USD"; 
      tdCurrentCost.textContent = mirrorMevcutMaliyet; // Geçici

      // 12) Toplam Maliyet
      const tdTotalCost = document.createElement("td");
      let mirrorToplamMaliyet = "...";
      tdTotalCost.textContent = mirrorToplamMaliyet; // Geçici

      // 13) Birim Maliyete Etkisi
      const tdUnitImpact = document.createElement("td");
      let mirrorUnitImpact = "...";
      tdUnitImpact.textContent = mirrorUnitImpact;

      // 14) Detay Linki
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

      // Şimdi asenkron olarak hesaplama motoru verisini çekelim
      const calc = await fetchHesaplamaMotoru(item.entryId);
      // calc => { mevcutMaliyet, toplamMaliyet, birimMaliyet, paraBirimi }

      // Güncel verilerle tablo hücrelerini dolduralım:
      tdCurrentCost.textContent = `${calc.mevcutMaliyet.toFixed(2)} ${calc.paraBirimi}`;
      tdTotalCost.textContent = `${calc.toplamMaliyet.toFixed(2)} ${calc.paraBirimi}`;
      tdUnitImpact.textContent = calc.birimMaliyet
        ? calc.birimMaliyet.toFixed(2)
        : "0.00";
    });
  }

  await fetchMaliyetAnalizi();
});
