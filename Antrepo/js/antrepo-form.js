// antrepo-form.js
import { baseUrl } from './config.js';

document.addEventListener('DOMContentLoaded', async function() {
  // Dropdown'ları doldurmak için API çağrıları yapılıyor
  try {
    // Gümrükler: /api/customs
    const respGumruk = await fetch(`${baseUrl}/api/customs`);
    const gumrukData = await respGumruk.json();
    populateDropdown("gumruk", gumrukData, "gumruk_id", "gumruk_adi", "Seçiniz");

    // Bölge Müdürlükleri: /api/regions
    const respRegions = await fetch(`${baseUrl}/api/regions`);
    const regionData = await respRegions.json();
    populateDropdown("gumrukMudurlugu", regionData, "bolge_id", "bolge_mudurlugu", "Seçiniz");

    // Şehirler: /api/cities
    const respCities = await fetch(`${baseUrl}/api/cities`);
    const cityData = await respCities.json();
    populateDropdown("sehir", cityData, "id", "sehir_ad", "Seçiniz");

    // Şirketler: /api/companies
    const respCompanies = await fetch(`${baseUrl}/api/companies`);
    const companyData = await respCompanies.json();
    populateDropdown("antrepoSirketi", companyData, "sirket_id", "company_name", "Seçiniz");

    // Antrepo Tipleri: /api/antrepo-types
    const respTypes = await fetch(`${baseUrl}/api/antrepo-types`);
    const typeData = await respTypes.json();
    populateDropdown("antrepoTipi", typeData, "id", "name", "Seçiniz");

  } catch (err) {
    console.error("Veri çekilirken hata:", err);
  }

  // Form submit işlemi: POST isteği ile kaydetme
  const antrepoForm = document.getElementById('antrepoForm');
  antrepoForm.addEventListener('submit', async function(e) {
    e.preventDefault(); // Sayfanın yenilenmesini engelle

    // Formdaki değerleri topla
    const id = Date.now(); // Basit ID üretimi
    const antrepoKodu = document.getElementById('antrepoKodu').value;
    const antrepoAdi = document.getElementById('antrepoAdi').value;
    const antrepoTipi = document.getElementById('antrepoTipi').value;
    const gumruk = document.getElementById('gumruk').value;
    const gumrukMudurlugu = document.getElementById('gumrukMudurlugu').value;
    const sehir = document.getElementById('sehir').value;
    const acikAdres = document.getElementById('acikAdres').value;
    const antrepoSirketi = document.getElementById('antrepoSirketi').value;
    const kapasite = document.getElementById('kapasite').value;
    const notlar = document.getElementById('notlar').value;
    const aktif = document.getElementById('aktif').checked;

    try {
      const response = await fetch(`${baseUrl}/api/antrepolar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          antrepoKodu,
          antrepoAdi,
          antrepoTipi,
          gumruk,
          gumrukMudurlugu,
          sehir,
          acikAdres,
          antrepoSirketi,
          kapasite,
          notlar,
          aktif
        })
      });

      if (!response.ok) {
        throw new Error(`Sunucu hatası: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        alert("Antrepo kaydı oluşturuldu!");
        // Kaydın başarılı olması durumunda antrepo-list.html'e yönlendirme
        window.location.href = "antrepo-list.html";
      } else {
        alert("Kayıt başarısız: " + JSON.stringify(result));
      }
    } catch (error) {
      console.error("Kayıt sırasında hata:", error);
      alert("Kayıt başarısız: " + error.message);
    }
  });
});

// Dropdown'ları doldurmak için ortak fonksiyon
function populateDropdown(selectId, data, valueField, textField, defaultText) {
  const selectElem = document.getElementById(selectId);
  if (!selectElem) return;
  selectElem.innerHTML = ""; // Eski verileri temizle

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = defaultText;
  defaultOption.disabled = true;
  defaultOption.selected = true;
  selectElem.appendChild(defaultOption);

  data.forEach(item => {
    const option = document.createElement("option");
    option.value = item[valueField];
    option.textContent = item[textField];
    selectElem.appendChild(option);
  });
}
