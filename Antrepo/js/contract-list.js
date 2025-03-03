import { baseUrl } from './config.js'; 
// const baseUrl = 'http://localhost:3002';

document.addEventListener("DOMContentLoaded", async function() {
  const contractTableBody = document.getElementById("contractTableBody");
  const newContractBtn = document.getElementById("newContractBtn");

  async function fetchContracts() {
    try {
      const resp = await fetch(`${baseUrl}/api/sozlesmeler`);
      if (!resp.ok) throw new Error(`Sunucu hatası: ${resp.status}`);
      const contracts = await resp.json();
      renderContracts(contracts);
    } catch (error) {
      console.error("Sözleşmeler çekilirken hata:", error);
    }
  }

  function renderContracts(contracts) {
    contractTableBody.innerHTML = "";
    contracts.forEach(contract => {
      const tr = document.createElement("tr");

      // ID
      const tdId = document.createElement("td");
      tdId.textContent = contract.id || "";
      tr.appendChild(tdId);

      // Sözleşme Kodu
      const tdKod = document.createElement("td");
      tdKod.textContent = contract.sozlesme_kodu || "";
      tr.appendChild(tdKod);

      // Sözleşme Adı
      const tdName = document.createElement("td");
      tdName.textContent = contract.sozlesme_adi || "";
      tr.appendChild(tdName);

      // Başlangıç Tarihi (substring ile saat atıyoruz)
      const rawStart = contract.baslangic_tarihi;
      const startDateOnly = rawStart ? rawStart.substring(0, 10) : "-";
      const tdStart = document.createElement("td");
      tdStart.textContent = startDateOnly;
      tr.appendChild(tdStart);

      // Bitiş Tarihi
      const rawEnd = contract.bitis_tarihi;
      const endDateOnly = rawEnd ? rawEnd.substring(0, 10) : "-";
      const tdEnd = document.createElement("td");
      tdEnd.textContent = endDateOnly;
      tr.appendChild(tdEnd);

      // Fatura Periyodu
      const tdFreq = document.createElement("td");
      tdFreq.textContent = contract.fatura_periyodu || "-";
      tr.appendChild(tdFreq);

      // Min Fatura
      const tdMin = document.createElement("td");
      tdMin.textContent = contract.min_fatura || "0";
      tr.appendChild(tdMin);

      // İşlemler
      const tdActions = document.createElement("td");

      // Düzenle butonu
      const editBtn = document.createElement("button");
      editBtn.textContent = "Düzenle";
      editBtn.classList.add("btn-secondary");
      editBtn.addEventListener("click", function() {
        window.location.href = "contract-form.html?id=" + contract.id;
      });
      tdActions.appendChild(editBtn);

      // Sil butonu (örnek)
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Sil";
      deleteBtn.classList.add("btn-secondary");
      deleteBtn.addEventListener("click", async function() {
        if (confirm("Bu sözleşmeyi silmek istediğinize emin misiniz?")) {
          try {
            // UYARI: /api/sozlesmeler/:id rotasını kullandığınızdan emin olun
            const delResp = await fetch(`${baseUrl}/api/sozlesmeler/${contract.id}`, {
              method: "DELETE"
            });
            if (!delResp.ok) throw new Error(`Silme hatası: ${delResp.status}`);
            fetchContracts(); 
          } catch (error) {
            console.error("Silme sırasında hata:", error);
          }
        }
      });
      tdActions.appendChild(deleteBtn);

      tr.appendChild(tdActions);

      contractTableBody.appendChild(tr);
    });
  }

  // Listeyi çek
  fetchContracts();

  // "Yeni Sözleşme Ekle" butonu
  newContractBtn.addEventListener("click", function() {
    window.location.href = "contract-form.html";
  });
});
