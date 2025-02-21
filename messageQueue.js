const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
} = require("@discordjs/voice");
const gTTS = require("gtts");
const fs = require("fs");
const path = require("path");
const winston = require("winston");

class MessageQueue {
  constructor() {
    // Tạo thư mục temp nếu chưa tồn tại
    const tempDir = path.join(__dirname, "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Cấu hình logger riêng cho MessageQueue
    this.logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({
          filename: path.join(__dirname, "logs", "queue-error.log"),
          level: "error",
        }),
        new winston.transports.File({
          filename: path.join(__dirname, "logs", "queue.log"),
        }),
      ],
    });

    this.queue = [];
    this.isPlaying = false;
    this.player = createAudioPlayer();
    this.connection = null;
  }

  add(item) {
    this.queue.push(item);
    if (!this.isPlaying) {
      this.processQueue();
    }
  }

  clear() {
    this.queue = [];
    if (this.player) {
      this.player.stop();
    }
    this.isPlaying = false;
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const item = this.queue[0];
    let filename = null;

    try {
      const gtts = new gTTS(item.textToSpeak, "vi");
      filename = path.join(__dirname, "temp", `${Date.now()}.mp3`);

      await new Promise((resolve, reject) => {
        gtts.save(filename, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      this.connection = joinVoiceChannel({
        channelId: item.voiceChannel.id,
        guildId: item.voiceChannel.guild.id,
        adapterCreator: item.voiceChannel.guild.voiceAdapterCreator,
      });

      const resource = createAudioResource(filename);
      this.connection.subscribe(this.player);
      this.player.play(resource);

      this.logger.info({
        event: "process_message",
        text: item.textToSpeak,
        guild: item.voiceChannel.guild.name,
      });

      // Sửa lại event handler để đảm bảo file tồn tại trước khi xóa
      this.player.on("stateChange", (oldState, newState) => {
        if (newState.status === "idle") {
          this.queue.shift();
          if (filename && fs.existsSync(filename)) {
            fs.unlink(filename, (err) => {
              if (err)
                this.logger.error({
                  event: "file_delete_error",
                  error: err.message,
                  file: filename,
                });
            });
          }
          this.processQueue();
        }
      });
    } catch (error) {
      this.logger.error({
        event: "message_processing_error",
        error: error.message,
        stack: error.stack,
      });

      // Đảm bảo xóa file nếu có lỗi xảy ra
      if (filename && fs.existsSync(filename)) {
        try {
          fs.unlinkSync(filename);
        } catch (unlinkError) {
          this.logger.error({
            event: "file_delete_error",
            error: unlinkError.message,
            file: filename,
          });
        }
      }

      this.queue.shift();
      this.processQueue();
    }
  }
}

module.exports = { MessageQueue };
