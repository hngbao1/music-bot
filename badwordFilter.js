const fs = require("fs");
const path = require("path");

class BadwordFilter {
  constructor() {
    this.badwordsFile = path.join(__dirname, "data", "badwords.json");
    this.badwords = this.loadBadwords();
  }

  loadBadwords() {
    try {
      if (!fs.existsSync(this.badwordsFile)) {
        fs.writeFileSync(this.badwordsFile, "[]");
        return [];
      }
      const data = fs.readFileSync(this.badwordsFile, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Lỗi khi đọc file từ cấm:", error);
      return [];
    }
  }

  saveBadwords() {
    try {
      fs.writeFileSync(
        this.badwordsFile,
        JSON.stringify(this.badwords, null, 2)
      );
    } catch (error) {
      console.error("Lỗi khi lưu file từ cấm:", error);
    }
  }

  addBadword(word) {
    if (!this.badwords.includes(word)) {
      this.badwords.push(word);
      this.saveBadwords();
      return true;
    }
    return false;
  }

  removeBadword(word) {
    const index = this.badwords.indexOf(word);
    if (index > -1) {
      this.badwords.splice(index, 1);
      this.saveBadwords();
      return true;
    }
    return false;
  }

  containsBadword(text) {
    const normalizedText = this.normalizeText(text);
    return this.badwords.some((word) => {
      // Tạo pattern cho từ cấm, hỗ trợ:
      // - Khoảng trắng và ký tự đặc biệt ở giữa
      // - Các ký tự thay thế phổ biến (0 thay o, @ thay a)
      const pattern = word
        .split("")
        .map((char) => {
          switch (char.toLowerCase()) {
            case "a":
              return "[a@4]";
            case "e":
              return "[e3]";
            case "i":
              return "[i1!]";
            case "o":
              return "[o0]";
            case "s":
              return "[s$5]";
            default:
              return char;
          }
        })
        .join("[\\s\\W]*"); // Cho phép khoảng trắng/ký tự đặc biệt giữa các ký tự

      const regex = new RegExp(pattern, "gi");
      return regex.test(normalizedText);
    });
  }

  normalizeText(text) {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Bỏ dấu tiếng Việt
      .toLowerCase();
  }

  getBadwords() {
    return [...this.badwords];
  }
}

module.exports = { BadwordFilter };
