// File: hizmet-form.js
import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", () => {
  const serviceForm = document.getElementById("serviceForm");
  const cancelBtn = document.getElementById("cancelBtn");
  const saveServiceBtn = document.getElementById("saveServiceBtn");

  // Form alanlarını alalım:
  const hizmetAdiInput = document.getElementById("hizmetAdi");
  const hizmetKoduInput = document.getElementById("hizmetKodu");
  const hizmetTipiSelect = document.getElementById("hizmetTipi");
  // Lokasyon alanı kaldırıldığı için burada artık yok.
  const birimIdSelect = document.getElementById("birimId");
  const paraBirimiIdSelect = document.getElementById("paraBirimiId");
  const temelUcretInput = document.getElementById("temelUcret");
  const minUcretInput = document.getElementById("minUcret");
  const carpanInput = document.getElementById("carpan");
  const mesaiUygulaSelect = document.getElementById("mesaiUygula");
  const mesaiSaatleriSelect = document.getElementById("mesaiSaatleri");
  const aciklamaInput = document.getElementById("aciklama");
  const durumSelect = document.getElementById("durum");

  // Mesai uygulama seçimine göre mesai saatleri alanını göster/gizle
  mesaiUygulaSelect.addEventListener("change", function() {
    if (this.value === "Evet") {
      document.getElementById("mesaiSaatleriGroup").style.display = "block";
    } else {
      document.getElementById("mesaiSaatleriGroup").style.display = "none";
      mesaiSaatleriSelect.value = "";
    }
  });

  async function populateBirimler() {
    try {
      const resp = await fetch(`${baseUrl}/api/birimler`);
      if (!resp.ok) throw new Error(`Birimler hatası: ${resp.status}`);
      const data = await resp.json();
      birimIdSelect.innerHTML = `<option value="" disabled selected>Seçiniz</option>`;
      data.forEach(birim => {
        const option = document.createElement("option");
        option.value = birim.id;
        option.textContent = birim.birim_adi;
        birimIdSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Birimler yüklenirken hata:", error);
    }
  }

  async function populateParaBirimleri() {
    try {
      const resp = await fetch(`${baseUrl}/api/para-birimleri`);
      if (!resp.ok) throw new Error(`Para birimleri hatası: ${resp.status}`);
      const data = await resp.json();
      paraBirimiIdSelect.innerHTML = `<option value="" disabled selected>Seçiniz</option>`;
      data.forEach(pb => {
        const option = document.createElement("option");
        option.value = pb.id;
        option.textContent = `${pb.para_birimi_adi} (${pb.iso_kodu})`;
        paraBirimiIdSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Para birimleri yüklenirken hata:", error);
    }
  }

  // Form submit işlemi
  serviceForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    // Mesai koşullarını oluşturma
    function getHesaplamaKosullari() {
      if (mesaiUygulaSelect.value === "Evet") {
        return {
          mesaiUygulanir: true,
          mesaiSaatleri: mesaiSaatleriSelect.value
        };
      }
      return { mesaiUygulanir: false };
    }

    const payload = {
      hizmet_adi: hizmetAdiInput.value,
      hizmet_kodu: hizmetKoduInput.value,
      hizmet_tipi: hizmetTipiSelect.value,
      // Lokasyon alanı kaldırıldığı için payload'dan çıkarıyoruz.
      birim_id: parseInt(birimIdSelect.value, 10),
      para_birimi_id: parseInt(paraBirimiIdSelect.value, 10),
      temel_ucret: parseFloat(temelUcretInput.value),
      min_ucret: parseFloat(minUcretInput.value) || 0,
      carpan: parseFloat(carpanInput.value) || 0,
      aciklama: aciklamaInput.value,
      durum: durumSelect.value,
      hesaplama_kosullari: getHesaplamaKosullari(),
      mesai_saatleri: mesaiUygulaSelect.value === "Evet" ? mesaiSaatleriSelect.value : null
    };

    try {
      const resp = await fetch(`${baseUrl}/api/hizmetler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error(`Sunucu hatası: ${resp.status}`);
      const result = await resp.json();
      if (result.success) {
        alert("Hizmet kaydı başarılı!");
        window.location.href = "hizmet-list.html";
      } else {
        alert("Kayıt başarısız: " + JSON.stringify(result));
      }
    } catch (error) {
      console.error("Kayıt sırasında hata:", error);
      alert("Kayıt sırasında hata: " + error.message);
    }
  });

  cancelBtn.addEventListener("click", () => {
    history.back();
  });

  // Sayfa yüklendiğinde dropdown verilerini dolduralım
  populateBirimler();
  populateParaBirimleri();
});
