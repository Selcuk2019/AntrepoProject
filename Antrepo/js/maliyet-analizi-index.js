import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("maliyetTableBody");
  let dataTable = null;

  // URL parametrelerini kontrol et
  const urlParams = new URLSearchParams(window.location.search);
  const filterValue = urlParams.get("filter");

  async function fetchMaliyetAnalizi() {
    try {
      // Tüm veriyi çek
      const resp = await fetch(`${baseUrl}/api/maliyet-analizi`);
      if (!resp.ok) throw new Error(`Hata: ${resp.status}`);
      let data = await resp.json();
      
      // Eğer filtre parametresi varsa, frontend'de filtrele
      if (filterValue) {
        // Sayı ise antrepoId, değilse productCode olarak filtrele
        if (!isNaN(parseInt(filterValue))) {
          data = data.filter(item => String(item.antrepoId) === String(filterValue));
        } else {
          data = data.filter(item => item.productCode === filterValue);
        }
        
        // Filtre bilgisini sayfada göster
        const filterInfo = document.createElement('div');
        filterInfo.className = 'filter-info alert alert-info';
        
        if (!isNaN(parseInt(filterValue))) {
          const antrepoName = data.length > 0 ? data[0].antrepoName : 'Belirtilen antrepo';
          filterInfo.textContent = `${antrepoName} antreposuna ait kayıtlar görüntüleniyor`;
        } else {
          const productName = data.length > 0 ? data[0].productName : 'Belirtilen ürün';
          filterInfo.textContent = `${productName} (${filterValue}) ürününe ait kayıtlar görüntüleniyor`;
        }
        
        // Filtre bilgisini başlığın altına ekle
        const pageHeader = document.querySelector('.page-header');
        if (pageHeader && !document.querySelector('.filter-info')) {
          pageHeader.appendChild(filterInfo);
        }
      }
      
      await populateTable(data);
      
      if (dataTable) {
        dataTable.destroy();
      }
      
      dataTable = $('#maliyetTable').DataTable({
        language: {
          url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/tr.json',
          paginate: {
            first: '«',
            previous: '‹',
            next: '›',
            last: '»'
          }
        },
        pageLength: 25,
        order: [[3, 'desc']], // Antrepo Giriş Tarihine göre sırala
        responsive: true,
        scrollX: true,
        dom: '<"table-top"<"table-header-left"l><"table-header-right"f>>rt<"table-bottom"ip>',
        lengthMenu: [[10, 25, 50, 100], [10, 25, 50, 100]],
        ordering: true,
        columnDefs: [
          {
            targets: '_all',
            sortable: true,
            className: 'sorting' // Sıralama için stil sınıfı ekle
          },
          {
            targets: -1, // Son sütun (Detay)
            sortable: false,
            className: 'no-sort'
          }
        ],
        initComplete: function() {
          // Arama kutusu ve sayfa başına gösterim seçicilerini özelleştir
          $('.dataTables_filter input').attr('placeholder', 'Ara...');
          $('.dataTables_filter input').addClass('modern-search');
          $('.dataTables_length select').addClass('modern-select');
        },
        drawCallback: function() {
          // Sıralama stillerini düzgün görüntüle
          $('th').removeClass('sorting_asc sorting_desc').addClass('sorting');
          $('th.sorting_1').addClass('sorting_asc');
        }
      });
      
      // Sorunu çözmek için CSS stillerini ekle
      const cssStyles = `
        .sorting:before, .sorting:after, 
        .sorting_asc:before, .sorting_asc:after, 
        .sorting_desc:before, .sorting_desc:after {
          opacity: 1 !important;
        }
        .sorting_asc:after, .sorting_desc:before {
          opacity: 0.2 !important;
        }
        table.dataTable thead th.sorting_asc,
        table.dataTable thead th.sorting_desc {
          background-color: #eef5ff !important;
        }
      `;
      
      // CSS stillerini sayfaya ekle
      const styleElement = document.createElement('style');
      styleElement.textContent = cssStyles;
      document.head.appendChild(styleElement);

    } catch (error) {
      console.error("Maliyet analizi verisi alınırken hata:", error);
      tableBody.innerHTML = `<tr><td colspan="15">Veri alınamadı: ${error.message}</td></tr>`;
    }
  }

  // Her bir antrepo girişinin hesaplama motoru verisini çeker.
  async function fetchHesaplamaMotoru(girisId) {
    try {
      const resp = await fetch(`${baseUrl}/api/hesaplama-motoru/${girisId}`);
      if (!resp.ok) throw new Error(`Hesaplama Motoru Hatası: ${resp.status}`);
      const calcData = await resp.json();

      // dailyBreakdown dizisindeki son satır verilerinden hesaplamaları alıyoruz
      const breakdown = calcData.dailyBreakdown || [];
      if (breakdown.length === 0) {
        return {
          mevcutMaliyet: 0,
          toplamMaliyet: 0,
          birimMaliyet: 0,
          paraBirimi: calcData.antrepoGiris?.para_birimi_iso || "USD"
        };
      }
      const lastRow = breakdown[breakdown.length - 1];
      const mevcutMaliyet = lastRow.dayTotal;
      const toplamMaliyet = lastRow.cumulative;
      const totalInitialStock = calcData.antrepoGiris?.miktar || 0;
      const birimMaliyet = totalInitialStock > 0 ? toplamMaliyet / totalInitialStock : 0;

      return {
        mevcutMaliyet,
        toplamMaliyet,
        birimMaliyet,
        paraBirimi: calcData.antrepoGiris?.para_birimi_iso || "USD"
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

  // Tarih formatlama yardımcı fonksiyonu (gg.aa.yyyy formatında)
  function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

  // Tabloyu doldurur: her bir giriş için tüm sütunları oluşturur
  async function populateTable(data) {
    tableBody.innerHTML = "";

    for (const item of data) {
      const tr = document.createElement("tr");

      // 1) Antrepo
      const tdAntrepoName = document.createElement("td");
      tdAntrepoName.textContent = item.antrepoName || "-";

      // 2) Ürün Adı – Link şeklinde (örn: stok kartı sayfasına yönlendirme)
      const tdProductName = document.createElement("td");
      tdProductName.innerHTML = `<a href="stock-card.html?id=${item.productId}" class="table-link">${item.productName || "-"}</a>`;

      // 3) Ürün Kodu – Link şeklinde
      const tdProductCode = document.createElement("td");
      tdProductCode.innerHTML = `<a href="stock-card.html?id=${item.productId}" class="table-link">${item.productCode || "-"}</a>`;

      // 4) Antrepo Giriş Tarihi
      const tdEntryDate = document.createElement("td");
      tdEntryDate.textContent = formatDate(item.entryDate);

      // 5) Antrepo Giriş Form No – Link (form detayına yönlendirme)
      const tdFormNo = document.createElement("td");
      const formNoLink = document.createElement("a");
      formNoLink.href = `antrepo-giris-formu.html?id=${encodeURIComponent(item.entryId)}&mode=view`;
      formNoLink.textContent = item.formNo || "-";
      formNoLink.classList.add("table-link");
      tdFormNo.appendChild(formNoLink);

      // 6) Antrepo Giriş Adedi
      const tdEntryCount = document.createElement("td");
      tdEntryCount.textContent = item.entryCount != null ? item.entryCount : "-";

      // 7) Antrepo Giriş Kap Adedi
      const tdEntryKap = document.createElement("td");
      tdEntryKap.textContent = item.entryKapCount != null ? item.entryKapCount : "-";

      // 8) Son Antrepo Çıkış Tarihi
      const tdLastExitDate = document.createElement("td");
      tdLastExitDate.textContent = formatDate(item.lastExitDate);

      // 9) Son Çıkış Adedi
      const tdLastExitAmount = document.createElement("td");
      tdLastExitAmount.textContent = item.lastExitAmount != null ? item.lastExitAmount : "-";

      // 10) Mevcut Stok (Ton)
      const tdCurrentStock = document.createElement("td");
      tdCurrentStock.textContent = item.currentStock != null
        ? parseFloat(item.currentStock).toFixed(2)
        : "-";

      // 11) Mevcut Kap Adedi
      const tdCurrentKap = document.createElement("td");
      tdCurrentKap.textContent = item.currentKapCount != null
        ? item.currentKapCount
        : "-";

      // 12) Mevcut Maliyet (Hesaplama motorundan gelecek)
      const tdCurrentCost = document.createElement("td");
      tdCurrentCost.textContent = "...";

      // 13) Toplam Maliyet – para birimiyle birlikte (veritabanı verisi; hesaplama motoru ile güncellenebilir)
      const tdTotalCost = document.createElement("td");
      tdTotalCost.textContent = item.totalCost != null && item.paraBirimi
        ? parseFloat(item.totalCost).toFixed(2) + ' ' + item.paraBirimi
        : "-";

      // 14) Birim Maliyete Etkisi – hesaplama motorundan gelecek
      const tdUnitImpact = document.createElement("td");
      tdUnitImpact.textContent = "...";

      // 15) Detay Linki – hesaplama motoru detay sayfasına yönlendirme
      const tdDetail = document.createElement("td");
      const detailLink = document.createElement("a");
      detailLink.textContent = "Detay";
      detailLink.href = `hesaplama-motoru.html?entryId=${encodeURIComponent(item.entryId)}`;
      detailLink.classList.add("btn-detail");
      tdDetail.appendChild(detailLink);

      // Satırdaki tüm hücreleri ekle
      tr.append(
        tdAntrepoName,
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

      // Hesaplama motorundan veriyi çek ve ilgili hücreleri güncelle (12. sütun: Mevcut Maliyet, 13. sütun: Toplam Maliyet, 14. sütun: Birim Maliyet)
      const calc = await fetchHesaplamaMotoru(item.entryId);
      // Satırdaki td'ler 0 tabanlı indeksle: 11, 12 ve 13. elemanlar
      if (tr.children.length >= 15) {
        tr.children[11].textContent = calc.mevcutMaliyet != null && calc.paraBirimi
          ? parseFloat(calc.mevcutMaliyet).toFixed(2) + ' ' + calc.paraBirimi
          : "-";
        tr.children[12].textContent = calc.toplamMaliyet != null && calc.paraBirimi
          ? parseFloat(calc.toplamMaliyet).toFixed(2) + ' ' + calc.paraBirimi
          : "-";
        tr.children[13].textContent = calc.birimMaliyet != null && calc.paraBirimi
          ? `${parseFloat(calc.birimMaliyet).toFixed(2)} ${calc.paraBirimi}`
          : `0.00 ${calc.paraBirimi}`;
      }
    }
  }

  await fetchMaliyetAnalizi();
});

// Excel'e aktarma fonksiyonu (XLSX kütüphanesi gerektirir)
window.exportToExcel = function() {
  const table = document.getElementById("maliyetTable");
  const wb = XLSX.utils.table_to_book(table, { sheet: "Maliyet Analizi" });
  XLSX.writeFile(wb, `Maliyet_Analizi_${new Date().toISOString().split('T')[0]}.xlsx`);
};
