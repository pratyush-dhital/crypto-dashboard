const API_BASE = "https://api.coingecko.com/api/v3";
let currentCoin = null;
let currentChart = null;
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

const coinListContainer = document.getElementById("coin-list");
const chartCanvas = document.getElementById("priceChart");

async function fetchTopCoins() {
  try {
    const res = await fetch(`${API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1`);
    const coins = await res.json();
    renderCoinList(coins);
  } catch {
    coinListContainer.innerHTML = "<p>Error loading coins</p>";
  }
}

function renderCoinList(coins) {
  coinListContainer.innerHTML = "";
  coins.forEach(coin => {
    const item = document.createElement("div");
    item.className = "coin-item";

    const isFav = favorites.includes(coin.id);
    item.innerHTML = `
      <div class="coin-info">
        <img src="${coin.image}" />
        <div>
          <strong>${coin.name}</strong><br>
          $${coin.current_price.toFixed(2)}
        </div>
      </div>
      <div>
        <span class="favorite">${isFav ? "★" : "☆"}</span><br>
        <span style="color: ${coin.price_change_percentage_24h >= 0 ? 'lime' : 'red'};">
          ${coin.price_change_percentage_24h.toFixed(2)}%
        </span>
      </div>
    `;

    item.querySelector(".favorite").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(coin.id);
      fetchTopCoins();
    });

    item.addEventListener("click", () => {
      currentCoin = coin.id;
      fetchCoinDetails(coin.id);
      fetchChartData(coin.id, 7);
    });

    coinListContainer.appendChild(item);
  });
}

function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

async function fetchCoinDetails(id) {
  const res = await fetch(`${API_BASE}/coins/${id}`);
  const data = await res.json();

  document.getElementById("coin-title").textContent = data.name;
  document.getElementById("coin-desc").textContent = data.description.en.split(".")[0];
  document.getElementById("coin-price").textContent = data.market_data.current_price.usd.toLocaleString();
  document.getElementById("coin-marketcap").textContent = data.market_data.market_cap.usd.toLocaleString();
  document.getElementById("coin-high").textContent = data.market_data.high_24h.usd.toLocaleString();
  document.getElementById("coin-low").textContent = data.market_data.low_24h.usd.toLocaleString();
}

async function fetchChartData(id, days) {
  const res = await fetch(`${API_BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`);
  const data = await res.json();
  const labels = data.prices.map(p => new Date(p[0]).toLocaleDateString());
  const prices = data.prices.map(p => p[1]);

  renderChart(labels, prices);
}

function renderChart(labels, prices) {
  if (currentChart) {
    currentChart.destroy();
  }

  currentChart = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Price in USD",
        data: prices,
        borderColor: "lime",
        borderWidth: 2,
        fill: false,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { display: false },
        y: {
          ticks: {
            color: "#ccc"
          }
        }
      }
    }
  });
}

document.querySelectorAll(".timeframe-selector button").forEach(btn => {
  btn.addEventListener("click", () => {
    if (currentCoin) {
      fetchChartData(currentCoin, btn.getAttribute("data-days"));
    }
  });
});

fetchTopCoins();
setInterval(fetchTopCoins, 60000);
