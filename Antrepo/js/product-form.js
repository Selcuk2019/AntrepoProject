// File: product-form.js
import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", () => {
  const productForm = document.getElementById("productForm");
  const packagingTypeSelect = document.getElementById("packagingType");

  // 1) Paketleme tiplerini API'den yükle
  async function loadPackagingTypes() {
    try {
      const resp = await fetch(`${baseUrl}/api/packaging-types`);
      if (!resp.ok) throw new Error(`Paketleme tipleri hata: ${resp.status}`);
      const data = await resp.json();

      packagingTypeSelect.innerHTML = "";
      const defaultOpt = document.createElement("option");
      defaultOpt.value = "";
      defaultOpt.textContent = "Seçiniz";
      defaultOpt.disabled = true;
      defaultOpt.selected = true;
      packagingTypeSelect.appendChild(defaultOpt);

      data.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.id; // DB'deki paketleme_tipi_id
        opt.textContent = t.name;
        packagingTypeSelect.appendChild(opt);
      });
    } catch (error) {
      console.error("Paketleme tipleri yüklenirken hata:", error);
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
      const resp = await fetch(`${baseUrl}/api/urunler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error(`Ürün ekleme hatası: ${resp.status}`);
      const result = await resp.json();

      if (result.success) {
        alert("Ürün başarıyla eklendi!");

        // (A) API'den dönen insertedId değerini al
        const newId = result.insertedId;

        // (B) localStorage'da products dizisini güncelle
        let products = JSON.parse(localStorage.getItem("products")) || [];
        products.push({
          id: newId,                   // Artık veritabanı ID'si
          name: name,
          code: code,
          paket_hacmi: bagSize,
          paketleme_tipi_id: packagingTypeId,
          description: description,
          // Stok vs. alanları eklemek isterseniz buraya
        });
        localStorage.setItem("products", JSON.stringify(products));

        // (C) Liste sayfasına yönlendir
        window.location.href = "product-list.html";
      } else {
        // API bir hata mesajı döndürdüyse
        alert("Hata: " + (result.error || "Bilinmeyen hata"));
      }
    } catch (error) {
      console.error("Ürün ekleme sırasında hata:", error);
      alert("Kayıt sırasında hata: " + error.message);
    }
  });

  // 3) Sayfa yüklenince paketleme tiplerini getir
  loadPackagingTypes();
});
