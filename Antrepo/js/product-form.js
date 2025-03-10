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
  
  // Varyant düzenleme modunda sadece varyant alanlarını göster
  if (mode === 'edit' && varyantId) {
    document.querySelector('.form-section:first-child').style.display = 'none';
    try {
      const response = await fetch(`${baseUrl}/api/urun_varyantlari/${varyantId}`);
      if (!response.ok) throw new Error('Varyant bilgileri alınamadı');
      const variant = await response.json();
      
      // Form alanlarını doldur
      document.getElementById("bagSize").value = variant.paket_hacmi;
      $(packagingTypeSelect).val(variant.paketleme_tipi_id).trigger('change');
      
    } catch (error) {
      console.error("Varyant yükleme hatası:", error);
      alert("Varyant bilgileri yüklenirken hata oluştu!");
    }
  }

  // Form başlığını ve görünümünü güncelle
  if (isVariantMode && !varyantId) {
    document.querySelector('.page-header h1').textContent = 'Yeni Varyant Ekle';
    
    // Ürün bilgileri bölümünü gizle yerine disable et
    const productFields = document.querySelectorAll('.form-section:first-child input, .form-section:first-child textarea');
    productFields.forEach(field => {
      field.disabled = true; // readOnly yerine disabled kullan
    });
    
    // Ürün bilgilerini getir ve doldur
    try {
      const response = await fetch(`${baseUrl}/api/urunler/${urunId}`);
      if (!response.ok) throw new Error('Ürün bilgileri alınamadı');
      const product = await response.json();
      
      // ID'leri güncellendi - HTML ile eşleşecek şekilde
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

      // Select2'yi başlat
      $(packagingTypeSelect).empty();
      
      // Boş bir option ekle (placeholder için)
      $(packagingTypeSelect).append(new Option('', '', true, true));
      
      $(packagingTypeSelect).select2({
        placeholder: 'Paketleme Tipi Seçin',
        allowClear: true,
        width: '100%',
        data: data.map(item => ({
          id: item.id,
          text: item.name
        })),
        // Başlangıçta seçili değer olmaması için
        initSelection: function() {
          $(packagingTypeSelect).val(null).trigger('change');
        }
      });

      // Eğer düzenleme modundaysa ve seçili değer varsa
      if (mode === 'edit' && varyantId) {
        const currentValue = packagingTypeSelect.value;
        if (currentValue) {
          $(packagingTypeSelect).val(currentValue).trigger('change');
        }
      } else {
        // Düzenleme modu değilse değeri temizle
        $(packagingTypeSelect).val(null).trigger('change');
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
      document.getElementById("productName").value = product.name || '';
      document.getElementById("productCode").value = product.code || '';
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

    // Varyant düzenleme modu
    if (mode === 'edit' && varyantId) {
      try {
        const response = await fetch(`${baseUrl}/api/urun_varyantlari/${varyantId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paket_hacmi: document.getElementById("bagSize").value,
            paketleme_tipi_id: $(packagingTypeSelect).val()
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

    // Varyant modu için ayrı işlem
    if (isVariantMode && !varyantId) {
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

    // Form verilerini topla - ID'leri güncellendi
    const formData = {
      // Ürün bilgileri
      product: {
        name: document.getElementById("productName").value.trim(),
        code: document.getElementById("productCode").value.trim(),
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
