const fetch = require('node-fetch');

// 🟢 あなたのGASウェブアプリURL
const GAS_URL = "https://script.google.com/macros/s/AKfycbzT7WL3cFXCnb9NLATPWKEAbVir5vZV2NE-eLMciQ46m-gLGiuRjofc-YerUpFcE0x41Q/exec";

exports.handler = async (event) => {
    const API_KEY = process.env.GEMINI_API_KEY;
    
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const body = JSON.parse(event.body);

    // --- 🪐 A: エンディング生成 & スプレッドシート保存プロトコル ---
   // ... (前後のコードは維持)

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

# 執筆の指針（空気を読むためのルール）
1. **論理の整合性**: 
   プレイヤーが「ノア」を犯人と指名していても、証拠数が少ない（3以下）場合は、ノアが余裕の笑みを浮かべながら「無能な探偵ごっこ」を嘲笑うバッドエンドにしてください。
2. **プレイヤーの意図を汲む**: 
   プレイヤーが自ら犠牲になろうとしたり、全員を救おうとする独創的な主張をした場合、それが「論理的に可能か」を判断し、AIとしての解釈で結末を描いてください。
3. **舞台設定の活用**: 
   宇宙船の閉塞感、エンジンの脈動、窓の外の虚無など、SF的な情景描写を混ぜてください。
4. **皮肉と敬意**: 
   優れた推理には敬意を、愚かな選択には冷ややかな皮肉を、台詞（outer_voice）として混ぜてください。

# 禁止事項
- 箇条書きや解説は不要です。小説のような地の文と台詞のみで構成してください。
- 結末をプレイヤーに委ねず、あなたが「完結」させてください。

# 形式
テキストのみ。
    `;

    // ... (以降、Gemini APIへのリクエストとスプレッドシート保存処理)
}

        try {
            const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const aiData = await aiRes.json();
            const endingText = aiData.candidates[0].content.parts[0].text;

            // GASへデータを飛ばす（awaitで完了を待つ）
            await fetch(GAS_URL, {
                method: 'POST',
                body: JSON.stringify({
                    target1: body.target1,
                    target2: body.target2,
                    location: body.location,
                    evidenceCount: body.evidenceCount,
                    playerReason: body.playerReason,
                    aiEnding: endingText
                })
            });

            return { statusCode: 200, body: JSON.stringify({ ending: endingText }) };
        } catch (e) {
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
            body: JSON.stringify(data.candidates[0].content.parts[0].text)
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Gemini API Error' }) };
    }
};
