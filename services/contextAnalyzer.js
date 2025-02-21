const { processNLP } = require("./nlpService");

class ContextAnalyzer {
  constructor() {
    this.contextualKeywords = {
      time: {
        keywords: ["hôm nay", "ngày mấy", "giờ mấy", "mấy giờ"],
        contexts: {
          query: ["khi", "lúc", "thời điểm", "thời gian"],
          about: ["nói về", "kể về", "về việc", "về vấn đề"],
          history: ["đã xảy ra", "đã diễn ra", "trong quá khứ"],
        },
      },
    };
  }

  async analyzeIntent(text, previousContext = []) {
    try {
      if (!text || typeof text !== "string") {
        return {
          nlpResult: { intent: "Không xác định", score: 0 },
          mainTopic: "không xác định",
          contextualIntent: null,
          trueIntent: "không xác định",
          confidence: 0,
        };
      }

      // Phân tích NLP cơ bản
      const nlpResult = await processNLP(text);

      // Xác định chủ đề chính
      const mainTopic = this.extractMainTopic(text);

      // Phân tích ngữ cảnh từ lịch sử
      const contextualIntent = this.analyzeContextFromHistory(
        text,
        previousContext
      );

      // Xác định mục đích thực sự của câu hỏi
      const trueIntent = this.determineTrueIntent(
        text,
        mainTopic,
        contextualIntent
      );

      return {
        nlpResult,
        mainTopic,
        contextualIntent,
        trueIntent,
        confidence: this.calculateConfidence(
          nlpResult,
          mainTopic,
          contextualIntent
        ),
      };
    } catch (error) {
      logger.error("Lỗi khi phân tích ý định:", error);
      return {
        nlpResult: { intent: "Không xác định", score: 0 },
        mainTopic: "không xác định",
        contextualIntent: null,
        trueIntent: "không xác định",
        confidence: 0,
      };
    }
  }

  extractMainTopic(text) {
    let mainTopic = "unknown";
    const topics = {
      time: (text) => this.hasTimeContext(text),
      general: (text) => true, // Fallback topic
    };

    for (const [topic, checker] of Object.entries(topics)) {
      if (checker(text)) {
        mainTopic = topic;
        break;
      }
    }

    return mainTopic;
  }

  hasTimeContext(text) {
    const timeKeywords = this.contextualKeywords.time.keywords;
    const timeContexts = Object.values(
      this.contextualKeywords.time.contexts
    ).flat();

    const hasTimeKeyword = timeKeywords.some((keyword) =>
      text.includes(keyword)
    );
    const hasTimeContext = timeContexts.some((context) =>
      text.includes(context)
    );

    // Chỉ trả về true nếu có từ khóa thời gian VÀ ngữ cảnh thời gian
    return hasTimeKeyword && hasTimeContext;
  }

  analyzeContextFromHistory(text, previousContext) {
    if (!previousContext.length) return null;

    // Phân tích chủ đề từ các tin nhắn trước
    const previousTopics = previousContext.map((ctx) =>
      this.extractMainTopic(ctx.prompt)
    );

    // Nếu chủ đề trước đó nhất quán, giữ nguyên chủ đề
    const mostCommonTopic = this.getMostCommonTopic(previousTopics);
    return mostCommonTopic;
  }

  determineTrueIntent(text, mainTopic, contextualIntent) {
    // Ưu tiên theo thứ tự:
    // 1. Ngữ cảnh từ lịch sử nếu có độ tin cậy cao
    // 2. Chủ đề chính được phát hiện từ câu hiện tại
    // 3. Fallback về general nếu không đủ tin cậy

    if (contextualIntent && this.isContextRelevant(text, contextualIntent)) {
      return contextualIntent;
    }

    return mainTopic;
  }

  calculateConfidence(nlpResult, mainTopic, contextualIntent) {
    let confidence = 0;

    // Tính điểm dựa trên kết quả NLP
    if (nlpResult && nlpResult.score > 0.5) {
      confidence += nlpResult.score * 0.4;
    }

    // Tính điểm dựa trên chủ đề chính
    if (mainTopic !== "unknown") {
      confidence += 0.3;
    }

    // Tính điểm dựa trên ngữ cảnh
    if (contextualIntent) {
      confidence += 0.3;
    }

    return confidence;
  }

  getMostCommonTopic(topics) {
    const topicCount = topics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(topicCount).sort(([, a], [, b]) => b - a)[0][0];
  }

  isContextRelevant(text, context) {
    // Kiểm tra xem ngữ cảnh có còn phù hợp với câu hiện tại không
    const contextKeywords = this.contextualKeywords[context]?.keywords || [];
    const contextPhrases = this.contextualKeywords[context]?.contexts || {};

    const hasKeyword = contextKeywords.some((keyword) =>
      text.includes(keyword)
    );
    const hasContext = Object.values(contextPhrases)
      .flat()
      .some((phrase) => text.includes(phrase));

    return hasKeyword || hasContext;
  }
}

module.exports = new ContextAnalyzer();
