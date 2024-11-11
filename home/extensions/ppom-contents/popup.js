function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getDomain(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return 'unknown';
    }
}

async function getCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
}

async function fetchPageSource(url) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            { action: 'fetchSource', url: url },
            response => {
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.html);
                }
            }
        );
    });
}

async function deleteHistoryItem(url) {
    try {
        const { history = [] } = await chrome.storage.local.get('history');
        // URL을 정규화하여 비교
        const normalizedUrl = new URL(url).href;
        const updatedHistory = history.filter(item => {
            try {
                const itemNormalizedUrl = new URL(item.url).href;
                return itemNormalizedUrl !== normalizedUrl;
            } catch {
                return item.url !== url;
            }
        });
        
        await chrome.storage.local.set({ history: updatedHistory });
        await updateHistoryDisplay();
    } catch (error) {
        console.error('Error deleting item:', error);
    }
}

async function clearAllHistory() {
    await chrome.storage.local.set({ history: [] });
    await updateHistoryDisplay();
}

async function updateHistoryDisplay() {
    const { history = [] } = await chrome.storage.local.get('history');
    const contentList = document.getElementById('contentList');
    contentList.innerHTML = '';
    
    history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'content-item';
        
        const contentInfo = document.createElement('div');
        contentInfo.className = 'content-info';
        contentInfo.innerHTML = `
            <div class="title">${item.title || 'No Title'}</div>
            <div class="url">${item.url}</div>
            <div class="size">${formatSize(item.size)}</div>
        `;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.onclick = () => deleteHistoryItem(item.url);
        
        div.appendChild(contentInfo);
        div.appendChild(deleteBtn);
        contentList.appendChild(div);
    });
}

async function updatePopup() {
    try {
        // 현재 탭 정보 가져오기
        const currentTab = await getCurrentTab();
        const currentUrl = currentTab.url;
        
        document.getElementById('currentUrl').textContent = currentUrl;
        document.getElementById('currentDomain').textContent = getDomain(currentUrl);

        // 페이지 소스 가져오기
        const sourceHtml = await fetchPageSource(currentUrl);
        const size = new TextEncoder().encode(sourceHtml).length;
        
        document.getElementById('currentSize').textContent = formatSize(size);

        // 현재 페이지 정보를 storage에 저장
        const pageData = {
            url: currentUrl,
            title: currentTab.title,
            size: size,
            timestamp: new Date().toISOString()
        };

        // 이전 기록 가져오기
        const { history = [] } = await chrome.storage.local.get('history');
        
        // 중복 제거 후 새 데이터 추가
        const existingIndex = history.findIndex(item => item.url === currentUrl);
        if (existingIndex !== -1) {
            history[existingIndex] = pageData;
        } else {
            history.unshift(pageData);
        }

        // 최대 20개 기록만 유지
        const updatedHistory = history.slice(0, 20);
        await chrome.storage.local.set({ history: updatedHistory });

        // 기록 표시 부분을 updateHistoryDisplay 호출로 대체
        await updateHistoryDisplay();
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('currentSize').textContent = 'Error: ' + error.message;
        await updateHistoryDisplay();
    }
}

// 이벤트 리스너 수정
document.addEventListener('DOMContentLoaded', () => {
    updatePopup();
    document.getElementById('clearAll').addEventListener('click', clearAllHistory);
});
