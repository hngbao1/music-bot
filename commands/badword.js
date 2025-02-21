const config = require("../config.json");
const logger = require("../services/loggerService");

module.exports = {
  name: "badword",
  subcommands: {
    add: async (message, args, filter) => {
      if (message.author.id !== process.env.OWNER_ID) {
        logger.warn(
          `Người dùng ${message.author.tag} cố gắng thêm từ cấm khi không có quyền`
        );
        return;
      }
      const word = args[0];
      if (!word) return message.reply("Vui lòng nhập từ cần cấm!");

      if (filter.addBadword(word)) {
        message.reply(`Đã thêm "${word}" vào danh sách từ cấm`);
        logger.info(`Đã thêm từ cấm "${word}" bởi ${message.author.tag}`);
      } else {
        message.reply("Từ này đã có trong danh sách!");
      }
    },

    remove: async (message, args, filter) => {
      if (message.author.id !== process.env.OWNER_ID) {
        logger.warn(
          `Người dùng ${message.author.tag} cố gắng xóa từ cấm khi không có quyền`
        );
        return;
      }
      const word = args[0];
      if (!word) return message.reply("Vui lòng nhập từ cần xóa!");

      if (filter.removeBadword(word)) {
        message.reply(`Đã xóa "${word}" khỏi danh sách từ cấm`);
        logger.info(`Đã xóa từ cấm "${word}" bởi ${message.author.tag}`);
      } else {
        message.reply("Không tìm thấy từ này trong danh sách!");
      }
    },

    list: async (message, args, filter) => {
      if (message.author.id !== process.env.OWNER_ID) {
        logger.warn(
          `Người dùng ${message.author.tag} cố gắng xem danh sách từ cấm khi không có quyền`
        );
        return;
      }
      const words = filter.getBadwords();
      message.reply(`Danh sách từ cấm:\n${words.join(", ")}`);
      logger.debug(`Đã hiển thị danh sách từ cấm cho ${message.author.tag}`);
    },
  },
};
