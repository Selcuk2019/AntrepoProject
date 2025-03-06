import { baseUrl } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    // API yanıtını kontrol et
    fetch(`${baseUrl}/api/antrepolar`)
        .then(response => response.json())
        .then(data => {
            console.log('İlk kayıt:', data[0]);
            initializeDataTable(data);
        })
        .catch(error => console.error('API Error:', error));

    function initializeDataTable(firstData) {
        const antrepoTable = $('#antrepoTable').DataTable({
            ajax: {
                url: `${baseUrl}/api/antrepolar`,
                dataSrc: '',
                error: function(xhr, error, thrown) {
                    console.error('DataTables Error:', error);
                    console.error('Server Response:', xhr.responseText);
                    alert('Veri yüklenirken hata oluştu. Lütfen sayfayı yenileyin.');
                }
            },
            processing: true,
            serverSide: false,
            columns: [
                { data: 'id' },
                { data: 'antrepoKodu', defaultContent: '-' },
                { data: 'antrepoAdi', defaultContent: '-' },
                { data: 'antrepoTipi', defaultContent: '-' },  // antrepo_tipi_name yerine antrepoTipi
                { data: 'gumruk', defaultContent: '-' },       // Gümrük adı
                { data: 'gumrukMudurlugu', defaultContent: '-' }, // Müdürlük adı
                { data: 'sehir', defaultContent: '-' },        // Şehir adı
                { data: 'acikAdres', defaultContent: '-' },
                { data: 'antrepoSirketi', defaultContent: '-' },
                { 
                    data: 'kapasite',
                    defaultContent: '-'
                },
                { 
                    data: 'aktif',
                    render: function(data) {
                        return data ? 'Aktif' : 'Pasif';
                    }
                },
                {
                    data: null,
                    orderable: false,
                    className: 'text-center',
                    render: function(data, type, row) {
                        return `
                            <div class="action-buttons">
                                <button onclick="editAntrepo(${row.id})" class="modern-btn-icon modern-btn-edit" title="Düzenle">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteAntrepo(${row.id})" class="modern-btn-icon modern-btn-delete" title="Sil">
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
            antrepoTable.search(this.value).draw();
        });
    }

    // Yeni Antrepo butonu
    document.getElementById('newAntrepoBtn')?.addEventListener('click', () => {
        window.location.href = '/pages/antrepo-form.html';
    });
});

// Global fonksiyonlar
window.editAntrepo = function(id) {
    // antrepo-form.html yerine antrepo-detail.html'e yönlendir
    window.location.href = `/pages/antrepo-detail.html?id=${id}`;
};

window.deleteAntrepo = function(id) {
    if (confirm('Bu antrepoyu silmek istediğinizden emin misiniz?')) {
        fetch(`${baseUrl}/api/antrepolar/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                $('#antrepoTable').DataTable().ajax.reload();
                alert('Antrepo başarıyla silindi.');
            } else {
                throw new Error('Silme işlemi başarısız.');
            }
        })
        .catch(err => {
            console.error('Silme hatası:', err);
            alert('Antrepo silinirken bir hata oluştu.');
        });
    }
};
