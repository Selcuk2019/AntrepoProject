// File: new-company-form.js
import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async function() {
  const saveBtn = document.getElementById("saveCompanyBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const createCustomsBtn = document.getElementById("createCustomsBtn");
  const refreshCustomsBtn = document.getElementById("refreshCustomsBtn");
  
  let allCustoms = [];
  let allCurrencies = [];
  
  // URL parametrelerini oku
  const params = new URLSearchParams(window.location.search);
  const companyId = params.get('id');

  // -------------------------------
  // Para Birimlerini Yükleyen Fonksiyon (endpoint: /api/para-birimleri)
  async function loadCurrencies() {
    try {
      const resp = await fetch(`${baseUrl}/api/para-birimleri`);
      if (!resp.ok) throw new Error('Para birimleri listesi alınamadı');
      allCurrencies = await resp.json();
      
      const currencySelect = $('#currency');
      currencySelect.empty().append('<option value="">Seçiniz</option>');
      
      allCurrencies.forEach(currency => {
        const option = new Option(
          `${currency.para_birimi_adi} - ${currency.iso_kodu}`, 
          currency.id
        );
        currencySelect.append(option);
      });
      
      currencySelect.trigger('change');
    } catch (err) {
      console.error('Para birimleri yüklenirken hata:', err);
    }
  }

  // -------------------------------
  // Şehirleri Yükleyen Fonksiyon (endpoint: /api/cities)
  async function loadCities() {
    try {
      const resp = await fetch(`${baseUrl}/api/cities`);
      if (!resp.ok) throw new Error('Şehir listesi alınamadı');
      const cityData = await resp.json();

      const citySelect = $('#addressCity');
      citySelect.empty().append('<option value="">Seçiniz</option>');
      
      cityData.forEach(city => {
        const option = new Option(city.sehir_ad, city.id);
        citySelect.append(option);
      });
      
      citySelect.trigger('change');
    } catch (err) {
      console.error('Şehirler yüklenirken hata:', err);
    }
  }

  // -------------------------------
  // Gümrükleri Yükleyen Fonksiyon (endpoint: /api/customs)
  async function loadCustoms() {
    try {
      const resp = await fetch(`${baseUrl}/api/customs`);
      if (!resp.ok) throw new Error('Gümrük listesi alınamadı');
      allCustoms = await resp.json();
      
      const customsSelect = $('#serviceCustoms');
      customsSelect.empty();
      
      allCustoms.forEach(custom => {
        const option = new Option(custom.gumruk_adi, custom.gumruk_id);
        customsSelect.append(option);
      });
      
      customsSelect.trigger('change');
      console.log('Gümrükler yüklendi:', allCustoms.length);
    } catch (err) {
      console.error('Gümrükler yüklenirken hata:', err);
    }
  }

  async function loadCompanyData(id) {

    console.log("taxRate elementi:", document.getElementById("taxRate"));
    console.log("addressCity elementi:", document.getElementById("addressCity"));
    console.log("serviceCustoms elementi:", document.getElementById("serviceCustoms"));

    try {
      const resp = await fetch(`${baseUrl}/api/companies/${id}`);
      if (!resp.ok) throw new Error('Şirket bilgileri alınamadı');
      const data = await resp.json();
      
      console.log("Yüklenen şirket verileri:", data);
      
      // Metin alanları
      document.getElementById("firstName").value = data.first_name || '';
      document.getElementById("lastName").value = data.last_name || '';
      document.getElementById("companyName").value = data.company_name || '';
      document.getElementById("displayName").value = data.display_name || '';
      document.getElementById("emailAddress").value = data.email || '';
      document.getElementById("phoneNumber").value = data.phone_number || '';
      
      // Adres alanları
      if (data.address_city_id) {
        $('#addressCity').val(data.address_city_id).trigger('change');
        setTimeout(() => {
          $('#addressCity').val(data.address_city_id).trigger('change');
        }, 500);
      }
      document.getElementById("addressDistrict").value = data.address_district || '';
      document.getElementById("addressPostalCode").value = data.address_postal_code || '';
      document.getElementById("addressDetail").value = data.address_detail || '';
      
      // Vergi ve ödeme alanları
      if (data.tax_rate) {
        document.getElementById("taxRate").value = parseFloat(data.tax_rate).toFixed(2);
      }
      document.getElementById("companyID").value = data.tax_number || '';
      document.getElementById("companyID2").value = data.tax_office || '';
      document.getElementById("paymentTerms").value = data.payment_terms || '';
      
      // Para Birimi (Select2)
      if (data.currency) {
        $('#currency').val(data.currency).trigger('change');
        setTimeout(() => {
          $('#currency').val(data.currency).trigger('change.select2');
        }, 500);
      } else {
        $('#currency').val("").trigger('change');
      }
      
      // Gümrükler: customs_info JSON sütunundan veriyi alıp formda Select2'ye aktarın
      if (data.customs_info) {
        try {
          const customsData = JSON.parse(data.customs_info); // Örn: ["2","5"]
          if (Array.isArray(customsData)) {
            setTimeout(() => {
              $('#serviceCustoms').val(customsData).trigger('change.select2');
            }, 500);
          } else {
            $('#serviceCustoms').val([]).trigger('change');
          }
        } catch (parseErr) {
          $('#serviceCustoms').val([]).trigger('change');
        }
      } else {
        $('#serviceCustoms').val([]).trigger('change');
      }
    } catch (err) {
      console.error('Edit form yüklenirken hata:', err);
      alert('Şirket bilgileri yüklenemedi.');
    }
  }
  
  
  // -------------------------------
  // Select2 Başlatma Fonksiyonu
  function initializeSelect2() {
    $('.select2-control').select2({
      placeholder: "Seçiniz...",
      allowClear: true,
      width: '100%'
    });
    
    $('#serviceCustoms').select2({
      placeholder: "Gümrük Ara...",
      allowClear: true,
      width: '100%',
      multiple: true,
      dropdownCssClass: 'select2-dropdown-below',
      closeOnSelect: false,
      dropdownParent: $('body')
    }).on('select2:open', function() {
      setTimeout(() => {
        $('.select2-dropdown').css('max-height', '250px');
        $('.select2-results__options').css('max-height', '200px');
      }, 0);
    });
  }

  // -------------------------------
  // Ek Buton İşlemleri (Gümrük Oluştur / Yenile)
  createCustomsBtn?.addEventListener("click", function() {
    window.open("/pages/new-customs.html", "_blank");
  });

  refreshCustomsBtn?.addEventListener("click", async function() {
    await loadCustoms();
    alert("Gümrük listesi yenilendi");
  });

  // -------------------------------
  // Şirket Kaydetme / Güncelleme İşlemi
  saveBtn.addEventListener("click", async function() {
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const companyName = document.getElementById("companyName").value.trim();
    const displayName = document.getElementById("displayName").value.trim();
    const emailAddress = document.getElementById("emailAddress").value.trim();
    const phoneNumber = document.getElementById("phoneNumber").value.trim();
    const addressCityId = $('#addressCity').val();
    const addressDistrict = document.getElementById("addressDistrict").value.trim();
    const addressPostalCode = document.getElementById("addressPostalCode").value.trim();
    const addressDetail = document.getElementById("addressDetail").value.trim();
    const taxRate = document.getElementById("taxRate").value.trim();
    const companyID = document.getElementById("companyID").value.trim();
    const companyID2 = document.getElementById("companyID2").value.trim();
    const currency = $('#currency').val();
    const paymentTerms = document.getElementById("paymentTerms").value.trim();
    const documents = document.getElementById("documents")?.files || [];
    const selectedCustoms = $('#serviceCustoms').val() || [];
  
    if (!companyName) return alert("Lütfen 'Şirket Adı' girin!");
    if (!displayName) return alert("Lütfen 'Görünen İsim' girin!");
    if (!phoneNumber) return alert("Lütfen 'Telefon' girin!");
    if (!currency) return alert("Lütfen 'Para Birimi' seçin!");
    if (!addressCityId) return alert("Lütfen 'İl' seçin!");
    if (!addressDetail) return alert("Lütfen 'Açık Adres' girin!");
  
    // KDV oranını sayısal değere dönüştürelim (örneğin, 20.00 gibi)
    const taxRateNumeric = parseFloat(taxRate) || 0;
  
    const newCompany = {
      firstName,
      lastName,
      companyName,
      displayName,
      emailAddress,
      phoneNumber,
      currency,
      taxRate: taxRateNumeric,  // Sayısal değer gönderiliyor
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
      customs: selectedCustoms  // Eğer customs verisi güncelleme sırasında gönderilecekse
    };
  
    console.log("Kaydedilecek Şirket:", newCompany);
  
    let method = 'POST';
    let url = `${baseUrl}/api/companies`;
    if (companyId) {
      method = 'PUT';
      url = `${baseUrl}/api/companies/${companyId}`;
    }
  
    try {
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompany)
      });
      if (resp.ok) {
        const result = await resp.json();
        if (companyId) {
          alert("Şirket başarıyla güncellendi!");
        } else {
          alert("Şirket başarıyla kaydedildi! ID: " + result.insertedId);
        }
        window.location.href = '/pages/company-list.html';
      } else {
        alert("Şirket kaydedilemedi. " + resp.statusText);
      }
    } catch (err) {
      console.error('Kayıt/Güncelleme hatası:', err);
      alert('İşlem sırasında hata oluştu.');
    }
  });
  

  // -------------------------------
  // İptal Butonu
  cancelBtn.addEventListener("click", function() {
    window.history.back();
  });

  // -------------------------------
  // Sayfa Yüklenince: Select2 Başlat, Verileri Yükle
  $(document).ready(function() {
    initializeSelect2();
    loadCities();
    loadCurrencies();
    loadCustoms();
  });

  // Edit modundaysa, formu doldur
  if (companyId) {
    document.title = 'Antrepo Şirketini Düzenle';
    const header = document.querySelector('.new-company-form h1');
    if (header) header.textContent = 'Antrepo Şirketini Düzenle';
    loadCompanyData(companyId);
  }
});
