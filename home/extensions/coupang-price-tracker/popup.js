console.log('[Popup] Script loaded');

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function savePriceHistory(productData) {
  const { productUrl, currentPrice, priceValue, productTitle } = productData;
  const timestamp = new Date().toISOString();

  // 저장된 데이터 가져오기
  const data = await chrome.storage.local.get(productUrl);
  const priceHistory = data[productUrl] || {
    title: productTitle,
    prices: [],
    lowestPrice: Infinity
  };

  // 새로운 가격 기록 추가
  priceHistory.prices.push({
    price: priceValue,
    timestamp
  });

  // 최저가 업데이트
  priceHistory.lowestPrice = Math.min(priceHistory.lowestPrice, priceValue);

  // 데이터 저장
  await chrome.storage.local.set({
    [productUrl]: priceHistory
  });

  return priceHistory;
}

function formatPrice(price) {
  return price.toLocaleString('ko-KR') + '원';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function updateUI(currentPrice, priceHistory) {
  const currentPriceElement = document.getElementById('currentPrice');
  const lowestPriceElement = document.getElementById('lowestPrice');
  const priceHistoryElement = document.getElementById('priceHistory');

  currentPriceElement.textContent = `현재 가격: ${currentPrice}`;
  
  if (priceHistory.lowestPrice !== Infinity) {
    lowestPriceElement.textContent = `최저 가격: ${formatPrice(priceHistory.lowestPrice)}`;
    
    // 가격 변동 내역 생성
    const prices = priceHistory.prices;
    let historyHTML = '';
    
    // 최근 5개의 가격 기록을 역순으로 표시
    prices.slice(-5).reverse().forEach((record, index) => {
      const prevPrice = index < prices.length - 1 ? prices[prices.length - 2 - index].price : record.price;
      const priceChange = record.price - prevPrice;
      let priceChangeClass = '';
      let priceChangeText = '';
      
      if (priceChange > 0) {
        priceChangeClass = 'price-increase';
        priceChangeText = ` (▲ ${formatPrice(priceChange)})`;
      } else if (priceChange < 0) {
        priceChangeClass = 'price-decrease';
        priceChangeText = ` (▼ ${formatPrice(Math.abs(priceChange))})`;
      }

      historyHTML += `
        <div class="history-item">
          <span class="date">${formatDate(record.timestamp)}</span>
          <span class="price ${priceChangeClass}">
            ${formatPrice(record.price)}${priceChangeText}
          </span>
        </div>
      `;
    });
    
    priceHistoryElement.innerHTML = historyHTML || '아직 기록된 가격 변동이 없습니다.';
  }
}

// content script 연결 시도 함수
async function tryConnectToContentScript(tab, maxAttempts = 3) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      console.log(`[Popup] Attempting to connect (${attempt + 1}/${maxAttempts})...`);
      
      // 페이지 새로고침
      if (attempt > 0) {
        await chrome.tabs.reload(tab.id);
        // 페이지 로드 대기
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: "getPrices",
        attempt: attempt + 1
      });
      
      console.log('[Popup] Connection successful:', response);
      return response;
    } catch (error) {
      console.log('[Popup] Connection attempt failed:', error);
      if (attempt === maxAttempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function getPrices() {
  const statusElement = document.getElementById('status');
  try {
    const tab = await getCurrentTab();
    console.log('[Popup] Current tab:', tab);

    if (!tab.url.includes('coupang.com')) {
      throw new Error('쿠팡 상품 페이지에서만 사용 가능합니다.');
    }

    // 상태 업데이트
    document.getElementById('currentPrice').textContent = '현재 가격: 연결 중...';
    document.getElementById('lowestPrice').textContent = '최저 가격: 연결 중...';

    const response = await tryConnectToContentScript(tab);
    
    if (response.success) {
      const priceHistory = await savePriceHistory(response);
      await updateUI(response.currentPrice, priceHistory);
    } else {
      throw new Error(response.error || '가격 정보를 가져오는데 실패했습니다.');
    }
  } catch (error) {
    console.error('[Popup] Error:', error);
    document.getElementById('currentPrice').textContent = '오류: 페이지를 새로고침 해주세요';
    document.getElementById('lowestPrice').textContent = '페이지 연결 실패';
  }
}

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