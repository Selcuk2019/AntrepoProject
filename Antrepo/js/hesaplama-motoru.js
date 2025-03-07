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
    if (!result) {
      console.error('Result verisi boş');
      return;
    }

    const { antrepoGiris, dailyBreakdown = [], totalCost = 0 } = result;
    // Para birimi bilgisini ISO kodundan al
    const paraBirimi = antrepoGiris?.para_birimi_iso || 'USD';

    // Summary info güvenli atamalar
    beyannameNoSpan.textContent = antrepoGiris?.beyanname_no || "-";
    girisTarihiSpan.textContent = antrepoGiris?.antrepo_giris_tarihi
      ? new Date(antrepoGiris.antrepo_giris_tarihi).toLocaleDateString('tr-TR')
      : "-";
    urunAdiSpan.textContent = antrepoGiris?.urun_adi || "-";
    urunKoduSpan.textContent = antrepoGiris?.urun_kodu || "-";
    initialStockSpan.textContent = result.currentStock.toFixed(2);

    dailyTableBody.innerHTML = "";
    
    dailyBreakdown.forEach((row) => {
      if (!row) return;

      const tr = document.createElement("tr");
      
      tr.innerHTML = `
        <td>${row.dayIndex}</td>
        <td>${row.date}</td>
        <td>${row.dayArdiye.toFixed(2)} ${paraBirimi}</td>
        <td>${row.dayEkHizmet.toFixed(2)} ${paraBirimi}</td>
        <td>${row.dayTotal.toFixed(2)} ${paraBirimi}</td>
        <td>${row.cumulative.toFixed(2)} ${paraBirimi}</td>
        <td>${row.stockAfter.toFixed(2)}</td>
      `;

      dailyTableBody.appendChild(tr);
    });

    totalMaliyetSpan.textContent = `${totalCost.toFixed(2)} ${paraBirimi}`;
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
