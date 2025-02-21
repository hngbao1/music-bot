const { NlpManager } = require("node-nlp");
const { trainManager } = require("../trainingData");
const logger = require("./loggerService");

const manager = new NlpManager({
  languages: ["vi"], // Chỉ sử dụng tiếng Việt
  forceNER: true,
  nlu: { log: false }, // Tắt log của NLU
  fullSearchWhenGuessed: true, // Tìm kiếm đầy đủ khi đoán
  autoSave: false, // Không tự động lưu
  threshold: 0.5, // Ngưỡng nhận dạng ý định
});

let isInitialized = false;

async function initializeManager() {
  try {
    if (!isInitialized) {
      await trainManager(manager);
      await manager.train();
      isInitialized = true;
      logger.info("NLP Manager đã được khởi tạo thành công!");
    }
  } catch (error) {
    logger.error("Lỗi khi khởi tạo NLP Manager:", error);
    throw error;
  }
}

async function processNLP(text) {
  try {
    if (!isInitialized) {
      await initializeManager();
    }

    if (!text || typeof text !== "string") {
      throw new Error("Input text is invalid");
    }

    // Tiền xử lý văn bản
    const processedText = text.trim().toLowerCase();
    if (!processedText) {
      return { intent: "None", score: 0 };
    }

    const result = await manager.process("vi", processedText);
    return {
      intent: result.intent || "None",
      score: result.score || 0,
      entities: result.entities || [],
      sentiment: result.sentiment || {},
    };
  } catch (error) {
    logger.error("Lỗi khi xử lý NLP:", error);
    return { intent: "None", score: 0 };
  }
}

module.exports = {
  initializeManager,
  processNLP,
};
