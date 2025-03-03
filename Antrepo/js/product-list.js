import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async function() {
  const productTableBody = document.getElementById("productTableBody");
  const newProductBtn = document.getElementById("newProductBtn");

  // API'den ürünleri çekme fonksiyonu
  async function loadProductsFromAPI() {
    try {
      const resp = await fetch(`${baseUrl}/api/urunler`);
      if (!resp.ok) throw new Error(`Ürünler çekilemedi: ${resp.status}`);
      const products = await resp.json();
      renderProducts(products);
    } catch (error) {
      console.error("Ürün listesi hata:", error);
      alert("Ürün listesi yüklenirken hata: " + error.message);
    }
  }

  // Ürün listesini tabloya basan fonksiyon
  function renderProducts(products) {
    productTableBody.innerHTML = "";
    products.forEach(product => {
      const tr = document.createElement("tr");

      // ID sütunu
      const tdId = document.createElement("td");
      tdId.textContent = product.id || "";

      // Ürün Adı sütunu
      const tdName = document.createElement("td");
      const nameLink = document.createElement("a");
      nameLink.textContent = product.name || "(No Name)";
      nameLink.href = `stock-card.html?id=${product.id}`;
      tdName.appendChild(nameLink);

      // Ürün Kodu sütunu
      const tdCode = document.createElement("td");
      tdCode.textContent = product.code || "";

      // İşlemler sütunu (örnek: Düzenle butonu)
      const tdActions = document.createElement("td");
      const editBtn = document.createElement("button");
      editBtn.textContent = "Düzenle";
      editBtn.classList.add("btn-secondary");
      editBtn.addEventListener("click", function() {
        window.location.href = `stock-card.html?id=${product.id}`;
      });
      tdActions.appendChild(editBtn);

      // Satırları ekle
      tr.appendChild(tdId);
      tr.appendChild(tdName);
      tr.appendChild(tdCode);
      tr.appendChild(tdActions);
      productTableBody.appendChild(tr);
    });
  }

  // Sayfa açılır açılır ürünleri yükle
  await loadProductsFromAPI();

  // Yeni Ürün Ekle butonuna tıklayınca ürün ekleme formuna yönlendir
  newProductBtn.addEventListener("click", () => {
    window.location.href = "product-form.html";
  });
});
