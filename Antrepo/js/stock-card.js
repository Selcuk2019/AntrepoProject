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
      stockDisplay.innerHTML = `
        <strong>Güncel Stok:</strong> 
        <span>${data.currentStock.toFixed(2)} Ton</span>
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
    // API endpoint'i güncellendi
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
        </tr>
      </thead>
      <tbody></tbody>
    `;
    $('#variantsTable').html(tableHtml);
    
    // DataTables'ı başlat
    const dataTable = $('#variantsTable').DataTable({
      data: variants,
      columns: [
        { data: 'id' },
        { data: 'paket_hacmi' },
        { data: 'paketleme_tipi_adi' },
        { 
          data: 'olusturulma_tarihi',
          render: (data) => data ? new Date(data).toLocaleDateString('tr-TR') : '-'
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
