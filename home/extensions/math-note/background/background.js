chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureComplete") {
    // 캡처된 이미지를 팝업으로 전달
    chrome.runtime.sendMessage({
      action: "insertImage",
      imageUrl: request.imageUrl
    });
  }
}); 