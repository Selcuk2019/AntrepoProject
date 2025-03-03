import { baseUrl } from './config.js';


document.addEventListener('DOMContentLoaded', function() {
    // DataTables başlatma
    const companyTable = $('#companyTable').DataTable({
        ajax: {
            url: '/api/companies',  // GET /api/companies rotası (henüz tanımlanmalı)
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
            {
                data: 'city_name', // Şimdilik veri yoksa backend'de "city_name" döndürmelisiniz.
                defaultContent: ''
            },
            { data: 'created_at' },
            { data: 'updated_at' },
            {
                data: null,
                render: function(data, type, row) {
                    return `
                        <div class="action-buttons">
                            <button class="btn-icon btn-edit" onclick="editCompany(${row.sirket_id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon btn-delete" onclick="deleteCompany(${row.sirket_id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        language: {
            url: '//cdn.datatables.net/plug-ins/1.11.5/i18n/tr.json'
        }
    });

    // "Yeni Şirket Ekle" butonu
    const newCompanyBtn = document.getElementById('newCompanyBtn');
    if (newCompanyBtn) {
        newCompanyBtn.addEventListener('click', () => {
            // new-company-form.html sayfasına gidebilir
            window.location.href = '/pages/new-company-form.html';
        });
    }
});

// Düzenleme fonksiyonu (edit)
function editCompany(id) {
    // Gelecekte "edit-company.html" sayfası varsa, oraya yönlendirebilirsiniz
    window.location.href = `/pages/edit-company.html?id=${id}`;
}

// Silme fonksiyonu (delete)
function deleteCompany(id) {
    if (confirm('Bu şirketi silmek istediğinizden emin misiniz?')) {
        fetch(`/api/companies/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                // Silme başarılı -> tabloyu yeniden yükleyin
                $('#companyTable').DataTable().ajax.reload();
                alert('Kayıt başarıyla silindi.');
            } else {
                console.error('Silme hatası:', response.statusText);
                alert('Silme işlemi başarısız.');
            }
        })
        .catch(err => {
            console.error('Silme isteği hatası:', err);
            alert('Bir hata oluştu.');
        });
    }
}
