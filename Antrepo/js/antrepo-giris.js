import { baseUrl } from './config.js';

// Global değişkenler
let activeGirisId = null;
let selectedUrunId = null; // Bu, artık urunSecimiSelectElement'ten gelen ürün ID'sini tutacak
let selectedProductRow = null; // Hangi ürün satırının seçildiğini izlemek için

let allSozlesmeler = [];
let allSirketler = [];
let allAntrepolar = [];
let allUrunler = [];
let allParaBirimleri = [];
let allHizmetler = [];
let allBirimler = [];
let ekHizmetlerData = [];

// Satır bazlı ürün ekleme için global array
let productRows = [];

// Modal açıldığında bir kere event listener ekle
let ekHizmetKontrolEventlerEklendi = false;

// Bayraklar
let _isUpdatingSozlesme = false;
let _isUpdatingSirket = false;
let _isUpdatingAntrepoDetails = false; // Antrepo adı/kodu selectleri için


/* Yardımcı Fonksiyonlar */
// Genel fetch fonksiyonu
async function fetchData(url, errorMessage) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`${errorMessage}: ${resp.status}`);
    return await resp.json();
  } catch (err) {
    console.error(errorMessage, err);
    return [];
  }
}

// Datalist veya dropdown doldurma için yardımcı fonksiyon
function updateDatalist(datalistElement, list, formatter) {
  if (!datalistElement) return;
  datalistElement.innerHTML = "";
  list.forEach(item => {
    const opt = document.createElement("option");
    opt.value = formatter(item);
    datalistElement.appendChild(opt);
  });
}

// "İlgili Sözleşme" <select> elementini doldurmak için fonksiyon
function populateSozlesmeSelectWithOptions(selectElement, sozlesmelerList) {
    if (!selectElement) return;

    const currentValue = selectElement.value;
    selectElement.innerHTML = '<option value=""></option>'; // Select2 placeholder için boş option

    sozlesmelerList.forEach(s => {
        const code = s.sozlesme_kodu && s.sozlesme_kodu.trim() !== "" ? s.sozlesme_kodu : "Kodsuz";
        const displayText = `${code} - ${s.sozlesme_adi}`;
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = displayText;
        opt.dataset.sirketDisplayName = s.display_name || "";
        opt.dataset.sozlesmeKoduAsil = s.sozlesme_kodu || "";
        selectElement.appendChild(opt);
    });

    selectElement.value = currentValue;

    if (typeof $ !== 'undefined' && $.fn.select2 && $(selectElement).data('select2')) {
        $(selectElement).trigger('change.select2');
    }
}

// "Antrepo Şirketi" <select> elementini doldurmak için fonksiyon
function populateAntrepoSirketiSelectWithOptions(selectElement, sirketlerList) {
    if (!selectElement) return;

    const currentValue = selectElement.value;
    selectElement.innerHTML = '<option value=""></option>';

    sirketlerList.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.sirket_id;
        opt.textContent = s.display_name;
        selectElement.appendChild(opt);
    });

    if (Array.from(selectElement.options).some(opt => String(opt.value) === String(currentValue))) {
        selectElement.value = currentValue;
    } else {
        selectElement.value = "";
    }
    // Select2 için trigger, gerekirse .val() sonrası eklenebilir.
}

// Antrepo Adı Select Doldurma Fonksiyonu
function populateAntrepoAdSelectWithOptions(selectElement, antrepoList) {
    if (!selectElement) return;
    const currentValue = selectElement.value;
    selectElement.innerHTML = '<option value=""></option>';
    antrepoList.forEach(ant => {
        const opt = document.createElement("option");
        opt.value = ant.id;
        opt.textContent = ant.antrepoAdi;
        opt.dataset.antrepoKodu = ant.antrepoKodu || "";
        opt.dataset.adres = ant.acikAdres || "";
        opt.dataset.sehir = ant.sehir || "";
        opt.dataset.gumruk = ant.gumruk || "";
        selectElement.appendChild(opt);
    });
    if (Array.from(selectElement.options).some(opt => opt.value === currentValue)) {
        selectElement.value = currentValue;
    } else {
        selectElement.value = "";
    }
}

// Antrepo Kodu Select Doldurma Fonksiyonu
function populateAntrepoKoduSelectWithOptions(selectElement, antrepoList) {
    if (!selectElement) return;
    const currentValue = selectElement.value;
    selectElement.innerHTML = '<option value=""></option>';
    antrepoList.forEach(ant => {
        const opt = document.createElement("option");
        opt.value = ant.id;
        opt.textContent = ant.antrepoKodu;
        opt.dataset.antrepoAdi = ant.antrepoAdi || "";
        opt.dataset.adres = ant.acikAdres || "";
        opt.dataset.sehir = ant.sehir || "";
        opt.dataset.gumruk = ant.gumruk || "";
        selectElement.appendChild(opt);
    });
    if (Array.from(selectElement.options).some(opt => opt.value === currentValue)) {
        selectElement.value = currentValue;
    } else {
        selectElement.value = "";
    }
}

// Yeni "Ürün Seçimi" Select Doldurma Fonksiyonu
function populateUrunSecimiSelectWithOptions(selectElement, urunlerList) {
    if (!selectElement) return;
    const currentValue = selectElement.value; // Mevcut seçimi korumak için
    selectElement.innerHTML = '<option value=""></option>'; // Select2 placeholder için

    // Sadece aktif ve silinmemiş ürünleri filtrele
    const activeProducts = urunlerList.filter(u => u.active !== false && !u.deleted);

    activeProducts.forEach(urun => {
        const opt = document.createElement("option");
        opt.value = urun.id; // Ürünün ID'sini değer olarak ata
        opt.textContent = `${urun.name} (${urun.code || 'Kodsuz'})`; // Örn: "Laptop XYZ (LTXYZ001)"
        opt.dataset.urunAdi = urun.name || "";
        opt.dataset.urunKodu = urun.code || "";
        selectElement.appendChild(opt);
    });

    if (Array.from(selectElement.options).some(opt => opt.value === currentValue)) {
        selectElement.value = currentValue;
    } else {
        selectElement.value = "";
    }
    // Select2'nin seçenekleri algılaması için, populate sonrası trigger gerekebilir
    if (typeof $ !== 'undefined' && $.fn.select2 && $(selectElement).data('select2')) {
        $(selectElement).trigger('change.select2');
    }
}


// Clear butonları için ortak event ekleyici
function addClearEvent(btn, inputs, focusInput, additionalCallback) {
  if (btn) {
    btn.addEventListener("click", () => {
      inputs.forEach(input => (input.value = ""));
      if (focusInput) focusInput.focus();
      if (typeof additionalCallback === "function") additionalCallback();
    });
  }
}

async function loadVariantDataForProduct(urunId) {
  if (!urunId) {
    console.warn('Ürün ID değeri bulunamadı. Varyant verileri yüklenemedi.');
    resetPaketlemeTipi();
    return;
  }
  try {
    const response = await fetch(`${baseUrl}/api/urun_varyantlari/details?urunId=${urunId}`);
    if (!response.ok) throw new Error(`API yanıt hatası: ${response.status}`);
    const data = await response.json();
    const uniqueDescriptions = [...new Set(data.map(v => v.description).filter(Boolean))];
    const paketlemeTipiSelect = document.getElementById("paketlemeTipi");
    if (!paketlemeTipiSelect) {
      console.warn('Element "paketlemeTipi" bulunamadı.');
      return;
    }
    $(paketlemeTipiSelect).empty();
    $(paketlemeTipiSelect).append(new Option('Seçiniz...', '', true, true));
    const optionsData = uniqueDescriptions.map(desc => ({ id: desc, text: desc }));
    try { if ($.fn.select2 && $(paketlemeTipiSelect).hasClass("select2-hidden-accessible")) $(paketlemeTipiSelect).select2('destroy'); } catch(e) { /* ignore */ }
    $(paketlemeTipiSelect).select2({ placeholder: 'Paketleme Tipi Seçin', allowClear: true, width: '100%', data: optionsData });
  } catch (error) {
    console.error("loadVariantDataForProduct hata:", error);
    resetPaketlemeTipi();
  }
}

function resetPaketlemeTipi() {
  const select = document.getElementById("paketlemeTipi");
  if (select) {
    $(select).empty().append(new Option('Seçiniz...', '', true, true)); // Clear and add placeholder
    try {
      if (typeof $ !== 'undefined' && $.fn.select2 && $(select).data('select2')) {
        $(select).val(null).trigger('change.select2');
      } else if (typeof $ !== 'undefined' && $.fn.select2) {
        // If select2 is available but not initialized on this one specifically for some reason
        $(select).select2({ placeholder: 'Paketleme Tipi Seçin', allowClear: true, width: '100%' });
        $(select).val(null).trigger('change.select2');
      } else {
        select.innerHTML = '<option value="">Seçiniz...</option>'; // Fallback for non-select2
        $(select).trigger('change');
      }
    } catch(e){ console.error("Error resetting paketlemeTipi select2:", e); }
  }
}

async function loadPaketBoyutuForProduct(urunId) {
  try {
    const response = await fetch(`${baseUrl}/api/urun_varyantlari/details?urunId=${urunId}`);
    if (!response.ok) throw new Error("Varyant verisi alınamadı");
    const data = await response.json();
    const uniqueSizes = [...new Set(data.map(v => v.paket_hacmi).filter(Boolean))];
    const paketBoyutuSelect = document.getElementById("paketBoyutu");
    if (!paketBoyutuSelect) {
      console.warn('Element "paketBoyutu" bulunamadı.');
      return;
    }
    paketBoyutuSelect.innerHTML = '<option value="">Seçiniz...</option>';
    uniqueSizes.forEach(size => {
      const opt = document.createElement("option");
      opt.value = size;
      opt.textContent = size + " Kg";
      paketBoyutuSelect.appendChild(opt);
    });
  } catch (error) {
    console.error("loadPaketBoyutuForProduct hata:", error);
    // alert("Paket boyutu verileri yüklenirken hata oluştu: " + error.message); // Potentially too noisy
    resetPaketBoyutu();
  }
}

function resetPaketBoyutu() {
  const select = document.getElementById("paketBoyutu");
  if (select) {
    select.innerHTML = '<option value="">Seçiniz...</option>';
     // If paketBoyutu is also a Select2, handle its reset similarly
    try {
        if (typeof $ !== 'undefined' && $.fn.select2 && $(select).data('select2')) {
            $(select).val(null).trigger('change.select2');
        } else {
            $(select).trigger('change'); // For non-select2 or to notify other listeners
        }
    } catch (e) { console.error("Error resetting paketBoyutu select2:", e); }
  }
}

function disableFormFields() {
  document.querySelectorAll("input, select, textarea, button").forEach(el => {
    if (el.id !== "cancelBtn") {
      el.disabled = true;
      if (el.id === "urunBirimFiyat") el.readOnly = true; // This was for a global one, might not be relevant now
      if (el.id === "birimFiyat") el.readOnly = true; // For the one in product rows section
      if (typeof $ !== 'undefined' && $.fn.select2 && $(el).data('select2')) {
        $(el).prop('disabled', true).trigger('change.select2');
      }
    }
  });
}

