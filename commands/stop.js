const { PermissionFlagsBits } = require("discord.js");
const logger = require("../services/loggerService");

module.exports = {
  name: "stop",
  execute(message, args, queue) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      logger.warn(
        `User ${message.author.tag} tried to use stop command without permission`
      );
      return message.reply("Bạn không có quyền sử dụng lệnh này!");
    }
    queue.clear();
    logger.info(
      `Queue cleared in ${message.guild.name} by ${message.author.tag}`
    );
    message.reply("Đã dừng phát và xóa hàng đợi!");
  },
};
