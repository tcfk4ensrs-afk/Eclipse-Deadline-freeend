// accusation.js の executeFinalCommand 関数内
async function executeFinalCommand() {
    const btn = document.getElementById('execute-btn');
    const target = document.getElementById('player-target').value;
    const locationName = document.getElementById('player-location').value;
    const reason = document.getElementById('player-reason').value;

    // 1. データの準備
    const data = {
        type: "ACCUSATION",
        target1: target,
        location: locationName,
        playerReason: reason,
        evidenceCount: JSON.parse(localStorage.getItem('securedEvidence') || "[]").filter(e => e.detail.includes("【確定】")).length
    };

    console.log("Sending Data to AI...", data); // 👈 送信直前のログ

    try {
        btn.disabled = true;
        btn.innerText = "GENERATING ENDING...";

        // 2. 通信（ここが完了するまで待つ）
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log("AI Response Received:", result); // 👈 受信した中身をチェック

        if (result.ending) {
            // 3. セッションに保存
            sessionStorage.setItem('finalEndingText', result.ending);
            
            // 4. 保存を確認してから遷移
            document.body.style.opacity = "0";
            document.body.style.transition = "opacity 1s";
            setTimeout(() => {
                window.location.href = "ending_result.html";
            }, 1000);
        } else {
            alert("AIからの返答にエンディングが含まれていません。");
            btn.disabled = false;
        }
    } catch (e) {
        console.error("Critical Error:", e);
        alert("システムエラーが発生しました。詳細はコンソールを確認してください。");
        btn.disabled = false;
    }
}