function preventDoubleClick(buttonElement, timeout = 2000) {
  if (!buttonElement) return;
  buttonElement.addEventListener('click', function() {
    if (this.getAttribute('data-processing') === 'true') return false;
    this.setAttribute('data-processing', 'true');
    const originalText = this.textContent;
    this.textContent = 'İşleniyor...';
    this.disabled = true;
    setTimeout(() => {
      this.removeAttribute('data-processing');
      this.textContent = originalText;
      this.disabled = false;
    }, timeout);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const antrepoForm = document.getElementById("antrepoForm");
  const cancelBtn = document.getElementById("cancelBtn");
  const saveBtn = document.getElementById("saveBtn");

  const sozlesmeSelectElement = document.getElementById("sozlesmeSelect");
  const openSozlesmeBtn = document.getElementById("openSozlesmeBtn");

  const antrepoSirketiSelectElement = document.getElementById("antrepoSirketiSelect");

  const antrepoAdSelectElement = document.getElementById("antrepoAdSelect");
  const antrepoKoduSelectElement = document.getElementById("antrepoKoduSelect");

  const inputAdres = document.getElementById("adres");
  const inputSehir = document.getElementById("sehir");
  const inputGumruk = document.getElementById("gumruk");

  // Değişiklik: Eski ürün tanımı/kodu inputları yerine yeni select elementi
  const urunSecimiSelectElement = document.getElementById("urunSecimiSelect");
  const inputPaketBoyutu = document.getElementById("paketBoyutu"); // Bu hala paketBoyutu <select>
  const inputPaketlemeTipi = document.getElementById("paketlemeTipi"); // Bu hala paketlemeTipi <select> (Select2 ile)
  const inputMiktar = document.getElementById("miktar");
  const inputKapAdeti = document.getElementById("kapAdeti");
  const inputBrutAgirlik = document.getElementById("brutAgirlik");
  const inputNetAgirlik = document.getElementById("netAgirlik");
  const inputAntrepoGirisTarihi = document.getElementById("antrepoGirisTarihi");
  const checkboxIlkGiris = document.getElementById("ilkGiris");

  // Product form specific fields
  const urunParaBirimiSelectElement = document.getElementById("urunParaBirimiSelect");
  const birimFiyatElement = document.getElementById("birimFiyat");
  const gtipNoElement = document.getElementById("gtipNo");


  const inputGondericiSirket = document.getElementById("gondericiSirket");
  const inputAliciSirket = document.getElementById("aliciSirket");
  const inputProformaNo = document.getElementById("proformaNo");
  const inputProformaTarihi = document.getElementById("proformaTarihi");
  const inputTicariFaturaNo = document.getElementById("ticariFaturaNo");
  const inputTicariFaturaTarihi = document.getElementById("ticariFaturaTarihi");
  const inputDepolamaSuresi = document.getElementById("depolamaSuresi");
  const inputFaturaMeblagi = document.getElementById("faturaMeblagi");
  const inputUrunBirimFiyat = document.getElementById("urunBirimFiyat"); // Global/old one
  const selectParaBirimi = document.getElementById("paraBirimi"); // Global/old one for main invoice
  const inputFaturaAciklama = document.getElementById("faturaAciklama");

  const inputBeyannameFormTarihi = document.getElementById("beyannameFormTarihi");
  const inputBeyannameNo = document.getElementById("beyannameNo");

    // --- AÇILIR-KAPANIR BÖLÜM MANTIĞI ---
  const collapsibleHeader = document.querySelector('#ekstra-bilgiler-bolumu .collapsible-header');
// collapsibleContent'i jQuery nesnesi olarak alalım, çünkü slideUp/slideDown ve is:visible kullanacağız.
  const $collapsibleContent = $('#ekstra-bilgiler-bolumu .collapsible-content'); // jQuery ile seçiyoruz

  if (collapsibleHeader && $collapsibleContent.length) { // $collapsibleContent.length ile elementin varlığını kontrol ediyoruz
      collapsibleHeader.addEventListener('click', () => {
          collapsibleHeader.classList.toggle('open'); // İkonun dönmesi için class'ı değiştir

          // jQuery'nin is(":visible") metodu ile içeriğin görünür olup olmadığını kontrol et
          if ($collapsibleContent.is(":visible")) {
              $collapsibleContent.slideUp(); // Eğer görünürse, yukarı kaydırarak kapat
          } else {
              $collapsibleContent.slideDown(); // Eğer gizliyse, aşağı kaydırarak aç
          }
      });
  }
  // --- AÇILIR-KAPANIR BÖLÜM MANTIĞI SONU ---


  const newEntryBtn = document.getElementById("newEntryBtn");
  const newExitBtn = document.getElementById("newExitBtn");

  const ekHizmetlerBtn = document.getElementById("ekHizmetlerBtn");
  const ekHizmetModal = document.getElementById("ekHizmetModal");
  const btnEkHizmetCancel = document.getElementById("btnEkHizmetCancel");
  const btnEkHizmetSave = document.getElementById("btnEkHizmetSave");
  const modalHizmetSelect = document.getElementById("modalHizmetSelect");
  const modalHizmetKodu = document.getElementById("modalHizmetKodu");
  const modalUcretModeli = document.getElementById("modalUcretModeli");
  const modalHizmetBirim = document.getElementById("modalHizmetBirim");
  const modalHizmetParaBirimi = document.getElementById("modalHizmetParaBirimi");
  const modalTemelUcret = document.getElementById("modalTemelUcret");
  const modalCarpan = document.getElementById("modalCarpan");
  const modalHizmetAdet = document.getElementById("modalHizmetAdet");
  const modalHizmetToplam = document.getElementById("modalHizmetToplam");
  const mirrorInput = document.getElementById("modalHizmetParaBirimiMirror");
  const ekHizmetlerTableBody = document.getElementById("ekHizmetlerTableBody");
  const modalHizmetAciklama = document.getElementById("modalHizmetAciklama");
  const btnNewHizmet = document.getElementById("btnNewHizmet");
  const inputEkHizmetTarih = document.getElementById("modalEkHizmetTarih");

  const newHizmetModal = document.getElementById("newHizmetModal");
  const newHizmetAdiSelect = document.getElementById("newHizmetAdi");
  const newHizmetKodu = document.getElementById("newHizmetKodu");
  const newHizmetTipi = document.getElementById("newHizmetTipi");
  const newHizmetBirim = document.getElementById("newHizmetBirim");
  const newHizmetParaBirimi = document.getElementById("newHizmetParaBirimi");
  const newTemelUcret = document.getElementById("newTemelUcret");
  const newMinUcret = document.getElementById("newMinUcret");
  const newCarpan = document.getElementById("newCarpan");
  const newHizmetAciklama = document.getElementById("newHizmetAciklama");
  const btnNewHizmetCancel = document.getElementById("btnNewHizmetCancel");
  const btnNewHizmetSave = document.getElementById("btnNewHizmetSave");

  const hareketTableBody = document.getElementById("giriscikisTableBody");

  const newEntryForm = document.getElementById("newEntryForm");
  const entryCancelBtn = document.getElementById("entryCancelBtn");

  const newExitForm = document.getElementById("newExitForm");
  const exitCancelBtn = document.getElementById("exitCancelBtn");

  const addProductRowBtn = document.getElementById("addProductRowBtn");


  const today = new Date().toISOString().split('T')[0];
  if (inputAntrepoGirisTarihi) { // This is for the product row's date
    inputAntrepoGirisTarihi.setAttribute('max', today);
  }

  [allSozlesmeler, allSirketler, allAntrepolar, allUrunler, allParaBirimleri, allHizmetler, allBirimler] =
    await Promise.all([
      fetchData(`${baseUrl}/api/sozlesmeler`, "Sözleşmeler hatası"),
      fetchData(`${baseUrl}/api/companies`, "Şirketler hatası"),
      fetchData(`${baseUrl}/api/antrepolar`, "Antrepolar hatası"),
      fetchData(`${baseUrl}/api/urunler`, "Ürünler hatası"),
      fetchData(`${baseUrl}/api/para-birimleri`, "Para birimleri hatası"),
      fetchData(`${baseUrl}/api/hizmetler`, "Hizmetler hatası"),
      fetchData(`${baseUrl}/api/birimler`, "Birimler hatası")
    ]);

  if (antrepoAdSelectElement) {
      populateAntrepoAdSelectWithOptions(antrepoAdSelectElement, allAntrepolar);
  }
  if (antrepoKoduSelectElement) {
      populateAntrepoKoduSelectWithOptions(antrepoKoduSelectElement, allAntrepolar);
  }

  // Eski fillUrunDatalists() fonksiyonu yerine yeni populateUrunSecimiSelectWithOptions çağrısı
  if (urunSecimiSelectElement) {
    populateUrunSecimiSelectWithOptions(urunSecimiSelectElement, allUrunler);
  }

  // Updated fillParaBirimDropdown to accept a target element and placeholder
  function fillParaBirimDropdown(targetSelectElement, placeholderText = "Para Birimi Seçiniz") {
    if (!targetSelectElement) return;
    const currentValue = targetSelectElement.value;
    targetSelectElement.innerHTML = `<option value=""></option>`; // Placeholder for Select2
    allParaBirimleri.forEach(pb => {
      const opt = document.createElement('option');
      opt.value = pb.id.toString();
      opt.textContent = `${pb.para_birimi_adi} (${pb.iso_kodu})`;
      opt.dataset.isoKodu = pb.iso_kodu; // Store ISO code for easy access
      targetSelectElement.appendChild(opt);
    });
    targetSelectElement.value = currentValue; // Restore previous value if any
    try {
      if (typeof $ !== 'undefined' && $.fn.select2 && $(targetSelectElement).data('select2')) {
        $(targetSelectElement).trigger('change.select2');
      } else if (typeof $ !== 'undefined' && $.fn.select2) { // If select2 is available but not yet initialized on this element
         // $(targetSelectElement).select2({ placeholder: placeholderText, allowClear: true, width: '100%' }); // Auto-init can be tricky here
      } else if (typeof $ !== 'undefined') {
        $(targetSelectElement).trigger('change');
      }
    } catch (e) { /* console.log("Select2 henüz başlatılmamış olabilir.", e); */ }
  }

  populateSozlesmeSelectWithOptions(sozlesmeSelectElement, allSozlesmeler);
  if (antrepoSirketiSelectElement) {
    populateAntrepoSirketiSelectWithOptions(antrepoSirketiSelectElement, allSirketler);
  }

  // Populate both currency dropdowns
  if (selectParaBirimi) fillParaBirimDropdown(selectParaBirimi, "Fatura P.B. Seçiniz");
  if (urunParaBirimiSelectElement) fillParaBirimDropdown(urunParaBirimiSelectElement, "Ürün P.B. Seçiniz");


  async function fetchHareketler() {
    if (!activeGirisId) return;
    try {
      const data = await fetchData(`${baseUrl}/api/antrepo-giris/${activeGirisId}/hareketler`, "Hareketler hatası");
      renderHareketler(data);
    } catch (error) {
      console.error("Hareketler çekilirken hata:", error);
    }
  }
  async function fetchEkHizmetler(girisId) {
    return await fetchData(`${baseUrl}/api/antrepo-giris/${girisId}/ek-hizmetler`, "Ek hizmetler hatası");
  }
  async function deleteHareket(hareketId) {
    try {
      const resp = await fetch(`${baseUrl}/api/antrepo-giris/${activeGirisId}/hareketler/${hareketId}`, { method: "DELETE" });
      if (!resp.ok) throw new Error(`Silme hatası: ${resp.status}`);
      fetchHareketler();
      alert("Hareket kaydı başarıyla silindi.");
    } catch (err) {
      console.error("Hareket silme hatası:", err);
      alert("Hareket kaydı silinirken hata: " + err.message);
    }
  }
  async function deleteEkHizmet(ekHizmetId) {
    try {
      const resp = await fetch(`${baseUrl}/api/antrepo-giris/${activeGirisId}/ek-hizmetler/${ekHizmetId}`, { method: "DELETE" });
      if (!resp.ok) throw new Error(`Silme hatası: ${resp.status}`);
      const updatedList = await fetchEkHizmetler(activeGirisId);
      renderEkHizmetler(updatedList);
      alert("Ek hizmet başarıyla silindi.");
    } catch (err) {
      console.error("Ek hizmet silme hatası:", err);
      alert("Ek hizmet silinirken hata: " + err.message);
    }
  }
  function renderHareketler(list) {
    if (!hareketTableBody) return;
    hareketTableBody.innerHTML = "";
    list.forEach(item => {
      const tr = document.createElement("tr");
      const tdTarih = document.createElement("td");
      if (item.islem_tarihi) {
        const dateObj = new Date(item.islem_tarihi);
        tdTarih.textContent = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
      } else {
        tdTarih.textContent = "";
      }
      tr.appendChild(tdTarih);
      const tdTip = document.createElement("td"); tdTip.textContent = item.islem_tipi || ""; tr.appendChild(tdTip);
      const tdUrunAdi = document.createElement("td"); tdUrunAdi.textContent = item.urun_adi || ""; tr.appendChild(tdUrunAdi);
      const tdUrunKodu = document.createElement("td"); tdUrunKodu.textContent = item.urun_kodu || ""; tr.appendChild(tdUrunKodu);
      ["miktar", "kap_adeti", "brut_agirlik", "net_agirlik", "birim_adi", "aciklama"].forEach(field => {
        const td = document.createElement("td"); td.textContent = item[field] || ""; tr.appendChild(td);
      });
      const tdOps = document.createElement("td");
      const silBtn = document.createElement("button"); silBtn.textContent = "Sil"; silBtn.classList.add("btn-secondary");
      silBtn.addEventListener("click", () => showConfirmModal(item.id, "hareket"));
      tdOps.appendChild(silBtn); tr.appendChild(tdOps);
      hareketTableBody.appendChild(tr);
    });
  }

  function renderEkHizmetler(list) {
    if (!ekHizmetlerTableBody) return;
    ekHizmetlerTableBody.innerHTML = "";
    list.forEach(item => {
      const tr = document.createElement("tr");
      const tdTarih = document.createElement("td"); tdTarih.textContent = item.ek_hizmet_tarihi ? item.ek_hizmet_tarihi.substring(0, 10) : ""; tr.appendChild(tdTarih);
      const tdUrun = document.createElement("td");
      if (item.applies_to_all) { tdUrun.textContent = "Tüm Ürünler"; tdUrun.classList.add("all-products-cell"); }
      else if (item.urun_tanimi) { tdUrun.textContent = item.urun_kodu ? `${item.urun_tanimi} (${item.urun_kodu})` : item.urun_tanimi; }
      else if (item.urun_id) { tdUrun.textContent = `Ürün ID: ${item.urun_id}`; }
      else { tdUrun.textContent = "-"; }
      tr.appendChild(tdUrun);
      ["hizmet_adi", "adet", "temel_ucret", "carpan", "toplam", "aciklama"].forEach(field => {
        const td = document.createElement("td"); td.textContent = item[field] || ""; tr.appendChild(td);
      });
      const tdOps = document.createElement("td");
      const silBtn = document.createElement("button"); silBtn.textContent = "Sil"; silBtn.classList.add("btn-secondary");
      silBtn.addEventListener("click", () => showConfirmModal(item.id, "ekhizmet"));
      tdOps.appendChild(silBtn); tr.appendChild(tdOps);
      ekHizmetlerTableBody.appendChild(tr);
    });
  }

  if (sozlesmeSelectElement && typeof $ !== 'undefined') {
    $(sozlesmeSelectElement).on('select2:select select2:clear', function (e) {
        
        console.log("Olay Tipi:", e.type, "Seçilen Sözleşme ID:", this.value);

        const selectedSozlesmeOptionElement = $(this).find('option:selected')[0];
        const antrepoSirketiSelect = antrepoSirketiSelectElement;
        const antrepoAdiSelect = antrepoAdSelectElement;
        const antrepoKoduSelect = antrepoKoduSelectElement;

        if (!antrepoSirketiSelect || !antrepoAdiSelect || !antrepoKoduSelect || !inputAdres || !inputSehir || !inputGumruk) {
            console.error("Sözleşme olayı: Gerekli antrepo şirket veya antrepo detay elementleri bulunamadı!");
            _isUpdatingSirket = false; // Bayrağı sıfırla (eğer kullanılıyorsa)
            return;
        }

        _isUpdatingSirket = true; // Antrepo Şirketi'ni güncelliyoruz, onun olayı döngüye girmesin.

        if (this.value && selectedSozlesmeOptionElement) { // Bir sözleşme seçiliyse
            const sirketAdiFromDataset = selectedSozlesmeOptionElement.dataset.sirketDisplayName;
            if (sirketAdiFromDataset) {
                const ilgiliSirket = allSirketler.find(s => s.display_name && s.display_name.trim() === sirketAdiFromDataset.trim());
                if (ilgiliSirket && ilgiliSirket.sirket_id !== undefined) {
                    console.log(`Antrepo Şirketi Select'i ayarlanıyor: ID=${ilgiliSirket.sirket_id}, Adı=${ilgiliSirket.display_name}`);
                    if (antrepoSirketiSelect.options.length <= 1 && allSirketler.length > 0) {
                        populateAntrepoSirketiSelectWithOptions(antrepoSirketiSelect, allSirketler);
                    }
                    $(antrepoSirketiSelect).val(String(ilgiliSirket.sirket_id)).trigger('change.select2');
                    $(antrepoSirketiSelect).prop('disabled', true).trigger('change.select2');
                    console.log("Antrepo Şirketi Select'i ayarlandı ve kilitlendi.");

                    const sirketeAitAntrepolar = allAntrepolar.filter(ant => 
                        ant.antrepoSirketi && ilgiliSirket.company_name && 
                        String(ant.antrepoSirketi).trim().toLowerCase() === String(ilgiliSirket.company_name).trim().toLowerCase()
                    );
                    console.log(`"${ilgiliSirket.display_name}" şirketine ait antrepolar yüklenecek:`, sirketeAitAntrepolar);

                    populateAntrepoAdSelectWithOptions(antrepoAdiSelect, sirketeAitAntrepolar);
                    populateAntrepoKoduSelectWithOptions(antrepoKoduSelect, sirketeAitAntrepolar);
                    
                    $(antrepoAdiSelect).val(null).trigger('change.select2'); 
                    $(antrepoKoduSelect).val(null).trigger('change.select2'); 
                    
                    if (inputAdres) inputAdres.value = "";
                    if (inputSehir) inputSehir.value = "";
                    if (inputGumruk) inputGumruk.value = "";
                    console.log("Antrepo Ad/Kod select'leri şirket bazlı dolduruldu, seçim kullanıcıya bırakıldı, detaylar temizlendi.");

                } else { 
                    console.warn("İlgili Şirket 'allSirketler' içinde bulunamadı veya ID'si yok. Şirket Adı:", sirketAdiFromDataset);
                    $(antrepoSirketiSelect).val(null).trigger('change.select2');
                    $(antrepoSirketiSelect).prop('disabled', false);
                    populateAntrepoAdSelectWithOptions(antrepoAdiSelect, allAntrepolar);
                    $(antrepoAdiSelect).val(null).trigger('change.select2');
                    populateAntrepoKoduSelectWithOptions(antrepoKoduSelect, allAntrepolar);
                    $(antrepoKoduSelect).val(null).trigger('change.select2');
                    if (inputAdres) inputAdres.value = ""; if (inputSehir) inputSehir.value = ""; if (inputGumruk) inputGumruk.value = "";
                }
            } else { 
                console.warn("Seçilen sözleşme option'unda 'data-sirket-display-name' bulunamadı veya boş.");
                $(antrepoSirketiSelect).val(null).trigger('change.select2');
                $(antrepoSirketiSelect).prop('disabled', false);
                populateAntrepoAdSelectWithOptions(antrepoAdiSelect, allAntrepolar);
                $(antrepoAdiSelect).val(null).trigger('change.select2');
                populateAntrepoKoduSelectWithOptions(antrepoKoduSelect, allAntrepolar);
                $(antrepoKoduSelect).val(null).trigger('change.select2');
                if (inputAdres) inputAdres.value = ""; if (inputSehir) inputSehir.value = ""; if (inputGumruk) inputGumruk.value = "";
            }
        } else { 
            console.log("Sözleşme seçimi temizlendi.");
            if (antrepoSirketiSelect) {
                $(antrepoSirketiSelect).val(null).trigger('change.select2'); 
                $(antrepoSirketiSelect).prop('disabled', false).trigger('change.select2'); 
            }
            if (antrepoAdiSelect) {
                populateAntrepoAdSelectWithOptions(antrepoAdiSelect, allAntrepolar); 
                $(antrepoAdiSelect).val(null).trigger('change.select2'); 
            }
            if (antrepoKoduSelect) {
                populateAntrepoKoduSelectWithOptions(antrepoKoduSelect, allAntrepolar); 
                $(antrepoKoduSelect).val(null).trigger('change.select2'); 
            }
            if (inputAdres) inputAdres.value = ""; 
            if (inputSehir) inputSehir.value = ""; 
            if (inputGumruk) inputGumruk.value = "";
        }
        _isUpdatingSirket = false; 
        
    });
}

  if (antrepoSirketiSelectElement && typeof $ !== 'undefined' && $.fn.select2) {
    $(antrepoSirketiSelectElement).on('select2:select select2:clear', function(e) {
        if (_isUpdatingSirket) { 
            return;
        }
        _isUpdatingSozlesme = true; 
        
        const secilenSirketId = this.value;
        let filtrelenmisSozlesmeler = allSozlesmeler;
        let sirketeGoreAntrepolar = allAntrepolar; 

        console.log("----- Antrepo Şirketi Değişti Olayı Başladı -----");
        console.log("Seçilen Şirket ID:", secilenSirketId);

        if (secilenSirketId) { 
            const secilenSirket = allSirketler.find(s => String(s.sirket_id) === String(secilenSirketId));
            if (secilenSirket) {
                filtrelenmisSozlesmeler = allSozlesmeler.filter(söz => söz.display_name && söz.display_name === secilenSirket.display_name);
                
                if (secilenSirket.company_name) {
                    sirketeGoreAntrepolar = allAntrepolar.filter(ant => 
                        ant.antrepoSirketi && 
                        String(ant.antrepoSirketi).trim().toLowerCase() === String(secilenSirket.company_name).trim().toLowerCase()
                    );
                } else {
                    sirketeGoreAntrepolar = []; 
                }

                let mevcutSeciliSozlesmeId = sozlesmeSelectElement ? sozlesmeSelectElement.value : null;
                if (mevcutSeciliSozlesmeId) {
                    const eskiSeciliSozlesme = allSozlesmeler.find(s => String(s.id) === String(mevcutSeciliSozlesmeId));
                    if (eskiSeciliSozlesme && eskiSeciliSozlesme.display_name !== secilenSirket.display_name) {
                        if (sozlesmeSelectElement) $(sozlesmeSelectElement).val(null).trigger('change.select2');
                    }
                }
            } else { 
                filtrelenmisSozlesmeler = []; 
                sirketeGoreAntrepolar = [];   
            }
        } else { 
            if (sozlesmeSelectElement) {
                populateSozlesmeSelectWithOptions(sozlesmeSelectElement, allSozlesmeler);
                $(sozlesmeSelectElement).val(null).trigger('change.select2');
            }
        }
        
        if (sozlesmeSelectElement) {
            populateSozlesmeSelectWithOptions(sozlesmeSelectElement, filtrelenmisSozlesmeler);
        }

        if (antrepoAdSelectElement) {
            populateAntrepoAdSelectWithOptions(antrepoAdSelectElement, sirketeGoreAntrepolar);
            $(antrepoAdSelectElement).val(null).trigger('change.select2');
        }
        if (antrepoKoduSelectElement) {
            populateAntrepoKoduSelectWithOptions(antrepoKoduSelectElement, sirketeGoreAntrepolar);
            $(antrepoKoduSelectElement).val(null).trigger('change.select2');
        }
        
        if (inputAdres) inputAdres.value = ""; 
        if (inputSehir) inputSehir.value = ""; 
        if (inputGumruk) inputGumruk.value = "";

        _isUpdatingSozlesme = false;
        console.log("----- Antrepo Şirketi Değişti Olayı Bitti -----");
    });
}

  function updateAntrepoFieldsFromSelectedOption(selectedOption, isAdSelectSource) {
    if (_isUpdatingAntrepoDetails) return; 
    _isUpdatingAntrepoDetails = true;

    if (selectedOption && selectedOption.value) {
        const antrepoId = selectedOption.value;
        const antrepoAdi = isAdSelectSource ? selectedOption.textContent : (selectedOption.dataset.antrepoAdi || "");
        const antrepoKodu = !isAdSelectSource ? selectedOption.textContent : (selectedOption.dataset.antrepoKodu || "");
        const adres = selectedOption.dataset.adres || "";
        const sehir = selectedOption.dataset.sehir || "";
        const gumruk = selectedOption.dataset.gumruk || "";

        if (isAdSelectSource && antrepoKoduSelectElement) {
            if ($(antrepoKoduSelectElement).val() !== antrepoId) {
                $(antrepoKoduSelectElement).val(antrepoId).trigger('change.select2');
            }
        } else if (!isAdSelectSource && antrepoAdSelectElement) {
            if ($(antrepoAdSelectElement).val() !== antrepoId) {
                $(antrepoAdSelectElement).val(antrepoId).trigger('change.select2');
            }
        }

        if (inputAdres) inputAdres.value = adres;
        if (inputSehir) inputSehir.value = sehir;
        if (inputGumruk) inputGumruk.value = gumruk;
    } else { 
        if (isAdSelectSource && antrepoKoduSelectElement) {
            if ($(antrepoKoduSelectElement).val() !== null) { 
                 $(antrepoKoduSelectElement).val(null).trigger('change.select2');
            }
        } else if (!isAdSelectSource && antrepoAdSelectElement) {
             if ($(antrepoAdSelectElement).val() !== null) {
                $(antrepoAdSelectElement).val(null).trigger('change.select2');
             }
        }
        if (inputAdres) inputAdres.value = "";
        if (inputSehir) inputSehir.value = "";
        if (inputGumruk) inputGumruk.value = "";
    }
    _isUpdatingAntrepoDetails = false;
  }

  if (antrepoAdSelectElement && typeof $ !== 'undefined') {
      $(antrepoAdSelectElement).on('select2:select select2:clear', function(e) {
          const selectedOption = $(this).find('option:selected')[0];
          updateAntrepoFieldsFromSelectedOption(selectedOption, true); 
      });
  }

  if (antrepoKoduSelectElement && typeof $ !== 'undefined') {
      $(antrepoKoduSelectElement).on('select2:select select2:clear', function(e) {
          const selectedOption = $(this).find('option:selected')[0];
          updateAntrepoFieldsFromSelectedOption(selectedOption, false); 
      });
  }

  // Eski Ürün Tanımı/Kodu olay dinleyicileri kaldırıldı.

  // Yeni "Ürün Seçimi" (urunSecimiSelectElement) Olay Dinleyicisi
  if (urunSecimiSelectElement && typeof $ !== 'undefined') {
      $(urunSecimiSelectElement).on('select2:select select2:clear', async function (e) {
          const secilenUrunIdValue = this.value;
          console.log("Ürün Seçimi Değişti, Seçilen Ürün ID:", secilenUrunIdValue);

          if (secilenUrunIdValue) {
              selectedUrunId = parseInt(secilenUrunIdValue, 10); // Global selectedUrunId'yi ayarla
              
              // Varyant ve paket boyutu bilgilerini yükle
              await loadVariantDataForProduct(selectedUrunId);
              await loadPaketBoyutuForProduct(selectedUrunId);
          } else {
              // Seçim temizlendiğinde
              selectedUrunId = null;
              resetPaketlemeTipi();
              resetPaketBoyutu();
              console.log("Ürün seçimi temizlendi, varyantlar sıfırlandı.");
          }
      });
  }


  document.getElementById('addVariantBtn')?.addEventListener('click', () => {
    if (!selectedUrunId) { // YENİ KONTROL
        alert('Önce bir ürün seçmelisiniz!');
        return;
    }
    const urun = allUrunler.find(u => u.id === selectedUrunId);
    if (!urun) { 
        alert('Geçerli bir ürün bulunamadı!');
        return;
    }
    
    const paketlemeTipiElem = document.getElementById('paketlemeTipi');
    const paketlemeTipiValue = paketlemeTipiElem ? paketlemeTipiElem.value : "";
    
    let url = `product-form.html?mode=variant&urunId=${urun.id}`;
    if (paketlemeTipiValue) url += `&paketlemeTipi=${encodeURIComponent(paketlemeTipiValue)}`;
    window.open(url, '_blank');
  });

  document.getElementById('refreshPaketlemeBtn')?.addEventListener('click', async () => {
    if (!selectedUrunId) { // YENİ KONTROL
        alert('Önce bir ürün seçmelisiniz!');
        return;
    }
    const urun = allUrunler.find(u => u.id === selectedUrunId);
    if (!urun) return; 
    await refreshPaketlemeTipleri(urun.name); 
  });

  document.getElementById('refreshBoyutBtn')?.addEventListener('click', async () => {
    if (!selectedUrunId) { // YENİ KONTROL
        alert('Önce bir ürün seçmelisiniz!');
        return;
    }
    const urun = allUrunler.find(u => u.id === selectedUrunId);
    if (!urun) return;
    await refreshPaketBoyutlari(urun.name); 
  });

  async function refreshPaketlemeTipleri(urunAdi) { // urunAdi parametresi hala kullanılıyor
    try {
      const urun = allUrunler.find(u => u.name === urunAdi); // Ürün adıyla bulma devam ediyor
      if (!urun || !urun.id) { alert('Geçerli bir ürün seçiniz!'); return; }
      const currentPaketlemeTipi = $('#paketlemeTipi').val();
      await loadVariantDataForProduct(urun.id); // ID ile yükle
      if (currentPaketlemeTipi) $('#paketlemeTipi').val(currentPaketlemeTipi).trigger('change');
      const btn = document.getElementById('refreshPaketlemeBtn'); if(btn) { btn.classList.add('success'); setTimeout(() => btn.classList.remove('success'), 1000); }
    } catch (error) { console.error('Paketleme tipleri yüklenirken hata:', error); alert('Paketleme tipleri yüklenirken bir hata oluştu!'); }
  }

  async function refreshPaketBoyutlari(urunAdi) { // urunAdi parametresi hala kullanılıyor
    try {
      const urun = allUrunler.find(u => u.name === urunAdi); // Ürün adıyla bulma devam ediyor
      if (!urun || !urun.id) { alert('Geçerli bir ürün seçiniz!'); return; }
      const currentPaketBoyutu = $('#paketBoyutu').val();
      await loadPaketBoyutuForProduct(urun.id); // ID ile yükle
      if (currentPaketBoyutu) $('#paketBoyutu').val(currentPaketBoyutu).trigger('change');
      const btn = document.getElementById('refreshBoyutBtn'); if(btn) { btn.classList.add('success'); setTimeout(() => btn.classList.remove('success'), 1000); }
    } catch (error) { console.error('Paket boyutları yüklenirken hata:', error); alert('Paket boyutları yüklenirken bir hata oluştu!'); }
  }

  if (ekHizmetlerBtn) {
    ekHizmetlerBtn.addEventListener("click", () => {
      populateModalHizmetParaBirimi(); populateModalHizmetSelect(allHizmetler); populateEkHizmetProductSelect(); clearEkHizmetModalFields();
      if(ekHizmetModal) { ekHizmetModal.style.display = "flex"; ekHizmetModal.classList.add("active"); }
      if (!ekHizmetKontrolEventlerEklendi) { setupEkHizmetIlkGirisKontrol(); ekHizmetKontrolEventlerEklendi = true; }
    });
  }

  function setupEkHizmetIlkGirisKontrol() {
    const urunSelect = document.getElementById("modalEkHizmetUrunSelect");
    const tarihInput = document.getElementById("modalEkHizmetTarih");
    const appliesAllCheckbox = document.getElementById("modalEkHizmetAppliesAll");
    const saveBtnElement = document.getElementById("btnEkHizmetSave");
    if (!urunSelect || !tarihInput || !saveBtnElement || !appliesAllCheckbox) { console.warn("setupEkHizmetIlkGirisKontrol: Gerekli elementler bulunamadı."); return; }
    let warningDiv = document.getElementById("ekHizmetIlkGirisWarning");
    if (!warningDiv && tarihInput.parentNode) { warningDiv = document.createElement("div"); warningDiv.id = "ekHizmetIlkGirisWarning"; warningDiv.className = "form-text text-danger mt-1"; tarihInput.parentNode.appendChild(warningDiv); } // Added some styling
    let selectedEkHizmetUrunIlkGirisTarihi = null;
    async function kontrolEt(event) {
        if (warningDiv) { warningDiv.textContent = ""; warningDiv.classList.remove("active-warning"); }
        saveBtnElement.disabled = false;
        const isAppliesAllChecked = appliesAllCheckbox.checked; const urunIdValue = urunSelect.value; const tarihVal = tarihInput.value;
        if (isAppliesAllChecked) {
            urunSelect.value = ""; urunSelect.disabled = true;
            if (typeof $ !== 'undefined' && $.fn.select2 && $(urunSelect).data('select2')) $(urunSelect).val(null).trigger('change');
            selectedEkHizmetUrunIlkGirisTarihi = null;
        } else {
            urunSelect.disabled = false;
            if (typeof $ !== 'undefined' && $.fn.select2 && $(urunSelect).data('select2')) $(urunSelect).prop('disabled', false).trigger('change.select2'); // Ensure enabled for select2
            if (urunIdValue && tarihVal) {
                if (!selectedEkHizmetUrunIlkGirisTarihi || selectedEkHizmetUrunIlkGirisTarihi.urunId !== urunIdValue) {
                    try {
                        const resp = await fetch(`${baseUrl}/api/antrepo-giris/${activeGirisId}/hareketler`);
                        if (!resp.ok) throw new Error("Hareketler alınamadı");
                        const hareketlerData = await resp.json();
                        const ilkGiris = hareketlerData.filter(h => String(h.urun_id) === String(urunIdValue) && h.islem_tipi === "Giriş").sort((a, b) => new Date(a.islem_tarihi) - new Date(b.islem_tarihi))[0];
                        let correctedIlkGirisTarihiStr = null;
                        if (ilkGiris && ilkGiris.islem_tarihi) { const dateObj = new Date(ilkGiris.islem_tarihi); correctedIlkGirisTarihiStr = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`; }
                        selectedEkHizmetUrunIlkGirisTarihi = { urunId: urunIdValue, tarih: correctedIlkGirisTarihiStr };
                    } catch (err) { console.error("İlk giriş tarihi çekilirken hata:", err); selectedEkHizmetUrunIlkGirisTarihi = { urunId: urunIdValue, tarih: null }; }
                }
                const ilkGirisTarihi = selectedEkHizmetUrunIlkGirisTarihi ? selectedEkHizmetUrunIlkGirisTarihi.tarih : null;
                if (ilkGirisTarihi && tarihVal < ilkGirisTarihi) {
                    let formattedDisplayDate = ilkGirisTarihi;
                    if (ilkGirisTarihi.includes('-')) { const parts = ilkGirisTarihi.split('-'); if (parts.length === 3) formattedDisplayDate = `${parts[2]}.${parts[1]}.${parts[0]}`; }
                    if(warningDiv) { warningDiv.textContent = `Girdiğiniz tarih ürünün ilk giriş tarihi olan ${formattedDisplayDate} tarihinden önce.`; warningDiv.classList.add("active-warning"); }
                    saveBtnElement.disabled = true;
                }
            }
        }
    }
    urunSelect.removeEventListener("change", kontrolEt); urunSelect.addEventListener("change", kontrolEt);
    tarihInput.removeEventListener("input", kontrolEt); tarihInput.addEventListener("input", kontrolEt);
    appliesAllCheckbox.removeEventListener("change", kontrolEt); appliesAllCheckbox.addEventListener("change", kontrolEt);
  }

  function populateModalHizmetParaBirimi() {
    if (!modalHizmetParaBirimi) return; modalHizmetParaBirimi.innerHTML = "";
    allParaBirimleri.forEach(pb => { const opt = document.createElement("option"); opt.value = pb.id.toString(); opt.textContent = `${pb.para_birimi_adi} (${pb.iso_kodu})`; modalHizmetParaBirimi.appendChild(opt); });
  }
  function populateModalHizmetSelect(hizmetler) {
    if (!modalHizmetSelect) return; modalHizmetSelect.innerHTML = `<option value="">Seçiniz...</option>`;
    hizmetler.forEach(h => { const opt = document.createElement("option"); opt.value = h.id; opt.textContent = h.hizmet_adi || h.hizmet_tipi; modalHizmetSelect.appendChild(opt); });
  }
  if(modalHizmetSelect){
    modalHizmetSelect.addEventListener("change", () => {
        const selectedId = modalHizmetSelect.value; if (!selectedId) { clearEkHizmetModalFields(false); return; }
        const found = allHizmetler.find(x => x.id == selectedId);
        if (found) {
          if(modalHizmetKodu) modalHizmetKodu.value = found.hizmet_kodu || ""; if(modalUcretModeli) modalUcretModeli.value = found.hizmet_tipi || "";
          if(modalHizmetBirim) modalHizmetBirim.value = found.birim_adi || "";
          if (found.para_birimi_id && modalHizmetParaBirimi) modalHizmetParaBirimi.value = String(found.para_birimi_id);
          if(modalTemelUcret) modalTemelUcret.value = found.temel_ucret || 0; if(modalCarpan) modalCarpan.value = found.carpan || 0; if(modalHizmetToplam) modalHizmetToplam.value = "";
        }
    });
  }
  [modalTemelUcret, modalCarpan, modalHizmetAdet, modalHizmetParaBirimi].forEach(elem => { if(elem) elem.addEventListener("input", updateEkHizmetToplam); });

  function updateEkHizmetToplam() {
    const temel = parseFloat(modalTemelUcret?.value) || 0; const carp = parseFloat(modalCarpan?.value) || 0; const adet = parseFloat(modalHizmetAdet?.value) || 0;
    if(modalHizmetToplam) modalHizmetToplam.value = ((temel + carp) * adet).toFixed(2);
    if (modalHizmetParaBirimi && modalHizmetParaBirimi.options && modalHizmetParaBirimi.selectedIndex >= 0) {
        const selIdx = modalHizmetParaBirimi.selectedIndex; const text = modalHizmetParaBirimi.options[selIdx]?.textContent || "";
        const match = text.match(/\((.*?)\)/); if (mirrorInput) mirrorInput.value = match ? match[1] : "";
    } else if (mirrorInput) { mirrorInput.value = ""; }
  }
  if(btnEkHizmetCancel) {
    btnEkHizmetCancel.addEventListener("click", () => { if(ekHizmetModal) { ekHizmetModal.style.display = "none"; ekHizmetModal.classList.remove("active"); } });
  }

  function clearEkHizmetModalFields(clearSelect = true) {
    if (clearSelect && modalHizmetSelect) modalHizmetSelect.value = "";
    if (modalHizmetKodu) modalHizmetKodu.value = ""; if (modalUcretModeli) modalUcretModeli.value = ""; if (modalHizmetBirim) modalHizmetBirim.value = "";
    if (modalHizmetParaBirimi) modalHizmetParaBirimi.value = ""; if (modalTemelUcret) modalTemelUcret.value = ""; if (modalCarpan) modalCarpan.value = "";
    if (modalHizmetAdet) modalHizmetAdet.value = ""; if (modalHizmetToplam) modalHizmetToplam.value = ""; if (modalHizmetAciklama) modalHizmetAciklama.value = "";
    if (mirrorInput) mirrorInput.value = ""; if (inputEkHizmetTarih) inputEkHizmetTarih.value = "";
    const urunSelect = document.getElementById("modalEkHizmetUrunSelect");
    if (urunSelect) { urunSelect.value = ""; if (typeof $ !== 'undefined' && $.fn.select2 && $(urunSelect).data('select2')) $(urunSelect).val(null).trigger('change'); }
    const appliesAllCheckbox = document.getElementById("modalEkHizmetAppliesAll"); if (appliesAllCheckbox) { appliesAllCheckbox.checked = false; if(urunSelect) urunSelect.disabled = false; if (typeof $ !== 'undefined' && $.fn.select2 && $(urunSelect).data('select2')) $(urunSelect).prop('disabled', false).trigger('change.select2'); }
    const warningDiv = document.getElementById("ekHizmetIlkGirisWarning"); if (warningDiv) { warningDiv.textContent = ""; warningDiv.classList.remove("active-warning"); }
    const saveBtnElement = document.getElementById("btnEkHizmetSave"); if(saveBtnElement) saveBtnElement.disabled = false;
  }
  function isEkHizmetModalDirty() {
    if (modalHizmetSelect && modalHizmetSelect.value) return true; if (inputEkHizmetTarih && inputEkHizmetTarih.value) return true;
    if (modalTemelUcret && modalTemelUcret.value && parseFloat(modalTemelUcret.value) !== 0) return true;
    if (modalCarpan && modalCarpan.value && parseFloat(modalCarpan.value) !== 0) return true;
    if (modalHizmetAdet && modalHizmetAdet.value && parseFloat(modalHizmetAdet.value) !== 0) return true;
    if (modalHizmetAciklama && modalHizmetAciklama.value.trim() !== "") return true;
    const urunSelect = document.getElementById("modalEkHizmetUrunSelect"); const appliesAllCheckbox = document.getElementById("modalEkHizmetAppliesAll");
    if (urunSelect && urunSelect.value && appliesAllCheckbox && !appliesAllCheckbox.checked) return true;
    return false;
  }

  if(btnEkHizmetCancel) {
    btnEkHizmetCancel.addEventListener("click", () => {
      if (isEkHizmetModalDirty()) {
        if (confirm("Girdiğiniz veriler silinecek, emin misiniz?")) {
          clearEkHizmetModalFields(); if(ekHizmetModal) { ekHizmetModal.style.display = "none"; ekHizmetModal.classList.remove("active"); }
        } else { return; }
      } else {
        clearEkHizmetModalFields(); if(ekHizmetModal) { ekHizmetModal.style.display = "none"; ekHizmetModal.classList.remove("active"); }
      }
    });
  }
  function clearNewHizmetForm() {
    if (newHizmetAdiSelect) newHizmetAdiSelect.value = "new"; if (newHizmetKodu) newHizmetKodu.value = ""; if (newHizmetTipi) newHizmetTipi.value = "";
    if (newHizmetBirim) newHizmetBirim.value = ""; if (newHizmetParaBirimi) newHizmetParaBirimi.value = ""; if (newTemelUcret) newTemelUcret.value = "";
    if (newMinUcret) newMinUcret.value = ""; if (newCarpan) newCarpan.value = ""; if (newHizmetAciklama) newHizmetAciklama.value = "";
  }
  if(btnNewHizmetSave){
    btnNewHizmetSave.addEventListener("click", async () => {
        const payload = {
          hizmet_adi: (newHizmetAdiSelect.value === "new" && newHizmetAdiSelect.options[newHizmetAdiSelect.selectedIndex]) ? newHizmetAdiSelect.options[newHizmetAdiSelect.selectedIndex].textContent : newHizmetAdiSelect.value,
          hizmet_kodu: newHizmetKodu.value.trim(), hizmet_tipi: newHizmetTipi.value, birim_id: parseInt(newHizmetBirim.value, 10) || null,
          para_birimi_id: parseInt(newHizmetParaBirimi.value, 10) || null, temel_ucret: parseFloat(newTemelUcret.value) || 0,
          min_ucret: parseFloat(newMinUcret.value) || 0, carpan: parseFloat(newCarpan.value) || 0, aciklama: newHizmetAciklama.value.trim(), durum: "Aktif"
        };
        if (!payload.hizmet_adi || !payload.hizmet_kodu || !payload.hizmet_tipi || !payload.birim_id || !payload.para_birimi_id) { alert("Lütfen zorunlu alanları doldurun!"); return; }
        try {
          const resp = await fetch(`${baseUrl}/api/hizmetler`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
          const result = await resp.json();
          if (result.success) {
            alert("Hizmet kaydedildi!"); allHizmetler = await fetchData(`${baseUrl}/api/hizmetler`, "Hizmetler hatası");
            populateModalHizmetSelect(allHizmetler); if(newHizmetModal) newHizmetModal.style.display = "none";
          } else { alert("Hizmet eklenemedi: " + (result.message || JSON.stringify(result))); }
        } catch (err) { alert("Hata: " + err.message); console.error("Yeni hizmet eklenirken hata:", err); }
    });
  }
  if(btnNewHizmetCancel){
    btnNewHizmetCancel.addEventListener("click", () => { if (newHizmetModal) { newHizmetModal.style.display = "none"; newHizmetModal.classList.remove("active"); clearNewHizmetForm(); } });
  }

  function renderProductRows() {
    const productTableBody = document.getElementById("productRowsTableBody");
    if (!productTableBody) {
        console.error("HATA: 'productRowsTableBody' ID'li element bulunamadı!");
        return false;
    }
    
    productTableBody.innerHTML = ''; 
    
    if (productRows.length === 0) {
        productTableBody.innerHTML = '<tr><td colspan="12" class="text-center">Henüz ürün eklenmemiş.</td></tr>';
        return true;
    }
    
    productRows.forEach((row, index) => {
        const tr = document.createElement("tr");
        
        const cellDataOrder = [
            row.urunTanimi,
            row.urunKodu,
            row.paketlemeTipi,
            row.paketBoyutu ? `${row.paketBoyutu} Kg` : "", // Paket boyutuna " Kg" eklendi
            row.miktar,
            row.kapAdeti,
            row.brutAgirlik,
            row.netAgirlik,
            (() => { 
                const birimFiyatDegeri = parseFloat(row.birimFiyat);
                if (isNaN(birimFiyatDegeri)) {
                    return row.birimFiyat || ""; 
                }

                let paraBirimiKodu = "";
                if (row.birimFiyatParaBirimiId && allParaBirimleri) { 
                    const paraBirimiObj = allParaBirimleri.find(pb => String(pb.id) === String(row.birimFiyatParaBirimiId));
                    if (paraBirimiObj) {
                        paraBirimiKodu = paraBirimiObj.iso_kodu || ""; 
                    }
                }
                return `${birimFiyatDegeri.toFixed(2)} ${paraBirimiKodu}`.trim();
            })(),
            row.gtipNo,
            row.antrepoGirisTarihi ? (new Date(row.antrepoGirisTarihi).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' })) : "" 
        ];
        
        cellDataOrder.forEach(data => {
            const td = document.createElement("td");
            td.textContent = data !== null && data !== undefined ? data.toString() : "";
            tr.appendChild(td);
        });
        
        const actionsCell = document.createElement("td");
        actionsCell.className = "actions text-center"; 
        
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "btn btn-sm btn-outline-primary edit-row me-2"; 
        editBtn.setAttribute("data-index", index);
        editBtn.innerHTML = '<i class="fa fa-edit"></i>'; 
        editBtn.title = "Düzenle";
        actionsCell.appendChild(editBtn);
        
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn btn-sm btn-outline-danger remove-row"; 
        deleteBtn.setAttribute("data-index", index);
        deleteBtn.innerHTML = '<i class="fa fa-trash"></i>'; 
        deleteBtn.title = "Sil";
        actionsCell.appendChild(deleteBtn);
        
        tr.appendChild(actionsCell);
        productTableBody.appendChild(tr);
        
        deleteBtn.addEventListener("click", function(e) {
            e.preventDefault();
            const rowIndex = this.getAttribute("data-index");
            if (confirm(`#${parseInt(rowIndex) + 1} numaralı ürün satırını silmek istediğinize emin misiniz?`)) {
                if (typeof removeProductRow === 'function') {
                    removeProductRow(rowIndex);
                } else {
                    console.error("removeProductRow fonksiyonu bulunamadı.");
                }
            }
        });
        
        editBtn.addEventListener("click", function(e) {
            e.preventDefault();
            const rowIndex = this.getAttribute("data-index");
            if (typeof editProductRow === 'function') {
                editProductRow(rowIndex);
            } else {
                console.error("editProductRow fonksiyonu bulunamadı.");
            }
        });
    });
    return true;
}

  function removeProductRow(index) { productRows.splice(index, 1); renderProductRows(); }


  if (addProductRowBtn) {
    addProductRowBtn.addEventListener("click", function() {
        const gtipNoEl = document.getElementById("gtipNo");
        const paketlemeTipiEl = document.getElementById("paketlemeTipi"); // ID'si "paketlemeTipi" olan select
        const paketBoyutuEl = document.getElementById("paketBoyutu");     // ID'si "paketBoyutu" olan select
        const birimFiyatEl = document.getElementById("birimFiyat");
        const urunParaBirimiSelect = urunParaBirimiSelectElement;
        const miktarEl = document.getElementById("miktar");
        const kapAdetiEl = document.getElementById("kapAdeti");
        const brutAgirlikEl = document.getElementById("brutAgirlik");
        const netAgirlikEl = document.getElementById("netAgirlik");
        const antrepoGirisTarihiEl = document.getElementById("antrepoGirisTarihi");

        if (!selectedUrunId) { 
            alert("Lütfen bir ürün seçin!");
            if (urunSecimiSelectElement && typeof $ !== 'undefined' && $(urunSecimiSelectElement).data('select2')) $(urunSecimiSelectElement).select2('open');
            else if (urunSecimiSelectElement) urunSecimiSelectElement.focus();
            return;
        }
        if (!birimFiyatEl?.value || parseFloat(birimFiyatEl.value) <= 0 || !urunParaBirimiSelect?.value) {
            alert("Birim fiyat 0'dan büyük olmalı ve ürün para birimi seçilmelidir!");
            if (!birimFiyatEl?.value || parseFloat(birimFiyatEl.value) <= 0) birimFiyatEl.focus();
            else if (urunParaBirimiSelect && typeof $ !== 'undefined' && $(urunParaBirimiSelect).data('select2')) $(urunParaBirimiSelect).select2('open');
            else if (urunParaBirimiSelect) urunParaBirimiSelect.focus();
            return;
        }
        if (!miktarEl?.value || parseFloat(miktarEl.value) <= 0) {
            alert("Lütfen geçerli bir miktar girin (0'dan büyük)!");
            miktarEl.focus();
            return;
        }

        const secilenUrunDetayi = allUrunler.find(u => u.id === selectedUrunId);
        if (!secilenUrunDetayi) {
            alert("Seçilen ürün detayları bulunamadı! Lütfen tekrar ürün seçin.");
            if (urunSecimiSelectElement && typeof $ !== 'undefined' && $(urunSecimiSelectElement).data('select2')) $(urunSecimiSelectElement).select2('open');
            else if (urunSecimiSelectElement) urunSecimiSelectElement.focus();
            return;
        }

        const newRow = {
            urunId: selectedUrunId,
            urunTanimi: secilenUrunDetayi.name, 
            urunKodu: secilenUrunDetayi.code,   
            gtipNo: gtipNoEl?.value || "",
            paketlemeTipi: paketlemeTipiEl?.value || "", 
            paketBoyutu: paketBoyutuEl?.value || "",   
            birimFiyat: birimFiyatEl.value,
            birimFiyatParaBirimiId: urunParaBirimiSelect.value, 
            miktar: miktarEl.value,
            kapAdeti: kapAdetiEl?.value || "",
            brutAgirlik: brutAgirlikEl?.value || "",
            netAgirlik: netAgirlikEl?.value || "",
            antrepoGirisTarihi: antrepoGirisTarihiEl?.value || ""
        };
        productRows.push(newRow);
        renderProductRows(); 

        if (urunSecimiSelectElement && typeof $ !== 'undefined' && $(urunSecimiSelectElement).data('select2')) {
            $(urunSecimiSelectElement).val(null).trigger('change.select2'); 
        } else if (urunSecimiSelectElement) {
            urunSecimiSelectElement.value = "";
            // Eğer Select2 yoksa, manuel sıfırlama
            selectedUrunId = null;
            resetPaketlemeTipi();
            resetPaketBoyutu();
        }
        
        if(gtipNoEl) gtipNoEl.value = "";
        // paketlemeTipiEl ve paketBoyutuEl'i yukarıdaki urunSecimiSelectElement trigger'ı sıfırlayacak.
        
        if(birimFiyatEl) birimFiyatEl.value = "";
        if(urunParaBirimiSelect && typeof $ !== 'undefined' && $(urunParaBirimiSelect).data('select2')) {
            $(urunParaBirimiSelect).val(null).trigger('change.select2');
        } else if (urunParaBirimiSelect) {
            urunParaBirimiSelect.value = "";
        }
        if(miktarEl) miktarEl.value = "";
        if(kapAdetiEl) kapAdetiEl.value = "";
        if(brutAgirlikEl) brutAgirlikEl.value = "";
        if(netAgirlikEl) netAgirlikEl.value = "";
        // antrepoGirisTarihiEl.value = ""; // Genellikle aynı kalması tercih edilebilir.
        
        if(urunSecimiSelectElement && typeof $ !== 'undefined' && $(urunSecimiSelectElement).data('select2')) {
            $(urunSecimiSelectElement).select2('open'); 
        } else if (urunSecimiSelectElement) {
            urunSecimiSelectElement.focus();
        }
        // selectedUrunId zaten yukarıda null yapıldı veya trigger ile yapılacak
    });
  }

  if(antrepoForm) {
    antrepoForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = "Kaydediliyor..."; }
        try {
          for (const product of productRows) {
            if (product.antrepoGirisTarihi && product.antrepoGirisTarihi > today) {
                 alert(`"${product.urunTanimi}" için Antrepo Giriş Tarihi (${product.antrepoGirisTarihi}) gelecekte olamaz!`);
                 if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "Kaydet"; }
                 return;
            }
          }

          let sozlesmeId = sozlesmeSelectElement?.value ? parseInt(sozlesmeSelectElement.value, 10) : null;
          let antrepo_sirket_adi_payload = null;
          if (antrepoSirketiSelectElement && antrepoSirketiSelectElement.value) {
              const selectedSirketOption = Array.from(antrepoSirketiSelectElement.options).find(opt => opt.value === antrepoSirketiSelectElement.value);
              if (selectedSirketOption) antrepo_sirket_adi_payload = selectedSirketOption.textContent;
          }

          const selectedAntrepoId = antrepoAdSelectElement?.value; 
          let antrepoDataForPayload = null;
          let finalAntrepoKodu = null;
          if (selectedAntrepoId) {
              antrepoDataForPayload = allAntrepolar.find(a => String(a.id) === String(selectedAntrepoId));
              if (antrepoDataForPayload) {
                  finalAntrepoKodu = antrepoDataForPayload.antrepoKodu;
              }
          }
          
          const payload = {
              beyanname_form_tarihi: inputBeyannameFormTarihi?.value, beyanname_no: inputBeyannameNo?.value,
              antrepo_sirket_adi: antrepo_sirket_adi_payload, sozlesme_id: sozlesmeId, gumruk: inputGumruk?.value,
              antrepo_id: selectedAntrepoId ? parseInt(selectedAntrepoId, 10) : null, 
              antrepo_kodu: finalAntrepoKodu, 
              adres: inputAdres?.value, sehir: inputSehir?.value,
              gonderici_sirket: inputGondericiSirket?.value || null,
              alici_sirket: inputAliciSirket?.value || null,
              proforma_no: inputProformaNo?.value || null,
              proforma_tarihi: inputProformaTarihi?.value || null,
              ticari_fatura_no: inputTicariFaturaNo?.value || null,
              ticari_fatura_tarihi: inputTicariFaturaTarihi?.value || null,
              depolama_suresi: inputDepolamaSuresi?.value ? parseInt(inputDepolamaSuresi.value, 10) : null,
              fatura_meblagi: inputFaturaMeblagi?.value ? parseFloat(inputFaturaMeblagi.value) : null,
              para_birimi: selectParaBirimi?.value ? parseInt(selectParaBirimi.value, 10) : null, // Eğer para_birimi ID ise parseInt gerekebilir
              fatura_aciklama: inputFaturaAciklama?.value || null,
              ilk_giris: checkboxIlkGiris && checkboxIlkGiris.checked ? true : false,
              urunler: productRows.length > 0 ? productRows.map(p => ({ 
                  urunId: p.urunId,
                  urunTanimi: p.urunTanimi, // Gönderilecek ürün bilgileri
                  urunKodu: p.urunKodu,     // Gönderilecek ürün bilgileri
                  gtipNo: p.gtipNo,
                  paketlemeTipi: p.paketlemeTipi,
                  paketBoyutu: p.paketBoyutu,
                  birimFiyat: p.birimFiyat,
                  urunParaBirimiId: p.birimFiyatParaBirimiId, // Backend'e ID olarak gönderiliyor
                  miktar: p.miktar,
                  kapAdeti: p.kapAdeti,
                  brutAgirlik: p.brutAgirlik,
                  netAgirlik: p.netAgirlik,
                  antrepoGirisTarihi: p.antrepoGirisTarihi,
                  rowId: p.rowId || null 
              })) : null
          };

          let method = "POST"; let finalUrl = `${baseUrl}/api/antrepo-giris`;
          const urlParams = new URLSearchParams(window.location.search); const editId = urlParams.get("id");
          if (editId) { method = "PUT"; finalUrl = `${baseUrl}/api/antrepo-giris/${editId}`; }
          const resp = await fetch(finalUrl, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
          if (!resp.ok) { const errorData = await resp.text(); throw new Error(`Sunucu hatası: ${resp.status}. Detay: ${errorData}`); }
          const result = await resp.json();
          if (result.success) {
            alert(editId ? "Antrepo giriş kaydı başarıyla güncellendi" : "Antrepo giriş kaydı başarıyla eklendi");
            window.location.href = "antrepo-giris-form-list.html";
          } else {
            alert(`Kayıt hatası: ${result.message || "Bilinmeyen hata"}`); if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "Kaydet"; }
          }
        } catch (error) {
          console.error("Form gönderimi sırasında hata:", error); alert(`Hata: ${error.message}`);
          if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "Kaydet"; }
        }
    });
  }

  async function loadExistingData(id) {
    try {
      activeGirisId = id;
      const response = await fetch(`${baseUrl}/api/antrepo-giris/${id}`);
      if (!response.ok) throw new Error(`API yanıt hatası: ${response.status} ${response.statusText}`);
      const data = await response.json(); let formData = Array.isArray(data) ? data[0] : data;
      if (!formData || (Array.isArray(data) && data.length === 0)) throw new Error("Kayıt bulunamadı veya veri formatı hatalı.");

      if(inputBeyannameFormTarihi) inputBeyannameFormTarihi.value = formData.beyanname_form_tarihi ? formData.beyanname_form_tarihi.substring(0,10) : "";
      if(inputBeyannameNo) inputBeyannameNo.value = formData.beyanname_no || "";

      if(inputGondericiSirket) inputGondericiSirket.value = formData.gonderici_sirket || "";
      if(inputAliciSirket) inputAliciSirket.value = formData.alici_sirket || "";
      if(inputProformaNo) inputProformaNo.value = formData.proforma_no || "";
      if (formData.proforma_tarihi && inputProformaTarihi) inputProformaTarihi.value = formData.proforma_tarihi.substring(0,10);
      if(inputTicariFaturaNo) inputTicariFaturaNo.value = formData.ticari_fatura_no || "";
      if (formData.ticari_fatura_tarihi && inputTicariFaturaTarihi) inputTicariFaturaTarihi.value = formData.ticari_fatura_tarihi.substring(0,10);
      if(inputDepolamaSuresi) inputDepolamaSuresi.value = formData.depolama_suresi || "";
      if(inputFaturaMeblagi) inputFaturaMeblagi.value = formData.fatura_meblagi || "";
      
      if(selectParaBirimi) { 
        selectParaBirimi.value = formData.para_birimi || "";
        try { if (typeof $ !== 'undefined' && $.fn.select2 && $(selectParaBirimi).data('select2')) $(selectParaBirimi).trigger('change.select2'); else $(selectParaBirimi).trigger('change'); } catch(e){}
      }
      
      if (formData.sozlesme_id && sozlesmeSelectElement) {
          _isUpdatingSozlesme = true; _isUpdatingSirket = true;
          if (antrepoSirketiSelectElement && antrepoSirketiSelectElement.options.length <= 1 && allSirketler.length > 0) {
              populateAntrepoSirketiSelectWithOptions(antrepoSirketiSelectElement, allSirketler);
          }
          $(sozlesmeSelectElement).val(String(formData.sozlesme_id)).trigger('change'); 
          
          setTimeout(() => {
              if (formData.antrepo_id && antrepoAdSelectElement) {
                  const antrepoOptionExists = Array.from(antrepoAdSelectElement.options).some(opt => opt.value == formData.antrepo_id);
                  if (antrepoOptionExists) {
                      if (!_isUpdatingAntrepoDetails) { 
                          _isUpdatingAntrepoDetails = true;
                          $(antrepoAdSelectElement).val(String(formData.antrepo_id)).trigger('change.select2');
                      }
                  } else {
                      console.warn(`loadExistingData: Antrepo ID ${formData.antrepo_id} sözleşmeye bağlı şirketin antrepoları arasında bulunamadı veya antrepoAdSelectElement güncel değil.`);
                  }
              }
              _isUpdatingSozlesme = false; _isUpdatingSirket = false;
              _isUpdatingAntrepoDetails = false; // Ensure it's reset here too
          }, 500); 
      } else if (formData.antrepo_sirket_adi && antrepoSirketiSelectElement) {
          _isUpdatingSirket = true;
          const ilgiliSirket = allSirketler.find(s => s.display_name === formData.antrepo_sirket_adi);
          if (ilgiliSirket && ilgiliSirket.sirket_id !== undefined) {
              if (antrepoSirketiSelectElement.options.length <= 1 && allSirketler.length > 0) {
                  populateAntrepoSirketiSelectWithOptions(antrepoSirketiSelectElement, allSirketler);
              }
              $(antrepoSirketiSelectElement).val(String(ilgiliSirket.sirket_id)).trigger('change'); 
              
              setTimeout(() => { 
                  if (formData.antrepo_id && antrepoAdSelectElement) {
                       const antrepoOptionExists = Array.from(antrepoAdSelectElement.options).some(opt => opt.value == formData.antrepo_id);
                       if (antrepoOptionExists) {
                            if (!_isUpdatingAntrepoDetails) {
                                _isUpdatingAntrepoDetails = true;
                                $(antrepoAdSelectElement).val(String(formData.antrepo_id)).trigger('change.select2');
                            }
                       } else {
                            console.warn(`loadExistingData: Antrepo ID ${formData.antrepo_id} şirkete bağlı antrepolar arasında bulunamadı.`);
                       }
                  }
                  _isUpdatingSirket = false; 
                  _isUpdatingAntrepoDetails = false; // Ensure it's reset
              }, 300);
          } else {
              _isUpdatingSirket = false; 
          }
      } else if (formData.antrepo_id && antrepoAdSelectElement) { 
          const antrepo = allAntrepolar.find(a => String(a.id) === String(formData.antrepo_id));
          if (antrepo) {
            if (!_isUpdatingAntrepoDetails) {
                _isUpdatingAntrepoDetails = true;
                $(antrepoAdSelectElement).val(String(formData.antrepo_id)).trigger('change.select2'); 
                 setTimeout(()=> _isUpdatingAntrepoDetails = false, 50); // Reset after select2 has processed
            }
          } else { 
              $(antrepoAdSelectElement).val(null).trigger('change.select2');
              if (antrepoKoduSelectElement) $(antrepoKoduSelectElement).val(null).trigger('change.select2');
              if (inputAdres) inputAdres.value = ""; if (inputSehir) inputSehir.value = ""; if (inputGumruk) inputGumruk.value = "";
          }
      }


      const urlParamsView = new URLSearchParams(window.location.search); const modeView = urlParamsView.get("mode");
      if (modeView === "view") {
        disableFormFields(); if (saveBtn) saveBtn.style.display = "none";
        if (newEntryBtn) newEntryBtn.disabled = true; if (newExitBtn) newExitBtn.disabled = true; if (ekHizmetlerBtn) ekHizmetlerBtn.disabled = true;
        [newEntryBtn, newExitBtn, ekHizmetlerBtn, addProductRowBtn].forEach(btn => { if (btn) {btn.disabled = true; btn.classList.add("disabled"); }});
        document.querySelectorAll(".section-header").forEach(header => header.classList.add("view-mode"));
        const pageHeader = document.querySelector(".page-header h1"); if (pageHeader) pageHeader.textContent = "Antrepo Giriş Formu (Görüntüleme)";
      }
      const ekHizmetlerList = await fetchEkHizmetler(activeGirisId); renderEkHizmetler(ekHizmetlerList);
      
      if (formData.urunler && Array.isArray(formData.urunler)) {
        productRows = formData.urunler.map(p_urun => {
            const urunId = p_urun.urun_id || p_urun.urunId;
            const urunDetay = allUrunler.find(u => u.id === urunId); // Ürün detaylarını ID ile al

            const urunParaBirimiId = p_urun.urunParaBirimiId || p_urun.urun_para_birimi_id || ""; 
            let urunParaBirimiKod = urunParaBirimiId; 
            if (urunParaBirimiId && allParaBirimleri && allParaBirimleri.length > 0) {
                const paraBirimi = allParaBirimleri.find(pb => pb.id.toString() === urunParaBirimiId.toString());
                if (paraBirimi) urunParaBirimiKod = paraBirimi.iso_kodu;
            }

            return {
                rowId: p_urun.id || p_urun.rowId, 
                urunId: urunId, 
                urunTanimi: urunDetay ? urunDetay.name : (p_urun.urunTanimi || ""), // ID'den al, yoksa eski veriden
                urunKodu: urunDetay ? urunDetay.code : (p_urun.urunKodu || ""),   // ID'den al, yoksa eski veriden
                gtipNo: p_urun.gtipNo || p_urun.gtib_no, 
                paketlemeTipi: p_urun.paketlemeTipi || p_urun.paketleme_tipi || p_urun.description,
                paketBoyutu: p_urun.paketBoyutu || p_urun.paket_boyutu, 
                birimFiyat: p_urun.birimFiyat || p_urun.birim_fiyat, 
                birimFiyatParaBirimiId: urunParaBirimiId, // Backend'den gelen ID'yi kullan
                // urunParaBirimiKod: urunParaBirimiKod,  // Bu sadece gösterim için, productRows'a eklemeye gerek yok
                miktar: p_urun.miktar,
                kapAdeti: p_urun.kapAdeti || p_urun.kap_adeti, 
                brutAgirlik: p_urun.brutAgirlik || p_urun.brut_agirlik, 
                netAgirlik: p_urun.netAgirlik || p_urun.net_agirlik,
                antrepoGirisTarihi: p_urun.antrepoGirisTarihi || (p_urun.created_at ? p_urun.created_at.substring(0, 10) : null)
            };
        }).map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value === null || value === undefined ? "" : value]))); 
      } else if (formData.urun_id || (formData.id && (formData.urun_tanimi || formData.urun_kodu)) ) { // Fallback for old single product structure
         const urunId = formData.urun_id || (allUrunler.find(u => u.name === formData.urun_tanimi || u.code === formData.urun_kodu)?.id);
         const urunDetay = allUrunler.find(u => u.id === urunId);

         const urunParaBirimiId = formData.urunParaBirimiId || formData.urun_para_birimi_id || "";
         
         productRows = [{
            rowId: formData.id, 
            urunId: urunId,
            urunTanimi: urunDetay ? urunDetay.name : (formData.urun_tanimi || ""), 
            urunKodu: urunDetay ? urunDetay.code : (formData.urun_kodu || ""),
            gtipNo: formData.gtib_no || "", 
            paketlemeTipi: formData.paketleme_tipi || formData.description || "", 
            paketBoyutu: formData.paket_boyutu || "",
            birimFiyat: formData.urun_birim_fiyat || formData.birim_fiyat || "", 
            birimFiyatParaBirimiId: urunParaBirimiId,   
            miktar: formData.miktar || "", 
            kapAdeti: formData.kap_adeti || "",
            brutAgirlik: formData.brut_agirlik || "", 
            netAgirlik: formData.net_agirlik || "",
            antrepoGirisTarihi: formData.antrepo_giris_tarihi ? formData.antrepo_giris_tarihi.substring(0, 10) : (formData.created_at ? formData.created_at.substring(0,10) : "")
        }];
      } else { productRows = []; }
      renderProductRows();
    } catch (error) { console.error("Kayıt yükleme hatası:", error); alert("Kayıt yüklenirken bir hata oluştu! Detay: " + error.message); }
  }

  if (newEntryBtn) {
    newEntryBtn.addEventListener("click", () => {
      if (!activeGirisId) { alert("Önce antrepo giriş formunu kaydetmelisiniz!"); return; }
      const newEntryModal = document.getElementById("newEntryModal");
      if(newEntryForm) newEntryForm.reset(); populateModalProductSelect('modalEntryUrunSelect', 'modalEntryUrunKodu');
      if(newEntryModal) newEntryModal.style.display = "flex";
    });
  }

  if (newExitBtn) {
    newExitBtn.addEventListener("click", () => {
      if (!activeGirisId) { alert("Önce antrepo giriş formunu kaydetmelisiniz!"); return; }
      const newExitModal = document.getElementById("newExitModal");
      if(newExitForm) newExitForm.reset(); populateModalProductSelect('modalExitUrunSelect', 'modalExitUrunKodu');
      if(newExitModal) newExitModal.style.display = "flex";
    });
  }

  async function loadRemainingStockForExitModal(urunId, urunVaryantId = null) {
    const miktarInput = document.getElementById('modalExitMiktar'); const kapAdetiInput = document.getElementById('modalExitKapAdeti');
    const brutAgirlikInput = document.getElementById('modalExitBrutAgirlik'); const netAgirlikInput = document.getElementById('modalExitNetAgirlik');
    const resetFields = () => { if (miktarInput) miktarInput.value = '0.00'; if (kapAdetiInput) kapAdetiInput.value = '0'; if (brutAgirlikInput) brutAgirlikInput.value = '0.00'; if (netAgirlikInput) netAgirlikInput.value = '0.00'; };
    if (!activeGirisId || !urunId) { resetFields(); return; }
    try {
      let apiUrl = `${baseUrl}/api/antrepo-giris/${activeGirisId}/kalan-stok/${urunId}`; if (urunVaryantId) apiUrl += `?urunVaryantId=${urunVaryantId}`;
      const response = await fetch(apiUrl); if (!response.ok) throw new Error(`Kalan stok alınamadı: ${response.status} ${response.statusText}`);
      const data = await response.json();
      if (miktarInput) miktarInput.value = data.kalan_miktar || '0.00'; if (kapAdetiInput) kapAdetiInput.value = data.kalan_kap_adeti || '0';
      if (brutAgirlikInput) brutAgirlikInput.value = data.kalan_brut_agirlik || '0.00'; if (netAgirlikInput) netAgirlikInput.value = data.kalan_net_agirlik || '0.00';
    } catch (error) { console.error("Kalan stok yüklenirken hata:", error); resetFields(); }
  }

  function populateModalProductSelect(selectId, codeFieldId) {
    const selectElement = document.getElementById(selectId); const codeField = document.getElementById(codeFieldId); if (!selectElement) return;
    selectElement.innerHTML = '<option value="">Ürün seçiniz...</option>';
    productRows.forEach((row, index) => {
      const option = document.createElement('option'); option.value = index; // Use index as value for easy lookup in productRows
      option.textContent = `${row.urunTanimi} (${row.urunKodu || 'Kodsuz'})`;
      Object.keys(row).forEach(key => { if (row[key] !== null && row[key] !== undefined) option.dataset[key] = row[key]; });
      selectElement.appendChild(option);
    });
    try {
      if ($(selectElement).data('select2')) $(selectElement).select2('destroy');
      const modalParent = $(selectElement).closest('.modal'); // Or specific modal ID
      $(selectElement).select2({ 
          placeholder: 'Ürün seçiniz...', 
          allowClear: true, 
          width: '100%',
          dropdownParent: modalParent.length ? modalParent : $('body') // Attach to modal or body
      }); 
      $(selectElement).on('change', async function() {
        const selectedIndex = this.value; // This is the index in productRows
        if (selectedIndex !== "" && productRows[selectedIndex]) {
          const selectedProductData = productRows[selectedIndex]; 
          if (codeField) codeField.value = selectedProductData.urunKodu || '';
          
          if (selectId === 'modalExitUrunSelect') { // Only for exit modal
            const urunId = selectedProductData.urunId; 
            const paketlemeTipi = selectedProductData.paketlemeTipi; 
            const paketBoyutu = selectedProductData.paketBoyutu; 
            let urunVaryantId = null;
            if (urunId && paketlemeTipi && paketBoyutu) {
                urunVaryantId = await findVariantId(urunId, paketlemeTipi, paketBoyutu);
            }
            await loadRemainingStockForExitModal(urunId, urunVaryantId);
          }
        } else {
          if (codeField) codeField.value = ''; 
          if (selectId === 'modalExitUrunSelect') loadRemainingStockForExitModal(null);
        }
      });
    } catch (e) { console.error('Select2 initialization error:', e); }
  }

  if (newEntryForm) {
    newEntryForm.addEventListener("submit", async (e) => {
      e.preventDefault(); const submitButton = document.getElementById("newEntrySubmitBtn") || document.getElementById("entrySaveBtn");
      if (submitButton && submitButton.getAttribute('data-processing') === 'true') return false;
      if (submitButton) { submitButton.setAttribute('data-processing', 'true'); submitButton.textContent = "İşleniyor..."; submitButton.disabled = true; }
      try {
        const entryTarih = document.getElementById("modalAntrepoGirisTarihi")?.value; const entryMiktar = document.getElementById("modalMiktar")?.value;
        if (!entryTarih || !entryMiktar || parseFloat(entryMiktar) <= 0) { alert("Lütfen geçerli bir tarih ve miktar girin!"); throw new Error("Validation failed"); }
        const urunSelect = document.getElementById("modalEntryUrunSelect"); const selectedIndex = urunSelect.value;
        let selectedProduct = null, selectedProductId = null, variantId = null;
        if (selectedIndex !== "" && productRows[selectedIndex]) {
          selectedProduct = productRows[selectedIndex]; selectedProductId = selectedProduct.urunId;
          if (selectedProduct.urunId && selectedProduct.paketlemeTipi && selectedProduct.paketBoyutu) variantId = await findVariantId(selectedProduct.urunId, selectedProduct.paketlemeTipi, selectedProduct.paketBoyutu);
        } else { alert("Lütfen bir ürün seçin!"); throw new Error("Validation failed: No product selected"); }
        const hareketPayload = {
          islem_tarihi: entryTarih, islem_tipi: "Giriş", miktar: parseFloat(entryMiktar) || 0,
          brut_agirlik: parseFloat(document.getElementById("modalBrutAgirlik")?.value) || 0, net_agirlik: parseFloat(document.getElementById("modalNetAgirlik")?.value) || 0,
          kap_adeti: parseInt(document.getElementById("modalKapAdeti")?.value) || 0, aciklama: document.getElementById("modalAciklama")?.value || "Yeni Giriş",
          description: selectedProduct ? selectedProduct.paketlemeTipi : null, urun_varyant_id: variantId, urun_id: selectedProductId
        };
        const resp = await fetch(`${baseUrl}/api/antrepo-giris/${activeGirisId}/hareketler`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(hareketPayload) });
        const result = await resp.json();
        if (result.success) {
          alert("Yeni giriş eklendi!"); const newEntryModal = document.getElementById("newEntryModal"); if(newEntryModal) newEntryModal.style.display = "none";
          if(newEntryForm) newEntryForm.reset(); await fetchHareketler();
        } else { alert("Yeni giriş eklenemedi: " + (result.message || JSON.stringify(result))); }
      } catch (error) { if (error.message !== "Validation failed" && error.message !== "Validation failed: No product selected") console.error("Yeni giriş eklenirken hata:", error); }
      finally { if (submitButton) { setTimeout(() => { submitButton.removeAttribute('data-processing'); submitButton.textContent = "Kaydet"; submitButton.disabled = false; }, 1000); } }
    });
  }

  if (newExitForm) {
    newExitForm.addEventListener("submit", async (e) => {
      e.preventDefault(); const submitButton = document.getElementById("newExitSubmitBtn");
      if (submitButton && submitButton.getAttribute('data-processing') === 'true') return false;
      if (submitButton) { submitButton.setAttribute('data-processing', 'true'); submitButton.textContent = "İşleniyor..."; submitButton.disabled = true; }
      try {
        const exitTarih = document.getElementById("modalExitTarih")?.value; const exitMiktar = document.getElementById("modalExitMiktar")?.value;
        if (!exitTarih || !exitMiktar || parseFloat(exitMiktar) <= 0) { alert("Lütfen geçerli bir tarih ve miktar girin!"); throw new Error("Validation failed"); }
        const urunSelect = document.getElementById("modalExitUrunSelect"); const selectedIndex = urunSelect.value;
        let selectedProduct = null, selectedProductId = null, variantIdForExit = null;
        if (selectedIndex !== "" && productRows[selectedIndex]) {
          selectedProduct = productRows[selectedIndex]; selectedProductId = selectedProduct.urunId;
           if (selectedProduct.urunId && selectedProduct.paketlemeTipi && selectedProduct.paketBoyutu) variantIdForExit = await findVariantId(selectedProduct.urunId, selectedProduct.paketlemeTipi, selectedProduct.paketBoyutu);
        } else { alert("Lütfen bir ürün seçin!"); throw new Error("Validation failed: No product selected"); }
        const exitPayload = {
          islem_tarihi: exitTarih, islem_tipi: "Çıkış", miktar: parseFloat(exitMiktar) || 0,
          kap_adeti: parseInt(document.getElementById("modalExitKapAdeti")?.value) || 0, brut_agirlik: parseFloat(document.getElementById("modalExitBrutAgirlik")?.value) || 0,
          net_agirlik: parseFloat(document.getElementById("modalExitNetAgirlik")?.value) || 0, aciklama: formatExitDescription(),
          description: selectedProduct ? selectedProduct.paketlemeTipi : null, urun_varyant_id: variantIdForExit, urun_id: selectedProductId,
          paket_hacmi: selectedProduct ? (parseFloat(selectedProduct.paketBoyutu) || null) : null
        };
        const resp = await fetch(`${baseUrl}/api/antrepo-giris/${activeGirisId}/hareketler`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(exitPayload) });
        const result = await resp.json();
        if (result.success) {
          alert("Yeni çıkış eklendi!"); const newExitModal = document.getElementById("newExitModal"); if(newExitModal) newExitModal.style.display = "none";
          if(newExitForm) newExitForm.reset(); await fetchHareketler();
        } else { alert("Yeni çıkış eklenemedi: " + (result.message || JSON.stringify(result))); }
      } catch (error) { if (error.message !== "Validation failed" && error.message !== "Validation failed: No product selected") console.error("Yeni çıkış eklenirken hata:", error); }
      finally { if (submitButton) { setTimeout(() => { submitButton.removeAttribute('data-processing'); submitButton.textContent = "Kaydet"; submitButton.disabled = false; }, 1000); } }
    });
  }

  if (entryCancelBtn) entryCancelBtn.addEventListener("click", () => { const newEntryModal = document.getElementById("newEntryModal"); if(newEntryModal) newEntryModal.style.display = "none"; if(newEntryForm) newEntryForm.reset(); });
  if (exitCancelBtn) exitCancelBtn.addEventListener("click", () => { const newExitModal = document.getElementById("newExitModal"); if(newExitModal) newExitModal.style.display = "none"; if(newExitForm) newExitForm.reset(); });

  if (inputAntrepoGirisTarihi) { 
    const urlParamsForDate = new URLSearchParams(window.location.search);
    // if (!urlParamsForDate.get("id")) { // Yeni kayıtta tarih otomatik gelmesin
    // }
    inputAntrepoGirisTarihi.setAttribute('max', today);
  }

  function editProductRow(index) {
    selectedProductRow = index; 
    const row = productRows[index]; 
    const editModal = document.getElementById("editProductModal");
    if (!editModal) { 
        alert("Düzenleme formu yüklenemedi."); 
        selectedProductRow = null; 
        return; 
    }
    populateEditForm(row); 
    editModal.style.display = "flex";
  }

  function populateEditForm(productData) {
    const productSelect = document.getElementById("editProductSelect");
    if (productSelect) {
      productSelect.innerHTML = '<option value="">Seçiniz...</option>';
      allUrunler.forEach(urun => { if (urun.active !== false && !urun.deleted) { const option = document.createElement("option"); option.value = urun.id; option.textContent = `${urun.name} (${urun.code || 'Kodsuz'})`; productSelect.appendChild(option); } });
      try { 
          if ($(productSelect).data('select2')) $(productSelect).select2('destroy'); 
          $(productSelect).select2({ placeholder: 'Ürün seçiniz...', width: '100%', dropdownParent: $('#editProductModal') }); 
          if (productData.urunId) $(productSelect).val(productData.urunId.toString()).trigger('change.select2'); else $(productSelect).val(null).trigger('change.select2');
      } catch(e) { console.error("Select2 initialization error in populateEditForm (productSelect):", e); }
    }

    const urunKoduInput = document.getElementById("editUrunKodu"); 
    if (urunKoduInput) {
        const urun = allUrunler.find(u => String(u.id) === String(productData.urunId));
        urunKoduInput.value = urun ? (urun.code || '') : (productData.urunKodu || '');
    }

    const gtipNoInput = document.getElementById("editGtipNo"); if (gtipNoInput) gtipNoInput.value = productData.gtipNo || '';
    
    loadEditVariantDataForProduct(productData.urunId, productData.paketlemeTipi); 
    loadEditPaketBoyutuForProduct(productData.urunId, productData.paketBoyutu);
    
    const birimFiyat = document.getElementById("editBirimFiyat"); if(birimFiyat) birimFiyat.value = productData.birimFiyat || '';
    
    const editUrunParaBirimiSelect = document.getElementById("editUrunParaBirimiSelect"); 
    if (editUrunParaBirimiSelect && allParaBirimleri.length > 0) {
        fillParaBirimDropdown(editUrunParaBirimiSelect, "Ürün P.B. Seçiniz"); 
        if (productData.birimFiyatParaBirimiId) { // birimFiyatParaBirimiId olarak saklanıyor productRows'da
             setTimeout(() => { 
                $(editUrunParaBirimiSelect).val(productData.birimFiyatParaBirimiId.toString()).trigger('change.select2');
             }, 100); // Increased timeout for select2 init + population
        } else {
            $(editUrunParaBirimiSelect).val(null).trigger('change.select2');
        }
    }


    const miktar = document.getElementById("editMiktar"); if(miktar) miktar.value = productData.miktar || '';
    const kapAdeti = document.getElementById("editKapAdeti"); if(kapAdeti) kapAdeti.value = productData.kapAdeti || '';
    const brutAgirlik = document.getElementById("editBrutAgirlik"); if(brutAgirlik) brutAgirlik.value = productData.brutAgirlik || '';
    const netAgirlik = document.getElementById("editNetAgirlik"); if(netAgirlik) netAgirlik.value = productData.netAgirlik || '';
    const antrepoGiris = document.getElementById("editAntrepoGirisTarihi"); 
    if(antrepoGiris) {
        antrepoGiris.value = productData.antrepoGirisTarihi || '';
        antrepoGiris.setAttribute('max', today); 
    }
  }

  async function loadEditVariantDataForProduct(urunId, selectedValue) {
    const select = document.getElementById("editPaketlemeTipi"); if (!select) return;
    try { if ($.fn.select2 && $(select).hasClass("select2-hidden-accessible")) $(select).select2('destroy'); } catch(e) { /* ignore */ }
    $(select).empty().append(new Option('Seçiniz...', '', true, true));
    if (!urunId) { 
        try { $(select).select2({ placeholder: 'Paketleme Tipi Seçin', width: '100%', dropdownParent: $('#editProductModal'), allowClear: true }); } catch(e) {} 
        return; 
    }
    try {
      const response = await fetch(`${baseUrl}/api/urun_varyantlari/details?urunId=${urunId}`); if (!response.ok) throw new Error(`API yanıt hatası: ${response.status}`);
      const data = await response.json(); const uniqueDescriptions = [...new Set(data.map(v => v.description).filter(Boolean))];
      const optionsData = uniqueDescriptions.map(desc => ({ id: desc, text: desc }));
      $(select).select2({ placeholder: 'Paketleme Tipi Seçin', allowClear: true, width: '100%', data: optionsData, dropdownParent: $('#editProductModal') });
      if (selectedValue) setTimeout(() => $(select).val(selectedValue).trigger('change.select2'), 100); else $(select).val(null).trigger('change.select2');
    } catch (error) { console.error("loadEditVariantDataForProduct hata:", error); try { $(select).select2({ placeholder: 'Paketleme Tipi Seçin', width: '100%', dropdownParent: $('#editProductModal'), allowClear: true }); } catch(e) {} }
  }

  async function loadEditPaketBoyutuForProduct(urunId, selectedValue) {
    const select = document.getElementById("editPaketBoyutu"); if (!select) return; select.innerHTML = '<option value="">Seçiniz...</option>'; if (!urunId) return;
    try {
      const response = await fetch(`${baseUrl}/api/urun_varyantlari/details?urunId=${urunId}`); if (!response.ok) throw new Error("Varyant verisi alınamadı");
      const data = await response.json(); const uniqueSizes = [...new Set(data.map(v => v.paket_hacmi).filter(Boolean))];
      uniqueSizes.forEach(size => { const opt = document.createElement("option"); opt.value = size; opt.textContent = size + " Kg"; select.appendChild(opt); });
       if (selectedValue) {
           // Ensure the value exists as an option before setting it
           if (Array.from(select.options).some(opt => opt.value == selectedValue)) {
               select.value = selectedValue;
           } else {
               console.warn(`loadEditPaketBoyutuForProduct: Değer "${selectedValue}" seçenekler arasında bulunamadı.`)
               select.value = ""; // Reset if not found
           }
       } else {
           select.value = "";
       }
    } catch (error) { console.error("loadEditPaketBoyutuForProduct hata:", error); }
  }

  const editProductSelect = document.getElementById("editProductSelect");
  if (editProductSelect && typeof $ !== 'undefined' && $.fn.select2) {
    $(editProductSelect).on('change', function() {
      const urunId = $(this).val(); 
      const urunKoduInput = document.getElementById("editUrunKodu"); 
      const paketBoyutuSelect = document.getElementById("editPaketBoyutu");
      const editUrunParaBirimiSelect = document.getElementById("editUrunParaBirimiSelect"); 

      if (urunId) {
        const urun = allUrunler.find(u => String(u.id) === String(urunId)); 
        if (urun && urunKoduInput) urunKoduInput.value = urun.code || '';
        
        loadEditVariantDataForProduct(urunId, null); 
        loadEditPaketBoyutuForProduct(urunId, null);

      } else {
        if (urunKoduInput) urunKoduInput.value = ''; 
        loadEditVariantDataForProduct(null, null);
        if (paketBoyutuSelect) paketBoyutuSelect.innerHTML = '<option value="">Seçiniz...</option>';
        if (editUrunParaBirimiSelect) $(editUrunParaBirimiSelect).val(null).trigger('change.select2');
      }
    });
  }
  const saveEditBtn = document.getElementById("saveEditProductBtn"); if (saveEditBtn) saveEditBtn.addEventListener("click", function() { saveProductEdit(); });
  const closeEditBtn = document.getElementById("closeEditProductBtn"); if (closeEditBtn) closeEditBtn.addEventListener("click", function() { const editModal = document.getElementById("editProductModal"); if(editModal) editModal.style.display = "none"; selectedProductRow = null; });
  const cancelEditBtnModal = document.getElementById("cancelEditProductBtn"); if (cancelEditBtnModal) cancelEditBtnModal.addEventListener("click", function() { const editModal = document.getElementById("editProductModal"); if(editModal) editModal.style.display = "none"; selectedProductRow = null; });

  function saveProductEdit() {
    if (selectedProductRow === null || productRows[selectedProductRow] === undefined) { alert("Düzenlenecek ürün bulunamadı!"); return; }
    
    const urunIdStr = document.getElementById("editProductSelect")?.value; 
    if (!urunIdStr) { alert("Lütfen bir ürün seçin!"); return; }
    const urunId = parseInt(urunIdStr, 10);
    const urun = allUrunler.find(u => u.id === urunId); 
    if (!urun) { alert("Seçilen ürün bulunamadı!"); return; }

    const editUrunParaBirimiSelect = document.getElementById("editUrunParaBirimiSelect");
    const urunParaBirimiIdVal = editUrunParaBirimiSelect?.value;
    
    if (!urunParaBirimiIdVal) {
        alert("Lütfen ürün için para birimi seçin!");
        if (editUrunParaBirimiSelect && typeof $ !== 'undefined' && $(editUrunParaBirimiSelect).data('select2')) $(editUrunParaBirimiSelect).select2('open');
        else if (editUrunParaBirimiSelect) editUrunParaBirimiSelect.focus();
        return;
    }


    productRows[selectedProductRow] = {
      ...productRows[selectedProductRow], 
      urunId: urunId, 
      urunTanimi: urun.name, 
      urunKodu: urun.code,
      gtipNo: document.getElementById("editGtipNo")?.value || "", 
      paketlemeTipi: document.getElementById("editPaketlemeTipi")?.value || "",
      paketBoyutu: document.getElementById("editPaketBoyutu")?.value || "", 
      birimFiyat: document.getElementById("editBirimFiyat")?.value || "",
      birimFiyatParaBirimiId: urunParaBirimiIdVal, // Değişti
      miktar: document.getElementById("editMiktar")?.value || "", 
      kapAdeti: document.getElementById("editKapAdeti")?.value || "",
      brutAgirlik: document.getElementById("editBrutAgirlik")?.value || "", 
      netAgirlik: document.getElementById("editNetAgirlik")?.value || "",
      antrepoGirisTarihi: document.getElementById("editAntrepoGirisTarihi")?.value || ""
    };
    renderProductRows(); 
    const editModal = document.getElementById("editProductModal"); 
    if(editModal) editModal.style.display = "none"; 
    selectedProductRow = null;
  }

  const urlParams = new URLSearchParams(window.location.search); const editId = urlParams.get("id");
  if (editId) {
    document.title = "Antrepo Giriş Formu (Düzenle)"; const pageHeader = document.querySelector(".page-header h1");
    if (pageHeader) pageHeader.textContent = "Antrepo Giriş Formu (Düzenleme)";
    await loadExistingData(editId); await fetchHareketler();
  } else { renderProductRows(); }

  if (btnEkHizmetSave) {
    btnEkHizmetSave.addEventListener("click", async () => {
      const tarihVal = inputEkHizmetTarih?.value.trim(); if (!tarihVal) { alert("Tarih zorunludur!"); return; }
      const hizmetId = modalHizmetSelect?.value; if (!hizmetId) { alert("Lütfen bir hizmet seçin!"); return; }
      const appliesAllCheckbox = document.getElementById("modalEkHizmetAppliesAll"); const urunSelect = document.getElementById("modalEkHizmetUrunSelect");
      let ekHizmetUrunId = null;
      if (appliesAllCheckbox && !appliesAllCheckbox.checked) { if (!(urunSelect && urunSelect.value)) { alert("Lütfen bir ürün seçin veya 'Tüm ürünleri etkileyen hizmet'i işaretleyin!"); return; } ekHizmetUrunId = urunSelect.value; }
      const ekHizmetObj = {
        hizmet_id: hizmetId, hizmet_kodu: modalHizmetKodu?.value, ucret_modeli: modalUcretModeli?.value, birim: modalHizmetBirim?.value,
        para_birimi_id: modalHizmetParaBirimi?.value, temel_ucret: parseFloat(modalTemelUcret?.value) || 0, carpan: parseFloat(modalCarpan?.value) || 0,
        adet: parseFloat(modalHizmetAdet?.value) || 0, toplam: parseFloat(modalHizmetToplam?.value) || 0, aciklama: modalHizmetAciklama?.value.trim(),
        ek_hizmet_tarihi: tarihVal, urun_id: ekHizmetUrunId, applies_to_all: (appliesAllCheckbox && appliesAllCheckbox.checked)
      };
      try {
        const resp = await fetch(`${baseUrl}/api/antrepo-giris/${activeGirisId}/ek-hizmetler`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ekHizmetObj) });
        const result = await resp.json();
        if (result.success) {
          alert("Ek hizmet kaydedildi!"); const updatedList = await fetchEkHizmetler(activeGirisId); renderEkHizmetler(updatedList); clearEkHizmetModalFields();
          if(ekHizmetModal) { ekHizmetModal.style.display = "none"; ekHizmetModal.classList.remove("active"); }
        } else { console.error("Ek hizmet ekleme hatası sunucudan:", result); alert("Ek hizmet eklenemedi: " + (result.message || JSON.stringify(result))); }
      } catch (error) { console.error("Ek hizmet kaydetme sırasında fetch hatası:", error); alert("Ek hizmet kaydedilirken hata: " + error.message); }
    });
  }

  const confirmModal = document.getElementById("confirmModal"); const confirmYesBtn = document.getElementById("confirmYes");
  const confirmNoBtnModal = document.getElementById("confirmNo"); let itemToDeleteId = null; let deleteType = "";
  function showConfirmModal(id, type) {
    itemToDeleteId = id; deleteType = type; if (!confirmModal) { if (confirm(`Bu ${type === "hareket" ? "hareketi" : "ek hizmeti"} silmek istediğinize emin misiniz?`)) { if (type === "hareket") deleteHareket(id); else if (type === "ekhizmet") deleteEkHizmet(id); } return; }
    const modalMessageElement = confirmModal.querySelector("#modalMessage"); if(modalMessageElement) modalMessageElement.textContent = `Bu ${type === "hareket" ? "hareketi" : "ek hizmeti"} silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`;
    confirmModal.style.display = "flex";
  }
  if (confirmYesBtn) {
    confirmYesBtn.addEventListener("click", function() {
      if (confirmModal) confirmModal.style.display = "none";
      if (deleteType === "hareket" && itemToDeleteId) deleteHareket(itemToDeleteId);
      else if (deleteType === "ekhizmet" && itemToDeleteId) deleteEkHizmet(itemToDeleteId);
      itemToDeleteId = null; deleteType = "";
    });
  }
  if (confirmNoBtnModal) confirmNoBtnModal.addEventListener("click", () => { if (confirmModal) confirmModal.style.display = "none"; itemToDeleteId = null; deleteType = ""; });
  if (confirmModal) { confirmModal.addEventListener("click", function(e) { if (e.target === confirmModal) { confirmModal.style.display = "none"; itemToDeleteId = null; deleteType = ""; } }); }

  if (typeof $ !== 'undefined' && $.fn.select2) {
      if(sozlesmeSelectElement && !$(sozlesmeSelectElement).data('select2')) $(sozlesmeSelectElement).select2({ placeholder: "Sözleşme Seçiniz", allowClear: true, width: '100%' });
      if(antrepoSirketiSelectElement && !$(antrepoSirketiSelectElement).data('select2')) $(antrepoSirketiSelectElement).select2({ placeholder: "Antrepo Şirketi Seçiniz", allowClear: true, width: '100%' });
      
      // Yeni urunSecimiSelectElement için Select2 başlatma
      if(urunSecimiSelectElement && !$(urunSecimiSelectElement).data('select2')) {
          $(urunSecimiSelectElement).select2({ placeholder: "Ürün Seçiniz (Ad veya Kod)", allowClear: true, width: '100%' });
      }
      // Paketleme tipi Select2 (zaten loadVariantDataForProduct içinde handle ediliyor ama ilk başta da olabilir)
      const paketlemeTipiSelectForInit = document.getElementById("paketlemeTipi");
      if(paketlemeTipiSelectForInit && !$(paketlemeTipiSelectForInit).data('select2')){
          $(paketlemeTipiSelectForInit).select2({ placeholder: 'Paketleme Tipi Seçin', allowClear: true, width: '100%' });
      }


      if(selectParaBirimi && !$(selectParaBirimi).data('select2')) { 
           $(selectParaBirimi).select2({ placeholder: "Fatura P.B. Seçiniz", allowClear: true, width: '100%' });
      }
      if(urunParaBirimiSelectElement && !$(urunParaBirimiSelectElement).data('select2')) { 
           $(urunParaBirimiSelectElement).select2({ placeholder: "Ürün P.B. Seçiniz", allowClear: true, width: '100%' });
      }

      if(antrepoAdSelectElement && !$(antrepoAdSelectElement).data('select2')) {
          $(antrepoAdSelectElement).select2({ placeholder: "Antrepo Adı Seçiniz", allowClear: true, width: '100%' });
      }
      if(antrepoKoduSelectElement && !$(antrepoKoduSelectElement).data('select2')) {
          $(antrepoKoduSelectElement).select2({ placeholder: "Antrepo Kodu Seçiniz", allowClear: true, width: '100%' });
      }
      const modalEkHizmetUrunSelect = document.getElementById('modalEkHizmetUrunSelect');
      if (modalEkHizmetUrunSelect && !$(modalEkHizmetUrunSelect).data('select2')) $(modalEkHizmetUrunSelect).select2({ placeholder: 'Ürün seçiniz...', allowClear: true, width: '100%', dropdownParent: $('#ekHizmetModal')});
  }
}); // End of MAIN DOMContentLoaded


