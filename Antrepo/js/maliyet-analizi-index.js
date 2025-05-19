import { baseUrl } from './config.js';

$(document).ready(async function () {
    let tableData = [];
    const table = $('#maliyetTable');

    async function fetchMaliyetAnalizi() {
        try {
            const resp = await fetch(`${baseUrl}/api/maliyet-analizi`);
            if (!resp.ok) throw new Error(`Hata: ${resp.status}`);
            tableData = await resp.json();
            renderTable(tableData);
        } catch (error) {
            $('#maliyetTableBody').html(`<tr><td colspan="13">Veri alınamadı: ${error.message}</td></tr>`);
        }
    }

    function renderTable(data) {
        const tbody = $('#maliyetTableBody');
        tbody.empty();
        for (const item of data) {
            tbody.append(`
                <tr>
                    <td>${item.antrepoName || "-"}</td>
                    <td>${item.entryDate || "-"}</td>
                    <td><a href="antrepo-giris-formu.html?id=${encodeURIComponent(item.entryId)}&mode=view" class="table-link">${item.formNo || "-"}</a></td>
                    <td>${item.entryCount != null ? item.entryCount : "-"}</td>
                    <td>${item.entryKapCount != null ? item.entryKapCount : "-"}</td>
                    <td>${item.lastExitDate || "-"}</td>
                    <td>${item.lastExitAmount != null ? item.lastExitAmount : "-"}</td>
                    <td>${item.currentStock != null ? parseFloat(item.currentStock).toFixed(2) : "-"}</td>
                    <td>${item.currentKapCount != null ? item.currentKapCount : "-"}</td>
                    <td>${item.currentCost != null && item.paraBirimi ? parseFloat(item.currentCost).toFixed(2) + " " + item.paraBirimi : "-"}</td>
                    <td>${item.totalCost != null && item.paraBirimi ? parseFloat(item.totalCost).toFixed(2) + " " + item.paraBirimi : "-"}</td>
                    <td>${item.unitCostImpact != null && item.paraBirimi ? parseFloat(item.unitCostImpact).toFixed(2) + " " + item.paraBirimi : "-"}</td>
                    <td><a href="hesaplama-motoru.html?entryId=${encodeURIComponent(item.entryId)}" class="btn-detail">Detay</a></td>
                </tr>
            `);
        }
        // DataTable'ı başlat veya yeniden başlat
        if ($.fn.dataTable.isDataTable('#maliyetTable')) {
            table.DataTable().destroy();
        }
        table.DataTable({
            responsive: true,
            pageLength: 25,
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/tr.json'
            },
            order: [[1, 'desc']],
            columnDefs: [
                { targets: -1, orderable: false }
            ]
        });
    }

    await fetchMaliyetAnalizi();
});

// Excel'e aktarma fonksiyonu (XLSX kütüphanesi gerektirir)
window.exportToExcel = function() {
  const table = document.getElementById("maliyetTable");
  const wb = XLSX.utils.table_to_book(table, { sheet: "Maliyet Analizi" });
  XLSX.writeFile(wb, `Maliyet_Analizi_${new Date().toISOString().split('T')[0]}.xlsx`);
};