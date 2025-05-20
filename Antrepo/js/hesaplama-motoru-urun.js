document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const girisId = urlParams.get("entryId");
  if (!girisId) {
    alert("Geçersiz 'entryId' parametresi. Antrepo giriş ID'si URL'de bulunamadı.");
    return;
  }

  const tbody = document.querySelector("#urunCalculationTable tbody");
  const backBtn = document.getElementById("backBtn");
  backBtn.addEventListener("click", () => history.back());

  function formatCurrency(amount, currency) {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) return `0.00 ${currency}`;
    return `${numericAmount.toFixed(2)} ${currency}`;
  }
  function formatDateToTurkish(dateStr) {
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  }

  async function fetchAndRender() {
    try {
      const resp = await fetch(`/api/hesaplama-motoru-urun/${girisId}`);
      if (!resp.ok) throw new Error("Veri alınamadı");
      const data = await resp.json();
      const paraBirimi = data.paraBirimi || "USD";
      const dailyBreakdown = data.dailyBreakdown || [];

      let html = "";
      dailyBreakdown.forEach(dayRow => {
        const { day, date, products, dailyTotals } = dayRow;
        if (!products.length) return;

        products.forEach((p, idx) => {
          html += `
            <tr>
              <td>${idx === 0 ? day : ""}</td>
              <td>${formatDateToTurkish(date)}</td>
              <td>${p.urunAdi || "-"}</td>
              <td>${p.urunKodu || "-"}</td>
              <td>${formatCurrency(p.storageCost, paraBirimi)}</td>
              <td>${formatCurrency(p.servicesCost, paraBirimi)}</td>
              <td>${formatCurrency(p.dayTotal, paraBirimi)}</td>
              <td>${formatCurrency(p.cumulativeTotal, paraBirimi)}</td>
              <td>${(Number(p.remainingStock) || 0).toFixed(2)}</td>
            </tr>
          `;
        });

        // Günlük Genel Toplam satırı (her zaman 9 hücre!)
        html += `
          <tr class="daily-total-row" style="background:#e9ecef;font-weight:bold;border-top:2px solid #bbb;">
            <td></td> <!-- Gün için boş -->
            <td></td> <!-- Tarih için boş -->
            <td></td> <!-- Ürün Adı için boş -->
            <td style="text-align:right;">Günlük Genel Toplam</td> <!-- Ürün Kodu sütununa denk gelecek -->
            <td>${formatCurrency(dailyTotals.storageCost, paraBirimi)}</td>
            <td>${formatCurrency(dailyTotals.servicesCost, paraBirimi)}</td>
            <td>${formatCurrency(dailyTotals.dayTotal, paraBirimi)}</td>
            <td>${formatCurrency(dailyTotals.cumulativeTotal, paraBirimi)}</td>
            <td>${(Number(dailyTotals.remainingStock) || 0).toFixed(2)}</td>
          </tr>
        `;
      });

      tbody.innerHTML = html;

      // DataTable başlat (sadece ilk yüklemede başlat)
      if (!$.fn.DataTable.isDataTable('#urunCalculationTable')) {
        $('#urunCalculationTable').DataTable({
          responsive: true,
          autoWidth: false,
          searching: true,
          dom: '<"table-top"<"table-header-left"l><"table-header-right"f>>rt<"table-bottom"ip>',
          lengthMenu: [[10, 25, 50, 100], [10, 25, 50, 100]],
          pageLength: 25,
          pagingType: "simple_numbers",
          // language: { // CORS hatası olmaması için url satırını kaldır!
          //   url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/tr.json',
          //   paginate: {
          //     first: '«',
          //     previous: '‹',
          //     next: '›',
          //     last: '»'
          //   }
          // },
          ordering: false
        });
      }
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="9" class="error-message">Veri alınamadı: ${err.message}</td></tr>`;
    }
  }

  await fetchAndRender();
});