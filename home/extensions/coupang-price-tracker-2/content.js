console.log('[Content Script] Loaded');

function extractPrice(priceText) {
  // 숫자만 추출 (예: "12,345원" -> 12345)
  return parseInt(priceText.replace(/[^0-9]/g, ''));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Content Script] Message received:', request);

  if (request.action === "getPrices") {
    try {
      const currentPriceElement = document.querySelector('span.total-price > strong');
      console.log('[Content Script] Price element found:', currentPriceElement);

      if (currentPriceElement) {
        const priceText = currentPriceElement.textContent.trim();
        const currentPrice = extractPrice(priceText);
        const productTitle = document.querySelector('.prod-buy-header__title').textContent.trim();
        const productUrl = window.location.href;

        console.log('[Content Script] Price data:', { currentPrice, productTitle, productUrl });

        sendResponse({
          success: true,
          currentPrice: priceText,
          priceValue: currentPrice,
          productTitle,
          productUrl
        });
      } else {
        throw new Error('가격 요소를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('[Content Script] Error:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }
  return true;
});