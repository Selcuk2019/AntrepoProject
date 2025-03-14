// File: stock-card.js
import { baseUrl } from './config.js';

// Global değişken olarak productId'yi tanımla
let productId;

// Declare variantsTable globally
let variantsTable;

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  productId = params.get('id'); // Global değişkene ata
  
  if (!productId) {
    alert('Ürün ID bulunamadı!');
    return;
  }

  // productId'yi window objesine de ekle
  window.productId = productId;

  try {
    // Ürün detaylarını getir
    const response = await fetch(`${baseUrl}/api/urunler/${productId}`);
    if (!response.ok) throw new Error('Ürün bilgileri alınamadı');
    const product = await response.json();
    
    // Stok detaylarını göster
    displayStockDetails(product);
    
    // Load each component individually and catch errors separately
    try {
      await loadCurrentStock(productId);
    } catch (err) {
      console.error("Current stock loading error:", err);
    }
    
    try {
      await loadStockAmounts(product.code);
    } catch (err) {
      console.error("Stock amounts loading error:", err);
    }
    
    try {
      await loadProductVariants(productId);
    } catch (err) {
      console.error("Product variants loading error:", err);
    }
    
    try {
      await loadStockMovements();
    } catch (err) {
      console.error("Stock movements loading error:", err);
    }

  } catch (error) {
    console.error('Veri yükleme hatası:', error);
    alert('Veriler yüklenirken bir hata oluştu!');
  }
});

// Ürün detaylarını görüntüleme fonksiyonu
function displayStockDetails(product) {
  const stockDetails = document.getElementById('stockDetails');
  if (!stockDetails) return;

  stockDetails.innerHTML = `
    <div class="detail-row">
      <strong>Ürün Adı:</strong> 
      <span>${product.name || '-'}</span>
    </div>
    <div class="detail-row">
      <strong>Ürün Kodu:</strong> 
      <span>${product.code || '-'}</span>
    </div>
    <div class="detail-row">
      <strong>Paket Hacmi:</strong> 
      <span>${product.paket_hacmi ? `${product.paket_hacmi} kg` : '-'}</span>
    </div>
    <div class="detail-row">
      <strong>Paketleme Tipi:</strong> 
      <span>${product.paketleme_tipi_name || '-'}</span>
    </div>
    <div class="detail-row">
      <strong>Açıklama:</strong> 
      <span>${product.description || '-'}</span>
    </div>
  `;
}

