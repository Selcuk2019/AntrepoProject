/*******************************************************
 * File: contract-form.js (Düzeltilmiş Tek Versiyon)
 * Amaç: Sözleşme oluşturma ve düzenleme (edit mode) 
 *       + Hizmet Ekle Modal + Mesai Saatleri 
 *******************************************************/
import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async function () {
  /* ========== 0) SAYFA KAPANIS UYARISI ========== */
  let formDegisik = false;
  window.addEventListener("beforeunload", function(e) {
    if (formDegisik) {
      const mesaj = "Form verileri kaydedilmedi. Sayfadan ayrılırsanız tüm değişiklikler kaybolacak. Devam etmek istiyor musunuz?";
      e.preventDefault();
      e.returnValue = mesaj;
      return mesaj;
    }
  });

  /* ========== 1) FORM ELEMANLARI ========== */
  const contractForm         = document.getElementById("contractForm");
  const cancelBtn            = document.getElementById("cancelBtn");
  const saveContractBtn      = document.getElementById("saveContractBtn");

  // Temel Sözleşme Alanları
  const companyName          = document.getElementById("companyName");
  const sozlesmeKodu         = document.getElementById("sozlesmeKodu");
  const sozlesmeAdi          = document.getElementById("sozlesmeAdi");
  const baslangicTarihi      = document.getElementById("baslangicTarihi");
  const bitisTarihi          = document.getElementById("bitisTarihi");
  const faturaPeriyodu       = document.getElementById("faturaPeriyodu");
  const minFatura            = document.getElementById("minFatura");
  const paraBirimiSelect     = document.getElementById("paraBirimi");
  const girisGunuKural       = document.getElementById("girisGunuKural");
  const kismiGunYontemi      = document.getElementById("kismiGunYontemi");
  const haftaSonuCarpani     = document.getElementById("haftaSonuCarpani");
  const dovizKuru            = document.getElementById("dovizKuru");

  // Hizmet Ekle Modal Elemanları
  const openHizmetModalBtn   = document.getElementById("openHizmetModalBtn");
  const hizmetModal          = document.getElementById("hizmetModal");
  const hizmetCancelBtn      = document.getElementById("hizmetCancelBtn");
  const hizmetForm           = document.getElementById("hizmetForm");
  const hizmetListBody       = document.getElementById("hizmetListBody");

  const modalHizmetAdi       = document.getElementById("modalHizmetAdi");
  const modalHizmetTipi      = document.getElementById("modalHizmetTipi");
  const modalBirim           = document.getElementById("modalBirim");
  const modalTemelUcret      = document.getElementById("modalTemelUcret");
  const modalCarpan          = document.getElementById("modalCarpan");
  const modalMinUcret        = document.getElementById("modalMinUcret");
  const modalMesaiUygula     = document.getElementById("modalMesaiUygula");
  const modalMesaiSaatleri   = document.getElementById("modalMesaiSaatleri");
  const hizmetAdiList        = document.getElementById("hizmetAdiList");

  // Mesai Saat Uygulama Değişim
  modalMesaiUygula.addEventListener("change", handleMesaiUygulaChange);
  function handleMesaiUygulaChange() {
    if (modalMesaiUygula.value === "Hayır") {
      modalMesaiSaatleri.disabled = true;
      modalMesaiSaatleri.value = "";
    } else {
      modalMesaiSaatleri.disabled = false;
    }
  }

  // Gün Çarpanı Modal
  const openGunCarpanModalBtn = document.getElementById("openGunCarpanModalBtn");
  const gunCarpanModal        = document.getElementById("gunCarpanModal");
  const gunCarpanCloseBtn     = document.getElementById("gunCarpanCloseBtn");
  const gunCarpanSaveBtn      = document.getElementById("gunCarpanSaveBtn");
  const addGunCarpanRowBtn    = document.getElementById("addGunCarpanRowBtn");
  const gunCarpanTbody        = document.getElementById("gunCarpanTbody");

  // Mesai Saat Ücretleri Modal
  const openMesaiModalBtn     = document.getElementById("openMesaiModalBtn");
  const mesaiModal            = document.getElementById("mesaiModal");
  const mesaiModalParaBirimiLabel = document.getElementById("mesaiModalParaBirimiLabel");
  const mesaiSaatTbody        = document.getElementById("mesaiSaatTbody");
  const mesaiCancelBtn        = document.getElementById("mesaiCancelBtn");
  const mesaiSaveBtn          = document.getElementById("mesaiSaveBtn");

  /* ========== 2) GLOBAL DİZİLER ========== */
  let hizmetlerData           = [];
  let gunCarpanParametreleri  = [];
  let mesaiSaatUcretleriParam = [];
  let allHizmetler            = [];

  // Örnek sabit mesai zaman dilimleri (sabit dizi kullanılacak)
  const mesaiZamanDilimiList = [
    "Hafta İçi 08.01 - 16.59",
    "Hafta İçi 17.00 - 19.00",
    "Hafta Sonu 17.00 - 19.00",
    "Hafta İçi 19.01 - 21.00",
    "Hafta Sonu 19.01 - 21.00",
    "Hafta İçi 21.01 - 24.00",
    "Hafta Sonu 21.01 - 24.00",
    "Hafta İçi 24.01 - 08.00",
    "Hafta Sonu 24.01 - 08.00",
    "Hafta Sonları",
    "Dini bayram ve resmi tatiller"
  ];

  /* ========== 3) SAYFA KAPANMA UYARISI ========== */
  function setFormDegisik() {
    formDegisik = true;
  }
  const formInputs = contractForm.querySelectorAll("input, select, textarea");
  formInputs.forEach(input => {
    input.addEventListener("change", setFormDegisik);
    input.addEventListener("input", setFormDegisik);
  });
  contractForm.addEventListener("submit", () => {
    formDegisik = false;
  });
  const hizmetModalInputs = hizmetForm.querySelectorAll("input, select, textarea");
  hizmetModalInputs.forEach(input => {
    input.addEventListener("change", setFormDegisik);
    input.addEventListener("input", setFormDegisik);
  });

  /* ========== 4) API'DEN VERİLERİ ÇEKME FONKSİYONLARI ========== */
  async function populateCompanies() {
    try {
      const resp = await fetch(`${baseUrl}/api/companies`);
      if (!resp.ok) throw new Error(`Companies error: ${resp.status}`);
      const data = await resp.json();
      companyName.innerHTML = `<option value="">Seçiniz...</option>`;
      data.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.sirket_id;
        opt.textContent = c.company_name;
        companyName.appendChild(opt);
      });
    } catch (error) {
      console.error("Şirketler yüklenemedi:", error);
    }
  }

  async function populateParaBirimleri() {
    try {
      const resp = await fetch(`${baseUrl}/api/para-birimleri`);
      if (!resp.ok) throw new Error(`Para birimi hatası: ${resp.status}`);
      const data = await resp.json();
      paraBirimiSelect.innerHTML = `<option value="">Seçiniz...</option>`;
      data.forEach(pb => {
        const opt = document.createElement("option");
        opt.value = pb.iso_kodu;
        opt.textContent = `${pb.para_birimi_adi} (${pb.iso_kodu})`;
        paraBirimiSelect.appendChild(opt);
      });
    } catch (error) {
      console.error("Para birimleri yüklenemedi:", error);
    }
  }

  async function populateHizmetler() {
    try {
      const resp = await fetch(`${baseUrl}/api/hizmetler`);
      if (!resp.ok) throw new Error(`Hizmetler hata: ${resp.status}`);
      allHizmetler = await resp.json();
      // Hizmet Adı listesi (datalist)
      hizmetAdiList.innerHTML = "";
      allHizmetler.forEach(h => {
        const opt = document.createElement("option");
        opt.value = h.hizmet_adi;
        hizmetAdiList.appendChild(opt);
      });
    } catch (error) {
      console.error("Hizmetler çekilemedi:", error);
    }
  }

  /* ========== 5) HİZMET EKLE MODAL LOJİĞİ ========== */
  openHizmetModalBtn.addEventListener("click", () => {
    openHizmetModal();
  });
  hizmetCancelBtn.addEventListener("click", () => {
    hizmetModal.style.display = "none";
  });
  hizmetForm.addEventListener("submit", (e) => {
    e.preventDefault();
    saveHizmetModal();
  });

  // Hizmet Adı seçilince, allHizmetler içinden bulup alanları doldur
  modalHizmetAdi.addEventListener("change", () => {
    const val = modalHizmetAdi.value.trim();
    if (!val) return;
    const found = allHizmetler.find(x => x.hizmet_adi.toLowerCase() === val.toLowerCase());
    if (found) {
      modalHizmetTipi.value  = found.hizmet_tipi || "";
      modalBirim.value       = found.birim_adi || "";
      modalTemelUcret.value  = found.temel_ucret || 0;
      modalCarpan.value      = found.carpan || 0;
      modalMinUcret.value    = found.min_ucret || 0;
    }
  });

  // Tek bir openHizmetModal fonksiyonu; rowData varsa düzenleme, yoksa yeni ekleme
  function openHizmetModal(rowData = null) {
    if (rowData) {
      // Düzenleme
      modalHizmetAdi.value    = rowData.hizmet_adi;
      modalHizmetTipi.value   = rowData.hizmet_tipi;
      modalBirim.value        = rowData.birim;
      modalTemelUcret.value   = rowData.temel_ucret;
      modalCarpan.value       = rowData.carpan;
      modalMinUcret.value     = rowData.min_ucret;
      modalMesaiUygula.value  = rowData.mesai_uygula;
      modalMesaiSaatleri.value= rowData.mesai_saatleri;
    } else {
      // Yeni ekleme
      modalHizmetAdi.value    = "";
      modalHizmetTipi.value   = "";
      modalBirim.value        = "";
      modalTemelUcret.value   = "0";
      modalCarpan.value       = "0";
      modalMinUcret.value     = "0";
      modalMesaiUygula.value  = "Hayır";
      modalMesaiSaatleri.value= "";
    }
    // Dropdown doldur ve mesai uygulama durumunu kontrol et
    fillMesaiSaatleriDropdown();
    handleMesaiUygulaChange();
    // Modal'ı göster
    hizmetModal.style.display = "flex";
  }

  // Tekil fillMesaiSaatleriDropdown fonksiyonu: burada sabit dizi kullanılıyor
  function fillMesaiSaatleriDropdown() {
    modalMesaiSaatleri.innerHTML = `<option value="">Seçiniz</option>`;
    mesaiZamanDilimiList.forEach(zaman => {
      const opt = document.createElement("option");
      opt.value = zaman;
      opt.textContent = zaman;
      modalMesaiSaatleri.appendChild(opt);
    });
  }

  // Hizmet Modalı kaydet
  function saveHizmetModal() {
    let mesaiSaat = modalMesaiSaatleri.value.trim();
    if (modalMesaiUygula.value === "Hayır") {
      mesaiSaat = "";
    }
    const rowData = {
      hizmet_adi:   modalHizmetAdi.value.trim(),
      hizmet_tipi:  modalHizmetTipi.value.trim(),
      birim:        modalBirim.value.trim(),
      temel_ucret:  parseFloat(modalTemelUcret.value) || 0,
      carpan:       parseFloat(modalCarpan.value) || 0,
      min_ucret:    parseFloat(modalMinUcret.value) || 0,
      mesai_uygula: modalMesaiUygula.value,
      mesai_saatleri: mesaiSaat
    };
    hizmetlerData.push(rowData);
    refreshHizmetList();
    hizmetModal.style.display = "none";
  }

  // Hizmet Tablosunu Yenile
  function refreshHizmetList() {
    hizmetListBody.innerHTML = "";
    hizmetlerData.forEach((h, idx) => {
      const tr = document.createElement("tr");

      const tdAdi = document.createElement("td");
      tdAdi.textContent = h.hizmet_adi;
      tr.appendChild(tdAdi);

      const tdTipi = document.createElement("td");
      tdTipi.textContent = h.hizmet_tipi;
      tr.appendChild(tdTipi);

      const tdBirim = document.createElement("td");
      tdBirim.textContent = h.birim;
      tr.appendChild(tdBirim);

      const tdTemel = document.createElement("td");
      tdTemel.textContent = h.temel_ucret.toFixed(2);
      tr.appendChild(tdTemel);

      const tdCarpan = document.createElement("td");
      tdCarpan.textContent = h.carpan.toFixed(3);
      tr.appendChild(tdCarpan);

      const tdMin = document.createElement("td");
      tdMin.textContent = h.min_ucret.toFixed(2);
      tr.appendChild(tdMin);

      const tdMesai = document.createElement("td");
      tdMesai.textContent = h.mesai_uygula;
      tr.appendChild(tdMesai);

      const tdMesaiSaat = document.createElement("td");
      tdMesaiSaat.textContent = h.mesai_saatleri;
      tr.appendChild(tdMesaiSaat);

      const tdSil = document.createElement("td");
      const btnSil = document.createElement("button");
      btnSil.textContent = "Sil";
      btnSil.className = "btn-danger";
      btnSil.addEventListener("click", () => {
        hizmetlerData.splice(idx, 1);
        refreshHizmetList();
      });
      tdSil.appendChild(btnSil);
      tr.appendChild(tdSil);

      hizmetListBody.appendChild(tr);
    });
  }

  /* ========== 6) GÜN ÇARPANI MODAL ========== */
  openGunCarpanModalBtn.addEventListener("click", () => {
    gunCarpanModal.style.display = "flex";
    refreshGunCarpanTable();
  });
  // ...
  gunCarpanCloseBtn.addEventListener("click", () => {
    gunCarpanModal.style.display = "none";
  });

  // Gün Çarpanı Modal Kaydetme Fonksiyonu (Örnek)
  gunCarpanSaveBtn.addEventListener("click", () => {
    // Öncelikle tüm satırları kontrol edelim
    for (let i = 0; i < gunCarpanParametreleri.length; i++) {
      const row = gunCarpanParametreleri[i];
      if (!row.startDay || row.startDay.toString().trim() === "") {
        alert("Gün Çarpanı Parametreleri: Başlangıç günü zorunludur (satır " + (i + 1) + ").");
        return; // Hata varsa kaydetmeyi durdur
      }
      if (row.baseFee === "" || row.baseFee === null || isNaN(row.baseFee)) {
        alert("Gün Çarpanı Parametreleri: Temel Ücret (Base Fee) zorunludur (satır " + (i + 1) + ").");
        return; // Hata varsa kaydetmeyi durdur
      }
    }
    
    // Tüm zorunlu alanlar doluysa modalı kapatalım
    gunCarpanModal.style.display = "none";
  });

  addGunCarpanRowBtn.addEventListener("click", () => {
    gunCarpanParametreleri.push({
      startDay: "",
      endDay: "",
      baseFee: "",
      perKgRate: "",
      cargoType: "Genel Kargo",
      paraBirimi: paraBirimiSelect.value || ""
    });
    refreshGunCarpanTable();
  });
  // ...


  function refreshGunCarpanTable() {
    gunCarpanTbody.innerHTML = "";
    gunCarpanParametreleri.forEach((item, idx) => {
      const tr = document.createElement("tr");

      // Başlangıç Günü
      const tdStart = document.createElement("td");
      const inputStart = document.createElement("input");
      inputStart.type = "number";
      inputStart.min = "1";
      inputStart.placeholder = "Başlangıç";
      inputStart.value = item.startDay;
      inputStart.addEventListener("change", e => {
        gunCarpanParametreleri[idx].startDay = e.target.value;
      });
      tdStart.appendChild(inputStart);
      tr.appendChild(tdStart);

      // Bitiş Günü
      const tdEnd = document.createElement("td");
      const inputEnd = document.createElement("input");
      inputEnd.type = "number";
      inputEnd.min = "1";
      inputEnd.placeholder = "Bitiş";
      inputEnd.value = item.endDay;
      inputEnd.addEventListener("change", e => {
        gunCarpanParametreleri[idx].endDay = e.target.value;
      });
      tdEnd.appendChild(inputEnd);
      tr.appendChild(tdEnd);

      // Base Fee
      const tdBaseFee = document.createElement("td");
      const inputBaseFee = document.createElement("input");
      inputBaseFee.type = "number";
      inputBaseFee.step = "0.01";
      inputBaseFee.value = item.baseFee;
      inputBaseFee.addEventListener("change", e => {
        gunCarpanParametreleri[idx].baseFee = parseFloat(e.target.value) || 0;
      });
      tdBaseFee.appendChild(inputBaseFee);
      tr.appendChild(tdBaseFee);

      // Kg Başına Ücret
      const tdPerKg = document.createElement("td");
      const inputPerKg = document.createElement("input");
      inputPerKg.type = "number";
      inputPerKg.step = "0.0001";
      inputPerKg.value = item.perKgRate;
      inputPerKg.addEventListener("change", e => {
        gunCarpanParametreleri[idx].perKgRate = parseFloat(e.target.value) || 0;
      });
      tdPerKg.appendChild(inputPerKg);
      tr.appendChild(tdPerKg);

      // Kargo Tipi
      const tdCargo = document.createElement("td");
      const selectCargo = document.createElement("select");
      ["Genel Kargo", "Özel Kargo"].forEach(val => {
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;
        if (val === item.cargoType) opt.selected = true;
        selectCargo.appendChild(opt);
      });
      selectCargo.addEventListener("change", e => {
        gunCarpanParametreleri[idx].cargoType = e.target.value;
      });
      tdCargo.appendChild(selectCargo);
      tr.appendChild(tdCargo);

      // Para Birimi
      const tdPara = document.createElement("td");
      const selectPara = document.createElement("select");
      paraBirimiSelect.querySelectorAll("option").forEach(opt => {
        const cloneOpt = opt.cloneNode(true);
        selectPara.appendChild(cloneOpt);
      });
      selectPara.value = item.paraBirimi || "";
      selectPara.addEventListener("change", e => {
        gunCarpanParametreleri[idx].paraBirimi = e.target.value;
      });
      tdPara.appendChild(selectPara);
      tr.appendChild(tdPara);

      // Sil Butonu
      const tdSil = document.createElement("td");
      const delBtn = document.createElement("button");
      delBtn.textContent = "Sil";
      delBtn.className = "btn-danger";
      delBtn.addEventListener("click", () => {
        gunCarpanParametreleri.splice(idx, 1);
        refreshGunCarpanTable();
      });
      tdSil.appendChild(delBtn);
      tr.appendChild(tdSil);

      gunCarpanTbody.appendChild(tr);
    });
  }

  /* ========== 7) MESAI SAAT ÜCRETLERİ MODAL ========== */
  openMesaiModalBtn.addEventListener("click", () => {
    mesaiModal.style.display = "flex";
    mesaiModalParaBirimiLabel.textContent = paraBirimiSelect.value || "Seçilmedi";
    refreshMesaiSaatTable();
  });
  mesaiCancelBtn.addEventListener("click", () => {
    mesaiModal.style.display = "none";
  });
  mesaiSaveBtn.addEventListener("click", () => {
    mesaiModal.style.display = "none";
  });

  function refreshMesaiSaatTable() {
    mesaiSaatTbody.innerHTML = "";
    if (mesaiSaatUcretleriParam.length === 0) {
      // Eğer mesai ücretleri daha önce belirlenmediyse sabit diziden dolduruyoruz
      mesaiZamanDilimiList.forEach(zaman => {
        mesaiSaatUcretleriParam.push({
          zamanDilimi: zaman,
          ucretSaat: 0,
          paraBirimi: paraBirimiSelect.value || ""
        });
      });
    }
    mesaiSaatUcretleriParam.forEach((item, idx) => {
      const tr = document.createElement("tr");

      // Zaman Dilimi
      const tdZaman = document.createElement("td");
      tdZaman.textContent = item.zamanDilimi;
      tr.appendChild(tdZaman);

      // Ücret/Saat
      const tdUcret = document.createElement("td");
      const inputUcret = document.createElement("input");
      inputUcret.type = "number";
      inputUcret.step = "0.01";
      inputUcret.value = item.ucretSaat;
      inputUcret.addEventListener("change", e => {
        mesaiSaatUcretleriParam[idx].ucretSaat = parseFloat(e.target.value) || 0;
      });
      tdUcret.appendChild(inputUcret);
      tr.appendChild(tdUcret);

      // Para Birimi
      const tdPara = document.createElement("td");
      const selectPara = document.createElement("select");
      paraBirimiSelect.querySelectorAll("option").forEach(opt => {
        const cloneOpt = opt.cloneNode(true);
        selectPara.appendChild(cloneOpt);
      });
      selectPara.value = item.paraBirimi || "";
      selectPara.addEventListener("change", e => {
        mesaiSaatUcretleriParam[idx].paraBirimi = e.target.value;
      });
      tdPara.appendChild(selectPara);
      tr.appendChild(tdPara);

      mesaiSaatTbody.appendChild(tr);
    });
  }

  /* ========== 8) FORM SUBMIT (Ana Kaydet) ========== */
  contractForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // a) Zorunlu alan kontrolleri
    if (!faturaPeriyodu.value || !girisGunuKural.value || !kismiGunYontemi.value || !paraBirimiSelect.value) {
      alert("Lütfen zorunlu alanları (Fatura Periyodu, Giriş Günü, Kısmi Gün, Para Birimi) doldurun!");
      return;
    }
    // b) Gün Çarpanı Parametreleri zorunlu
    if (gunCarpanParametreleri.length === 0) {
      alert("Gün Çarpanı Parametreleri doldurulmalıdır!");
      return;
    }

    // c) Sözleşme verileri
    const sozlesmeData = {
      sozlesme_sirket_id: companyName.value || null,
      sozlesme_kodu: sozlesmeKodu.value,
      sozlesme_adi:  sozlesmeAdi.value,
      baslangic_tarihi: baslangicTarihi.value || null,
      bitis_tarihi: bitisTarihi.value || null,
      fatura_periyodu: faturaPeriyodu.value,
      min_fatura: parseFloat(minFatura.value) || 0,
      para_birimi: paraBirimiSelect.value,
      giris_gunu_kural: girisGunuKural.value,
      kismi_gun_yontemi: kismiGunYontemi.value,
      hafta_sonu_carpani: parseFloat(haftaSonuCarpani.value) || 1,
      doviz_kuru: parseFloat(dovizKuru.value) || null
    };

    const payload = {
      sozlesme: sozlesmeData,
      hizmetler: hizmetlerData,
      ek_hizmet_parametreleri: {
        mesaiSaatUcretleri: mesaiSaatUcretleriParam
      },
      gun_carpan_parametreleri: gunCarpanParametreleri
    };

    try {
      const url = editId ? `${baseUrl}/api/sozlesmeler/${editId}` : `${baseUrl}/api/sozlesmeler`;
      const method = editId ? "PUT" : "POST";
      const resp = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error(`Sunucu hatası: ${resp.status}`);
      const result = await resp.json();
      if (result.success) {
        alert(editId ? "Sözleşme başarıyla güncellendi!" : "Sözleşme kaydı başarılı!");
        formDegisik = false;
        window.location.href = "contract-list.html";
      } else {
        alert("Kayıt hatası: " + JSON.stringify(result));
      }
    } catch (error) {
      console.error("Sözleşme kaydı/güncelleme sırasında hata:", error);
      alert("Hata: " + error.message);
    }
  });

  cancelBtn.addEventListener("click", () => {
    history.back();
  });

  /* ========== 9) YARDIMCI FONKSİYON: Mevcut Sözleşme Verilerini Yükle (Düzenleme) ========== */
  async function loadContractData(contractId) {
    try {
      const resp = await fetch(`${baseUrl}/api/sozlesmeler/${contractId}`);
      if (!resp.ok) {
        throw new Error(`Sözleşme verisi alınamadı: ${resp.status}`);
      }
      const contract = await resp.json();
      fillForm(contract);
    } catch (err) {
      console.error("Sözleşme verisi yüklenirken hata:", err);
      alert("Sözleşme verisi yüklenemedi: " + err.message);
    }
  }

  function fillForm(contract) {
    // Temel alanlar
    companyName.value      = contract.sozlesme_sirket_id || "";
    sozlesmeKodu.value     = contract.sozlesme_kodu || "";
    sozlesmeAdi.value      = contract.sozlesme_adi || "";
    if (contract.baslangic_tarihi) {
      baslangicTarihi.value = contract.baslangic_tarihi.substring(0,10);
    }
    if (contract.bitis_tarihi) {
      bitisTarihi.value     = contract.bitis_tarihi.substring(0,10);
    }
    faturaPeriyodu.value   = contract.fatura_periyodu || "";
    minFatura.value        = contract.min_fatura || 0;
    paraBirimiSelect.value = contract.para_birimi || "";
    girisGunuKural.value   = contract.giris_gunu_kural || "";
    kismiGunYontemi.value  = contract.kismi_gun_yontemi || "";
    haftaSonuCarpani.value = contract.hafta_sonu_carpani || 1;
    dovizKuru.value        = contract.doviz_kuru || "";

    // Gün Çarpanı Parametreleri
    if (contract.gun_carpan_parametreleri && Array.isArray(contract.gun_carpan_parametreleri)) {
      gunCarpanParametreleri = contract.gun_carpan_parametreleri.map(gc => ({
        startDay:   gc.startDay || "",
        endDay:     gc.endDay || "",
        baseFee:    gc.baseFee || 0,
        perKgRate:  gc.perKgRate || 0,
        cargoType:  gc.cargoType || "Genel Kargo",
        paraBirimi: gc.paraBirimi || paraBirimiSelect.value || ""
      }));
    } else {
      gunCarpanParametreleri = [];
    }
    refreshGunCarpanTable();
    
    // Hizmetler
    if (contract.hizmetler && Array.isArray(contract.hizmetler)) {
      hizmetlerData = contract.hizmetler.map(h => ({
        hizmet_adi:   h.hizmet_adi || "",
        hizmet_tipi:  h.hizmet_tipi || "",
        birim:        h.birim || "",
        temel_ucret:  parseFloat(h.temel_ucret) || 0,
        carpan:       parseFloat(h.carpan) || 0,
        min_ucret:    parseFloat(h.min_ucret) || 0,
        mesai_uygula: h.mesai_uygula || "Hayır",
        mesai_saatleri: h.mesai_saatleri || ""
      }));
    } else {
      hizmetlerData = [];
    }
    refreshHizmetList();

    // Mesai Saat Ücretleri
    if (contract.ek_hizmet_parametreleri && contract.ek_hizmet_parametreleri.mesaiSaatUcretleri) {
      mesaiSaatUcretleriParam = contract.ek_hizmet_parametreleri.mesaiSaatUcretleri.map(item => ({
        zamanDilimi: item.zamanDilimi || "",
        ucretSaat:   parseFloat(item.ucretSaat) || 0,
        paraBirimi:  item.paraBirimi || paraBirimiSelect.value || ""
      }));
    } else {
      mesaiSaatUcretleriParam = [];
    }
    // Eğer mesai modal otomatik açılıyorsa refreshMesaiSaatTable(); çağrılabilir.
  }

  /* ========== SAYFA YÜKLENİRKEN ========== */
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get("id");

  await populateCompanies();
  await populateParaBirimleri();
  await populateHizmetler();

  if (editId) {
    await loadContractData(editId);
  }
});
