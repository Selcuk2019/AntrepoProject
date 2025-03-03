import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async function() {
  const unitTableBody = document.getElementById("unitTableBody");
  const newUnitBtn = document.getElementById("newUnitBtn");

  async function fetchUnits() {
    try {
      const response = await fetch(`${baseUrl}/api/birimler`);
      if (!response.ok) throw new Error(`Sunucu hatası: ${response.status}`);
      const units = await response.json();
      renderUnits(units);
    } catch (error) {
      console.error("Birimler çekilirken hata:", error);
    }
  }

  function renderUnits(units) {
    unitTableBody.innerHTML = "";
    units.forEach(unit => {
      const tr = document.createElement("tr");
      
      const tdId = document.createElement("td");
      tdId.textContent = unit.id;
      
      const tdName = document.createElement("td");
      tdName.textContent = unit.birim_adi;
      
      const tdKategori = document.createElement("td");
      tdKategori.textContent = unit.kategori;
      
      const tdSembol = document.createElement("td");
      tdSembol.textContent = unit.sembol;
      
      const tdKisaKod = document.createElement("td");
      tdKisaKod.textContent = unit.kisa_kod;
      
      const tdDurum = document.createElement("td");
      tdDurum.textContent = unit.durum;
      
      // İşlemler sütunu
      const tdActions = document.createElement("td");
      const editBtn = document.createElement("button");
      editBtn.textContent = "Düzenle";
      editBtn.classList.add("btn-secondary");
      editBtn.addEventListener("click", function() {
        window.location.href = "unit-form.html?id=" + unit.id;
      });
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Sil";
      deleteBtn.classList.add("btn-secondary");
      deleteBtn.addEventListener("click", async function() {
        if (confirm("Bu birimi silmek istediğinize emin misiniz?")) {
          try {
            const delResp = await fetch(`${baseUrl}/api/birimler/${unit.id}`, { method: "DELETE" });
            if (!delResp.ok) throw new Error(`Silme hatası: ${delResp.status}`);
            fetchUnits();
          } catch (error) {
            console.error("Silme sırasında hata:", error);
          }
        }
      });
      tdActions.appendChild(editBtn);
      tdActions.appendChild(deleteBtn);
      
      tr.appendChild(tdId);
      tr.appendChild(tdName);
      tr.appendChild(tdKategori);
      tr.appendChild(tdSembol);
      tr.appendChild(tdKisaKod);
      tr.appendChild(tdDurum);
      tr.appendChild(tdActions);
      
      unitTableBody.appendChild(tr);
    });
  }

  fetchUnits();

  newUnitBtn.addEventListener("click", function() {
    window.location.href = "unit-form.html";
  });
});
