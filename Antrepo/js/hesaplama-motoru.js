import dayjs from 'https://cdn.skypack.dev/dayjs';
import utc from 'https://cdn.skypack.dev/dayjs/plugin/utc';
import timezone from 'https://cdn.skypack.dev/dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

// hesaplama-motoru.js
// Bu dosya, hesaplama motoru sayfasında (hesaplama-motoru.html) kullanılan JS kodudur.
// /api/hesaplama-motoru/:girisId endpoint'ine istek atarak gelen verileri tabloya doldurur.

// Remove or comment out the import if not needed
// import { baseUrl } from './config.js';

// Add helper to format date from yyyy-mm-dd to dd.mm.yyyy
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const girisId = urlParams.get("id"); // "entryId" yerine "id" kullan

  if (!girisId) {
    alert("Geçersiz 'id' parametresi. Antrepo giriş ID'si URL'de bulunamadı."); // Hata mesajını da güncelleyebiliriz
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
      // Use window.location.origin to build the API URL dynamically.
      const apiUrl = `${window.location.origin}/api/hesaplama-motoru/${girisId}`;
      const resp = await fetch(apiUrl);
      if (resp.status === 404) {
        // No record exists yet for this entry
        console.warn("Antrepo giriş formu için henüz veri yok.");
        dailyTableBody.innerHTML = `<tr>
          <td colspan="7" class="info-message">
            Henüz antrepo giriş formu üzerinden kayıt yapılmamıştır.
          </td>
        </tr>`;
        return; // Exit quietly without error
      }
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

  function formatDateToTurkish(dateStr) {
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  }

  function populateResults(result) {
    if (!result) {
      console.error('Result verisi boş');
      return;
    }

    const { antrepoGiris, dailyBreakdown = [], totalCost = 0 } = result;
    const paraBirimi = antrepoGiris?.para_birimi_iso || 'USD';

    // Remove tz conversion so that the date remains as stored (local)
    beyannameNoSpan.textContent = antrepoGiris?.beyanname_no || "-";
    girisTarihiSpan.textContent = antrepoGiris?.antrepo_giris_tarihi
      ? dayjs(antrepoGiris.antrepo_giris_tarihi).format('YYYY-MM-DD')
      : "-";
    urunAdiSpan.textContent = antrepoGiris?.urun_adi || "-";
    urunKoduSpan.textContent = antrepoGiris?.urun_kodu || "-";
    initialStockSpan.textContent = (Number(result.currentStock) || 0).toFixed(2);

    // Format currency values properly
    function formatCurrency(amount, currency) {
      // Ensure amount is a number, default to 0 if not.
      const numericAmount = Number(amount);
      if (isNaN(numericAmount)) {
        return `0.00 ${currency}`;
      }
      return `${numericAmount.toFixed(2)} ${currency}`;
    }

    dailyTableBody.innerHTML = "";
    
    dailyBreakdown.forEach((row) => {
      if (!row) return;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.day}</td>
        <td>${formatDateToTurkish(dayjs(row.date).format('YYYY-MM-DD'))}</td>
        <td>${formatCurrency(row.storageCost, paraBirimi)}</td>
        <td>${formatCurrency(row.servicesCost, paraBirimi)}</td>
        <td>${formatCurrency(row.dayTotal, paraBirimi)}</td>
        <td>${formatCurrency(row.cumulativeTotal, paraBirimi)}</td>
        <td>${(Number(row.remainingStock) || 0).toFixed(2)}</td>
      `;
      dailyTableBody.appendChild(tr);
    });

    totalMaliyetSpan.textContent = `${totalCost.toFixed(2)} ${paraBirimi}`;

    // DataTable initialization
    $('#calculationTable').DataTable({
      responsive: true,
      autoWidth: false,
      searching: true,
      // DOM yapılandırmasını ve sayfalama stilini güncelliyoruz
      dom: '<"table-top"<"table-header-left"l><"table-header-right"f>>rt<"table-bottom"ip>',
      lengthMenu: [[10, 25, 50, 100], [10, 25, 50, 100]],
      pageLength: 25,
      pagingType: "simple_numbers",
      language: {
        url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/tr.json',
        paginate: {
          first: '«',
          previous: '‹',
          next: '›',
          last: '»'
        }
      },
      ordering: true,
      order: [[0, 'asc']]
    });
  }

  try {
    await fetchCalculation();
  } catch (error) {
    console.error("Hesaplama yüklenirken hata:", error);
    // Kullanıcıya hata göster
    dailyTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="error-message">
          Hesaplama yüklenirken hata oluştu: ${error.message}
        </td>
      </tr>
    `;
  }

  // DataTable initialization was causing "$ is not defined"
  // Comment out or remove the following block if jQuery is not loaded:
  // const dailyTable = $('.datatable').DataTable({
  //   // ...existing columns config...
    
  //   responsive: true,
  //   autoWidth: false,
  //   searching: true,
  //   dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
  //        '<"row"<"col-sm-12"tr>>' +
  //        '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
  //   lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Tümü"]],
  //   pageLength: 10,
  //   lengthChange: true,
  //   language: {
  //       url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/tr.json',
  //       lengthMenu: 'Sayfa başına _MENU_ kayıt göster',
  //       info: 'Toplam _TOTAL_ kayıttan _START_ - _END_ arası gösteriliyor',
  //       paginate: {
  //           first: '<i class="fas fa-angle-double-left"></i>',
  //           previous: '<i class="fas fa-angle-left"></i>',
  //           next: '<i class="fas fa-angle-right"></i>',
  //           last: '<i class="fas fa-angle-double-right"></i>'
  //       }
  //   }
  // });
});
