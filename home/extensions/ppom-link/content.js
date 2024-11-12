// 디버깅을 위한 로그
console.log('Content script loaded');

// 익스텐션 상태 확인
function isExtensionEnabled() {
    return localStorage.getItem('ppomLinkDecoderEnabled') === 'true';
}

// 익스텐션 상태 설정
function setExtensionEnabled(enabled) {
    localStorage.setItem('ppomLinkDecoderEnabled', enabled);
}

// 버튼 생성 및 추가
function createToggleButton() {
    const button = document.createElement('button');
    button.id = 'ppom-toggle-button';
    button.textContent = '링크 디코더 종료';
    button.style.cssText = `
        position: fixed;
        top: 10px;
        right: 20px;
        padding: 8px 20px;
        background: #f44336;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        z-index: 2147483647;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        transition: all 0.2s ease;
    `;

    button.addEventListener('mouseover', () => {
        button.style.opacity = '0.9';
    });

    button.addEventListener('mouseout', () => {
        button.style.opacity = '1';
    });

    button.addEventListener('click', () => {
        cleanup();
        button.remove();
        setExtensionEnabled(false);
    });

    document.body.appendChild(button);
    return button;
}

// cleanup 함수
function cleanup() {
    const container = document.getElementById('ppom-link-list');
    if (container) {
        container.remove();
    }
}

// URL 디코딩 함수
function decodeUrl(url) {
    try {
        if (!url.includes('s.ppomppu.co.kr')) return null;

        const urlParams = new URLSearchParams(url.split('?')[1]);
        let target = urlParams.get('target');
        const encode = urlParams.get('encode');

        if (encode === 'on' && target) {
            target = target.replace(/ /g, '+');
            let decodedUrl = atob(target);
            decodedUrl = decodedUrl.replace(/&amp;/g, '&')
                                 .replace(/&lt;/g, '<')
                                 .replace(/&gt;/g, '>')
                                 .replace(/&quot;/g, '"')
                                 .replace(/&#039;/g, "'")
                                 .replace(/&nbsp;/g, ' ');
            return decodedUrl.trim();
        }
    } catch (e) {
        console.error('Decoding error for URL:', url, e);
    }
    return null;
}

// 링크 리스트 UI 생성
function createLinkListUI() {
    cleanup(); // 기존 UI가 있다면 제거

    const container = document.createElement('div');
    container.id = 'ppom-link-list';
    container.style.cssText = `
        position: fixed;
        top: 60px;
        right: 20px;
        width: 400px;
        max-height: calc(100vh - 80px);
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 999998;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    `;

    const linkList = document.createElement('div');
    linkList.id = 'ppom-link-items';

    container.appendChild(linkList);
    document.body.appendChild(container);

    return linkList;
}

// 링크 처리 함수
function processPpomppuUrls() {
    const links = document.querySelectorAll('a[href*="s.ppomppu.co.kr"]');
    console.log('Found redirect links:', links.length);

    if (links.length > 0) {
        const linkList = createLinkListUI();
        
        links.forEach((link, index) => {
            const originalUrl = link.href;
            const decodedUrl = decodeUrl(originalUrl);
            
            if (decodedUrl) {
                console.log(`Decoded URL ${index + 1}:`, decodedUrl);
                
                // 원본 링크에 데이터 속성 추가
                link.dataset.linkIndex = index;
                
                const item = document.createElement('div');
                item.style.cssText = `
                    margin-bottom: 10px;
                    padding: 8px;
                    background: #f8f9fa;
                    border-radius: 4px;
                    border: 1px solid #e9ecef;
                `;
                item.dataset.linkIndex = index;

                const linkText = link.textContent.trim() || '링크';
                item.innerHTML = `
                    <div style="margin-bottom: 5px; color: #1a0dab;">
                        ${index + 1}. ${linkText}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 12px; word-break: break-all; color: #006621; flex-grow: 1; margin-right: 8px; cursor: pointer;" 
                             title="클릭하여 링크 열기">
                            ${decodedUrl}
                        </div>
                        <button class="copy-button" style="
                            padding: 2px 6px;
                            background: #f0f0f0;
                            color: #666;
                            border: 1px solid #ddd;
                            border-radius: 3px;
                            cursor: pointer;
                            font-size: 11px;
                            min-width: 40px;
                            height: 20px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.2s ease;
                        ">복사</button>
                    </div>
                `;

                // 마우스 오버 이벤트
                item.addEventListener('mouseenter', () => {
                    // 원본 링크 하이라이트
                    const originalLink = document.querySelector(`a[data-link-index="${index}"]`);
                    if (originalLink) {
                        originalLink.style.transition = 'all 0.2s ease';
                        originalLink.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                        originalLink.style.boxShadow = '0 0 0 2px rgba(255, 0, 0, 0.3)';
                        originalLink.style.borderRadius = '2px';
                        
                        // 화면에 보이지 않는 경우 스크롤
                        const rect = originalLink.getBoundingClientRect();
                        if (rect.top < 0 || rect.bottom > window.innerHeight) {
                            originalLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                });

                // 마우스 아웃 이벤트
                item.addEventListener('mouseleave', () => {
                    // 하이라이트 제거
                    const originalLink = document.querySelector(`a[data-link-index="${index}"]`);
                    if (originalLink) {
                        originalLink.style.backgroundColor = '';
                        originalLink.style.boxShadow = '';
                    }
                });

                // URL 클릭 이벤트
                const urlDiv = item.querySelector('div[title="클릭하여 링크 열기"]');
                urlDiv.addEventListener('click', () => {
                    window.open(decodedUrl, '_blank');
                });

                // 복사 버튼 이벤트
                const copyButton = item.querySelector('.copy-button');
                copyButton.addEventListener('mouseover', () => {
                    copyButton.style.background = '#e8e8e8';
                });
                copyButton.addEventListener('mouseout', () => {
                    copyButton.style.background = '#f0f0f0';
                });
                copyButton.addEventListener('click', async () => {
                    try {
                        await navigator.clipboard.writeText(decodedUrl);
                        
                        // 복사 성공 표시
                        copyButton.textContent = '✓';
                        copyButton.style.background = '#e8f5e9';
                        copyButton.style.color = '#2e7d32';
                        copyButton.style.borderColor = '#c8e6c9';
                        
                        // 1초 후 원래 상태로 복귀
                        setTimeout(() => {
                            copyButton.textContent = '복사';
                            copyButton.style.background = '#f0f0f0';
                            copyButton.style.color = '#666';
                            copyButton.style.borderColor = '#ddd';
                        }, 1000);
                    } catch (err) {
                        console.error('URL 복사 실패:', err);
                        copyButton.textContent = '!';
                        copyButton.style.background = '#ffebee';
                        copyButton.style.color = '#c62828';
                        copyButton.style.borderColor = '#ffcdd2';
                        
                        setTimeout(() => {
                            copyButton.textContent = '복사';
                            copyButton.style.background = '#f0f0f0';
                            copyButton.style.color = '#666';
                            copyButton.style.borderColor = '#ddd';
                        }, 1000);
                    }
                });

                linkList.appendChild(item);
            }
        });
    }
}

// 초기 실행 - 상태 확인 후 실행
if (isExtensionEnabled()) {
    createToggleButton();
    processPpomppuUrls();
}

// 메시지 리스너 추가
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startDecoder') {
        setExtensionEnabled(true);
        createToggleButton();
        processPpomppuUrls();
    }
});
