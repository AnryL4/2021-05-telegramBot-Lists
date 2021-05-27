require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const helper = require('./src/helper');

const bot = new TelegramBot(process.env.TOKEN, {
	polling: true,
});

let chats = {};

bot.on('message', async msg => {
	try {
		const text = msg.text;
		const chatId = msg.chat.id;

		if (!chats[chatId]) {
			chats[chatId] = {
				list: [],
				currentMessageId: 0,
				previousMessageId: 0,
			};
		}

		if (text === '/start') {
			return await bot
				.sendMessage(chatId, helper.html, {
					parse_mode: 'HTML',
					reply_markup: {
						inline_keyboard: helper.keyboard_list(
							chats[chatId].list
						),
					},
				})
				.then(res => {
					chats[chatId].currentMessageId = res.message_id;
					bot.deleteMessage(chatId, msg.message_id);
					if (chats[chatId].currentMessageId !== 0) {
						bot.deleteMessage(
							chatId,
							chats[chatId].previousMessageId
						);
					}
					chats[chatId].previousMessageId = res.message_id;
				});
		}

		if (typeof text === 'string') {
			chats[chatId].list.push(text);
			console.log(chats);
			bot.deleteMessage(chatId, msg.message_id);

			return await bot.editMessageText(helper.html, {
				chat_id: chatId,
				message_id: chats[chatId].currentMessageId,
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: helper.keyboard_list(chats[chatId].list),
				},
			});
		}
		return bot.deleteMessage(chatId, msg.message_id);
	} catch (error) {
		console.log('Ошибка!!!!!!!!!!!!!!!!!!!!!!!!!');
		console.log(error.message);
		if (
			error.message ===
			'ETELEGRAM: 400 Bad Request: message to edit not found'
		) {
			chatId = error.response.request.body
				.split('&')
				.filter(text => {
					return text.includes('chat_id');
				})[0]
				.slice(8);
			return await bot
				.sendMessage(chatId, helper.html, {
					parse_mode: 'HTML',
					reply_markup: {
						inline_keyboard: helper.keyboard_list(
							chats[chatId].list
						),
					},
				})
				.then(res => (chats[chatId].currentMessageId = res.message_id));
		}
	}
});

bot.on('callback_query', async query => {
	const chatId = query.message.chat.id;
	chats[chatId].list = chats[chatId].list.filter(text => text !== query.data);

	await bot.answerCallbackQuery(query.id, `${query.data} удалено`);

	return await bot.editMessageText(helper.html, {
		chat_id: chatId,
		message_id: query.message.message_id,
		parse_mode: 'HTML',
		reply_markup: {
			inline_keyboard: helper.keyboard_list(chats[chatId].list),
		},
	});
});

bot.on('getUpdates', t => console.log(t));
