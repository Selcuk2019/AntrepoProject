import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("maliyetTableBody");
  let dataTable = null; // DataTable instance'ı için değişken

  async function fetchMaliyetAnalizi() {
    try {
      const resp = await fetch(`${baseUrl}/api/maliyet-analizi`);
      if (!resp.ok) throw new Error(`Hata: ${resp.status}`);
      const data = await resp.json();
      await populateTable(data);
      
      // Tüm veriler yüklendikten sonra DataTable'ı başlat
      if (dataTable) {
        dataTable.destroy(); // Eğer varsa mevcut DataTable'ı temizle
      }
      
      // DataTable konfigürasyonunu güncelle
      dataTable = $('#maliyetTable').DataTable({
        language: {
          url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/tr.json'
        },
        pageLength: 25,
        order: [[2, 'desc']], // Antrepo Giriş Tarihine göre sırala
        responsive: true,
        dom: '<"top"f>rt<"bottom"lip><"clear">',
        ordering: true, // Sıralama özelliğini aktif et
        // Sütun başlıklarının sıralama özelliklerini özelleştir
        columnDefs: [
          {
            targets: '_all', // Tüm sütunlar için
            sortable: true, // Sıralanabilir yap
            className: 'sorting' // Tüm sütunlara sorting sınıfını ekle
          },
          {
            targets: -1, // Son sütun (İşlemler sütunu)
            sortable: false, // İşlemler sütununu sıralanamaz yap
            className: 'no-sort' // Sıralama olmayan sütunlar için
          }
        ],
        initComplete: function() {
          // Arama kutusunu özelleştir
          $('.dataTables_filter input').attr('placeholder', 'Ara...');
          $('.dataTables_filter input').addClass('modern-search');
          $('.dataTables_filter label').html($('.dataTables_filter input'));
        },
        "drawCallback": function( settings ) {
          // Sıralama ikonlarını yeniden initialize et
          $('th.sorting').removeClass('sorting_asc sorting_desc');
        }
      });

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

  // Tarih formatlama yardımcı fonksiyonu
  function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}.${month}.${year}`;
  }

  async function populateTable(data) {
    tableBody.innerHTML = "";

    for (const item of data) { // forEach yerine for...of kullanıyoruz
      const tr = document.createElement("tr");

      // 1) Ürün Adı - Link olarak (productCode yerine productId kullanıyoruz)
      const tdProductName = document.createElement("td");
      tdProductName.innerHTML = `<a href="stock-card.html?id=${item.productId}" class="table-link">${item.productName || "-"}</a>`;

      // 2) Ürün Kodu - Link olarak (productCode yerine productId kullanıyoruz)
      const tdProductCode = document.createElement("td");
      tdProductCode.innerHTML = `<a href="stock-card.html?id=${item.productId}" class="table-link">${item.productCode || "-"}</a>`;

      // 3) Antrepo Giriş Tarihi
      const tdEntryDate = document.createElement("td");
      tdEntryDate.textContent = formatDate(item.entryDate);

      // 4) Antrepo Giriş Form No - Link olarak
      const tdFormNo = document.createElement("td");
      const formNoLink = document.createElement("a");
      formNoLink.href = `antrepo-giris-formu.html?id=${encodeURIComponent(item.entryId)}&view=true`;
      formNoLink.textContent = item.formNo || "-";
      formNoLink.classList.add("table-link");
      tdFormNo.appendChild(formNoLink);

      // 5) Antrepo Giriş Adedi
      const tdEntryCount = document.createElement("td");
      tdEntryCount.textContent = item.entryCount != null ? item.entryCount : "-";

      // 6) Antrepo Giriş Kap Adedi
      const tdEntryKap = document.createElement("td");
      tdEntryKap.textContent = item.entryKapCount != null ? item.entryKapCount : "-";

      // 7) Son Antrepo Çıkış Tarihi
      const tdLastExitDate = document.createElement("td");
      tdLastExitDate.textContent = formatDate(item.lastExitDate);

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

      // 13) Birim Maliyete Etkisi - Para birimi ile birlikte
      const tdUnitImpact = document.createElement("td");
      let mirrorUnitImpact = "...";
      tdUnitImpact.textContent = mirrorUnitImpact;  // Geçici değer

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

      // Hesaplama motoru verisini çek ve güncelle
      const calc = await fetchHesaplamaMotoru(item.entryId);
      
      // DOM elemanlarını bir kere seç ve değişkenlere ata
      const currentCostCell = tr.querySelector('td:nth-child(11)');
      const totalCostCell = tr.querySelector('td:nth-child(12)');
      const unitImpactCell = tr.querySelector('td:nth-child(13)');

      // null check ekleyelim
      if (currentCostCell && totalCostCell && unitImpactCell) {
        currentCostCell.textContent = `${calc.mevcutMaliyet.toFixed(2)} ${calc.paraBirimi}`;
        totalCostCell.textContent = `${calc.toplamMaliyet.toFixed(2)} ${calc.paraBirimi}`;
        unitImpactCell.textContent = calc.birimMaliyet 
          ? `${calc.birimMaliyet.toFixed(2)} ${calc.paraBirimi}`
          : `0.00 ${calc.paraBirimi}`;
      }
    }
  }

  await fetchMaliyetAnalizi();
});

// Excel export fonksiyonu
window.exportToExcel = function() {
    const table = document.getElementById("maliyetTable");
    const wb = XLSX.utils.table_to_book(table, { sheet: "Maliyet Analizi" });
    XLSX.writeFile(wb, `Maliyet_Analizi_${new Date().toISOString().split('T')[0]}.xlsx`);
};
