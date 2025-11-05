// Datos y opciones para el Dashboard de Gestión Hospitalaria

// 1. Gráfico de Líneas: Ingresos Diarios (Últimos 7 días)
export const lineChartDataIngresosDiarios = [
  {
    name: "Ingresos",
    data: [15500, 16200, 15800, 17000, 16500, 18000, 17500],
  },
];

export const lineChartOptionsIngresosDiarios = {
  chart: {
    toolbar: { show: false },
    dropShadow: { enabled: true, top: 13, left: 0, blur: 10, opacity: 0.1, color: "#42A5F5" },
  },
  colors: ["#42A5F5"],
  markers: { size: 0, hover: { size: 7 } },
  tooltip: { theme: "light" },
  dataLabels: { enabled: false },
  stroke: { curve: "smooth", type: "line" },
  xaxis: {
    categories: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    labels: { style: { colors: "#A3AED0", fontSize: "12px", fontWeight: "500" } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { show: false },
  legend: { show: false },
  grid: { show: false },
};

// 2. Gráfico de Barras: Consultas por Especialidad
export const barChartDataConsultas = [
  {
    name: "Consultas",
    data: [80, 65, 90, 45, 75, 50],
  },
];

export const barChartOptionsConsultas = {
  chart: { toolbar: { show: false } },
  tooltip: { theme: "light" },
  xaxis: {
    categories: ["Cardiología", "Pediatría", "General", "Trauma", "Gineco", "Derma"],
    labels: { style: { colors: "#A3AED0", fontSize: "12px", fontWeight: "500" } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { show: false },
  grid: { show: false, yaxis: { lines: { show: false } } },
  fill: {
    type: "gradient",
    gradient: { type: "vertical", shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.9, colorStops: [
      [{ offset: 0, color: "#00BCD4", opacity: 1 }, { offset: 100, color: "#80DEEA", opacity: 0.28 }]
    ]},
  },
  dataLabels: { enabled: false },
  plotOptions: { bar: { borderRadius: 10, columnWidth: "40px" } },
};

// 3. Gráfico de Pie (Dona): Distribución por Género
export const pieChartDataGenero = [44, 55]; // Femenino, Masculino

export const pieChartOptionsGenero = {
  labels: ["Femenino", "Masculino"],
  colors: ["#64B5F6", "#80CBC4"],
  chart: { width: "100%" },
  states: { hover: { filter: { type: "none" } } },
  legend: { show: true, position: 'bottom' },
  dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(1)}%` },
  hover: { mode: null },
  plotOptions: { donut: { expandOnClick: false, donut: { labels: { show: false } } } },
  tooltip: { enabled: true, theme: "light", y: { formatter: (value) => `${value} pacientes` } },
};

// 4. Gráfico de Barras Horizontales: Top 5 Medicamentos
export const barChartDataMedicamentos = [{
  name: 'Unidades Recetadas',
  data: [400, 350, 300, 250, 200]
}];

export const barChartOptionsMedicamentos = {
  chart: { toolbar: { show: false } },
  plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '60%' } },
  dataLabels: { enabled: true, textAnchor: 'start', style: { colors: ['#fff'] }, offsetX: 0, dropShadow: { enabled: true } },
  xaxis: { categories: ['Paracetamol', 'Amoxicilina', 'Ibuprofeno', 'Loratadina', 'Omeprazol'], labels: { show: false } },
  yaxis: { labels: { show: true, style: { colors: "#A3AED0", fontSize: "12px" } } },
  grid: { show: false },
  tooltip: { theme: 'light', x: { show: false } },
  fill: { colors: ['#4DB6AC'] },
};

// 5. Gráfico de Área: Tiempo de Espera (Últimos 6 meses)
export const areaChartDataEspera = [{
  name: 'Minutos',
  data: [30, 25, 35, 30, 45, 40]
}];

export const areaChartOptionsEspera = {
  chart: { toolbar: { show: false } },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth' },
  xaxis: { type: 'category', categories: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"] },
  yaxis: { labels: { formatter: (value) => `${value} min` } },
  tooltip: { x: { format: 'dd/MM/yy HH:mm' } },
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.9, stops: [0, 90, 100] } },
  colors: ["#90CAF9"],
};