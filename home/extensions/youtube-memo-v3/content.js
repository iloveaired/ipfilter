chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);

  try {
    if (request.action === "getTime") {
      const video = document.querySelector('video');
      if (video) {
        console.log('Current time:', video.currentTime);
        sendResponse({ currentTime: video.currentTime });
      } else {
        console.log('Video element not found');
        sendResponse({ error: "Video element not found" });
      }
    }
    
    if (request.action === "seekTo") {
      const video = document.querySelector('video');
      if (video) {
        video.currentTime = request.time;
        sendResponse({ success: true });
      } else {
        sendResponse({ error: "Video element not found" });
      }
    }

    if (request.action === "getVideoInfo") {
      const title = document.querySelector('h1.ytd-video-primary-info-renderer')?.textContent 
                   || document.querySelector('h1.title.style-scope.ytd-video-primary-info-renderer')?.textContent 
                   || '';
      const channel = document.querySelector('#channel-name yt-formatted-string')?.textContent || '';
      
      sendResponse({ 
        title: title.trim(),
        channel: channel.trim(),
        url: window.location.href
      });
    }
  } catch (error) {
    console.error('Content script error:', error);
    sendResponse({ error: error.message });
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