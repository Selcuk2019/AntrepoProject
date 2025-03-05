/************************************************************
 * File: antrepo-hareketler.js
 * İŞLEV:
 *  - Belirli bir antrepo_giris kaydına ait giriş/çıkış hareketlerini listelemek
 *  - Yeni Giriş hareketi eklemek (modalNewEntry)
 *  - Yeni Çıkış hareketi eklemek (modalNewExit)
 *  - Hareketi silmek
 ************************************************************/
import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", () => {
  // URL'den ?id= parametresini alalım (hangi antrepo_giris kaydı?)
  const urlParams = new URLSearchParams(window.location.search);
  const girisId = urlParams.get("id");

  // Hareketlerin listeleneceği tablo gövdesi
  const hareketTableBody = document.getElementById("giriscikisTableBody");

  // Butonlar
  const newEntryBtn = document.getElementById("newEntryBtn");
  const newExitBtn = document.getElementById("newExitBtn");

  // Modal Elemanları: Yeni Giriş
  const newEntryModal = document.getElementById("newEntryModal");
  const newEntryForm = document.getElementById("newEntryForm");
  const entryCancelBtn = document.getElementById("entryCancelBtn");

  // Modal Elemanları: Yeni Çıkış
  const newExitModal = document.getElementById("newExitModal");
  const newExitForm = document.getElementById("newExitForm");
  const exitCancelBtn = document.getElementById("exitCancelBtn");

  /************************************************************
   * 1) Hareketleri Listele
   ************************************************************/
  async function fetchHareketler() {
    try {
      if (!girisId) {
        console.warn("URL parametresinde 'id' bulunamadı!");
        return;
      }
      const resp = await fetch(`${baseUrl}/api/antrepo-giris/${girisId}/hareketler`);
      if (!resp.ok) throw new Error(`Hareket listesi hatası: ${resp.status}`);
      const data = await resp.json();
      renderHareketler(data);
    } catch (error) {
      console.error("Hareketler çekilirken hata:", error);
    }
  }

  /************************************************************
   * 2) Hareketleri Tabloya Yazdır
   ************************************************************/
  function renderHareketler(list) {
    hareketTableBody.innerHTML = "";
    list.forEach(item => {
      const tr = document.createElement("tr");

      // Tarih
      const tdTarih = document.createElement("td");
      tdTarih.textContent = item.islem_tarihi ? item.islem_tarihi.substring(0, 10) : "";

      // İşlem tipi (Giriş/Çıkış)
      const tdTip = document.createElement("td");
      tdTip.textContent = item.islem_tipi;

      // Miktar
      const tdMiktar = document.createElement("td");
      tdMiktar.textContent = item.miktar;

      // Kap Adedi
      const tdKapAdeti = document.createElement("td");
      tdKapAdeti.textContent = item.kap_adeti || "-";

      // Brüt Ağırlık
      const tdBrutAgirlik = document.createElement("td");
      tdBrutAgirlik.textContent = item.brut_agirlik || "-";

      // Net Ağırlık
      const tdNetAgirlik = document.createElement("td");
      tdNetAgirlik.textContent = item.net_agirlik || "-";

      // Birim
      const tdBirim = document.createElement("td");
      tdBirim.textContent = item.birim_adi || item.birim_id || "-";

      // Açıklama
      const tdAciklama = document.createElement("td");
      tdAciklama.textContent = item.aciklama || "";

      // İşlemler (silmek vs.)
      const tdActions = document.createElement("td");
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Sil";
      deleteBtn.classList.add("btn-secondary");
      deleteBtn.addEventListener("click", async () => {
        if (!confirm("Bu hareketi silmek istediğinize emin misiniz?")) return;
        try {
          const delResp = await fetch(`${baseUrl}/api/antrepo-giris/${girisId}/hareketler/${item.id}`, {
            method: "DELETE"
          });
          if (!delResp.ok) throw new Error(`Silme hatası: ${delResp.status}`);
          fetchHareketler();
        } catch (error) {
          console.error("Silme sırasında hata:", error);
          alert("Silme hatası: " + error.message);
        }
      });
      tdActions.appendChild(deleteBtn);

      tr.append(
        tdTarih,
        tdTip,
        tdMiktar,
        tdKapAdeti,
        tdBrutAgirlik,
        tdNetAgirlik,
        tdBirim,
        tdAciklama,
        tdActions
      );
      hareketTableBody.appendChild(tr);
    });
  }

  /************************************************************
   * 3) Yeni Giriş Ekle – Modal Açma
   ************************************************************/
  if (newEntryBtn) {
    newEntryBtn.addEventListener("click", () => {
      if (newEntryForm) {
        newEntryForm.reset(); // Formu temizle
      }
      if (newEntryModal) {
        newEntryModal.style.display = "flex"; // Modalı göster
      }
    });
  }

  /************************************************************
   * 4) Yeni Giriş Modal İptal Butonu
   ************************************************************/
  if (entryCancelBtn) {
    entryCancelBtn.addEventListener("click", () => {
      if (newEntryModal) {
        newEntryModal.style.display = "none"; // Modalı kapat
      }
      if (newEntryForm) {
        newEntryForm.reset(); // Formu temizle
      }
    });
  }

  

  /************************************************************
   * 5) Yeni Giriş Modal Formu Submit İşlemi
   ************************************************************/
  /*if (newEntryForm) {
    newEntryForm.addEventListener("submit", async (e) => {
      console.log("Giriş formu submit edildi");
      e.preventDefault(); // Form submit'i engelle
      e.stopPropagation(); // Event bubbling'i engelle

      // Modal formundan değerleri alalım
      const entryTarih = document.getElementById("modalAntrepoGirisTarihi")?.value;
      const entryMiktar = document.getElementById("modalMiktar")?.value;
      const entryKapAdeti = document.getElementById("modalKapAdeti")?.value;
      const entryBrutAgirlik = document.getElementById("modalBrutAgirlik")?.value;
      const entryNetAgirlik = document.getElementById("modalNetAgirlik")?.value;
      const entryAciklama = document.getElementById("modalAciklama")?.value;

      console.log("Form değerleri:", {
        entryTarih,
        entryMiktar,
        entryKapAdeti,
        entryBrutAgirlik,
        entryNetAgirlik,
        entryAciklama
      });

      // Zorunlu alan kontrolü
      if (!entryTarih || !entryMiktar) {
        alert("Lütfen tarih ve miktar alanlarını doldurun!");
        return;
      }

      // Gönderilecek JSON body
      const bodyData = {
        islem_tarihi: entryTarih,
        islem_tipi: "Giriş",
        miktar: entryMiktar,
        kap_adeti: entryKapAdeti || 0,
        brut_agirlik: entryBrutAgirlik || 0,
        net_agirlik: entryNetAgirlik || 0,
        birim_id: 1,
        aciklama: entryAciklama || "Yeni Giriş"
      };

      console.log("Gönderilecek veri:", bodyData);

      try {
        const resp = await fetch(`${baseUrl}/api/antrepo-giris/${girisId}/hareketler`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData)
        });
        if (!resp.ok) throw new Error(`Hata: ${resp.status}`);
        const result = await resp.json();
        console.log("Sunucu yanıtı:", result);

        if (result.success) {
          alert("Giriş kaydı eklendi!");
          if (newEntryModal) {
            newEntryModal.style.display = "none";
          }
          if (newEntryForm) {
            newEntryForm.reset();
          }
          fetchHareketler();
        } else {
          alert("İşlem başarısız: " + JSON.stringify(result));
        }
      } catch (error) {
        console.error("Giriş ekleme hatası:", error);
        alert("Giriş ekleme hatası: " + error.message);
      }
    });
  }*/

  /************************************************************
   * 6) Yeni Çıkış Ekle – Modal Açma
   ************************************************************/
  if (newExitBtn) {
    newExitBtn.addEventListener("click", () => {
      console.log("Çıkış modalı açılıyor");
      if (newExitForm) {
        newExitForm.reset();
      }
      if (newExitModal) {
        newExitModal.style.display = "flex";
      }
    });
  }

  /************************************************************
   * 7) Yeni Çıkış Modal İptal Butonu
   ************************************************************/
  if (exitCancelBtn) {
    exitCancelBtn.addEventListener("click", () => {
      console.log("Çıkış modalı kapatılıyor");
      if (newExitModal) {
        newExitModal.style.display = "none";
      }
      if (newExitForm) {
        newExitForm.reset();
      }
    });
  }

  /************************************************************
   * 8) Yeni Çıkış Modal Formu Submit İşlemi
   ************************************************************/
  /* if (newExitForm) {
    newExitForm.addEventListener("submit", async (e) => {
      console.log("Çıkış formu submit edildi");
      e.preventDefault(); // Form submit'i engelle
      e.stopPropagation(); // Event bubbling'i engelle

      const exitTarih = document.getElementById("modalExitTarih")?.value;
      const exitMiktar = document.getElementById("modalExitMiktar")?.value;
      const exitKapAdeti = document.getElementById("modalExitKapAdeti")?.value;
      const exitBrutAgirlik = document.getElementById("modalExitBrutAgirlik")?.value;
      const exitNetAgirlik = document.getElementById("modalExitNetAgirlik")?.value;

      console.log("Form değerleri:", {
        exitTarih,
        exitMiktar,
        exitKapAdeti,
        exitBrutAgirlik,
        exitNetAgirlik
      });

      // Zorunlu alan kontrolü
      if (!exitTarih || !exitMiktar) {
        alert("Lütfen tarih ve miktar alanlarını doldurun!");
        return;
      }

      // Ek alanlar
      const satProformaNo = document.getElementById("modalSatProformaNo")?.value;
      const satFaturaNo = document.getElementById("modalSatFaturaNo")?.value;
      const musteri = document.getElementById("modalMusteri")?.value;
      const teslimYeri = document.getElementById("modalTeslimYeri")?.value;
      const nakliyeFirma = document.getElementById("modalNakliyeFirma")?.value;
      const aracPlaka = document.getElementById("modalAracPlaka")?.value;
      const teslimSekli = document.getElementById("modalTeslimSekli")?.value;

      const exitMesai = document.getElementById("modalExitMesai")?.value;
      const exitIsWeekend = document.getElementById("modalExitIsWeekend")?.value;

      // Açıklama birleştirme
      const ekBilgi =
        `Satış Proforma No: ${satProformaNo || '-'}\n` +
        `Satış Fatura No: ${satFaturaNo || '-'}\n` +
        `Müşteri: ${musteri || '-'}\n` +
        `Teslim Yeri: ${teslimYeri || '-'}\n` +
        `Nakliye Firması: ${nakliyeFirma || '-'}\n` +
        `Araç Plaka: ${aracPlaka || '-'}\n` +
        `Teslim Şekli: ${teslimSekli || '-'}`;

      const mesaiBilgi = exitMesai
        ? `\nMesai Süresi: ${exitMesai} dk, Hafta Sonu: ${exitIsWeekend === "true" ? "Evet" : "Hayır"}`
        : "";

      const finalAciklama = ekBilgi + mesaiBilgi;

      const bodyData = {
        islem_tarihi: exitTarih,
        islem_tipi: "Çıkış",
        miktar: exitMiktar,
        kap_adeti: exitKapAdeti || 0,
        brut_agirlik: exitBrutAgirlik || 0,
        net_agirlik: exitNetAgirlik || 0,
        birim_id: 1,
        aciklama: finalAciklama
      };

      console.log("Gönderilecek veri:", bodyData);

      try {
        const resp = await fetch(`${baseUrl}/api/antrepo-giris/${girisId}/hareketler`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData)
        });
        if (!resp.ok) throw new Error(`Hata: ${resp.status}`);
        const result = await resp.json();
        console.log("Sunucu yanıtı:", result);

        if (result.success) {
          alert("Çıkış kaydı eklendi!");
          if (newExitModal) {
            newExitModal.style.display = "none";
          }
          if (newExitForm) {
            newExitForm.reset();
          }
          fetchHareketler();
        } else {
          alert("İşlem başarısız: " + JSON.stringify(result));
        }
      } catch (error) {
        console.error("Çıkış ekleme hatası:", error);
        alert("Çıkış ekleme hatası: " + error.message);
      }
    });
  }



  // Sayfa yüklenince tabloyu dolduralım
  fetchHareketler(); */
});
