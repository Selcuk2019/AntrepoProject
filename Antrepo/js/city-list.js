import { baseUrl } from './config.js';



document.addEventListener("DOMContentLoaded", function() {
    // Vue’daki data() içinde tanımlanan cities dizisini burada tutuyoruz
    let cities = [
      { id: 1, name: "İstanbul", port: "Ambarlı" },
      { id: 2, name: "İzmir", port: "Alsancak" }
    ];
  
    const cityTableBody = document.getElementById("cityTableBody");
    const addCityBtn = document.getElementById("addCityBtn");
  
    // Başlangıçta tabloyu doldur
    renderCities();
  
    // "Yeni Şehir Ekle" butonuna tıklandığında prompt aç
    addCityBtn.addEventListener("click", function() {
      const name = prompt("Şehir Adı:");
      const port = prompt("Liman Adı:");
      if (name && port) {
        const newCity = {
          id: cities.length + 1,
          name: name,
          port: port
        };
        cities.push(newCity);
        renderCities();
      }
    });
  
    // Şehir listesini tabloya basan fonksiyon
    function renderCities() {
      cityTableBody.innerHTML = ""; // Eski satırları temizle
      cities.forEach(city => {
        const tr = document.createElement("tr");
  
        const tdId = document.createElement("td");
        tdId.textContent = city.id;
  
        const tdName = document.createElement("td");
        tdName.textContent = city.name;
  
        const tdPort = document.createElement("td");
        tdPort.textContent = city.port;
  
        tr.appendChild(tdId);
        tr.appendChild(tdName);
        tr.appendChild(tdPort);
        cityTableBody.appendChild(tr);
      });
    }
  });
  