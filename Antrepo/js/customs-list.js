import { baseUrl } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
  // DataTables
  const customsTable = $('#customsTable').DataTable({
    ajax: {
      url: `${baseUrl}/api/customs`,   // ÖNEMLİ: baseUrl ile birleştirdik
      dataSrc: '',
      error: function(xhr, error, thrown) {
        console.error('Ajax Error:', xhr.responseText);
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
        render: function(data, type, row) {
          return `
            <div class="action-buttons">
              <button class="btn-icon btn-edit" onclick="editCustoms(${row.gumruk_id})">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-icon btn-delete" onclick="deleteCustoms(${row.gumruk_id})">
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

  // "Yeni Gümrük Ekle" butonu
  const newCustomsBtn = document.getElementById('newCustomsBtn');
  if (newCustomsBtn) {
    newCustomsBtn.addEventListener('click', () => {
      // Aynı klasördeyse sadece "new-customs.html" deriz
      window.location.href = 'new-customs.html';
    });
  }
});

// Düzenleme fonksiyonu
window.editCustoms = function(id) {
  window.location.href = `edit-customs.html?id=${id}`;
};

// Silme fonksiyonu
window.deleteCustoms = function(id) {
  if (confirm('Bu gümrüğü silmek istediğinizden emin misiniz?')) {
    fetch(`${baseUrl}/api/customs/${id}`, { method: 'DELETE' })
      .then(response => {
        if (response.ok) {
          $('#customsTable').DataTable().ajax.reload();
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
};