const cancelBtnGlobal = document.getElementById("cancelBtn");
if (cancelBtnGlobal) {
  cancelBtnGlobal.addEventListener("click", function(e) {
    e.preventDefault(); let isDirty = false;
    const initialProductRowsString = sessionStorage.getItem('initialProductRows'); 
    const currentProductRowsString = JSON.stringify(productRows.map(p => ({...p, urunId: p.urunId.toString() }))); // urunId'yi stringe çevirerek karşılaştırma

    document.querySelectorAll("#antrepoForm input, #antrepoForm select, #antrepoForm textarea").forEach(el => {
        if (el.disabled || el.readOnly || el.closest('.select2-container')) return; // Select2'nin kendi inputlarını kontrol etme
        
        let originalValue = el.dataset.defaultValue || el.defaultValue;
        let currentValue = el.value;

        if (el.type === "checkbox" || el.type === "radio") { 
            originalValue = (el.dataset.defaultChecked === 'true' || el.defaultChecked); // String 'true' veya boolean
            currentValue = el.checked;
            if(currentValue !== originalValue) isDirty = true; 
        } else if (el.multiple && el.tagName === 'SELECT') { // Multi-select için
             // Bu örnekte multi-select yok ama genel bir kontrol
        } else { 
            if(currentValue !== originalValue) isDirty = true; 
        }
    });

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("id")) { // Düzenleme modunda
        if (initialProductRowsString && initialProductRowsString !== currentProductRowsString) {
            isDirty = true;
        }
    } else if (productRows.length > 0) { // Yeni form ve ürün eklenmiş
        isDirty = true;
    }


    if (isDirty) { if (confirm("Değişiklikleriniz kaydedilmeyecek. Devam etmek istiyor musunuz?")) window.location.href = "antrepo-giris-form-list.html"; }
    else { window.location.href = "antrepo-giris-form-list.html"; }
  });
}

