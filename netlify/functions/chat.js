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
    if (body.type === "ACCUSATION") {
        const prompt = `あなたはSFミステリー『Eclipse Deadline』のマスターです。以下の状況で結末を300字程度で執筆せよ。
        対象:${body.target1},${body.target2} / 場所:${body.location} / 証拠:${body.evidenceCount} / 主張:${body.playerReason}`;

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
