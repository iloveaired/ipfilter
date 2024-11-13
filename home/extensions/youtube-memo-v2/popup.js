document.addEventListener('DOMContentLoaded', async () => {
  // 초기 화면 로드
  await loadMemoList(false);

  // 이벤트 리스너 설정
  setupEventListeners();
});

function setupEventListeners() {
  // 목록보기 버튼
  document.getElementById('show-list').addEventListener('click', () => {
    showListView();
  });

  // 내보내기/가져오기 버튼
  document.getElementById('export-db').addEventListener('click', exportMemos);
  document.getElementById('import-db').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', importMemos);

  // 뒤로 가기 버튼
  document.getElementById('back-to-list').addEventListener('click', () => {
    document.getElementById('memo-detail-view').style.display = 'none';
    document.getElementById('memo-list-view').style.display = 'block';
    loadMemoList(true);
  });

  // 메모 추가 버튼
  document.getElementById('add-memo').addEventListener('click', addMemo);

  // 첫 메모 추가 및 상세보기 버튼 이벤트 위임
  document.getElementById('video-memo-list').addEventListener('click', async (e) => {
    if (e.target.classList.contains('add-first-memo')) {
      const videoId = e.target.dataset.videoId;
      showDetailView(videoId, true);
    } else if (e.target.classList.contains('view-detail')) {
      const videoId = e.target.dataset.videoId;
      showDetailView(videoId);
    }
  });

  // 메모 입력 이벤트
  const memoInput = document.getElementById('memo-input');
  
  memoInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { // shift + enter는 줄바꿈 허용
      e.preventDefault();
      const memo = memoInput.value.trim();
      if (memo) {
        await addMemo();
      }
    }
  });
}

// 메모 목록 화면 로드
async function loadMemoList(forceList = false) {
  const videoMemoList = document.getElementById('video-memo-list');
  videoMemoList.innerHTML = '';

  try {
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const isYouTube = currentTab.url.includes('youtube.com/watch');
    const currentVideoId = isYouTube ? new URL(currentTab.url).searchParams.get('v') : null;
    
    const allData = await chrome.storage.local.get(null);
    
    // 데이터가 없는 경우
    if (Object.keys(allData).length === 0) {
      videoMemoList.innerHTML = '<div class="empty-state">저장된 메모가 없습니다.</div>';
      return;
    }

    // forceList가 false이고 현재 비디오의 메모가 있는 경우에만 자동 전환
    if (!forceList && currentVideoId && allData[currentVideoId]) {
      showDetailView(currentVideoId);
      return;
    }

    // 메모 목록 표시
    for (const videoId in allData) {
      const memos = allData[videoId];
      if (!memos || !memos.length) continue;

      const videoElement = createVideoListItem(videoId, memos);
      videoMemoList.appendChild(videoElement);
    }
  } catch (error) {
    console.error('Error loading memo list:', error);
    videoMemoList.innerHTML = '<div class="error-state">메모를 불러오는 중 오류가 발생했습니다.</div>';
  }
}

// 구분선 생성 함수
function createDivider(text) {
  const divider = document.createElement('div');
  divider.className = 'divider';
  divider.innerHTML = `<span>${text}</span>`;
  return divider;
}

// 메모 상세 화면 표시 함수 수정
async function showDetailView(videoId) {
  try {
    const detailView = document.getElementById('memo-detail-view');
    const listView = document.getElementById('memo-list-view');
    const backButton = document.getElementById('back-to-list');
    
    // 현재 탭 확인
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentVideoId = currentTab.url.includes('youtube.com/watch') 
      ? new URL(currentTab.url).searchParams.get('v') 
      : null;
    
    // 뒤로가기 버튼 표시 여부 결정
    const showBackButton = videoId !== currentVideoId;
    backButton.style.display = showBackButton ? 'block' : 'none';

    // 메모 데이터 로드
    const memos = await getMemos(videoId);
    if (!memos || !memos.length) return;

    const videoInfo = memos[0].videoInfo || { title: '제목 없음' };
    document.getElementById('video-title').textContent = videoInfo.title;
    
    // 화면 전환
    listView.style.display = 'none';
    detailView.style.display = 'block';
    detailView.dataset.videoId = videoId;

    // 메모 목록 로드
    await loadMemoDetail(videoId);
  } catch (error) {
    console.error('Error showing detail view:', error);
    showToast('상세 보기를 불러오는 중 오류가 발생했습니다.');
  }
}