// Güncel stok bilgisini getir ve göster
async function loadCurrentStock(productId) {
  try {
    const response = await fetch(`${baseUrl}/api/stock-card/${productId}`);
    if (!response.ok) {
      throw new Error('Stok bilgisi alınamadı');
    }
    
    const data = await response.json();
    console.log("Stok bilgisi:", data);
    
    // currentStockDisplay'i güncelle - burası eksikti
    const currentStockDisplay = document.getElementById('currentStockDisplay');
    if (currentStockDisplay) {
      currentStockDisplay.innerHTML = `
        <strong>Toplam Stok:</strong> 
        <span>${data.toplam_stok || '0'} ton</span>
        <strong style="margin-left: 15px;">Toplam Kap Adedi:</strong> 
        <span>${data.toplam_kap || '0'}</span>
      `;
    }
    
    // Stok tablosuna veri ekleme - ADD NULL CHECK HERE
    const stockTableBody = document.getElementById('stockTableBody');
    if (stockTableBody) { // Add null check
      stockTableBody.innerHTML = '';
      
      if (data.stok_durumu && data.stok_durumu.length > 0) {
        data.stok_durumu.forEach(stock => {
          if (parseFloat(stock.net_miktar) > 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${stock.antrepo_adi}</td>
              <td>${stock.net_miktar}</td>
              <td>${stock.net_kap}</td>
              <td>${stock.stok_durumu}</td>
            `;
            stockTableBody.appendChild(row);
          }
        });
      } else {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="4" class="text-center">Stok bulunamadı</td>`;
        stockTableBody.appendChild(row);
      }
    } else {
      console.warn("Element with ID 'stockTableBody' not found in the DOM");
    }
    
    // Add null checks for other elements
    const totalStockElement = document.getElementById('totalStock');
    if (totalStockElement) {
      totalStockElement.textContent = data.toplam_stok || '0';
    }
    
    const totalPackageElement = document.getElementById('totalPackage');
    if (totalPackageElement) {
      totalPackageElement.textContent = data.toplam_kap || '0';
    }
    
    return data;
  } catch (error) {
    console.error("Stok bilgisi yükleme hatası:", error);
    
    // currentStockDisplay hata durumunu da güncelle
    const currentStockDisplay = document.getElementById('currentStockDisplay');
    if (currentStockDisplay) {
      currentStockDisplay.innerHTML = `
        <span class="text-danger">Stok bilgisi yüklenemedi: ${error.message}</span>
      `;
    }
    
    const stockTableBody = document.getElementById('stockTableBody');
    if (stockTableBody) { // Add null check here too
      stockTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Hata: ${error.message}</td></tr>`;
    }
    return null;
  }
}

// Stok hareketlerini getir
async function loadStockMovements() {
  try {
    const response = await fetch(`${baseUrl}/api/product-movements/${productId}`);
    if (!response.ok) throw new Error('Stok hareketleri alınamadı');
    const movements = await response.json();
    
    // Initialize DataTable
    const table = $('#stockMovementsTable').parents('table').DataTable({
      data: movements,
      destroy: true, // Destroy existing table if any
      columns: [
        { 
          data: 'islem_tarihi',
          title: 'Tarih',
          render: function(data) {
            return new Date(data).toLocaleDateString();
          }
        },
        { data: 'islem_tipi', title: 'İşlem Tipi' },
        { data: 'miktar', title: 'Miktar' },
        { data: 'birim_adi', title: 'Birim' },
        { data: 'antrepo_adi', title: 'Antrepo' },
        { 
          data: 'beyanname_no', // Antrepo giriş formundan gelen beyanname no
          title: 'Belge No',
          defaultContent: '-'
        },
        { data: 'aciklama', title: 'Açıklama' }
      ],
      order: [[0, 'desc']], // Sort by date descending by default
      language: {
        url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/tr.json"
      }
    });
  } catch (error) {
    console.error('Stok hareketleri yükleme hatası:', error);
  }
}

// Varyantları getir - DataTables kullanarak
async function loadProductVariants(productId) {
  try {
    // First make sure the DataTable container is visible
    const tableContainer = document.querySelector('#urun-varyantlari .table-responsive');
    if (tableContainer) {
      tableContainer.style.display = 'block';
    }
    
    // Fetch variants with stock information
    const response = await fetch(`${baseUrl}/api/urun-varyantlari/with-stock/${productId}`);
    if (!response.ok) {
      throw new Error('Varyant bilgileri alınamadı');
    }
    
    const data = await response.json();
    
    console.log("Varyant API Response:", data);
    if (data.length === 0) {
      console.warn("API returned empty dataset for variants");
    } else {
      console.log("Sample variant data structure:", data[0]);
    }
    
    // Always destroy existing table before re-initializing
    if ($.fn.DataTable.isDataTable('#variantsTable')) {
      $('#variantsTable').DataTable().destroy();
    }
    
    // Make sure the table has a tbody
    if ($('#variantsTable tbody').length === 0) {
      $('#variantsTable').append('<tbody></tbody>');
    }
    
    // Initialize DataTable with explicit column definitions
    variantsTable = $('#variantsTable').DataTable({
      data: data,
      responsive: true,
      columns: [
        { 
          title: "Paketleme Tipi", 
          data: "description",
          render: function(data) {
            return data || '-';
          }
        },
        { 
          title: "Paket Boyutu", 
          data: "paket_hacmi",
          render: function(data) {
            return data ? data + ' Kg' : '-';
          }
        },
        { 
          title: "Mevcut Stok", 
          data: "mevcut_stok",
          render: function(data) {
            return data !== undefined ? data + ' ton' : '0 ton';
          }
        },
        { 
          title: "İşlemler", 
          data: "id",
          orderable: false,
          render: function(data) {
            return `
              <button onclick="editVariant(${data})" class="btn btn-sm btn-primary">
                <i class="fas fa-edit"></i> Düzenle
              </button>
              <button onclick="deleteVariant(${data})" class="btn btn-sm btn-danger">
                <i class="fas fa-trash"></i> Sil
              </button>
            `;
          }
        }
      ],
      language: {
        url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/tr.json"
      },
      drawCallback: function() {
        console.log("DataTable draw complete");
      }
    });
    
    return data;
  } catch (error) {
    console.error("Varyant bilgileri yükleme hatası:", error);
    
    // Cleanup and show error in table
    if ($.fn.DataTable.isDataTable('#variantsTable')) {
      $('#variantsTable').DataTable().destroy();
    }
    
    $('#variantsTable').find('tbody').html('<tr><td colspan="4" class="text-center text-danger">Hata: ' + error.message + '</td></tr>');
    
    return [];
  }
}

// Varyant düzenleme fonksiyonu 
window.editVariant = function(varyantId) {
  window.location.href = `product-form.html?mode=edit&varyantId=${varyantId}&urunId=${productId}`;
};

// Varyant silme fonksiyonu
window.deleteVariant = async function(varyantId) {
  if (!confirm('Bu varyantı silmek istediğinizden emin misiniz?')) {
    return;
  }
  
  try {
    const response = await fetch(`${baseUrl}/api/urun_varyantlari/${varyantId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Varyant silinemedi');
    }
    
    // Varyant listesini güncelle
    await loadProductVariants(productId);
    
  } catch (error) {
    console.error('Varyant silme hatası:', error);
    alert('Varyant silinirken bir hata oluştu');
  }
}

// Antrepo bazlı stok miktarlarını getir
async function loadStockAmounts(productCode) {
  if (!productCode) return;
  
  try {
    const response = await fetch(`${baseUrl}/api/stock-amounts/${encodeURIComponent(productCode)}`);
    if (!response.ok) throw new Error('Stok miktarları alınamadı');
    const data = await response.json();
    
    // Initialize DataTable
    $('#stockAmountsTable').parents('table').DataTable({
      data: data,
      destroy: true, // Destroy existing table if any
      columns: [
        { data: 'Antrepo', title: 'Antrepo' },
        { 
          data: 'Miktar', 
          title: 'Miktar (ton)',
          render: function(data) {
            return parseFloat(data).toFixed(2);
          }
        },
        { data: 'KapAdeti', title: 'Kap Adeti' },
        { data: 'FormAdeti', title: 'Antrepo Formu Adeti' }
      ],
      language: {
        url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/tr.json"
      }
    });
    
  } catch (error) {
    console.error('Stok miktarları yükleme hatası:', error);
  }
}

// ... diğer yardımcı fonksiyonlar ...

// Sekme değiştirme fonksiyonalitesi
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    // Aktif sekmeyi değiştir
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    
    // İlgili içeriği göster
    const tabId = button.getAttribute('data-tab');
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
      if (content.id === tabId) {
        content.classList.add('active');
      }
    });
  });
});
