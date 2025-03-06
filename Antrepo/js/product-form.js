// File: product-form.js
import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async () => {
  const productForm = document.getElementById("productForm");
  const packagingTypeSelect = document.getElementById("packagingType");
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  // Sayfa başlığını güncelle
  document.querySelector('.page-header h1').textContent = productId ? 'Ürün Düzenle' : 'Yeni Ürün Ekle';

  // Paketleme tiplerini yükle ve dönen promise'i sakla
  const loadPackagingTypes = async () => {
    try {
      const resp = await fetch(`${baseUrl}/api/packaging-types`);
      if (!resp.ok) throw new Error(`Paketleme tipleri hata: ${resp.status}`);
      const data = await resp.json();

      packagingTypeSelect.innerHTML = `
        <option value="" disabled>Seçiniz</option>
        ${data.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
      `;
      return true;
    } catch (error) {
      console.error("Paketleme tipleri yüklenirken hata:", error);
      return false;
    }
  };

  // Önce paketleme tiplerini yükle
  await loadPackagingTypes();

  // Sonra, eğer düzenleme modundaysa ürün bilgilerini getir
  if (productId) {
    try {
      const resp = await fetch(`${baseUrl}/api/urunler/${productId}`);
      if (!resp.ok) throw new Error('Ürün bilgileri alınamadı');
      const product = await resp.json();

      // Form alanlarını doldur
      document.getElementById("name").value = product.name || '';
      document.getElementById("code").value = product.code || '';
      document.getElementById("bagSize").value = product.paket_hacmi || '';
      document.getElementById("description").value = product.description || '';
      
      // Paketleme tipini seç
      if (product.paketleme_tipi_id) {
        packagingTypeSelect.value = product.paketleme_tipi_id;
      }
    } catch (error) {
      console.error("Ürün yükleme hatası:", error);
      alert("Ürün bilgileri yüklenirken hata oluştu!");
    }
  }

  // 2) Form submit: Ürün ekleme
  productForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Form alanları
    const name = document.getElementById("name").value.trim();
    const code = document.getElementById("code").value.trim();
    const bagSize = document.getElementById("bagSize").value.trim();
    const packagingTypeId = packagingTypeSelect.value;
    const description = document.getElementById("description").value.trim();

    // Basit zorunlu alan kontrolü
    if (!name || !code || !bagSize || !packagingTypeId) {
      alert("Lütfen zorunlu alanları doldurun!");
      return;
    }

    // API'ye göndereceğimiz payload
    const payload = {
      name: name,
      code: code,
      paket_hacmi: bagSize,
      paketleme_tipi_id: packagingTypeId,
      description: description
    };

    try {
      const url = productId 
        ? `${baseUrl}/api/urunler/${productId}`
        : `${baseUrl}/api/urunler`;

      const method = productId ? "PUT" : "POST";

      const resp = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) throw new Error('İşlem başarısız');

      alert(productId ? "Ürün güncellendi!" : "Ürün eklendi!");
      window.location.href = "product-list.html";

    } catch (error) {
      console.error("Hata:", error);
      alert("İşlem sırasında bir hata oluştu!");
    }
  });
});
