const { PermissionFlagsBits } = require("discord.js");
const { getVoiceConnection } = require("@discordjs/voice");
const logger = require("../services/loggerService");

module.exports = {
  name: "leave",
  aliases: ["l", "quit"],
  execute(message, args, queue) {
    if (
      !message.member.permissions.has([
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.MoveMembers,
      ])
    ) {
      logger.warn(
        `Người dùng ${message.author.tag} cố gắng sử dụng lệnh leave khi không có quyền`
      );
      return message.reply("Bạn không có quyền sử dụng lệnh này!");
    }

    const connection = getVoiceConnection(message.guild.id);
    if (connection) {
      connection.destroy();
      queue.clear();
      logger.info(
        `Bot đã rời kênh voice trong ${message.guild.name} theo yêu cầu của ${message.author.tag}`
      );
      message.reply("Đã rời kênh voice!");
    } else {
      logger.debug(
        `Lệnh leave được sử dụng nhưng bot không ở trong kênh voice bởi ${message.author.tag}`
      );
      message.reply("Bot không ở trong kênh voice nào!");
    }
  },
};
