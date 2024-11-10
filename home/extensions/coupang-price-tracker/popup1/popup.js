let priceChart = null;

function formatPrice(price) {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' })
    .format(price);
}

function updateChart(priceHistory) {
  const ctx = document.getElementById('priceChart').getContext('2d');
  
  if (priceChart) {
    priceChart.destroy();
  }

  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: priceHistory.map(item => item.date),
      datasets: [{
        label: '가격 추이',
        data: priceHistory.map(item => item.price),
        borderColor: '#00a0e9',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return formatPrice(value);
            }
          }
        }
      }
    }
  });
}

// 현재 탭의 URL을 가져오는 함수
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// 가격 정보를 가져오는 함수
async function getPrices() {
  try {
    const tab = await getCurrentTab();
    
    // content script에 메시지 전송
    const response = await chrome.tabs.sendMessage(tab.id, { action: "getPrices" });
    
    if (response && response.currentPrice && response.lowestPrice) {
      document.getElementById('currentPrice').textContent = `현재 가격: ${response.currentPrice}`;
      document.getElementById('lowestPrice').textContent = `최저 가격: ${response.lowestPrice}`;
    } else {
      throw new Error('가격 정보를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('currentPrice').textContent = '현재 가격: 가격을 불러올 수 없습니다';
    document.getElementById('lowestPrice').textContent = '최저 가격: 가격을 불러올 수 없습니다';
  }
}

// 팝업이 열릴 때 가격 정보 가져오기
document.addEventListener('DOMContentLoaded', getPrices);