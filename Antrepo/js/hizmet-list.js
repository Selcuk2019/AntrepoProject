import { baseUrl } from './config.js';

document.addEventListener("DOMContentLoaded", async function() {
  const serviceTableBody = document.getElementById("serviceTableBody");
  const newServiceBtn = document.getElementById("newServiceBtn");

  async function fetchServices() {
    try {
      const resp = await fetch(`${baseUrl}/api/hizmetler`);
      if (!resp.ok) throw new Error(`Sunucu hatası: ${resp.status}`);
      const services = await resp.json();
      renderServices(services);
    } catch (error) {
      console.error("Hizmetler çekilirken hata:", error);
    }
  }

  function renderServices(services) {
    serviceTableBody.innerHTML = "";
    services.forEach(service => {
      const tr = document.createElement("tr");

      const tdId = document.createElement("td");
      tdId.textContent = service.id;

      const tdAdi = document.createElement("td");
      tdAdi.textContent = service.hizmet_adi;

      const tdKodu = document.createElement("td");
      tdKodu.textContent = service.hizmet_kodu;

      const tdTipi = document.createElement("td");
      tdTipi.textContent = service.hizmet_tipi;

      const tdBirim = document.createElement("td");
      tdBirim.textContent = service.birim_adi || service.birim_id;

      const tdParaBirimi = document.createElement("td");
      if (service.para_birimi_adi) {
        tdParaBirimi.textContent = `${service.para_birimi_adi} (${service.para_iso_kodu})`;
      } else {
        tdParaBirimi.textContent = service.para_birimi_id || "-";
      }

      const tdTemel = document.createElement("td");
      tdTemel.textContent = service.temel_ucret;

      const tdMin = document.createElement("td");
      tdMin.textContent = service.min_ucret !== null ? service.min_ucret : "-";

      const tdCarpan = document.createElement("td");
      tdCarpan.textContent = service.carpan !== null ? service.carpan : "-";

      const tdDurum = document.createElement("td");
      tdDurum.textContent = service.durum;

      const tdActions = document.createElement("td");
      const editBtn = document.createElement("button");
      editBtn.textContent = "Düzenle";
      editBtn.classList.add("btn-secondary");
      editBtn.addEventListener("click", function() {
        window.location.href = "hizmet-form.html?id=" + service.id;
      });
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Sil";
      deleteBtn.classList.add("btn-secondary");
      deleteBtn.addEventListener("click", async function() {
        if (confirm("Bu hizmeti silmek istediğinize emin misiniz?")) {
          try {
            const delResp = await fetch(`${baseUrl}/api/hizmetler/${service.id}`, { method: "DELETE" });
            if (!delResp.ok) throw new Error(`Silme hatası: ${delResp.status}`);
            fetchServices();
          } catch (error) {
            console.error("Silme sırasında hata:", error);
          }
        }
      });
      tdActions.appendChild(editBtn);
      tdActions.appendChild(deleteBtn);

      tr.appendChild(tdId);
      tr.appendChild(tdAdi);
      tr.appendChild(tdKodu);
      tr.appendChild(tdTipi);
      tr.appendChild(tdBirim);
      tr.appendChild(tdParaBirimi);
      tr.appendChild(tdTemel);
      tr.appendChild(tdMin);
      tr.appendChild(tdCarpan);
      tr.appendChild(tdDurum);
      tr.appendChild(tdActions);

      serviceTableBody.appendChild(tr);
    });
  }

  fetchServices();

  newServiceBtn.addEventListener("click", function() {
    window.location.href = "hizmet-form.html";
  });
});
