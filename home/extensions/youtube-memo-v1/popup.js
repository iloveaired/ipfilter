document.addEventListener('DOMContentLoaded', () => {
  const memoInput = document.getElementById('memo-input');
  const addButton = document.getElementById('add-memo');
  const memoList = document.getElementById('memo-list');

  // 현재 탭의 메모 목록 로드
  loadMemos();

  // 메모 추가 버튼 클릭 이벤트
  addButton.addEventListener('click', async () => {
    const memo = memoInput.value.trim();
    if (!memo) return;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.url.includes('youtube.com/watch')) {
        alert('YouTube 동영상 페이지에서만 메모를 추가할 수 있습니다.');
        return;
      }

      const videoId = new URL(tab.url).searchParams.get('v');
      
      // content script에 현재 시간 요청
      chrome.tabs.sendMessage(tab.id, { action: "getTime" }, async (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
          alert('동영상 시간을 가져올 수 없습니다. 페이지를 새로고침해주세요.');
          return;
        }

        if (response.error) {
          console.error('Error:', response.error);
          alert('동영상을 찾을 수 없습니다. 페이지를 새로고침해주세요.');
          return;
        }

        const timestamp = response.currentTime;
        
        // 메모 저장
        const memos = await getMemos(videoId) || [];
        const newMemo = {
          text: memo,
          timestamp,
          id: Date.now()
        };
        
        memos.push(newMemo);
        await chrome.storage.local.set({ [videoId]: memos });

        // 입력창 초기화 및 목록 새로고침
        memoInput.value = '';
        await loadMemos();
      });
    } catch (error) {
      console.error('Error adding memo:', error);
      alert('메모 추가 중 오류가 발생했습니다.');
    }
  });

  // 내보내기/가져오기 버튼 이벤트
  document.getElementById('export-db').addEventListener('click', exportMemos);
  document.getElementById('import-db').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', importMemos);
});

async function loadMemos() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.url.includes('youtube.com/watch')) {
      document.getElementById('memo-list').innerHTML = '<p>YouTube 동영상 페이에서만 사용할 수 있습니다.</p>';
      return;
    }

    const videoId = new URL(tab.url).searchParams.get('v');
    const memos = await getMemos(videoId) || [];

    const memoList = document.getElementById('memo-list');
    memoList.innerHTML = '';

    memos.sort((a, b) => a.timestamp - b.timestamp).forEach(memo => {
      const memoElement = createMemoElement(memo, videoId);
      memoList.appendChild(memoElement);
    });
  } catch (error) {
    console.error('Error loading memos:', error);
    document.getElementById('memo-list').innerHTML = '<p>메모를 불러오는 중 오류가 발생했습니다.</p>';
  }
}

function createMemoElement(memo, videoId) {
  const div = document.createElement('div');
  div.className = 'memo-item';
  
  const timestamp = formatTime(memo.timestamp);
  div.innerHTML = `
    <span class="timestamp">${timestamp}</span>
    <span class="memo-text">${memo.text}</span>
    <span class="delete-memo" data-id="${memo.id}">×</span>
  `;

  // 타임스탬프 클릭 이벤트
  div.querySelector('.timestamp').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { 
      action: "seekTo", 
      time: memo.timestamp 
    });
  });

  // 삭제 버튼 이벤트
  div.querySelector('.delete-memo').addEventListener('click', async () => {
    const memos = await getMemos(videoId);
    const updatedMemos = memos.filter(m => m.id !== memo.id);
    await chrome.storage.local.set({ [videoId]: updatedMemos });
    loadMemos();
  });

  return div;
}

async function getMemos(videoId) {
  const result = await chrome.storage.local.get(videoId);
  return result[videoId];
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// 메모 내보내기 함수
async function exportMemos() {
  try {
    // 전체 저장소 데이터 가져오기
    const data = await chrome.storage.local.get(null);
    
    // JSON 파일로 다운로드
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-memos-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('메모를 성공적으로 내보냈습니다!');
  } catch (error) {
    alert('메모 내보내기 패: ' + error.message);
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
        
        // 기존 데이터와 병합할지 확인
        const mergeConfirm = confirm('기존 메모와 병합하시겠습니까?\n"취소"를 선택하면 기존 메모가 삭제됩니다.');
        
        if (mergeConfirm) {
          // 기존 데이터 가져오기
          const existingData = await chrome.storage.local.get(null);
          
          // 각 비디오 ID에 대해 메모 병합
          for (const videoId in importedData) {
            const importedMemos = importedData[videoId] || [];
            const existingMemos = existingData[videoId] || [];
            
            // 중복 제거하며 병합
            const mergedMemos = [...existingMemos];
            
            importedMemos.forEach(importedMemo => {
              // 동일한 timestamp와 text를 가진 메모가 있는지 확인
              const isDuplicate = mergedMemos.some(existingMemo => 
                existingMemo.timestamp === importedMemo.timestamp && 
                existingMemo.text === importedMemo.text
              );
              
              // 중복되지 않은 메모만 추가
              if (!isDuplicate) {
                mergedMemos.push({
                  ...importedMemo,
                  id: Date.now() + Math.random() // 새로운 고유 ID 생성
                });
              }
            });
            
            // timestamp 기준으로 정렬
            mergedMemos.sort((a, b) => a.timestamp - b.timestamp);
            
            // 병합된 메모 저장
            await chrome.storage.local.set({ [videoId]: mergedMemos });
          }
        } else {
          // 기존 데이터 삭제 후 새 데이터 저장
          await chrome.storage.local.clear();
          await chrome.storage.local.set(importedData);
        }
        
        alert('메모를 성공적으로 가져왔습니다!');
        // 현재 메모 목록 새로고침
        loadMemos();
        
        // 파일 입력 초기화
        event.target.value = '';
      } catch (error) {
        console.error('Import error:', error);
        alert('잘못된 파일 형식입니다.');
      }
    };
    reader.readAsText(file);
  } catch (error) {
    console.error('Import error:', error);
    alert('메모 가져오기 실패: ' + error.message);
  }
} 