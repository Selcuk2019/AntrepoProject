// File: product-form.js
import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async () => {
  const productForm = document.getElementById("productForm");
  const packagingTypeSelect = document.getElementById("packagingType");
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  const mode = params.get("mode");
  const urunId = params.get("urunId");
  const varyantId = params.get("varyantId");
  const isVariantMode = mode === "variant" && (urunId || varyantId);

  // Sayfa başlığını güncelle
  document.querySelector('.page-header h1').textContent =
    mode === 'edit' && varyantId ? 'Varyant Düzenle' :
    isVariantMode ? 'Yeni Varyant Ekle' :
    productId ? 'Ürün Düzenle' : 'Yeni Ürün ve Varyant Ekle';

  // Eğer varyant düzenleme modundaysanız (mode=edit & varyantId)
  if (mode === 'edit' && varyantId) {
    document.querySelector('.form-section:first-child').style.display = 'none';
    try {
      const response = await fetch(`${baseUrl}/api/urun_varyantlari/${varyantId}`);
      if (!response.ok) throw new Error('Varyant bilgileri alınamadı');
      const variant = await response.json();

      // Ürün bilgilerini göster
      const productInfo = document.createElement('div');
      productInfo.className = 'product-info';
      productInfo.innerHTML = `
        <div class="alert alert-info">
          <strong>Düzenlenen Varyant:</strong>
          <p>Ürün Adı: ${variant.urun_adi}</p>
          <p>Ürün Kodu: ${variant.urun_kodu}</p>
        </div>
      `;
      const formContainer = document.querySelector('.form-container');
      formContainer.insertBefore(productInfo, formContainer.firstChild);

      // Form alanlarını doldur
      document.getElementById("bagSize").value = variant.paket_hacmi;
      // Varyantın description değeri select alanına set ediliyor
      $(packagingTypeSelect).val(variant.description).trigger('change');
    } catch (error) {
      console.error("Varyant yükleme hatası:", error);
      alert("Varyant bilgileri yüklenirken hata oluştu!");
    }
  }

  // Yeni varyant ekleme modundaysanız (mode=variant, urunId)
  if (isVariantMode && !varyantId) {
    // Ürün alanlarını devre dışı bırak (sadece varyant doldurulacak)
    const productFields = document.querySelectorAll('.form-section:first-child input, .form-section:first-child textarea');
    productFields.forEach(field => {
      field.disabled = true;
    });

    // Ürün bilgilerini getir
    try {
      const response = await fetch(`${baseUrl}/api/urunler/${urunId}`);
      if (!response.ok) throw new Error('Ürün bilgileri alınamadı');
      const product = await response.json();

      document.getElementById("productName").value = product.name;
      document.getElementById("productCode").value = product.code;
    } catch (error) {
      console.error("Ürün yükleme hatası:", error);
      alert("Ürün bilgileri yüklenirken hata oluştu!");
      return;
    }
  }

  // Paketleme tiplerini yükle ve Select2 ile başlat
  const loadPackagingTypes = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/packaging-types`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      // Select2'yi başlatmadan önce boşalt
      $(packagingTypeSelect).empty();

      // Placeholder ekleyin
      $(packagingTypeSelect).append(new Option('', '', true, true));

      // Burada id: item.name atıyoruz, text: item.name
      $(packagingTypeSelect).select2({
        placeholder: 'Paketleme Tipi Seçin',
        allowClear: true,
        width: '100%',
        data: data.map(item => ({
          id: item.name,    // METİN olarak kullanılacak
          text: item.name   // METİN
        })),
        initSelection: function() {
          $(packagingTypeSelect).val(null).trigger('change');
        }
      });

      return true;
    } catch (error) {
      console.error("Paketleme tipleri yüklenirken hata:", error);
      alert("Paketleme tipleri yüklenirken bir hata oluştu!");
      return false;
    }
  };

  // Sayfa açılışında paketleme tiplerini yükle
  try {
    await loadPackagingTypes();
  } catch (error) {
    console.error("Initial loadPackagingTypes error:", error);
  }

  // Ürün düzenleme modundaysa
  if (productId) {
    try {
      const resp = await fetch(`${baseUrl}/api/urunler/${productId}`);
      if (!resp.ok) throw new Error('Ürün bilgileri alınamadı');
      const product = await resp.json();

      // Form alanlarını doldur
      document.getElementById("productName").value = product.name || '';
      document.getElementById("productCode").value = product.code || '';
      document.getElementById("bagSize").value = product.paket_hacmi || '';
      document.getElementById("description").value = product.description || '';

      // Varyant seçiminde description alanı set ediliyor (varsa)
      $(packagingTypeSelect).val(product.description).trigger('change');
    } catch (error) {
      console.error("Ürün yükleme hatası:", error);
      alert("Ürün bilgileri yüklenirken hata oluştu!");
    }
  }

  // Form submit işlemi
  productForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Varyant düzenleme (mode=edit & varyantId)
    if (mode === 'edit' && varyantId) {
      try {
        const paketHacmiVal = document.getElementById("bagSize").value.trim();
        const packagingTypeVal = $(packagingTypeSelect).val(); // Bu metin değeri
        const response = await fetch(`${baseUrl}/api/urun_varyantlari/${varyantId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paket_hacmi: paketHacmiVal,
            description: packagingTypeVal
          })
        });

        if (!response.ok) throw new Error('Varyant güncellenemedi');
        alert("Varyant başarıyla güncellendi!");
        window.location.href = `stock-card.html?id=${urunId}`;
        return;
      } catch (error) {
        console.error('Varyant güncelleme hatası:', error);
        alert(error.message);
        return;
      }
    }

    // Yeni varyant ekleme (mode=variant & urunId)
    if (isVariantMode && !varyantId) {
      const bagSizeValue = document.getElementById("bagSize").value.trim();
      const packagingTypeValue = $(packagingTypeSelect).val(); // METİN
      console.log("Debug: Varyant Ekleme Form Değerleri:", {
        urunId,
        bagSize: bagSizeValue,
        packagingType: packagingTypeValue
      });

      const variantData = {
        urun_id: urunId,
        paket_hacmi: bagSizeValue,
        description: packagingTypeValue
      };

      if (!variantData.urun_id || !variantData.paket_hacmi || !variantData.description) {
        alert("Varyant eklemek için urun_id, paket_hacmi ve description zorunludur!");
        return;
      }

      try {
        const response = await fetch(`${baseUrl}/api/urun_varyantlari`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(variantData)
        });

        if (!response.ok) {
          const errorResp = await response.json();
          throw new Error(errorResp.error || 'Varyant eklenirken hata oluştu');
        }

        alert("Varyant başarıyla eklendi!");
        window.location.href = `stock-card.html?id=${urunId}`;
        return;
      } catch (error) {
        console.error('Varyant ekleme hatası:', error);
        alert(error.message);
        return;
      }
    }

    // Ürün ekleme/güncelleme işlemi
    const bagSize = document.getElementById("bagSize").value.trim();
    const packagingType = $(packagingTypeSelect).val();
    
    console.log("Form verileri (debug):", {
      bagSize,
      packagingType,
      productName: document.getElementById("productName").value,
      productCode: document.getElementById("productCode").value
    });
    
    const formData = {
      product: {
        name: document.getElementById("productName").value.trim(),
        code: document.getElementById("productCode").value.trim(),
        description: packagingType || document.getElementById("description").value.trim()
      },
      variant: {
        paket_hacmi: bagSize || null,
        description: packagingType || null
      }
    };

    // Validasyon
    if (!formData.product.name || !formData.product.code) {
      alert("Ürün adı ve kodu zorunludur!");
      return;
    }

    console.log("API'ye gönderilecek:", JSON.stringify(formData));

    try {
      const response = await fetch(`${baseUrl}/api/urunler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Bir hata oluştu');
      }

      const result = await response.json();
      alert("Ürün kaydedildi!");
      window.location.href = "product-list.html";
    } catch (error) {
      console.error('Hata:', error);
      alert(error.message || "İşlem sırasında bir hata oluştu!");
    }
  });
});
