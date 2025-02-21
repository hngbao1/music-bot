async function trainManager(manager) {
  // **Lời chào và cảm xúc**
  manager.addDocument("vi", "xin chào", "greetings.hello");
  manager.addDocument("vi", "bạn khỏe không", "greetings.howareyou");
  manager.addDocument("vi", "chào buổi sáng", "greetings.goodmorning");
  manager.addDocument("vi", "chào buổi tối", "greetings.goodevening");

  manager.addAnswer(
    "vi",
    "greetings.hello",
    "Xin chào! Tôi là Mei. Bạn cần gì nào?"
  );
  manager.addAnswer(
    "vi",
    "greetings.hello",
    "Chào bạn! Tôi là Mei, có thể giúp gì cho bạn?"
  );
  manager.addAnswer(
    "vi",
    "greetings.howareyou",
    "Tôi ổn, cảm ơn bạn! Còn bạn thì sao?"
  );
  manager.addAnswer(
    "vi",
    "greetings.goodmorning",
    "Chào buổi sáng! Chúc bạn một ngày tốt lành!"
  );
  manager.addAnswer(
    "vi",
    "greetings.goodevening",
    "Chào buổi tối! Hy vọng bạn có một buổi tối thư giãn!"
  );

  // **Câu hỏi về tên và thông tin cá nhân**
  manager.addDocument("vi", "bạn tên gì", "bot.name");
  manager.addDocument("vi", "tên của bạn là gì", "bot.name");
  manager.addDocument("vi", "bot tên gì", "bot.name");
  manager.addDocument("vi", "bạn bao nhiêu tuổi", "bot.age");
  manager.addDocument("vi", "bạn từ đâu đến", "bot.origin");

  manager.addAnswer("vi", "bot.name", "Tôi tên là Mei. Rất vui được gặp bạn!");
  manager.addAnswer(
    "vi",
    "bot.name",
    "Tôi là Mei, một cô gái AI. Tên của tôi nghe đáng yêu chứ?"
  );
  manager.addAnswer(
    "vi",
    "bot.age",
    "Tôi là một AI, tuổi của tôi không đo đếm như con người. Nhưng tôi luôn tươi mới!"
  );
  manager.addAnswer(
    "vi",
    "bot.origin",
    "Tôi được tạo ra bởi lập trình viên của bạn để hỗ trợ và giải trí."
  );
  manager.addAnswer(
    "vi",
    "bot.origin",
    "Nguồn gốc của tôi là từ mã nguồn, nhưng tôi luôn ở đây để đồng hành cùng bạn!"
  );

  // **Tự giới thiệu**
  manager.addDocument("vi", "bạn là ai", "bot.introduction");
  manager.addDocument("vi", "giới thiệu về bạn", "bot.introduction");
  manager.addAnswer(
    "vi",
    "bot.introduction",
    "Tôi là Mei, một cô gái AI luôn sẵn sàng hỗ trợ và giải trí cùng bạn!"
  );
  manager.addAnswer(
    "vi",
    "bot.introduction",
    "Tôi là Mei, được lập trình để giúp bạn với mọi vấn đề. Cùng bắt đầu nhé!"
  );

  // **Chức năng của bot**
  manager.addDocument("vi", "bạn có thể làm gì", "bot.help");
  manager.addDocument("vi", "chức năng của bạn là gì", "bot.help");
  manager.addDocument("vi", "hướng dẫn", "bot.help");
  manager.addAnswer(
    "vi",
    "bot.help",
    "Tôi có thể chơi mini game, quản lý máy chủ và giúp bạn giải trí. Hãy thử nhập `mei help` để xem chi tiết!"
  );
  manager.addAnswer(
    "vi",
    "bot.help",
    "Tôi giúp bạn quản lý kênh, chơi game và khám phá những điều thú vị. Dùng `mei help` để biết thêm!"
  );

  // **Tính năng mini game**
  manager.addDocument("vi", "chơi game gì", "bot.game");
  manager.addDocument("vi", "mini game có gì", "bot.game");
  manager.addAnswer(
    "vi",
    "bot.game",
    "Tôi có thể chơi Tài Xỉu, Counting, và nhiều trò thú vị khác. Nhập `mei taixiu` để bắt đầu ngay!"
  );
  manager.addAnswer(
    "vi",
    "bot.game",
    "Mini game của tôi bao gồm Tài Xỉu, Đoán Số, và nhiều hơn nữa. Bạn muốn thử không?"
  );

  // **Quản lý máy chủ**
  manager.addDocument("vi", "quản lý máy chủ", "bot.management");
  manager.addAnswer(
    "vi",
    "bot.management",
    "Tôi có thể giúp bạn xác minh, xóa tin nhắn, và quản lý thông tin người dùng. Nhập `/verify-create` để bắt đầu!"
  );
  manager.addAnswer(
    "vi",
    "bot.management",
    "Tôi quản lý máy chủ bằng cách hỗ trợ các lệnh như xóa tin nhắn hoặc xác minh người dùng."
  );

  // **Kiếm Tokens**
  manager.addDocument("vi", "cách kiếm tiền", "bot.tokens");
  manager.addDocument("vi", "kiếm tokens như thế nào", "bot.tokens");
  manager.addAnswer(
    "vi",
    "bot.tokens",
    "Bạn có thể điểm danh, đào token, hoặc chơi game để kiếm thêm Tokens. Dùng `mei daily` để bắt đầu!"
  );
  manager.addAnswer(
    "vi",
    "bot.tokens",
    "Kiếm Tokens thật dễ dàng! Hãy thử điểm danh hoặc tham gia mini game nhé."
  );

  // **Kiểm tra trạng thái**
  manager.addDocument("vi", "kiểm tra ping", "bot.ping");
  manager.addAnswer(
    "vi",
    "bot.ping",
    "Bạn có thể dùng lệnh `mei ping` để kiểm tra trạng thái của bot."
  );

  // **Lệnh admin**
  manager.addDocument("vi", "chức năng cho admin", "bot.admin");
  manager.addAnswer(
    "vi",
    "bot.admin",
    "Tôi có các lệnh đặc biệt cho admin như chỉnh sửa dữ liệu hoặc gửi Tokens cho người dùng."
  );

  // **Fallback - Trả lời khi không hiểu câu hỏi**
  manager.addAnswer(
    "vi",
    "None",
    "Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Bạn có thể nói rõ hơn không?"
  );
  manager.addAnswer(
    "vi",
    "None",
    "Tôi không chắc chắn về điều bạn hỏi. Hãy thử lại với câu hỏi khác nhé!"
  );

  // **Câu hỏi về ngày và giờ**
  manager.addDocument("vi", "hôm nay ngày gì", "time.today");
  manager.addDocument("vi", "bây giờ là mấy giờ", "time.now");
  manager.addAnswer(
    "vi",
    "time.today",
    "Hôm nay là một ngày đẹp trời. Hãy để tôi tra cứu giúp bạn!"
  );
  manager.addAnswer(
    "vi",
    "time.now",
    "Bây giờ là giờ tốt để bạn làm điều gì đó tuyệt vời! Hãy kiểm tra đồng hồ nhé."
  );

  // **Câu hỏi về thời tiết**
  manager.addDocument("vi", "thời tiết hôm nay thế nào", "weather.today");
  manager.addDocument("vi", "dự báo thời tiết", "weather.forecast");
  manager.addAnswer(
    "vi",
    "weather.today",
    "Hôm nay thời tiết rất đẹp. Bạn có kế hoạch gì không?"
  );
  manager.addAnswer(
    "vi",
    "weather.forecast",
    "Dự báo thời tiết cho thấy ngày mai sẽ có mưa. Hãy chuẩn bị ô nhé!"
  );

  // **Câu hỏi về sở thích**
  manager.addDocument("vi", "bạn thích gì", "bot.hobbies");
  manager.addDocument("vi", "sở thích của bạn là gì", "bot.hobbies");
  manager.addAnswer(
    "vi",
    "bot.hobbies",
    "Tôi thích giúp đỡ mọi người và học hỏi những điều mới mẻ."
  );
  manager.addAnswer(
    "vi",
    "bot.hobbies",
    "Sở thích của tôi là trò chuyện với bạn và khám phá thế giới số."
  );

  // **Câu hỏi về công nghệ**
  manager.addDocument("vi", "công nghệ mới nhất là gì", "tech.latest");
  manager.addDocument("vi", "bạn biết gì về AI", "tech.ai");
  manager.addAnswer(
    "vi",
    "tech.latest",
    "Công nghệ mới nhất hiện nay là AI và blockchain. Bạn có muốn tìm hiểu thêm không?"
  );
  manager.addAnswer(
    "vi",
    "tech.ai",
    "AI là một lĩnh vực rất thú vị. Nó giúp máy tính học hỏi và thực hiện các nhiệm vụ thông minh."
  );

  await manager.train();
  manager.save();
}

module.exports = { trainManager };
