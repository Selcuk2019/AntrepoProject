// File: product-form.js
import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async () => {
  const productForm = document.getElementById("productForm");
  const packagingTypeSelect = document.getElementById("packagingType");
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  const mode = params.get("mode");
  const urunId = params.get("urunId");
  const isVariantMode = mode === "variant" && urunId;

  // Sayfa başlığını güncelle
  document.querySelector('.page-header h1').textContent = 
    productId ? 'Ürün Düzenle' : 'Yeni Ürün ve Varyant Ekle';

  // Form başlığını ve görünümünü güncelle
  if (isVariantMode) {
    document.querySelector('.page-header h1').textContent = 'Yeni Varyant Ekle';
    
    // Ürün alanlarını readonly yap
    document.getElementById("name").readOnly = true;
    document.getElementById("code").readOnly = true;
    
    // Ürün bilgilerini getir ve doldur
    try {
      const response = await fetch(`${baseUrl}/api/urunler/${urunId}`);
      if (!response.ok) throw new Error('Ürün bilgileri alınamadı');
      const product = await response.json();
      
      // Form alanlarını doldur
      document.getElementById("name").value = product.name;
      document.getElementById("code").value = product.code;
    } catch (error) {
      console.error("Ürün yükleme hatası:", error);
      alert("Ürün bilgileri yüklenirken hata oluştu!");
      return;
    }
  }

  // Paketleme tiplerini yükle ve Select2 ile başlat
  const loadPackagingTypes = async () => {
    try {
      // API'den verileri getir
      const response = await fetch(`${baseUrl}/api/packaging-types`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Paketleme tipleri yüklendi:", data); // Debug için

      // Select2'yi başlatmadan önce options ekle
      const options = data.map(type => {
        return new Option(type.name, type.id, false, false);
      });

      // Select2'yi başlat
      $(packagingTypeSelect).empty(); // Önceki seçenekleri temizle
      
      // Select2 initialization
      $(packagingTypeSelect).select2({
        placeholder: 'Paketleme Tipi Seçin',
        allowClear: true,
        width: '100%',
        data: data.map(item => ({
          id: item.id,
          text: item.name
        }))
      });

      // Eğer düzenleme modundaysa ve seçili değer varsa
      if (productId && data.length > 0) {
        // Mevcut değeri seç
        const currentValue = packagingTypeSelect.value;
        if (currentValue) {
          $(packagingTypeSelect).val(currentValue).trigger('change');
        }
      }

      return true;
    } catch (error) {
      console.error("Paketleme tipleri yüklenirken hata:", error);
      alert("Paketleme tipleri yüklenirken bir hata oluştu!");
      return false;
    }
  };

  // Sayfa yüklendiğinde hemen paketleme tiplerini yükle
  try {
    await loadPackagingTypes();
  } catch (error) {
    console.error("Initial loadPackagingTypes error:", error);
  }

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
      
      // Paketleme tipini seç - Select2 için trigger('change') ekle
      if (product.paketleme_tipi_id) {
        $(packagingTypeSelect).val(product.paketleme_tipi_id).trigger('change');
      }
    } catch (error) {
      console.error("Ürün yükleme hatası:", error);
      alert("Ürün bilgileri yüklenirken hata oluştu!");
    }
  }

  // 2) Form submit: Ürün ekleme
  productForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Varyant modu için ayrı işlem
    if (isVariantMode) {
      const variantData = {
        urun_id: urunId,
        paket_hacmi: document.getElementById("bagSize").value.trim(),
        paketleme_tipi_id: packagingTypeSelect.value
      };

      try {
        const response = await fetch(`${baseUrl}/api/urun-varyantlari`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(variantData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Varyant eklenirken hata oluştu');
        }

        alert("Varyant başarıyla eklendi!");
        // Stok kartına geri dön
        window.location.href = `stock-card.html?id=${urunId}`;
        return;
      } catch (error) {
        console.error('Varyant ekleme hatası:', error);
        alert(error.message);
        return;
      }
    }

    // Form verilerini topla
    const formData = {
      // Ürün bilgileri
      product: {
        name: document.getElementById("name").value.trim(),
        code: document.getElementById("code").value.trim(),
        description: document.getElementById("description").value.trim()
      },
      // Varyant bilgileri (opsiyonel)
      variant: {
        paket_hacmi: document.getElementById("bagSize").value.trim(),
        paketleme_tipi_id: $(packagingTypeSelect).val() // Select2 değerini al
      }
    };

    // Validasyon
    if (!formData.product.name || !formData.product.code) {
      alert("Ürün adı ve kodu zorunludur!");
      return;
    }

    // Varyant bilgileri girilmişse validasyon yap
    if (formData.variant.paket_hacmi || formData.variant.paketleme_tipi_id) {
      if (!formData.variant.paket_hacmi || !formData.variant.paketleme_tipi_id) {
        alert("Varyant için hem paket hacmi hem de paketleme tipi gereklidir!");
        return;
      }
    }

    try {
      // API'ye gönder
      const response = await fetch(`${baseUrl}/api/urun`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Bir hata oluştu');
      }

      const result = await response.json();
      alert("Ürün ve varyant başarıyla kaydedildi!");
      window.location.href = "product-list.html";

    } catch (error) {
      console.error('Hata:', error);
      alert(error.message || "İşlem sırasında bir hata oluştu!");
    }
  });
});
