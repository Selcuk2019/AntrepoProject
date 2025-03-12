// File: stock-card.js
import { baseUrl } from './config.js';

// Global değişken olarak productId'yi tanımla
let productId;

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
    
    // Güncel stok miktarını getir
    await loadCurrentStock();
    
    // Antrepo bazlı stok miktarlarını getir
    await loadStockAmounts(product.code);
    
    // Varyantları getir
    await loadProductVariants();
    
    // Stok hareketlerini getir
    await loadStockMovements();

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
async function loadCurrentStock() {
  try {
    const response = await fetch(`${baseUrl}/api/stock-card/${productId}`);
    if (!response.ok) throw new Error('Stok bilgisi alınamadı');
    const data = await response.json();
    
    const stockDisplay = document.getElementById('currentStockDisplay');
    if (stockDisplay) {
      // Sayısal değer kontrolü yapalım ve sonra toFixed kullanalım
      const stockValue = typeof data.currentStock === 'number' 
        ? data.currentStock.toFixed(2) 
        : parseFloat(data.currentStock || 0).toFixed(2);
        
      stockDisplay.innerHTML = `
        <strong>Güncel Stok:</strong> 
        <span>${stockValue} Ton</span>
      `;
    }
  } catch (error) {
    console.error('Stok bilgisi yükleme hatası:', error);
  }
}

// Stok hareketlerini getir
async function loadStockMovements() {
  try {
    const response = await fetch(`${baseUrl}/api/antrepo-giris/${productId}/hareketler`);
    if (!response.ok) throw new Error('Stok hareketleri alınamadı');
    const movements = await response.json();
    
    // Verileri tabloya doldur
    const tbody = document.getElementById('stockMovementsTable');
    tbody.innerHTML = movements.map(m => `
      <tr>
        <td>${new Date(m.islem_tarihi).toLocaleDateString()}</td>
        <td>${m.islem_tipi}</td>
        <td>${m.miktar}</td>
        <td>${m.birim_adi || '-'}</td>
        <td>${m.antrepo_adi || '-'}</td>
        <td>${m.belge_no || '-'}</td>
        <td>${m.aciklama || '-'}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Stok hareketleri yükleme hatası:', error);
  }
}

// Varyantları getir
async function loadProductVariants() {
  try {
    const response = await fetch(`${baseUrl}/api/urun_varyantlari?urunId=${productId}`);
    if (!response.ok) throw new Error('Varyant bilgileri alınamadı');
    const variants = await response.json();
    
    console.log('Yüklenen varyantlar:', variants); // Debug log

    // Önce mevcut DataTable'ı güvenli bir şekilde yok et
    if ($.fn.DataTable.isDataTable('#variantsTable')) {
      $('#variantsTable').DataTable().destroy();
    }
    
    // HTML tabloyu hazırla
    const tableHtml = `
      <thead>
        <tr>
          <th>ID</th>
          <th>Paket Hacmi (kg)</th>
          <th>Paketleme Tipi</th>
          <th>Oluşturulma Tarihi</th>
          <th>İşlemler</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    $('#variantsTable').html(tableHtml);
    
    // DataTables'ı başlat
    const dataTable = $('#variantsTable').DataTable({
      data: variants,
      columns: [
        // id alanı yoksa veya variantlar farklı yapıdaysa düzeltin
        { data: 'id', defaultContent: '-' }, // defaultContent ekleyerek null değerleri ele alıyoruz
        { data: 'paket_hacmi', defaultContent: '-' },
        { data: 'paketleme_tipi_adi', defaultContent: '-' },
        { 
          data: 'olusturulma_tarihi',
          render: function(data) {
            return data ? new Date(data).toLocaleDateString('tr-TR') : '-';
          },
          defaultContent: '-'
        },
        {
          data: null,
          orderable: false,
          render: function(data, type, row) {
            // id kontrolü ekleyelim
            const variantId = row.id || '';
            return `
              <div class="action-buttons">
                <button onclick="editVariant('${variantId}')" class="btn-icon btn-edit">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteVariant('${variantId}')" class="btn-icon btn-delete">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            `;
          }
        }
      ],
      language: {
        url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/tr.json'
      },
      responsive: true,
      order: [[0, 'desc']],
      pageLength: 10,
      dom: 'rtip',
      searching: false
    });

  } catch (error) {
    console.error('Varyant bilgileri yükleme hatası:', error);
    
    // Hata durumunda basit bir tablo göster
    if ($.fn.DataTable.isDataTable('#variantsTable')) {
      $('#variantsTable').DataTable().destroy();
    }
    
    $('#variantsTable').html(`
      <thead>
        <tr>
          <th>ID</th>
          <th>Paket Hacmi (kg)</th>
          <th>Paketleme Tipi</th>
          <th>Oluşturulma Tarihi</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colspan="4" class="text-center">Varyant bulunamadı veya yüklenirken hata oluştu</td>
        </tr>
      </tbody>
    `);
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
    
    // Tabloyu yenile
    await loadProductVariants();
    
  } catch (error) {
    console.error('Varyant silme hatası:', error);
    alert('Varyant silinirken bir hata oluştu');
  }
}

// Antrepo bazlı stok miktarları
async function loadStockAmounts(productCode) {
  if (!productCode) return;
  
  try {
    const response = await fetch(`${baseUrl}/api/stock-amounts/${encodeURIComponent(productCode)}`);
    if (!response.ok) throw new Error('Stok miktarları alınamadı');
    const data = await response.json();
    
    // Verileri tabloya doldur
    const tbody = document.getElementById('stockAmountsTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (data.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="4" class="text-center">Bu ürün için stok bulunamadı.</td>';
      tbody.appendChild(tr);
      return;
    }
    
    // Her antrepo için bir satır oluştur
    data.forEach(item => {
      const tr = document.createElement('tr');
      
      // Değerlerin sayı kontrolünü yaparak ekliyoruz
      const miktar = typeof item.Miktar === 'number' ? item.Miktar.toFixed(2) : parseFloat(item.Miktar || 0).toFixed(2);
      const kapAdeti = item.KapAdeti || '0';
      const formAdeti = item.FormAdeti || '0';
      
      tr.innerHTML = `
        <td>${item.Antrepo || '-'}</td>
        <td>${miktar}</td>
        <td>${kapAdeti}</td>
        <td>${formAdeti}</td>
      `;
      tbody.appendChild(tr);
    });
    
  } catch (error) {
    console.error('Stok miktarları yükleme hatası:', error);
    const tbody = document.getElementById('stockAmountsTable');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center">Hata: ${error.message}</td></tr>`;
    }
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
