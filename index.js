require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const helper = require('./src/helper');
const mongoose = require('mongoose');

const start = () => {
	mongoose
		.connect(
			`mongodb+srv://${process.env.LOGIN}:${process.env.PASSWORD}@cluster0.fhqsl.mongodb.net/${process.env.DBNAME}?retryWrites=true&w=majority`,
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
			let currentList =
				datasFromChat.currentList === '📋 Дела'
					? 'toDoList'
					: 'shoppingList';

			if (text === '/start') {
				return await bot
					.sendMessage(
						chatId,
						helper.html(
							currentList === 'toDoList' ? 'дел' : 'покупок' || ''
						),
						{
							parse_mode: 'HTML',
							reply_markup: {
								inline_keyboard: helper.keyboard_list(
									datasFromChat[currentList]
								),
							},
						}
					)
					.then(async res => {
						datasFromChat =
							await helper.mongooseData.findOneAndUpdate(chatId, {
								currentMessageId: res.message_id,
							});
						bot.deleteMessage(chatId, msg.message_id);
						if (datasFromChat.currentMessageId !== 0) {
							bot.deleteMessage(
								chatId,
								datasFromChat.previousMessageId
							);
							bot.deleteMessage(
								chatId,
								datasFromChat.secondMessageId
							);
						}
						await helper.mongooseData.findOneAndUpdate(chatId, {
							previousMessageId: res.message_id,
						});
						bot.sendMessage(
							chatId,
							`Сообщения добавятся в список. Кликните, чтобы удалить.`,
							{
								reply_markup: {
									keyboard: [['🛒 Покупки', '📋 Дела']],
									resize_keyboard: true,
								},
							}
						).then(
							async res =>
								await helper.mongooseData.findOneAndUpdate(
									chatId,
									{
										secondMessageId: res.message_id,
									}
								)
						);
					});
			}
			if (typeof text === 'string') {
				if (text === '🛒 Покупки' || text === '📋 Дела') {
					await helper.mongooseData.findOneAndUpdate(chatId, {
						currentList: text,
					});
				} else {
					datasFromChat[currentList].push(text);
					await helper.mongooseData.findOneAndUpdate(chatId, {
						[currentList]: datasFromChat[currentList],
					});
				}
				datasFromChat = await helper.mongooseData.findById(chatId);
				currentList =
					datasFromChat.currentList === '📋 Дела'
						? 'toDoList'
						: 'shoppingList';
				bot.deleteMessage(chatId, msg.message_id);
				return await bot.editMessageText(
					helper.html(
						currentList === 'toDoList' ? 'дел' : 'покупок' || ''
					),
					{
						chat_id: chatId,
						message_id: datasFromChat.currentMessageId,
						parse_mode: 'HTML',
						reply_markup: {
							inline_keyboard: helper.keyboard_list(
								datasFromChat[currentList]
							),
						},
					}
				);
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
					.sendMessage(
						chatId,
						helper.html(
							currentList === 'toDoList' ? 'дел' : 'покупок' || ''
						),
						{
							parse_mode: 'HTML',
							reply_markup: {
								inline_keyboard: helper.keyboard_list(
									datasFromChat[currentList]
								),
							},
						}
					)
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
		let currentList =
			datasFromChat.currentList === '📋 Дела'
				? 'toDoList'
				: 'shoppingList';
		datasFromChat = await helper.mongooseData.findOneAndUpdate(chatId, {
			[currentList]: datasFromChat[currentList].filter(
				text => text !== query.data
			),
		});

		await bot.answerCallbackQuery(query.id, `${query.data} удалено`);

		return await bot.editMessageText(
			helper.html(currentList === 'toDoList' ? 'дел' : 'покупок' || ''),
			{
				chat_id: chatId,
				message_id: query.message.message_id,
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: helper.keyboard_list(
						datasFromChat[currentList]
					),
				},
			}
		);
	});
};
start();
