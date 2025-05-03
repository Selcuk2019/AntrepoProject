import { baseUrl } from './config.js';

// DOM yüklendikten sonra çalışacak kodlar
document.addEventListener('DOMContentLoaded', function() {
    // Global değişkenler
    let maliyetTable;
    let viewMode = 'beyanname'; // 'beyanname' veya 'product'
    
    // DOM elementleri
    const maliyetTableBody = document.getElementById('maliyetTableBody');
    const viewModeSelect = document.getElementById('viewModeSelect');
    
    // Tablo başlangıç yapılandırması
    const baseColumns = [
        { data: 'beyanname_no', title: 'Beyanname No', render: formatBeyanname },
        { data: 'antrepo_giris_tarihi', title: 'Antrepo Giriş Tarihi', render: formatDate },
        { data: 'antrepo_kodu', title: 'Antrepo Kodu' },
        { data: 'antrepoName', title: 'Antrepo Adı' }
    ];
    
    // Ürün bazlı görünüm için ek kolonlar
    const productColumns = [
        { data: 'productName', title: 'Ürün Adı' },
        { data: 'productCode', title: 'Ürün Kodu' }
    ];
    
    // Ortak sütunlar (her iki görünümde de yer alacak)
    const commonColumns = [
        { data: 'currentStock', title: 'Mevcut Stok', render: formatNumber },
        { data: 'currentCost', title: 'Güncel Maliyet (TL)', render: formatCurrency },
        { data: 'totalCost', title: 'Toplam Maliyet (TL)', render: formatCurrency },
        { data: 'unitCostImpact', title: 'Birim Maliyet Etkisi (TL/kg)', render: formatCurrency },
        { 
            data: null, 
            title: 'İşlemler', 
            className: 'dt-center',
            render: function(data, type, row) {
                return `<a href="hesaplama-motoru.html?id=${row.id}&viewMode=${viewMode}" class="btn-detail">Detay</a>`;
            }
        }
    ];
    
    // Görünüm değiştiğinde tabloyu yeniden oluştur
    if (viewModeSelect) {
        viewModeSelect.addEventListener('change', function() {
            viewMode = this.value;
            if (maliyetTable) {
                maliyetTable.destroy();
            }
            initTable();
            loadMaliyetData();
        });
    }
    
    // Tabloyu oluştur
    function initTable() {
        let columns;
        
        if (viewMode === 'product') {
            columns = [...baseColumns, ...productColumns, ...commonColumns];
        } else { // beyanname
            columns = [...baseColumns, ...commonColumns];
        }
        
        maliyetTable = $('#maliyetTable').DataTable({
            columns: columns,
            responsive: true,
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/tr.json'
            },
            order: [[1, 'desc']]
        });
    }
    
    // Verileri yükle
    async function loadMaliyetData() {
        try {
            const response = await fetch(`${baseUrl}/api/maliyet-analizi?viewMode=${viewMode}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            maliyetTable.clear();
            
            if (viewMode === 'product') {
                // Ürün bazlı veriler
                const processedData = [];
                
                for (const entry of data) {
                    // Her beyanname için hesaplama motoru API'den detaylı bilgi al
                    try {
                        const detailResponse = await fetch(`${baseUrl}/api/hesaplama-motoru/${entry.id}?viewMode=product`);
                        if (!detailResponse.ok) continue;
                        
                        const detailData = await detailResponse.json();
                        
                        if (detailData.products && detailData.products.length > 0) {
                            // Her ürün için bir satır oluştur
                            for (const product of detailData.products) {
                                processedData.push({
                                    id: entry.id,
                                    beyanname_no: entry.beyanname_no || '-',
                                    antrepo_giris_tarihi: entry.antrepo_giris_tarihi,
                                    antrepo_kodu: entry.antrepo_kodu || '-',
                                    antrepoName: entry.antrepoName || '-',
                                    productName: product.urunAdi || '-',
                                    productCode: product.urunKodu || '-',
                                    currentStock: product.currentStock,
                                    currentCost: product.dailyBreakdown && product.dailyBreakdown.length > 0 
                                        ? product.dailyBreakdown[product.dailyBreakdown.length - 1].dayTotal || 0 
                                        : 0,
                                    totalCost: product.totalCost || 0,
                                    unitCostImpact: product.currentStock > 0 
                                        ? product.totalCost / product.currentStock
                                        : 0
                                });
                            }
                        }
                    } catch (detailError) {
                        console.error(`Detay bilgisi alınamadı (ID: ${entry.id}):`, detailError);
                    }
                }
                
                maliyetTable.rows.add(processedData).draw();
                
            } else {
                // Beyanname bazlı veriler (default)
                const processedData = [];
                
                for (const entry of data) {
                    // Her beyanname için hesaplama motoru API'den detaylı bilgi al
                    try {
                        const costData = await fetchCostCalculationForEntry(entry.id);
                        
                        processedData.push({
                            id: entry.id,
                            beyanname_no: entry.beyanname_no || '-',
                            antrepo_giris_tarihi: entry.antrepo_giris_tarihi,
                            antrepo_kodu: entry.antrepo_kodu || '-',
                            antrepoName: entry.antrepoName || '-',
                            currentStock: costData.currentStock || 0,
                            currentCost: costData.currentCost || 0,
                            totalCost: costData.totalCost || 0,
                            unitCostImpact: costData.unitCostImpact || 0
                        });
                    } catch (detailError) {
                        console.error(`Maliyet hesaplaması alınamadı (ID: ${entry.id}):`, detailError);
                    }
                }
                
                maliyetTable.rows.add(processedData).draw();
            }
            
        } catch (error) {
            console.error('Maliyet verileri yüklenirken hata:', error);
            document.getElementById('errorMessage').textContent = `Veri yüklenirken hata oluştu: ${error.message}`;
            document.getElementById('errorMessage').style.display = 'block';
        }
    }
    
    // Yardımcı fonksiyonlar
    function formatDate(data) {
        if (!data) return '-';
        const date = new Date(data);
        return isNaN(date) ? data : date.toLocaleDateString('tr-TR');
    }
    
    function formatBeyanname(data) {
        return data || '-';
    }
    
    function formatNumber(data) {
        return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(data || 0);
    }
    
    function formatCurrency(data) {
        return new Intl.NumberFormat('tr-TR', { 
            style: 'currency', 
            currency: 'TRY',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
        }).format(data || 0);
    }
    
    // Belirtilen giriş ID'si için hesaplama motorundan maliyet verilerini alır
    async function fetchCostCalculationForEntry(girisId) {
        try {
            const response = await fetch(`${baseUrl}/api/hesaplama-motoru/${girisId}`);
            
            if (!response.ok) {
                throw new Error(`API yanıt hatası: ${response.status}`);
            }
            
            const data = await response.json();
            
            return {
                currentStock: parseFloat(data.currentStock) || 0,
                currentCost: data.dailyBreakdown && data.dailyBreakdown.length > 0 
                    ? parseFloat(data.dailyBreakdown[data.dailyBreakdown.length - 1].dayTotal) || 0 
                    : 0,
                totalCost: parseFloat(data.totalCost) || 0,
                unitCostImpact: data.currentStock > 0 
                    ? parseFloat(data.totalCost) / parseFloat(data.currentStock) 
                    : 0
            };
        } catch (error) {
            console.error(`Maliyet hesaplama hatası (ID: ${girisId}):`, error);
            return {
                currentStock: 0,
                currentCost: 0,
                totalCost: 0,
                unitCostImpact: 0
            };
        }
    }
    
    // Sayfa yüklendiğinde tabloyu başlat
    initTable();
    loadMaliyetData();
});

// Excel'e aktarma fonksiyonu (XLSX kütüphanesi gerektirir)
window.exportToExcel = function() {
  const table = document.getElementById("maliyetTable");
  const wb = XLSX.utils.table_to_book(table, { sheet: "Maliyet Analizi" });
  XLSX.writeFile(wb, `Maliyet_Analizi_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Maliyet analizi verilerini render etme fonksiyonu - çoklu ürün desteği eklendi
function renderMaliyetAnaliziData(data) {
  const tableBody = document.getElementById('maliyetAnaliziTableBody');
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  
  if (!data || data.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 10;
    td.textContent = 'Gösterilecek veri bulunmamaktadır';
    td.className = 'text-center';
    tr.appendChild(td);
    tableBody.appendChild(tr);
    return;
  }
  
  data.forEach(item => {
    const tr = document.createElement('tr');
    
    // Beyanname No
    const tdBeyanname = document.createElement('td');
    tdBeyanname.textContent = item.beyanname_no || '-';
    tr.appendChild(tdBeyanname);
    
    // Antrepo
    const tdAntrepo = document.createElement('td');
    tdAntrepo.textContent = item.antrepoName || '-';
    tr.appendChild(tdAntrepo);
    
    // Giriş Tarihi
    const tdGirisTarihi = document.createElement('td');
    if (item.antrepo_giris_tarihi) {
      tdGirisTarihi.textContent = new Date(item.antrepo_giris_tarihi).toLocaleDateString();
    } else {
      tdGirisTarihi.textContent = '-';
    }
    tr.appendChild(tdGirisTarihi);
    
    // Ürün Çeşidi Sayısı
    const tdUrunCesidi = document.createElement('td');
    tdUrunCesidi.textContent = item.urun_cesidi_sayisi || 0;
    tr.appendChild(tdUrunCesidi);
    
    // Toplam Miktar
    const tdToplamMiktar = document.createElement('td');
    tdToplamMiktar.textContent = item.toplam_miktar || 0;
    tr.appendChild(tdToplamMiktar);
    
    // Toplam Kap Adedi
    const tdKapAdedi = document.createElement('td');
    tdKapAdedi.textContent = item.toplam_kap_adeti || 0;
    tr.appendChild(tdKapAdedi);
    
    // Mevcut Stok
    const tdMevcutStok = document.createElement('td');
    tdMevcutStok.textContent = item.currentStock ? item.currentStock.toFixed(2) : '0.00';
    tr.appendChild(tdMevcutStok);
    
    // Mevcut Maliyet
    const tdMevcutMaliyet = document.createElement('td');
    tdMevcutMaliyet.textContent = item.currentCost ? `${item.currentCost.toFixed(2)} ${item.currency || 'USD'}` : `0.00 ${item.currency || 'USD'}`;
    tr.appendChild(tdMevcutMaliyet);
    
    // Toplam Maliyet
    const tdToplamMaliyet = document.createElement('td');
    tdToplamMaliyet.textContent = item.totalCost ? `${item.totalCost.toFixed(2)} ${item.currency || 'USD'}` : `0.00 ${item.currency || 'USD'}`;
    tr.appendChild(tdToplamMaliyet);
    
    // Birim Maliyete Etkisi
    const tdBirimEtki = document.createElement('td');
    tdBirimEtki.textContent = item.unitCostImpact ? `${item.unitCostImpact.toFixed(2)} ${item.currency || 'USD'}` : `0.00 ${item.currency || 'USD'}`;
    tr.appendChild(tdBirimEtki);
    
    // İşlemler (Detay butonu)
    const tdIslemler = document.createElement('td');
    const detayBtn = document.createElement('button');
    detayBtn.textContent = 'Detay';
    detayBtn.className = 'btn btn-primary btn-sm';
    detayBtn.onclick = () => {
      window.open(`hesaplama-motoru.html?entryId=${item.id}`, '_blank');
    };
    tdIslemler.appendChild(detayBtn);
    tr.appendChild(tdIslemler);
    
    tableBody.appendChild(tr);
  });
}
