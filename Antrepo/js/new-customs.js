import { baseUrl } from './config.js';

document.addEventListener('DOMContentLoaded', async function() {
  try {
    // 1) Şehirler
    const citiesResponse = await fetch(`${baseUrl}/api/cities`);
    if (!citiesResponse.ok) throw new Error(`Cities Error: ${citiesResponse.status}`);
    const cities = await citiesResponse.json();
    const citySelect = document.getElementById('sehir_ad');
    cities.forEach(city => {
      const option = document.createElement('option');
      option.value = city.sehir_ad;
      option.textContent = city.sehir_ad;
      citySelect.appendChild(option);
    });

    // 2) Bölge Müdürlükleri
    const regionsResponse = await fetch(`${baseUrl}/api/regions`);
    if (!regionsResponse.ok) throw new Error(`Regions Error: ${regionsResponse.status}`);
    const regions = await regionsResponse.json();
    const regionSelect = document.getElementById('bolge_mudurlugu');
    regions.forEach(region => {
      const opt = document.createElement('option');
      opt.value = region.bolge_mudurlugu;
      opt.textContent = region.bolge_mudurlugu;
      regionSelect.appendChild(opt);
    });

  } catch (error) {
    console.error('Error loading data:', error);
  }

  // Form submission
  document.getElementById('newCustomsForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      gumruk_adi: document.getElementById('gumruk_adi').value,
      sinif: document.getElementById('sinif').value,
      sehir_ad: document.getElementById('sehir_ad').value,
      bolge_mudurlugu: document.getElementById('bolge_mudurlugu').value,
      notes: document.getElementById('notes').value
    };

    try {
      const response = await fetch(`${baseUrl}/api/customs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) {
        throw new Error(`Sunucu hatası: ${response.status}`);
      }
      // Kayıt başarılı
      alert("Gümrük kaydı başarıyla eklendi!");
      window.location.href = 'customs-list.html';
    } catch (error) {
      console.error('Error:', error);
      alert("Kayıt sırasında hata: " + error.message);
    }
  });
});
