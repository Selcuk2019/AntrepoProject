import { baseUrl } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    const contractTable = $('#contractTable').DataTable({
        ajax: {
            url: `${baseUrl}/api/sozlesmeler`,
            dataSrc: '',
            error: function(xhr, error, thrown) {
                console.error('DataTables Error:', error);
            }
        },
        columns: [
            { data: 'id' },
            { data: 'sozlesme_kodu' },
            { data: 'sozlesme_adi' },
            { 
                data: 'baslangic_tarihi',
                render: function(data) {
                    return data ? new Date(data).toLocaleDateString('tr-TR') : '-';
                }
            },
            { 
                data: 'bitis_tarihi',
                render: function(data) {
                    return data ? new Date(data).toLocaleDateString('tr-TR') : '-';
                }
            },
            { data: 'fatura_periyodu' },
            { 
                data: 'min_fatura',
                render: function(data, type, row) {
                    return `${parseFloat(data || 0).toFixed(2)} ${row.para_birimi || 'TL'}`;
                }
            },
            {
                data: null,
                orderable: false,
                className: 'text-center',
                render: function(data, type, row) {
                    return `
                        <div class="action-buttons">
                            <button onclick="editContract(${row.id})" class="modern-btn-icon modern-btn-edit" title="Düzenle">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteContract(${row.id})" class="modern-btn-icon modern-btn-delete" title="Sil">
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
        lengthChange: true
    });

    // Custom arama fonksiyonunu bağlama
    $('.modern-search').on('keyup', function() {
        contractTable.search(this.value).draw();
    });

    // Yeni Sözleşme butonu
    document.getElementById('newContractBtn')?.addEventListener('click', () => {
        window.location.href = '/pages/contract-form.html';
    });
});

// Global fonksiyonlar
window.editContract = function(id) {
    window.location.href = `/pages/contract-form.html?id=${id}`;
};

window.deleteContract = function(id) {
    if (confirm('Bu sözleşmeyi silmek istediğinizden emin misiniz?')) {
        fetch(`${baseUrl}/api/sozlesmeler/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                $('#contractTable').DataTable().ajax.reload();
                showSuccess('Sözleşme başarıyla silindi');
            } else {
                throw new Error('Silme işlemi başarısız');
            }
        })
        .catch(err => {
            console.error('Silme hatası:', err);
            showError('Sözleşme silinirken bir hata oluştu');
        });
    }
};

function showSuccess(message) {
    const div = document.createElement('div');
    div.className = 'alert alert-success';
    div.textContent = message;
    document.querySelector('.content').insertBefore(div, document.querySelector('.modern-card'));
    setTimeout(() => div.remove(), 3000);
}

function showError(message) {
    const div = document.createElement('div');
    div.className = 'alert alert-danger';
    div.textContent = message;
    document.querySelector('.content').insertBefore(div, document.querySelector('.modern-card'));
    setTimeout(() => div.remove(), 3000);
}