// Helper to store initial state of inputs for dirty checking
function storeInitialFormValues(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll("input, select, textarea").forEach(el => {
    if (el.closest('.select2-container')) return; // Select2 içindeki elementleri atla

    if (el.type === "checkbox" || el.type === "radio") {
      el.dataset.defaultChecked = el.checked.toString(); // Boolean'ı string olarak sakla
    } else if (el.multiple && el.tagName === 'SELECT') {
      // Multi-select için başlangıç değerlerini JSON string olarak sakla
      // el.dataset.defaultValue = JSON.stringify(Array.from(el.selectedOptions).map(opt => opt.value));
    } else {
      el.dataset.defaultValue = el.value;
    }
  });
  if (window.productRows && formId === 'antrepoForm') { 
    // productRows'u saklarken urunId'yi stringe çevirerek tutarlılık sağla
    sessionStorage.setItem('initialProductRows', JSON.stringify(productRows.map(p => ({...p, urunId: p.urunId.toString() }))));
  }
}

document.addEventListener("DOMContentLoaded", async () => {
    // ... (önceki DOMContentLoaded içeriği) ...

    const urlParamsForInitialStore = new URLSearchParams(window.location.search);
    const editIdForInitialStore = urlParamsForInitialStore.get("id");

    if (editIdForInitialStore) {
 
        // renderProductRows(); // Zaten yukarıda çağrılıyor.
        storeInitialFormValues('antrepoForm');
    }
});

