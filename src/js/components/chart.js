// Assumes Chart.js is loaded globally in the app window

const globalChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  color: '#a0a0ab', // Legend and general text color
  plugins: {
    legend: {
      labels: {
        color: '#a0a0ab'
      }
    }
  }
};

export function createBarChart(canvasId, labels, data, dataLabel) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: dataLabel,
        data: data,
        backgroundColor: '#9146ff',
        borderRadius: 4
      }]
    },
    options: {
      ...globalChartOptions,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#1c1c22'
          },
          ticks: {
            color: '#5a5a66'
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#5a5a66'
          }
        }
      }
    }
  });
}

export function createDoughnutChart(canvasId, labels, data) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  
  const statusColors = {
    'Novo': '#5b8def',
    'Editando': '#f0a030',
    'Editado': '#a78bfa',
    'Postado': '#34d399',
    'Descartado': '#6b7280'
  };

  const bgColors = labels.map(label => statusColors[label] || '#4b5563');

  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: bgColors,
        borderColor: '#0f0f12',
        borderWidth: 2
      }]
    },
    options: {
      ...globalChartOptions,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#a0a0ab',
            usePointStyle: true,
            padding: 20
          }
        }
      }
    }
  });
}
