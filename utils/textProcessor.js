const emojiRegex = require("emoji-regex");
const urlRegex = require("url-regex-safe");

class TextProcessor {
  static processEmoticons(text) {
    // Xử lý các emoticon theo kiểu Google Assistant
    const complexEmoticons = {
      // Các emoticon đặc biệt
      ":v": "mặt cười há miệng",
      ":V": "mặt cười há miệng",
      ":3": "mặt mèo",
      ">:<": "mặt tức giận",
      uwu: "mặt đáng yêu",
      owo: "mặt ngạc nhiên",
      "<3": "hình trái tim",
      "</3": "hình trái tim tan vỡ",
      ":p": "mặt lè lưỡi",
      ":P": "mặt lè lưỡi",
      T_T: "mặt khóc",
      "T.T": "mặt khóc",
      ";-;": "mặt buồn",
      "-.-": "mặt chán",
      "-_-": "mặt chán",
    };

    // Thay thế emoticon đặc biệt
    Object.entries(complexEmoticons).forEach(([emoticon, meaning]) => {
      const escapedEmoticon = emoticon.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedEmoticon, "g");
      text = text.replace(regex, meaning);
    });

    // Xử lý mặt cười/buồn
    const patterns = [
      {
        regex: /[:=]\){5,}/g,
        replacement: "mặt cười lớn",
      },
      {
        regex: /[:=]\){3,4}/g,
        replacement: "mặt cười hài",
      },
      {
        regex: /[:=]\){1,2}/g,
        replacement: "mặt cười",
      },
      {
        regex: /[:=]\({4,}/g,
        replacement: "mặt rất buồn",
      },
      {
        regex: /[:=]\({2,3}/g,
        replacement: "mặt buồn",
      },
      {
        regex: /[:=]\(/g,
        replacement: "mặt buồn",
      },
    ];

    // Áp dụng các pattern
    patterns.forEach(({ regex, replacement }) => {
      text = text.replace(regex, replacement);
    });

    return text;
  }

  static cleanText(text) {
    // Xử lý emoticon trước
    text = this.processEmoticons(text);

    // Xóa custom emoji Discord (format <:name:id>)
    text = text.replace(/<a?:\w+:\d+>/g, "");

    // Thay thế emoji Unicode theo kiểu Google Assistant
    const emojiRx = emojiRegex();
    text = text.replace(emojiRx, (match) => {
      const emojiMap = {
        "👍": "hình ngón tay cái",
        "❤️": "hình trái tim",
        "😊": "mặt cười",
        "😂": "mặt cười ra nước mắt",
        "😢": "mặt khóc",
        "😭": "mặt khóc lớn",
        "😍": "mặt cười với mắt hình trái tim",
        "🥰": "mặt cười với ba trái tim",
        "😎": "mặt cười đeo kính râm",
        "🤔": "mặt đang suy nghĩ",
        // Thêm các emoji khác nếu cần
      };
      return emojiMap[match] || "";
    });

    // Xử lý URL - có thể đọc tên miền hoặc bỏ qua
    text = text.replace(urlRegex(), (url) => {
      try {
        const domain = new URL(url).hostname;
        return `liên kết ${domain}`;
      } catch {
        return "liên kết";
      }
    });

    // Xử lý các ký tự đặc biệt
    text = text
      .replace(/\*\*(.*?)\*\*/g, "$1") // Bold markup
      .replace(/\*(.*?)\*/g, "$1") // Italic markup
      .replace(/~~(.*?)~~/g, "$1") // Strikethrough
      .replace(/`(.*?)`/g, "$1") // Code markup
      .replace(/\n/g, ". ") // Newlines
      .replace(/\s+/g, " ") // Multiple spaces
      .trim();

    // Sửa một số lỗi chính tả phổ biến
    const spellingFixes = {
      ko: "không",
      chs: "chơi",
      k: "không",
      kh: "không",
      dc: "được",
      đc: "được",
      dk: "được",
      dky: "đăng ký",
      cs: "có",
      ng: "người",
      m: "mày",
      t: "tao",
      r: "rồi",
      chx: "chưa",
      ntn: "như thế nào",
      clg: "cái lông gì",
      vs: "với",
      cx: "cũng",
      // Thêm các từ viết tắt khác
    };

    // Áp dụng sửa lỗi chính tả
    text = text
      .split(" ")
      .map((word) => {
        return spellingFixes[word.toLowerCase()] || word;
      })
      .join(" ");

    return text;
  }

  static preprocessMessage(message, rawText) {
    // Sử dụng trực tiếp rawText đã được xử lý từ args
    let text = this.cleanText(rawText || "");

    // Tối ưu chuỗi cảm xúc lặp lại
    text = text.replace(/\*([^*]+)\*\s*\*\1\*/g, "*$1*");

    const displayName = message.member.displayName;

    // Xử lý mentions như cũ
    message.mentions.users.forEach((user) => {
      const member = message.guild.members.cache.get(user.id);
      const mentionRegex = new RegExp(`<@!?${user.id}>`, "g");
      text = text.replace(mentionRegex, member?.displayName || user.username);
    });

    message.mentions.roles.forEach((role) => {
      const roleRegex = new RegExp(`<@&${role.id}>`, "g");
      text = text.replace(roleRegex, `vai trò ${role.name}`);
    });

    message.mentions.channels.forEach((channel) => {
      const channelRegex = new RegExp(`<#${channel.id}>`, "g");
      text = text.replace(channelRegex, `kênh ${channel.name}`);
    });

    return {
      speakerName: displayName,
      processedText: text,
    };
  }
}

module.exports = { TextProcessor };
