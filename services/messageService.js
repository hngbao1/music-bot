function splitMessage(message, maxLength = 1900) {
  const chunks = [];
  let current = "";
  const lines = message.split("\n");

  for (const line of lines) {
    if (current.length + line.length + 1 > maxLength) {
      chunks.push(current);
      current = line;
    } else {
      current = current ? `${current}\n${line}` : line;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

async function sendSafeMessage(message, content, options = {}) {
  try {
    if (content.length <= 2000) {
      return await message.reply({
        content,
        ...options,
      });
    }

    const chunks = splitMessage(content);
    let firstMessage = null;

    for (let i = 0; i < chunks.length; i++) {
      if (i === 0) {
        firstMessage = await message.reply({
          content: chunks[i],
          ...options,
        });
      } else {
        await message.channel.send({
          content: chunks[i],
          ...options,
        });
      }
    }

    return firstMessage;
  } catch (error) {
    console.error("Lỗi khi gửi tin nhắn:", error);
    return null;
  }
}

module.exports = {
  splitMessage,
  sendSafeMessage,
};
