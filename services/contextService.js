const { getDB } = require("../utils/db");
const logger = require("./loggerService");

const CONTEXT_LIMIT = 10;
const CONTEXT_EXPIRE_DAYS = 7;

async function saveContextToDB(userId, prompt, response) {
  const db = getDB();
  const contextCollection = db.collection("chatbot_context");

  const context = {
    userId,
    prompt,
    response,
    timestamp: new Date(),
    expiresAt: new Date(Date.now() + CONTEXT_EXPIRE_DAYS * 24 * 60 * 60 * 1000),
  };

  await contextCollection.insertOne(context);

  const userContexts = await contextCollection
    .find({ userId })
    .sort({ timestamp: -1 })
    .toArray();

  if (userContexts.length > CONTEXT_LIMIT) {
    const oldestContextId = userContexts[CONTEXT_LIMIT]._id;
    await contextCollection.deleteMany({
      userId,
      _id: { $lte: oldestContextId },
    });
  }
}

async function getConversationHistory(userId) {
  const db = getDB();
  const contextCollection = db.collection("chatbot_context");

  return await contextCollection
    .find({
      userId,
      timestamp: {
        $gte: new Date(Date.now() - CONTEXT_EXPIRE_DAYS * 24 * 60 * 60 * 1000),
      },
    })
    .sort({ timestamp: -1 })
    .limit(CONTEXT_LIMIT)
    .toArray();
}

async function setupContextIndex() {
  const db = getDB();
  try {
    await db
      .collection("chatbot_context")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await db
      .collection("chatbot_context")
      .createIndex({ userId: 1, timestamp: -1 });
    console.log("Đã hoàn tất thiết lập chỉ mục ngữ cảnh");
  } catch (error) {
    console.error("Lỗi khi thiết lập chỉ mục ngữ cảnh:", error);
  }
}

async function saveUserPreferences(userId, preferences) {
  const db = getDB();
  const prefsCollection = db.collection("user_preferences");

  try {
    await prefsCollection.updateOne(
      { userId },
      {
        $set: {
          ...preferences,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    logger.info(`Đã cập nhật tùy chọn cho người dùng ${userId}`);
  } catch (error) {
    logger.error(`Lỗi khi lưu tùy chọn cho người dùng ${userId}:`, error);
    throw error;
  }
}

async function calculateContextRelevance(context, currentTime) {
  const timeElapsed = currentTime - context.timestamp;
  const hoursPassed = timeElapsed / (1000 * 60 * 60);

  // Exponential decay formula
  return Math.exp(-hoursPassed / 24); // Half-life of 24 hours
}

async function getRelevantContext(userId, currentPrompt) {
  const db = getDB();
  const contextCollection = db.collection("chatbot_context");
  const now = new Date();

  try {
    const contexts = await contextCollection
      .find({
        userId,
        timestamp: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) },
      })
      .sort({ timestamp: -1 })
      .toArray();

    // Calculate relevance scores and filter
    const relevantContexts = await Promise.all(
      contexts.map(async (context) => ({
        ...context,
        relevance: await calculateContextRelevance(context, now),
      }))
    );

    return relevantContexts
      .filter((ctx) => ctx.relevance > 0.3)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, CONTEXT_LIMIT);
  } catch (error) {
    logger.error(`Lỗi khi lấy ngữ cảnh cho người dùng ${userId}:`, error);
    throw error;
  }
}

async function filterOutdatedContext(contexts) {
  const now = new Date();
  return contexts.filter((context) => {
    const timeElapsed = now - context.timestamp;
    const hoursPassed = timeElapsed / (1000 * 60 * 60);
    return hoursPassed < 24; // Chỉ giữ lại các ngữ cảnh trong vòng 24 giờ
  });
}

module.exports = {
  saveContextToDB,
  getConversationHistory,
  setupContextIndex,
  saveUserPreferences,
  getRelevantContext,
  filterOutdatedContext,
};
