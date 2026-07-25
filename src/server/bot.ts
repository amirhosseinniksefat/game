import { db } from './store.js';

export class TelegramBotEngine {
  private get token(): string {
    return db.getAdminConfig().botToken || process.env.TELEGRAM_BOT_TOKEN || '';
  }

  private get adminId(): string {
    return db.getAdminConfig().adminId || process.env.TELEGRAM_ADMIN_ID || '123456789';
  }

  // Handle incoming telegram message or command
  public async handleMessage(
    telegramId: string,
    username: string | undefined,
    displayName: string,
    text: string
  ): Promise<{ responseText: string; inlineKeyboard?: any[] }> {
    const config = db.getAdminConfig();
    if (config.maintenanceMode && telegramId !== this.adminId) {
      return {
        responseText: `⚠️ ${config.maintenanceMessage}`,
      };
    }

    const user = db.getOrCreateUser(telegramId, username, displayName);

    if (user.status === 'banned') {
      return {
        responseText: '❌ حساب کاربری شما مسدود شده است و امکان استفاده از ربات را ندارید.',
      };
    }

    const trimmedText = text.trim();

    // Check start parameter e.g., /start room_RM1234
    if (trimmedText.startsWith('/start')) {
      const parts = trimmedText.split(' ');
      if (parts.length > 1 && parts[1].startsWith('room_')) {
        const roomCode = parts[1].replace('room_', '');
        const room = db.getRoomByCode(roomCode);
        if (room) {
          try {
            db.joinRoom(room.id, user.id);
            return {
              responseText: `✅ شما با موفقیت به اتاق ${room.code} (${
                room.gameType === 'tictactoe'
                  ? 'دوز'
                  : room.gameType === 'ludo'
                  ? 'منچ'
                  : 'مار و پله'
              }) پیوستید!`,
              inlineKeyboard: [
                [{ text: '🎮 ورود به بازی', web_app: { url: `/game/${room.id}` } }],
              ],
            };
          } catch (err: any) {
            return { responseText: `❌ خطا در ورود به اتاق: ${err.message}` };
          }
        } else {
          return { responseText: '❌ اتاق مورد نظر یافت نشد یا منقضی شده است.' };
        }
      }

      return this.getWelcomeMenu(user);
    }

    if (trimmedText === '/profile' || trimmedText === '👤 پروفایل من') {
      return this.getProfileResponse(user);
    }

    if (trimmedText === '/games' || trimmedText === '🎮 شروع بازی') {
      return this.getGamesMenu();
    }

    if (trimmedText === '/vsbot' || trimmedText === '🤖 بازی تک‌نفره با ربات') {
      return {
        responseText: '🤖 **بازی تک‌نفره با ربات هوشمند (AI):**\nلطفاً بازی مورد نظر خود برای رقابت با ربات را انتخاب کنید:',
        inlineKeyboard: [
          [{ text: '❌⭕ دوز تک‌نفره (vs AI Bot)', callback_data: 'vs_bot_tictactoe' }],
          [{ text: '🎲 منچ تک‌نفره (vs AI Bot)', callback_data: 'vs_bot_ludo' }],
          [{ text: '🐍🪜 مار و پله تک‌نفره (vs AI Bot)', callback_data: 'vs_bot_snakes' }],
          [{ text: '🔙 بازگشت به منوی اصلی', callback_data: 'menu_start' }],
        ],
      };
    }

    if (trimmedText === '/rooms' || trimmedText === '🚪 لیست اتاق‌ها') {
      return this.getRoomsListResponse();
    }

    if (trimmedText === '/friends' || trimmedText === '👥 دوستان') {
      return this.getFriendsResponse(user);
    }

    if (trimmedText === '/admin' || trimmedText === '⚙️ پنل مدیریت') {
      if (telegramId === this.adminId) {
        return this.getAdminMenu();
      } else {
        return { responseText: '❌ شما دسترسی ادمین ندارید.' };
      }
    }

    if (trimmedText === '/help' || trimmedText === '❓ راهنما') {
      return {
        responseText: `📚 **راهنمای پلتفرم بازی آنلاین تلگرام**

🎮 **بازی‌های موجود:**
• **دوز (Tic Tac Toe):** ۲ نفره، تلاش برای قرار دادن ۳ علامت در یک خط.
• **منچ (Ludo):** ۲ تا ۴ نفره، آوردن تاس ۶ برای خروج مهره و رساندن تمام مهره‌ها به مقصد.
• **مار و پله (Snakes and Ladders):** ۲ تا ۴ نفره، حرکت بر روی صفحه ۱۰۰ خانه‌ای با نردبان و مار.

🔗 **دعوت از دوستان:**
با ایجاد اتاق خصوصی می‌توانید کد یا لینک اختصاصی اتاق را برای دوستانتان بفرستید تا سریعاً ملحق شوند.

💬 **چت و گزارش:**
در حین بازی می‌توانید به صورت زنده چت کنید یا در صورت بروز تخلف، کاربر را گزارش کنید.`,
      };
    }

    // Default response
    return {
      responseText: `🤖 پیام شما دریافت شد: "${trimmedText}"\nلطفاً یکی از گزینه‌های منو را انتخاب کنید:`,
      inlineKeyboard: [
        [{ text: '🎮 انتخاب بازی', callback_data: 'menu_games' }, { text: '👤 پروفایل', callback_data: 'menu_profile' }],
        [{ text: '🚪 لیست اتاق‌ها', callback_data: 'menu_rooms' }, { text: '⚙️ پنل مدیریت', callback_data: 'menu_admin' }]
      ]
    };
  }

