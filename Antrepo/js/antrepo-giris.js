import { baseUrl } from './config.js';

// Global değişkenler
let activeGirisId = null;
let selectedUrunId = null;
let selectedProductRow = null; // Hangi ürün satırının seçildiğini izlemek için

let allSozlesmeler = [];
let allSirketler = [];
let allAntrepolar = [];
let allUrunler = [];
let allParaBirimleri = [];
let allHizmetler = [];
let allBirimler = [];
let ekHizmetlerData = [];

// YENİ: Satır bazlı ürün ekleme için global array
let productRows = [];

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

function updateSozlesmeDatalist(list) {
  updateDatalist(sozlesmeList, list, s => {
    const code = s.sozlesme_kodu && s.sozlesme_kodu.trim() !== "" ? s.sozlesme_kodu : "Kodsuz";
    return `${code} - ${s.sozlesme_adi}`;
  });
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
    console.log(`Varyant verileri yükleniyor, ürün ID: ${urunId}`);
    const response = await fetch(`${baseUrl}/api/urun_varyantlari/details?urunId=${urunId}`);
    
    if (!response.ok) {
      throw new Error(`API yanıt hatası: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("API'den gelen ham veri:", JSON.stringify(data, null, 2)); // Log raw data

    const descriptions = data.map(v => v.description);
    console.log("Map sonrası description'lar:", descriptions); // Log descriptions after map

    const filteredDescriptions = descriptions.filter(Boolean);
    console.log("Filter(Boolean) sonrası description'lar:", filteredDescriptions); // Log after filter

    const uniqueDescriptions = [...new Set(data.map(v => v.description).filter(Boolean))];
    console.log("Set sonrası unique description'lar:", uniqueDescriptions); // Log unique descriptions
    console.log(`${uniqueDescriptions.length} adet benzersiz paketleme tipi bulundu.`);

    const paketlemeTipiSelect = document.getElementById("paketlemeTipi");
    if (!paketlemeTipiSelect) {
      console.warn('Element "paketlemeTipi" bulunamadı.');
      return;
    }
    
    // Select2 için temizleme ve doldurma
    $(paketlemeTipiSelect).empty();
    $(paketlemeTipiSelect).append(new Option('Seçiniz...', '', true, true));
    
    const optionsData = uniqueDescriptions.map(desc => ({
      id: desc,
      text: desc
    }));
    
    // Select2 varsa destroy edip yeniden oluşturalım
    try {
      $(paketlemeTipiSelect).select2('destroy');
    } catch(e) { /* ignore */ }
    
    $(paketlemeTipiSelect).select2({
      placeholder: 'Paketleme Tipi Seçin',
      allowClear: true,
      width: '100%',
      data: optionsData
    });
    
    console.log('Paketleme tipi select2 güncellendi.');
  } catch (error) {
    console.error("loadVariantDataForProduct hata:", error);
    resetPaketlemeTipi();
  }
}

// (İsteğe bağlı) Temizleme fonksiyonu: Paketleme Tipi alanını sıfırlar.
function resetPaketlemeTipi() {
  const select = document.getElementById("paketlemeTipi");
  if (select) {
    select.innerHTML = '<option value="">Seçiniz...</option>';
    try {
      $(select).trigger('change');
    } catch(e){}
  }
}

async function loadPaketBoyutuForProduct(urunId) {
  try {
    const response = await fetch(`${baseUrl}/api/urun_varyantlari/details?urunId=${urunId}`);
    if (!response.ok) {
      throw new Error("Varyant verisi alınamadı");
    }
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
    alert("Paket boyutu verileri yüklenirken hata oluştu: " + error.message);
  }
}

// (İsteğe bağlı) Temizleme fonksiyonu: Paket Boyutu alanını sıfırlar.
function resetPaketBoyutu() {
  const select = document.getElementById("paketBoyutu");
  if (select) {
    select.innerHTML = '<option value="">Seçiniz...</option>';
  }
}

/* Fonksiyon: View modunda tüm form alanlarını devre dışı bırak */
function disableFormFields() {
  document.querySelectorAll("input, select, textarea, button").forEach(el => {
    if (el.id !== "cancelBtn") {
      el.disabled = true;
      
      // Özel olarak ürün birim fiyat için ek kontrol
      if (el.id === "urunBirimFiyat") {
        console.log("urunBirimFiyat alanı devre dışı bırakıldı, değeri:", el.value);
        // Değerin görünür kalmasını sağla
        el.readOnly = true;
      }
    }
  });
}

// Add this function to prevent double-clicks on buttons
function preventDoubleClick(buttonElement, timeout = 2000) {
  if (!buttonElement) return;
  
  buttonElement.addEventListener('click', function() {
    if (this.getAttribute('data-processing') === 'true') {
      console.log('Button already processing, preventing double click');
      return false;
    }
    
    // Set processing flag
    this.setAttribute('data-processing', 'true');
    const originalText = this.textContent;
    this.textContent = 'İşleniyor...';
    this.disabled = true;
    
    // Reset after timeout
    setTimeout(() => {
      this.removeAttribute('data-processing');
      this.textContent = originalText;
      this.disabled = false;
    }, timeout);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  /************************************************************
   * 1) HTML Elemanlarının Seçimi
   ************************************************************/
  const antrepoForm = document.getElementById("antrepoForm");
  const cancelBtn = document.getElementById("cancelBtn");
  const saveBtn = document.getElementById("saveBtn");

  // Sözleşme
  const inputSozlesme = document.getElementById("sozlesmeInput");
  const sozlesmeList = document.getElementById("sozlesmeList");
  const openSozlesmeBtn = document.getElementById("openSozlesmeBtn");
  const clearSozlesmeBtn = document.getElementById("clearSozlesmeBtn");

  // Antrepo Şirketi
  const inputAntrepoSirketi = document.getElementById("antrepoSirketi");
  const antrepoSirketiList = document.getElementById("antrepoSirketiList");
  const clearSirketBtn = document.getElementById("clearSirketBtn");

  // Antrepo
  const inputAntrepoAd = document.getElementById("antrepoAd");
  const antrepoIdList = document.getElementById("antrepoIdList");
  const inputAntrepoKodu = document.getElementById("antrepoKodu");
  const antrepoKoduList = document.getElementById("antrepoKoduList");
  const inputAdres = document.getElementById("adres");
  const inputSehir = document.getElementById("sehir");
  const inputGumruk = document.getElementById("gumruk");

  // Ürün Bilgileri
  const inputUrunTanimi = document.getElementById("urunTanimi");
  const urunTanimiList = document.getElementById("urunTanimiList");
  const inputUrunKodu = document.getElementById("urunKodu");
  const urunKoduList = document.getElementById("urunKoduList");
  // Paketleme Tipi ve Boyutu – artık paketleme_tipi_id kullanılmıyor, bunun yerine "description" gönderilecek
  const inputPaketBoyutu = document.getElementById("paketBoyutu");
  const inputPaketlemeTipi = document.getElementById("paketlemeTipi");
  const inputMiktar = document.getElementById("miktar");
  const inputKapAdeti = document.getElementById("kapAdeti");
  const inputBrutAgirlik = document.getElementById("brutAgirlik");
  const inputNetAgirlik = document.getElementById("netAgirlik");
  const inputAntrepoGirisTarihi = document.getElementById("antrepoGirisTarihi");
  const checkboxIlkGiris = document.getElementById("ilkGiris");

  // Fatura & Depolama
  const inputGondericiSirket = document.getElementById("gondericiSirket");
  const inputAliciSirket = document.getElementById("aliciSirket");
  const inputProformaNo = document.getElementById("proformaNo");
  const inputProformaTarihi = document.getElementById("proformaTarihi");
  const inputTicariFaturaNo = document.getElementById("ticariFaturaNo");
  const inputTicariFaturaTarihi = document.getElementById("ticariFaturaTarihi");
  const inputDepolamaSuresi = document.getElementById("depolamaSuresi");
  const inputFaturaMeblagi = document.getElementById("faturaMeblagi");
  const inputUrunBirimFiyat = document.getElementById("urunBirimFiyat");
  const selectParaBirimi = document.getElementById("paraBirimi");
  const inputFaturaAciklama = document.getElementById("faturaAciklama");

  // Beyanname/Form
  const inputBeyannameFormTarihi = document.getElementById("beyannameFormTarihi");
  const inputBeyannameNo = document.getElementById("beyannameNo");

  // Yeni Giriş / Çıkış Butonları
  const newEntryBtn = document.getElementById("newEntryBtn");
  const newExitBtn = document.getElementById("newExitBtn");

  // EK HİZMETLER (Birinci Modal)
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

  // Yeni Hizmet Ekle / Düzenle (İkinci Modal)
  const newHizmetModal = document.getElementById("newHizmetModal");
  const newHizmetAdiSelect = document.getElementById("newHizmetAdi");
  const newHizmetKodu = document.getElementById("newHizmetKodu");
  const newHizmetTipi = document.getElementById("newHizmetTipi");
  const newHizmetBirim = document.getElementById("newHizmetBirim");
  const newHizmetParaBirimi = document.getElementById("newHizmetParaBirimi");
  const newTemelUcret = document.getElementById("newTemelUcret");
  const newMinUcret = document.getElementById("newMinUcret");
  const newCarpan = document.getElementById("newCarpan");
  const newMesaiUygulansinMi = document.getElementById("newMesaiUygulansinMi");
  const newHizmetAciklama = document.getElementById("newHizmetAciklama");
  const newHizmetDurum = document.getElementById("newHizmetDurum");
  const btnNewHizmetCancel = document.getElementById("btnNewHizmetCancel");
  const btnNewHizmetSave = document.getElementById("btnNewHizmetSave");

  // Hareketler Tablosu
  const hareketTableBody = document.getElementById("giriscikisTableBody");

  // Yeni Giriş Modal Formu
  const newEntryForm = document.getElementById("newEntryForm");
  const entryCancelBtn = document.getElementById("entryCancelBtn");

  // Yeni Çıkış Modal Formu
  const newExitForm = document.getElementById("newExitForm");
  const exitCancelBtn = document.getElementById("exitCancelBtn");

  const addProductRowBtn = document.getElementById("addProductRowBtn");

  // Tarih kısıtlaması
  const today = new Date().toISOString().split('T')[0];
  if (inputAntrepoGirisTarihi) {
    inputAntrepoGirisTarihi.setAttribute('max', today);
  }

  /************************************************************
   * 2) API'den Veri Çekme (Paralel)
   ************************************************************/
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

  // Dropdown ve datalist doldurma fonksiyonları
  function fillAntrepoDatalists() {
    updateDatalist(antrepoIdList, allAntrepolar, a => a.antrepoAdi);
    updateDatalist(antrepoKoduList, allAntrepolar, a => a.antrepoKodu);
  }
  function fillUrunDatalists() {
    // Sadece aktif ve silinmemiş ürünleri filtreleyelim
    const activeProducts = allUrunler.filter(u => u.active !== false && !u.deleted);
    
    // Datalistleri doldur (tamamen silme yerine boşken doldurma)
    if (urunTanimiList) {
      // Önce içeriği temizle, sonra doldur
      urunTanimiList.innerHTML = "";
      activeProducts.forEach(u => {
        const opt = document.createElement("option");
        opt.value = u.name;
        urunTanimiList.appendChild(opt);
      });
    }
    
    if (urunKoduList) {
      // Önce içeriği temizle, sonra doldur
      urunKoduList.innerHTML = "";
      activeProducts.forEach(u => {
        const opt = document.createElement("option");
        opt.value = u.code;
        urunKoduList.appendChild(opt);
      });
    }
    
    console.log(`API'dan ${allUrunler.length} ürün geldi, bunlardan ${activeProducts.length} tanesi aktif`);
  }
  function fillParaBirimDropdown() {
    if (!selectParaBirimi) return;
    selectParaBirimi.innerHTML = '<option value=""></option>';
    allParaBirimleri.forEach(pb => {
      const opt = document.createElement('option');
      opt.value = pb.id.toString();
      opt.textContent = `${pb.para_birimi_adi} (${pb.iso_kodu})`;
      selectParaBirimi.appendChild(opt);
    });
    try {
      $(selectParaBirimi).trigger('change');
    } catch (e) {
      console.log("Select2 henüz başlatılmamış olabilir.");
    }
  }
  function fillSirketDatalist() {
    updateDatalist(antrepoSirketiList, allSirketler, s => s.display_name);
  }
  function populateNewHizmetBirimDropdown() {
    if (!newHizmetBirim) return;
    newHizmetBirim.innerHTML = `<option value="" disabled selected>Seçiniz</option>`;
    allBirimler.forEach(b => {
      const opt = document.createElement("option");
      opt.value = b.id.toString();
      opt.textContent = b.birim_adi;
      newHizmetBirim.appendChild(opt);
    });
  }
  function populateNewHizmetParaBirimi() {
    if (!newHizmetParaBirimi) return;
    newHizmetParaBirimi.innerHTML = `<option value="" disabled selected>Seçiniz</option>`;
    allParaBirimleri.forEach(pb => {
      const opt = document.createElement("option");
      opt.value = pb.id.toString();
      opt.textContent = `${pb.para_birimi_adi} (${pb.iso_kodu})`;
      newHizmetParaBirimi.appendChild(opt);
    });
  }

  // İlk doldurmalar
  updateSozlesmeDatalist(allSozlesmeler);
  fillSirketDatalist();
  fillAntrepoDatalists();
  fillUrunDatalists();
  fillParaBirimDropdown();

  /************************************************************
   * 3) Ek Hizmetler ve Hareketler İşlemleri
   ************************************************************/
  async function fetchHareketler() {
    if (!activeGirisId) return;
    try {
      const data = await fetchData(
        `${baseUrl}/api/antrepo-giris/${activeGirisId}/hareketler`,
        "Hareketler hatası"
      );
      renderHareketler(data);
    } catch (error) {
      console.error("Hareketler çekilirken hata:", error);
    }
  }
  async function fetchEkHizmetler(girisId) {
    return await fetchData(
      `${baseUrl}/api/antrepo-giris/${girisId}/ek-hizmetler`,
      "Ek hizmetler hatası"
    );
  }
  async function deleteHareket(hareketId) {
    try {
      const resp = await fetch(
        `${baseUrl}/api/antrepo-giris/${activeGirisId}/hareketler/${hareketId}`,
        { method: "DELETE" }
      );
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
      const resp = await fetch(
        `${baseUrl}/api/antrepo-giris/${activeGirisId}/ek-hizmetler/${ekHizmetId}`,
        { method: "DELETE" }
      );
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
      
      // İşlem tarihi hücresi
      const tdTarih = document.createElement("td");
      tdTarih.textContent = item.islem_tarihi ? item.islem_tarihi.substring(0, 10) : "";
      tr.appendChild(tdTarih);
      
      // İşlem tipi hücresi
      const tdTip = document.createElement("td");
      tdTip.textContent = item.islem_tipi || "";
      tr.appendChild(tdTip);
      
      // Ürün Adı hücresi
      const tdUrunAdi = document.createElement("td");
      // Doğrudan item.urun_adi kullan
      tdUrunAdi.textContent = item.urun_adi || ""; 
      tr.appendChild(tdUrunAdi);
      
      // Ürün Kodu hücresi  
      const tdUrunKodu = document.createElement("td");
      // Doğrudan item.urun_kodu kullan
      tdUrunKodu.textContent = item.urun_kodu || ""; 
      tr.appendChild(tdUrunKodu);
      
      // Diğer hücreler: miktar, kap adedi, brüt, net, birim, açıklama
      ["miktar", "kap_adeti", "brut_agirlik", "net_agirlik", "birim_adi", "aciklama"].forEach(field => {
        const td = document.createElement("td");
        td.textContent = item[field] || "";
        tr.appendChild(td);
      });
      
      // İşlemler hücresi (Sil butonu)
      const tdOps = document.createElement("td");
      const silBtn = document.createElement("button");
      silBtn.textContent = "Sil";
      silBtn.classList.add("btn-secondary");
      silBtn.addEventListener("click", () => showConfirmModal(item.id, "hareket"));
      tdOps.appendChild(silBtn);
      tr.appendChild(tdOps);
      
      hareketTableBody.appendChild(tr);
    });
  }
  function renderEkHizmetler(list) {
    if (!ekHizmetlerTableBody) return;
    ekHizmetlerTableBody.innerHTML = "";
    
    list.forEach(item => {
      const tr = document.createElement("tr");
      
      // Date cell
      const tdTarih = document.createElement("td");
      tdTarih.textContent = item.ek_hizmet_tarihi ? item.ek_hizmet_tarihi.substring(0, 10) : "";
      tr.appendChild(tdTarih);
      
      // Add product info cell (new)
      const tdUrun = document.createElement("td");
      if (item.applies_to_all) {
        tdUrun.textContent = "Tüm Ürünler";
        tdUrun.classList.add("all-products-cell");
      } else if (item.urun_bilgisi) {
        tdUrun.textContent = item.urun_bilgisi; 
      } else {
        tdUrun.textContent = "-";
      }
      tr.appendChild(tdUrun);
      
      // Other existing cells
      ["hizmet_adi", "adet", "temel_ucret", "carpan", "toplam", "aciklama"].forEach(field => {
        const td = document.createElement("td");
        td.textContent = item[field] || "";
        tr.appendChild(td);
      });
      
      // Operations cell
      const tdOps = document.createElement("td");
      const silBtn = document.createElement("button");
      silBtn.textContent = "Sil";
      silBtn.classList.add("btn-secondary");
      silBtn.addEventListener("click", () => showConfirmModal(item.id, "ekhizmet"));
      tdOps.appendChild(silBtn);
      tr.appendChild(tdOps);
      
      ekHizmetlerTableBody.appendChild(tr);
    });
  }
  let itemToDeleteId = null;
  let deleteType = "";

  function showConfirmModal(id, type) {
    itemToDeleteId = id;
    deleteType = type;
    const confirmModal = document.getElementById("confirmModal");
    confirmModal.style.display = "flex";
  }
  const confirmNoBtn = document.getElementById("confirmNo");
  if (confirmNoBtn) {
    confirmNoBtn.addEventListener("click", () => {
      const confirmModal = document.getElementById("confirmModal");
      if (confirmModal) confirmModal.style.display = "none";
      itemToDeleteId = null;
      deleteType = "";
    });
  }
  document.getElementById("confirmYes")?.addEventListener("click", () => {
    const confirmModal = document.getElementById("confirmModal");
    if (confirmModal) confirmModal.style.display = "none";
    if (deleteType === "hareket" && itemToDeleteId) {
      deleteHareket(itemToDeleteId);
    } else if (deleteType === "ekhizmet" && itemToDeleteId) {
      deleteEkHizmet(itemToDeleteId);
    }
    itemToDeleteId = null;
    deleteType = "";
  });

  /************************************************************
   * 4) Sözleşme ve Antrepo Şirketi Eventleri
   ************************************************************/
  inputSozlesme.addEventListener("input", function () {
    const userInput = inputSozlesme.value.trim();
    if (!userInput) {
      inputAntrepoSirketi.value = "";
      inputAntrepoSirketi.disabled = false;
      clearSirketBtn.disabled = false;
      updateSozlesmeDatalist(allSozlesmeler);
      return;
    }
    let isExactMatch = false, matchedSozlesme = null;
    allSozlesmeler.forEach(s => {
      const code = s.sozlesme_kodu && s.sozlesme_kodu.trim() !== "" ? s.sozlesme_kodu : "Kodsuz";
      const fullText = `${code} - ${s.sozlesme_adi}`;
      if (userInput === fullText) {
        isExactMatch = true;
        matchedSozlesme = s;
      }
    });
    if (isExactMatch && matchedSozlesme && matchedSozlesme.display_name) {
      inputAntrepoSirketi.value = matchedSozlesme.display_name;
      inputAntrepoSirketi.disabled = true;
      clearSirketBtn.disabled = true;
      updateSozlesmeDatalist(
        allSozlesmeler.filter(s => s.display_name && s.display_name.toLowerCase() === matchedSozlesme.display_name.toLowerCase())
      );
    } else {
      inputAntrepoSirketi.value = "";
      inputAntrepoSirketi.disabled = false;
      clearSirketBtn.disabled = false;
      const filtered = allSozlesmeler.filter(s => {
        const kod = s.sozlesme_kodu || "Kodsuz";
        return `${kod} - ${s.sozlesme_adi}`.toLowerCase().includes(userInput.toLowerCase());
      });
      updateSozlesmeDatalist(filtered.length > 0 ? filtered : allSozlesmeler);
    }
  });
  inputAntrepoSirketi.addEventListener("change", () => {
    const val = inputAntrepoSirketi.value.trim().toLowerCase();
    updateSozlesmeDatalist(val ? allSozlesmeler.filter(s => s.display_name && s.display_name.toLowerCase() === val) : allSozlesmeler);
  });
  // Clear butonları (ortak)
  [clearSozlesmeBtn, clearSirketBtn].forEach(btn => {
    btn.addEventListener("click", () => {
      inputSozlesme.value = "";
      inputAntrepoSirketi.value = "";
      inputAntrepoSirketi.disabled = false;
      clearSirketBtn.disabled = false;
      updateSozlesmeDatalist(allSozlesmeler);
      inputSozlesme.focus();
    });
  });
  openSozlesmeBtn.addEventListener("click", () => {
    const userInput = inputSozlesme.value.trim();
    if (!userInput) {
      alert("Sözleşme kodu/adı giriniz!");
      return;
    }
    const splitted = userInput.split(" - ");
    let kod = splitted[0] === "Kodsuz" ? "" : splitted[0];
    const found = allSozlesmeler.find(s => (s.sozlesme_kodu || "").toLowerCase() === kod.toLowerCase());
    if (!found) {
      alert("Sözleşme kodu eşleşmedi!");
      return;
    }
    window.open(`contract-form.html?id=${found.id}`, "_blank");
  });

  /************************************************************
   * 5) Antrepo Adı / Kodu Eventleri
   ************************************************************/
  function handleAntrepoInput(inputValue, isName = true) {
    const lowerVal = inputValue.trim().toLowerCase();
    // Eğer giriş boşsa diğer alanları temizle
    if (!lowerVal) {
      inputAntrepoAd.value = "";
      inputAntrepoKodu.value = "";
      inputAdres.value = "";
      inputSehir.value = "";
      inputGumruk.value = "";
      return;
    }
    // allAntrepolar dizisinde eşleşen antrepoyu bul (Ad veya Koda göre)
    const found = allAntrepolar.find(a =>
      isName ? a.antrepoAdi.toLowerCase() === lowerVal : a.antrepoKodu.toLowerCase() === lowerVal
    );
    // Eğer eşleşme bulunursa ilgili alanları doldur
    if (found) {
      inputAntrepoAd.value = found.antrepoAdi || "";
      inputAntrepoKodu.value = found.antrepoKodu || "";
      inputAdres.value = found.acikAdres || ""; // Dikkat: burada 'acikAdres' kullanılıyor
      inputSehir.value = found.sehir || "";
      inputGumruk.value = found.gumruk || "";
    } else {
      // Eşleşme bulunamazsa alanları temizle (Mevcut mantık bu şekilde)
      // Not: Belki de burada temizlemek yerine kullanıcının girdiği değeri korumak daha iyi olabilir?
      inputAntrepoAd.value = ""; // Kullanıcı adı yazarken eşleşme olmazsa silinebilir
      inputAntrepoKodu.value = "";
      inputAdres.value = "";
      inputSehir.value = "";
      inputGumruk.value = "";
    }
  }
  
  // Olay Dinleyicileri (Satır 599 civarı)
  // Kullanıcı Antrepo Adı veya Kodu alanına yazdıkça (input) veya değeri değiştirdiğinde (change) handleAntrepoInput'u çağırır
  inputAntrepoAd.addEventListener("input", () => handleAntrepoInput(inputAntrepoAd.value, true));
  inputAntrepoKodu.addEventListener("input", () => handleAntrepoInput(inputAntrepoKodu.value, false));
  inputAntrepoAd.addEventListener("change", () => inputAntrepoAd.dispatchEvent(new Event("input")));
  inputAntrepoKodu.addEventListener("change", () => inputAntrepoKodu.dispatchEvent(new Event("input")));

  inputUrunKodu.addEventListener("change", function() {
    // Boş değilse ve datalist'te geçerli bir seçenek seçilmişse
    if (this.value) {
      const urun = allUrunler.find(u => u.code === this.value && u.active !== false && !u.deleted);
      if (urun) {
        inputUrunTanimi.value = urun.name || "";
        selectedUrunId = urun.id;
        
        // Varyant verilerini yükle - biraz gecikme ekleyelim ki DOM güncellensin
        setTimeout(() => {
          loadVariantDataForProduct(selectedUrunId);
          loadPaketBoyutuForProduct(selectedUrunId);
        }, 100);
      }
    }
  });

  // Ürün seçildiğinde varyant verilerini çekip, paketlemeTipi ve paketBoyutu select'lerini doldur
  inputUrunTanimi.addEventListener("change", async function() {
    const urunAdi = this.value.trim();
    if (!urunAdi) {
      resetPaketlemeTipi();
      resetPaketBoyutu();
      return;
    }
    const urun = allUrunler.find(u => u.name === urunAdi);
    if (!urun) {
      resetPaketlemeTipi();
      resetPaketBoyutu();
      return;
    }
    selectedUrunId = urun.id;
    inputUrunKodu.value = urun.code || "";

    // Yeni varyant verilerini çekip, paketlemeTipi alanını doldur
    await loadVariantDataForProduct(selectedUrunId);
    // Yeni: Paket Boyutu select'ini de doldur
    await loadPaketBoyutuForProduct(selectedUrunId);
  });

  // Varyant Ekle butonuna tıklama
  document.getElementById('addVariantBtn')?.addEventListener('click', () => {
    const urunAdi = document.getElementById('urunTanimi')?.value;
    const paketlemeTipiElem = document.getElementById('paketlemeTipi');
    if (!paketlemeTipiElem) {
      alert('Paketleme tipi alanı bulunamadı!');
      return;
    }
    const paketlemeTipiValue = paketlemeTipiElem.value;
    
    if (!urunAdi) {
      alert('Önce ürün seçmelisiniz!');
      return;
    }
    
    const urun = allUrunler.find(u => u.name === urunAdi);
    if (!urun || !urun.id) {
      alert('Geçerli bir ürün seçiniz!');
      return;
    }
    
    let url = `product-form.html?mode=variant&urunId=${urun.id}`;
    if (paketlemeTipiValue) url += `&paketlemeTipi=${encodeURIComponent(paketlemeTipiValue)}`;
    
    window.open(url, '_blank');
  });
  
  // Yenile butonları
  document.getElementById('refreshPaketlemeBtn')?.addEventListener('click', async () => {
    const urunAdi = document.getElementById('urunTanimi')?.value;
    if (!urunAdi) {
      alert('Önce ürün seçmelisiniz!');
      return;
    }
    await refreshPaketlemeTipleri(urunAdi);
  });

  document.getElementById('refreshBoyutBtn')?.addEventListener('click', async () => {
    const urunAdi = document.getElementById('urunTanimi')?.value;
    if (!urunAdi) {
      alert('Önce ürün seçmelisiniz!');
      return;
    }
    await refreshPaketBoyutlari(urunAdi);
  });

  // Yenileme fonksiyonları
  async function refreshPaketlemeTipleri(urunAdi) {
    try {
      const urun = allUrunler.find(u => u.name === urunAdi);
      if (!urun || !urun.id) {
        alert('Geçerli bir ürün seçiniz!');
        return;
      }
      const currentPaketlemeTipi = $('#paketlemeTipi').val();
      
      await loadVariantDataForProduct(urun.id);
      
      if (currentPaketlemeTipi) {
        $('#paketlemeTipi').val(currentPaketlemeTipi).trigger('change');
      }
      
      const btn = document.getElementById('refreshPaketlemeBtn');
      btn.classList.add('success');
      setTimeout(() => btn.classList.remove('success'), 1000);
    } catch (error) {
      console.error('Paketleme tipleri yüklenirken hata:', error);
      alert('Paketleme tipleri yüklenirken bir hata oluştu!');
    }
  }

  async function refreshPaketBoyutlari(urunAdi) {
    try {
      const urun = allUrunler.find(u => u.name === urunAdi);
      if (!urun || !urun.id) {
        alert('Geçerli bir ürün seçiniz!');
        return;
      }
      const currentPaketBoyutu = $('#paketBoyutu').val();
      console.log(`Paket boyutları yenileniyor - ürün ID: ${urun.id}`);
      
      await loadPaketBoyutuForProduct(urun.id);
      
      if (currentPaketBoyutu) {
        $('#paketBoyutu').val(currentPaketBoyutu).trigger('change');
      }
      
      const btn = document.getElementById('refreshBoyutBtn');
      btn.classList.add('success');
      setTimeout(() => btn.classList.remove('success'), 1000);
    } catch (error) {
      console.error('Paket boyutları yüklenirken hata:', error);
      alert('Paket boyutları yüklenirken bir hata oluştu!');
    }
  }

  /************************************************************
   * 7) EK HİZMETLER MODALI İşlemleri
   ************************************************************/
  if (ekHizmetlerBtn) {
    ekHizmetlerBtn.addEventListener("click", () => {
      populateModalHizmetParaBirimi();
      populateModalHizmetSelect(allHizmetler);
      populateEkHizmetProductSelect();
      clearEkHizmetModalFields();
      ekHizmetModal.style.display = "flex";
      ekHizmetModal.classList.add("active");
    });
  }
  function populateModalHizmetParaBirimi() {
    if (!modalHizmetParaBirimi) return;
    modalHizmetParaBirimi.innerHTML = "";
    allParaBirimleri.forEach(pb => {
      const opt = document.createElement("option");
      opt.value = pb.id.toString();
      opt.textContent = `${pb.para_birimi_adi} (${pb.iso_kodu})`;
      modalHizmetParaBirimi.appendChild(opt);
    });
  }
  function populateModalHizmetSelect(hizmetler) {
    if (!modalHizmetSelect) return;
    modalHizmetSelect.innerHTML = `<option value="">Seçiniz...</option>`;
    hizmetler.forEach(h => {
      const opt = document.createElement("option");
      opt.value = h.id;
      opt.textContent = h.hizmet_adi || h.hizmet_tipi;
      modalHizmetSelect.appendChild(opt);
    });
  }
  modalHizmetSelect.addEventListener("change", () => {
    const selectedId = modalHizmetSelect.value;
    if (!selectedId) {
      clearEkHizmetModalFields(false);
      return;
    }
    const found = allHizmetler.find(x => x.id == selectedId);
    if (found) {
      modalHizmetKodu.value = found.hizmet_kodu || "";
      modalUcretModeli.value = found.hizmet_tipi || "";
      modalHizmetBirim.value = found.birim_adi || "";
      if (found.para_birimi_id) {
        modalHizmetParaBirimi.value = String(found.para_birimi_id);
      }
      modalTemelUcret.value = found.temel_ucret || 0;
      modalCarpan.value = found.carpan || 0;
      modalHizmetToplam.value = "";
    }
  });
  [modalTemelUcret, modalCarpan, modalHizmetAdet, modalHizmetParaBirimi].forEach(elem => {
    elem.addEventListener("input", updateEkHizmetToplam);
  });
  function updateEkHizmetToplam() {
    const temel = parseFloat(modalTemelUcret.value) || 0;
    const carp = parseFloat(modalCarpan.value) || 0;
    const adet = parseFloat(modalHizmetAdet.value) || 0;
    modalHizmetToplam.value = ((temel + carp) * adet).toFixed(2);
    const selIdx = modalHizmetParaBirimi.selectedIndex;
    const text = modalHizmetParaBirimi.options[selIdx]?.textContent || "";
    const match = text.match(/\((.*?)\)/);
    if (mirrorInput) mirrorInput.value = match ? match[1] : "";
  }
  btnEkHizmetCancel.addEventListener("click", () => {
    ekHizmetModal.style.display = "none";
    ekHizmetModal.classList.remove("active");
  });

  
  function clearEkHizmetModalFields(clearSelect = true) {
    if (clearSelect && modalHizmetSelect) modalHizmetSelect.value = "";
    if (modalHizmetKodu) modalHizmetKodu.value = "";
    if (modalUcretModeli) modalUcretModeli.value = "";
    if (modalHizmetBirim) modalHizmetBirim.value = "";
    if (modalHizmetParaBirimi) modalHizmetParaBirimi.value = "";
    if (modalTemelUcret) modalTemelUcret.value = "";
    if (modalCarpan) modalCarpan.value = "";
    if (modalHizmetAdet) modalHizmetAdet.value = "";
    if (modalHizmetToplam) modalHizmetToplam.value = "";
    if (modalHizmetAciklama) modalHizmetAciklama.value = "";
    if (mirrorInput) mirrorInput.value = "";
  }

  btnNewHizmet.addEventListener("click", () => {
    if (!newHizmetModal) return;
    newHizmetModal.style.display = "flex";
    newHizmetModal.classList.add("active");
    populateNewHizmetBirimDropdown();
    populateNewHizmetParaBirimi();
    clearNewHizmetForm();
  });

  function clearNewHizmetForm() {
    if (newHizmetAdiSelect) newHizmetAdiSelect.value = "new";
    if (newHizmetKodu) newHizmetKodu.value = "";
    if (newHizmetTipi) newHizmetTipi.value = "";
    if (newHizmetBirim) newHizmetBirim.value = "";
    if (newHizmetParaBirimi) newHizmetParaBirimi.value = "";
    if (newTemelUcret) newTemelUcret.value = "";
    if (newMinUcret) newMinUcret.value = "";
    if (newCarpan) newCarpan.value = "";
    if (newHizmetAciklama) newHizmetAciklama.value = "";
  }
  btnNewHizmetSave.addEventListener("click", async () => {
    const payload = {
      hizmet_adi: newHizmetAdiSelect.value === "new" ? newHizmetAdiSelect.options[newHizmetAdiSelect.selectedIndex].textContent : newHizmetAdiSelect.value,
      hizmet_kodu: newHizmetKodu.value.trim(),
      hizmet_tipi: newHizmetTipi.value,
      birim_id: parseInt(newHizmetBirim.value, 10) || null,
      para_birimi_id: parseInt(newHizmetParaBirimi.value, 10) || null,
      temel_ucret: parseFloat(newTemelUcret.value) || 0,
      min_ucret: parseFloat(newMinUcret.value) || 0,
      carpan: parseFloat(newCarpan.value) || 0,
      aciklama: newHizmetAciklama.value.trim(),
      durum: "Aktif"
    };
    if (!payload.hizmet_adi || !payload.hizmet_kodu || !payload.hizmet_tipi || !payload.birim_id || !payload.para_birimi_id) {
      alert("Lütfen zorunlu alanları doldurun (Hizmet Adı, Kod, Tipi, Birim, Para Birimi)!");
      return;
    }
    try {
      const resp = await fetch(`${baseUrl}/api/hizmetler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await resp.json();
      if (result.success) {
        alert("Hizmet kaydedildi!");
        allHizmetler = await fetchData(`${baseUrl}/api/hizmetler`, "Hizmetler hatası");
        populateModalHizmetSelect(allHizmetler);
        newHizmetModal.style.display = "none";
      } else {
        alert("Hizmet eklenemedi: " + JSON.stringify(result));
      }
    } catch (err) {
      alert("Hata: " + err.message);
      console.error("Yeni hizmet eklenirken hata:", err);
    }
  });
  btnNewHizmetCancel?.addEventListener("click", () => {
    if (newHizmetModal) {
      newHizmetModal.style.display = "none";
      newHizmetModal.classList.remove("active");
      clearNewHizmetForm();
    }
  });

  /************************************************************
   * 8) Form Submit (Antrepo Giriş Kaydet)
   ************************************************************/
  antrepoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Çift gönderimi önlemek için Kaydet butonunu devre dışı bırak
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Kaydediliyor...";
    }
  
    try {
      const chosenDate = inputAntrepoGirisTarihi.value;
      const todayDate = new Date().toISOString().split('T')[0];
      if (chosenDate && chosenDate > todayDate) {
        alert("Antrepo Giriş Tarihi gelecekte olamaz!");
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Kaydet";
        }
        return;
      }
      
      let sozlesmeId = null;
      const sozVal = inputSozlesme.value.trim();
      if (sozVal) {
        const splitted = sozVal.split(" - ");
        let kod = splitted[0] === "Kodsuz" ? "" : splitted[0];
        const foundSoz = allSozlesmeler.find(s => (s.sozlesme_kodu || "").toLowerCase() === kod.toLowerCase());
        if (foundSoz) {
          sozlesmeId = parseInt(foundSoz.id, 10);
        }
      }
      
      let antrepo_id = null;
      const adVal = inputAntrepoAd.value.trim().toLowerCase();
      let foundAntrepo = allAntrepolar.find(a => a.antrepoAdi.toLowerCase() === adVal);
      if (foundAntrepo) {
        antrepo_id = parseInt(foundAntrepo.id, 10);
      } else {
        const kodVal = inputAntrepoKodu.value.trim().toLowerCase();
        foundAntrepo = allAntrepolar.find(a => a.antrepoKodu.toLowerCase() === kodVal);
        if (foundAntrepo) {
          antrepo_id = parseInt(foundAntrepo.id, 10);
        }
      }
      
      const payload = {
        beyanname_form_tarihi: inputBeyannameFormTarihi.value,
        beyanname_no: inputBeyannameNo.value,
        antrepo_sirket_adi: inputAntrepoSirketi.value,
        sozlesme_id: sozlesmeId,
        gumruk: inputGumruk.value,
        antrepo_id: antrepo_id,
        antrepo_kodu: inputAntrepoKodu.value,
        adres: inputAdres.value,
        sehir: inputSehir.value,
        gonderici_sirket: inputGondericiSirket.value,
        alici_sirket: inputAliciSirket.value,
        proforma_no: inputProformaNo.value,
        proforma_tarihi: inputProformaTarihi.value,
        ticari_fatura_no: inputTicariFaturaNo.value,
        ticari_fatura_tarihi: inputTicariFaturaTarihi.value,
        depolama_suresi: inputDepolamaSuresi.value,
        fatura_meblagi: parseFloat(inputFaturaMeblagi.value) || 0,
        urun_birim_fiyat: parseFloat(inputUrunBirimFiyat.value) || 0,
        para_birimi: selectParaBirimi.value,
        fatura_aciklama: inputFaturaAciklama.value,
        ilk_giris: checkboxIlkGiris && checkboxIlkGiris.checked ? true : false,
        // --- Tekil Ürün Alanları Kaldırıldı ---
        // urun_tanimi, urun_kodu, miktar, kap_adeti, agirliklar, antrepo_giris_tarihi,
        // paket_boyutu, description, urun_birim_fiyat, urun_varyant_id
        // --- Tekil Ürün Alanları Kaldırıldı ---
        // Eklenen ürün satırlarını payload'a dahil et
        urunler: productRows.length > 0 ? productRows : null
      };
      
      let method = "POST";
      let finalUrl = `${baseUrl}/api/antrepo-giris`;
      const urlParams = new URLSearchParams(window.location.search);
      const editId = urlParams.get("id");
      if (editId) {
        method = "PUT";
        finalUrl = `${baseUrl}/api/antrepo-giris/${editId}`;
      }
      
      const resp = await fetch(finalUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!resp.ok) {
        throw new Error(`Sunucu hatası: ${resp.status}`);
      }
      
      const result = await resp.json();
      
      if (result.success) {
        alert(editId ? "Antrepo giriş kaydı başarıyla güncellendi" : "Antrepo giriş kaydı başarıyla eklendi");
        window.location.href = "antrepo-giris-form-list.html";
      } else {
        alert(`Kayıt hatası: ${result.message || "Bilinmeyen hata"}`);
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Kaydet";
        }
      }
    } catch (error) {
      console.error("Form gönderimi sırasında hata:", error);
      alert(`Hata: ${error.message}`);
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Kaydet";
      }
    }
  });

  /************************************************************
   * 9) Edit Mode - Mevcut Kaydın Yüklenmesi
   ************************************************************/
  async function loadExistingData(id) {
    try {
      console.log("loadExistingData çağrıldı, id:", id);
      activeGirisId = id;
      
      // API yanıtını doğrudan fetch kullanarak almayı deneyelim
      const response = await fetch(`${baseUrl}/api/antrepo-giris/${id}`);
      
      if (!response.ok) {
        throw new Error(`API yanıt hatası: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("API'den gelen veri:", data);
      
      // Veri kontrolü - ya bir dizi ya da tek bir nesne olabilir
      let formData;
      if (Array.isArray(data)) {
        if (data.length === 0) {
          throw new Error("API boş bir dizi döndürdü, kayıt bulunamadı");
        }
        formData = data[0]; // Dizi ise ilk elemanı al
        console.log("Dizi yanıtı, ilk eleman kullanılıyor:", formData);
      } else if (typeof data === 'object' && data !== null) {
        formData = data; // Nesne ise direkt kullan
        console.log("Nesne yanıtı kullanılıyor");
      } else {
        throw new Error("API beklenmeyen bir veri formatı döndürdü");
      }
      
      if (!formData) {
        throw new Error("Veri yok veya boş");
      }
      
      // Form alanlarını doldur
      console.log("Doldurulan alanlar:", {
        beyanname_form_tarihi: formData.beyanname_form_tarihi,
        beyanname_no: formData.beyanname_no,
        antrepo_adi: formData.antrepo_adi,
        urun_birim_fiyat: formData.urun_birim_fiyat, // Alan adını kontrol etmek için log eklendi
        // diğer alanlar için de loglamayı ekleyebilirsiniz
      });
      
      inputBeyannameFormTarihi.value = formData.beyanname_form_tarihi ? formData.beyanname_form_tarihi.substring(0,10) : "";
      inputBeyannameNo.value = formData.beyanname_no || "";
      inputAntrepoAd.value = formData.antrepo_adi || "";
      inputAntrepoKodu.value = formData.antrepo_kodu || "";
      inputAdres.value = formData.adres || formData.acikAdres || "";
      inputSehir.value = formData.sehir || "";
      inputGumruk.value = formData.gumruk || "";
      
      inputProformaNo.value = formData.proforma_no || "";
      if (formData.proforma_tarihi) inputProformaTarihi.value = formData.proforma_tarihi.substring(0,10);
      inputTicariFaturaNo.value = formData.ticari_fatura_no || "";
      if (formData.ticari_fatura_tarihi) inputTicariFaturaTarihi.value = formData.ticari_fatura_tarihi.substring(0,10);
      inputDepolamaSuresi.value = formData.depolama_suresi || "";
      inputFaturaMeblagi.value = formData.fatura_meblagi || "";
      selectParaBirimi.value = formData.para_birimi || "";
        try { $(selectParaBirimi).trigger('change'); } 
        
        catch(e){}
      
      // Ürün Birim Fiyatı (fatura_meblagi / miktar ile hesaplanabilir)
      if (inputUrunBirimFiyat) {
        if (formData.urun_birim_fiyat !== undefined) {
          inputUrunBirimFiyat.value = formData.urun_birim_fiyat;
        } else if (formData.urun_birim_fiyati !== undefined) {
          inputUrunBirimFiyat.value = formData.urun_birim_fiyati;
        } else if (formData.fatura_meblagi && formData.miktar && parseFloat(formData.miktar) > 0) {
          inputUrunBirimFiyat.value = (parseFloat(formData.fatura_meblagi) / parseFloat(formData.miktar)).toFixed(2);
        } else {
          inputUrunBirimFiyat.value = "";
        }
      }
      
      // Ürün ID'sini bul
      const urun = allUrunler.find(u => u.name === formData.urun_tanimi || u.code === formData.urun_kodu);
      if (urun) {
        selectedUrunId = urun.id;
        console.log(`Ürün bulundu: ${urun.name}, ID: ${urun.id}`);
      } else {
        console.warn("Ürün bulunamadı:", formData.urun_tanimi, formData.urun_kodu);
      }


      // EK: Gönderici ve Alıcı Şirket bilgileri (eksik olan kısım)
      inputGondericiSirket.value = formData.gonderici_sirket || "";
      inputAliciSirket.value = formData.alici_sirket || "";
      
      // Sözleşme ve şirket bilgilerini doldur
      if (formData.sozlesme_id) {
        const foundSoz = allSozlesmeler.find(s => s.id === formData.sozlesme_id);
        if (foundSoz) {
          const code = foundSoz.sozlesme_kodu && foundSoz.sozlesme_kodu.trim() !== "" ? foundSoz.sozlesme_kodu : "Kodsuz";
          inputSozlesme.value = `${code} - ${foundSoz.sozlesme_adi}`;
        }
      }
      if (formData.antrepo_sirket_adi) {
        inputAntrepoSirketi.value = formData.antrepo_sirket_adi;
      }
      
      // Görüntüleme modu kontrolü
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get("mode");
      console.log("Form modu:", mode);
      if (mode === "view") {
        console.log("View modu aktif, form disabled edilecek");
        // Tüm form elemanlarını disable et
        disableFormFields();
        if (saveBtn) {
          saveBtn.style.display = "none";
          console.log("Kaydet butonu gizlendi");
        }
        if (newEntryBtn) newEntryBtn.disabled = true;
        if (newExitBtn) newExitBtn.disabled = true;
        if (ekHizmetlerBtn) ekHizmetlerBtn.disabled = true;
        [newEntryBtn, newExitBtn, ekHizmetlerBtn].forEach(btn => {
          if (btn) btn.classList.add("disabled");
        });
        document.querySelectorAll(".section-header").forEach(header => header.classList.add("view-mode"));
        const pageHeader = document.querySelector(".page-header h1");
        if (pageHeader) {
          pageHeader.textContent = "Antrepo Giriş Formu (Görüntüleme)";
        }
      }

      
      try {
        console.log("Ek Hizmetler yükleniyor...");
        const ekHizmetlerData = await fetchEkHizmetler(activeGirisId);
        renderEkHizmetler(ekHizmetlerData);
        console.log(`${ekHizmetlerData.length} adet ek hizmet yüklendi.`);
      } catch (error) {
        console.error("Ek Hizmetler yüklenirken hata:", error);
      }

      // Ürün satırlarını yükle
      console.log("Ürün satırları verisi:", formData.urunler);
      
      // Ürün satırları için geliştirilmiş kontrol
      if (formData.urunler && Array.isArray(formData.urunler)) {
        if (formData.urunler.length > 0) {
          console.log("Ürün satırları yükleniyor:", formData.urunler.length);
          
          // Farklı API formatlara uyumlu yeni mapping fonksiyonu
          productRows = formData.urunler.map(urun => {
            return {
              rowId: urun.id, // Ürün satırının veritabanı ID'si
              urunId: urun.urun_id || urun.id,
              urunTanimi: urun.urunTanimi || urun.name,
              urunKodu: urun.urunKodu || urun.code,
              gtipNo: urun.gtipNo || urun.gtib_no,
              paketlemeTipi: urun.paketlemeTipi || urun.paketleme_tipi || urun.description,
              paketBoyutu: urun.paketBoyutu || urun.paket_boyutu,
              birimFiyat: urun.birimFiyat || urun.birim_fiyat,
              miktar: urun.miktar,
              kapAdeti: urun.kapAdeti || urun.kap_adeti,
              brutAgirlik: urun.brutAgirlik || urun.brut_agirlik,
              netAgirlik: urun.netAgirlik || urun.net_agirlik,
              antrepoGirisTarihi: urun.antrepoGirisTarihi || 
                (urun.created_at ? urun.created_at.substring(0, 10) : null)
            };
          });
          
          // Ek güvenlik kontrolü: herhangi bir maplenmiş satır "undefined" içeriyorsa düzeltme yap
          productRows = productRows.map(row => {
            return Object.fromEntries(
              Object.entries(row).map(([key, value]) => [key, value || ""])
            );
          });
          
          console.log("Ürün satırları yüklendi:", productRows);
        } else {
          console.log("API'den boş ürün satırları geldi");
          productRows = [];
        }
      } else if (formData.urunler === null || formData.urunler === undefined) {
        // Form yeni ürün satırları içermiyor olabilir, ürünleri doğrudan kendi formatında kullanabiliriz
        try {
          // Alternatif olarak formData'nın kendisi ürün bilgisi içeriyorsa
          if (formData.urun_id || formData.id) {
            console.log("Ana form verisini ürün satırı olarak kullanma denemesi");
            productRows = [{
              urunId: formData.urun_id || formData.id,
              urunTanimi: formData.urun_tanimi || formData.name,
              urunKodu: formData.urun_kodu || formData.code,
              gtipNo: formData.gtib_no,
              paketlemeTipi: formData.paketleme_tipi || formData.description,
              paketBoyutu: formData.paket_boyutu,
              birimFiyat: formData.urun_birim_fiyat || formData.birim_fiyat,
              miktar: formData.miktar,
              kapAdeti: formData.kap_adeti,
              brutAgirlik: formData.brut_agirlik,
              netAgirlik: formData.net_agirlik,
              antrepoGirisTarihi: formData.antrepo_giris_tarihi ? 
                formData.antrepo_giris_tarihi.substring(0, 10) : null
            }];
          } else {
            console.log("Ürün bilgisi bulunamadı, boş dizi kullanılıyor");
            productRows = [];
          }
        } catch (mappingError) {
          console.error("Ürün veri dönüştürme hatası:", mappingError);
          productRows = [];
        }
      } else {
        console.warn("Beklenmeyen ürün veri formatı:", formData.urunler);
        productRows = [];
      }
      
      // Tüm işlemlerden sonra daima render et - boş olsa bile
      renderProductRows();

      // console.log("Form başarıyla dolduruldu, urun_birim_fiyat kontrolü:",
      //          {element: inputUrunBirimFiyat, value: inputUrunBirimFiyat?.value}); // Bu log artık gereksiz

    } catch (error) {
      console.error("Kayıt yükleme hatası:", error);
      alert("Kayıt yüklenirken bir hata oluştu! Detay: " + error.message);
    }
  }

  /************************************************************
   * 10) Yeni Giriş / Çıkış Modal Açma
   ************************************************************/
  if (newEntryBtn) {
    newEntryBtn.addEventListener("click", () => {
      if (!activeGirisId) {
        alert("Önce antrepo giriş formunu kaydetmelisiniz!");
        return;
      }
      const newEntryModal = document.getElementById("newEntryModal");
      newEntryForm.reset();
      
      // Modal açılırken ürün listesini doldur
      populateModalProductSelect('modalEntryUrunSelect', 'modalEntryUrunKodu');
      
      newEntryModal.style.display = "flex";
    });
  }
  
  if (newExitBtn) {
    newExitBtn.addEventListener("click", () => {
      if (!activeGirisId) {
        alert("Önce antrepo giriş formunu kaydetmelisiniz!");
        return;
      }
      const newExitModal = document.getElementById("newExitModal");
      newExitForm.reset();
      
      // Modal açılırken ürün listesini doldur
      populateModalProductSelect('modalExitUrunSelect', 'modalExitUrunKodu');
      
      newExitModal.style.display = "flex";
    });
  }
  
  // Modal içindeki ürün select2'leri için popülasyon fonksiyonu
  function populateModalProductSelect(selectId, codeFieldId) {
    const selectElement = document.getElementById(selectId);
    const codeField = document.getElementById(codeFieldId);
    
    if (!selectElement) return;
    
    // Mevcut seçenekleri temizle
    selectElement.innerHTML = '<option value="">Ürün seçiniz...</option>';
    
    // productRows'dan gelen verilerle doldur
    productRows.forEach((row, index) => {
      const option = document.createElement('option');
      option.value = index; // Dizideki index'i value olarak kullan
      option.textContent = row.urunTanimi;
      option.dataset.urunId = row.urunId; // Add urunId to dataset for easy access
      option.dataset.urunKodu = row.urunKodu;
      option.dataset.paketlemeTipi = row.paketlemeTipi;
      option.dataset.paketBoyutu = row.paketBoyutu;
      option.dataset.miktar = row.miktar;
      option.dataset.kapAdeti = row.kapAdeti;
      option.dataset.brutAgirlik = row.brutAgirlik;
      option.dataset.netAgirlik = row.netAgirlik;
      selectElement.appendChild(option);
    });
    
    // Select2 olarak initialize et
    try {
      $(selectElement).select2({
        placeholder: 'Ürün seçiniz...',
        allowClear: true,
        width: '100%'
      });
      
      // Ürün seçildiğinde kod alanını doldur ve diğer bilgileri pre-populate et
      $(selectElement).on('change', function() {
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        
        if (selectElement.value && selectedOption) {
          // Ürün kodu alanını doldur
          if (codeField) codeField.value = selectedOption.dataset.urunKodu || '';
          
          // Diğer form alanlarını da pre-populate et
          if (selectId === 'modalEntryUrunSelect') {
            if (document.getElementById('modalMiktar')) 
              document.getElementById('modalMiktar').value = selectedOption.dataset.miktar || '';
            if (document.getElementById('modalKapAdeti')) 
              document.getElementById('modalKapAdeti').value = selectedOption.dataset.kapAdeti || '';
            if (document.getElementById('modalBrutAgirlik')) 
              document.getElementById('modalBrutAgirlik').value = selectedOption.dataset.brutAgirlik || '';
            if (document.getElementById('modalNetAgirlik')) 
              document.getElementById('modalNetAgirlik').value = selectedOption.dataset.netAgirlik || '';
          } else if (selectId === 'modalExitUrunSelect') {
            if (document.getElementById('modalExitMiktar')) 
              document.getElementById('modalExitMiktar').value = selectedOption.dataset.miktar || '';
            if (document.getElementById('modalExitKapAdeti')) 
              document.getElementById('modalExitKapAdeti').value = selectedOption.dataset.kapAdeti || '';
            if (document.getElementById('modalExitBrutAgirlik')) 
              document.getElementById('modalExitBrutAgirlik').value = selectedOption.dataset.brutAgirlik || '';
            if (document.getElementById('modalExitNetAgirlik')) 
              document.getElementById('modalExitNetAgirlik').value = selectedOption.dataset.netAgirlik || '';
          }
        } else {
          // Seçim temizlendiğinde form alanlarını da temizle
          if (codeField) codeField.value = '';
        }
      });
      
    } catch (e) {
      console.error('Select2 initialization error:', e);
    }
  }
  
  if (newEntryForm) {
    newEntryForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      // Flag to track if submission is in progress
      const submitButton = document.getElementById("newEntrySubmitBtn");
      if (submitButton && submitButton.getAttribute('data-processing') === 'true') {
        console.log('Form submission already in progress');
        return false;
      }
      
      // Disable submit button to prevent double submissions
      if (submitButton) {
        submitButton.setAttribute('data-processing', 'true');
        submitButton.textContent = "İşleniyor...";
        submitButton.disabled = true;
      }
      
      try {
        const entryTarih = document.getElementById("modalAntrepoGirisTarihi")?.value;
        const entryMiktar = document.getElementById("modalMiktar")?.value;
        if (!entryTarih || !entryMiktar) {
          alert("Lütfen tarih ve miktar alanlarını doldurun!");
          return;
        }
        
        // Seçilen ürün bilgilerini al
        const urunSelect = document.getElementById("modalEntryUrunSelect");
        const selectedIndex = urunSelect.value;
        let selectedProduct = null;
        let selectedProductId = null;
        
        if (selectedIndex !== "" && productRows[selectedIndex]) {
          selectedProduct = productRows[selectedIndex];
          selectedProductId = selectedProduct.urunId; // Get the actual product ID
          console.log("Selected product:", selectedProduct);
        }
        
        // Check for duplicate submission
        // Add a short time window (e.g., 5 seconds) to prevent accidental duplicates
        const duplicateCheckSql = `
          SELECT id FROM antrepo_hareketleri
          WHERE antrepo_giris_id = ?
            AND islem_tipi = 'Giriş'
            AND miktar = ?
            AND islem_tarihi = ?
            AND created_at > DATE_SUB(NOW(), INTERVAL 5 SECOND)
        `;
        
        // Create payload with necessary fields
        const hareketPayload = {
          islem_tarihi: entryTarih,
          islem_tipi: "Giriş",
          miktar: parseFloat(entryMiktar) || 0,
          brut_agirlik: parseFloat(document.getElementById("modalBrutAgirlik")?.value) || 0,
          net_agirlik: parseFloat(document.getElementById("modalNetAgirlik")?.value) || 0,
          kap_adeti: parseInt(document.getElementById("modalKapAdeti")?.value) || 0,
          aciklama: document.getElementById("modalAciklama")?.value || "Yeni Giriş",
          description: selectedProduct ? selectedProduct.paketlemeTipi : null,
          urun_varyant_id: selectedProduct ? findVariantId(selectedProduct.urunId, 
                                                          selectedProduct.paketlemeTipi, 
                                                          selectedProduct.paketBoyutu) : null,
          urun_id: selectedProductId
        };
        // Paket hacmini ekle
        hareketPayload.paket_hacmi = selectedProduct ? selectedProduct.paketBoyutu : null;
        console.log("Sending entry payload:", hareketPayload);
        
        const resp = await fetch(`${baseUrl}/api/antrepo-giris/${activeGirisId}/hareketler`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(hareketPayload)
        });
        
        const result = await resp.json();
        if (result.success) {
          alert("Yeni giriş eklendi!");
          document.getElementById("newEntryModal").style.display = "none";
          newEntryForm.reset();
          await fetchHareketler();
        } else {
          alert("Yeni giriş eklenemedi: " + JSON.stringify(result));
        }
      } catch (error) {
        console.error("Yeni giriş eklenirken hata:", error);
        alert("Hata: " + error.message);
      } finally {
        // Reset form submission status
        if (submitButton) {
          setTimeout(() => {
            submitButton.removeAttribute('data-processing');
            submitButton.textContent = "Kaydet";
            submitButton.disabled = false;
          }, 1000);
        }
      }
    });
  }
  
  if (newExitForm) {
    newExitForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      // Check if submission is already in progress
      const submitButton = document.getElementById("newExitSubmitBtn");
      if (submitButton && submitButton.getAttribute('data-processing') === 'true') {
        console.log('Exit form submission already in progress');
        return false;
      }
      
      // Disable button to prevent double submissions
      if (submitButton) {
        submitButton.setAttribute('data-processing', 'true');
        submitButton.textContent = "İşleniyor...";
        submitButton.disabled = true;
      }
      
      try {
        const exitTarih = document.getElementById("modalExitTarih")?.value;
        const exitMiktar = document.getElementById("modalExitMiktar")?.value;
      
        if (!exitTarih || !exitMiktar) {
          alert("Lütfen tarih ve miktar alanlarını doldurun!");
          return;
        }
        
        // Seçilen ürün bilgilerini al
        const urunSelect = document.getElementById("modalExitUrunSelect");
        const selectedIndex = urunSelect.value;
        let selectedProduct = null;
        let selectedProductId = null;
        
        if (selectedIndex !== "" && productRows[selectedIndex]) {
          selectedProduct = productRows[selectedIndex];
          selectedProductId = selectedProduct.urunId;
        }
        
        // Create exit payload with all required fields
        const exitPayload = {
          islem_tarihi: exitTarih,
          islem_tipi: "Çıkış",
          miktar: parseFloat(exitMiktar) || 0,
          kap_adeti: parseInt(document.getElementById("modalExitKapAdeti")?.value) || 0,
          brut_agirlik: parseFloat(document.getElementById("modalExitBrutAgirlik")?.value) || 0,
          net_agirlik: parseFloat(document.getElementById("modalExitNetAgirlik")?.value) || 0,
          aciklama: formatExitDescription(),
          description: selectedProduct ? selectedProduct.paketlemeTipi : null,
          urun_varyant_id: selectedProduct ? findVariantId(selectedProduct.urunId, 
                                                         selectedProduct.paketlemeTipi, 
                                                         selectedProduct.paketBoyutu) : null,
          urun_id: selectedProductId
        };        
        exitPayload.paket_hacmi = selectedProduct ? selectedProduct.paketBoyutu : null;
        
        console.log("Sending exit payload:", exitPayload);
        
        const resp = await fetch(`${baseUrl}/api/antrepo-giris/${activeGirisId}/hareketler`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(exitPayload)
        });
        
        const result = await resp.json();
        if (result.success) {
          alert("Yeni çıkış eklendi!");
          document.getElementById("newExitModal").style.display = "none";
          newExitForm.reset();
          await fetchHareketler();
        } else {
          alert("Yeni çıkış eklenemedi: " + JSON.stringify(result));
        }
      } catch (error) {
        console.error("Yeni çıkış eklenirken hata:", error);
        alert("Hata: " + error.message);
      } finally {
        // Reset form submission status
        if (submitButton) {
          setTimeout(() => {
            submitButton.removeAttribute('data-processing');
            submitButton.textContent = "Kaydet";
            submitButton.disabled = false;
          }, 1000);
        }
      }
    });
  }

  /************************************************************
   * 10) Yeni Giriş / Çıkış Modal Açma
   ************************************************************/
  if (newEntryBtn) {
    newEntryBtn.addEventListener("click", () => {
      if (!activeGirisId) {
        alert("Önce antrepo giriş formunu kaydetmelisiniz!");
        return;
      }
      const newEntryModal = document.getElementById("newEntryModal");
      newEntryForm.reset();
      newEntryModal.style.display = "flex";
    });
  }
  if (newExitBtn) {
    newExitBtn.addEventListener("click", () => {
      if (!activeGirisId) {
        alert("Önce antrepo giriş formunu kaydetmelisiniz!");
        return;
      }
      const newExitModal = document.getElementById("newExitModal");
      newExitForm.reset();
      newExitModal.style.display = "flex";
    });
  }
  if (entryCancelBtn) {
    entryCancelBtn.addEventListener("click", () => {
      document.getElementById("newEntryModal").style.display = "none";
      newEntryForm.reset();
    });
  }
  
  if (exitCancelBtn) {
    exitCancelBtn.addEventListener("click", () => {
      document.getElementById("newExitModal").style.display = "none";
      newExitForm.reset();
    });
  }

  function renderProductRows() {
    try {
      const productTableBody = document.getElementById("productRowsTableBody");
      if (!productTableBody) {
        console.error("HATA: 'productRowsTableBody' ID'li element bulunamadı!");
        return false;
      }
      
      // Reset table body
      productTableBody.innerHTML = '';
      
      // If no products, show empty message
      if (productRows.length === 0) {
        productTableBody.innerHTML = '<tr><td colspan="12" class="text-center">Henüz ürün eklenmemiş.</td></tr>';
        return true;
      }
      
      // Log all product rows
      console.log("Rendering product rows:", productRows);
      
      // Create rows for each product
      productRows.forEach((row, index) => {
        console.log(`${index+1}. satır render ediliyor:`, row);
        
        const tr = document.createElement("tr");
        
        // Define the fields we want to display in order
        const fields = [
          "urunTanimi", "urunKodu", "gtipNo", "paketlemeTipi", "paketBoyutu", 
          "birimFiyat", "miktar", "kapAdeti", "brutAgirlik", "netAgirlik", "antrepoGirisTarihi"
        ];
        
        // Create a cell for each field
        fields.forEach(field => {
          const td = document.createElement("td");
          // Handle different data types appropriately
          const value = row[field];
          
          if (value === null || value === undefined) {
            td.textContent = ""; // Empty for null/undefined
          } else if (field === "birimFiyat" && !isNaN(parseFloat(value))) {
            // Format currency values
            td.textContent = parseFloat(value).toFixed(2);
          } else if ((field === "brutAgirlik" || field === "netAgirlik") && !isNaN(parseFloat(value))) {
            // Format weight values
            td.textContent = parseFloat(value).toFixed(2);
          } else if (field === "antrepoGirisTarihi" && value) {
            // Format date values
            td.textContent = value;
          } else {
            // Default handling
            td.textContent = value.toString();
          }
          
          tr.appendChild(td);
        });
        
        // Add actions column
        const actionsCell = document.createElement("td");
        actionsCell.className = "actions";
        
        // Düzenle butonu ekleme
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "btn btn-sm btn-outline-primary edit-row me-2";
        editBtn.setAttribute("data-index", index);
        editBtn.innerHTML = '<i class="fa fa-edit"></i>';
        editBtn.title = "Düzenle";
        actionsCell.appendChild(editBtn);
        
        // Sil butonu ekleme
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn btn-sm btn-outline-danger remove-row";
        deleteBtn.setAttribute("data-index", index);
        deleteBtn.innerHTML = '<i class="fa fa-trash"></i>';
        deleteBtn.title = "Sil";
        actionsCell.appendChild(deleteBtn);
        
        tr.appendChild(actionsCell);
        
        // Add row to table
        productTableBody.appendChild(tr);
        
        // Add click event for remove button
        deleteBtn.addEventListener("click", function(e) {
          e.preventDefault();
          const rowIndex = this.getAttribute("data-index");
          if (confirm(`#${parseInt(rowIndex)+1} numaralı ürün satırını silmek istediğinize emin misiniz?`)) {
            removeProductRow(rowIndex);
          }
        });
        
        // Add click event for edit button
        editBtn.addEventListener("click", function(e) {
          e.preventDefault();
          const rowIndex = this.getAttribute("data-index");
          editProductRow(rowIndex);
        });
      });
      
      return true;
    } catch (error) {
      console.error("renderProductRows error:", error);
      return false;
    }
  }

  function editProductRow(index) {
    try {
      selectedProductRow = index;
      const row = productRows[index];
      
      // Düzenleme modalını aç - Hataya karşı korumalı yaklaşım
      const editModal = document.getElementById("editProductModal");
      if (!editModal) {
        console.error("Edit modal not found! Sayfanızda #editProductModal ID'sine sahip bir modal bulunamadı.");
        
        // Kullanıcıya mesaj göster ve seçimi temizle
        alert("Düzenleme formu yüklenemedi. Lütfen sayfayı yenileyip tekrar deneyin.");
        selectedProductRow = null;
        return;
      }
      
      // Form elemanlarını doldur
      populateEditForm(row);
      
      // Modalı göster
      editModal.style.display = "flex";
    } catch (error) {
      console.error("Düzenleme modalı açılırken hata:", error);
      alert("Düzenleme formu açılırken bir hata oluştu.");
      selectedProductRow = null;
    }
  }
  
  // Yeni: Düzenleme formunu doldurma fonksiyonu
  function populateEditForm(productData) {
    // Ürün bilgilerini bul ve select2'yi ayarla
    const productSelect = document.getElementById("editProductSelect");
    if (productSelect) {
      // Ürünleri doldur
      productSelect.innerHTML = '<option value="">Seçiniz...</option>';
      allUrunler.forEach(urun => {
        if (urun.active !== false && !urun.deleted) {
          const option = document.createElement("option");
          option.value = urun.id;
          option.textContent = urun.name;
          option.selected = (urun.id == productData.urunId);
          productSelect.appendChild(option);
        }
      });
      
      try {
        $(productSelect).select2({
          placeholder: 'Ürün seçiniz...',
          width: '100%'
        });
        
        // Manuel olarak seçimi ayarla
        $(productSelect).val(productData.urunId).trigger('change');
      } catch(e) {
        console.error("Select2 initialization error:", e);
      }
    }
    
    // Ürün kodunu ayarla
    const urunKoduInput = document.getElementById("editUrunKodu");
    if (urunKoduInput) {
      urunKoduInput.value = productData.urunKodu || '';
    }
    
    // GTIP No
    const gtipNoInput = document.getElementById("editGtipNo");
    if (gtipNoInput) {
      gtipNoInput.value = productData.gtipNo || '';
    }
    
    // Paketleme Tipi - select2
    loadEditVariantDataForProduct(productData.urunId, productData.paketlemeTipi);
    
    // Paket Boyutu - select
    loadEditPaketBoyutuForProduct(productData.urunId, productData.paketBoyutu);
    
    // Diğer alanları doldur
    document.getElementById("editBirimFiyat").value = productData.birimFiyat || '';
    document.getElementById("editMiktar").value = productData.miktar || '';
    document.getElementById("editKapAdeti").value = productData.kapAdeti || '';
    document.getElementById("editBrutAgirlik").value = productData.brutAgirlik || '';
    document.getElementById("editNetAgirlik").value = productData.netAgirlik || '';
    document.getElementById("editAntrepoGirisTarihi").value = productData.antrepoGirisTarihi || '';
  }
  
  // Yeni: Varyant verilerini düzenleme formu için yükleme
  // Yeni: Varyant verilerini düzenleme formu için yükleme - Select2 hatası düzeltildi
