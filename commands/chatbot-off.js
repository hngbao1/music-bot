const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const { getDB } = require("../utils/db");
const logger = require("../services/loggerService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("chatbot-off")
    .setDescription("Tắt chatbot cho kênh hiện tại.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      logger.warn(
        `Người dùng ${interaction.user.tag} cố gắng tắt chatbot khi không có quyền`
      );
      await interaction.reply({
        content:
          "Bạn không có quyền sử dụng lệnh này. Chỉ quản lý guild mới có thể tắt chatbot.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const db = getDB();
    const collection = db.collection("chatbot_channels");
    const channelId = interaction.channel.id;

    try {
      const existingChannel = await collection.findOne({ channelId });
      if (!existingChannel) {
        await interaction.reply({
          content: "Chatbot chưa được kích hoạt trong kênh này.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await collection.deleteOne({ channelId });
      await interaction.reply({
        content: "Chatbot đã được tắt cho kênh này!",
        flags: MessageFlags.Ephemeral,
      });
      logger.info(
        `Đã tắt chatbot trong kênh ${interaction.channel.name} bởi ${interaction.user.tag}`
      );
    } catch (error) {
      logger.error("Lỗi khi tắt chatbot:", error);
      console.error("Lỗi khi tắt chatbot:", error);
      await interaction.reply({
        content:
          "Đã xảy ra lỗi khi tắt chatbot trong kênh này.\nVui Lòng Dùng Lệnh `/report` để báo Lỗi",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
