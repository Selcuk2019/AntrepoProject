/*******************************************************
 * File: antrepo-giris.js
 * Amaç: Antrepo Giriş Formu sayfasında;
 *  1) Temel antrepo giriş verilerini yönetmek (kayıt/güncelleme)
 *  2) Yeni Giriş / Yeni Çıkış modalları ile antrepo_hareketleri kaydetmek
 *  3) Ek Hizmetler (Birinci Modal) ile ek hizmet seçmek
 *  4) Yeni Hizmet Ekle / Düzenle (İkinci Modal) ile hizmetler tablosuna kayıt
 *******************************************************/

import { baseUrl } from './config.js';

let activeGirisId = null;

document.addEventListener("DOMContentLoaded", async () => {
  /************************************************************
   * 1) HTML Elemanlarının Seçimi
   ************************************************************/
  const antrepoForm          = document.getElementById("antrepoForm");
  const cancelBtn            = document.getElementById("cancelBtn");
  const saveBtn              = document.getElementById("saveBtn");

  // Sözleşme
  const inputSozlesme        = document.getElementById("sozlesmeInput");
  const sozlesmeList         = document.getElementById("sozlesmeList");
  const openSozlesmeBtn      = document.getElementById("openSozlesmeBtn");
  const clearSozlesmeBtn     = document.getElementById("clearSozlesmeBtn");

  // Antrepo Şirketi
  const inputAntrepoSirketi  = document.getElementById("antrepoSirketi");
  const antrepoSirketiList   = document.getElementById("antrepoSirketiList");
  const clearSirketBtn       = document.getElementById("clearSirketBtn");

  // Antrepo
  const inputAntrepoAd       = document.getElementById("antrepoAd");
  const antrepoIdList        = document.getElementById("antrepoIdList");
  const inputAntrepoKodu     = document.getElementById("antrepoKodu");
  const antrepoKoduList      = document.getElementById("antrepoKoduList");
  const inputAdres           = document.getElementById("adres");
  const inputSehir           = document.getElementById("sehir");
  const inputGumruk          = document.getElementById("gumruk");

  // Ürün Bilgileri
  const inputUrunTanimi      = document.getElementById("urunTanimi");
  const urunTanimiList       = document.getElementById("urunTanimiList");
  const inputUrunKodu        = document.getElementById("urunKodu");
  const urunKoduList         = document.getElementById("urunKoduList");
  const inputPaketBoyutu     = document.getElementById("paketBoyutu");
  const inputPaketlemeTipi   = document.getElementById("paketlemeTipi");
  const inputMiktar          = document.getElementById("miktar");
  const inputKapAdeti        = document.getElementById("kapAdeti");
  const inputBrutAgirlik     = document.getElementById("brutAgirlik");
  const inputNetAgirlik      = document.getElementById("netAgirlik");
  const inputAntrepoGirisTarihi = document.getElementById("antrepoGirisTarihi");
  const checkboxIlkGiris     = document.getElementById("ilkGiris");

  // Fatura & Depolama
  const inputGondericiSirket = document.getElementById("gondericiSirket");
  const inputAliciSirket     = document.getElementById("aliciSirket");
  const inputProformaNo      = document.getElementById("proformaNo");
  const inputProformaTarihi  = document.getElementById("proformaTarihi");
  const inputTicariFaturaNo  = document.getElementById("ticariFaturaNo");
  const inputTicariFaturaTarihi = document.getElementById("ticariFaturaTarihi");
  const inputDepolamaSuresi  = document.getElementById("depolamaSuresi");
  const inputFaturaMeblagi   = document.getElementById("faturaMeblagi");
  const inputUrunBirimFiyat  = document.getElementById("urunBirimFiyat");
  const selectParaBirimi     = document.getElementById("paraBirimi");
  const inputFaturaAciklama  = document.getElementById("faturaAciklama");

  // Beyanname/Form
  const inputBeyannameFormTarihi = document.getElementById("beyannameFormTarihi");
  const inputBeyannameNo         = document.getElementById("beyannameNo");

  // Yeni Giriş / Yeni Çıkış Butonları
  const newEntryBtn        = document.getElementById("newEntryBtn");
  const newExitBtn         = document.getElementById("newExitBtn");

  // EK HİZMETLER (Birinci Modal)
  const ekHizmetlerBtn         = document.getElementById("ekHizmetlerBtn");
  const ekHizmetModal          = document.getElementById("ekHizmetModal");
  const btnEkHizmetCancel      = document.getElementById("btnEkHizmetCancel");
  const btnEkHizmetSave        = document.getElementById("btnEkHizmetSave");
  const modalHizmetSelect      = document.getElementById("modalHizmetSelect");
  const modalHizmetKodu        = document.getElementById("modalHizmetKodu");
  const modalUcretModeli       = document.getElementById("modalUcretModeli");
  const modalHizmetBirim       = document.getElementById("modalHizmetBirim");
  const modalHizmetParaBirimi  = document.getElementById("modalHizmetParaBirimi");
  const modalTemelUcret        = document.getElementById("modalTemelUcret");
  const modalCarpan            = document.getElementById("modalCarpan");
  const modalHizmetAdet        = document.getElementById("modalHizmetAdet");
  const modalHizmetToplam      = document.getElementById("modalHizmetToplam");
  const mirrorInput            = document.getElementById("modalHizmetParaBirimiMirror");
  const ekHizmetlerTableBody   = document.getElementById("ekHizmetlerTableBody");
  const modalHizmetAciklama    = document.getElementById("modalHizmetAciklama");
  const btnNewHizmet           = document.getElementById("btnNewHizmet");
  const inputEkHizmetTarih     = document.getElementById("modalEkHizmetTarih");

  // Yeni Hizmet Ekle / Düzenle (İkinci Modal)
  const newHizmetModal         = document.getElementById("newHizmetModal");
  const newHizmetAdiSelect     = document.getElementById("newHizmetAdi");
  const newHizmetKodu          = document.getElementById("newHizmetKodu");
  const newHizmetTipi          = document.getElementById("newHizmetTipi");
  const newHizmetBirim         = document.getElementById("newHizmetBirim");
  const newHizmetParaBirimi    = document.getElementById("newHizmetParaBirimi");
  const newTemelUcret          = document.getElementById("newTemelUcret");
  const newMinUcret            = document.getElementById("newMinUcret");
  const newCarpan              = document.getElementById("newCarpan");
  const newMesaiUygulansinMi   = document.getElementById("newMesaiUygulansinMi");
  const newHizmetAciklama      = document.getElementById("newHizmetAciklama");
  const newHizmetDurum         = document.getElementById("newHizmetDurum");
  const btnNewHizmetCancel     = document.getElementById("btnNewHizmetCancel");
  const btnNewHizmetSave       = document.getElementById("btnNewHizmetSave");
  const entryBrutAgirlik = parseFloat(document.getElementById("modalBrutAgirlik")?.value) || 0;
  const entryNetAgirlik = parseFloat(document.getElementById("modalNetAgirlik")?.value) || 0;
  const entryKapAdeti = parseInt(document.getElementById("modalKapAdeti")?.value) || 0;
  const entryAciklama = document.getElementById("modalAciklama")?.value || "Yeni Giriş";
  const hareketTableBody = document.getElementById("giriscikisTableBody");

  // Tarih kısıtlaması: gelecek tarih seçilemesin
  const today = new Date().toISOString().split('T')[0];
  if (inputAntrepoGirisTarihi) {
    inputAntrepoGirisTarihi.setAttribute('max', today);
  }

  // Yeni giriş/çıkış hareketlerini güncellemek için fetchHareketler ve renderHareketler fonksiyonları
  async function fetchHareketler() {
    try {
      const resp = await fetch(`${baseUrl}/api/antrepo-giris/${activeGirisId}/hareketler`);
      if (!resp.ok) throw new Error(`Hareket listesi hatası: ${resp.status}`);
      const data = await resp.json();
      renderHareketler(data);
    } catch (error) {
      console.error("Hareketler çekilirken hata:", error);
    }
  }
  
  // Yeni fonksiyon: Antrepo hareketlerini silmek için
  async function deleteHareket(hareketId) {
    try {
      const resp = await fetch(`${baseUrl}/api/antrepo-giris/${activeGirisId}/hareketler/${hareketId}`, {
        method: "DELETE"
      });
      if (!resp.ok) throw new Error(`Silme hatası: ${resp.status}`);
      
      // Silme başarılıysa tabloyu güncelle
      fetchHareketler();
      alert("Hareket kaydı başarıyla silindi.");
    } catch (err) {
      console.error("Hareket silme hatası:", err);
      alert("Hareket kaydı silinirken hata oluştu: " + err.message);
    }
  }

  // Modal işlemleri için global değişkenler
  let itemToDeleteId = null;
  let deleteType = ""; // "hareket" veya "ekhizmet"
  
  // Onay modalını göster
  function showConfirmModal(id, type) {
    itemToDeleteId = id;
    deleteType = type;
    
    const confirmModal = document.getElementById("confirmModal");
    const confirmHeader = confirmModal.querySelector(".confirm-modal-header");
    
    // Modalın başlık metnini güncelle
    if (type === "hareket") {
      confirmHeader.textContent = "Hareket kaydı silinecek!";
    } else if (type === "ekhizmet") {
      confirmHeader.textContent = "Ek hizmet kaydı silinecek!";
    }
    
    // Modalı göster
    confirmModal.style.display = "flex";
  }
  
  // Modal butonlarına event listener ekle
  document.getElementById("confirmNo")?.addEventListener("click", function() {
    document.getElementById("confirmModal").style.display = "none";
    itemToDeleteId = null;
    deleteType = "";
  });
  
  document.getElementById("confirmYes")?.addEventListener("click", function() {
    document.getElementById("confirmModal").style.display = "none";
    
    if (deleteType === "hareket" && itemToDeleteId) {
      deleteHareket(itemToDeleteId);
    } else if (deleteType === "ekhizmet" && itemToDeleteId) {
      deleteEkHizmet(itemToDeleteId);
    }
    
    itemToDeleteId = null;
    deleteType = "";
  });

  function renderHareketler(list) {
    hareketTableBody.innerHTML = "";
    list.forEach(item => {
      const tr = document.createElement("tr");
  
      // 1) Tarih
      const tdTarih = document.createElement("td");
      tdTarih.textContent = item.islem_tarihi
        ? item.islem_tarihi.substring(0, 10)
        : "";
      tr.appendChild(tdTarih);
  
      // 2) İşlem Tipi
      const tdTip = document.createElement("td");
      tdTip.textContent = item.islem_tipi || "";
      tr.appendChild(tdTip);
  
      // 3) Miktar
      const tdMiktar = document.createElement("td");
      tdMiktar.textContent = item.miktar != null ? item.miktar : "";
      tr.appendChild(tdMiktar);
  
      // 4) Kap Adedi
      const tdKapAdet = document.createElement("td");
      tdKapAdet.textContent = item.kap_adeti != null ? item.kap_adeti : "";
      tr.appendChild(tdKapAdet);
  
      // 5) Brüt Ağırlık
      const tdBrut = document.createElement("td");
      tdBrut.textContent = item.brut_agirlik != null ? item.brut_agirlik : "";
      tr.appendChild(tdBrut);
  
      // 6) Net Ağırlık
      const tdNet = document.createElement("td");
      tdNet.textContent = item.net_agirlik != null ? item.net_agirlik : "";
      tr.appendChild(tdNet);
  
      // 7) Birim
      const tdBirim = document.createElement("td");
      tdBirim.textContent = item.birim_adi || "";
      tr.appendChild(tdBirim);
  
      // 8) Açıklama
      const tdAciklama = document.createElement("td");
      tdAciklama.textContent = item.aciklama || "";
      tr.appendChild(tdAciklama);
  
      // 9) İşlemler (örneğin Sil butonu)
      const tdIslemler = document.createElement("td");
      const silBtn = document.createElement("button");
      silBtn.textContent = "Sil";
      silBtn.classList.add("btn-secondary");
      silBtn.addEventListener("click", () => {
        // Önce onay modalı göster, onaylanırsa silme işlemini yap
        showConfirmModal(item.id, "hareket");
      });
      tdIslemler.appendChild(silBtn);
      tr.appendChild(tdIslemler);
  
      hareketTableBody.appendChild(tr);
    });
  }

  /************************************************************
   * 2) Mode Ayarı: URL Parametrelerinden Okuma (view / edit)
   ************************************************************/
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get("mode"); // "view", "edit" veya null
  const editId = urlParams.get("id");

  if (editId) {
    activeGirisId = editId;
  }

  /************************************************************
   * 3) Global Diziler
   ************************************************************/
  let allSozlesmeler   = [];
  let allSirketler     = [];
  let allAntrepolar    = [];
  let allUrunler       = [];
  let allParaBirimleri = [];
  let allHizmetler     = []; // /api/hizmetler'den çekilecek hizmetler
  let allBirimler      = [];

  // Ek hizmetler data: form submit olduğunda payload.ekHizmetler olarak göndereceğiz
  let ekHizmetlerData  = [];

  /************************************************************
   * 4) API'den Veri Çekme Fonksiyonları
   ************************************************************/
  async function fetchSozlesmeler() {
    try {
      const resp = await fetch(`${baseUrl}/api/sozlesmeler`);
      if (!resp.ok) throw new Error(`Sözleşmeler hata: ${resp.status}`);
      allSozlesmeler = await resp.json();
    } catch (err) {
      console.error("Sözleşmeler çekilemedi:", err);
    }
  }
  async function fetchSirketler() {
    try {
      const resp = await fetch(`${baseUrl}/api/companies`);
      if (!resp.ok) throw new Error(`Şirketler hata: ${resp.status}`);
      allSirketler = await resp.json();
    } catch (err) {
      console.error("Şirketler çekilemedi:", err);
    }
  }
  async function fetchAntrepolar() {
    try {
      const resp = await fetch(`${baseUrl}/api/antrepolar`);
      if (!resp.ok) throw new Error(`Antrepolar hata: ${resp.status}`);
      allAntrepolar = await resp.json();
    } catch (err) {
      console.error("Antrepolar çekilemedi:", err);
    }
  }
  async function fetchUrunler() {
    try {
      const resp = await fetch(`${baseUrl}/api/urunler`);
      if (!resp.ok) throw new Error(`Ürünler hata: ${resp.status}`);
      allUrunler = await resp.json();
    } catch (err) {
      console.error("Ürünler çekilemedi:", err);
    }
  }
  async function fetchParaBirimleri() {
    try {
      const resp = await fetch(`${baseUrl}/api/para-birimleri`);
      if (!resp.ok) throw new Error(`Para birimleri hata: ${resp.status}`);
      allParaBirimleri = await resp.json();
    } catch (err) {
      console.error("Para birimleri çekilemedi:", err);
    }
  }
  async function fetchAllHizmetler() {
    try {
      const resp = await fetch(`${baseUrl}/api/hizmetler`);
      if (!resp.ok) throw new Error(`Hizmetler hata: ${resp.status}`);
      allHizmetler = await resp.json();
    } catch (err) {
      console.error("Hizmetler çekilemedi:", err);
    }
  }
  async function fetchBirimler() {
    try {
      const resp = await fetch(`${baseUrl}/api/birimler`);
      if (!resp.ok) throw new Error(`Birimler hata: ${resp.status}`);
      allBirimler = await resp.json();
    } catch (err) {
      console.error("Birimler çekilemedi:", err);
    }
  }
  
  // Tüm verileri paralel çekiyoruz:
  await Promise.all([
    fetchSozlesmeler(),
    fetchSirketler(),
    fetchAntrepolar(),
    fetchUrunler(),
    fetchParaBirimleri(),
    fetchAllHizmetler(),
    fetchBirimler()
  ]);

  fillParaBirimDropdown();

  async function fetchEkHizmetler(girisId) {
    const resp = await fetch(`${baseUrl}/api/antrepo-giris/${girisId}/ek-hizmetler`);
    if (!resp.ok) throw new Error(`Ek hizmetler hata: ${resp.status}`);
    const data = await resp.json();
    return data;
  }
  
  async function deleteEkHizmet(ekHizmetId) {
    try {
      const resp = await fetch(`${baseUrl}/api/antrepo-giris/${activeGirisId}/ek-hizmetler/${ekHizmetId}`, {
        method: "DELETE"
      });
      if (!resp.ok) throw new Error(`Silme hatası: ${resp.status}`);
      const updatedList = await fetchEkHizmetler(activeGirisId);
      renderEkHizmetler(updatedList);
      alert("Ek hizmet başarıyla silindi.");
    } catch (err) {
      console.error("Ek hizmet silme hatası:", err);
      alert("Ek hizmet silinirken hata oluştu: " + err.message);
    }
  }
  
  /************************************************************
   * 6) Ek Hizmetler Tablosu Render Fonksiyonları
   ************************************************************/
  function renderEkHizmetler(list) {
    ekHizmetlerTableBody.innerHTML = "";
    list.forEach(item => {
      const tr = document.createElement("tr");
      
      const tdTarih = document.createElement("td");
      const rawDate = item.ek_hizmet_tarihi; 
      tdTarih.textContent = rawDate ? rawDate.substring(0, 10) : "";
      tr.appendChild(tdTarih);
      
      // Hizmet Adı
      const tdHizmetAdi = document.createElement("td");
      tdHizmetAdi.textContent = item.hizmet_adi || "";
      tr.appendChild(tdHizmetAdi);
      
      // Adet
      const tdAdet = document.createElement("td");
      tdAdet.textContent = item.adet || "";
      tr.appendChild(tdAdet);
      
      // Temel Ücret
      const tdTemel = document.createElement("td");
      tdTemel.textContent = item.temel_ucret || "";
      tr.appendChild(tdTemel);
      
      // Çarpan
      const tdCarpan = document.createElement("td");
      tdCarpan.textContent = item.carpan || "";
      tr.appendChild(tdCarpan);
      
      // Toplam
      const tdToplam = document.createElement("td");
      tdToplam.textContent = item.toplam || "";
      tr.appendChild(tdToplam);
      
      // Açıklama
      const tdAciklama = document.createElement("td");
      tdAciklama.textContent = item.aciklama || "";
      tr.appendChild(tdAciklama);
      
      // İşlemler (Sil butonu)
      const tdIslemler = document.createElement("td");
      const silBtn = document.createElement("button");
      silBtn.textContent = "Sil";
      silBtn.classList.add("btn-secondary");
      silBtn.addEventListener("click", () => {
        // Önce onay modalı göster, onaylanırsa silme işlemini yap
        showConfirmModal(item.id, "ekhizmet");
      });
      tdIslemler.appendChild(silBtn);
      tr.appendChild(tdIslemler);
      
      ekHizmetlerTableBody.appendChild(tr);
    });
  }
  
  /************************************************************
   * 5) Datalist / Dropdown Doldurma Fonksiyonları
   ************************************************************/
  function updateSozlesmeDatalist(list) {
    sozlesmeList.innerHTML = "";
    list.forEach(s => {
      const code = s.sozlesme_kodu && s.sozlesme_kodu.trim() !== "" ? s.sozlesme_kodu : "Kodsuz";
      const opt = document.createElement("option");
      opt.value = `${code} - ${s.sozlesme_adi}`;
      sozlesmeList.appendChild(opt);
    });
  }
  function fillAntrepoDatalists() {
    antrepoIdList.innerHTML = "";
    antrepoKoduList.innerHTML = "";
    allAntrepolar.forEach(a => {
      const optAd = document.createElement("option");
      optAd.value = a.antrepoAdi;
      antrepoIdList.appendChild(optAd);
      
      const optKod = document.createElement("option");
      optKod.value = a.antrepoKodu;
      antrepoKoduList.appendChild(optKod);
    });
  }
  function fillUrunDatalists() {
    urunTanimiList.innerHTML = "";
    urunKoduList.innerHTML = "";
    allUrunler.forEach(u => {
      const optName = document.createElement("option");
      optName.value = u.name;
      urunTanimiList.appendChild(optName);
      
      const optCode = document.createElement("option");
      optCode.value = u.code;
      urunKoduList.appendChild(optCode);
    });
  }
  function fillParaBirimDropdown() {
    if (!selectParaBirimi) return;
    
    // Önce mevcut seçenekleri temizleyelim
    selectParaBirimi.innerHTML = '<option value=""></option>';
    
    // API'den çekilen para birimlerini dropdown'a ekleyelim
    allParaBirimleri.forEach(pb => {
      const opt = document.createElement('option');
      opt.value = pb.id.toString();
      opt.textContent = `${pb.para_birimi_adi} (${pb.iso_kodu})`;
      selectParaBirimi.appendChild(opt);
    });
    
    // Eğer Select2 zaten başlatılmışsa güncelle
    try {
      $(selectParaBirimi).trigger('change');
    } catch (e) {
      console.log("Select2 henüz başlatılmamış olabilir.");
    }
  }
  function fillSirketDatalist() {
    antrepoSirketiList.innerHTML = "";
    allSirketler.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.display_name;
      antrepoSirketiList.appendChild(opt);
    });
  }
  
  // Birim dropdown doldurma (Yeni Hizmet Modal)
  function populateNewHizmetBirimDropdown() {
    newHizmetBirim.innerHTML = `<option value="" disabled selected>Seçiniz</option>`;
    allBirimler.forEach(b => {
      const opt = document.createElement("option");
      opt.value = b.id.toString();
      opt.textContent = b.birim_adi;
      newHizmetBirim.appendChild(opt);
    });
  }
  
  // Para birimi dropdown doldurma (Yeni Hizmet Modal)
  function populateNewHizmetParaBirimi() {
    newHizmetParaBirimi.innerHTML = `<option value="" disabled selected>Seçiniz</option>`;
    allParaBirimleri.forEach(pb => {
      const opt = document.createElement("option");
      opt.value = pb.id.toString();
      opt.textContent = `${pb.para_birimi_adi} (${pb.iso_kodu})`;
      newHizmetParaBirimi.appendChild(opt);
    });
  }
  
  // Şimdi doldur:
  updateSozlesmeDatalist(allSozlesmeler);
  fillSirketDatalist();
  fillAntrepoDatalists();
  fillUrunDatalists();
  fillParaBirimDropdown();
  
  /************************************************************
   * 6) Event Listeners - Sözleşme & Şirket
   ************************************************************/
  function filterSozlesmelerByCompany(displayName) {
    const lower = displayName.toLowerCase();
    const filtered = allSozlesmeler.filter(s =>
      s.display_name && s.display_name.toLowerCase() === lower
    );
    updateSozlesmeDatalist(filtered);
  }

  // İlgili Sözleşme alanı için yeni input eventleri
  // Her karakter değişimini yakalamak için input event listener kullanıyoruz
  inputSozlesme.addEventListener("input", function() {
    const userInput = inputSozlesme.value.trim();
    
    // 1. Boş mu kontrol et
    if (!userInput) {
      // Sözleşme alanı boş ise, Antrepo Şirketi alanını temizle ve kilidini kaldır
      inputAntrepoSirketi.value = "";
      inputAntrepoSirketi.disabled = false;
      clearSirketBtn.disabled = false;
      // Tüm sözleşme listesini göster
      updateSozlesmeDatalist(allSozlesmeler);
      return;
    }
    
    // 2. Seçilen/yazılan değerin tam olarak veritabanıyla eşleşip eşleşmediğini kontrol et
    // Tam eşleşme olması için, format "KOD - SÖZLEŞME ADI" şeklinde olmalı
    let isExactMatch = false;
    let matchedSozlesme = null;
    
    allSozlesmeler.forEach(s => {
      const kod = s.sozlesme_kodu && s.sozlesme_kodu.trim() !== "" ? s.sozlesme_kodu : "Kodsuz";
      const fullText = `${kod} - ${s.sozlesme_adi}`;
      
      // Tam eşleşme kontrolü
      if (userInput === fullText) {
        isExactMatch = true;
        matchedSozlesme = s;
      }
    });
    
    // 3. Eğer tam eşleşme varsa, Antrepo Şirketi doldur ve kilitle
    if (isExactMatch && matchedSozlesme && matchedSozlesme.display_name) {
      inputAntrepoSirketi.value = matchedSozlesme.display_name;
      inputAntrepoSirketi.disabled = true;
      clearSirketBtn.disabled = true;
      filterSozlesmelerByCompany(matchedSozlesme.display_name);
    } else {
      // 4. Tam eşleşme yoksa, Antrepo Şirketi temizle ve kilidi kaldır
      inputAntrepoSirketi.value = "";
      inputAntrepoSirketi.disabled = false;
      clearSirketBtn.disabled = false;
      
      // Yazılan metne göre sözleşme listesini filtrele (opsiyonel)
      const lowercaseInput = userInput.toLowerCase();
      const filtered = allSozlesmeler.filter(s => {
        const kod = s.sozlesme_kodu || "Kodsuz";
        const fullText = `${kod} - ${s.sozlesme_adi}`.toLowerCase();
        return fullText.includes(lowercaseInput);
      });
      updateSozlesmeDatalist(filtered.length > 0 ? filtered : allSozlesmeler);
    }
  });
  
  // Şirket değişikliğini izleme
  inputAntrepoSirketi.addEventListener("change", () => {
    if (!inputAntrepoSirketi.disabled) {
      const val = inputAntrepoSirketi.value.trim().toLowerCase();
      if (val) filterSozlesmelerByCompany(val);
      else updateSozlesmeDatalist(allSozlesmeler);
    }
  });
  
  // Clear butonları 
  clearSozlesmeBtn.addEventListener("click", () => {
    inputSozlesme.value = "";
    inputSozlesme.dispatchEvent(new Event("input")); // Input event'ini tetikle
    inputSozlesme.focus();
  });
  
  clearSirketBtn.addEventListener("click", () => {
    if (!inputAntrepoSirketi.disabled) {
      inputAntrepoSirketi.value = "";
      updateSozlesmeDatalist(allSozlesmeler);
      inputAntrepoSirketi.focus();
    }
  });
  
  inputAntrepoSirketi.addEventListener("change", () => {
    if (!inputAntrepoSirketi.disabled) {
      const val = inputAntrepoSirketi.value.trim().toLowerCase();
      if (val) filterSozlesmelerByCompany(val);
      else updateSozlesmeDatalist(allSozlesmeler);
    }
  });
  clearSozlesmeBtn.addEventListener("click", () => {
    inputSozlesme.value = "";
    inputSozlesme.dispatchEvent(new Event("input"));
    
    // Antrepo Şirketi alanını da temizle ve kilidini kaldır
    inputAntrepoSirketi.value = "";
    inputAntrepoSirketi.disabled = false;
    clearSirketBtn.disabled = false;
    
    // Tüm sözleşmeleri göster
    updateSozlesmeDatalist(allSozlesmeler);
  });
  clearSirketBtn.addEventListener("click", () => {
    if (!inputAntrepoSirketi.disabled) {
      inputAntrepoSirketi.value = "";
      updateSozlesmeDatalist(allSozlesmeler);
    }
  });
  openSozlesmeBtn.addEventListener("click", () => {
    const userInput = inputSozlesme.value.trim();
    if (!userInput) {
      alert("Sözleşme kodu/adı giriniz!");
      return;
    }
    const splitted = userInput.split(" - ");
    let kod = splitted[0];
    if (kod === "Kodsuz") kod = "";
    const found = allSozlesmeler.find(s =>
      (s.sozlesme_kodu || "").toLowerCase() === kod.toLowerCase()
    );
    if (!found) {
      alert("Sözleşme kodu eşleşmedi!");
      return;
    }
    window.open(`contract-form.html?id=${found.id}`, "_blank");
  });
  
  /************************************************************
   * 7) Event Listeners - Antrepo Ad / Kodu
   ************************************************************/
  // Eski change listener'ları kaldırıyorum ve yerine input listener'ları ekliyorum
  
  // 1. Antrepo Adı inputu için yeni event listener
  inputAntrepoAd.addEventListener("input", function() {
    const userInput = inputAntrepoAd.value.trim().toLowerCase();
    
    // Boş ise diğer alanları temizle
    if (!userInput) {
      inputAntrepoKodu.value = "";
      inputAdres.value = "";
      inputSehir.value = "";
      inputGumruk.value = "";
      return;
    }
    
    // Girilen değerin tam olarak eşleşip eşleşmediğini kontrol et
    const foundAntrepo = allAntrepolar.find(a => a.antrepoAdi.toLowerCase() === userInput);
    
    // Tam eşleşme varsa diğer alanları doldur
    if (foundAntrepo) {
      inputAntrepoKodu.value = foundAntrepo.antrepoKodu || "";
      inputAdres.value = foundAntrepo.acikAdres || "";
      inputSehir.value = foundAntrepo.sehir || "";
      inputGumruk.value = foundAntrepo.gumruk || "";
    } else {
      // Eşleşme yoksa diğer alanları temizle
      inputAntrepoKodu.value = "";
      inputAdres.value = "";
      inputSehir.value = "";
      inputGumruk.value = "";
    }
  });
  
  // 2. Antrepo Kodu inputu için yeni event listener
  inputAntrepoKodu.addEventListener("input", function() {
    const userInput = inputAntrepoKodu.value.trim().toLowerCase();
    
    // Boş ise diğer alanları temizle
    if (!userInput) {
      inputAntrepoAd.value = "";
      inputAdres.value = "";
      inputSehir.value = "";
      inputGumruk.value = "";
      return;
    }
    
    // Girilen değerin tam olarak eşleşip eşleşmediğini kontrol et
    const foundAntrepo = allAntrepolar.find(a => a.antrepoKodu.toLowerCase() === userInput);
    
    // Tam eşleşme varsa diğer alanları doldur
    if (foundAntrepo) {
      inputAntrepoAd.value = foundAntrepo.antrepoAdi || "";
      inputAdres.value = foundAntrepo.acikAdres || "";
      inputSehir.value = foundAntrepo.sehir || "";
      inputGumruk.value = foundAntrepo.gumruk || "";
    } else {
      // Eşleşme yoksa diğer alanları temizle
      inputAntrepoAd.value = "";
      inputAdres.value = "";
      inputSehir.value = "";
      inputGumruk.value = "";
    }
  });
  
  // Change listener'ları bir süre daha tutuyorum (uyumluluk için)
  // Ama bunları da input listener'ı gibi davranacak şekilde revize ediyorum
  inputAntrepoAd.addEventListener("change", function() {
    inputAntrepoAd.dispatchEvent(new Event("input"));
  });
  
  inputAntrepoKodu.addEventListener("change", function() {
    inputAntrepoKodu.dispatchEvent(new Event("input"));
  });
  
  /************************************************************
   * 8) Event Listeners - Ürün Tanımı / Kodu
   ************************************************************/
  // Eski change listener'ları kaldırıyorum ve yerine input listener'ları ekliyorum
  
  // 1. Ürün Tanımı inputu için yeni event listener
  inputUrunTanimi.addEventListener("input", function() {
    const userInput = inputUrunTanimi.value.trim().toLowerCase();
    
    // Boş ise diğer alanları temizle
    if (!userInput) {
      inputUrunKodu.value = "";
      inputPaketBoyutu.value = "";
      inputPaketlemeTipi.value = "";
      return;
    }
    
    // Girilen değerin tam olarak eşleşip eşleşmediğini kontrol et
    const foundUrun = allUrunler.find(u => u.name.toLowerCase() === userInput);
    
    // Tam eşleşme varsa diğer alanları doldur
    if (foundUrun) {
      inputUrunKodu.value = foundUrun.code || "";
      inputPaketBoyutu.value = foundUrun.paket_hacmi ? foundUrun.paket_hacmi + " Kg" : "";
      inputPaketlemeTipi.value = foundUrun.paketleme_tipi_name || "";
    } else {
      // Eşleşme yoksa diğer alanları temizle
      inputUrunKodu.value = "";
      inputPaketBoyutu.value = "";
      inputPaketlemeTipi.value = "";
    }
  });
  
  // 2. Ürün Kodu inputu için yeni event listener
  inputUrunKodu.addEventListener("input", function() {
    const userInput = inputUrunKodu.value.trim().toLowerCase();
    
    // Boş ise diğer alanları temizle
    if (!userInput) {
      inputUrunTanimi.value = "";
      inputPaketBoyutu.value = "";
      inputPaketlemeTipi.value = "";
      return;
    }
    
    // Girilen değerin tam olarak eşleşip eşleşmediğini kontrol et
    const foundUrun = allUrunler.find(u => u.code.toLowerCase() === userInput);
    
    // Tam eşleşme varsa diğer alanları doldur
    if (foundUrun) {
      inputUrunTanimi.value = foundUrun.name || "";
      inputPaketBoyutu.value = foundUrun.paket_hacmi ? foundUrun.paket_hacmi + " Kg" : "";
      inputPaketlemeTipi.value = foundUrun.paketleme_tipi_name || "";
    } else {
      // Eşleşme yoksa diğer alanları temizle
      inputUrunTanimi.value = "";
      inputPaketBoyutu.value = "";
      inputPaketlemeTipi.value = "";
    }
  });
  
  // Change listener'ları bir süre daha tutuyorum (uyumluluk için)
  // Ama bunları da input listener'ı gibi davranacak şekilde revize ediyorum
  inputUrunTanimi.addEventListener("change", function() {
    inputUrunTanimi.dispatchEvent(new Event("input"));
  });
  
  inputUrunKodu.addEventListener("change", function() {
    inputUrunKodu.dispatchEvent(new Event("input"));
  });
  
  /************************************************************
   * 9) EK HİZMETLER MODALI (Birinci Modal)
   ************************************************************/
  if (ekHizmetlerBtn) {
    ekHizmetlerBtn.addEventListener("click", () => {
      populateModalHizmetParaBirimi();
      populateModalHizmetSelect(allHizmetler);
      clearEkHizmetModalFields();
      ekHizmetModal.style.display = "block";
    });
  }
  
  function populateModalHizmetParaBirimi() {
    modalHizmetParaBirimi.innerHTML = "";
    allParaBirimleri.forEach(pb => {
      const opt = document.createElement("option");
      opt.value = pb.id.toString();
      opt.textContent = `${pb.para_birimi_adi} (${pb.iso_kodu})`;
      modalHizmetParaBirimi.appendChild(opt);
    });
  }
  
  function populateModalHizmetSelect(hizmetler) {
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
      modalHizmetKodu.value   = found.hizmet_kodu || "";
      modalUcretModeli.value  = found.hizmet_tipi || "";
      modalHizmetBirim.value  = found.birim_adi || "";
      if (found.para_birimi_id) {
        modalHizmetParaBirimi.value = String(found.para_birimi_id);
      }
      modalTemelUcret.value   = found.temel_ucret || 0;
      modalCarpan.value       = found.carpan || 0;
      modalHizmetToplam.value = "";
    }
  });
  
  [modalTemelUcret, modalCarpan, modalHizmetAdet, modalHizmetParaBirimi].forEach(elem => {
    elem.addEventListener("input", updateEkHizmetToplam);
  });
  function updateEkHizmetToplam() {
    const temel = parseFloat(modalTemelUcret.value) || 0;
    const carp  = parseFloat(modalCarpan.value) || 0;
    const adet  = parseFloat(modalHizmetAdet.value) || 0;
    const sum   = (temel + carp) * adet;
    modalHizmetToplam.value = sum.toFixed(2);
  
    const selIdx = modalHizmetParaBirimi.selectedIndex;
    const text   = modalHizmetParaBirimi.options[selIdx]?.textContent || "";
    const match  = text.match(/\((.*?)\)/);
    const iso    = match ? match[1] : "";
    if (mirrorInput) {
      mirrorInput.value = iso;
    }
  }
  
  btnEkHizmetCancel.addEventListener("click", () => {
    ekHizmetModal.style.display = "none";
  });
  
  btnEkHizmetSave.addEventListener("click", async () => {
    const tarihVal = inputEkHizmetTarih.value.trim();
    if (!tarihVal) {
      alert("Tarih zorunludur!");
      return;
    }
    
    const ekHizmetObj = {
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
      ek_hizmet_tarihi: tarihVal
    };
  
    try {
      const resp = await fetch(`${baseUrl}/api/antrepo-giris/${activeGirisId}/ek-hizmetler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ekHizmetObj)
      });
      if (!resp.ok) throw new Error(`Sunucu hatası: ${resp.status}`);
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
  
  function clearEkHizmetModalFields(clearSelect = true) {
    if (clearSelect) {
      modalHizmetSelect.value = "";
    }
    modalHizmetKodu.value = "";
    modalUcretModeli.value = "";
    modalHizmetBirim.value = "";
    modalHizmetParaBirimi.value = "";
    modalTemelUcret.value = "";
    modalCarpan.value = "";
    modalHizmetAdet.value = "";
    modalHizmetToplam.value = "";
    modalHizmetAciklama.value = "";
    if (mirrorInput) mirrorInput.value = "";
  }
  
  btnNewHizmet.addEventListener("click", () => {
    newHizmetModal.style.display = "block";
    populateNewHizmetBirimDropdown();
    populateNewHizmetParaBirimi();
    clearNewHizmetForm();
  });
  
  function clearNewHizmetForm() {
    newHizmetAdiSelect.value = "new";
    newHizmetKodu.value = "";
    newHizmetTipi.value = "";
    newHizmetBirim.value = "";
    newHizmetParaBirimi.value = "";
    newTemelUcret.value = "";
    newMinUcret.value = "";
    newCarpan.value = "";
    newHizmetAciklama.value = "";
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
      if (!resp.ok) throw new Error(`Sunucu hatası: ${resp.status}`);
      const result = await resp.json();
      if (result.success) {
        alert("Hizmet kaydedildi!");
        await fetchAllHizmetler();
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
    newHizmetModal.style.display = "none";
    clearNewHizmetForm();
  });
  
  /************************************************************
   * 11) Form Submit (Antrepo Giriş Kaydet)
   ************************************************************/
  antrepoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const chosenDate = inputAntrepoGirisTarihi.value;
    const todayDate  = new Date().toISOString().split('T')[0];
    if (chosenDate && chosenDate > todayDate) {
      alert("Antrepo Giriş Tarihi gelecekte olamaz!");
      return;
    }
  
    let sozlesmeId = null;
    const sozVal = inputSozlesme.value.trim();
    if (sozVal) {
      const splitted = sozVal.split(" - ");
      let kod = splitted[0];
      if (kod === "Kodsuz") kod = "";
      const foundSoz = allSozlesmeler.find(s =>
        (s.sozlesme_kodu || "").toLowerCase() === kod.toLowerCase()
      );
      if (foundSoz) {
        sozlesmeId = foundSoz.id;
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
      beyanname_no:          inputBeyannameNo.value,
      antrepo_sirket_adi:    inputAntrepoSirketi.value,
      sozlesme_id:           sozlesmeId,
      gumruk:                inputGumruk.value,
      antrepo_id:            antrepo_id,
      antrepo_kodu:          inputAntrepoKodu.value,
      adres:                 inputAdres.value,
      sehir:                 inputSehir.value,
      urun_tanimi:           inputUrunTanimi.value,
      urun_kodu:             inputUrunKodu.value,
      paket_boyutu:          inputPaketBoyutu.value,
      paketleme_tipi:        inputPaketlemeTipi.value,
      miktar:                inputMiktar.value,
      kap_adeti:             inputKapAdeti.value,
      brut_agirlik:          inputBrutAgirlik.value,
      net_agirlik:           inputNetAgirlik.value,
      antrepo_giris_tarihi:  inputAntrepoGirisTarihi.value,
      gonderici_sirket:      inputGondericiSirket.value,
      alici_sirket:          inputAliciSirket.value,
      proforma_no:           inputProformaNo.value,
      proforma_tarihi:       inputProformaTarihi.value,
      ticari_fatura_no:      inputTicariFaturaNo.value,
      ticari_fatura_tarihi:  inputTicariFaturaTarihi.value,
      depolama_suresi:       inputDepolamaSuresi.value,
      fatura_meblagi:        inputFaturaMeblagi.value,
      urun_birim_fiyat:      inputUrunBirimFiyat.value,
      para_birimi:           selectParaBirimi.value,
      fatura_aciklama:       inputFaturaAciklama.value,
      ekHizmetler:           ekHizmetlerData
    };
  
    // POST / PUT kararını verip URL'yi oluşturuyoruz:
    let method = "POST";
    let finalUrl = `${baseUrl}/api/antrepo-giris`;
    if (editId) {
      method = "PUT";
      finalUrl = `${baseUrl}/api/antrepo-giris/${editId}`;
    }
  
    try {
      const resp = await fetch(finalUrl, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error(`Sunucu hatası: ${resp.status}`);
      const result = await resp.json();
      if (result.success) {
        activeGirisId = editId ? editId : result.insertedId;
        if (checkboxIlkGiris.checked) {
          // Yeni giriş modal formunda brüt/net ağırlık alanlarını da payload'a ekliyoruz:
          const entryTarih = document.getElementById("modalAntrepoGirisTarihi")?.value;
          const entryMiktar = document.getElementById("modalMiktar")?.value;
          const entryBrutAgirlik = parseFloat(document.getElementById("modalBrutAgirlik")?.value) || 0;
          const entryNetAgirlik = parseFloat(document.getElementById("modalNetAgirlik")?.value) || 0;
          const entryKapAdeti = parseInt(document.getElementById("modalKapAdeti")?.value) || 0;
          const entryAciklama = document.getElementById("modalAciklama")?.value || "Yeni Giriş";
          const toplam = (entryBrutAgirlik + entryNetAgirlik).toFixed(2);
  
          const hareketPayload = {
            islem_tarihi: entryTarih,
            islem_tipi: "Giriş",
            miktar: parseFloat(entryMiktar) || 0,
            brut_agirlik: entryBrutAgirlik,
            net_agirlik: entryNetAgirlik,
            kap_adeti: entryKapAdeti,
            toplam: toplam,
            aciklama: entryAciklama
          };
          await fetch(`${baseUrl}/api/antrepo-giris/${activeGirisId}/hareketler`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(hareketPayload)
          });
        }
        alert("Kayıt başarılı!");
        window.location.href = "antrepo-giris-form-list.html";
      } else {
        alert("Kayıt başarısız: " + JSON.stringify(result));
      }
    } catch (error) {
      console.error("Kayıt sırasında hata:", error);
      alert("Hata: " + error.message);
    }
  });
  
  /************************************************************
   * 12) Sayfa Yüklenirken: Mevcut Kaydı Yükle (Edit Mode)
   ************************************************************/
  async function loadExistingData(id) {
    try {
      activeGirisId = id; // ID'yi set et
      const resp = await fetch(`${baseUrl}/api/antrepo-giris/${id}`);
      if (!resp.ok) throw new Error(`Veri çekme hatası: ${resp.status}`);
      const data = await resp.json();
  
      inputBeyannameFormTarihi.value = data.beyanname_form_tarihi ? data.beyanname_form_tarihi.substring(0,10) : "";
      inputBeyannameNo.value         = data.beyanname_no || "";
      inputAntrepoAd.value           = data.antrepo_adi || "";
      inputAntrepoKodu.value         = data.antrepo_kodu || "";
      inputAdres.value               = data.adres || "";
      inputSehir.value               = data.sehir || "";
      inputGumruk.value              = data.gumruk || "";
      inputUrunTanimi.value          = data.urun_tanimi || "";
      inputUrunKodu.value            = data.urun_kodu || "";
      inputPaketBoyutu.value         = data.paket_boyutu || "";
      inputPaketlemeTipi.value       = data.paketleme_tipi || "";
      inputMiktar.value              = data.miktar || "";
      inputKapAdeti.value            = data.kap_adeti || "";
      inputBrutAgirlik.value         = data.brut_agirlik || "";
      inputNetAgirlik.value          = data.net_agirlik || "";
      if (data.antrepo_giris_tarihi) {
        inputAntrepoGirisTarihi.value = data.antrepo_giris_tarihi.substring(0,10);
      }
      inputProformaNo.value          = data.proforma_no || "";
      if (data.proforma_tarihi) {
        inputProformaTarihi.value    = data.proforma_tarihi.substring(0,10);
      }
      inputTicariFaturaNo.value      = data.ticari_fatura_no || "";
      if (data.ticari_fatura_tarihi) {
        inputTicariFaturaTarihi.value= data.ticari_fatura_tarihi.substring(0,10);
      }
      inputDepolamaSuresi.value      = data.depolama_suresi || "";
      inputFaturaMeblagi.value       = data.fatura_meblagi || "";
      inputUrunBirimFiyat.value      = data.urun_birim_fiyat || "";
      if (data.para_birimi) {
        selectParaBirimi.value = data.para_birimi.toString();
      }
      if (inputFaturaAciklama) {
        inputFaturaAciklama.value = data.fatura_aciklama || "";
      }
  
      if (data.sozlesme_id) {
        const foundSoz = allSozlesmeler.find(s => s.id === data.sozlesme_id);
        if (foundSoz) {
          const kod = foundSoz.sozlesme_kodu && foundSoz.sozlesme_kodu.trim() !== "" ? foundSoz.sozlesme_kodu : "Kodsuz";
          inputSozlesme.value = `${kod} - ${foundSoz.sozlesme_adi}`;
        }
      }
      if (data.antrepo_sirket_adi) {
        inputAntrepoSirketi.value = data.antrepo_sirket_adi;
      }
  
      if (mode === "view") {
        const allFields = antrepoForm.querySelectorAll("input, select, textarea, button");
        allFields.forEach(field => {
          if (field.id !== "cancelBtn") {
            field.setAttribute("disabled", true);
          }
        });
        if (saveBtn) {
          saveBtn.style.display = "none";
        }
      }
    } catch (error) {
      console.error("Kayıt yükleme hatası:", error);
    }
  }
  
  if (editId) {
    await loadExistingData(editId);
    const ekList = await fetchEkHizmetler(editId);
    renderEkHizmetler(ekList);
  }
  
  cancelBtn?.addEventListener("click", () => {
    history.back();
  });
  
  /************************************************************
   * 10) Yeni Giriş / Yeni Çıkış Event Listeners (Modal Açma)
   ************************************************************/
  if (newEntryBtn) {
    newEntryBtn.addEventListener("click", () => {
      if (!activeGirisId) {
        alert("Önce antrepo giriş formunu kaydetmelisiniz!");
        return;
      }
      const newEntryModal = document.getElementById("newEntryModal");
      const newEntryForm = document.getElementById("newEntryForm");
      if (newEntryForm) newEntryForm.reset();
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
      const newExitForm = document.getElementById("newExitForm");
      if (newExitForm) newExitForm.reset();
      newExitModal.style.display = "flex";
    });
  }
  
  /************************************************************
   * Yeni Giriş Modal Formu (Tek event listener)
   ************************************************************/
  const newEntryForm = document.getElementById("newEntryForm");
  const entryCancelBtn = document.getElementById("entryCancelBtn");
  
  if (newEntryForm) {
    newEntryForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();
  
      const entryTarih = document.getElementById("modalAntrepoGirisTarihi")?.value;
      const entryMiktar = document.getElementById("modalMiktar")?.value;
      
      // Zorunlu alan kontrolü
      if (!entryTarih || !entryMiktar) {
        alert("Lütfen tarih ve miktar alanlarını doldurun!");
        return;
      }
  
      // Modal formdaki brüt/net ağırlık, kap adedi ve açıklama alanlarını da oku
      const entryBrutAgirlik = parseFloat(document.getElementById("modalBrutAgirlik")?.value) || 0;
      const entryNetAgirlik = parseFloat(document.getElementById("modalNetAgirlik")?.value) || 0;
      const entryKapAdeti = parseInt(document.getElementById("modalKapAdeti")?.value) || 0;
      const entryAciklama = document.getElementById("modalAciklama")?.value || "Yeni Giriş";
      // Toplamı, örneğin brüt + net olarak hesaplayalım
      const toplam = (entryBrutAgirlik + entryNetAgirlik).toFixed(2);
  
      const hareketPayload = {
        islem_tarihi: entryTarih,
        islem_tipi: "Giriş",
        miktar: parseFloat(entryMiktar) || 0,
        brut_agirlik: entryBrutAgirlik,
        net_agirlik: entryNetAgirlik,
        kap_adeti: entryKapAdeti,
        toplam: toplam,
        aciklama: entryAciklama
      };
  
      try {
        const resp = await fetch(`${baseUrl}/api/antrepo-giris/${activeGirisId}/hareketler`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(hareketPayload)
        });
        if (!resp.ok) throw new Error(`Hata: ${resp.status}`);
        const result = await resp.json();
        if (result.success) {
          alert("Yeni giriş eklendi!");
          document.getElementById("newEntryModal").style.display = "none";
          newEntryForm.reset();
          // tabloyu güncelle
          fetchHareketler();
        } else {
          alert("Yeni giriş eklenemedi: " + JSON.stringify(result));
        }
      } catch (error) {
        console.error("Yeni giriş eklenirken hata:", error);
        alert("Hata: " + error.message);
      }
    });
  }
  
  if (entryCancelBtn) {
    entryCancelBtn.addEventListener("click", () => {
      document.getElementById("newEntryModal").style.display = "none";
      newEntryForm.reset();
    });
  }
  
  
  /************************************************************
   * 12) Yeni Çıkış Modal Formu Submit İşlemi
   ************************************************************/
  const newExitForm = document.getElementById("newExitForm");
  const exitCancelBtn = document.getElementById("exitCancelBtn");
  if (newExitForm) {
    newExitForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();
  
      const exitTarih = document.getElementById("modalExitTarih")?.value;
      const exitMiktar = document.getElementById("modalExitMiktar")?.value;
      const exitKapAdeti = document.getElementById("modalExitKapAdeti")?.value;
      const exitBrut = document.getElementById("modalExitBrutAgirlik")?.value;
      const exitNet = document.getElementById("modalExitNetAgirlik")?.value;
  
      if (!exitTarih || !exitMiktar) {
        alert("Lütfen tarih ve miktar alanlarını doldurun!");
        return;
      }
  
      // Ek bilgiler
      const satProformaNo = document.getElementById("modalSatProformaNo")?.value;
      const satFaturaNo = document.getElementById("modalSatFaturaNo")?.value;
      const musteri = document.getElementById("modalMusteri")?.value;
      const teslimYeri = document.getElementById("modalTeslimYeri")?.value;
      const nakliyeFirma = document.getElementById("modalNakliyeFirma")?.value;
      const aracPlaka = document.getElementById("modalAracPlaka")?.value;
      const teslimSekli = document.getElementById("modalTeslimSekli")?.value;
  
      const exitMesai = document.getElementById("modalExitMesai")?.value;
      const exitIsWeekend = document.getElementById("modalExitIsWeekend")?.value;
  
      const ekBilgi = 
        `Satış Proforma No: ${satProformaNo || '-'}\n` +
        `Satış Fatura No: ${satFaturaNo || '-'}\n` +
        `Müşteri: ${musteri || '-'}\n` +
        `Teslim Yeri: ${teslimYeri || '-'}\n` +
        `Nakliye Firması: ${nakliyeFirma || '-'}\n` +
        `Araç Plakası/Sırt Numarası: ${aracPlaka || '-'}\n` +
        `Teslim Şekli: ${teslimSekli || '-'}`;
      const mesaiBilgi = exitMesai ? `\nMesai Süresi: ${exitMesai} dakika, Hafta Sonu: ${exitIsWeekend === "true" ? "Evet" : "Hayır"}` : "";
      const finalAciklama = ekBilgi + mesaiBilgi;
  
      const bodyData = {
        islem_tarihi: exitTarih,
        islem_tipi: "Çıkış",
        miktar: parseFloat(exitMiktar) || 0,
        kap_adeti: parseInt(exitKapAdeti) || 0,
        brut_agirlik: parseFloat(exitBrut) || 0,
        net_agirlik: parseFloat(exitNet) || 0,
        birim_id: 1,
        aciklama: finalAciklama
      };
  
      try {
        const resp = await fetch(`${baseUrl}/api/antrepo-giris/${activeGirisId}/hareketler`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData)
        });
        if (!resp.ok) throw new Error(`Hata: ${resp.status}`);
        const result = await resp.json();
        if (result.success) {
          alert("Yeni çıkış hareketi eklendi!");
          document.getElementById("newExitModal").style.display = "none";
          newExitForm.reset();
          fetchHareketler();
        } else {
          alert("Yeni çıkış hareketi eklenemedi: " + JSON.stringify(result));
        }
      } catch (error) {
        console.error("Yeni çıkış hareketi eklenirken hata:", error);
        alert("Hata: " + error.message);
      }
    });
  }
  if (exitCancelBtn) {
    exitCancelBtn.addEventListener("click", () => {
      document.getElementById("newExitModal").style.display = "none";
      newExitForm.reset();
    });
  }
  
  // Sayfa açıldığında hareketleri getir
  fetchHareketler();

  // Clear butonlarını ayarla
  document.getElementById("clearAntrepoAdBtn")?.addEventListener("click", () => {
    inputAntrepoAd.value = "";
    inputAntrepoKodu.value = "";
    inputAdres.value = "";
    inputSehir.value = "";
    inputGumruk.value = "";
    inputAntrepoAd.focus();
  });

  document.getElementById("clearAntrepoKoduBtn")?.addEventListener("click", () => {
    inputAntrepoAd.value = "";
    inputAntrepoKodu.value = "";
    inputAdres.value = "";
    inputSehir.value = "";
    inputGumruk.value = "";
    inputAntrepoKodu.focus();
  });

  document.getElementById("clearUrunTanimiBtn")?.addEventListener("click", () => {
    inputUrunTanimi.value = "";
    inputUrunKodu.value = "";
    inputPaketBoyutu.value = "";
    inputPaketlemeTipi.value = "";
    inputUrunTanimi.focus();
  });

  document.getElementById("clearUrunKoduBtn")?.addEventListener("click", () => {
    inputUrunTanimi.value = "";
    inputUrunKodu.value = "";
    inputPaketBoyutu.value = "";
    inputPaketlemeTipi.value = "";
    inputUrunKodu.focus();
  });
});

// Tüm searchable datalist'ler için arama ve temizleme fonksiyonlarını ekle
document.addEventListener('DOMContentLoaded', function() {
  // Tüm aranabilir datalist'leri seç
  const searchableDataLists = document.querySelectorAll('.searchable-datalist');

  searchableDataLists.forEach(input => {
    const datalistId = input.getAttribute('list');
    const datalist = document.getElementById(datalistId);
    const clearBtn = input.nextElementSibling.nextElementSibling;
    const allOptions = []; // Orijinal options'ları sakla

    // Başlangıçtaki options'ları sakla
    if (datalist) {
      datalist.querySelectorAll('option').forEach(opt => {
        allOptions.push({
          value: opt.value,
          label: opt.label || opt.value
        });
      });
    }

    // Input'a her yazıldığında filtreleme yap
    input.addEventListener('input', function(e) {
      const searchText = this.value.toLowerCase();
      
      // Datalist'i temizle
      while (datalist.firstChild) {
        datalist.removeChild(datalist.firstChild);
      }

      // Filtrelenmiş sonuçları ekle
      allOptions.forEach(opt => {
        if (opt.label.toLowerCase().includes(searchText)) {
          const option = document.createElement('option');
          option.value = opt.value;
          option.label = opt.label;
          datalist.appendChild(option);
        }
      });
    });

    // Clear button'una tıklanınca
    clearBtn.addEventListener('click', function() {
      input.value = '';
      input.focus();
      
      // Tüm options'ları geri yükle
      while (datalist.firstChild) {
        datalist.removeChild(datalist.firstChild);
      }
      allOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.label = opt.label;
        datalist.appendChild(option);
      });

      // Custom event tetikle (değişiklikleri yakalamak için)
      input.dispatchEvent(new Event('change'));
    });
  });
});

// Para Birimi select kutusunu başlat - Dosyanın başlangıç kısmına ekle
$(document).ready(function() {
  // Para Birimi select kutusunu başlat
  $('#paraBirimi').select2({
    placeholder: "Para birimi seçiniz...",
    allowClear: true,
    width: '100%'
  });
  
  // Para birimini zorunlu hale getir (required attribute kontrolü)
  $('#antrepoForm').on('submit', function(e) {
    const parabirimi = $('#paraBirimi').val();
    if (!parabirimi) {
      e.preventDefault();
      alert('Lütfen para birimi seçiniz!');
      $('#paraBirimi').focus();
      return false;
    }
  });
});
