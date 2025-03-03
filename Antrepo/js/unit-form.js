import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async function() {
  const urlParams = new URLSearchParams(window.location.search);
  const unitId = urlParams.get("id");
  const unitForm = document.getElementById("unitForm");

  // Eğer düzenleme sayfasıysa, mevcut veriyi çek
  if (unitId) {
    try {
      const resp = await fetch(`${baseUrl}/api/birimler/${unitId}`);
      if (!resp.ok) throw new Error(`Sunucu hatası: ${resp.status}`);
      const unit = await resp.json();
      fillForm(unit);
    } catch (error) {
      console.error("Birim verisi çekilirken hata:", error);
    }
  }

  // Formu doldurma fonksiyonu
  function fillForm(unit) {
    document.getElementById("birimAdi").value = unit.birim_adi || "";
    document.getElementById("kategori").value = unit.kategori || "";
    document.getElementById("sembol").value = unit.sembol || "";
    document.getElementById("kisaKod").value = unit.kisa_kod || "";
    document.getElementById("durum").value = unit.durum || "Aktif";
  }

  // Form submit işlemi
  unitForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    const newUnit = {
      // Eğer düzenleme ise, ID'yi gönderin; yeni kayıt için sunucu ID oluşturabilir
      id: unitId ? unitId : Date.now(),
      birim_adi: document.getElementById("birimAdi").value,
      kategori: document.getElementById("kategori").value,
      sembol: document.getElementById("sembol").value,
      kisa_kod: document.getElementById("kisaKod").value,
      durum: document.getElementById("durum").value
    };

    try {
      let response;
      if (unitId) {
        // Varolan kaydı güncelle
        response = await fetch(`${baseUrl}/api/birimler/${unitId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newUnit)
        });
      } else {
        // Yeni kayıt ekle
        response = await fetch(`${baseUrl}/api/birimler`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newUnit)
        });
      }
      if (!response.ok) {
        throw new Error(`Sunucu hatası: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        alert("Birim kaydı başarılı!");
        window.location.href = "unit-list.html";
      } else {
        alert("Kayıt başarısız: " + JSON.stringify(result));
      }
    } catch (error) {
      console.error("Kayıt sırasında hata:", error);
      alert("Kayıt sırasında hata: " + error.message);
    }
  });

  // İptal butonu
  const cancelBtn = document.getElementById("cancelBtn");
  cancelBtn.addEventListener("click", function() {
    history.back();
  });
});
