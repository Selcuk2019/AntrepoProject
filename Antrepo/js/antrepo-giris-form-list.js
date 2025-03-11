import { baseUrl } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    // Tarih formatlamak için yardımcı fonksiyon
    function formatDate(dateStr) {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "-";
        return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
    }

    const entriesTable = $('#entriesTable').DataTable({
        ajax: {
            url: `${baseUrl}/api/antrepo-giris`,
            dataSrc: '',
            error: function(xhr, error, thrown) {
                console.error('DataTables Error:', error);
            }
        },
        columns: [
            // Beyanname No sütununu link olarak düzenliyoruz
            { 
                data: 'beyanname_no',
                render: function(data, type, row) {
                    if (type === 'display') {
                        // Link oluşturuyoruz
                        return `<a href="antrepo-giris-formu.html?id=${row.id}&mode=view" class="form-link">${data || ''}</a>`;
                    }
                    return data || '';
                }
            },
            { 
                data: 'beyanname_form_tarihi',
                render: function(data) {
                    return formatDate(data);
                }
            },
            { data: 'antrepo_adi' },
            { data: 'antrepo_sirket_adi' },
            { data: 'gumruk' },
            { data: 'gonderici_sirket' },
            { data: 'alici_sirket' },
            { data: 'urun_tanimi' },
            { data: 'miktar' },
            { data: 'kap_adeti' },
            { 
                data: 'antrepo_giris_tarihi',
                render: function(data) {
                    return formatDate(data);
                }
            },
            { data: 'proforma_no' },
            { data: 'ticari_fatura_no' },
            { data: 'depolama_suresi' },
            // Ekstra sütunları başlangıçta gizli olarak ekleyelim
            { 
                data: 'proforma_tarihi',
                title: 'Proforma Tarihi',
                visible: false,
                render: function(data) {
                    return formatDate(data);
                }
            },
            { 
                data: 'ticari_fatura_tarihi',
                title: 'Ticari Fatura Tarihi',
                visible: false,
                render: function(data) {
                    return formatDate(data);
                }
            },
            { 
                data: 'urun_birim_fiyat',
                title: 'Ürün Birim Fiyat',
                visible: false
            },
            { 
                data: 'para_birimi',
                title: 'Para Birimi',
                visible: false
            },
            {
                data: null,
                orderable: false,
                className: 'text-center',
                render: function(data, type, row) {
                    return `
                        <div class="action-buttons">
                            <button onclick="editEntry(${row.id})" class="modern-btn-icon modern-btn-edit" title="Düzenle">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        responsive: true,
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/tr.json',
            paginate: {
                first: '«',
                previous: '‹',
                next: '›',
                last: '»'
            },
            lengthMenu: 'Sayfa başına _MENU_ kayıt',
            info: 'Toplam _TOTAL_ kayıttan _START_ - _END_ arası gösteriliyor'
        },
        dom: '<"table-top"<"table-header-left"l><"table-header-right"f>>rt<"table-bottom"ip>',
        lengthMenu: [[10, 25, 50, 100], [10, 25, 50, 100]],
        pageLength: 25,
        lengthChange: true,
        autoWidth: false,
        searching: true
    });

    // Stil ekleme - CSS sınıfı
    const style = document.createElement('style');
    style.textContent = `
        .form-link {
            color: #0066cc;
            text-decoration: none;
            font-weight: 500;
        }
        .form-link:hover {
            text-decoration: underline;
            color: #004499;
        }
    `;
    document.head.appendChild(style);

    // Mevcut işlevselliği koru
    window.editEntry = function(id) {
        window.location.href = `antrepo-giris-formu.html?mode=edit&id=${id}`;
    };

    // Yeni Antrepo Giriş Formu oluşturma butonu
    document.getElementById('newEntryBtn')?.addEventListener('click', () => {
        window.location.href = 'antrepo-giris-formu.html';
    });

    // Sütun ekleme dropdown'ı için gerekli elementler
    const addColumnBtn = document.getElementById('addColumnBtn');
    const columnDropdown = document.getElementById('columnDropdown');
    const applyColumnsBtn = document.getElementById('applyColumnsBtn');

    // Sütun ekleme butonuna tıklandığında dropdown'ı göster/gizle
    addColumnBtn?.addEventListener('click', () => {
        columnDropdown.style.display = columnDropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Dropdown dışına tıklandığında kapat
    document.addEventListener('click', (e) => {
        if (!addColumnBtn?.contains(e.target) && !columnDropdown?.contains(e.target)) {
            columnDropdown.style.display = 'none';
        }
    });

    // Seçili sütunları ekle
    applyColumnsBtn?.addEventListener('click', () => {
        const checkboxes = columnDropdown.querySelectorAll('input[type="checkbox"]:checked');
        const table = $('#entriesTable').DataTable();

        checkboxes.forEach(checkbox => {
            const columnName = checkbox.value;
            
            // Sütun tanımları
            const columnDefinitions = {
                'proforma_tarihi': {
                    data: 'proforma_tarihi',
                    title: 'Proforma Tarihi',
                    render: function(data) {
                        return formatDate(data);
                    }
                },
                'ticari_fatura_tarihi': {
                    data: 'ticari_fatura_tarihi',
                    title: 'Ticari Fatura Tarihi',
                    render: function(data) {
                        return formatDate(data);
                    }
                },
                'urun_birim_fiyat': {
                    data: 'urun_birim_fiyat',
                    title: 'Ürün Birim Fiyat'
                },
                'para_birimi': {
                    data: 'para_birimi',
                    title: 'Para Birimi'
                }
            };

            // Sütunu ekle
            if (columnDefinitions[columnName]) {
                table.column.add(columnDefinitions[columnName]).draw();
                checkbox.checked = false;
            }
        });

        columnDropdown.style.display = 'none';
    });

    // Checkbox event listeners
    document.querySelectorAll('#columnDropdown input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // Sütun indeksini bul (15: proforma_tarihi, 16: ticari_fatura_tarihi, vs.)
            let columnIndex;
            switch(this.value) {
                case 'proforma_tarihi':
                    columnIndex = 14;
                    break;
                case 'ticari_fatura_tarihi':
                    columnIndex = 15;
                    break;
                case 'urun_birim_fiyat':
                    columnIndex = 16;
                    break;
                case 'para_birimi':
                    columnIndex = 17;
                    break;
            }
            
            // Sütun görünürlüğünü toggle et
            const column = entriesTable.column(columnIndex);
            column.visible(this.checked);
        });
    });

    // This code is already present above, so we can remove these duplicate event listeners

    /* ...existing column dropdown code... */
});
