chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);

  if (request.action === "seekTo") {
    const video = document.querySelector('video');
    if (video) {
      video.currentTime = request.time;
      sendResponse({ success: true });
    } else {
      console.error('Video element not found');
      sendResponse({ success: false, error: 'Video element not found' });
    }
  }

  if (request.action === "getTime") {
    const video = document.querySelector('video');
    if (video) {
      sendResponse({ currentTime: video.currentTime });
    } else {
      sendResponse({ error: 'Video element not found' });
    }
  }

  return true;
});

console.log('YouTube Memo content script loaded');

let lastVideoId = '';
let titleCheckInterval;

function checkVideoChange() {
  const currentUrl = window.location.href;
  const videoId = new URL(currentUrl).searchParams.get('v');
  
  if (videoId && videoId !== lastVideoId) {
    lastVideoId = videoId;
    
    clearInterval(titleCheckInterval);
    titleCheckInterval = setInterval(() => {
      const title = document.querySelector('h1.ytd-video-primary-info-renderer')?.textContent;
      if (title) {
        clearInterval(titleCheckInterval);
        chrome.runtime.sendMessage({
          action: 'updateVideoInfo',
          videoId: videoId,
          info: {
            title: title.trim(),
            channel: document.querySelector('#channel-name yt-formatted-string')?.textContent?.trim() || '',
            url: currentUrl
          }
        });
      }
    }, 1000);
  }
}

let lastUrl = window.location.href;
new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    checkVideoChange();
  }
}).observe(document, { subtree: true, childList: true });

checkVideoChange();