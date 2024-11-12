// 디버깅을 위한 콘솔 로그 추가
console.log('Popup script loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');

    const captureWindowBtn = document.getElementById('captureWindow');
    const editor = document.getElementById('markdownEditor');
    const preview = document.getElementById('preview');

    // 윈도우 캡처 버튼 이벤트
    captureWindowBtn.addEventListener('click', function() {
        console.log('Window capture button clicked');
        
        // chrome.tabs API를 사용하여 현재 활성 탭 캡처
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "startCapture"
            });
        });

        // 팝업 최소화
        window.close();
    });

    // 캡처 결과 수신
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === "captureComplete") {
            const imageUrl = request.imageUrl;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            saveImage(imageUrl, `capture-${timestamp}.png`);
        }
    });

    // 이미지 저장 함수
    function saveImage(dataUrl, fileName) {
        // Base64 데이터 URL을 Blob으로 변환
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([ab], { type: mimeString });
        
        // Chrome downloads API를 사용하여 파일 저장
        chrome.downloads.download({
            url: URL.createObjectURL(blob),
            filename: fileName,
            saveAs: true
        });
    }

    // 에디터 입력 이벤트
    editor.addEventListener('input', function() {
        preview.innerHTML = editor.value;
    });

    // 저장된 노트 불러오기
    chrome.storage.local.get('lastNote', function(result) {
        if (result.lastNote) {
            editor.value = result.lastNote;
            preview.innerHTML = result.lastNote;
        }
    });
}); 