// 목록 화면으로 돌아가기
function showListView() {
  document.getElementById('memo-detail-view').style.display = 'none';
  document.getElementById('memo-list-view').style.display = 'block';
  loadMemoList(true);
}

// 메모 추가 함수 수정
async function addMemo() {
  const memoInput = document.getElementById('memo-input');
  const memo = memoInput.value.trim();
  if (!memo) return false;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.url.includes('youtube.com/watch')) {
      alert('YouTube 동영상 페이지에서만 메모를 추가할 수 있습니다.');
      return false;
    }

    const videoId = new URL(tab.url).searchParams.get('v');
    const videoInfo = await getVideoInfo(tab);
    
    chrome.tabs.sendMessage(tab.id, { action: "getTime" }, async (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        alert('동영상 시간을 가져올 수 없습니다. 페이지를 새로고침해주세요.');
        return false;
      }

      try {
        const timestamp = response.currentTime;
        const memos = await getMemos(videoId) || [];
        
        const newMemo = {
          id: Date.now(),
          text: memo,
          timestamp,
          videoInfo: {
            title: videoInfo.title,
            channel: videoInfo.channel,
            url: tab.url
          }
        };
        
        memos.push(newMemo);
        await chrome.storage.local.set({ [videoId]: memos });

        // 입력창 초기화
        memoInput.value = '';
        
        // 메모 목록 새로고침
        await loadMemoDetail(videoId);
        
        // 성공 메시지 표시
        showToast('메모가 추가되었습니다.');
        return true;
      } catch (error) {
        console.error('Error saving memo:', error);
        showToast('메모 저장 중 오류가 발생했습니다.');
        return false;
      }
    });
  } catch (error) {
    console.error('Error adding memo:', error);
    showToast('메모 추가 중 오류가 발생했습니다.');
    return false;
  }
}

// 메모 상세 목록 로드 함수 수정
async function loadMemoDetail(videoId) {
  try {
    console.log('Loading memos for videoId:', videoId); // 디버깅용
    const memoList = document.getElementById('memo-list');
    const memos = await getMemos(videoId);
    
    console.log('Retrieved memos:', memos); // 디버깅용

    if (!memos || !memos.length) {
      memoList.innerHTML = '<div class="empty-state">저장된 메모가 없습니다.</div>';
      return;
    }

    memoList.innerHTML = '';
    const sortedMemos = [...memos].sort((a, b) => a.timestamp - b.timestamp);
    
    sortedMemos.forEach(memo => {
      const memoElement = createMemoElement(memo, videoId);
      memoList.appendChild(memoElement);
    });
  } catch (error) {
    console.error('Error loading memo detail:', error);
    document.getElementById('memo-list').innerHTML = 
      '<div class="error-state">메모를 불러오는 중 오류가 발생했습니다.</div>';
  }
}

// getMemos 함수 수정
async function getMemos(videoId) {
  try {
    const result = await chrome.storage.local.get(videoId);
    console.log('Storage result for videoId:', videoId, result); // 디버깅용
    return result[videoId] || [];
  } catch (error) {
    console.error('Error getting memos:', error);
    return [];
  }
}

// 성공 메시지를 위한 CSS 추가
const style = document.createElement('style');
style.textContent = `
  .success-message {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #4CAF50;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    animation: fadeInOut 2s ease-in-out;
  }

  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
    20% { opacity: 1; transform: translateX(-50%) translateY(0); }
    80% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  }
`;
document.head.appendChild(style);

