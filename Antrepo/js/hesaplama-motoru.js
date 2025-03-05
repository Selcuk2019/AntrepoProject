import { baseUrl } from './config.js';

let isCalculating = false;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const girisId = urlParams.get("entryId");

    if (!girisId) {
      showError("Geçersiz 'entryId' parametresi.");
      return;
    }

    // HTML Elements - Single query
    const elements = {
      beyannameNo: document.getElementById("beyannameNo"),
      girisTarihi: document.getElementById("girisTarihi"),
      urunAdi: document.getElementById("urunAdi"),
      urunKodu: document.getElementById("urunKodu"),
      initialStock: document.getElementById("initialStock"),
      dailyTableBody: document.getElementById("dailyTableBody"),
      totalMaliyet: document.getElementById("totalMaliyet"),
      backBtn: document.getElementById("backBtn")
    };

    // Validate elements
    Object.entries(elements).forEach(([key, element]) => {
      if (!element) {
        throw new Error(`Required element '${key}' not found`);
      }
    });

    // Back button handler
    elements.backBtn.addEventListener("click", () => history.back());

    // Fetch and display data
    await fetchCalculation(girisId, elements);

  } catch (error) {
    console.error("Initialization error:", error);
    showError("Sayfa yüklenirken bir hata oluştu");
  }
});

async function fetchCalculation(girisId, elements) {
  if (isCalculating) return;
  isCalculating = true;

  try {
    const resp = await fetch(`${baseUrl}/api/hesaplama-motoru/${girisId}`);
    if (!resp.ok) {
      throw new Error(`HTTP error: ${resp.status}`);
    }
    
    const data = await resp.json();
    await populateResults(data, elements);

  } catch (error) {
    console.error("API error:", error);
    showError("Veri alınamadı: " + error.message);
  } finally {
    isCalculating = false;
  }
}

async function populateResults(result, elements) {
  const { antrepoGiris, dailyBreakdown = [], totalCost = 0 } = result;

  // Update summary info
  elements.beyannameNo.textContent = antrepoGiris?.beyanname_no || "-";
  elements.girisTarihi.textContent = antrepoGiris?.antrepo_giris_tarihi || "-";
  elements.urunAdi.textContent = antrepoGiris?.urun_tanimi || "-";
  elements.urunKodu.textContent = antrepoGiris?.urun_kodu || "-";
  elements.initialStock.textContent = antrepoGiris?.initialStock || "0";

  // Clear and populate table
  elements.dailyTableBody.innerHTML = "";
  
  // Create table rows in chunks for better performance
  const CHUNK_SIZE = 20;
  for (let i = 0; i < dailyBreakdown.length; i += CHUNK_SIZE) {
    const chunk = dailyBreakdown.slice(i, i + CHUNK_SIZE);
    
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        chunk.forEach((row, index) => {
          const actualIndex = i + index;
          const tr = createTableRow(row, actualIndex);
          elements.dailyTableBody.appendChild(tr);
        });
        resolve();
      });
    });
  }

  // Update total
  elements.totalMaliyet.textContent = totalCost.toFixed(2);
}

function createTableRow(row, index) {
  const tr = document.createElement("tr");
  
  const cells = [
    { text: (index + 1).toString() },
    { text: row.date },
    { text: (row.dayArdiye || 0).toFixed(2) },
    { text: (row.dayEkHizmet || 0).toFixed(2) },
    { text: (row.dayTotal || 0).toFixed(2) },
    { text: (row.cumulative || 0).toFixed(2) },
    { text: (row.stockAfter || 0).toFixed(2) }
  ];

  tr.innerHTML = cells.map(cell => `<td>${cell.text}</td>`).join("");
  return tr;
}

function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  document.querySelector(".content")?.prepend(errorDiv);
  
  // Auto-remove after 5 seconds
  setTimeout(() => errorDiv.remove(), 5000);
}