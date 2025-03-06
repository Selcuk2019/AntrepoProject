import { baseUrl } from './config.js';

document.addEventListener('DOMContentLoaded', async function() {
    // URL'den ID parametresini al
    const urlParams = new URLSearchParams(window.location.search);
    const customsId = urlParams.get('id');
    
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

        // Eğer ID varsa, mevcut gümrük bilgilerini getir ve formu doldur
        if (customsId) {
            try {
                const response = await fetch(`${baseUrl}/api/customs/${customsId}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const customs = await response.json();
                    
                // Form alanlarını doldur
                document.getElementById('gumruk_adi').value = customs.gumruk_adi || '';
                document.getElementById('sinif').value = customs.sinif || '';
                document.getElementById('sehir_ad').value = customs.sehir_ad || '';
                document.getElementById('bolge_mudurlugu').value = customs.bolge_mudurlugu || '';
                document.getElementById('notes').value = customs.notes || '';

                // Sayfa başlığını güncelle
                document.querySelector('.page-header h1').textContent = 'Gümrük Düzenle';
            } catch (error) {
                console.error('Gümrük bilgileri yüklenirken hata:', error);
                alert('Gümrük bilgileri yüklenirken bir hata oluştu.');
            }
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

            // Eğer ID varsa PUT, yoksa POST işlemi yap
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

                if (!response.ok) throw new Error('İşlem başarısız');

                alert(customsId ? 'Gümrük başarıyla güncellendi!' : 'Gümrük başarıyla eklendi!');
                window.location.href = 'customs-list.html';
            } catch (error) {
                console.error('Error:', error);
                alert('İşlem sırasında bir hata oluştu: ' + error.message);
            }
        });

    } catch (error) {
        console.error('Error:', error);
        alert('Veriler yüklenirken bir hata oluştu.');
    }
});
