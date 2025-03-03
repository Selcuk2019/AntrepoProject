// File: contract-form.js

import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async function () {

  /* ========== 0) SAYFA KAPANIS UYARISI ========== */
  let formDegisik = false; // Formda değişiklik var mı?
  // beforeunload event: sayfadan ayrılma/kapatma
  window.addEventListener("beforeunload", function(e) {
    if (formDegisik) {
      // Türkçe uyarı mesajı
      const mesaj = "Form verileri kaydedilmedi. Sayfadan ayrılırsanız tüm değişiklikler kaybolacak. Devam etmek istiyor musunuz?";
      e.preventDefault(); // Modern tarayıcılarda bu yeterli olmayabilir
      e.returnValue = mesaj; // Eski tarayıcılar bu şekilde mesaj gösterir
      return mesaj; // Bazıları da return değerine bakar
    }
    // formDegisik = false ise, uyarı göstermeden ayrılır
  });

  /* ========== 1) FORM ELEMANLARI ========== */
  const contractForm = document.getElementById("contractForm");
  const cancelBtn = document.getElementById("cancelBtn");
  const saveContractBtn = document.getElementById("saveContractBtn");

  // Global Parametre Elemanları
  const faturaPeriyodu = document.getElementById("faturaPeriyodu");
  const girisGunuKural = document.getElementById("girisGunuKural");
  const kismiGunYontemi = document.getElementById("kismiGunYontemi");
  const paraBirimiSelect = document.getElementById("paraBirimi");
  const haftaSonuCarpani = document.getElementById("haftaSonuCarpani");
  const dovizKuru = document.getElementById("dovizKuru");

  // Hizmetler & Modal
  const openHizmetModalBtn = document.getElementById("openHizmetModalBtn");
  const hizmetModal = document.getElementById("hizmetModal");
  const hizmetCancelBtn = document.getElementById("hizmetCancelBtn");
  const hizmetForm = document.getElementById("hizmetForm");
  const hizmetListBody = document.getElementById("hizmetListBody");
  const modalHizmetAdi = document.getElementById("modalHizmetAdi");
  const modalHizmetTipi = document.getElementById("modalHizmetTipi");
  const modalBirim = document.getElementById("modalBirim");
  const modalTemelUcret = document.getElementById("modalTemelUcret");
  const modalCarpan = document.getElementById("modalCarpan");
  const modalMinUcret = document.getElementById("modalMinUcret");
  const modalMesaiUygula = document.getElementById("modalMesaiUygula");
  const modalMesaiSaatleri = document.getElementById("modalMesaiSaatleri");
  const hizmetAdiList = document.getElementById("hizmetAdiList"); // datalist

  // Gün Çarpanı Modal
  const openGunCarpanModalBtn = document.getElementById("openGunCarpanModalBtn");
  const gunCarpanModal = document.getElementById("gunCarpanModal");
  const gunCarpanCloseBtn = document.getElementById("gunCarpanCloseBtn");
  const gunCarpanSaveBtn = document.getElementById("gunCarpanSaveBtn");
  const addGunCarpanRowBtn = document.getElementById("addGunCarpanRowBtn");
  const gunCarpanTbody = document.getElementById("gunCarpanTbody");

  // Mesai Saat Ücretleri Modal
  const openMesaiModalBtn = document.getElementById("openMesaiModalBtn");
  const mesaiModal = document.getElementById("mesaiModal");
  const mesaiModalParaBirimiLabel = document.getElementById("mesaiModalParaBirimiLabel");
  const mesaiSaatTbody = document.getElementById("mesaiSaatTbody");
  const mesaiCancelBtn = document.getElementById("mesaiCancelBtn");
  const mesaiSaveBtn = document.getElementById("mesaiSaveBtn");

  // Diğer Alanlar (Temel Bilgiler)
  const companyName = document.getElementById("companyName");
  const sozlesmeKodu = document.getElementById("sozlesmeKodu");
  const sozlesmeAdi = document.getElementById("sozlesmeAdi");
  const baslangicTarihi = document.getElementById("baslangicTarihi");
  const bitisTarihi = document.getElementById("bitisTarihi");
  const minFatura = document.getElementById("minFatura");

  /* ========== 2) GLOBAL DİZİLER ========== */
  let hizmetlerData = [];           // Hizmet Ekle modalından gelen veriler
  let gunCarpanParametreleri = [];  // Gün Çarpanı verileri
  let mesaiSaatUcretleriParam = []; // Mesai saat ücretleri parametreleri
  let allHizmetler = [];            // /api/hizmetler'den gelen veriler

  // Mesai Zaman Dilimleri (sabit 10 adet)
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

  /* ========== 3) SAYFA KAPANMA UYARISI İÇİN FORM DEĞİŞİKLİK TAKİBİ ========== */
  function setFormDegisik() {
    formDegisik = true;
  }
  // Tüm input, select, textarea vb. alanlara change/input event'i ekle
  const formInputs = contractForm.querySelectorAll("input, select, textarea");
  formInputs.forEach(input => {
    input.addEventListener("change", setFormDegisik);
    input.addEventListener("input", setFormDegisik);
  });

  // Form kaydedildiğinde formDegisik=false yapalım
  contractForm.addEventListener("submit", () => {
    formDegisik = false;
  });

  // Hizmet Ekle modalı formunda da benzer
  const hizmetModalInputs = hizmetForm.querySelectorAll("input, select, textarea");
  hizmetModalInputs.forEach(input => {
    input.addEventListener("change", setFormDegisik);
    input.addEventListener("input", setFormDegisik);
  });

  // ========== 4) API'DEN VERİLERİ ÇEKME FONKSİYONLARI ==========

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
      // Datalist (modalHizmetAdi) doldur
      hizmetAdiList.innerHTML = "";
      allHizmetler.forEach(h => {
        const opt = document.createElement("option");
        opt.value = h.hizmet_adi; // Hizmet Adı
        hizmetAdiList.appendChild(opt);
      });
    } catch (error) {
      console.error("Hizmetler yüklenemedi:", error);
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

  // "Hizmet Adı" seçildiğinde, allHizmetler içinde bulup diğer alanları doldur
  modalHizmetAdi.addEventListener("change", () => {
    const val = modalHizmetAdi.value.trim();
    if (!val) return;
    const found = allHizmetler.find(x => x.hizmet_adi.toLowerCase() === val.toLowerCase());
    if (found) {
      // Hizmet Tipi, Birim, Temel Ücret, Çarpan, Min Ücret
      modalHizmetTipi.value = found.hizmet_tipi || "";
      modalBirim.value = found.birim_adi || ""; // tablo yapınıza göre
      modalTemelUcret.value = found.temel_ucret || 0;
      modalCarpan.value = found.carpan || 0;
      modalMinUcret.value = found.min_ucret || 0;
    }
  });

  function openHizmetModal(rowData = null) {
    if (rowData) {
      // düzenleme
      modalHizmetAdi.value = rowData.hizmet_adi;
      modalHizmetTipi.value = rowData.hizmet_tipi;
      modalBirim.value = rowData.birim;
      modalTemelUcret.value = rowData.temel_ucret;
      modalCarpan.value = rowData.carpan;
      modalMinUcret.value = rowData.min_ucret;
      modalMesaiUygula.value = rowData.mesai_uygula;
      modalMesaiSaatleri.value = rowData.mesai_saatleri;
    } else {
      // yeni ekleme
      modalHizmetAdi.value = "";
      modalHizmetTipi.value = "";
      modalBirim.value = "";
      modalTemelUcret.value = "0";
      modalCarpan.value = "0";
      modalMinUcret.value = "0";
      modalMesaiUygula.value = "Hayır";
      modalMesaiSaatleri.value = "";
    }
    fillMesaiSaatleriDropdown();
    hizmetModal.style.display = "flex";
  }

  function fillMesaiSaatleriDropdown() {
    modalMesaiSaatleri.innerHTML = `<option value="">Seçiniz</option>`;
    mesaiSaatUcretleriParam.forEach(item => {
      const opt = document.createElement("option");
      opt.value = item.zamanDilimi;
      opt.textContent = item.zamanDilimi;
      modalMesaiSaatleri.appendChild(opt);
    });
  }

  function saveHizmetModal() {
    const rowData = {
      hizmet_adi: modalHizmetAdi.value.trim(),
      hizmet_tipi: modalHizmetTipi.value.trim(),
      birim: modalBirim.value.trim(),
      temel_ucret: parseFloat(modalTemelUcret.value) || 0,
      carpan: parseFloat(modalCarpan.value) || 0,
      min_ucret: parseFloat(modalMinUcret.value) || 0,
      mesai_uygula: modalMesaiUygula.value,
      mesai_saatleri: modalMesaiSaatleri.value
    };
    // Yeni ekleme
    hizmetlerData.push(rowData);
    refreshHizmetList();
    hizmetModal.style.display = "none";
  }

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
        hizmetlerData.splice(idx,1);
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
  gunCarpanCloseBtn.addEventListener("click", () => {
    // Değişiklikleri kaydetmeden kapat
    gunCarpanModal.style.display = "none";
  });
  gunCarpanSaveBtn.addEventListener("click", () => {
    // Değişiklikleri onaylayıp kaydet
    // Sadece pencereyi kapatıyor ama formDegisik = true kalıyor
    gunCarpanModal.style.display = "none";
  });
  addGunCarpanRowBtn.addEventListener("click", () => {
    gunCarpanParametreleri.push({
      startDay: "",
      endDay: "", // Boş kalırsa sonsuz
      baseFee: "",
      perKgRate: "",
      cargoType: "Genel Kargo",
      paraBirimi: paraBirimiSelect.value || ""
    });
    refreshGunCarpanTable();
  });

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

      // Bitiş Günü (boş kalırsa sonsuz)
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
        gunCarpanParametreleri.splice(idx,1);
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
    // İlk açılışta eğer mesaiSaatUcretleriParam boşsa dolduralım
    if (mesaiSaatUcretleriParam.length === 0) {
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

    // Zorunlu alan kontrolleri (HTML5 required'lar var ama manuel de bakabiliriz)
    if (!faturaPeriyodu.value || !girisGunuKural.value || !kismiGunYontemi.value || !paraBirimiSelect.value) {
      alert("Lütfen zorunlu alanları (Fatura Periyodu, Giriş Günü Hesaplama, Kısmi Gün Hesaplama, Para Birimi) doldurun!");
      return;
    }

    // Sözleşme verileri
    const sozlesmeData = {
      sozlesme_sirket_id: companyName.value || null,
      sozlesme_kodu: sozlesmeKodu.value,
      sozlesme_adi: sozlesmeAdi.value,
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
      // Bitiş Günü boş ise "sonsuz" mantığını sunucu tarafında da handle edebilirsiniz.
      gun_carpan_parametreleri: gunCarpanParametreleri
    };

    try {
      // Kaydetme isteği
      const resp = await fetch(`${baseUrl}/api/sozlesmeler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error(`Sunucu hatası: ${resp.status}`);
      const result = await resp.json();
      if (result.success) {
        alert("Sözleşme kaydı başarılı!");
        // Kaydetme başarılı olduğundan formDegisik = false
        formDegisik = false;
        window.location.href = "contract-list.html";
      } else {
        alert("Kayıt hatası: " + JSON.stringify(result));
      }
    } catch (error) {
      console.error("Sözleşme kaydı sırasında hata:", error);
      alert("Hata: " + error.message);
    }
  });

  cancelBtn.addEventListener("click", () => {
    // formDegisik = false => eğer iptal ile çıkış yapmak isterseniz
    // ama genelde iptal de uyarı versin isterseniz setFormDegisik'i kapatmayın
    history.back();
  });

  /* ========== SAYFA YÜKLENİRKEN ========== */
  await populateCompanies();
  await populateParaBirimleri();
  await populateHizmetler();
});