async function loadEditVariantDataForProduct(urunId, selectedValue) {
  if (!urunId) {
    console.warn('Ürün ID değeri bulunamadı. Varyant verileri yüklenemedi.');
    const select = document.getElementById("editPaketlemeTipi");
    if (select) {
      select.innerHTML = '<option value="">Seçiniz...</option>';
      // Select2 kontrol etmeden önce initialized olup olmadığını kontrol et
      if ($.fn.select2 && $(select).hasClass("select2-hidden-accessible")) {
        try {
          $(select).select2('destroy');
        } catch(e) { /* ignore */ }
      }
      try {
        $(select).select2({
          placeholder: 'Paketleme Tipi Seçin',
          width: '100%'
        });
      } catch(e) { console.warn("Select2 initialization error:", e); }
    }
    return;
  }
  
  try {
    console.log(`Edit modal için varyant verileri yükleniyor, ürün ID: ${urunId}`);
    const response = await fetch(`${baseUrl}/api/urun_varyantlari/details?urunId=${urunId}`);
    
    if (!response.ok) {
      throw new Error(`API yanıt hatası: ${response.status}`);
    }
    
    const data = await response.json();
    const uniqueDescriptions = [...new Set(data.map(v => v.description).filter(Boolean))];
    
    console.log(`${uniqueDescriptions.length} adet benzersiz paketleme tipi bulundu.`);

    const select = document.getElementById("editPaketlemeTipi");
    if (!select) {
      console.warn('Element "editPaketlemeTipi" bulunamadı.');
      return;
    }
    
    // Önce destroy kontrolü yap
    if ($.fn.select2 && $(select).hasClass("select2-hidden-accessible")) {
      try {
        $(select).select2('destroy');
      } catch(e) { 
        console.warn("Select2 destroy error:", e); 
      }
    }
    
    // Sonra HTML içeriğini temizle
    $(select).empty();
    $(select).append(new Option('Seçiniz...', '', true, true));
    
    const optionsData = uniqueDescriptions.map(desc => ({
      id: desc,
      text: desc
    }));
    
    // Şimdi yeni Select2 instance oluştur
    $(select).select2({
      placeholder: 'Paketleme Tipi Seçin',
      allowClear: true,
      width: '100%',
      data: optionsData
    });
    
    // Seçimi ayarla
    if (selectedValue) {
      setTimeout(() => {
        try {
          const newOption = new Option(selectedValue, selectedValue, true, true);
          $(select).append(newOption).trigger('change');
        } catch(e) {
          console.error("Select2 selection error:", e);
        }
      }, 100);
    }
    
    console.log('Paketleme tipi select2 güncellendi.');
  } catch (error) {
    console.error("loadEditVariantDataForProduct hata:", error);
  }
}
  
  // Yeni: Paket boyutu verilerini düzenleme formu için yükleme
  async function loadEditPaketBoyutuForProduct(urunId, selectedValue) {
    try {
      const response = await fetch(`${baseUrl}/api/urun_varyantlari/details?urunId=${urunId}`);
      if (!response.ok) {
        throw new Error("Varyant verisi alınamadı");
      }
      const data = await response.json();
      const uniqueSizes = [...new Set(data.map(v => v.paket_hacmi).filter(Boolean))];
  
      const select = document.getElementById("editPaketBoyutu");
      if (!select) {
        console.warn('Element "editPaketBoyutu" bulunamadı.');
        return;
      }
      select.innerHTML = '<option value="">Seçiniz...</option>';
      uniqueSizes.forEach(size => {
        const opt = document.createElement("option");
        opt.value = size;
        opt.textContent = size + " Kg";
        if (size == selectedValue) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
    } catch (error) {
      console.error("loadEditPaketBoyutuForProduct hata:", error);
    }
  }
  
  // Yeni: Ürün değişimini dinleme
  document.addEventListener("DOMContentLoaded", function() {
    const editProductSelect = document.getElementById("editProductSelect");
    if (editProductSelect) {
      $(editProductSelect).on('change', function() {
        const urunId = $(this).val();
        if (urunId) {
          // Seçilen ürüne ait varyant ve paket boyutlarını yükle
          loadEditVariantDataForProduct(urunId);
          loadEditPaketBoyutuForProduct(urunId);
          
          // Ürün kodunu güncelle
          const urun = allUrunler.find(u => u.id == urunId);
          if (urun && document.getElementById("editUrunKodu")) {
            document.getElementById("editUrunKodu").value = urun.code || '';
          }
        } else {
          // Seçim temizlendiğinde alanları sıfırla
          if (document.getElementById("editUrunKodu")) {
            document.getElementById("editUrunKodu").value = '';
          }
          
          const paketlemeTipiSelect = document.getElementById("editPaketlemeTipi");
          if (paketlemeTipiSelect) {
            $(paketlemeTipiSelect).empty().append(new Option('Seçiniz...', '', true, true));
            try {
              $(paketlemeTipiSelect).trigger('change');
            } catch(e) {}
          }
          
          const paketBoyutuSelect = document.getElementById("editPaketBoyutu");
          if (paketBoyutuSelect) {
            paketBoyutuSelect.innerHTML = '<option value="">Seçiniz...</option>';
          }
        }
      });
    }
    
    
    const saveEditBtn = document.getElementById("saveEditProductBtn");
    if (saveEditBtn) {
      saveEditBtn.addEventListener("click", function() {
        saveProductEdit();
      });
    }
    
    // Düzenleme modalını kapatma
    const closeEditBtn = document.getElementById("closeEditProductBtn");
    if (closeEditBtn) {
      closeEditBtn.addEventListener("click", function() {
        document.getElementById("editProductModal").style.display = "none";
      });
    }
    
    // Footer'daki iptal butonu için yeni event listener
    const cancelEditBtn = document.getElementById("cancelEditProductBtn");
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener("click", function() {
        document.getElementById("editProductModal").style.display = "none";
      });
    }
  });
  
  // Yeni: Düzenlenen ürünü kaydetme
  function saveProductEdit() {
    if (selectedProductRow === null) {
      alert("Düzenlenecek ürün bulunamadı!");
      return;
    }
    
    const urunId = document.getElementById("editProductSelect").value;
    if (!urunId) {
      alert("Lütfen bir ürün seçin!");
      return;
    }
    
    const urun = allUrunler.find(u => u.id == urunId);
    if (!urun) {
      alert("Seçilen ürün bulunamadı!");
      return;
    }
    
    // Tüm form değerlerini al
    const paketlemeTipi = document.getElementById("editPaketlemeTipi").value;
    const paketBoyutu = document.getElementById("editPaketBoyutu").value;
    const gtipNo = document.getElementById("editGtipNo").value;
    const birimFiyat = document.getElementById("editBirimFiyat").value;
    const miktar = document.getElementById("editMiktar").value;
    const kapAdeti = document.getElementById("editKapAdeti").value;
    const brutAgirlik = document.getElementById("editBrutAgirlik").value;
    const netAgirlik = document.getElementById("editNetAgirlik").value;
    const antrepoGirisTarihi = document.getElementById("editAntrepoGirisTarihi").value;
    
    // productRows dizisindeki ilgili öğeyi güncelle
    productRows[selectedProductRow] = {
      urunId: urunId,
      urunTanimi: urun.name,
      urunKodu: urun.code,
      gtipNo: gtipNo,
      paketlemeTipi: paketlemeTipi,
      paketBoyutu: paketBoyutu,
      birimFiyat: birimFiyat,
      miktar: miktar,
      kapAdeti: kapAdeti,
      brutAgirlik: brutAgirlik,
      netAgirlik: netAgirlik,
      antrepoGirisTarihi: antrepoGirisTarihi
    };
    
    // Tabloyu yeniden render et
    renderProductRows();
    
    // Modalı kapat
    document.getElementById("editProductModal").style.display = "none";
    
    // Global değişkeni sıfırla
    selectedProductRow = null;
  }

  /************************************************************
   * 13) URL Parametrelerini Kontrol Et ve Edit Mode İşlemi
   ************************************************************/
  // URL'den id parametresini al
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get("id");
  const mode = urlParams.get("mode");
  
  console.log("Form yükleme parametreleri:", { editId, mode });
  
  if (editId) {
    try {
      console.log(`ID: ${editId} ile kayıt yükleniyor...`);
      await loadExistingData(editId);
      console.log("Kayıt başarıyla yüklendi");
      
      // Hareketleri ve ek hizmetleri yükle
      await fetchHareketler();
      const ekHizmetlerData = await fetchEkHizmetler(editId);
      renderEkHizmetler(ekHizmetlerData);
    } catch (error) {
      console.error("Kayıt yükleme hatası:", error);
      alert(`Kayıt yüklenirken hata oluştu: ${error.message}`);
    }
  } else {
    console.log("Yeni kayıt modu - boş form gösteriliyor");
  }
});