async function findVariantId(urunId, paketlemeTipi, paketBoyutu) {
  if (!urunId || !paketlemeTipi || !paketBoyutu) return null;
  try {
    const response = await fetch(`${baseUrl}/api/find-variant?urunId=${urunId}&paketlemeTipi=${encodeURIComponent(paketlemeTipi)}&paketBoyutu=${encodeURIComponent(paketBoyutu)}`);
    if (response.ok) { const data = await response.json(); return data.variantId; }
    return null;
  } catch (error) { console.error("Varyant ID bulma hatası:", error); return null; }
}

function formatExitDescription() {
  const satProformaNo = document.getElementById("modalSatProformaNo")?.value; const satFaturaNo = document.getElementById("modalSatFaturaNo")?.value;
  const musteri = document.getElementById("modalMusteri")?.value; const teslimYeri = document.getElementById("modalTeslimYeri")?.value;
  const nakliyeFirma = document.getElementById("modalNakliyeFirma")?.value; const aracPlaka = document.getElementById("modalAracPlaka")?.value;
  let description = "";
  if (satProformaNo) description += `Proforma: ${satProformaNo}; `; if (satFaturaNo) description += `Fatura: ${satFaturaNo}; `;
  if (musteri) description += `Müşteri: ${musteri}; `; if (teslimYeri) description += `Teslim Yeri: ${teslimYeri}; `;
  if (nakliyeFirma) description += `Nakliye: ${nakliyeFirma}; `; if (aracPlaka) description += `Araç: ${aracPlaka}; `;
  return description.trim() || "Çıkış İşlemi";
}

