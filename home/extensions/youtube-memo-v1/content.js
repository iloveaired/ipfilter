chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);

  if (request.action === "getTime") {
    const video = document.getElementsByTagName('video')[0];
    if (video) {
      console.log('Current time:', video.currentTime);
      sendResponse({ currentTime: video.currentTime });
    } else {
      console.log('Video element not found');
      sendResponse({ error: "Video element not found" });
    }
  }

  if (request.action === "seekTo") {
    const video = document.getElementsByTagName('video')[0];
    if (video) {
      video.currentTime = request.time;
      sendResponse({ success: true });
    } else {
      sendResponse({ error: "Video element not found" });
    }
  }

  return true;
});

console.log('YouTube Memo content script loaded');