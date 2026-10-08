const tariff = 0.85;
const months = [
  { name: 'Janeiro', short: 'Jan', values: { 'Geladeira': 55, 'Chuveiro': 82, 'Ar-condicionado': 110, 'Máquina de lavar': 28, 'Iluminação': 24 } },
  { name: 'Fevereiro', short: 'Fev', values: { 'Geladeira': 54, 'Chuveiro': 78, 'Ar-condicionado': 96, 'Máquina de lavar': 26, 'Iluminação': 23 } },
  { name: 'Março', short: 'Mar', values: { 'Geladeira': 53, 'Chuveiro': 75, 'Ar-condicionado': 62, 'Máquina de lavar': 25, 'Iluminação': 22 } },
  { name: 'Abril', short: 'Abr', values: { 'Geladeira': 52, 'Chuveiro': 70, 'Ar-condicionado': 35, 'Máquina de lavar': 24, 'Iluminação': 21 } },
  { name: 'Maio', short: 'Mai', values: { 'Geladeira': 52, 'Chuveiro': 68, 'Ar-condicionado': 18, 'Máquina de lavar': 23, 'Iluminação': 20 } },
  { name: 'Junho', short: 'Jun', values: { 'Geladeira': 51, 'Chuveiro': 92, 'Ar-condicionado': 8, 'Máquina de lavar': 22, 'Iluminação': 19 } }
];
const appliances = Object.keys(months[0].values);
const monthFilter = document.querySelector('#monthFilter');
const applianceFilter = document.querySelector('#applianceFilter');
const money = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const number = value => value.toLocaleString('pt-BR');
const selectedMonths = () => monthFilter.value === 'all' ? months : months.filter(m => m.name === monthFilter.value);
const selectedAppliances = () => applianceFilter.value === 'all' ? appliances : [applianceFilter.value];

months.forEach(month => monthFilter.insertAdjacentHTML('beforeend', `<option value="${month.name}">${month.name}</option>`));
appliances.forEach(appliance => applianceFilter.insertAdjacentHTML('beforeend', `<option value="${appliance}">${appliance}</option>`));

document.querySelector('#resetFilters').addEventListener('click', () => { monthFilter.value = 'all'; applianceFilter.value = 'all'; render(); });
monthFilter.addEventListener('change', render);
applianceFilter.addEventListener('change', render);

function getRows() {
  const ms = selectedMonths();
  const aps = selectedAppliances();
  return ms.flatMap(month => aps.map(appliance => ({ month: month.name, short: month.short, appliance, kwh: month.values[appliance], cost: month.values[appliance] * tariff })));
}
function formatKwh(value) { return `${number(Math.round(value))} kWh`; }
function render() {
  const rows = getRows();
  const total = rows.reduce((sum, row) => sum + row.kwh, 0);
  const groupedAppliances = appliances.map(appliance => ({ name: appliance, value: rows.filter(row => row.appliance === appliance).reduce((sum, row) => sum + row.kwh, 0) })).filter(item => item.value > 0).sort((a,b) => b.value - a.value);
  const groupedMonths = selectedMonths().map(month => ({ ...month, total: selectedAppliances().reduce((sum, appliance) => sum + month.values[appliance], 0) }));
  const totalCost = total * tariff;
  const average = groupedMonths.length ? total / groupedMonths.length : 0;
  const top = groupedAppliances[0] || { name: '—', value: 0 };
  document.querySelector('#totalConsumption').textContent = number(Math.round(total));
  document.querySelector('#avgConsumption').textContent = number(Math.round(average));
  document.querySelector('#topAppliance').textContent = top.name;
  document.querySelector('#topApplianceUsage').textContent = formatKwh(top.value);
  document.querySelector('#totalCost').textContent = totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.querySelector('#recordCount').textContent = rows.length;
  document.querySelector('#filteredTotal').textContent = formatKwh(total);
  renderLine(groupedMonths);
  renderBars(groupedAppliances);
  renderCosts(groupedMonths);
  renderTable(rows);
  const best = groupedMonths.reduce((a,b) => a.total < b.total ? a : b, groupedMonths[0]);
  document.querySelector('#bestMonth').textContent = best ? best.name : '—';
}
function renderLine(data) {
  const chart = document.querySelector('#lineChart');
  if (!data.length) { chart.innerHTML = '<p class="chart-empty">Selecione um período para visualizar.</p>'; return; }
  const max = Math.max(...data.map(d => d.total), 1), min = Math.min(...data.map(d => d.total));
  const points = data.map((d, i) => { const x = data.length === 1 ? 50 : 4 + (i * 92 / (data.length - 1)); const y = 92 - ((d.total - min) / Math.max(max - min, 1)) * 69; return { ...d, x, y }; });
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const circles = points.map(p => `<circle cx="${p.x}%" cy="${p.y}%" r="3.2" fill="#f17961" stroke="#fffdf7" stroke-width="2"/><text x="${p.x}%" y="${Math.max(p.y-8, 9)}%" text-anchor="middle" fill="#12343b" font-size="9" font-family="DM Mono, monospace">${p.total}</text>`).join('');
  chart.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f17961" stop-opacity=".25"/><stop offset="1" stop-color="#f17961" stop-opacity="0"/></linearGradient></defs><polygon points="${polyline} 96,100 4,100" fill="url(#lineFill)"/><polyline points="${polyline}" fill="none" stroke="#f17961" stroke-width="1.4" vector-effect="non-scaling-stroke"/>${circles}</svg><div class="axis-labels">${points.map(p => `<span>${p.short}</span>`).join('')}</div>`;
}
function renderBars(data) {
  const max = Math.max(...data.map(d => d.value), 1);
  document.querySelector('#barChart').innerHTML = data.map(item => `<div class="bar-row"><span class="bar-label">${item.name}</span><span class="bar-track"><span class="bar-fill" style="width:${item.value / max * 100}%"></span></span><span class="bar-value">${item.value}</span></div>`).join('');
}
function renderCosts(data) {
  const max = Math.max(...data.map(d => d.total * tariff), 1);
  document.querySelector('#costChart').innerHTML = data.map(item => `<div class="cost-col"><span class="cost-value">${Math.round(item.total * tariff)}</span><span class="cost-bar" style="height:${item.total * tariff / max * 78}%"></span><span class="cost-label">${item.short}</span></div>`).join('');
}
function renderTable(rows) {
  document.querySelector('#dataTable').innerHTML = rows.map(row => `<tr><td>${row.short}</td><td>${row.appliance}</td><td>${row.kwh} kWh</td><td>${money(row.cost)}</td></tr>`).join('');
}
document.querySelector('#downloadData').addEventListener('click', () => {
  const rows = getRows();
  const csv = ['Mês,Aparelho,Consumo (kWh),Custo estimado (R$)', ...rows.map(row => `${row.month},${row.appliance},${row.kwh},${row.cost.toFixed(2).replace('.', ',')}`)].join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'dashenergia-dados.csv'; link.click(); URL.revokeObjectURL(url);
});
render();
