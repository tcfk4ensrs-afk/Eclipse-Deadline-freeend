/**
 * ai.js - Netlify Functions 経由で Gemini API と通信するフロントエンド側ロジック
 */
export async function sendToAI(systemPrompt, userText, history = []) {
    // 🟢 /api/chat へのリクエスト（Netlifyのリダイレクト設定前提）
    const response = await fetch('/api/chat', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt, userText, history })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server Error: ${response.status}`);
    }

    const data = await response.json();

    // 🟢 データの構造をチェック
    if (data && typeof data === 'string') {
        // chat.js側で既にテキスト化して返している場合
        return cleanAiResponse(data);
    } else if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        // 標準的なGeminiのレスポンス形式の場合
        return cleanAiResponse(data.candidates[0].content.parts[0].text);
    } else {
        console.error("Unexpected AI Response Structure:", data);
        throw new Error("AIの応答構造が異常です。");
    }
}

/**
 * 🟢 AIの回答から不要なタグ（outer_voice: 等）を掃除する補助関数
 */
function cleanAiResponse(text) {
    if (!text) return "";
    
    return text
        .replace(/outer_voice[:：]\s*/gi, "")    // 「outer_voice:」を削除
        .replace(/inner_voice[:：][\s\S]*/gi, "") // 「inner_voice:」以降をすべて削除
        .replace(/【証拠提示：[\s\S]*?】/g, "")   // AIがオウム返しした証拠タグを削除
        .trim();                                // 前後の空白を削除
}
