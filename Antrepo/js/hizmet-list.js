import { baseUrl } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    const hizmetTable = $('#hizmetTable').DataTable({
        ajax: {
            url: `${baseUrl}/api/hizmetler`,
            dataSrc: '',
            error: function(xhr, error, thrown) {
                console.error('DataTables Error:', error);
            }
        },
        columns: [
            { data: 'id' },
            { data: 'hizmet_adi' },
            { data: 'hizmet_kodu' },
            { data: 'hizmet_tipi' },
            { data: 'birim_adi' },
            { data: 'para_birimi_adi' },
            { 
                data: 'temel_ucret',
                render: function(data) {
                    return parseFloat(data).toFixed(2);
                }
            },
            { 
                data: 'min_ucret',
                render: function(data) {
                    return data ? parseFloat(data).toFixed(2) : '-';
                }
            },
            { 
                data: 'carpan',
                render: function(data) {
                    return data ? parseFloat(data).toFixed(3) : '-';
                }
            },
            { data: 'durum' },
            {
                data: null,
                orderable: false,
                className: 'text-center',
                render: function(data, type, row) {
                    return `
                        <div class="action-buttons">
                            <button onclick="editHizmet(${row.id})" class="modern-btn-icon modern-btn-edit" title="Düzenle">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteHizmet(${row.id})" class="modern-btn-icon modern-btn-delete" title="Sil">
                                <i class="fas fa-trash"></i>
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

    // Custom arama fonksiyonunu bağlama
    $('.modern-search').on('keyup', function() {
        hizmetTable.search(this.value).draw();
    });

    // Yeni Hizmet Ekle butonu
    document.getElementById('newHizmetBtn')?.addEventListener('click', () => {
        window.location.href = '/pages/hizmet-form.html';
    });
});

// Edit ve Delete fonksiyonları
window.editHizmet = function(id) {
    window.location.href = `/pages/hizmet-form.html?id=${id}`;
};

window.deleteHizmet = function(id) {
    if (confirm('Bu hizmeti silmek istediğinizden emin misiniz?')) {
        fetch(`${baseUrl}/api/hizmetler/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                $('#hizmetTable').DataTable().ajax.reload();
                alert('Kayıt başarıyla silindi.');
            } else {
                throw new Error('Silme işlemi başarısız.');
            }
        })
        .catch(err => {
            console.error('Silme hatası:', err);
            alert('Silme işlemi sırasında bir hata oluştu.');
        });
    }
};
