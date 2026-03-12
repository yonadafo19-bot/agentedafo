/**
 * Tipos específicos de Telegram
 */

/**
 * Usuario de Telegram
 */
export interface TelegramUser {
  id: number;
  isBot: boolean;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
}

/**
 * Chat de Telegram
 */
export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Mensaje de Telegram
 */
export interface TelegramMessage {
  messageId: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  caption?: string;
  photo?: Array<{
    fileId: string;
    fileSize?: number;
    width: number;
    height: number;
  }>;
  voice?: {
    fileId: string;
    duration: number;
    mimeType?: string;
    fileSize?: number;
  };
  document?: {
    fileId: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
  };
}

/**
 * Callback query (botones inline)
 */
export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data: string;
}

/**
 * Inline keyboard button
 */
export interface InlineKeyboardButton {
  text: string;
  callbackData?: string;
  url?: string;
  callbackGame?: unknown;
  switchInlineQuery?: string;
  switchInlineQueryCurrentChat?: string;
}

/**
 * Inline keyboard
 */
export interface InlineKeyboardMarkup {
  inlineKeyboard: InlineKeyboardButton[][];
}

/**
 * Reply keyboard button
 */
export interface KeyboardButton {
  text: string;
  requestContact?: boolean;
  requestLocation?: boolean;
  requestPoll?: unknown;
}

/**
 * Reply keyboard markup
 */
export interface ReplyKeyboardMarkup {
  keyboard: KeyboardButton[][];
  resizeKeyboard?: boolean;
  oneTimeKeyboard?: boolean;
  inputFieldPlaceholder?: string;
  selective?: boolean;
}

/**
 * Parse mode para mensajes
 */
export type ParseMode = 'Markdown' | 'MarkdownV2' | 'HTML';

/**
 * Opciones para enviar mensajes
 */
export interface SendMessageOptions {
  parseMode?: ParseMode;
  disableWebPagePreview?: boolean;
  disableNotification?: boolean;
  replyToMessageId?: number;
  replyMarkup?: InlineKeyboardMarkup | ReplyKeyboardMarkup;
}
