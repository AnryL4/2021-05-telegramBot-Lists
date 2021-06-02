require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const helper = require('./src/helper');
const mongoose = require('mongoose');

mongoose
	.connect(
		`mongodb+srv://${process.env.LOGIN}:${process.env.PASSWORD}@cluster0.ghpfy.mongodb.net/${process.env.DBNAME}?retryWrites=true&w=majority`,
		{
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false,
		}
	)
	.then(() => {
		console.log('database connected');
	})
	.catch(err => console.log(err));

const bot = new TelegramBot(process.env.TOKEN, {
	polling: true,
});

bot.on('message', async msg => {
	try {
		const text = msg.text;
		const chatId = msg.chat.id;
		let datasFromChat = await helper.mongooseData.findById(chatId);

		if (!datasFromChat) {
			datasFromChat = await helper.mongooseData.newChat(chatId);
		}
		if (text === '/start') {
			return await bot
				.sendMessage(chatId, helper.html, {
					parse_mode: 'HTML',
					reply_markup: {
						inline_keyboard: helper.keyboard_list(
							datasFromChat.list
						),
					},
				})
				.then(async res => {
					datasFromChat = await helper.mongooseData.findOneAndUpdate(
						chatId,
						{ currentMessageId: res.message_id }
					);
					bot.deleteMessage(chatId, msg.message_id);
					if (datasFromChat.currentMessageId !== 0) {
						bot.deleteMessage(
							chatId,
							datasFromChat.previousMessageId
						);
					}
					await helper.mongooseData.findOneAndUpdate(chatId, {
						previousMessageId: res.message_id,
					});
				});
		}

		if (typeof text === 'string') {
			datasFromChat.list.push(text);
			await helper.mongooseData.findOneAndUpdate(chatId, {
				list: datasFromChat.list,
			});
			bot.deleteMessage(chatId, msg.message_id);
			return await bot.editMessageText(helper.html, {
				chat_id: chatId,
				message_id: datasFromChat.currentMessageId,
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: helper.keyboard_list(datasFromChat.list),
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
							datasFromChat.list
						),
					},
				})
				.then(
					async res =>
						await helper.mongooseData.findOneAndUpdate(chatId, {
							currentMessageId: res.message_id,
						})
				);
		}
	}
});

bot.on('callback_query', async query => {
	const chatId = query.message.chat.id;
	let datasFromChat = await helper.mongooseData.findById(chatId);
	datasFromChat = await helper.mongooseData.findOneAndUpdate(chatId, {
		list: datasFromChat.list.filter(text => text !== query.data),
	});

	await bot.answerCallbackQuery(query.id, `${query.data} удалено`);

	return await bot.editMessageText(helper.html, {
		chat_id: chatId,
		message_id: query.message.message_id,
		parse_mode: 'HTML',
		reply_markup: {
			inline_keyboard: helper.keyboard_list(datasFromChat.list),
		},
	});
});
