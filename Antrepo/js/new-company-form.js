document.addEventListener("DOMContentLoaded", async function() {
  const saveBtn = document.getElementById("saveCompanyBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const createCustomsBtn = document.getElementById("createCustomsBtn");
  const refreshCustomsBtn = document.getElementById("refreshCustomsBtn");

  const customsSearchInput = document.getElementById("customsSearchInput");
  const searchResults = document.getElementById("searchResults");
  const selectedCustomsContainer = document.getElementById("selectedCustoms");

  let allCustoms = [];
  let selectedCustomIds = [];

  // Şehir dropdown doldurma
  async function loadCities() {
    try {
      const resp = await fetch('/api/cities');
      if (!resp.ok) throw new Error('Şehir listesi alınamadı');
      const cityData = await resp.json();

      const addressCitySelect = document.getElementById('addressCity');
      // addressCitySelect.innerHTML = '<option value="">Seçiniz</option>'; // isterseniz
      cityData.forEach(city => {
        const option = document.createElement('option');
        option.value = city.id;
        option.textContent = city.sehir_ad;
        addressCitySelect.appendChild(option);
      });
    } catch (err) {
      console.error('Error loading cities:', err);
    }
  }

  // Gümrükleri yükleme
  async function loadCustoms() {
    try {
      const resp = await fetch('/api/customs');
      if (!resp.ok) throw new Error('Gümrük listesi alınamadı');
      allCustoms = await resp.json();
      console.log('Gümrükler yüklendi:', allCustoms.length);
    } catch (err) {
      console.error('Error loading customs:', err);
    }
  }

  // Arama inputu
  customsSearchInput?.addEventListener('input', function() {
    const query = customsSearchInput.value.toLowerCase().trim();
    if (!query) {
      searchResults.style.display = 'none';
      return;
    }
    const filtered = allCustoms.filter(c =>
      // Verinizde gumruk_adi veya gumruk_mudurlugu hangisiyse:
      c.gumruk_mudurlugu?.toLowerCase().includes(query)
    );
    renderSearchResults(filtered);
  });

  function renderSearchResults(list) {
    if (list.length === 0) {
      searchResults.innerHTML = '<div class="dropdown-item">Sonuç yok</div>';
      searchResults.style.display = 'block';
      return;
    }
    searchResults.innerHTML = '';
    list.forEach(item => {
      const div = document.createElement('div');
      div.className = 'dropdown-item';
      div.textContent = item.gumruk_mudurlugu; // Örn. "Antalya Gümrük Müdürlüğü"
      div.addEventListener('click', () => {
        addCustomsChip(item);
        searchResults.style.display = 'none';
        customsSearchInput.value = '';
      });
      searchResults.appendChild(div);
    });
    searchResults.style.display = 'block';
  }

  function addCustomsChip(item) {
    if (selectedCustomIds.includes(item.gumruk_id)) return;
    selectedCustomIds.push(item.gumruk_id);

    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.textContent = item.gumruk_mudurlugu;

    const removeBtn = document.createElement('span');
    removeBtn.className = 'remove-chip';
    removeBtn.textContent = 'x';
    removeBtn.addEventListener('click', () => {
      selectedCustomIds = selectedCustomIds.filter(id => id !== item.gumruk_id);
      selectedCustomsContainer.removeChild(chip);
    });

    chip.appendChild(removeBtn);
    selectedCustomsContainer.appendChild(chip);
  }

  // "Yeni Gümrük Oluştur" butonu
  createCustomsBtn?.addEventListener("click", function() {
    window.open("/pages/new-customs.html", "_blank");
  });

  // "Yenile" butonu
  refreshCustomsBtn?.addEventListener("click", async function() {
    await loadCustoms();
    alert("Gümrük listesi yenilendi. Arama yapabilirsiniz.");
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
    const addressCityId = document.getElementById("addressCity").value;
    const addressDistrict = document.getElementById("addressDistrict").value;
    const addressPostalCode = document.getElementById("addressPostalCode").value;
    const addressDetail = document.getElementById("addressDetail").value;
    const taxRate = document.getElementById("taxRate").value;
    const companyID = document.getElementById("companyID").value;
    const companyID2 = document.getElementById("companyID2").value;
    const currency = document.getElementById("currency").value;
    const paymentTerms = document.getElementById("paymentTerms").value;
    const documents = document.getElementById("documents").files;

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
      customs: selectedCustomIds
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

  // Sayfa yüklenince verileri çek
  await loadCities();   // Şehir dropdown doldur
  await loadCustoms();  // Gümrük verilerini doldur
});