btnEkHizmetSave.addEventListener("click", async () => {
  const tarihVal = inputEkHizmetTarih.value.trim();
  if (!tarihVal) {
    alert("Tarih zorunludur!");
    return;
  }
  
  const appliesAllCheckbox = document.getElementById("modalEkHizmetAppliesAll");
  const urunSelect = document.getElementById("modalEkHizmetUrunSelect");
  
  // Check if a product is selected when "applies to all" is not checked
  if (!appliesAllCheckbox.checked && !urunSelect.value) {
    alert("Lütfen bir ürün seçin veya 'Tüm ürünleri etkileyen hizmet' seçeneğini işaretleyin!");
    return;
  }
  
  const ekHizmetObj = {
    // Existing fields
    hizmet_id: modalHizmetSelect.value,
    hizmet_adi: modalHizmetSelect.options[modalHizmetSelect.selectedIndex].textContent,
    hizmet_kodu: modalHizmetKodu.value,
    ucret_modeli: modalUcretModeli.value,
    birim: modalHizmetBirim.value,
    para_birimi_id: modalHizmetParaBirimi.value,
    temel_ucret: parseFloat(modalTemelUcret.value) || 0,
    carpan: parseFloat(modalCarpan.value) || 0,
    adet: parseFloat(modalHizmetAdet.value) || 0,
    toplam: parseFloat(modalHizmetToplam.value) || 0,
    aciklama: modalHizmetAciklama.value.trim(),
    ek_hizmet_tarihi: tarihVal,
    
    // New fields for product association
    urun_id: appliesAllCheckbox.checked ? null : urunSelect.value,
    applies_to_all: appliesAllCheckbox.checked
  };
  
  try {
    const resp = await fetch(`${baseUrl}/api/antrepo-giris/${activeGirisId}/ek-hizmetler`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ekHizmetObj)
    });
    const result = await resp.json();
    if (result.success) {
      alert("Ek hizmet kaydedildi!");
      const updatedList = await fetchEkHizmetler(activeGirisId);
      renderEkHizmetler(updatedList);
      ekHizmetModal.style.display = "none";
      clearEkHizmetModalFields();
      fetchHareketler();
    } else {
      alert("Ek hizmet eklenemedi: " + JSON.stringify(result));
    }
  } catch (error) {
    console.error("Ek hizmet kaydetme hatası:", error);
    alert("Ek hizmet kaydedilirken hata: " + error.message);
  }
});

