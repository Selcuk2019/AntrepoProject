// File: stock-card.js
import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async function() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  const stockDetailsDiv = document.getElementById("stockDetails");
  const stockDisplayDiv = document.getElementById("currentStockDisplay");
  const backBtn = document.getElementById("backBtn");

  if (!productId) {
    stockDetailsDiv.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>Ürün ID bulunamadı (URL parametresi eksik).</p>
      </div>`;
    return;
  }

  try {
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

        <div class="stock-amount">
          <div class="amount">0 Ton</div>
          <div class="label">Mevcut Stok</div>
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

        <div class="stock-footer">
          <button class="btn-back" onclick="window.location.href='product-list.html'">
            <i class="fas fa-arrow-left"></i>
            <span>Geri Dön</span>
          </button>
        </div>
      </div>
    `;

    // Stok miktarını güncelle
    const stockResp = await fetch(`${baseUrl}/api/stock-card/${productId}`);
    if (stockResp.ok) {
      const stockData = await stockResp.json();
      document.querySelector('.stock-amount .amount').textContent = `${stockData.currentStock} Ton`;
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
