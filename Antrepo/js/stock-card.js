// File: stock-card.js
import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async function() {
  // URL parametresinden ürün ID'sini al
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  // DOM elementlerini seç
  const stockDetailsDiv = document.getElementById("stockDetails");
  const stockDisplayDiv = document.getElementById("currentStockDisplay");
  const stockAmountsTable = document.getElementById("stockAmountsTable");
  const stockMovementsTable = document.getElementById("stockMovementsTable");
  const productVariantsTable = document.getElementById("productVariantsTable");

  // Tab switching fonksiyonalitesi
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Aktif sekme sınıflarını temizle
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Tıklanan sekmeyi ve içeriğini aktif yap
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });

  if (!productId) {
    stockDetailsDiv.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>Ürün ID bulunamadı (URL parametresi eksik).</p>
      </div>`;
    return;
  }

  try {
    // Ürün detaylarını getir
    const productResp = await fetch(`${baseUrl}/api/urunler/${productId}`);
    if (!productResp.ok) throw new Error(productResp.status === 404 ? "Ürün bulunamadı." : "Sunucu hatası");
    const product = await productResp.json();

    // Ana kart içeriğini oluştur
    stockDetailsDiv.innerHTML = `
      <div class="stock-card">
        <div class="stock-header">
          <h2>${product.name}</h2>
          <div class="code">Ürün Kodu: ${product.code}</div>
        </div>

        <div class="stock-details">
          <div class="detail-row">
            <div class="detail-label">Ürün ID</div>
            <div class="detail-value">${product.id}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Paket Hacmi</div>
            <div class="detail-value">${product.paket_hacmi || 0} kg</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Paketleme Tipi</div>
            <div class="detail-value">${product.paketleme_tipi_name || "Belirtilmedi"}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Son Güncelleme</div>
            <div class="detail-value">${new Date().toLocaleDateString('tr-TR')}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Açıklama</div>
            <div class="detail-value">${product.description || "Belirtilmedi"}</div>
          </div>
        </div>
      </div>
    `;

    // Stok miktarını güncelle
    const stockResp = await fetch(`${baseUrl}/api/stock-card/${productId}`);
    if (stockResp.ok) {
      const stockData = await stockResp.json();
      stockDisplayDiv.innerHTML = `<div class="amount">${stockData.currentStock} Ton</div>
                                   <div class="label">Toplam Mevcut Stok</div>`;
      
      // Stok Miktarları tablosunu doldur
      if (stockData.locations && stockData.locations.length > 0) {
        stockAmountsTable.innerHTML = stockData.locations.map(loc => `
          <tr>
            <td>${loc.depo_adi}</td>
            <td>${loc.miktar} Ton</td>
            <td>${loc.birim || "Ton"}</td>
            <td>${new Date(loc.guncelleme_tarihi).toLocaleDateString('tr-TR')}</td>
          </tr>
        `).join('');
      } else {
        stockAmountsTable.innerHTML = `<tr><td colspan="4" class="text-center">Stok miktarı bulunamadı</td></tr>`;
      }
    }
    
    // Stok Hareketleri verisini getir ve doldur
    const movementsResp = await fetch(`${baseUrl}/api/stock-movements/${productId}`);
    if (movementsResp.ok) {
      const movementsData = await movementsResp.json();
      if (movementsData && movementsData.length > 0) {
        stockMovementsTable.innerHTML = movementsData.map(move => `
          <tr>
            <td>${new Date(move.tarih).toLocaleDateString('tr-TR')}</td>
            <td>${move.islem_tipi}</td>
            <td>${move.miktar} ${move.birim || "Ton"}</td>
            <td>${move.birim || "Ton"}</td>
            <td>${move.antrepo_adi}</td>
            <td>${move.belge_no || "-"}</td>
            <td>${move.aciklama || "-"}</td>
          </tr>
        `).join('');
      } else {
        stockMovementsTable.innerHTML = `<tr><td colspan="7" class="text-center">Stok hareketi bulunamadı</td></tr>`;
      }
    } else {
      stockMovementsTable.innerHTML = `<tr><td colspan="7" class="text-center">Stok hareketleri yüklenirken hata oluştu</td></tr>`;
    }
    
    // Ürün varyantları verisini getir ve doldur
    const variantsResp = await fetch(`${baseUrl}/api/product-variants/${productId}`);
    if (variantsResp.ok) {
      const variantsData = await variantsResp.json();
      if (variantsData && variantsData.length > 0) {
        productVariantsTable.innerHTML = variantsData.map(variant => `
          <tr>
            <td>${variant.kod}</td>
            <td>${variant.ad}</td>
            <td>${variant.ozellikler || "-"}</td>
            <td>${variant.stok_miktari} ${variant.birim || "Ton"}</td>
            <td>${variant.birim || "Ton"}</td>
          </tr>
        `).join('');
      } else {
        productVariantsTable.innerHTML = `<tr><td colspan="5" class="text-center">Bu ürüne ait varyant bulunamadı</td></tr>`;
      }
    } else {
      productVariantsTable.innerHTML = `<tr><td colspan="5" class="text-center">Ürün varyantları yüklenirken hata oluştu</td></tr>`;
    }

  } catch (error) {
    console.error("Hata:", error);
    stockDetailsDiv.innerHTML = `
      <div class="stock-card">
        <div class="stock-header">
          <h2>Hata</h2>
          <div class="code">${error.message}</div>
        </div>
        <div class="stock-footer">
          <button class="btn-back" onclick="window.location.href='product-list.html'">
            <i class="fas fa-arrow-left"></i>
            <span>Geri Dön</span>
          </button>
        </div>
      </div>`;
  }
});
