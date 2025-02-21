const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

async function callGeminiAPI(
  promptText,
  existingAnswer = null,
  contextString = ""
) {
  try {
    if (typeof promptText !== "string" || promptText.trim().length === 0) {
      throw new Error("Prompt phải là một chuỗi không rỗng.");
    }

    let enhancedPrompt = `${contextString}
Cuộc trò chuyện hiện tại:
Người dùng: ${promptText}

${
  existingAnswer
    ? `Câu trả lời trước đó: ${existingAnswer}

Hướng dẫn cải thiện:
1. Phân tích những gì có thể tốt hơn trong câu trả lời trước
2. Cung cấp thông tin chi tiết và chính xác hơn
3. Làm cho câu trả lời tự nhiên và hấp dẫn hơn
4. Giữ lại những phần hữu ích từ câu trả lời trước
5. Bổ sung ví dụ hoặc giải thích liên quan nếu cần

Vui lòng đưa ra câu trả lời được cải thiện theo các điểm trên và giữ giọng điệu thân thiện.
Chỉ cần gửi câu trả lời đúng trọng tâm. Và Bạn đang đóng vai là Mei, một người trợ lý.`
    : "Bạn đang đóng vai là Mei, một người trợ lý. Hãy đưa ra câu trả lời hữu ích và thân thiện."
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    return response.text()?.trim() || null;
  } catch (error) {
    console.error("Lỗi khi gọi Gemini API:", error);
    return null;
  }
}

module.exports = { callGeminiAPI };
