import { baseUrl } from './config.js';

document.addEventListener('DOMContentLoaded', async function() {
    // URL'den ID'yi al
    const urlParams = new URLSearchParams(window.location.search);
    const customsId = urlParams.get('id');
    
    // Form elementi
    const form = document.getElementById('customsForm');
    
    try {
        // Şehirleri yükle
        const citiesResponse = await fetch(`${baseUrl}/api/cities`);
        const cities = await citiesResponse.ok ? await citiesResponse.json() : [];
        const citySelect = document.getElementById('sehir_ad');
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.sehir_ad;
            option.textContent = city.sehir_ad;
            citySelect.appendChild(option);
        });

        // Bölge Müdürlüklerini yükle
        const regionsResponse = await fetch(`${baseUrl}/api/regions`);
        const regions = await regionsResponse.ok ? await regionsResponse.json() : [];
        const regionSelect = document.getElementById('bolge_mudurlugu');
        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region.bolge_mudurlugu;
            option.textContent = region.bolge_mudurlugu;
            regionSelect.appendChild(option);
        });

        // Eğer ID varsa, mevcut gümrük bilgilerini getir
        if (customsId) {
            const customsResponse = await fetch(`${baseUrl}/api/customs/${customsId}`);
            if (customsResponse.ok) {
                const customs = await customsResponse.json();
                document.getElementById('gumruk_adi').value = customs.gumruk_adi;
                document.getElementById('sinif').value = customs.sinif;
                document.getElementById('sehir_ad').value = customs.sehir_ad;
                document.getElementById('bolge_mudurlugu').value = customs.bolge_mudurlugu;
                document.getElementById('notes').value = customs.notes || '';
            }
        }

        // Form submit
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = {
                gumruk_adi: document.getElementById('gumruk_adi').value,
                sinif: document.getElementById('sinif').value,
                sehir_ad: document.getElementById('sehir_ad').value,
                bolge_mudurlugu: document.getElementById('bolge_mudurlugu').value,
                notes: document.getElementById('notes').value
            };

            const url = customsId 
                ? `${baseUrl}/api/customs/${customsId}`
                : `${baseUrl}/api/customs`;

            const method = customsId ? 'PUT' : 'POST';

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    alert(customsId ? 'Gümrük başarıyla güncellendi!' : 'Gümrük başarıyla eklendi!');
                    window.location.href = 'customs-list.html';
                } else {
                    throw new Error('Bir hata oluştu');
                }
            } catch (error) {
                alert('İşlem sırasında bir hata oluştu: ' + error.message);
            }
        });

    } catch (error) {
        console.error('Error:', error);
        alert('Veriler yüklenirken bir hata oluştu.');
    }
});