// content.js가 제대로 동작하는지 확인을 위한 로그 추가
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { action: "getTime" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Content script error:', chrome.runtime.lastError);
    } else {
      console.log('Content script response:', response);
    }
  });
});

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// 메모 내보내기 함수
async function exportMemos() {
  try {
    const allData = await chrome.storage.local.get(null);
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      memos: allData
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-memos-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('메모를 성공적으로 내보냈습니다!');
  } catch (error) {
    console.error('Export error:', error);
    alert('메모 내보내기 중 오류가 발생했습니다.');
  }
}

// 메모 가져오기 함수 수정
async function importMemos(event) {
  try {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // 데이터 형식 검증
        if (!importedData.version || !importedData.memos) {
          throw new Error('잘못된 파일 형식입니다.');
        }

        const mergeConfirm = confirm(
          '기존 메모와 병합하시겠습니까?\n' +
          '"확인" - 기존 메모 유지 및 새 메모 추가\n' +
          '"취소" - 기존 메모 삭제 후 새 메모로 교체'
        );

        if (mergeConfirm) {
          // 기존 데이터와 병합
          const existingData = await chrome.storage.local.get(null);
          const mergedData = {};
          
          // 모든 비디오 ID에 대해 병합
          const allVideoIds = new Set([
            ...Object.keys(existingData),
            ...Object.keys(importedData.memos)
          ]);

          for (const videoId of allVideoIds) {
            const existingMemos = existingData[videoId] || [];
            const importedMemos = importedData.memos[videoId] || [];
            
            // 중복 제거하며 병합
            const mergedMemos = [...existingMemos];
            importedMemos.forEach(importedMemo => {
              if (!mergedMemos.some(existing => 
                existing.timestamp === importedMemo.timestamp && 
                existing.text === importedMemo.text
              )) {
                mergedMemos.push({
                  ...importedMemo,
                  id: Date.now() + Math.random()
                });
              }
            });
            
            if (mergedMemos.length > 0) {
              mergedData[videoId] = mergedMemos;
            }
          }
          
          await chrome.storage.local.clear();
          await chrome.storage.local.set(mergedData);
        } else {
          // 기 데이터 삭제 후 새 데이터 저장
          await chrome.storage.local.clear();
          await chrome.storage.local.set(importedData.memos);
        }

        alert('메모를 공적으로 가져왔습니다!');
        loadMemoList();
      } catch (error) {
        console.error('Import error:', error);
        alert('메모 가져오기 중 오류가 발생했습니다: ' + error.message);
      }
    };
    reader.readAsText(file);
  } catch (error) {
    console.error('Import error:', error);
    alert('파일 읽기 중 오류가 발생했습니다.');
  }
}

// 비디오 정보 동기화 함수 추가
async function syncVideoInfo(videoId, newInfo) {
  const memos = await getMemos(videoId);
  if (memos && memos.length > 0) {
    memos.forEach(memo => {
      memo.videoInfo = newInfo;
    });
    await chrome.storage.local.set({ [videoId]: memos });
    await loadMemoList(); // 목록 새로고침
  }
}

// 메시지 리스너 추가
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateVideoInfo') {
    syncVideoInfo(request.videoId, request.info);
  }
});

// getVideoInfo 함수 수정
async function getVideoInfo(tab) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tab.id, { action: "getVideoInfo" }, (response) => {
      if (response && response.title) {
        resolve({
          title: response.title,
          channel: response.channel,
          url: response.url
        });
      } else {
        resolve({
          title: '제목 없음',
          channel: '',
          url: tab.url
        });
      }
    });
  });
}

