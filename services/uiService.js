const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const logger = require("./loggerService");
const { getDB } = require("../utils/db");
const { callGeminiAPI } = require("./geminiService");

function createFeedbackButtons() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("feedback_like")
      .setLabel("👍 Hữu ích")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("feedback_dislike")
      .setLabel("👎 Chưa tốt")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("feedback_improve")
      .setLabel("🔄 Cải thiện")
      .setStyle(ButtonStyle.Primary)
  );

  return row;
}

async function safeReply(interaction, message, options = {}) {
  options.flags = MessageFlags.Ephemeral;
  try {
    const replyContent =
      typeof message === "string" ? { content: message } : message;

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ ...replyContent, ...options });
    } else {
      await interaction.reply({ ...replyContent, ...options });
      interaction.replied = true;
    }
  } catch (error) {
    console.error("Error in safeReply:", error);
  }
}

async function handleFeedbackButton(interaction, feedbackType) {
  const db = getDB();
  const answersCollection = db.collection("chatbot_answers");

  try {
    if (!interaction.isButton()) {
      await safeReply(interaction, "Nút này không hợp lệ hoặc đã hết hạn.");
      return;
    }

    const messageId = interaction.message.id;
    const userId = interaction.user.id;
    const originalMessage = interaction.message;

    if (feedbackType === "improve") {
      await interaction.deferReply({ ephemeral: true });

      const messageData = await answersCollection.findOne({ messageId });
      if (!messageData) {
        throw new Error("Không tìm thấy dữ liệu tin nhắn");
      }

      const improvedResponse = await callGeminiAPI(
        messageData.question,
        messageData.answer
      );

      if (improvedResponse) {
        const newMessage = await interaction.followUp({
          content: `${improvedResponse}\n\n_(Đã được cải thiện theo yêu cầu của <@${userId}>)_`,
          components: [createFeedbackButtons()],
        });

        await answersCollection.insertOne({
          messageId: newMessage.id,
          question: messageData.question,
          answer: improvedResponse,
          lastImproved: new Date(),
          feedback: { like: 0, dislike: 0, improve: 0, users: {} },
          improvements: [
            {
              userId,
              timestamp: new Date(),
              previousAnswer: messageData.answer,
            },
          ],
        });
      }
    } else {
      await answersCollection.updateOne(
        { messageId },
        {
          $inc: { [`feedback.${feedbackType}`]: 1 },
          $addToSet: { [`feedback.users.${feedbackType}`]: userId },
        }
      );

      const messageData = await answersCollection.findOne({ messageId });
      if (messageData.feedback.dislike >= 5) {
        await answersCollection.deleteOne({ messageId });
        await originalMessage.delete();
        await safeReply(
          interaction,
          "Câu trả lời này đã bị xóa do nhận quá nhiều phản hồi tiêu cực."
        );
        return;
      }

      const updatedButtons = originalMessage.components[0].components.map(
        (button) => {
          const newButton = ButtonBuilder.from(button);
          // Disable both like and dislike buttons when either is clicked
          if (
            button.customId === "feedback_like" ||
            button.customId === "feedback_dislike"
          ) {
            newButton.setDisabled(true);
          }
          return newButton;
        }
      );

      await originalMessage.edit({
        components: [new ActionRowBuilder().addComponents(updatedButtons)],
      });

      await safeReply(interaction, "Cảm ơn phản hồi của bạn!");
    }

    // Xóa tất cả các nút sau 5 phút
    setTimeout(() => {
      originalMessage
        .edit({ components: [] })
        .catch((err) => logger.error("Failed to remove buttons:", err));
    }, 5 * 60 * 1000);
  } catch (error) {
    logger.error("Error handling feedback button:", error);

    if (!interaction.replied && !interaction.deferred) {
      await safeReply(interaction, "Đã xảy ra lỗi khi xử lý phản hồi.");
    }
  }
}

module.exports = {
  createFeedbackButtons,
  handleFeedbackButton,
  safeReply,
};
