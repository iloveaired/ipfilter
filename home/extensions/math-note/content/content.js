// 캡처 영역을 표시할 요소들
let overlay = null;
let selection = null;
let startPos = null;
let isSelecting = false;

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startCapture") {
        initializeCapture();
    }
});

function initializeCapture() {
    // 오버레이 생성
    overlay = document.createElement('div');
    overlay.className = 'capture-overlay';
    
    // 선택 영역 생성
    selection = document.createElement('div');
    selection.className = 'capture-selection';
    
    // 스타일 적용
    const style = document.createElement('style');
    style.textContent = `
        .capture-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.2);
            z-index: 999999;
            cursor: crosshair;
        }
        .capture-selection {
            position: fixed;
            border: 2px solid #0095ff;
            background: rgba(0, 149, 255, 0.1);
            z-index: 999999;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(overlay);
    document.body.appendChild(selection);
    
    // 이벤트 리스너 추가
    overlay.addEventListener('mousedown', startSelection);
    overlay.addEventListener('mousemove', updateSelection);
    overlay.addEventListener('mouseup', endSelection);
}

function startSelection(e) {
    isSelecting = true;
    startPos = { x: e.clientX, y: e.clientY };
    selection.style.left = startPos.x + 'px';
    selection.style.top = startPos.y + 'px';
    selection.style.width = '0';
    selection.style.height = '0';
}

function updateSelection(e) {
    if (!isSelecting) return;
    
    const currentPos = { x: e.clientX, y: e.clientY };
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);
    
    selection.style.left = Math.min(currentPos.x, startPos.x) + 'px';
    selection.style.top = Math.min(currentPos.y, startPos.y) + 'px';
    selection.style.width = width + 'px';
    selection.style.height = height + 'px';
}

function endSelection(e) {
    isSelecting = false;
    
    // 선택 영역 캡처
    const rect = selection.getBoundingClientRect();
    captureArea(rect);
    
    // 오버레이와 선택 영역 제거
    document.body.removeChild(overlay);
    document.body.removeChild(selection);
}

async function captureArea(rect) {
    try {
        // 화면 캡처
        const canvas = document.createElement('canvas');
        canvas.width = rect.width;
        canvas.height = rect.height;
        const ctx = canvas.getContext('2d');
        
        // 선택 영역 캡처
        ctx.drawImage(
            document.documentElement, 
            rect.left, rect.top, rect.width, rect.height,
            0, 0, rect.width, rect.height
        );
        
        // 캡처 결과 전송
        const imageUrl = canvas.toDataURL('image/png');
        chrome.runtime.sendMessage({
            action: "captureComplete",
            imageUrl: imageUrl
        });
        
    } catch (err) {
        console.error('Error during capture:', err);
    }
} 