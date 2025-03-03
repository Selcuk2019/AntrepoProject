document.addEventListener("DOMContentLoaded", function() {
    // 1) Stacked Bar Chart: "Envanter Taşıma Maliyeti"
    // Örnek veri: 5 depo, 4 maliyet türü (Depolama, Elleçleme, İdari, Zarar)
    const traceStorage = {
      x: ["Depo 1", "Depo 2", "Depo 3", "Depo 4", "Depo 5"],
      y: [500000, 300000, 400000, 600000, 200000],
      name: "Depolama",
      type: "bar"
    };
    const traceHandling = {
      x: ["Depo 1", "Depo 2", "Depo 3", "Depo 4", "Depo 5"],
      y: [200000, 100000, 150000, 250000, 100000],
      name: "Elleçleme",
      type: "bar"
    };
    const traceAdministrative = {
      x: ["Depo 1", "Depo 2", "Depo 3", "Depo 4", "Depo 5"],
      y: [80000, 50000, 70000, 90000, 30000],
      name: "İdari",
      type: "bar"
    };
    const traceLoss = {
      x: ["Depo 1", "Depo 2", "Depo 3", "Depo 4", "Depo 5"],
      y: [30000, 20000, 10000, 40000, 15000],
      name: "Zarar",
      type: "bar"
    };
  
    Plotly.newPlot(
      "chartInventoryCost",
      [traceStorage, traceHandling, traceAdministrative, traceLoss],
      {
        barmode: "stack",
        title: "Envanter Taşıma Maliyeti (Tahmini)",
        xaxis: { title: "Depolar" },
        yaxis: { title: "Maliyet (₺)" }
      }
    );
  
    // 2) Gauge Chart: "Envanter Devir Oranı"
    // Örnek veri: Devir Oranı = 3.76
    const dataTurnover = [
      {
        type: "indicator",
        mode: "gauge+number",
        value: 3.76,
        gauge: {
          axis: { range: [0, 10] },
          bar: { color: "#408dfb" },
          steps: [
            { range: [0, 3], color: "#e0e0e0" },
            { range: [3, 7], color: "#b3b3b3" },
            { range: [7, 10], color: "#999999" }
          ]
        }
      }
    ];
    const layoutTurnover = {
      title: "Devir Oranı (Yıllık)"
    };
    Plotly.newPlot("chartTurnoverRatio", dataTurnover, layoutTurnover);
  
    // 3) Gauge Chart: "Stok-Satış Oranı"
    // Örnek veri: %18.33
    const dataSalesRatio = [
      {
        type: "indicator",
        mode: "gauge+number+delta",
        value: 18.33,
        gauge: {
          axis: { range: [0, 100], suffix: "%" },
          bar: { color: "#408dfb" },
          steps: [
            { range: [0, 40], color: "#e0e0e0" },
            { range: [40, 70], color: "#b3b3b3" },
            { range: [70, 100], color: "#999999" }
          ]
        },
        delta: { reference: 15 }
      }
    ];
    const layoutSalesRatio = {
      title: "Stok-Satış Oranı (Aylık)"
    };
    Plotly.newPlot("chartSalesRatio", dataSalesRatio, layoutSalesRatio);
  });
  