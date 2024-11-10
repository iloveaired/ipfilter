console.log('[Popup] Script loaded');

// 현재 탭 가져오기
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// 가격 정보 가져오기
async function getPriceInfo() {
  try {
    const tab = await getCurrentTab();
    if (!tab.url.includes('coupang.com')) {
      throw new Error('쿠팡 상품 페이지가 아닙니다.');
    }

    // content script 주입
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (e) {
      console.log('[Popup] Content script already exists');
    }

    // 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 100));

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getPrices' });
    console.log('[Popup] Response from content script:', response);

    if (!response.success) {
      throw new Error(response.error || '가격 정보를 가져오는데 실패했습니다.');
    }

    return response;
  } catch (error) {
    console.error('[Popup] Error:', error);
    throw error;
  }
}

// 가격 히스토리 저장
async function savePriceHistory(priceInfo) {
  try {
    const result = await chrome.storage.local.get('priceHistory');
    let priceHistory = result.priceHistory || [];
    
    const newEntry = {
      price: priceInfo.priceValue,
      timestamp: new Date().toISOString(),
      productTitle: priceInfo.productTitle,
      productUrl: priceInfo.productUrl
    };

    // 같은 날짜의 데이터가 있는지 확인
    const today = new Date().toDateString();
    const existingIndex = priceHistory.findIndex(entry => 
      new Date(entry.timestamp).toDateString() === today &&
      entry.productUrl === priceInfo.productUrl
    );

    if (existingIndex !== -1) {
      priceHistory[existingIndex] = newEntry;
    } else {
      priceHistory.push(newEntry);
    }

    // 최대 30일치 데이터만 유지
    while (priceHistory.length > 30) {
      priceHistory.shift();
    }

    await chrome.storage.local.set({ priceHistory });
    return priceHistory;
  } catch (error) {
    console.error('[Popup] Error saving price history:', error);
    throw error;
  }
}

// 차트 생성 함수
function createPriceChart(priceHistory, productUrl) {
    try {
        const chartElement = document.getElementById('priceChart');
        if (!chartElement) {
            console.error('[Popup] Chart element not found');
            return;
        }

        // Chart 객체가 있는지 확인
        if (typeof Chart === 'undefined') {
            console.error('[Popup] Chart.js not loaded');
            return;
        }

        const ctx = chartElement.getContext('2d');
        const filteredHistory = priceHistory.filter(item => item.productUrl === productUrl);
        
        const dates = filteredHistory.map(item => 
            new Date(item.timestamp).toLocaleDateString()
        );
        const prices = filteredHistory.map(item => item.price);

        // 기존 차트가 있다면 제거
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: '가격 추이',
                    data: prices,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y.toLocaleString()}원`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString() + '원';
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('[Popup] Error creating chart:', error);
    }
}

// 가격 히스토리 표시
function displayPriceHistory(priceHistory, productUrl) {
  const historyElement = document.getElementById('priceHistory');
  if (!historyElement) {
    console.error('[Popup] History element not found');
    return;
  }

  const filteredHistory = priceHistory.filter(item => item.productUrl === productUrl);
  
  if (filteredHistory.length > 0) {
    historyElement.innerHTML = filteredHistory
      .slice(-5)
      .reverse()
      .map(item => `
        <div class="history-item">
          ${new Date(item.timestamp).toLocaleString()}: 
          <strong>${item.price.toLocaleString()}원</strong>
        </div>
      `)
      .join('');
  } else {
    historyElement.innerHTML = '<div>저장된 가격 기록이 없습니다.</div>';
  }
}

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
  // DOM 요소 확인
  const elements = {
    price: document.getElementById('currentPrice'),
    title: document.getElementById('productTitle'),
    chart: document.getElementById('priceChart'),
    history: document.getElementById('priceHistory')
  };

  // 필요한 요소가 없으면 오류 표시
  for (const [key, element] of Object.entries(elements)) {
    if (!element) {
      console.error(`[Popup] Missing element: ${key}`);
      document.body.innerHTML = `
        <div style="color: red; padding: 10px;">
          오류: 필요한 UI 요소를 찾을 수 없습니다. (${key})
        </div>
      `;
      return;
    }
  }

  try {
    // 로딩 상태 표시
    elements.price.textContent = '가격 정보를 가져오는 중...';
    elements.title.textContent = '제품 정보를 가져오는 중...';

    const priceInfo = await getPriceInfo();
    console.log('[Popup] Price info received:', priceInfo);

    if (priceInfo && priceInfo.success) {
      // 가격 정보 표시
      elements.price.textContent = priceInfo.currentPrice;
      elements.title.textContent = priceInfo.productTitle;

      // 가격 히스토리 저장 및 표시
      const priceHistory = await savePriceHistory(priceInfo);
      if (priceHistory.length > 0) {
        createPriceChart(priceHistory, priceInfo.productUrl);
        displayPriceHistory(priceHistory, priceInfo.productUrl);
      }
    } else {
      throw new Error('가격 정보가 올바르지 않습니다.');
    }
  } catch (error) {
    console.error('[Popup] Error in initialization:', error);
    elements.price.textContent = '오류 발생';
    elements.title.textContent = error.message;
  }
});

// 저장된 모든 데이터 확인하는 함수
async function checkStoredData() {
  const data = await chrome.storage.local.get(null);
  console.log('저장된 모든 데이터:', data);
}

document.addEventListener('DOMContentLoaded', () => {
  getPrices();
  checkStoredData();
});

// 버튼을 통해 데이터 확인하기 위한 HTML 추가 