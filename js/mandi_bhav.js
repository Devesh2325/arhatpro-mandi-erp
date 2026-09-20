/**
 * Mandi Bhav (Price Intelligence & Trends) Module
 */

const MandiBhav = {
  activeChart: null,

  init: function() {
    this.renderCommodityGrid();
    this.setupListeners();
  },

  setupListeners: function() {
    const searchInput = document.getElementById('commodity-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.renderCommodityGrid(e.target.value);
      });
    }

    const filterBtns = document.querySelectorAll('.commodity-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('bg-green-700', 'text-white'));
        filterBtns.forEach(b => b.classList.add('bg-slate-100', 'text-slate-700'));
        btn.classList.remove('bg-slate-100', 'text-slate-700');
        btn.classList.add('bg-green-700', 'text-white');
        
        const category = btn.getAttribute('data-category');
        this.renderCommodityGrid('', category);
      });
    });
  },

  renderCommodityGrid: function(searchQuery = '', filterCategory = 'all') {
    const container = document.getElementById('mandi-bhav-cards');
    if (!container) return;

    let commodities = MandiData.commodities;

    if (filterCategory && filterCategory !== 'all') {
      commodities = commodities.filter(c => c.category.toLowerCase() === filterCategory.toLowerCase());
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      commodities = commodities.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.hindiName.toLowerCase().includes(q) ||
        c.origin.toLowerCase().includes(q)
      );
    }

    if (commodities.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
          <p class="text-slate-500 font-medium">${I18N.currentLang === 'hi' ? 'कोई फसल/कमोडिटी नहीं मिली' : 'No commodities found matching criteria'}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = commodities.map(item => {
      const isUp = item.trend === 'up';
      const isDown = item.trend === 'down';
      const trendColor = isUp ? 'text-emerald-600 bg-emerald-50' : (isDown ? 'text-rose-600 bg-rose-50' : 'text-slate-600 bg-slate-100');
      const trendIcon = isUp ? '▲' : (isDown ? '▼' : '●');
      const title = I18N.currentLang === 'hi' ? item.hindiName : item.name;

      return `
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
          <div class="relative h-32 w-full overflow-hidden bg-slate-100">
            <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
            <span class="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-sm">
              ${item.origin}
            </span>
            <span class="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${trendColor}">
              ${trendIcon} ${item.changePct}
            </span>
          </div>

          <div class="p-4">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-bold text-slate-800 text-base leading-tight">${title}</h3>
                <p class="text-xs text-slate-500 mt-0.5">${item.unit}</p>
              </div>
              <div class="text-right">
                <span class="text-xs font-medium text-slate-400 uppercase tracking-wider block">${I18N.t('modalRate')}</span>
                <span class="text-lg font-black text-green-700">₹${item.modalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div class="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div class="bg-slate-50 p-2 rounded-lg">
                <span class="text-slate-500 block">${I18N.t('minMaxRate')}</span>
                <span class="font-semibold text-slate-700">₹${item.minPrice} - ₹${item.maxPrice}</span>
              </div>
              <div class="bg-slate-50 p-2 rounded-lg">
                <span class="text-slate-500 block">${I18N.t('arrivalsCount')}</span>
                <span class="font-semibold text-slate-700">${item.arrivalsToday.toLocaleString('en-IN')} ${item.unit.split(' ')[0]}</span>
              </div>
            </div>

            <button onclick="MandiBhav.showTrendModal('${item.id}')" 
              class="w-full mt-3 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              ${I18N.t('viewChart')}
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  showTrendModal: function(commodityId) {
    const item = MandiData.commodities.find(c => c.id === commodityId);
    if (!item) return;

    const modal = document.getElementById('price-trend-modal');
    if (!modal) return;

    const title = I18N.currentLang === 'hi' ? item.hindiName : item.name;
    document.getElementById('trend-modal-title').textContent = `${title} - ${I18N.t('priceTrend')}`;
    document.getElementById('trend-modal-sub').textContent = `${item.origin} | ₹${item.modalPrice} / ${item.unit}`;

    modal.classList.remove('hidden');

    // Render Chart
    const ctx = document.getElementById('priceTrendChart');
    if (ctx) {
      if (this.activeChart) {
        this.activeChart.destroy();
      }

      const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Yesterday', 'Today'];
      
      this.activeChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: days,
          datasets: [{
            label: `Modal Price (₹/${item.unit})`,
            data: item.history,
            borderColor: '#15803d',
            backgroundColor: 'rgba(21, 128, 61, 0.1)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#15803d',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return ` Rate: ₹${context.parsed.y} / ${item.unit}`;
                }
              }
            }
          },
          scales: {
            y: {
              grid: { color: '#f1f5f9' },
              ticks: { callback: value => '₹' + value }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }
  },

  closeTrendModal: function() {
    const modal = document.getElementById('price-trend-modal');
    if (modal) modal.classList.add('hidden');
    if (this.activeChart) {
      this.activeChart.destroy();
      this.activeChart = null;
    }
  }
};