if (cancelBtn) {
  cancelBtn.addEventListener("click", function(e) {
    e.preventDefault();
    if (confirm("Değişiklikleriniz kaydedilmeyecek. Devam etmek istiyor musunuz?")) {
      window.location.href = "antrepo-giris-form-list.html";
    }
  });
}

// Fix for confirmation modal - Make sure modal elements exist
const confirmModal = document.getElementById("confirmModal");
const confirmYesBtn = document.getElementById("confirmYes");
const confirmNoBtn = document.getElementById("confirmNo");

// Improved confirmation modal functions
function showConfirmModal(id, type) {
  itemToDeleteId = id;
  deleteType = type;
  
  if (!confirmModal) {
    console.error("Confirmation modal element not found!");
    // Fallback to regular confirm if modal doesn't exist
    if (confirm(`Bu ${type === "hareket" ? "hareketi" : "ek hizmeti"} silmek istediğinize emin misiniz?`)) {
      if (type === "hareket" && id) {
        deleteHareket(id);
      } else if (type === "ekhizmet" && id) {
        deleteEkHizmet(id);
      }
    }
    return;
  }
  
  confirmModal.style.display = "flex";
}


if (confirmYesBtn) {
  // Remove any existing event listeners to prevent duplicates
  confirmYesBtn.replaceWith(confirmYesBtn.cloneNode(true));
  // Get the new element reference after replacing
  const newConfirmYesBtn = document.getElementById("confirmYes");
  if (newConfirmYesBtn) {
    newConfirmYesBtn.addEventListener("click", function() {
      if (confirmModal) confirmModal.style.display = "none";
      if (deleteType === "hareket" && itemToDeleteId) {
        deleteHareket(itemToDeleteId);
      } else if (deleteType === "ekhizmet" && itemToDeleteId) {
        deleteEkHizmet(itemToDeleteId);
      }
      itemToDeleteId = null;
      deleteType = "";
    });
  }
}

