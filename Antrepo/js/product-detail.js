import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", function() {
    // Basit bir statik ürün nesnesi oluşturuyoruz.
    // Gerçek uygulamada URL parametresinden veya API çağrısından alınabilir.
    const product = {
      id: getParameterByName("id") || "DET-001", // URL'den id alınabilir, yoksa varsayılan
      name: "Detay Ürün",
      code: "DET-001",
      stock: "20 MT"
    };
  
    // Ürün bilgilerini DOM'a yerleştir
    document.getElementById("productId").textContent = product.id;
    document.getElementById("productNameDetail").textContent = product.name;
    document.getElementById("productCode").textContent = product.code;
    document.getElementById("productStock").textContent = product.stock;
    document.getElementById("productName").textContent = "Ürün Detayı: " + product.name;
  
    // "Geri" butonuna tıklayınca geri git
    document.getElementById("backBtn").addEventListener("click", function() {
      window.history.back();
    });
  });
  
  /**
   * URL'den sorgu parametresini alma fonksiyonu.
   * Örneğin: ?id=DET-002
   */
  function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, "\\$&");
    const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
          results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }
  