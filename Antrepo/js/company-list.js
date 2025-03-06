import { baseUrl } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    const companyTable = $('#companyTable').DataTable({
        ajax: {
            url: '/api/companies',
            dataSrc: '',
            error: function(xhr, error, thrown) {
                console.error('DataTables Error:', error);
            }
        },
        columns: [
            { data: 'sirket_id' },
            { data: 'company_name' },
            { data: 'display_name' },
            { data: 'phone_number' },
            { data: 'email' },
            { data: 'city_name', defaultContent: '' },
            { 
                data: 'created_at',
                render: function(data) {
                    if (!data) return '';
                    const date = new Date(data);
                    return date.toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                }
            },
            { 
                data: 'updated_at',
                render: function(data) {
                    if (!data) return '';
                    const date = new Date(data);
                    return date.toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                }
            },
            {
                data: null,
                orderable: false,
                className: 'text-center',
                render: function(data, type, row) {
                    return `
                        <div class="action-buttons">
                            <button onclick="editCompany(${row.sirket_id})" class="modern-btn-icon modern-btn-edit" title="Düzenle">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteCompany(${row.sirket_id})" class="modern-btn-icon modern-btn-delete" title="Sil">
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
        companyTable.search(this.value).draw();
    });

    // Yeni Şirket Ekle butonu
    document.getElementById('newCompanyBtn')?.addEventListener('click', () => {
        window.location.href = '/pages/new-company-form.html';
    });
});

// Edit ve Delete fonksiyonlarını global scope'a taşıyalım
window.editCompany = function(id) {
    window.location.href = `/pages/new-company-form.html?id=${id}`;
};

window.deleteCompany = function(id) {
    if (confirm('Bu şirketi silmek istediğinizden emin misiniz?')) {
        fetch(`/api/companies/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                $('#companyTable').DataTable().ajax.reload();
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
