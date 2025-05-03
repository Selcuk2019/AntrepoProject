document.addEventListener("DOMContentLoaded", async function() {
  const saveBtn = document.getElementById("saveCompanyBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const createCustomsBtn = document.getElementById("createCustomsBtn");
  const refreshCustomsBtn = document.getElementById("refreshCustomsBtn");
  
  let allCustoms = [];
  let allCurrencies = [];
  let selectedCustomIds = [];

  // NEW: Check for edit mode based on URL parameter
  const params = new URLSearchParams(window.location.search);
  const companyId = params.get('id');

  // Para birimleri yükleme
  async function loadCurrencies() {
    try {
      const resp = await fetch('/api/para-birimleri');
      if (!resp.ok) throw new Error('Para birimleri listesi alınamadı');
      allCurrencies = await resp.json();
      
      // Para birimleri select2 dropdown'ı doldur
      const currencySelect = $('#currency');
      currencySelect.empty().append('<option value="">Seçiniz</option>');
      
      allCurrencies.forEach(currency => {
        const option = new Option(
          `${currency.para_birimi_adi} - ${currency.iso_kodu}`, 
          currency.id
        );
        currencySelect.append(option);
      });
      
      // Select2 olarak başlat
      currencySelect.trigger('change');
    } catch (err) {
      console.error('Para birimleri yüklenirken hata:', err);
    }
  }

  // Şehir dropdown doldurma
  async function loadCities() {
    try {
      const resp = await fetch('/api/cities');
      if (!resp.ok) throw new Error('Şehir listesi alınamadı');
      const cityData = await resp.json();

      // İl select2 dropdown'ı doldur
      const citySelect = $('#addressCity');
      citySelect.empty().append('<option value="">Seçiniz</option>');
      
      cityData.forEach(city => {
        const option = new Option(city.sehir_ad, city.id);
        citySelect.append(option);
      });
      
      // Select2 olarak başlat
      citySelect.trigger('change');
    } catch (err) {
      console.error('Şehirler yüklenirken hata:', err);
    }
  }

  // Gümrükleri yükleme
  async function loadCustoms() {
    try {
      const resp = await fetch('/api/customs');
      if (!resp.ok) throw new Error('Gümrük listesi alınamadı');
      allCustoms = await resp.json();
      
      // Gümrükleri select2 dropdown'a doldur
      const customsSelect = $('#serviceCustoms');
      customsSelect.empty();
      
      allCustoms.forEach(custom => {
        const option = new Option(custom.gumruk_adi, custom.gumruk_id);
        customsSelect.append(option);
      });
      
      // Select2 olarak başlat
      customsSelect.trigger('change');
      
      console.log('Gümrükler yüklendi:', allCustoms.length);
    } catch (err) {
      console.error('Gümrükler yüklenirken hata:', err);
    }
  }

  if (companyId) {
    // Change page title and heading for edit mode
    document.title = 'Antrepo Şirketini Düzenle';
    const header = document.querySelector('.new-company-form h1');
    if (header) header.textContent = 'Antrepo Şirketini Düzenle';

    // Load existing company data from the API and prefill the form
    (async function loadCompanyData() {
      try {
        const resp = await fetch(`/api/companies/${companyId}`);
        if (!resp.ok) throw new Error('Şirket bilgileri alınamadı');
        const data = await resp.json();
        
        // Prefill form fields (adjust input IDs as needed)
        document.getElementById("firstName").value = data.firstName || '';
        document.getElementById("lastName").value = data.lastName || '';
        document.getElementById("companyName").value = data.companyName || '';
        document.getElementById("displayName").value = data.displayName || '';
        document.getElementById("emailAddress").value = data.emailAddress || '';
        document.getElementById("phoneNumber").value = data.phoneNumber || '';
        
        // Select2 elementleri için değer atama
        if (data.address?.city_id) {
          $('#addressCity').val(data.address.city_id).trigger('change');
        }
        
        document.getElementById("addressDistrict").value = data.address?.district || '';
        document.getElementById("addressPostalCode").value = data.address?.postalCode || '';
        document.getElementById("addressDetail").value = data.address?.detail || '';
        document.getElementById("taxRate").value = data.taxRate || '';
        document.getElementById("companyID").value = data.taxNumber || '';
        document.getElementById("companyID2").value = data.taxOffice || '';
        
        // Para birimi select2'sine değer atama
        if (data.currency) {
          $('#currency').val(data.currency).trigger('change');
        }
        
        document.getElementById("paymentTerms").value = data.paymentTerms || '';
        
        // Seçili gümrükler varsa, bunları select2'de işaretle
        if (Array.isArray(data.customs) && data.customs.length > 0) {
          $('#serviceCustoms').val(data.customs).trigger('change');
        }
      } catch (err) {
        console.error('Edit form yüklenirken hata:', err);
        alert('Şirket bilgileri yüklenemedi.');
      }
    })();
  }

  // Select2 başlatma
  function initializeSelect2() {
    $('.select2-control').select2({
      placeholder: "Seçiniz...",
      allowClear: true,
      width: '100%'
    });
    
    // Gümrükler için çoklu seçim - dropdown menüsü için maksimum yükseklik
    $('#serviceCustoms').select2({
      placeholder: "Gümrük Ara...",
      allowClear: true,
      width: '100%',
      multiple: true,
      dropdownCssClass: 'select2-dropdown-below',
      closeOnSelect: false,
      dropdownParent: $('body') // Dropdown'u body'ye bağlayarak z-index sorunlarını önleyelim
    }).on('select2:open', function() {
      // Select2 açıldığında, dropdown menüsüne maksimum yükseklik sınırı ekleyelim
      setTimeout(() => {
        $('.select2-dropdown').css('max-height', '250px');
        $('.select2-results__options').css('max-height', '200px');
      }, 0);
    });
  }

  // "Yeni Gümrük Oluştur" butonu
  createCustomsBtn?.addEventListener("click", function() {
    window.open("/pages/new-customs.html", "_blank");
  });

  // "Yenile" butonu
  refreshCustomsBtn?.addEventListener("click", async function() {
    await loadCustoms();
    alert("Gümrük listesi yenilendi");
  });

  // Kaydet butonu
  saveBtn.addEventListener("click", async function() {
    // Form alanlarını topla
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const companyName = document.getElementById("companyName").value;
    const displayName = document.getElementById("displayName").value;
    const emailAddress = document.getElementById("emailAddress").value;
    const phoneNumber = document.getElementById("phoneNumber").value;
    const addressCityId = $('#addressCity').val();
    const addressDistrict = document.getElementById("addressDistrict").value;
    const addressPostalCode = document.getElementById("addressPostalCode").value;
    const addressDetail = document.getElementById("addressDetail").value;
    const taxRate = document.getElementById("taxRate").value;
    const companyID = document.getElementById("companyID").value;
    const companyID2 = document.getElementById("companyID2").value;
    const currency = $('#currency').val();
    const paymentTerms = document.getElementById("paymentTerms").value;
    const documents = document.getElementById("documents").files;
    const selectedCustoms = $('#serviceCustoms').val(); // Seçilen gümrükler

    // Zorunlu alan kontrolleri
    if (!companyName) {
      alert("Lütfen 'Şirket Adı' girin!");
      return;
    }
    if (!displayName) {
      alert("Lütfen 'Görünen İsim' girin!");
      return;
    }
    if (!phoneNumber) {
      alert("Lütfen 'Telefon' girin!");
      return;
    }
    if (!currency) {
      alert("Lütfen 'Para Birimi' seçin!");
      return;
    }
    if (!addressCityId) {
      alert("Lütfen 'İl' seçin!");
      return;
    }
    if (!addressDetail) {
      alert("Lütfen 'Açık Adres' girin!");
      return;
    }

    // newCompany objesi
    const newCompany = {
      firstName,
      lastName,
      companyName,
      displayName,
      emailAddress,
      phoneNumber,
      currency,
      taxRate,
      taxNumber: companyID,
      taxOffice: companyID2,
      paymentTerms,
      documentsCount: documents.length,
      address: {
        city_id: addressCityId,
        district: addressDistrict,
        postalCode: addressPostalCode,
        detail: addressDetail
      },
      customs: selectedCustoms // Seçilen gümrükler
    };

    console.log("Yeni Antrepo Şirketi Kaydı:", newCompany);

    // Artık POST /api/companies isteği atıyoruz
    try {
      const resp = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompany)
      });
      if (resp.ok) {
        const result = await resp.json();
        alert("Şirket başarıyla kaydedildi! ID: " + result.insertedId);
        // Listeye dönmek isterseniz:
        window.location.href = '/pages/company-list.html';
      } else {
        alert("Şirket kaydedilemedi. " + resp.statusText);
      }
    } catch (err) {
      console.error('Kayıt hatası:', err);
      alert('Kayıt sırasında hata oluştu.');
    }
  });

  // İptal butonu
  cancelBtn.addEventListener("click", function() {
    window.history.back();
  });

  // Sayfa yüklenince verileri çek ve Select2'yi başlat
  $(document).ready(function() {
    initializeSelect2();
    loadCities();
    loadCurrencies();
    loadCustoms();
  });
});
