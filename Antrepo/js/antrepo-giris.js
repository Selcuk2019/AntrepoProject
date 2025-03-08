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
  
  function renderHareketler(list = []) {  // Add default empty array
    hareketTableBody.innerHTML = "";
    
    // Handle empty list case
    if (!list || !list.length) {
      hareketTableBody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center">
            Kayıt bulunamadı
          </td>
        </tr>`;
      return;
    }
    
    list.forEach(item => {
      const tr = document.createElement("tr");
  
      // 1) Tarih - No timezone conversion needed since API sends YYYY-MM-DD
      const tdTarih = document.createElement("td");
      tdTarih.textContent = item.islem_tarihi || "";
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
      silBtn.addEventListener("click", async () => {
        const isConfirmed = await showConfirmModal('Bu hareketi silmek istediğinizden emin misiniz?');
        if (isConfirmed) {
          deleteTransaction(item);
        }
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

  async function fetchEkHizmetler(girisId) {
    const resp = await fetch(`${baseUrl}/api/antrepo-giris/${girisId}/ek-hizmetler`);
    if (!resp.ok) throw new Error(`Ek hizmetler hata: ${resp.status}`);
    const data = await resp.json();
    return data;
  }
  
  async function deleteTransaction(record) {
    const girisId = record.antrepo_giris_id || activeGirisId;
    if (!girisId) {
      console.error("Antrepo giriş ID bulunamadı.");
      return;
    }
  
    try {
      // Check if this is a service record by looking for hizmet_id
      const isHizmet = record.hizmet_id !== undefined;
      const endpoint = isHizmet 
        ? `${baseUrl}/api/antrepo-giris/${girisId}/ek-hizmetler/${record.id}`
        : `${baseUrl}/api/antrepo-giris/${girisId}/hareketler/${record.id}`;
  
      console.log("Deleting from endpoint:", endpoint); // Debug log
  
      const resp = await fetch(endpoint, { method: 'DELETE' });
      if (!resp.ok) {
        throw new Error(`Silme hatası: ${resp.status}`);
      }
  
      // Refresh both lists after successful delete
      const [hareketler, ekHizmetler] = await Promise.all([
        fetchHareketler(),
        fetchEkHizmetler(girisId)
      ]);
  
      renderHareketler(hareketler || []);
      renderEkHizmetler(ekHizmetler || []);
  
      alert("Kayıt başarıyla silindi.");
    } catch (error) {
      console.error("Silme işlemi hatası:", error);
      alert("Silme işlemi sırasında hata oluştu: " + error.message);
    }
  }
  
  /************************************************************
   * 6) Ek Hizmetler Tablosu Render Fonksiyonları
   ************************************************************/
  function renderEkHizmetler(list = []) {  // Add default empty array
    ekHizmetlerTableBody.innerHTML = "";
    
    // Handle empty list case
    if (!list || !list.length) {
      ekHizmetlerTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center">
            Ek hizmet kaydı bulunamadı
          </td>
        </tr>`;
      return;
    }
    
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
      silBtn.addEventListener("click", async () => {
        const isConfirmed = await showConfirmModal('Bu ek hizmeti silmek istediğinizden emin misiniz?');
        if (isConfirmed) {
          deleteTransaction(item);
        }
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
    selectParaBirimi.innerHTML = `<option value="">Seçiniz</option>`;
    allParaBirimleri.forEach(pb => {
      const opt = document.createElement("option");
      opt.value = pb.id.toString();
      opt.textContent = `${pb.para_birimi_adi} (${pb.iso_kodu})`;
      selectParaBirimi.appendChild(opt);
    });
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
  inputSozlesme.addEventListener("change", () => {
    const val = inputSozlesme.value.trim();
    if (!val) return;
    const splitted = val.split(" - ");
    let kod = splitted[0];
    if (kod === "Kodsuz") kod = "";
    const found = allSozlesmeler.find(s =>
      (s.sozlesme_kodu || "").toLowerCase() === kod.toLowerCase()
    );
    if (found && found.display_name) {
      inputAntrepoSirketi.value = found.display_name;
      inputAntrepoSirketi.disabled = true;
      clearSirketBtn.disabled = true;
      filterSozlesmelerByCompany(found.display_name);
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
    inputAntrepoSirketi.disabled = false;
    clearSirketBtn.disabled = false;
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
  inputAntrepoAd.addEventListener("change", () => {
    const val = inputAntrepoAd.value.trim().toLowerCase();
    const found = allAntrepolar.find(a => a.antrepoAdi.toLowerCase() === val);
    if (found) {
      inputAntrepoKodu.value = found.antrepoKodu || "";
      inputAdres.value = found.acikAdres || "";
      inputSehir.value = found.sehir || "";
      inputGumruk.value = found.gumruk || "";
    } else {
      inputAntrepoKodu.value = "";
      inputAdres.value = "";
      inputSehir.value = "";
      inputGumruk.value = "";
    }
  });
  inputAntrepoKodu.addEventListener("change", () => {
    const val = inputAntrepoKodu.value.trim().toLowerCase();
    const found = allAntrepolar.find(a => a.antrepoKodu.toLowerCase() === val);
    if (found) {
      inputAntrepoAd.value = found.antrepoAdi || "";
      inputAdres.value = found.acikAdres || "";
      inputSehir.value = found.sehir || "";
      inputGumruk.value = found.gumruk || "";
    } else {
      inputAntrepoAd.value = "";
      inputAdres.value = "";
      inputSehir.value = "";
      inputGumruk.value = "";
    }
  });
  
  /************************************************************
   * 8) Event Listeners - Ürün Tanımı / Kodu
   ************************************************************/
  inputUrunTanimi.addEventListener("change", () => {
    const val = inputUrunTanimi.value.trim().toLowerCase();
    const found = allUrunler.find(u => u.name.toLowerCase() === val);
    if (found) {
      inputUrunKodu.value = found.code || "";
      inputPaketBoyutu.value = found.paket_hacmi ? found.paket_hacmi + " Kg" : "";
      inputPaketlemeTipi.value = found.paketleme_tipi_name || "";
    } else {
      inputUrunKodu.value = "";
      inputPaketBoyutu.value = "";
      inputPaketlemeTipi.value = "";
    }
  });
  inputUrunKodu.addEventListener("change", () => {
    const val = inputUrunKodu.value.trim().toLowerCase();
    const found = allUrunler.find(u => u.code.toLowerCase() === val);
    if (found) {
      inputUrunTanimi.value = found.name || "";
      inputPaketBoyutu.value = found.paket_hacmi ? found.paket_hacmi + " Kg" : "";
      inputPaketlemeTipi.value = found.paketleme_tip_name || "";
    } else {
      inputUrunTanimi.value = "";
      inputPaketBoyutu.value = "";
      inputPaketlemeTipi.value = "";
    }
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

// Özelleştirilmiş confirm fonksiyonu
function showConfirmModal(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const modalBody = modal.querySelector('.confirm-modal-body');
    const yesBtn = document.getElementById('confirmYes');
    const noBtn = document.getElementById('confirmNo');

    modalBody.textContent = message;
    modal.style.display = 'flex';

    function handleYes() {
      modal.style.display = 'none';
      cleanup();
      resolve(true);
    }

    function handleNo() {
      modal.style.display = 'none';
      cleanup();
      resolve(false);
    }

    function cleanup() {
      yesBtn.removeEventListener('click', handleYes);
      noBtn.removeEventListener('click', handleNo);
    }

    yesBtn.addEventListener('click', handleYes);
    noBtn.addEventListener('click', handleNo);
  });
}
