import { baseUrl } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    const entriesTable = $('#entriesTable').DataTable({
        ajax: {
            url: `${baseUrl}/api/antrepo-giris`,
            dataSrc: '',
            error: function(xhr, error, thrown) {
                console.error('DataTables Error:', error);
            }
        },
        columns: [
            { data: 'beyanname_no' },
            { data: 'beyanname_form_tarihi' },
            { data: 'antrepo_adi' },
            { data: 'antrepo_sirket_adi' },
            { data: 'gumruk' },
            { data: 'gonderici_sirket' },
            { data: 'alici_sirket' },
            { data: 'urun_tanimi' },
            { data: 'miktar' },
            { data: 'kap_adeti' },
            { data: 'antrepo_giris_tarihi' },
            { data: 'proforma_no' },
            { data: 'ticari_fatura_no' },
            { data: 'depolama_suresi' },
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
                first: '<i class="fas fa-angle-double-left"></i>',
                previous: '<i class="fas fa-angle-left"></i>',
                next: '<i class="fas fa-angle-right"></i>',
                last: '<i class="fas fa-angle-double-right"></i>'
            },
            lengthMenu: 'Sayfa başına _MENU_ kayıt göster',
            info: 'Toplam _TOTAL_ kayıttan _START_ - _END_ arası gösteriliyor'
        },
        dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
             '<"row"<"col-sm-12"tr>>' +
             '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Tümü"]],
        pageLength: 10,
        lengthChange: true,
        autoWidth: false,
        searching: true
    });

    // Mevcut işlevselliği koru
    window.editEntry = function(id) {
        window.location.href = `antrepo-giris-formu.html?mode=edit&id=${id}`;
    };

    // Yeni Antrepo Giriş Formu oluşturma butonu
    document.getElementById('newEntryBtn')?.addEventListener('click', () => {
        window.location.href = 'antrepo-giris-formu.html';
    });

    /* ...existing column dropdown code... */
});