// 메모 목록 표시 함수 수정
function createVideoListItem(videoId, memos) {
  const videoInfo = memos[0].videoInfo || { title: '제목 없음', channel: '', url: '' };
  const element = document.createElement('div');
  element.className = 'video-item';
  
  // 현재 탭의 URL과 비교하여 버튼 텍스트 결정
  chrome.tabs.query({ active: true, currentWindow: true }, ([currentTab]) => {
    const isCurrentVideo = currentTab.url === videoInfo.url;
    
    element.innerHTML = `
      <div class="video-info" data-url="${videoInfo.url}">
        <div class="video-title">${videoInfo.title}</div>
        <div class="video-channel">${videoInfo.channel}</div>
        <div class="memo-count">메모 ${memos.length}개</div>
      </div>
      <div class="video-actions">
        <button class="action-button ${isCurrentVideo ? 'view-detail' : 'go-to-video'}" 
                data-video-id="${videoId}">
          ${isCurrentVideo ? '상세보기' : '동영상 이동'}
        </button>
        <span class="delete-video" title="목록 삭제">×</span>
      </div>
    `;

    // 버튼 클릭 이벤트
    element.querySelector('.action-button').addEventListener('click', () => {
      if (isCurrentVideo) {
        showDetailView(videoId);
      } else {
        if (confirm(`'${videoInfo.title}' 동영상으로 이동하시겠습니까?`)) {
          if (currentTab.url.includes('youtube.com')) {
            chrome.tabs.update(currentTab.id, { url: videoInfo.url });
          } else {
            chrome.tabs.create({ url: videoInfo.url });
          }
        }
      }
    });

    // 삭제 버튼 이벤트
    element.querySelector('.delete-video').addEventListener('click', async () => {
      if (confirm(`'${videoInfo.title}'의 모든 메모를 삭제하시겠습니까?`)) {
        try {
          await chrome.storage.local.remove(videoId);
          element.remove();
          showToast('메모 목록이 삭제되었습니다.');
          
          // 목록이 비어있는지 확인
          const allData = await chrome.storage.local.get(null);
          if (Object.keys(allData).length === 0) {
            document.getElementById('video-memo-list').innerHTML = 
              '<div class="empty-state">저장된 메모가 없습니다.</div>';
          }
        } catch (error) {
          console.error('Error deleting video memos:', error);
          showToast('삭제 중 오류가 발생했습니다.');
        }
      }
    });
  });

  return element;
}

// 메모 요소 생성 함수 수정
function createMemoElement(memo, videoId) {
  const div = document.createElement('div');
  div.className = 'memo-item';
  
  const timestamp = formatTime(memo.timestamp);
  div.innerHTML = `
    <span class="timestamp" title="클릭하여 이동">${timestamp}</span>
    <span class="memo-text" contenteditable="true">${memo.text}</span>
    <span class="delete-memo" title="삭제">×</span>
  `;

  const memoText = div.querySelector('.memo-text');
  let originalText = memo.text;

  // 메모 수정 이벤트 - blur일 때 저장
  memoText.addEventListener('blur', async () => {
    const newText = memoText.textContent.trim();
    if (newText && newText !== originalText) {
      try {
        const memos = await getMemos(videoId);
        const updatedMemos = memos.map(m => {
          if (m.id === memo.id) {
            return { ...m, text: newText };
          }
          return m;
        });

        await chrome.storage.local.set({ [videoId]: updatedMemos });
        originalText = newText;
        showToast('메모가 수정었습니다.');
      } catch (error) {
        console.error('Error saving memo:', error);
        memoText.textContent = originalText;
        showToast('메모 저 중 오류가 발생했습니다.');
      }
    }
  });

  // Enter 키 처리
  memoText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      memoText.blur();
    }
  });

  // 기존 타임스탬프 클릭 이벤트
  div.querySelector('.timestamp').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { 
        action: "seekTo", 
        time: memo.timestamp 
      });
    } catch (error) {
      console.error('Error seeking to timestamp:', error);
    }
  });

  // 삭제 버튼 이벤트
  div.querySelector('.delete-memo').addEventListener('click', async () => {
    if (confirm('이 메모를 삭제하시겠습니까?')) {
      try {
        const memos = await getMemos(videoId);
        const updatedMemos = memos.filter(m => m.id !== memo.id);
        await chrome.storage.local.set({ [videoId]: updatedMemos });
        await loadMemoDetail(videoId);
        showToast('메모가 삭제되었습니다.');
      } catch (error) {
        console.error('Error deleting memo:', error);
        showToast('메모 삭제 중 오류가 발생했습니다.');
      }
    }
  });

  return div;
}

// 토스트 메시지 표시 함수
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 1700);
} 