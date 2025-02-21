const { PermissionFlagsBits } = require("discord.js");
const config = require("../config.json");
const { TextProcessor } = require("../utils/textProcessor");

module.exports = {
  name: "speak",
  aliases: ["doc", "s", "d"],
  async execute(message, args, queue, filter, logger) {
    if (!message.member.voice.channel) {
      return message.reply("Bạn cần vào kênh voice trước!");
    }

    const rawText = args.join(" ");
    if (rawText.length > config.maxMessageLength) {
      return message.reply(
        `Tin nhắn quá dài! Tối đa ${config.maxMessageLength} ký tự`
      );
    }

    if (filter.containsBadword(rawText)) {
      return message.reply("Tin nhắn chứa từ cấm!");
    }

    // Truyền cả message object và rawText
    const { speakerName, processedText } = TextProcessor.preprocessMessage(
      message,
      rawText
    );
    const speakText = `${speakerName} ${processedText}`;

    queue.add({
      textToSpeak: speakText,
      voiceChannel: message.member.voice.channel,
      message: message,
    });

    logger.info({
      event: "speak_command",
      user: message.author.tag,
      guild: message.guild.name,
      content: rawText,
    });
  },
};
