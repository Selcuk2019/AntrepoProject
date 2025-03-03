import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async function() {
  const antrepoTableBody = document.getElementById("antrepoTableBody");
  const newAntrepoBtn = document.getElementById("newAntrepoBtn");

  async function fetchAntrepolar() {
    try {
      const response = await fetch(`${baseUrl}/api/antrepolar`);
      if (!response.ok) {
        throw new Error(`Sunucu hatası: ${response.status}`);
      }
      const antrepolar = await response.json();
      renderAntrepolar(antrepolar);
    } catch (error) {
      console.error("Antrepolar çekilirken hata:", error);
    }
  }

  function renderAntrepolar(antrepolar) {
    antrepoTableBody.innerHTML = "";
    // Örnek: Her antrepo için satır oluşturma
    antrepolar.forEach(antrepo => {
      const tr = document.createElement("tr");

      const tdId = document.createElement("td");
      tdId.textContent = antrepo.id;
      const tdKodu = document.createElement("td");
      tdKodu.textContent = antrepo.antrepoKodu;
      const tdAdi = document.createElement("td");
      tdAdi.textContent = antrepo.antrepoAdi;
      const tdTipi = document.createElement("td");
      tdTipi.textContent = antrepo.antrepoTipi; // Eğer ID ise, bu değeri isimle eşleştirmek gerekebilir
      const tdGumruk = document.createElement("td");
      tdGumruk.textContent = antrepo.gumruk;
      const tdMudurluk = document.createElement("td");
      tdMudurluk.textContent = antrepo.gumrukMudurlugu;
      const tdSehir = document.createElement("td");
      tdSehir.textContent = antrepo.sehir;
      const tdAdres = document.createElement("td");
      tdAdres.textContent = antrepo.acikAdres;
      const tdSirket = document.createElement("td");
      tdSirket.textContent = antrepo.antrepoSirketi;
      const tdKapasite = document.createElement("td");
      tdKapasite.textContent = antrepo.kapasite || "-";
      const tdAktif = document.createElement("td");
      tdAktif.textContent = antrepo.aktif ? "Evet" : "Hayır";

      // İşlemler sütunu: Düzenle, Sil butonları
      const tdActions = document.createElement("td");
      const editBtn = document.createElement("button");
      editBtn.textContent = "Düzenle";
      editBtn.classList.add("btn-secondary");
      editBtn.addEventListener("click", function() {
        window.location.href = "antrepo-detail.html?id=" + antrepo.id;
      });
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Sil";
      deleteBtn.classList.add("btn-secondary");
      deleteBtn.addEventListener("click", async function() {
        if (confirm("Kaydı silmek istediğinize emin misiniz?")) {
          try {
            const delResponse = await fetch(`${baseUrl}/api/antrepolar/${antrepo.id}`, {
              method: "DELETE"
            });
            if (!delResponse.ok) {
              throw new Error(`Silme hatası: ${delResponse.status}`);
            }
            fetchAntrepolar(); // Silme sonrası listeyi güncelle
          } catch (error) {
            console.error("Silme sırasında hata:", error);
          }
        }
      });
      tdActions.appendChild(editBtn);
      tdActions.appendChild(deleteBtn);

      tr.appendChild(tdId);
      tr.appendChild(tdKodu);
      tr.appendChild(tdAdi);
      tr.appendChild(tdTipi);
      tr.appendChild(tdGumruk);
      tr.appendChild(tdMudurluk);
      tr.appendChild(tdSehir);
      tr.appendChild(tdAdres);
      tr.appendChild(tdSirket);
      tr.appendChild(tdKapasite);
      tr.appendChild(tdAktif);
      tr.appendChild(tdActions);

      antrepoTableBody.appendChild(tr);
    });
  }

  // Sayfa yüklendiğinde verileri çek
  fetchAntrepolar();

  newAntrepoBtn.addEventListener("click", function() {
    window.location.href = "antrepo-form.html";
  });
});
