import { baseUrl } from './config.js';

document.addEventListener('DOMContentLoaded', async function() {
    const params = new URLSearchParams(window.location.search);
    const antrepoId = params.get("id");

    if (!antrepoId) {
        alert("Antrepo ID bulunamadı!");
        window.location.href = "antrepo-list.html";
        return;
    }

    // Dropdown verilerini yükle
    try {
        // 1. Gümrükler
        const gumrukResp = await fetch(`${baseUrl}/api/customs`);
        const gumrukData = await gumrukResp.json();
        populateDropdown('gumruk', gumrukData, 'gumruk_id', 'gumruk_adi');

        // 2. Gümrük Müdürlükleri
        const mudurlukResp = await fetch(`${baseUrl}/api/regions`);
        const mudurlukData = await mudurlukResp.json();
        populateDropdown('gumrukMudurlugu', mudurlukData, 'bolge_id', 'bolge_mudurlugu');

        // 3. Şehirler
        const sehirResp = await fetch(`${baseUrl}/api/cities`);
        const sehirData = await sehirResp.json();
        populateDropdown('sehir', sehirData, 'id', 'sehir_ad');

        // 4. Antrepo Tipleri
        const tipResp = await fetch(`${baseUrl}/api/antrepo-types`);
        const tipData = await tipResp.json();
        populateDropdown('antrepoTipi', tipData, 'id', 'name');

        // 5. Şirketler
        const sirketResp = await fetch(`${baseUrl}/api/companies`);
        const sirketData = await sirketResp.json();
        populateDropdown('antrepoSirketi', sirketData, 'sirket_id', 'company_name');

        // Antrepo detaylarını çek
        const antrepoResp = await fetch(`${baseUrl}/api/antrepolar/${antrepoId}`);
        if (!antrepoResp.ok) throw new Error('Antrepo bulunamadı');
        
        const antrepo = await antrepoResp.json();
        
        // Form alanlarını doldur
        document.getElementById('antrepoAdi').value = antrepo.antrepoAdi || '';
        document.getElementById('antrepoKodu').value = antrepo.antrepoKodu || '';
        document.getElementById('antrepoTipi').value = antrepo.antrepoTipi || ''; // ID değeri
        document.getElementById('gumruk').value = antrepo.gumruk || '';           // ID değeri
        document.getElementById('gumrukMudurlugu').value = antrepo.gumrukMudurlugu || ''; // ID değeri
        document.getElementById('sehir').value = antrepo.sehir || '';             // ID değeri
        document.getElementById('acikAdres').value = antrepo.acikAdres || '';
        document.getElementById('antrepoSirketi').value = antrepo.antrepoSirketi || ''; // ID değeri

        // Debug için
        console.log('Antrepo Data:', antrepo);
        console.log('Form Elements:', {
            antrepoAdi: document.getElementById('antrepoAdi'),
            antrepoKodu: document.getElementById('antrepoKodu'),
            // ...diğer elementler
        });

    } catch (error) {
        console.error('Hata:', error);
        alert('Veriler yüklenirken hata oluştu!');
    }

    // Dropdown doldurma yardımcı fonksiyonu
    function populateDropdown(selectId, data, valueField, textField) {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML = '<option value="">Seçiniz</option>';
        
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueField];
            option.textContent = item[textField];
            select.appendChild(option);
        });
    }

    // Kaydet butonu
    document.getElementById('saveAntrepoBtn').addEventListener('click', async () => {
        try {
            const updatedData = {
                antrepoAdi: document.getElementById('antrepoAdi').value,
                antrepoKodu: document.getElementById('antrepoKodu').value,
                antrepoTipi: document.getElementById('antrepoTipi').value,
                gumruk: document.getElementById('gumruk').value,
                gumrukMudurlugu: document.getElementById('gumrukMudurlugu').value,
                sehir: document.getElementById('sehir').value,
                acikAdres: document.getElementById('acikAdres').value,
                antrepoSirketi: document.getElementById('antrepoSirketi').value
            };

            console.log('Gönderilen veri:', updatedData);

            const response = await fetch(`${baseUrl}/api/antrepolar/${antrepoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                alert(result.message || 'Antrepo başarıyla güncellendi!');
                window.location.href = 'antrepo-list.html';
            } else {
                throw new Error(result.message || 'Güncelleme başarısız');
            }

        } catch (error) {
            console.error('Güncelleme hatası:', error);
            alert('Güncelleme sırasında hata oluştu: ' + error.message);
        }
    });

    // İptal butonu
    document.getElementById('cancelBtn')?.addEventListener('click', () => {
        window.location.href = 'antrepo-list.html';
    });
});
