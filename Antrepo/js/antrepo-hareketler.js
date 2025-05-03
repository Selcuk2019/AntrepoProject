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

      // Ürün Adı
      const tdUrunAdi = document.createElement("td");
      tdUrunAdi.textContent = item.urun_adi || "";

      // Ürün Kodu
      const tdUrunKodu = document.createElement("td");
      tdUrunKodu.textContent = item.urun_kodu || "";

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
        tdUrunAdi,
        tdUrunKodu,
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

  
});
