import os
import base64

def create_folder_structure():
    # 기본 폴더 생성
    base_folders = ['popup', 'scripts', 'icons']
    for folder in base_folders:
        os.makedirs(folder, exist_ok=True)

def create_manifest():
    manifest_content = '''{
  "manifest_version": 3,
  "name": "Coupang Price Tracker",
  "version": "1.0",
  "description": "쿠팡 상품 가격 추적기",
  "permissions": [
    "activeTab",
    "storage"
  ],
  "host_permissions": [
    "https://www.coupang.com/*"
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["https://www.coupang.com/vp/products/*"],
      "js": ["scripts/content.js"]
    }
  ],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}'''
    
    with open('manifest.json', 'w', encoding='utf-8') as f:
        f.write(manifest_content)

def create_popup_html():
    popup_html_content = '''<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Coupang Price Tracker</title>
  <link rel="stylesheet" href="popup.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <div class="container">
    <h2 id="productName">상품명</h2>
    <div class="price-info">
      <p>현재 가격: <span id="currentPrice">로딩중...</span></p>
      <p>최저 가격: <span id="minPrice">로딩중...</span></p>
    </div>
    <div class="chart-container">
      <canvas id="priceChart"></canvas>
    </div>
  </div>
  <script src="popup.js"></script>
</body>
</html>'''
    
    with open('popup/popup.html', 'w', encoding='utf-8') as f:
        f.write(popup_html_content)

def create_popup_css():
    popup_css_content = '''body {
  width: 400px;
  padding: 15px;
  font-family: Arial, sans-serif;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

h2 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.price-info {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 5px;
}

.price-info p {
  margin: 5px 0;
  font-size: 14px;
}

.chart-container {
  height: 200px;
  margin-top: 10px;
}'''
    
    with open('popup/popup.css', 'w', encoding='utf-8') as f:
        f.write(popup_css_content)

def create_popup_js():
    popup_js_content = '''let priceChart = null;

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

document.addEventListener('DOMContentLoaded', async () => {
  chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
    const tab = tabs[0];
    if (tab.url.includes('coupang.com/vp/products')) {
      const response = await chrome.storage.local.get(['priceHistory', 'productName']);
      
      if (response.priceHistory && response.productName) {
        document.getElementById('productName').textContent = response.productName;
        
        const prices = response.priceHistory.map(item => item.price);
        document.getElementById('currentPrice').textContent = 
          formatPrice(prices[prices.length - 1]);
        document.getElementById('minPrice').textContent = 
          formatPrice(Math.min(...prices));
        
        updateChart(response.priceHistory);
      }
    }
  });
});'''
    
    with open('popup/popup.js', 'w', encoding='utf-8') as f:
        f.write(popup_js_content)

def create_content_js():
    content_js_content = '''function extractProductInfo() {
  const productName = document.querySelector('.prod-buy-header__title')?.textContent.trim();
  const priceText = document.querySelector('span.total-price > strong')?.textContent.trim();
  const price = parseInt(priceText?.replace(/[^0-9]/g, '')) || 0;
  
  return { productName, price };
}

function savePriceHistory(productInfo) {
  chrome.storage.local.get(['priceHistory'], function(result) {
    let priceHistory = result.priceHistory || [];
    
    if (priceHistory.length > 30) {
      priceHistory.shift();
    }
    
    priceHistory.push({
      date: new Date().toLocaleDateString(),
      price: productInfo.price
    });
    
    chrome.storage.local.set({
      priceHistory: priceHistory,
      productName: productInfo.productName
    });
  });
}

const productInfo = extractProductInfo();
if (productInfo.productName && productInfo.price) {
  savePriceHistory(productInfo);
}'''
    
    with open('scripts/content.js', 'w', encoding='utf-8') as f:
        f.write(content_js_content)

def create_icon():
    # 간단한 기본 아이콘 생성 (파란색 원)
    icon_sizes = [16, 48, 128]
    
    for size in icon_sizes:
        from PIL import Image, ImageDraw
        
        # 새 이미지 생성
        img = Image.new('RGB', (size, size), 'white')
        draw = ImageDraw.Draw(img)
        
        # 파란색 원 그리기
        draw.ellipse([2, 2, size-2, size-2], fill='#00a0e9')
        
        # 저장
        img.save(f'icons/icon{size}.png')

def main():
    # 기본 폴더 구조 생성
    create_folder_structure()
    
    # 각 파일 생성
    create_manifest()
    create_popup_html()
    create_popup_css()
    create_popup_js()
    create_content_js()
    create_icon()
    
    print("Chrome Extension 파일이 성공적으로 생성되었습니다!")
    print("\n설치 방법:")
    print("1. Chrome 브라우저에서 chrome://extensions/ 접속")
    print("2. 우측 상단의 '개발자 모드' 활성화")
    print("3. '압축해제된 확장 프로그램을 로드합니다' 클릭")
    print("4. 생성된 'coupang-price-tracker' 폴더 선택")

if __name__ == "__main__":
    main()