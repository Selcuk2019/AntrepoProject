import { baseUrl } from './config.js';


const companyStore = {
    companies: [],
    customs: [],
  
    loadMockData: function() {
      // JSON dosyalarının yolu, js klasöründeyken data klasörüne göre ../data/... şeklinde ayarlanmalı.
      fetch("../data/companies.json")
        .then((res) => res.json())
        .then((data) => {
          companyStore.companies = data;
        })
        .catch((error) => console.error("Şirket verileri yüklenemedi:", error));
  
      fetch("../data/customs.json")
        .then((res) => res.json())
        .then((data) => {
          companyStore.customs = data;
        })
        .catch((error) => console.error("Gümrük verileri yüklenemedi:", error));
    },
  
    addCompany: function(newCompany) {
      companyStore.companies.push({
        id: String(companyStore.companies.length + 1),
        ...newCompany,
      });
    },
  
    addCustom: function(newCustom) {
      companyStore.customs.push({
        id: String(companyStore.customs.length + 1),
        ...newCustom,
      });
    },
  };
  
  // Global erişim için
  window.companyStore = companyStore;
  