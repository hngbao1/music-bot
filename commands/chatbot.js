const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { getDB } = require("../utils/db");
const { processNLP } = require("../services/nlpService");
const { callGeminiAPI } = require("../services/geminiService");
const {
  saveContextToDB,
  getConversationHistory,
  filterOutdatedContext,
} = require("../services/contextService");
const { sendSafeMessage } = require("../services/messageService");
const contextAnalyzer = require("../services/contextAnalyzer");
const {
  createFeedbackButtons,
  handleFeedbackButton,
} = require("../services/uiService");
const logger = require("../services/loggerService");

// Cấu hình dayjs với plugins
const dayjs = require("dayjs");
const utcPlugin = require("dayjs/plugin/utc");
const timezonePlugin = require("dayjs/plugin/timezone");

dayjs.extend(utcPlugin);
dayjs.extend(timezonePlugin);

// Các hàm tiện ích
function getCurrentTimeInVietnam() {
  return dayjs().tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm:ss");
}

function addFriendlyTouch(sentence) {
  const friendlyPhrases = ["💖"];
  return `${sentence} ${
    friendlyPhrases[Math.floor(Math.random() * friendlyPhrases.length)]
  }`;
}

async function handleMessageResponse(
  message,
  response,
  userId,
  prompt,
  client
) {
  try {
    const buttons = createFeedbackButtons();

    const botMessage = await sendSafeMessage(message, response, {
      allowedMentions: { repliedUser: false },
      components: [buttons],
    });

    if (botMessage) {
      const db = getDB();
      const answersCollection = db.collection("chatbot_answers");
      const now = new Date();

      await answersCollection.updateOne(
        { messageId: botMessage.id },
        {
          $set: {
            question: prompt.toLowerCase(),
            answer: response,
            lastUsed: now,
            feedback: { like: 0, dislike: 0, improve: 0, users: {} },
          },
        },
        { upsert: true }
      );

      await saveContextToDB(userId, prompt, response);

      // Xóa các nút sau 5 phút
      setTimeout(() => {
        botMessage
          .edit({ components: [] })
          .catch((err) => logger.error("Không thể xóa các nút:", err));
      }, 5 * 60 * 1000);
    }

    return botMessage;
  } catch (error) {
    logger.error("Lỗi trong handleMessageResponse:", error);
    throw error;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("chatbot-on")
    .setDescription("Kích hoạt chatbot cho kênh hiện tại.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({
        content: "Bạn không có quyền sử dụng lệnh này.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const db = getDB();
    const collection = db.collection("chatbot_channels");
    const channelId = interaction.channel.id;

    try {
      const existingChannel = await collection.findOne({ channelId });
      if (existingChannel) {
        return await interaction.reply({
          content: "Chatbot đã được kích hoạt trong kênh này.",
          flags: MessageFlags.Ephemeral,
        });
      }

      await collection.insertOne({ channelId, activatedAt: new Date() });
      await interaction.reply({
        content: "Chatbot đã được kích hoạt cho kênh này!",
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Lỗi khi kích hoạt chatbot:", error);
      await interaction.reply({
        content: "Đã xảy ra lỗi khi kích hoạt chatbot.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },

  async handleMessage(message, client) {
    if (message.author.bot) return;

    try {
      const db = getDB();
      const collection = db.collection("chatbot_channels");
      const channelId = message.channel.id;

      // Kiểm tra mentions và kênh
      if (!message.mentions.has(client.user.id)) return;
      if (!(await collection.findOne({ channelId }))) return;

      const prompt = message.content
        .replace(new RegExp(`<@!?${client.user.id}>`, "g"), "")
        .trim();

      if (!prompt) return;
      await message.channel.sendTyping();

      try {
        // Phân tích ngữ cảnh
        const conversationHistory = await getConversationHistory(
          message.author.id
        );
        const filteredHistory = await filterOutdatedContext(
          conversationHistory
        );
        const contextAnalysis = await contextAnalyzer.analyzeIntent(
          prompt,
          filteredHistory
        );

        // Log kết quả phân tích để debug
        logger.debug("Kết quả phân tích ngữ cảnh:", contextAnalysis);

        // Xử lý dựa trên phân tích ngữ cảnh
        if (
          contextAnalysis.trueIntent === "time" &&
          contextAnalysis.confidence > 0.7
        ) {
          const response = `Bây giờ là ${getCurrentTimeInVietnam()}.`;
          await handleMessageResponse(
            message,
            response,
            message.author.id,
            prompt,
            client
          );
          return;
        }

        // Tạo prompt nâng cao với ngữ cảnh
        const enhancedPrompt = `
Phân tích ngữ cảnh:
- Chủ đề chính: ${contextAnalysis.mainTopic}
- Ý định thực sự: ${contextAnalysis.trueIntent}
- Độ tin cậy: ${contextAnalysis.confidence}

Ngữ cảnh trước đó:
${filteredHistory
  .map((ctx) => `Người dùng: ${ctx.prompt}\nBot: ${ctx.response}`)
  .join("\n")}

Câu hỏi hiện tại: ${prompt}

Vui lòng cung cấp câu trả lời dựa trên ý định thực sự và ngữ cảnh của cuộc trò chuyện.`;

        // Gọi Gemini API với prompt đã được cải thiện
        const botResponse = await callGeminiAPI(enhancedPrompt);
        if (botResponse) {
          const response = addFriendlyTouch(botResponse);
          await handleMessageResponse(
            message,
            response,
            message.author.id,
            prompt,
            client
          );
        }
      } catch (error) {
        logger.error("Lỗi trong phân tích ngữ cảnh:", error);
        throw error;
      }
    } catch (error) {
      logger.error("Lỗi khi xử lý tin nhắn:", error);
      await sendSafeMessage(message, "Đã xảy ra lỗi, vui lòng thử lại sau.", {
        allowedMentions: { repliedUser: false },
      });
    }
  },

  async handleInteraction(interaction) {
    if (!interaction.isButton()) return;

    try {
      const feedbackTypes = {
        feedback_like: "like",
        feedback_dislike: "dislike",
        feedback_improve: "improve",
      };

      const feedbackType = feedbackTypes[interaction.customId];
      if (feedbackType) {
        logger.debug(`Xử lý phản hồi: ${feedbackType}`);
        await handleFeedbackButton(interaction, feedbackType);
        await interaction.reply({
          content: "Cảm ơn bạn đã phản hồi!",
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error) {
      logger.error("Lỗi trong handleInteraction:", error);
      if (!interaction.replied) {
        await interaction.reply({
          content: "Đã xảy ra lỗi khi xử lý phản hồi.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },

  setupContextIndex: async function () {
    const db = getDB();
    try {
      await db
        .collection("chatbot_context")
        .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      await db
        .collection("chatbot_context")
        .createIndex({ userId: 1, timestamp: -1 });
      logger.info("Thiết lập chỉ mục ngữ cảnh hoàn tất");
    } catch (error) {
      logger.error("Lỗi khi thiết lập chỉ mục ngữ cảnh:", error);
    }
  },
};
