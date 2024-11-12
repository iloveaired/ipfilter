// 익스텐션 아이콘 클릭 이벤트 처리
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: 'startDecoder' });
}); 