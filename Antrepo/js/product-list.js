import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async function() {
  const table = $('#productTable').DataTable({
    ajax: {
      url: `${baseUrl}/api/urunler`,
      dataSrc: ''
    },
    columns: [
      { data: 'id' },
      { 
        data: 'name',
        render: function(data, type, row) {
          return `<a href="stock-card.html?id=${row.id}">${data}</a>`;
        }
      },
      { data: 'code' },
      { data: 'paket_hacmi', render: data => `${data || 0} kg` },
      { data: 'paketleme_tipi_name' },
      { 
        data: null,
        render: function(data, type, row) {
          return `
            <div class="action-buttons">
              <button class="modern-btn-icon modern-btn-edit" onclick="window.location.href='product-form.html?id=${row.id}'">
                <i class="fas fa-edit"></i>
              </button>
              <button class="modern-btn-icon modern-btn-view" onclick="window.location.href='stock-card.html?id=${row.id}'">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          `;
        }
      }
    ],
    responsive: true,
    language: {
      url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/tr.json"
    }
  });

  // Yeni Ürün Ekle butonu
  document.getElementById("newProductBtn").addEventListener("click", () => {
    window.location.href = "product-form.html";
  });
});
