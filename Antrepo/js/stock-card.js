// File: stock-card.js
import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async function() {
  // URL'den ?id=xxx parametresini al (Ürün ID)
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  const stockDetailsDiv = document.getElementById("stockDetails");
  const stockDisplayDiv = document.getElementById("currentStockDisplay");
  const backBtn = document.getElementById("backBtn");

  if (!productId) {
    stockDetailsDiv.innerHTML = "<p>Ürün ID bulunamadı (URL parametresi eksik).</p>";
    return;
  }

  try {
    // Ürün detaylarını API'den çek
    const productResp = await fetch(`${baseUrl}/api/urunler/${productId}`);
    if (!productResp.ok) {
      if (productResp.status === 404) {
        throw new Error("Ürün bulunamadı (404).");
      } else {
        throw new Error(`Sunucu hatası: ${productResp.status}`);
      }
    }
    const product = await productResp.json();

    // Ürün bilgilerini oluştur ve DOM'a yaz
    stockDetailsDiv.innerHTML = `
      <div class="stock-karti-header">Ürün Bilgileri</div>
      <p><span>Ürün ID:</span> ${product.id}</p>
      <p><span>Ürün Adı:</span> ${product.name}</p>
      <p><span>Ürün Kodu:</span> ${product.code}</p>
      <p><span>Paket Hacmi (kg):</span> ${product.paket_hacmi || 0}</p>
      <p><span>Paketleme Tipi:</span> ${product.paketleme_tipi_name || "Belirtilmedi"}</p>
      <p><span>Açıklama:</span> ${product.description || ""}</p>
      <hr>
    `;

    // Güncel stok bilgisini çekmek için varsayımsal endpoint
    // Bu endpoint, ilgili ürünün tüm antrepo giriş/çıkış hareketlerinin hesaplanmasıyla güncel stok (ton) bilgisini döndürmelidir.
    const stockResp = await fetch(`${baseUrl}/api/stock-card/${productId}`);
    let currentStock = 0;
    if (stockResp.ok) {
      const stockData = await stockResp.json();
      currentStock = stockData.currentStock;
    } else {
      console.warn("Güncel stok bilgisi alınamadı, default 0 kullanılıyor.");
    }
    
    // Güncel stok bilgisini şık şekilde göster
    stockDisplayDiv.innerHTML = `<p><span>Mevcut Stok (Ton):</span> ${currentStock}</p>`;

  } catch (error) {
    console.error("Stok kartı yükleme hatası:", error);
    stockDetailsDiv.innerHTML = `<p>Ürün bulunamadı. Hata: ${error.message}</p>`;
  }

  // "Geri" butonuna tıklanınca product-list.html'e yönlendir
  backBtn.addEventListener("click", () => {
    window.location.href = "product-list.html";
  });
});
