document.addEventListener('DOMContentLoaded', async () => {
  const bookmarksList = document.getElementById('bookmarks-list');
  const addButton = document.getElementById('add-bookmark');
  const filterButtons = document.querySelectorAll('.filter-btn');
  let currentFilter = 'all'; // 현재 필터 상태

  // 북마크 로드
  const loadBookmarks = async () => {
    const { bookmarks = [] } = await chrome.storage.local.get('bookmarks');
    
    // 필터링 적용
    const filteredBookmarks = bookmarks.filter(bookmark => {
      if (currentFilter === 'starred') {
        return bookmark.starred;
      }
      return true;
    });

    bookmarksList.innerHTML = '';
    
    filteredBookmarks.forEach((bookmark, index) => {
      const div = document.createElement('div');
      div.className = 'bookmark-item';
      div.innerHTML = `
        <div class="bookmark-content">
          <div class="bookmark-title">
            <a href="${bookmark.url}" target="_blank">${bookmark.title}</a>
          </div>
          ${bookmark.note ? 
            `<span class="note-text">(${bookmark.note})</span>` : 
            ''
          }
          <span class="note-btn" data-index="${bookmark.index || index}">📝</span>
          <input type="text" class="note-input" 
            placeholder="메모를 입력하세요" 
            value="${bookmark.note || ''}"
            data-index="${bookmark.index || index}">
        </div>
        <div class="actions">
          <span class="star-btn ${bookmark.starred ? 'active' : ''}" data-index="${bookmark.index || index}">
            ${bookmark.starred ? '⭐' : '☆'}
          </span>
          <span class="delete-btn" data-index="${bookmark.index || index}">❌</span>
        </div>
      `;
      bookmarksList.appendChild(div);
    });

    // 이벤트 리스너들 추가
    addEventListeners();
  };

  // 필터 버튼 이벤트
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // 활성화된 버튼 스타일 변경
      filterButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      // 필터 적용
      currentFilter = e.target.dataset.filter;
      loadBookmarks();
    });
  });

  // 이벤트 리스너들을 한 곳에서 관리
  const addEventListeners = () => {
    // 즐겨찾기 버튼 클릭 이벤트
    document.querySelectorAll('.star-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const index = parseInt(e.target.dataset.index);
        const { bookmarks = [] } = await chrome.storage.local.get('bookmarks');
        bookmarks[index].starred = !bookmarks[index].starred;
        await chrome.storage.local.set({ bookmarks });
        loadBookmarks();
      });
    });

    // 메모 버튼 클릭 이벤트
    document.querySelectorAll('.note-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = e.target.dataset.index;
        const input = e.target.parentElement.querySelector('.note-input');
        const noteText = e.target.parentElement.querySelector('.note-text');
        
        if (noteText) noteText.style.display = 'none';
        input.style.display = 'inline-block';
        input.focus();
      });
    });

    // 메모 입력 완료 이벤트
    document.querySelectorAll('.note-input').forEach(input => {
      input.addEventListener('blur', async (e) => {
        const index = parseInt(e.target.dataset.index);
        const { bookmarks = [] } = await chrome.storage.local.get('bookmarks');
        bookmarks[index].note = e.target.value;
        await chrome.storage.local.set({ bookmarks });
        loadBookmarks();
      });

      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.target.blur();
        }
      });
    });

    // 삭제 버튼 이벤트
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const index = parseInt(e.target.dataset.index);
        const { bookmarks = [] } = await chrome.storage.local.get('bookmarks');
        bookmarks.splice(index, 1);
        await chrome.storage.local.set({ bookmarks });
        loadBookmarks();
      });
    });
  };

  // URL이 이미 존재하는지 확인
  const isUrlExists = async (url) => {
    const { bookmarks = [] } = await chrome.storage.local.get('bookmarks');
    const videoId = new URL(url).searchParams.get('v');
    return bookmarks.some(bookmark => {
      const existingVideoId = new URL(bookmark.url).searchParams.get('v');
      return videoId === existingVideoId;
    });
  };

  // 현재 페이지 추가 버튼 이벤트
  addButton.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('youtube.com/watch')) {
        alert('YouTube 동영상 페이지만 북마크할 수 있습니다.');
        return;
      }

      if (await isUrlExists(tab.url)) {
        alert('이미 북마크에 추가된 동영상입니다.');
        return;
      }

      const { bookmarks = [] } = await chrome.storage.local.get('bookmarks');
      bookmarks.push({
        title: tab.title.replace(' - YouTube', ''), // YouTube 텍스트 제거
        url: tab.url,
        note: '',
        starred: false,
        index: bookmarks.length // 인덱스 추가
      });

      await chrome.storage.local.set({ bookmarks });
      loadBookmarks();
      
    } catch (error) {
      console.error('Error adding bookmark:', error);
      alert('북마크 추가 중 오류가 발생했습니다.');
    }
  });

  // 초기 로드
  loadBookmarks();
}); 