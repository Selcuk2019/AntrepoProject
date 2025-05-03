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

  let allPackagingTypes = []; // Paketleme tiplerini saklamak için
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
      // Not: variant.description varsa, packagingTypeSelect'e val() olarak variant.description vereceğiz (ID değil!)
      // Örneğin: $(packagingTypeSelect).val(variant.description).trigger('change');
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
      allPackagingTypes = data; // Veriyi global değişkene ata

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
          id: item.name,    // <--- METİN
          text: item.name   // <--- METİN
        })),
        initSelection: function() {
          $(packagingTypeSelect).val(null).trigger('change');
        }
      });

      // mode=edit & varyantId varsa, var olan varyant.description değerini set edebilirsiniz
      // (Bu kısım, varyant bilgisi yüklendikten sonra da yapılabilir.)

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
    // Önce paketleme tiplerinin yüklenmesini bekle
    const packagingTypesLoaded = await loadPackagingTypes();
    if (!packagingTypesLoaded) {
      alert("Paketleme tipleri yüklenemediği için form doldurulamıyor.");
      return; // Hata durumunda devam etme
    }

    try {
      const resp = await fetch(`${baseUrl}/api/urunler/${productId}`);
      if (!resp.ok) throw new Error('Ürün bilgileri alınamadı');
      const product = await resp.json();

      // Form alanlarını doldur
      document.getElementById("productName").value = product.name || ''; // Ürün Adı
      document.getElementById("productCode").value = product.code || ''; // Ürün Kodu
      document.getElementById("bagSize").value = product.paket_hacmi || ''; // Paket Hacmi
      document.getElementById("description").value = product.description || ''; // Ana Açıklama

      // Paketleme tipi Select2'sini ayarla (product.paketleme_tipi_name kullanarak)
      // loadPackagingTypes bittikten sonra ve product verisi geldikten sonra ayarla
      if (product.paketleme_tipi_name) {
        try {
          // Seçeneğin text'i ile değeri ayarla (Select2 data'sı {id: name, text: name} şeklinde)
          $(packagingTypeSelect).val(product.paketleme_tipi_name).trigger('change');
          console.log(`Paketleme tipi ayarlandı: ${product.paketleme_tipi_name}`);
        } catch (e) {
          console.error("Select2 paketleme tipi ayarlama hatası:", e);
          // Hata olsa bile kullanıcıya bilgi verilebilir veya loglanabilir
        }
      } else {
        console.log("API'den paketleme tipi adı gelmedi.");
        // Değer gelmediyse Select2'yi temizle
        $(packagingTypeSelect).val(null).trigger('change');
      }
    } catch (error) {
      console.error("Ürün yükleme hatası:", error);
      alert("Ürün bilgileri yüklenirken hata oluştu!");
    }

    // YENİ: Ürün düzenleme modunda "Yeni Varyant Ekle" butonunu göster
    const addVariantButton = document.getElementById('addVariantBtn');
    if (addVariantButton) {
      addVariantButton.style.display = 'inline-block'; // veya 'block'
      addVariantButton.href = `product-form.html?mode=variant&urunId=${productId}`; // Linki ayarla
    }
  }

  // Form submit
  productForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Varyant düzenleme (mode=edit & varyantId)
    if (mode === 'edit' && varyantId) {
      try {
        const paketHacmiVal = document.getElementById("bagSize").value.trim();
        const packagingTypeVal = $(packagingTypeSelect).val(); // Bu bir METİN olmalı artık
        const response = await fetch(`${baseUrl}/api/urun_varyantlari/${varyantId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paket_hacmi: paketHacmiVal,
            // pakette "description" alanını backend PUT'ta bekliyorsanız, "description" gönderin
            // eğer "paketleme_tipi_id" bekliyorsanız, API'nizi düzeltmeniz lazım
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
        const response = await fetch(`${baseUrl}/api/urun-varyantlari`, {
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
    // URL'den productId'yi tekrar alalım (edit mod kontrolü için)
    const urlParams = new URLSearchParams(window.location.search);
    const editProductId = urlParams.get("id");

    const formData = {
      product: {
        name: document.getElementById("productName").value.trim(),
        code: document.getElementById("productCode").value.trim(),
        description: document.getElementById("description").value.trim()
      },
      variant: {
        paket_hacmi: document.getElementById("bagSize").value.trim(),
        // Backend'in beklediği alan adı 'description' ise:
        description: $(packagingTypeSelect).val() // Bu satır doğruysa kalsın
      }
    };

    // Basit validasyon
    if (!formData.product.name || !formData.product.code ) {
      alert("Ürün adı ve kodu zorunludur!");
      return;
    }
    // Yeni eklenen zorunlu alan kontrolü (Sadece yeni ürün eklerken)
    if (!editProductId) { // Eğer düzenleme modunda değilsek kontrol et
      if (!formData.variant.paket_hacmi) {
        alert("Paket hacmi zorunludur!");
        return;
      }
      if (!formData.variant.description) { // description (paketleme tipi metni) boş mu?
        alert("Paketleme tipi zorunludur!");
        return;
      }
    }

    try {
      // Edit modundaysak PUT, değilse POST; URL'i de ona göre ayarla
      const method = editProductId ? 'PUT' : 'POST';
      let url = `${baseUrl}/api/urun`; // Varsayılan POST URL'i
      let requestBody = JSON.stringify(formData); // Varsayılan POST body'si

      if (editProductId) {
        // Düzenleme modunda PUT isteği için body'yi hazırla
        url = `${baseUrl}/api/urunler/${editProductId}`; // PUT URL'i

        // Paketleme tipi ID'sini bul
        const selectedPackagingTypeName = $(packagingTypeSelect).val();
        const foundPackagingType = allPackagingTypes.find(pt => pt.name === selectedPackagingTypeName);
        const paketlemeTipiId = foundPackagingType ? foundPackagingType.id : null;

        // PUT isteği için ürün, paketleme tipi ID ve paket hacmini gönder
        requestBody = JSON.stringify({
          ...formData.product, // name, code, description
          paketleme_tipi_id: paketlemeTipiId,
          paket_hacmi: formData.variant.paket_hacmi
        });
      }
      console.log("Gönderilen Body:", requestBody); // Debug için

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: requestBody
      });

      if (!response.ok) {
        const errorResp = await response.json();
        throw new Error(errorResp.message || 'Bir hata oluştu');
      }

      const result = await response.json();
      if (editProductId) {
        alert("Ürün başarıyla güncellendi!");
      } else {
        alert("Ürün ve varyant başarıyla kaydedildi!");
      }
      window.location.href = "product-list.html";
    } catch (error) {
      console.error('Hata:', error);
      alert(error.message || "İşlem sırasında bir hata oluştu!");
    }
  });
});
