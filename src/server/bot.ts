import { db } from './store.js';

export class TelegramBotEngine {
  private get token(): string {
    return db.getAdminConfig().botToken || process.env.TELEGRAM_BOT_TOKEN || '';
  }

  private get adminId(): string {
    return db.getAdminConfig().adminId || process.env.TELEGRAM_ADMIN_ID || '123456789';
  }

  private get appUrl(): string {
    let url = process.env.APP_URL || '';
    if (!url) {
      url = 'https://t.me';
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url;
  }

  private getMiniAppButton(customPath?: string) {
    const targetUrl = customPath ? `${this.appUrl}${customPath}` : this.appUrl;
    return [
      [
        {
          text: '🎮 ورود به دنیای بازی',
          web_app: { url: targetUrl },
        },
      ],
    ];
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
        inlineKeyboard: this.getMiniAppButton(),
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
              inlineKeyboard: this.getMiniAppButton(`?room=${room.id}`),
            };
          } catch (err: any) {
            return {
              responseText: `❌ خطا در ورود به اتاق: ${err.message}`,
              inlineKeyboard: this.getMiniAppButton(),
            };
          }
        } else {
          return {
            responseText: '❌ اتاق مورد نظر یافت نشد یا منقضی شده است.',
            inlineKeyboard: this.getMiniAppButton(),
          };
        }
      }

      return this.getWelcomeMenu(user);
    }

    if (trimmedText === '/profile' || trimmedText === '👤 پروفایل من') {
      return this.getProfileResponse(user);
    }

    if (trimmedText === '/admin' || trimmedText === '⚙️ پنل مدیریت') {
      if (telegramId === this.adminId) {
        return this.getAdminMenu();
      } else {
        return {
          responseText: '❌ شما دسترسی ادمین ندارید.',
          inlineKeyboard: this.getMiniAppButton(),
        };
      }
    }

    // Default welcome/menu response for any message
    return this.getWelcomeMenu(user);
  }

  private getWelcomeMenu(user: any) {
    return {
      responseText: `سلام ${user.displayName} عزیز! 👋
به **پلتفرم جامع بازی‌های آنلاین تلگرام** خوش آمدید.

جهت ورود به بازی‌ها (دوز، منچ، مار و پله) و استفاده از مینی‌اپ، روی دکمه زیر کلیک کنید:`,
      inlineKeyboard: this.getMiniAppButton(),
    };
  }

  private getProfileResponse(user: any) {
    return {
      responseText: `👤 **پروفایل کاربری شما**

🆔 شناسه تلگرام: \`${user.telegramId}\`
🏷️ نام نمایش: **${user.displayName}**
🏅 رتبه: **${user.rank}**
💰 سکه‌ها: **${user.coins}**

📊 **آمار بازی‌ها:**
• مجموع بازی‌ها: ${user.gamesPlayed}
• بردها: 🏆 ${user.wins} | باخت‌ها: ❌ ${user.losses}`,
      inlineKeyboard: this.getMiniAppButton(),
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
🎮 کل بازی‌ها: **${stats.totalGamesPlayed}**`,
      inlineKeyboard: this.getMiniAppButton(),
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
          reply_markup: replyMarkup ? { inline_keyboard: replyMarkup } : undefined,
        }),
      });
    } catch (err) {
      console.error('Failed to send Telegram API message:', err);
    }
  }

  private isPolling = false;
  private lastUpdateId = 0;

  public async startPolling() {
    if (this.isPolling) return;
    if (!this.token) {
      console.log('⚠️ TELEGRAM_BOT_TOKEN set نیست. ربات تلگرام غیرفعال است.');
      return;
    }

    this.isPolling = true;
    console.log('🚀 ربات تلگرام (Long Polling) با موفقیت فعال و آماده دریافت پیام شد!');

    while (this.isPolling) {
      try {
        const url = `https://api.telegram.org/bot${this.token}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=30`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.ok && Array.isArray(data.result)) {
            for (const update of data.result) {
              this.lastUpdateId = update.update_id;
              await this.processUpdate(update);
            }
          }
        } else {
          await new Promise((r) => setTimeout(r, 5000));
        }
      } catch (err) {
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  private async processUpdate(update: any) {
    try {
      if (update.message) {
        const msg = update.message;
        const from = msg.from;
        if (!from) return;
        const text = msg.text || '';
        const reply = await this.handleMessage(
          from.id.toString(),
          from.username,
          from.first_name + (from.last_name ? ` ${from.last_name}` : ''),
          text
        );
        await this.sendTelegramApiMessage(from.id.toString(), reply.responseText, reply.inlineKeyboard);
      } else if (update.callback_query) {
        const query = update.callback_query;
        const from = query.from;
        if (!from) return;
        const data = query.data || '';
        let text = '/start';
        if (data === 'menu_games') text = '/games';
        else if (data === 'menu_profile') text = '/profile';
        else if (data === 'menu_rooms') text = '/rooms';
        else if (data === 'menu_friends') text = '/friends';
        else if (data === 'menu_admin') text = '/admin';
        else if (data === 'vs_bot_menu') text = '/vsbot';

        const reply = await this.handleMessage(
          from.id.toString(),
          from.username,
          from.first_name + (from.last_name ? ` ${from.last_name}` : ''),
          text
        );
        await this.sendTelegramApiMessage(from.id.toString(), reply.responseText, reply.inlineKeyboard);
      }
    } catch (err) {
      console.error('Error processing Telegram update:', err);
    }
  }
}

export const botEngine = new TelegramBotEngine();
