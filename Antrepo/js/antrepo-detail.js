import { baseUrl } from './config.js';

document.addEventListener('DOMContentLoaded', async function() {
    // URL parametresinden antrepoId'yi al
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
        document.getElementById('antrepoTipi').value = antrepo.antrepoTipi || '';
        document.getElementById('gumruk').value = antrepo.gumruk || '';
        document.getElementById('gumrukMudurlugu').value = antrepo.gumrukMudurlugu || '';
        document.getElementById('sehir').value = antrepo.sehir || '';
        document.getElementById('acikAdres').value = antrepo.acikAdres || '';
        document.getElementById('antrepoSirketi').value = antrepo.antrepoSirketi || '';

        console.log('Antrepo Data:', antrepo);
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

    // Kaydet butonu işlevi
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

    // İptal butonu işlevi
    document.getElementById('cancelBtn')?.addEventListener('click', () => {
        window.location.href = 'antrepo-list.html';
    });

    // Sekme (tab) geçiş işlevselliği
    const tabButtons = document.querySelectorAll('.tabs-menu li');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Tüm sekmelerden ve panelden aktif sınıfları kaldır
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));

            // Tıklanan sekmeye ve ilgili panele aktif sınıfı ekle
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            // Eğer "Stok Miktarları" sekmesi seçildiyse, tabloyu initialize et
            if (tabId === 'stockQuantitiesTab') {
                initializeStockQuantitiesTable();
            }
            
            // Eğer "Stok Hareketleri" sekmesi seçildiyse, hareketler tablosunu initialize et
            if (tabId === 'stockMovementsTab') {
                initializeStockMovementsTable();
            }
        });
    });

    // Stok miktarları tablosunun initialize edilmesi (maliyet analizi verisi üzerinden)
    async function initializeStockQuantitiesTable() {
        try {
            // 1. Antrepo ID'sini URL'den al
            const params = new URLSearchParams(window.location.search);
            const antrepoId = params.get("id");
            
            // 2. Maliyet Analizi verilerinin TAMAMINI bir kerede çek
            const response = await fetch(`${baseUrl}/api/maliyet-analizi`);
            if (!response.ok) throw new Error('Maliyet analizi verisi alınamadı');
            const allData = await response.json();
            
            // 3. Frontend'de bu antrepoya ait kayıtları filtrele 
            const filteredByAntrepo = allData.filter(item => 
                String(item.antrepoId) === String(antrepoId)
            );
            
            // 4. Ürün bazlı gruplama: Aynı productCode'a sahip kayıtların toplamları
            const groupedMap = {};
            filteredByAntrepo.forEach(item => {
                const code = item.productCode;
                if (!groupedMap[code]) {
                    groupedMap[code] = {
                        productName: item.productName,
                        productCode: code,
                        currentStock: 0,
                        currentKapCount: 0,
                        totalCost: 0,
                        paraBirimi: item.paraBirimi
                    };
                }
                
                // Her kayıt için değerleri topla
                groupedMap[code].currentStock += parseFloat(item.currentStock || 0);
                groupedMap[code].currentKapCount += parseInt(item.currentKapCount || 0);
                
                // Her kayıt için toplam maliyeti topla
                groupedMap[code].totalCost += parseFloat(item.totalCost || 0);
            });
            
            // 5. DataTable için array oluştur
            const tableData = Object.values(groupedMap);

            // Eğer DataTable zaten kurulmuşsa destroy et
            if ($.fn.DataTable.isDataTable('#stockQuantitiesTable')) {
                $('#stockQuantitiesTable').DataTable().destroy();
            }

            // 6. DataTable'ı initialize et
            $('#stockQuantitiesTable').DataTable({
                data: tableData,
                ordering: true,
                pageLength: 10,
                responsive: true,
                language: {
                    url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/tr.json"
                },
                // "Toplam Maliyet" ve "Detay" sütunlarını gizle (indeks 4 ve 5)
                columnDefs: [
                    { 
                        targets: [4, 5], // 4: Toplam Maliyet, 5: Detay
                        visible: false
                    }
                ],
                columns: [
                    { 
                        title: "Ürün Adı",
                        data: 'productName',
                        render: function(data) {
                            return data || '-';
                        }
                    },
                    { 
                        title: "Ürün Kodu",
                        data: 'productCode',
                        render: function(data) {
                            return data || '-';
                        }
                    },
                    { 
                        title: "Mevcut Miktar (Ton)",
                        data: 'currentStock',
                        render: function(data) {
                            return parseFloat(data).toFixed(2) + ' ton';
                        }
                    },
                    { 
                        title: "Kap Adedi",
                        data: 'currentKapCount',
                        render: function(data) {
                            return data || '0';
                        }
                    },
                    { 
                        title: "Toplam Maliyet",
                        data: 'totalCost',
                        render: function(data, type, row) {
                            return parseFloat(data).toFixed(2) + ' ' + row.paraBirimi;
                        }
                    },
                    {
                        title: "Detay",
                        data: 'productCode',
                        render: function(data) {
                            return `<button class="btn btn-sm btn-primary" onclick="goToMaliyetAnalizi('${data}')">
                                        Detay
                                    </button>`;
                        }
                    }
                ]
            });

        } catch (error) {
            console.error('Stok miktarları yükleme hatası:', error);
            alert('Stok miktarları yüklenirken bir hata oluştu!');
        }
    }

    // Stok hareketleri tablosunu initialize etme fonksiyonu
    async function initializeStockMovementsTable() {
        try {
            const params = new URLSearchParams(window.location.search);
            const antrepoId = params.get("id");
            
            if (!antrepoId) {
                console.error("Antrepo ID bulunamadı!");
                return;
            }
            
            // API'den veri çekme
            const response = await fetch(`${baseUrl}/api/antrepolar/${antrepoId}/hareketler`);
            if (!response.ok) throw new Error("Hareket verileri alınamadı");
            const data = await response.json();
            
            // Eğer DataTable zaten kurulmuşsa destroy et
            if ($.fn.DataTable.isDataTable('#stokMovementsTable')) {
                $('#stokMovementsTable').DataTable().destroy();
            }
            
            // DataTable oluştur
            $('#stokMovementsTable').DataTable({
                data: data,
                columns: [
                    { 
                        data: 'form_no', 
                        title: 'Form No',
                        render: function(data) { return data || '-'; }
                    },
                    { 
                        data: 'urun_tanimi', 
                        title: 'Ürün Adı',
                        render: function(data) { return data || '-'; }
                    },
                    { 
                        data: 'urun_kodu', 
                        title: 'Ürün Kodu',
                        render: function(data) { return data || '-'; }
                    },
                    { 
                        data: 'islem_tipi', 
                        title: 'İşlem Tipi',
                        render: function(data) { 
                            if (data === 'Giriş') {
                                return '<span class="badge bg-success">Giriş</span>';
                            } else {
                                return '<span class="badge bg-danger">Çıkış</span>';
                            }
                        }
                    },
                    { 
                        data: 'islem_tarihi', 
                        title: 'İşlem Tarihi',
                        render: function(data) { 
                            if (!data) return '-';
                            return new Date(data).toLocaleDateString('tr-TR'); 
                        }
                    },
                    { 
                        data: 'miktar', 
                        title: 'Miktar',
                        render: function(data, type, row) { 
                            return data != null ? parseFloat(data).toFixed(2) + ' ' + (row.birim_adi || 'ton') : '-';
                        }
                    },
                    { 
                        data: 'kap_adeti', 
                        title: 'Kap Adedi',
                        render: function(data) { return data != null ? data : '-'; }
                    },
                    { 
                        data: 'aciklama', 
                        title: 'Açıklama',
                        render: function(data) { return data || '-'; }
                    }
                ],
                responsive: true,
                order: [[4, 'desc']], // İşlem tarihi sütununa göre sıralama
                pageLength: 10,
                language: {
                    url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/tr.json"
                }
            });

        } catch (error) {
            console.error("Stok hareketleri yüklenirken hata:", error);
            alert("Stok hareketleri yüklenirken bir hata oluştu!");
        }
    }

    // Global fonksiyon: Detay butonuna tıklanınca maliyet analizi sayfasına yönlendir
    window.goToMaliyetAnalizi = function(productCode) {
        window.location.href = `maliyet-analizi-index.html?filter=${encodeURIComponent(productCode)}`;
    };

    // Sayfa yüklenirken "Stok Miktarları" sekmesi aktifse tabloyu initialize et
    const stockTabElement = document.querySelector('#stockQuantitiesTab');
    if (stockTabElement && stockTabElement.classList.contains('active')) {
        initializeStockQuantitiesTable();
    }

    // Sayfa yüklenirken "Stok Hareketleri" sekmesi aktifse tabloyu initialize et
    const stockMovementsTabElement = document.querySelector('#stockMovementsTab');
    if (stockMovementsTabElement && stockMovementsTabElement.classList.contains('active')) {
        initializeStockMovementsTable();
    }
});