function populateEkHizmetProductSelect() {
  const selectElement = document.getElementById('modalEkHizmetUrunSelect'); if (!selectElement) return;
  const currentValue = $(selectElement).val(); 
  
  // Önce Select2'yi destroy et, sonra DOM'u güncelle, sonra tekrar başlat.
  try {
    if (typeof $ !== 'undefined' && $.fn.select2 && $(selectElement).data('select2')) {
        $(selectElement).select2('destroy');
    }
  } catch(e) {
    console.warn("Error destroying Select2 for modalEkHizmetUrunSelect before repopulating:", e);
  }
  
  $(selectElement).empty().append(new Option('Ürün seçiniz...', '', true, true));
  
  productRows.forEach((row) => { 
      if(row.urunId && row.urunTanimi) { 
          const optionText = `${row.urunTanimi} (${row.urunKodu || 'Kodsuz'})`; 
          // productRows'daki urunId'yi değer olarak kullanıyoruz.
          const option = new Option(optionText, row.urunId); 
          selectElement.appendChild(option); 
      } 
  });
  
  if (currentValue && Array.from(selectElement.options).some(opt => opt.value === currentValue)) {
      $(selectElement).val(currentValue);
  } else {
      $(selectElement).val(null);
  }
  
  try {
    if (typeof $ !== 'undefined' && $.fn.select2) {
        $(selectElement).select2({ 
            placeholder: 'Ürün seçiniz...', 
            allowClear: true, 
            width: '100%', 
            dropdownParent: $('#ekHizmetModal') // Modal içinde olduğu için dropdownParent önemli
        });
    }
  } catch(e) {
    console.error("Error re-initializing Select2 for modalEkHizmetUrunSelect:", e);
  }
}
