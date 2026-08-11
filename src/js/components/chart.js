let chartInstances = {};

export function createBarChart(canvasId, labels, dataValues, labelName = "Views") {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !window.Chart) return;

  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  chartInstances[canvasId] = new window.Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: labelName,
          data: dataValues,
          backgroundColor: "#8b5cf6",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: "#a1a1aa" },
        },
      },
      scales: {
        x: {
          ticks: { color: "#a1a1aa" },
          grid: { color: "#27273a" },
        },
        y: {
          ticks: { color: "#a1a1aa" },
          grid: { color: "#27273a" },
        },
      },
    },
  });
}

export function createDoughnutChart(canvasId, labels, dataValues) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !window.Chart) return;

  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  const statusColors = {
    novo: "#3b82f6",
    editando: "#f59e0b",
    editado: "#8b5cf6",
    postado: "#10b981",
    descartado: "#6b7280",
  };

  const bgColors = labels.map(l => statusColors[l.toLowerCase()] || "#8b5cf6");

  chartInstances[canvasId] = new window.Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: dataValues,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: "#121217",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: { color: "#a1a1aa" },
        },
      },
    },
  });
}
