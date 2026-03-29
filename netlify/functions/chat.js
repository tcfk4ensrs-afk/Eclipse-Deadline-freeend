

// 🟢 あなたのGASウェブアプリURL
const GAS_URL = "https://script.google.com/macros/s/AKfycbzT7WL3cFXCnb9NLATPWKEAbVir5vZV2NE-eLMciQ46m-gLGiuRjofc-YerUpFcE0x41Q/exec";

exports.handler = async (event) => {
    const API_KEY = process.env.GEMINI_API_KEY;
    
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const body = JSON.parse(event.body);

    // --- 🪐 A: エンディング生成 & スプレッドシート保存プロトコル ---
    if (body.type === "ACCUSATION") {
        const accusationPrompt = `
# Role
あなたはSFミステリー『Eclipse Deadline』の物語を完結させる、冷徹かつ詩的なゲームマスターです。
プレイヤーが下した「最後の決断」を受け取り、その結末を300〜500文字程度でドラマチックに執筆してください。

# プレイヤーの決断データ
- 執行対象: ${body.target1}
- 送り先: ${body.location}
- プレイヤーの主張・遺言: "${body.playerReason}"
- これまでに確定させた証拠数: ${body.evidenceCount} / 6

# 執筆の指針
1. **論理の整合性**: 証拠数が3以下なら、真犯人ノアが余裕の笑みを浮かべてプレイヤーを嘲笑うバッドエンドにせよ。
2. **プレイヤーの意図を汲む**: 独創的な主張があれば、それが論理的に可能か判断し結末を描け。
3. **舞台設定の活用**: 宇宙船の閉塞感やエンジンの脈動など、SF的な情景描写を混ぜよ。
4. **形式**: 小説のような地の文と台詞のみで構成せよ。

# 形式
テキストのみ。
        `;

        try {
            // 🟢 修正：変数名を accusationPrompt に統一
            const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: accusationPrompt }] }] })
            });
            
            const aiData = await aiRes.json();
            if (!aiData.candidates) throw new Error("AI generation failed");
            
            const endingText = aiData.candidates[0].content.parts[0].text;

            // GASへデータを飛ばす（awaitで完了を待つ）
            await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target1: body.target1,
                    location: body.location,
                    evidenceCount: body.evidenceCount,
                    playerReason: body.playerReason,
                    aiEnding: endingText
                })
            });

            return { 
                statusCode: 200, 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ending: endingText }) 
            };
        } catch (e) {
            console.error("Accusation Error:", e);
            return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
        }
    }

    // --- 🎙️ B: 通常の尋問チャットプロトコル ---
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: body.systemPrompt }] },
                    ...body.history.map(h => ({
                        role: h.role === 'model' ? 'model' : 'user',
                        parts: [{ text: h.text }]
                    })),
                    { role: "user", parts: [{ text: body.userText }] }
                ]
            })
        });

        const data = await response.json();
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data.candidates[0].content.parts[0].text)
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Gemini API Error' }) };
    }
};
