import { baseUrl } from './config.js';

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
      showError("Sözleşmeler yüklenirken hata oluştu");
    }
  }

  function renderContracts(contracts) {
    contractTableBody.innerHTML = "";
    contracts.forEach(contract => {
      const tr = createContractRow(contract);
      contractTableBody.appendChild(tr);
    });
  }

  function createContractRow(contract) {
    const tr = document.createElement("tr");
    
    // Basic fields
    const fields = [
      { key: 'id', format: val => val || "" },
      { key: 'sozlesme_kodu', format: val => val || "" },
      { key: 'sozlesme_adi', format: val => val || "" },
      { key: 'baslangic_tarihi', format: val => val ? val.substring(0, 10) : "-" },
      { key: 'bitis_tarihi', format: val => val ? val.substring(0, 10) : "-" },
      { key: 'fatura_periyodu', format: val => val || "-" },
      { key: 'min_fatura', format: val => val || "0" }
    ];

    // Create cells for basic fields
    fields.forEach(field => {
      const td = document.createElement("td");
      td.textContent = field.format(contract[field.key]);
      tr.appendChild(td);
    });

    // Actions cell
    // Actions cell
const tdActions = document.createElement("td");
tdActions.className = "action-buttons";

  // Edit button
  const editBtn = document.createElement("button");
  editBtn.innerHTML = '<i class="fas fa-edit"></i> Düzenle';
  editBtn.className = "btn btn-primary btn-sm me-2";
  editBtn.addEventListener("click", async () => {
    try {
      const response = await fetch(`${baseUrl}/api/sozlesmeler/${contract.id}`);
      if (!response.ok) throw new Error('Sözleşme bulunamadı');
      window.location.href = `contract-form.html?id=${contract.id}`;
    } catch (error) {
      console.error('Sözleşme yükleme hatası:', error);
      showError('Sözleşme açılırken hata oluştu');
    }
  });
  tdActions.appendChild(editBtn);

  // Delete button (aynı görünüme getirildi)
  const deleteBtn = document.createElement("button");
  deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Sil';
  deleteBtn.className = "btn btn-primary btn-sm me-2";  // Artık aynı stil
  deleteBtn.addEventListener("click", async () => {
    if (confirm("Bu sözleşmeyi silmek istediğinize emin misiniz?")) {
      try {
        const response = await fetch(`${baseUrl}/api/sozlesmeler/${contract.id}`);
        if (!response.ok) throw new Error('Sözleşme bulunamadı');
        
        const delResp = await fetch(`${baseUrl}/api/sozlesmeler/${contract.id}`, {
          method: "DELETE"
        });
        if (!delResp.ok) throw new Error(`Silme hatası: ${delResp.status}`);
        
        await fetchContracts();
        showSuccess("Sözleşme başarıyla silindi");
      } catch (error) {
        console.error('Sözleşme silme hatası:', error);
        showError('Sözleşme silinirken hata oluştu');
      }
    }
  });
  tdActions.appendChild(deleteBtn);

  tr.appendChild(tdActions);

    return tr;
  }

  // Initialize
  await fetchContracts();

  // New contract button
  newContractBtn.addEventListener("click", () => {
    window.location.href = "contract-form.html";
  });
});

// Utility functions for notifications
function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  document.querySelector(".content")?.prepend(errorDiv);
  setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
  const successDiv = document.createElement("div");
  successDiv.className = "success-message";
  successDiv.textContent = message;
  document.querySelector(".content")?.prepend(successDiv);
  setTimeout(() => successDiv.remove(), 5000);
}