  private getWelcomeMenu(user: any) {
    return {
      responseText: `سلام ${user.displayName} عزیز! 👋
به **پلتفرم جامع بازی‌های چندنفره آنلاین تلگرام** خوش آمدید.

یک بازی انتخاب کنید، با دوستان خود، بازیکنان آنلاین یا **ربات هوشمند (تک‌نفره)** رقابت کنید!`,
      inlineKeyboard: [
        [{ text: '🎮 شروع بازی جدید (چندنفره)', callback_data: 'menu_games' }],
        [{ text: '🤖 بازی تک‌نفره با ربات (vs Bot)', callback_data: 'vs_bot_menu' }],
        [{ text: '👤 پروفایل کاربری', callback_data: 'menu_profile' }, { text: '🚪 لیست اتاق‌ها', callback_data: 'menu_rooms' }],
        [{ text: '👥 دوستان من', callback_data: 'menu_friends' }, { text: '⚙️ پنل مدیریت', callback_data: 'menu_admin' }]
      ],
    };
  }

  private getProfileResponse(user: any) {
    return {
      responseText: `👤 **پروفایل کاربری شما**

🆔 شناسه تلگرام: \`${user.telegramId}\`
🏷️ نام نمایش: **${user.displayName}**
📛 نام کاربری: @${user.username}
🏅 رتبه: **${user.rank}**
💰 سکه‌ها: **${user.coins}**

📊 **آمار بازی‌ها:**
• مجموع بازی‌ها: ${user.gamesPlayed}
• بردها: 🏆 ${user.wins}
• باخت‌ها: ❌ ${user.losses}
• مساوی‌ها: 🤝 ${user.draws}
• درصد برد: **${user.winRate}%**

👥 تعداد دوستان: ${user.friends.length}`,
      inlineKeyboard: [
        [{ text: '👥 مشاهده دوستان', callback_data: 'menu_friends' }],
        [{ text: '🔙 بازگشت به منوی اصلی', callback_data: 'menu_start' }]
      ],
    };
  }

  private getGamesMenu() {
    return {
      responseText: '🎮 **لطفاً یکی از بازی‌های زیر را جهت شروع انتخاب کنید:**',
      inlineKeyboard: [
        [{ text: '❌⭕ دوز (Tic Tac Toe)', callback_data: 'create_tictactoe' }],
        [{ text: '🎲 منچ (Ludo)', callback_data: 'create_ludo' }],
        [{ text: '🐍🪜 مار و پله (Snakes & Ladders)', callback_data: 'create_snakes' }],
        [{ text: '🔍 جستجوی سریع بازی (Matchmaking)', callback_data: 'quick_match' }],
      ],
    };
  }

  private getRoomsListResponse() {
    const activeRooms = db.getActiveRooms();
    if (activeRooms.length === 0) {
      return {
        responseText: '🚪 در حال حاضر هیچ اتاق فعالی وجود ندارد. می‌توانید همین حالا یک اتاق جدید بسازید!',
        inlineKeyboard: [[{ text: '➕ ساخت اتاق جدید', callback_data: 'menu_games' }]],
      };
    }

    const roomText = activeRooms
      .slice(0, 5)
      .map(
        (r) =>
          `• **کد ${r.code}** | بازی: ${
            r.gameType === 'tictactoe' ? 'دوز' : r.gameType === 'ludo' ? 'منچ' : 'مار و پله'
          } | نفرات: (${r.players.length}/${r.maxPlayers}) | وضعیت: ${
            r.status === 'waiting' ? 'در انتظار بازیکن' : 'در حال اجرا'
          }`
      )
      .join('\n');

    return {
      responseText: `🚪 **لیست اتاق‌های فعال:**\n\n${roomText}`,
      inlineKeyboard: [[{ text: '➕ ساخت اتاق جدید', callback_data: 'menu_games' }]],
    };
  }

  private getFriendsResponse(user: any) {
    const friends = user.friends
      .map((fId: string) => db.getUser(fId))
      .filter(Boolean);

    const friendListText = friends.length
      ? friends.map((f: any) => `• **${f.displayName}** (@${f.username}) - وضعیت: ${f.status === 'online' ? '🟢 آنلاین' : '🔴 آفلاین'}`).join('\n')
      : 'هنوز هیچ دوستی اضافه نکرده‌اید.';

    return {
      responseText: `👥 **لیست دوستان شما:**\n\n${friendListText}`,
      inlineKeyboard: [[{ text: '🔙 بازگشت به اصلی', callback_data: 'menu_start' }]],
    };
  }

  private getAdminMenu() {
    const stats = db.getStats();
    return {
      responseText: `⚙️ **پنل مدیریت تلگرام**

📊 **آمار زنده پلتفرم:**
👥 کاربران کل: **${stats.totalUsers}**
🟢 آنلاین: **${stats.onlineUsers}**
🚪 اتاق‌های فعال: **${stats.activeRooms}**
🎮 کل بازی‌ها: **${stats.totalGamesPlayed}**
⚠️ گزارشات بررسی نشده: **${stats.pendingReportsCount}**`,
      inlineKeyboard: [
        [{ text: '🖥️ ورود به داشبورد کامل مدیریت وب', callback_data: 'open_admin_panel' }],
        [{ text: '🔙 بازگشت', callback_data: 'menu_start' }],
      ],
    };
  }

  // Real Telegram API Webhook sender helper
  public async sendTelegramApiMessage(chatId: string, text: string, replyMarkup?: any) {
    if (!this.token) return;
    try {
      const url = `https://api.telegram.org/bot${this.token}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
          reply_markup: replyMarkup,
        }),
      });
    } catch (err) {
      console.error('Failed to send Telegram API message:', err);
    }
  }
}

export const botEngine = new TelegramBotEngine();
