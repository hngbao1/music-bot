require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  MessageFlags,
} = require("discord.js");
const { getVoiceConnection } = require("@discordjs/voice");
const fs = require("fs");
const path = require("path");
const { MessageQueue } = require("./messageQueue");
const { BadwordFilter } = require("./badwordFilter");
const { connectToMongoDB } = require("./utils/db");
const logger = require("./services/loggerService");

const config = {
  token: process.env.TOKEN,
  ownerId: process.env.OWNER_ID,
  prefix: process.env.PREFIX || ".",
  maxMessageLength: parseInt(process.env.MAX_MESSAGE_LENGTH) || 200,
};

// Tạo thư mục logs nếu chưa tồn tại
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

// Thêm cấu hình từ .env
const token = process.env.TOKEN || config.token;
const botOwnerId = process.env.BOT_OWNER_ID;
const clientId = process.env.CLIENT_ID;
client.config = { token, botOwnerId };

// Command Collections
const commands = new Map();
const slashCommands = new Map();
const slashCommandsData = [];

// Load commands
const commandFiles = fs
  .readdirSync(path.join(__dirname, "commands"))
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  // Load normal commands
  if (command.name) {
    commands.set(command.name, command);
    if (command.aliases) {
      command.aliases.forEach((alias) => commands.set(alias, command));
    }
  }

  // Load slash commands
  if (command.data) {
    slashCommandsData.push(command.data.toJSON());
    slashCommands.set(command.data.name, command);
  }
}

// Register slash commands
const rest = new REST({ version: "10" }).setToken(config.token);
(async () => {
  try {
    logger.info("Đang đăng ký các lệnh slash...");
    await rest.put(Routes.applicationCommands(clientId), {
      body: slashCommandsData,
    });
    logger.info("Đã đăng ký các lệnh slash thành công!");
  } catch (error) {
    logger.error("Lỗi khi đăng ký các lệnh slash:", error);
  }
})();

const queues = new Map();
const filter = new BadwordFilter();

client.on("ready", () => {
  logger.info(`Bot đã sẵn sàng với tên ${client.user.tag}`);
});

// Add interaction handler
client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isCommand()) {
      const command = slashCommands.get(interaction.commandName);
      if (command) {
        await command.execute(interaction);
      }
    } else if (interaction.isButton()) {
      const customId = interaction.customId;
      logger.debug(`Button interaction received: ${customId}`);

      if (customId.startsWith("feedback_")) {
        const chatbotCommand = slashCommands.get("chatbot-on");
        if (chatbotCommand && chatbotCommand.handleInteraction) {
          await chatbotCommand.handleInteraction(interaction);
        }
      }
    }
  } catch (error) {
    logger.error("Lỗi xử lý tương tác:", error);
    try {
      await interaction.reply({
        content: "Đã xảy ra lỗi khi thực hiện lệnh!",
        flags: MessageFlags.Ephemeral,
      });
    } catch (e) {
      logger.error("Lỗi khi gửi thông báo lỗi:", e);
    }
  }
});

// Add chatbot message handler
client.on("messageCreate", async (message) => {
  // Handle existing message commands
  if (message.content.startsWith(config.prefix) && !message.author.bot) {
    const args = message.content.slice(config.prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Handle subcommands for badword
    if (commandName === "addbadword") {
      commands.get("badword").subcommands.add(message, args, filter);
      return;
    }
    if (commandName === "removebadword") {
      commands.get("badword").subcommands.remove(message, args, filter);
      return;
    }
    if (commandName === "listbadwords") {
      commands.get("badword").subcommands.list(message, args, filter);
      return;
    }

    const command = commands.get(commandName);
    if (!command) return;

    if (!queues.has(message.guild.id)) {
      queues.set(message.guild.id, new MessageQueue());
    }
    const queue = queues.get(message.guild.id);

    try {
      await command.execute(message, args, queue, filter, logger);
    } catch (error) {
      logger.error({
        event: "command_error",
        command: commandName,
        error: error.message,
        stack: error.stack,
      });
      message.reply("Có lỗi xảy ra khi thực hiện lệnh!");
    }
  }

  // Handle chatbot
  require("./commands/chatbot").handleMessage(message, client);
});

client.on("voiceStateUpdate", (oldState, newState) => {
  const connection = getVoiceConnection(oldState.guild.id);
  if (!connection) return;

  const channel = connection.joinConfig.channelId;
  const voiceChannel = oldState.guild.channels.cache.get(channel);

  if (voiceChannel && voiceChannel.members.size === 1) {
    // Nếu chỉ còn mỗi bot trong kênh
    if (voiceChannel.members.first().id === client.user.id) {
      connection.destroy();
      logger.info(
        `Bot tự động rời kênh ${voiceChannel.name} do không còn ai trong kênh`
      );
    }
  }
});

// Connect MongoDB and start bot
connectToMongoDB()
  .then(async () => {
    const chatbot = require("./commands/chatbot");
    await chatbot.setupContextIndex();
    await client.login(config.token);
    logger.info("Đã kết nối thành công với MongoDB và khởi động bot");
  })
  .catch((error) => {
    logger.error("Lỗi kết nối MongoDB:", error);
  });

// Xử lý thoát graceful
process.on("SIGINT", () => {
  logger.info("Đang tắt bot...");
  client.destroy();
  process.exit(0);
});
