/*******************************************************
 * File: antrepo-giris.js
 * Amaç: Antrepo Giriş Formu sayfasında;
 *  1) Temel antrepo giriş verilerini yönetmek (kayıt/güncelleme)
 *  2) Yeni Giriş / Yeni Çıkış modalları ile antrepo_hareketleri kaydetmek
 *  3) Ek Hizmetler (Birinci Modal) ile ek hizmet seçmek
 *  4) Yeni Hizmet Ekle / Düzenle (İkinci Modal) ile hizmetler tablosuna kayıt
 *******************************************************/

import { baseUrl } from './config.js';

// Global değişkenler
let activeGirisId = null;
let selectedUrunId = null;

let allSozlesmeler = [];
let allSirketler = [];
let allAntrepolar = [];
let allUrunler = [];
let allParaBirimleri = [];
let allHizmetler = [];
let allBirimler = [];
let ekHizmetlerData = [];

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

/* DOMContentLoaded */
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
    updateDatalist(urunTanimiList, allUrunler, u => u.name);
    updateDatalist(urunKoduList, allUrunler, u => u.code);
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
    newHizmetBirim.innerHTML = `<option value="" disabled selected>Seçiniz</option>`;
    allBirimler.forEach(b => {
      const opt = document.createElement("option");
      opt.value = b.id.toString();
      opt.textContent = b.birim_adi;
      newHizmetBirim.appendChild(opt);
    });
  }
  function populateNewHizmetParaBirimi() {
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
    hareketTableBody.innerHTML = "";
    list.forEach(item => {
      const tr = document.createElement("tr");
      // Hücreleri oluştur (tarih, işlem tipi, miktar, kap adedi, brüt, net, birim, açıklama)
      ["islem_tarihi", "islem_tipi", "miktar", "kap_adeti", "brut_agirlik", "net_agirlik", "birim_adi", "aciklama"].forEach(field => {
        const td = document.createElement("td");
        let value = item[field] || "";
        if (field === "islem_tarihi" && value) value = value.substring(0, 10);
        td.textContent = value;
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
    ekHizmetlerTableBody.innerHTML = "";
    list.forEach(item => {
      const tr = document.createElement("tr");
      const tdTarih = document.createElement("td");
      tdTarih.textContent = item.ek_hizmet_tarihi ? item.ek_hizmet_tarihi.substring(0, 10) : "";
      tr.appendChild(tdTarih);
      // Diğer hücreler: hizmet adı, adet, temel ücret, çarpan, toplam, açıklama
      ["hizmet_adi", "adet", "temel_ucret", "carpan", "toplam", "aciklama"].forEach(field => {
        const td = document.createElement("td");
        td.textContent = item[field] || "";
        tr.appendChild(td);
      });
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

  // Onay Modalı
  let itemToDeleteId = null, deleteType = "";
  function showConfirmModal(id, type) {
    itemToDeleteId = id;
    deleteType = type;
    const confirmModal = document.getElementById("confirmModal");
    const confirmHeader = confirmModal.querySelector(".confirm-modal-header");
    confirmHeader.textContent =
      type === "hareket" ? "Hareket kaydı silinecek!" : "Ek hizmet kaydı silinecek!";
    confirmModal.style.display = "flex";
  }
  document.getElementById("confirmNo")?.addEventListener("click", () => {
    document.getElementById("confirmModal").style.display = "none";
    itemToDeleteId = null;
    deleteType = "";
  });
  document.getElementById("confirmYes")?.addEventListener("click", () => {
    document.getElementById("confirmModal").style.display = "none";
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
  // Clear butonları (duble olanları ortak alıyoruz)
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
    if (!lowerVal) {
      inputAntrepoAd.value = "";
      inputAntrepoKodu.value = "";
      inputAdres.value = "";
      inputSehir.value = "";
      inputGumruk.value = "";
      return;
    }
    const found = allAntrepolar.find(a =>
      isName ? a.antrepoAdi.toLowerCase() === lowerVal : a.antrepoKodu.toLowerCase() === lowerVal
    );
    if (found) {
      inputAntrepoAd.value = found.antrepoAdi || "";
      inputAntrepoKodu.value = found.antrepoKodu || "";
      inputAdres.value = found.acikAdres || "";
      inputSehir.value = found.sehir || "";
      inputGumruk.value = found.gumruk || "";
    } else {
      inputAntrepoAd.value = "";
      inputAntrepoKodu.value = "";
      inputAdres.value = "";
      inputSehir.value = "";
      inputGumruk.value = "";
    }
  }
  inputAntrepoAd.addEventListener("input", () => handleAntrepoInput(inputAntrepoAd.value, true));
  inputAntrepoKodu.addEventListener("input", () => handleAntrepoInput(inputAntrepoKodu.value, false));
  inputAntrepoAd.addEventListener("change", () => inputAntrepoAd.dispatchEvent(new Event("input")));
  inputAntrepoKodu.addEventListener("change", () => inputAntrepoKodu.dispatchEvent(new Event("input")));

  /************************************************************
   * 6) Ürün Tanımı / Kodu Eventleri
   ************************************************************/
  inputUrunKodu.addEventListener("input", () => {
    const userInput = inputUrunKodu.value.trim().toLowerCase();
    if (!userInput) {
      inputUrunTanimi.value = "";
      inputPaketBoyutu.value = "";
      inputPaketlemeTipi.value = "";
      return;
    }
    const found = allUrunler.find(u => u.code.toLowerCase() === userInput);
    if (found) {
      inputUrunTanimi.value = found.name || "";
      inputPaketBoyutu.value = found.paket_hacmi ? found.paket_hacmi + " Kg" : "";
      inputPaketlemeTipi.value = found.paketleme_tipi_name || "";
    } else {
      inputUrunTanimi.value = "";
      inputPaketBoyutu.value = "";
      inputPaketlemeTipi.value = "";
    }
  });
  inputUrunTanimi.addEventListener("change", () => inputUrunTanimi.dispatchEvent(new Event("input")));
  inputUrunKodu.addEventListener("change", () => inputUrunKodu.dispatchEvent(new Event("input")));

  // Paketleme Tipi değiştiğinde paket boyutlarını getir
  inputPaketlemeTipi.addEventListener("change", async () => {
    const paketlemeTipiId = inputPaketlemeTipi.value;
    if (!selectedUrunId || !paketlemeTipiId) {
      resetPaketBoyutu();
      return;
    }
    const url = `${baseUrl}/api/urun_varyantlari?urunId=${selectedUrunId}&paketlemeTipi=${paketlemeTipiId}`;
    try {
      const data = await (await fetch(url)).json();
      inputPaketBoyutu.innerHTML = "";
      data.forEach(item => {
        const opt = document.createElement("option");
        opt.value = item.paket_hacmi;
        opt.textContent = item.paket_hacmi + " Kg";
        inputPaketBoyutu.appendChild(opt);
      });
      if (data.length === 0) console.log("Bu ürün + paket tipi için paket boyutu bulunamadı.");
    } catch (error) {
      console.error("Paket boyutu listesi hatası:", error);
      alert("Paket boyutları yüklenirken bir hata oluştu!");
    }
  });

  /************************************************************
   * 7) EK HİZMETLER MODALI İşlemleri
   ************************************************************/
  if (ekHizmetlerBtn) {
    ekHizmetlerBtn.addEventListener("click", () => {
      populateModalHizmetParaBirimi();
      populateModalHizmetSelect(allHizmetler);
      clearEkHizmetModalFields();
      ekHizmetModal.style.display = "flex";
      ekHizmetModal.classList.add("active");
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
    if (clearSelect) modalHizmetSelect.value = "";
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
    newHizmetModal.style.display = "flex";
    newHizmetModal.classList.add("active");
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
    newHizmetModal.style.display = "none";
    newHizmetModal.classList.remove("active");
    clearNewHizmetForm();
  });

  /************************************************************
   * 8) Form Submit (Antrepo Giriş Kaydet)
   ************************************************************/
  antrepoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Kaydet butonunu devre dışı bırak (çift gönderimi engeller)
    const saveBtn = document.getElementById("saveBtn");
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
      
      // Varyant ID'sini bulma
      let urunVaryantId = null;
      const urunKodu = inputUrunKodu.value;
      const paketlemeTipiId = document.getElementById('paketlemeTipi')?.value;
      const paketBoyutu = document.getElementById('paketBoyutu')?.value;
      
      if (urunKodu && paketlemeTipiId && paketBoyutu) {
        try {
          const variantResponse = await fetch(
            `${baseUrl}/api/find-variant?urunKodu=${encodeURIComponent(urunKodu)}&paketlemeTipiId=${paketlemeTipiId}&paketBoyutu=${paketBoyutu}`
          );
          
          if (variantResponse.ok) {
            const variantData = await variantResponse.json();
            urunVaryantId = variantData.variantId;
          }
        } catch (variantError) {
          console.error("Varyant ID bulunamadı:", variantError);
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
        urun_tanimi: inputUrunTanimi.value,
        urun_kodu: inputUrunKodu.value,
        paket_boyutu: inputPaketBoyutu.value,
        paketleme_tipi: inputPaketlemeTipi.value,
        miktar: parseFloat(inputMiktar.value) || 0,
        kap_adeti: parseInt(inputKapAdeti.value) || 0,
        brut_agirlik: parseFloat(inputBrutAgirlik.value) || 0,
        net_agirlik: parseFloat(inputNetAgirlik.value) || 0,
        antrepo_giris_tarihi: inputAntrepoGirisTarihi.value,
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
        // checkboxIlkGiris değerini kontrol ederek ekle, eğer yoksa varsayılan değeri kullan
        ilk_giris: checkboxIlkGiris && checkboxIlkGiris.checked ? true : false,
        urun_varyant_id: urunVaryantId // Yeni eklenen varyant ID'si
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
        // Başarılı kayıt sonrası liste sayfasına yönlendir
        window.location.href = "antrepo-giris-form-list.html";
      } else {
        alert(`Kayıt hatası: ${result.message || "Bilinmeyen hata"}`);
        // Hata durumunda butonu tekrar etkinleştir
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Kaydet";
        }
      }
    } catch (error) {
      console.error("Form gönderimi sırasında hata:", error);
      alert(`Hata: ${error.message}`);
      // Hata durumunda butonu tekrar etkinleştir
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
      activeGirisId = id;
      const data = await fetchData(
        `${baseUrl}/api/antrepo-giris/${id}`,
        "Veri çekme hatası"
      );
      
      // Form alanlarını doldur
      inputBeyannameFormTarihi.value = data.beyanname_form_tarihi ? data.beyanname_form_tarihi.substring(0,10) : "";
      inputBeyannameNo.value = data.beyanname_no || "";
      inputAntrepoAd.value = data.antrepo_adi || "";
      inputAntrepoKodu.value = data.antrepo_kodu || "";
      inputAdres.value = data.adres || "";
      inputSehir.value = data.sehir || "";
      inputGumruk.value = data.gumruk || "";
      inputUrunTanimi.value = data.urun_tanimi || "";
      inputUrunKodu.value = data.urun_kodu || "";
      
      // Ürün ID'sini bul
      const urun = allUrunler.find(u => u.name === data.urun_tanimi || u.code === data.urun_kodu);
      if (urun) {
        selectedUrunId = urun.id;
        console.log(`Ürün bulundu: ${urun.name, urun.id}`);
      } else {
        console.warn("Ürün bulunamadı:", data.urun_tanimi, data.urun_kodu);
      }

      inputMiktar.value = data.miktar || "";
      inputKapAdeti.value = data.kap_adeti || "";
      inputBrutAgirlik.value = data.brut_agirlik || "";
      inputNetAgirlik.value = data.net_agirlik || "";
      if (data.antrepo_giris_tarihi) inputAntrepoGirisTarihi.value = data.antrepo_giris_tarihi.substring(0,10);
      inputProformaNo.value = data.proforma_no || "";
      if (data.proforma_tarihi) inputProformaTarihi.value = data.proforma_tarihi.substring(0,10);
      inputTicariFaturaNo.value = data.ticari_fatura_no || "";
      if (data.ticari_fatura_tarihi) inputTicariFaturaTarihi.value = data.ticari_fatura_tarihi.substring(0,10);
      inputDepolamaSuresi.value = data.depolama_suresi || "";
      inputFaturaMeblagi.value = data.fatura_meblagi || "";
      inputUrunBirimFiyat.value = data.urun_birim_fiyat || "";
      if (data.para_birimi) {
        selectParaBirimi.value = data.para_birimi.toString();
        $(selectParaBirimi).trigger('change'); // Select2 güncelleme
      }
      if (inputFaturaAciklama) inputFaturaAciklama.value = data.fatura_aciklama || "";
      
      // Sözleşme ve şirket bilgilerini doldur
      if (data.sozlesme_id) {
        const foundSoz = allSozlesmeler.find(s => s.id === data.sozlesme_id);
        if (foundSoz) {
          const code = foundSoz.sozlesme_kodu && foundSoz.sozlesme_kodu.trim() !== "" ? foundSoz.sozlesme_kodu : "Kodsuz";
          inputSozlesme.value = `${code} - ${foundSoz.sozlesme_adi}`;
        }
      }
      if (data.antrepo_sirket_adi) {
        inputAntrepoSirketi.value = data.antrepo_sirket_adi;
      }
      
      // Görüntüleme modu kontrolü
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get("mode");
      if (mode === "view") {
        antrepoForm.querySelectorAll("input, select, textarea, button").forEach(field => {
          if (field.id !== "cancelBtn") field.disabled = true;
        });
        if (saveBtn) saveBtn.style.display = "none";
        if (newEntryBtn) newEntryBtn.disabled = true;
        if (newExitBtn) newExitBtn.disabled = true;
        if (ekHizmetlerBtn) ekHizmetlerBtn.disabled = true;
        [newEntryBtn, newExitBtn, ekHizmetlerBtn].forEach(btn => {
          if (btn) btn.classList.add("disabled");
        });
        const sectionHeaders = document.querySelectorAll(".section-header");
        sectionHeaders.forEach(header => {
          header.classList.add("view-mode");
        });
        const pageHeader = document.querySelector(".page-header h1");
        if (pageHeader) {
          pageHeader.textContent = "Antrepo Giriş Formu (Görüntüleme)";
        }
      }

      // Paketleme tipi ve paket boyutu seçeneklerini yükleme ve seçme işlemi
      try {
        // Önce paketleme tipi için tüm seçenekleri yükle
        if (selectedUrunId) {
          // Paketleme tiplerini getir ve select2'yu doldur
          await loadPackagingTypes(selectedUrunId);
          
          // Veritabanında kayıtlı değerleri seç
          if (data.paketleme_tipi && $('#paketlemeTipi').length > 0) {
            // Mevcut paketleme tipini bul
            const packagingType = Array.from($('#paketlemeTipi')[0].options).find(option => 
              option.text.toLowerCase() === data.paketleme_tipi.toLowerCase()
            );
            
            if (packagingType) {
              console.log(`Paketleme tipi eşleşti: ${packagingType.text}, value: ${packagingType.value}`);
              $('#paketlemeTipi').val(packagingType.value);
              $('#paketlemeTipi').trigger('change');
              
              // Paketleme tipi seçildikten sonra paket boyutlarını yükle
              setTimeout(async () => {
                await loadPackageSizes(selectedUrunId, packagingType.value);
                
                if (data.paket_boyutu) {
                  // Paket boyutunu temizle ve sayısal değeri al
                  let boyut = data.paket_boyutu.replace(/[^\d.]/g, '');
                  console.log(`Paket boyutu aranıyor: ${boyut}`);
                  
                  // Seçenekleri kontrol et ve varsa seç
                  if ($('#paketBoyutu').length > 0) {
                    const sizeOption = Array.from($('#paketBoyutu')[0].options).find(option => 
                      option.value === boyut || option.text.includes(boyut)
                    );
                    
                    if (sizeOption) {
                      console.log(`Paket boyutu eşleşti: ${sizeOption.text}, value: ${sizeOption.value}`);
                      $('#paketBoyutu').val(sizeOption.value).trigger('change');
                    } else {
                      console.warn(`Paket boyutu eşleşmedi: ${boyut}`);
                      // Veri tabanındaki değere en yakın boyutu bul
                      $('#paketBoyutu').append(new Option(`${boyut} Kg (Özel)`, boyut));
                      $('#paketBoyutu').val(boyut).trigger('change');
                    }
                  }
                }
              }, 500);
            } else {
              console.warn(`Paketleme tipi eşleşmedi: ${data.paketleme_tipi}`);
              // Eğer veri tabanında kaydedilen değer Select2'de yoksa, yeni bir seçenek olarak ekle
              $('#paketlemeTipi').append(new Option(data.paketleme_tipi, 'custom_type'));
              $('#paketlemeTipi').val('custom_type').trigger('change');
            }
          }
        }
      } catch (error) {
        console.error("Paketleme tipi/boyutu yüklenirken hata:", error);
      }
      
    } catch (error) {
      console.error("Kayıt yükleme hatası:", error);
      alert("Kayıt yüklenirken bir hata oluştu! Lütfen daha sonra tekrar deneyiniz.");
    }
  }

  // Yeni yardımcı fonksiyonlar: Paketleme tiplerini ve paket boyutlarını yükle
  async function loadPackagingTypes(urunId) {
    try {
      console.log(`Paketleme tiplerini yüklüyorum, ürün ID: ${urunId}`);
      const response = await fetch(`${baseUrl}/api/urun_varyantlari?urunId=${urunId}`);
      if (!response.ok) {
        throw new Error(`API yanıtı başarısız: ${response.status}`);
      }
      
      const variants = await response.json();
      console.log("Paketleme tipleri yüklendi:", variants);
      
      // Select2 dropdown'ı temizle ve doldur
      $('#paketlemeTipi').empty().append('<option value="">Seçiniz...</option>');
      
      // Benzersiz paketleme tiplerini çıkar
      const uniqueTypes = [];
      variants.forEach(variant => {
        if (!uniqueTypes.some(t => t.id === variant.paketleme_tipi_id)) {
          uniqueTypes.push({
            id: variant.paketleme_tipi_id,
            name: variant.paketleme_tipi_name
          });
        }
      });
      
      // Paketleme tiplerini dropdown'a ekle
      uniqueTypes.forEach(type => {
        $('#paketlemeTipi').append(new Option(type.name, type.id));
      });
      
      return uniqueTypes;
    } catch (error) {
      console.error("Paketleme tipleri yüklenirken hata:", error);
      return [];
    }
  }

  async function loadPackageSizes(urunId, paketlemeTipiId) {
    try {
      console.log("DEBUG: Parametre değerleri - urunId:", urunId, "paketlemeTipiId:", paketlemeTipiId);

      // Parametre eşleşmesi sorunu için düzeltme:
      // 1. Parametrelerin sayı olduğundan emin olalım
      const numericUrunId = typeof urunId === 'string' ? parseInt(urunId, 10) : urunId;
      const numericTipId = typeof paketlemeTipiId === 'string' ? parseInt(paketlemeTipiId, 10) : paketlemeTipiId;
      
      // 2. Parametre ismini API beklentilerine göre düzeltelim
      // API dokümanlarından veya Network tabından doğru parametre ismini kontrol edin
      const url = `${baseUrl}/api/urun_varyantlari?urunId=${numericUrunId}&paketlemeTipiId=${numericTipId}`;
      console.log("API İstek URL (düzeltilmiş):", url);
      
      // Alternatif URL formatları (eğer yukarıdaki çalışmazsa bunları deneyin)
      const altUrls = [
        `${baseUrl}/api/urun_varyantlari?urunId=${numericUrunId}&paketlemeTipi=${numericTipId}`,
        `${baseUrl}/api/urun_varyantlari?urunId=${numericUrunId}&paketleme_tipi_id=${numericTipId}`
      ];
      
      console.log("Deneniyor: ", url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API yanıtı başarısız: ${response.status}, ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log("API ham yanıt:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Veri türü:", Array.isArray(data) ? "Array" : typeof data);
      } catch (jsonError) {
        console.error("JSON parse hatası:", jsonError);
        throw new Error("API yanıtı geçerli JSON değil");
      }

      // Yanıt boş ise alternatif URL'leri deneyelim
      if (Array.isArray(data) && data.length === 0) {
        console.log("İlk URL boş sonuç döndürdü, alternatif URL'leri deniyorum...");
        
        for (const altUrl of altUrls) {
          try {
            console.log("Alternatif deneniyor:", altUrl);
            const altResponse = await fetch(altUrl);
            if (!altResponse.ok) continue;
            
            const altText = await altResponse.text();
            if (!altText || altText === "[]") continue;
            
            const altData = JSON.parse(altText);
            if (Array.isArray(altData) && altData.length > 0) {
              console.log("Alternatif URL başarılı:", altUrl);
              data = altData;
              break;
            }
          } catch (e) {
            console.log("Bu alternatif başarısız:", e.message);
          }
        }
      }
      
      // Select2 dropdown'ını temizle ve hazırla
      $('#paketBoyutu').empty();
      $('#paketBoyutu').append(new Option("Seçiniz...", ""));
      
      // Veri hâlâ boş mu kontrol et
      if (!data || (Array.isArray(data) && data.length === 0)) {
        console.warn("Bu ürün ve paketleme tipi kombinasyonu için paket boyutu bulunamadı");
        $('#paketBoyutu').trigger('change.select2');
        return [];
      }
      
      // Veri işleme - farklı JSON formatlarını destekle
      try {
        if (Array.isArray(data)) {
          data.forEach(item => {
            // Format 1: { paket_hacmi: "5.0" }
            if (item && typeof item.paket_hacmi !== 'undefined') {
              const hacim = item.paket_hacmi;
              console.log(`Paket boyutu ekleniyor: ${hacim} Kg`);
              $('#paketBoyutu').append(new Option(`${hacim} Kg`, hacim));
            }
            // Format 2: { hacim: "5.0" } 
            else if (item && typeof item.hacim !== 'undefined') {
              const hacim = item.hacim;
              console.log(`Format 2 - Paket boyutu ekleniyor: ${hacim} Kg`);
              $('#paketBoyutu').append(new Option(`${hacim} Kg`, hacim));
            }
            // Format 3: Direk string dizisi ["5.0", "10.0"]
            else if (typeof item === 'string' || typeof item === 'number') {
              const hacim = item;
              console.log(`Format 3 - Paket boyutu ekleniyor: ${hacim} Kg`);
              $('#paketBoyutu').append(new Option(`${hacim} Kg`, hacim));
            }
          });
        } else if (typeof data === 'object') {
          // Format 4: Obje formatı (erişim yöntemi değişebilir)
          if (data.results && Array.isArray(data.results)) {
            data.results.forEach(item => {
              const hacim = item.paket_hacmi || item.hacim || item;
              console.log(`Format 4 - Paket boyutu ekleniyor: ${hacim} Kg`);
              $('#paketBoyutu').append(new Option(`${hacim} Kg`, hacim));
            });
          }
        }
      } catch (processError) {
        console.error("Veri işleme hatası:", processError);
      }
      
      // Select2'yi yenile
      try {
        $('#paketBoyutu').select2('destroy').select2({
          placeholder: 'Paket Boyutu Seçin',
          allowClear: true,
          width: '100%'
        });
      } catch (select2Error) {
        console.error("Select2 yenileme hatası:", select2Error);
        $('#paketBoyutu').trigger('change');
      }
      
      console.log("Eklenen paket boyutları:", Array.from($('#paketBoyutu option')).map(o => o.value));
      
      return data;
    } catch (error) {
      console.error("Paket boyutları yüklenirken hata:", error);
      return [];
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
  if (newEntryForm) {
    newEntryForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const entryTarih = document.getElementById("modalAntrepoGirisTarihi")?.value;
      const entryMiktar = document.getElementById("modalMiktar")?.value;
      if (!entryTarih || !entryMiktar) {
        alert("Lütfen tarih ve miktar alanlarını doldurun!");
        return;
      }
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
      try {
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
  if (newExitForm) {
    newExitForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const exitTarih = document.getElementById("modalExitTarih")?.value;
      const exitMiktar = document.getElementById("modalExitMiktar")?.value;
      const exitKapAdeti = document.getElementById("modalExitKapAdeti")?.value;
      const exitBrut = document.getElementById("modalExitBrutAgirlik")?.value;
      const exitNet = document.getElementById("modalExitNetAgirlik")?.value;
      if (!exitTarih || !exitMiktar) {
        alert("Lütfen tarih ve miktar alanlarını doldurun!");
        return;
      }
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

  /************************************************************
   * 11) Alanları Temizleme Butonları (Clear)
   ************************************************************/
  addClearEvent(document.getElementById("clearAntrepoAdBtn"), [inputAntrepoAd, inputAntrepoKodu, inputAdres, inputSehir, inputGumruk], inputAntrepoAd);
  addClearEvent(document.getElementById("clearAntrepoKoduBtn"), [inputAntrepoAd, inputAntrepoKodu, inputAdres, inputSehir, inputGumruk], inputAntrepoKodu);
  addClearEvent(document.getElementById("clearUrunTanimiBtn"), [inputUrunTanimi, inputUrunKodu, inputPaketBoyutu, inputPaketlemeTipi], inputUrunTanimi);
  addClearEvent(document.getElementById("clearUrunKoduBtn"), [inputUrunTanimi, inputUrunKodu, inputPaketBoyutu, inputPaketlemeTipi], inputUrunKodu);

  /************************************************************
   * 12) Select2 ve Diğer Başlatmalar
   ************************************************************/
  $(document).ready(function () {
    $('#paketlemeTipi').select2({ placeholder: 'Paketleme Tipi Seçin', allowClear: true, width: '100%' });
    $('#paketBoyutu').select2({ placeholder: 'Paket Boyutu Seçin', allowClear: true, width: '100%' });
    $('#paraBirimi').select2({ placeholder: "Para birimi seçiniz...", allowClear: true, width: '100%' });
    $('#antrepoForm').on('submit', function (e) {
      if (!$('#paraBirimi').val()) {
        e.preventDefault();
        alert('Lütfen para birimi seçiniz!');
        $('#paraBirimi').focus();
      }
    });
  });
  function resetPaketlemeTipi() {
    $('#paketlemeTipi').empty().append('<option value="">Seçiniz...</option>').trigger('change');
  }
  function resetPaketBoyutu() {
    $('#paketBoyutu').empty().append('<option value="">Seçiniz...</option>').trigger('change');
  }

  // Ürün seçildiğinde varyant verilerini çek ve paketleme tiplerini güncelle
  $('#urunTanimi').on('change', async function () {
    const urunAdi = $(this).val();
    if (!urunAdi) {
      resetPaketlemeTipi();
      resetPaketBoyutu();
      return;
    }
    
    try {
      // Ürün verilerini getir
      const urun = allUrunler.find(u => u.name === urunAdi);
      if (!urun) {
        resetPaketlemeTipi();
        resetPaketBoyutu();
        return;
      }
      
      selectedUrunId = urun.id;
      $('#urunKodu').val(urun.code || "");
      
      // Paketleme tiplerini yükle
      await loadPackagingTypes(urun.id);
      
    } catch (error) {
      console.error('Ürün seçilirken hata:', error);
      resetPaketlemeTipi();
      resetPaketBoyutu();
    }
  });

  // Paketleme Tipi seçildiğinde paket boyutlarını çek (düzeltilmiş)
  $('#paketlemeTipi').on('change', function() {
    const paketlemeTipiId = $(this).val();
    
    // Detaylı loglama ekleyelim
    console.log("DEBUG: Paketleme Tipi changed to:", paketlemeTipiId);
    console.log("DEBUG: Current selectedUrunId:", selectedUrunId);
    console.log("DEBUG: Typeof paketlemeTipiId:", typeof paketlemeTipiId);
    console.log("DEBUG: Typeof selectedUrunId:", typeof selectedUrunId);
    
    // Önce paket boyutu seçeneğini sıfırla
    resetPaketBoyutu();
    
    // Seçim yapılmadıysa veya ürün ID'si yoksa işlem yapma
    if (!paketlemeTipiId || !selectedUrunId) {
      console.log("Paketleme tipi veya ürün seçilmedi", {paketlemeTipiId, selectedUrunId});
      return;
    }
    
    console.log(`Paketleme tipi değişti: ${paketlemeTipiId}, ürün ID: ${selectedUrunId}`);
    
    // API çağrısı için async IIFE kullan
    (async function() {
      try {
        await loadPackageSizes(selectedUrunId, paketlemeTipiId);
      } catch (error) {
        console.error('Paket boyutları yüklenirken hata:', error);
        alert('Paket boyutları yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    })();
  });

  // Tüm searchable datalist'ler için arama ve temizleme
  document.querySelectorAll('.searchable-datalist').forEach(input => {
    const datalistId = input.getAttribute('list');
    const datalist = document.getElementById(datalistId);
    const clearBtn = input.nextElementSibling?.nextElementSibling;
    const allOptions = [];
    if (datalist) {
      datalist.querySelectorAll('option').forEach(opt => {
        allOptions.push({ value: opt.value, label: opt.label || opt.value });
      });
    }
    input.addEventListener('input', function () {
      const searchText = this.value.toLowerCase();
      datalist.innerHTML = "";
      allOptions.forEach(opt => {
        if (opt.label.toLowerCase().includes(searchText)) {
          const option = document.createElement('option');
          option.value = opt.value;
          option.label = opt.label;
          datalist.appendChild(option);
        }
      });
    });
    clearBtn?.addEventListener('click', function () {
      input.value = '';
      input.focus();
      datalist.innerHTML = "";
      allOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.label = opt.label;
        datalist.appendChild(option);
      });
      input.dispatchEvent(new Event('change'));
    });
  });

  // Varyant Ekle butonuna tıklama
  document.getElementById('addVariantBtn')?.addEventListener('click', () => {
    const urunAdi = document.getElementById('urunTanimi').value;
    const paketlemeTipiId = document.getElementById('paketlemeTipi').value;
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
    if (paketlemeTipiId) url += `&paketlemeTipiId=${paketlemeTipiId}`;
    window.open(url, '_blank');
  });

  // Yenile butonları
  document.getElementById('refreshPaketlemeBtn')?.addEventListener('click', async () => {
    const urunAdi = document.getElementById('urunTanimi').value;
    if (!urunAdi) {
      alert('Önce ürün seçmelisiniz!');
      return;
    }
    await refreshPaketlemeTipleri(urunAdi);
  });
  document.getElementById('refreshBoyutBtn')?.addEventListener('click', async () => {
    const urunAdi = document.getElementById('urunTanimi').value;
    const paketlemeTipiId = document.getElementById('paketlemeTipi').value;
    if (!urunAdi || !paketlemeTipiId) {
      alert('Ürün ve paketleme tipi seçmelisiniz!');
      return;
    }
    await refreshPaketBoyutlari(urunAdi, paketlemeTipiId);
  });
  async function refreshPaketlemeTipleri(urunAdi) {
    try {
      const urun = allUrunler.find(u => u.name === urunAdi);
      if (!urun || !urun.id) {
        alert('Geçerli bir ürün seçiniz!');
        return;
      }
      const currentPaketlemeTipiId = $('#paketlemeTipi').val();
      const response = await fetch(`${baseUrl}/api/urun_varyantlari?urunId=${urun.id}`);
      const variants = await response.json();
      updatePaketlemeTipiOptions(variants);
      if (currentPaketlemeTipiId) $('#paketlemeTipi').val(currentPaketlemeTipiId).trigger('change');
      const btn = document.getElementById('refreshPaketlemeBtn');
      btn.classList.add('success');
      setTimeout(() => btn.classList.remove('success'), 1000);
    } catch (error) {
      console.error('Paketleme tipleri yüklenirken hata:', error);
      alert('Paketleme tipleri yüklenirken bir hata oluştu!');
    }
  }
  async function refreshPaketBoyutlari(urunAdi, paketlemeTipiId) {
    try {
      const urun = allUrunler.find(u => u.name === urunAdi);
      if (!urun || !urun.id) {
        alert('Geçerli bir ürün seçiniz!');
        return;
      }
      const currentPaketBoyutu = $('#paketBoyutu').val();
      console.log(`paketBoyutları yenileniyor - ürün ID: ${urun.id}, tip ID: ${paketlemeTipiId}`);
      const variants = await loadPackageSizes(urun.id, paketlemeTipiId);
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
  function updatePaketlemeTipiOptions(variants) {
    resetPaketlemeTipi();
    const uniqueTypes = [...new Set(variants.map(v => JSON.stringify({ id: v.paketleme_tipi_id, text: v.paketleme_tipi_adi })))]
      .map(str => JSON.parse(str));
    uniqueTypes.forEach(type => {
      $('#paketlemeTipi').append(new Option(type.text, type.id));
    });
  }
  function updatePaketBoyutuOptions(variants) {
    resetPaketBoyutu();
    variants.forEach(variant => {
      $('#paketBoyutu').append(new Option(`${variant.paket_hacmi} Kg`, variant.paket_hacmi));
    });
  }
  // Sayfa açılışında hareketleri getir 
  fetchHareketler();
});
