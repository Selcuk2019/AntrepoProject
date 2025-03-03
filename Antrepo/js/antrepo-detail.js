import { baseUrl } from './config.js';

document.addEventListener('DOMContentLoaded', async function() {
  // 1) URL parametresi
  const params = new URLSearchParams(window.location.search);
  const antrepoId = params.get("id");

  // 2) Sekme geçişi (opsiyonel)
  const tabs = document.querySelectorAll(".tabs-menu ul li");
  const panels = document.querySelectorAll(".tab-panel");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      const tabName = tab.getAttribute("data-tab");
      document.getElementById(tabName).classList.add("active");
    });
  });

  // 3) API'den antrepo kaydı çek
  if (!antrepoId) {
    console.warn("URL parametresinde antrepoId yok!");
    return;
  }

  let currentAntrepo = null;
  try {
    const resp = await fetch(`${baseUrl}/api/antrepolar/${antrepoId}`);
    if (!resp.ok) {
      throw new Error(`Sunucu hatası: ${resp.status}`);
    }
    currentAntrepo = await resp.json();
    // Veriyi fillForm ile inputlara doldur
    fillForm(currentAntrepo);
  } catch (error) {
    console.error("Antrepo verisi çekilirken hata:", error);
  }

  // 4) fillForm fonksiyonu (Tam Konum!)
  function fillForm(a) {
    // a.sehir_name -> "İstanbul", a.gumruk_name -> "Erenköy Gümrüğü", vb.
    document.getElementById("sehir").value = a.sehir_name || "";
    document.getElementById("gumruk").value = a.gumruk_name || "";
    document.getElementById("gumrukMudurlugu").value = a.mudurluk_name || "";
    document.getElementById("antrepoSirketi").value = a.sirket_name || "";
    document.getElementById("antrepoTipi").value = a.antrepo_tipi_name || "";

    // Diğer alanlar (ör. a.antrepoAdi, a.kapasite, a.acikAdres, a.notlar, vs.)
    document.getElementById("antrepoAdi").value = a.antrepoAdi || "";
    document.getElementById("antrepoKodu").value = a.antrepoKodu || "";
    document.getElementById("kapasite").value = a.kapasite || "";
    document.getElementById("acikAdres").value = a.acikAdres || "";
    document.getElementById("notlar").value = a.notlar || "";
  }

  // 5) Kaydet butonu (PUT /api/antrepolar/:id)
  const saveBtn = document.getElementById("saveAntrepoBtn");
  saveBtn.addEventListener("click", async function() {
    if (!currentAntrepo) return;

    // Form verilerini al
    const updatedData = {
      sehir: document.getElementById("sehir").value,
      gumruk: document.getElementById("gumruk").value,
      gumrukMudurlugu: document.getElementById("gumrukMudurlugu").value,
      antrepoSirketi: document.getElementById("antrepoSirketi").value,
      antrepoTipi: document.getElementById("antrepoTipi").value,
      antrepoAdi: document.getElementById("antrepoAdi").value,
      antrepoKodu: document.getElementById("antrepoKodu").value,
      kapasite: document.getElementById("kapasite").value,
      acikAdres: document.getElementById("acikAdres").value,
      notlar: document.getElementById("notlar").value,
      // vs. ...
    };

    try {
      const updateResp = await fetch(`${baseUrl}/api/antrepolar/${antrepoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (!updateResp.ok) {
        throw new Error(`Güncelleme hatası: ${updateResp.status}`);
      }
      const result = await updateResp.json();
      if (result.success) {
        alert("Antrepo güncellendi!");
      } else {
        alert("Güncelleme başarısız!");
      }
    } catch (error) {
      console.error("Güncelleme sırasında hata:", error);
    }
  });
});
