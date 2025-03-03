import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("warehouseEntryForm");
    const fileNumberInput = document.getElementById("fileNumber");
    const companySelect = document.getElementById("company");
    const warehouseSelect = document.getElementById("warehouse");
    const weightInput = document.getElementById("weight");
  
    // Statik veri: Şirket ve Gümrük seçenekleri
    const companies = [
      { id: 1, name: "Antrepo A.Ş." },
      { id: 2, name: "Liman Antrepo" }
    ];
    const warehouses = [
      { id: 1, name: "Ambarlı Gümrük" },
      { id: 2, name: "Haydarpaşa Gümrük" }
    ];
  
    // Şirket seçeneklerini select içine ekle
    companies.forEach(company => {
      const option = document.createElement("option");
      option.value = company.id;
      option.textContent = company.name;
      companySelect.appendChild(option);
    });
  
    // Gümrük seçeneklerini select içine ekle
    warehouses.forEach(warehouse => {
      const option = document.createElement("option");
      option.value = warehouse.id;
      option.textContent = warehouse.name;
      warehouseSelect.appendChild(option);
    });
  
    // Form submit işlemi
    form.addEventListener("submit", function(event) {
      event.preventDefault();
      const formData = {
        fileNumber: fileNumberInput.value,
        company: companySelect.value,
        warehouse: warehouseSelect.value,
        weight: weightInput.value
      };
      console.log("Form Submitted", formData);
      alert("Form Submitted. Check console for details.");
      // Ek işlem ekleyebilir veya veriyi bir API'ye gönderebilirsin.
    });
  });
  