// Also allow clicking outside the modal to close it (optional)
if (confirmModal) {
  confirmModal.addEventListener("click", function(e) {
    if (e.target === confirmModal) {
      confirmModal.style.display = "none";
      itemToDeleteId = null;
      deleteType = "";
    }
  });
}

// Eksik findVariantId fonksiyonunu ekleyelim
async function findVariantId(urunId, paketlemeTipi, paketBoyutu) {
  if (!urunId || !paketlemeTipi || !paketBoyutu) {
    console.warn("Varyant ID'si bulunamadı: Eksik parametreler", { urunId, paketlemeTipi, paketBoyutu });
    return null;
  }
  
  try {
    const response = await fetch(`${baseUrl}/api/find-variant?urunId=${urunId}&paketlemeTipi=${encodeURIComponent(paketlemeTipi)}&paketBoyutu=${encodeURIComponent(paketBoyutu)}`);
    
    if (response.ok) {
      const data = await response.json();
      return data.variantId;
    } else if (response.status === 404) {
      console.warn("Bu kombinasyona sahip varyant bulunamadı");
      return null;
    } else {
      throw new Error(`Varyant bulma hatası: ${response.status}`);
    }
  } catch (error) {
    console.error("Varyant ID bulma hatası:", error);
    return null;
  }
}

