import { baseUrl } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    const customsTable = $('#customsTable').DataTable({
        ajax: {
            url: `${baseUrl}/api/customs`,
            dataSrc: '',
            error: function(xhr, error, thrown) {
                console.error('DataTables Error:', error);
            }
        },
        columns: [
            { data: 'gumruk_id' },
            { data: 'gumruk_adi' },
            { data: 'sinif' },
            { data: 'sehir_ad' },
            { data: 'bolge_mudurlugu' },
            {
                data: null,
                orderable: false,
                className: 'text-center',
                render: function(data, type, row) {
                    return `
                        <div class="action-buttons">
                            <button onclick="editCustoms(${row.gumruk_id})" class="modern-btn-icon modern-btn-edit" title="Düzenle">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteCustoms(${row.gumruk_id})" class="modern-btn-icon modern-btn-delete" title="Sil">
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
        customsTable.search(this.value).draw();
    });

    // Yeni Gümrük Ekle butonu
    document.getElementById('newCustomsBtn')?.addEventListener('click', () => {
        window.location.href = '/pages/customs-form.html';
    });

    // Edit butonuna tıklandığında new-customs.html'e yönlendirme yapıyoruz
    window.editCustoms = function(id) {
        window.location.href = `/pages/new-customs.html?id=${id}`;
    };
});

// Edit ve Delete fonksiyonlarını global scope'a taşıyalım
window.deleteCustoms = function(id) {
    if (confirm('Bu gümrüğü silmek istediğinizden emin misiniz?')) {
        fetch(`${baseUrl}/api/customs/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                $('#customsTable').DataTable().ajax.reload();
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
