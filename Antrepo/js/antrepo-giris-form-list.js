import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async () => {
  const entriesTableBody = document.getElementById("entriesTableBody");
  const newEntryBtn = document.getElementById("newEntryBtn");
  const addColumnBtn = document.getElementById("addColumnBtn");
  const columnDropdown = document.getElementById("columnDropdown");
  const applyColumnsBtn = document.getElementById("applyColumnsBtn");

  // Seçili ek sütunların değerlerini saklamak için dizi
  let additionalColumns = [];

  // API'den antrepo giriş kayıtlarını çek
  async function fetchEntries() {
    try {
      const resp = await fetch(`${baseUrl}/api/antrepo-giris`);
      if (!resp.ok) throw new Error(`Sunucu hatası: ${resp.status}`);
      const entries = await resp.json();
      renderEntries(entries);
    } catch (error) {
      console.error("Antrepo giriş kayıtları çekilirken hata:", error);
    }
  }

  // Tabloya kayıtları ekleme fonksiyonu
  function renderEntries(entries) {
    entriesTableBody.innerHTML = "";
    entries.forEach(entry => {
      const tr = document.createElement("tr");

      // Beyanname No (tıklanabilir: view modunda form açar)
      const tdBeyannameNo = document.createElement("td");
      const viewLink = document.createElement("a");
      viewLink.textContent = entry.beyanname_no || "";
      viewLink.href = `antrepo-giris-formu.html?mode=view&id=${entry.id}`;
      tdBeyannameNo.appendChild(viewLink);
      tr.appendChild(tdBeyannameNo);

      // Beyanname Form Tarihi
      const tdBeyannameFormTarihi = document.createElement("td");
      tdBeyannameFormTarihi.textContent = entry.beyanname_form_tarihi ? entry.beyanname_form_tarihi.substring(0, 10) : "";
      tr.appendChild(tdBeyannameFormTarihi);

      // Antrepo Adı
      const tdAntrepoAdi = document.createElement("td");
      tdAntrepoAdi.textContent = entry.antrepo_adi || entry.antrepo_id || "";
      tr.appendChild(tdAntrepoAdi);

      // Antrepo Şirketi
      const tdAntrepoSirketi = document.createElement("td");
      tdAntrepoSirketi.textContent = entry.antrepo_sirket_adi || "";
      tr.appendChild(tdAntrepoSirketi);

      // Gümrük
      const tdGumruk = document.createElement("td");
      tdGumruk.textContent = entry.gumruk || "";
      tr.appendChild(tdGumruk);

      // Gönderici Şirket
      const tdGonderici = document.createElement("td");
      tdGonderici.textContent = entry.gonderici_sirket || "";
      tr.appendChild(tdGonderici);

      // Alıcı Şirket
      const tdAlici = document.createElement("td");
      tdAlici.textContent = entry.alici_sirket || "";
      tr.appendChild(tdAlici);

      // Ürün Tanımı
      const tdUrunTanimi = document.createElement("td");
      tdUrunTanimi.textContent = entry.urun_tanimi || "";
      tr.appendChild(tdUrunTanimi);

      // Miktar
      const tdMiktar = document.createElement("td");
      tdMiktar.textContent = entry.miktar || "";
      tr.appendChild(tdMiktar);

      // Kap Adeti
      const tdKapAdeti = document.createElement("td");
      tdKapAdeti.textContent = entry.kap_adeti || "";
      tr.appendChild(tdKapAdeti);

      // Antrepo Giriş Tarihi
      const tdAntrepoGirisTarihi = document.createElement("td");
      tdAntrepoGirisTarihi.textContent = entry.antrepo_giris_tarihi ? entry.antrepo_giris_tarihi.substring(0, 10) : "";
      tr.appendChild(tdAntrepoGirisTarihi);

      // Proforma No
      const tdProformaNo = document.createElement("td");
      tdProformaNo.textContent = entry.proforma_no || "";
      tr.appendChild(tdProformaNo);

      // Ticari Fatura No
      const tdTicariFaturaNo = document.createElement("td");
      tdTicariFaturaNo.textContent = entry.ticari_fatura_no || "";
      tr.appendChild(tdTicariFaturaNo);

      // Depolama Süresi
      const tdDepolamaSuresi = document.createElement("td");
      tdDepolamaSuresi.textContent = entry.depolama_suresi || "";
      tr.appendChild(tdDepolamaSuresi);

      // Seçili ek sütunlar (örneğin: proforma_tarihi, ticari_fatura_tarihi vb.)
      additionalColumns.forEach(col => {
        const tdExtra = document.createElement("td");
        tdExtra.textContent = entry[col] || "";
        tdExtra.classList.add("extra-column");
        tr.appendChild(tdExtra);
      });

      // İşlemler sütunu: Düzenle butonu
      const tdActions = document.createElement("td");
      const editBtn = document.createElement("button");
      editBtn.textContent = "Düzenle";
      editBtn.classList.add("btn-secondary");
      editBtn.addEventListener("click", () => {
        window.location.href = `antrepo-giris-formu.html?mode=edit&id=${entry.id}`;
      });
      tdActions.appendChild(editBtn);
      tr.appendChild(tdActions);

      entriesTableBody.appendChild(tr);
    });
  }

  // Yeni kayıt oluşturma butonuna tıklayınca
  newEntryBtn.addEventListener("click", () => {
    window.location.href = "antrepo-giris-formu.html";
  });

  // Sütun ekleme butonuyla dropdown'u aç/kapat
  addColumnBtn.addEventListener("click", () => {
    if (columnDropdown.style.display === "none" || columnDropdown.style.display === "") {
      columnDropdown.style.display = "block";
    } else {
      columnDropdown.style.display = "none";
    }
  });

  // Ek sütunları uygula butonuna tıklanınca
  applyColumnsBtn.addEventListener("click", () => {
    const checkboxes = columnDropdown.querySelectorAll("input[type='checkbox']:checked");
    additionalColumns = Array.from(checkboxes).map(cb => cb.value);
    // Yeni sütun seçimine göre verileri tekrar çek
    fetchEntries();
    // Dropdown'u kapat
    columnDropdown.style.display = "none";
  });

  // Sayfa yüklendiğinde kayıtları çek
  fetchEntries();
});
