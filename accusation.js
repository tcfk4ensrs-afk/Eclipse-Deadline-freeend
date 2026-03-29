/**
 * accusation.js (記述式対応版)
 */

async function executeFinalCommand() {
    const btn = document.getElementById('execute-btn');
    const target = document.getElementById('player-target').value.trim();
    const location = document.getElementById('player-location').value.trim();
    const reason = document.getElementById('player-reason').value.trim();

    if (!target || !location || !reason) {
        alert("すべての項目を入力してください。");
        return;
    }

    if (!confirm("【最終警告】このコマンドは取り消せません。送信しますか？")) {
        return;
    }

    // 進行状況を演出
    btn.innerText = "PROCESSING...";
    btn.disabled = true;

    // 証拠の確定状況
    const evidences = JSON.parse(localStorage.getItem('securedEvidence')) || [];
    const confirmedCount = evidences.filter(e => e.detail.includes("【確定】")).length;

    const data = {
        type: "ACCUSATION",
        target1: target,      // 自由記述の内容
        location: location,   // 自由記述の内容
        playerReason: reason, // 自由記述の内容
        evidenceCount: confirmedCount
    };

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        const result = await response.json();
        
        // AIが生成したエンディングを保存
        sessionStorage.setItem('finalEndingText', result.ending);
        
        // フェードアウト演出
        document.body.style.transition = "opacity 2s";
        document.body.style.opacity = "0";
        setTimeout(() => { location.href = "ending_result.html"; }, 2000);
        
    } catch (e) {
        alert("通信エラーが発生しました。");
        btn.disabled = false;
        btn.innerText = "CONFIRM & EXECUTE";
    }
}