// Çıkış açıklaması oluşturma fonksiyonu
function formatExitDescription() {
  const satProformaNo = document.getElementById("modalSatProformaNo")?.value;
  const satFaturaNo = document.getElementById("modalSatFaturaNo")?.value;
  const musteri = document.getElementById("modalMusteri")?.value;
  const teslimYeri = document.getElementById("modalTeslimYeri")?.value;
  const nakliyeFirma = document.getElementById("modalNakliyeFirma")?.value;
  const aracPlaka = document.getElementById("modalAracPlaka")?.value;
  
  let description = "";
  
  if (satProformaNo) description += `Proforma: ${satProformaNo}; `;
  if (satFaturaNo) description += `Fatura: ${satFaturaNo}; `;
  if (musteri) description += `Müşteri: ${musteri}; `;
  if (teslimYeri) description += `Teslim Yeri: ${teslimYeri}; `;
  if (nakliyeFirma) description += `Nakliye: ${nakliyeFirma}; `;
  if (aracPlaka) description += `Araç: ${aracPlaka}; `;
  
  return description.trim();
}

// newEntryForm event listener içinde yaşanan hatayı düzeltmek için
if (newEntryForm) {
  newEntryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Flag to track if submission is in progress
    const submitButton = document.getElementById("entrySaveBtn");
    if (submitButton && submitButton.getAttribute('data-processing') === 'true') {
      console.log('Form submission already in progress');
      return false;
    }
    
    // Disable submit button to prevent double submissions
    if (submitButton) {
      submitButton.setAttribute('data-processing', 'true');
      submitButton.textContent = "İşleniyor...";
      submitButton.disabled = true;
    }
    
    try {
      const entryTarih = document.getElementById("modalAntrepoGirisTarihi")?.value;
      const entryMiktar = document.getElementById("modalMiktar")?.value;
      if (!entryTarih || !entryMiktar) {
        alert("Lütfen tarih ve miktar alanlarını doldurun!");
        return;
      }
      
      // Seçilen ürün bilgilerini al
      const urunSelect = document.getElementById("modalEntryUrunSelect");
      const selectedIndex = urunSelect.value;
      let selectedProduct = null;
      let selectedProductId = null;
      
      if (selectedIndex !== "" && productRows[selectedIndex]) {
        selectedProduct = productRows[selectedIndex];
        selectedProductId = selectedProduct.urunId; // Get the actual product ID
        console.log("Selected product:", selectedProduct);
      }
      
      // Varyant ID'sini bul
      let variantId = null;
      if (selectedProduct && selectedProduct.urunId && 
          selectedProduct.paketlemeTipi && selectedProduct.paketBoyutu) {
        // findVariantId fonksiyonunu kullanmadan önce kontrol et
        variantId = await findVariantId(
          selectedProduct.urunId,
          selectedProduct.paketlemeTipi,
          selectedProduct.paketBoyutu
        );
      }
      
      // Create payload with necessary fields
      const hareketPayload = {
        islem_tarihi: entryTarih,
        islem_tipi: "Giriş",
        miktar: parseFloat(entryMiktar) || 0,
        brut_agirlik: parseFloat(document.getElementById("modalBrutAgirlik")?.value) || 0,
        net_agirlik: parseFloat(document.getElementById("modalNetAgirlik")?.value) || 0,
        kap_adeti: parseInt(document.getElementById("modalKapAdeti")?.value) || 0,
        aciklama: document.getElementById("modalAciklama")?.value || "Yeni Giriş",
        description: selectedProduct ? selectedProduct.paketlemeTipi : null,
        urun_varyant_id: variantId,
        // urun_bilgisi göndermeyi kaldırıyoruz!
        urun_id: selectedProductId
      };
      
      console.log("Sending entry payload:", hareketPayload);
      
      const resp = await fetch(`${baseUrl}/api/antrepo-giris/${activeGirisId}/hareketler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hareketPayload)
      });
      
      const result = await resp.json();
      if (result.success) {
        alert("Yeni giriş eklendi!");
        document.getElementById("newEntryModal").style.display = "none";
        newEntryForm.reset();
        await fetchHareketler();
      } else {
        alert("Yeni giriş eklenemedi: " + JSON.stringify(result));
      }
    } catch (error) {
      console.error("Yeni giriş eklenirken hata:", error);
      alert("Hata: " + error.message);
    } finally {
      // Reset form submission status
      if (submitButton) {
        setTimeout(() => {
          submitButton.removeAttribute('data-processing');
          submitButton.textContent = "Kaydet";
          submitButton.disabled = false;
        }, 1000);
      }
    }
  });
}


// Yeni: Ürün satırı silme fonksiyonu
function removeProductRow(index) {
  productRows.splice(index, 1);
  renderProductRows();
}

if (addProductRowBtn) {
  addProductRowBtn.addEventListener("click", function() {
    // Form alanlarından verileri al
    const urunTanimi = document.getElementById("urunTanimi").value;
    const urunKodu = document.getElementById("urunKodu").value;
    const gtipNo = document.getElementById("gtipNo").value;
    const paketlemeTipi = document.getElementById("paketlemeTipi").value;
    const paketBoyutu = document.getElementById("paketBoyutu").value;
    const birimFiyat = document.getElementById("birimFiyat").value;
    const miktar = document.getElementById("miktar").value;
    const kapAdeti = document.getElementById("kapAdeti").value;
    const brutAgirlik = document.getElementById("brutAgirlik").value;
    const netAgirlik = document.getElementById("netAgirlik").value;
    const antrepoGirisTarihi = document.getElementById("antrepoGirisTarihi").value;
    
    // Temel validasyon
    if (!urunTanimi || !urunKodu) {
      alert("Lütfen ürün adı ve kodunu girin!");
      return;
    }
    
    // Yeni ürün satırını productRows'a ekle
    const newRow = {
      urunId: selectedUrunId, // global selectedUrunId değişkenini kullan
      urunTanimi: urunTanimi,
      urunKodu: urunKodu,
      gtipNo: gtipNo,
      paketlemeTipi: paketlemeTipi,
      paketBoyutu: paketBoyutu,
      birimFiyat: birimFiyat,
      miktar: miktar,
      kapAdeti: kapAdeti,
      brutAgirlik: brutAgirlik,
      netAgirlik: netAgirlik,
      antrepoGirisTarihi: antrepoGirisTarihi
    };
    
    // Satırı diziye ekle
    productRows.push(newRow);
    
    // Tabloyu güncelle
    renderProductRows();
    
    // Form alanlarını temizle
    document.getElementById("urunTanimi").value = "";
    document.getElementById("urunKodu").value = "";
    document.getElementById("gtipNo").value = "";
    document.getElementById("paketlemeTipi").value = "";
    try {
      $("#paketlemeTipi").val("").trigger('change');
    } catch(e) { console.warn("Select2 trigger error:", e); }
    document.getElementById("paketBoyutu").value = "";
    document.getElementById("birimFiyat").value = "";
    document.getElementById("miktar").value = "";
    document.getElementById("kapAdeti").value = "";
    document.getElementById("brutAgirlik").value = "";
    document.getElementById("netAgirlik").value = "";
    document.getElementById("antrepoGirisTarihi").value = "";
    
    // İlk alana odaklan
    document.getElementById("urunTanimi").focus();
    
    console.log("Yeni ürün satırı eklendi:", newRow);
    console.log("Toplam satır sayısı:", productRows.length);
  });
}

function populateEkHizmetProductSelect() {
  const selectElement = document.getElementById('modalEkHizmetUrunSelect');
  if (!selectElement) return;
  selectElement.innerHTML = '<option value="">Ürün seçiniz...</option>';
  productRows.forEach((row, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = row.urunTanimi;
    option.dataset.urunId = row.urunId;
    option.dataset.urunKodu = row.urunKodu;
    option.dataset.paketlemeTipi = row.paketlemeTipi;
    option.dataset.paketBoyutu = row.paketBoyutu;
    option.dataset.miktar = row.miktar;
    option.dataset.kapAdeti = row.kapAdeti;
    option.dataset.brutAgirlik = row.brutAgirlik;
    option.dataset.netAgirlik = row.netAgirlik;
    selectElement.appendChild(option);
  });
}