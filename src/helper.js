const TelegramChatIds = require('../models/ChatIds');

module.exports = {
	keyboard_list(arr) {
		return arr.map(text => {
			return [{ text: text, callback_data: text }];
		});
	},
	html(text) {
		return `<u><strong>Список ${text}:</strong></u>`;
	},
	byteCount(string) {
		return encodeURI(string).split(/%..|./).length - 1;
	},
	mongooseData: {
		async findById(id) {
			return await TelegramChatIds.findOne({ id });
		},
		async newChat(chatId) {
			const newChatId = new TelegramChatIds({
				id: chatId,
				shoppingList: [],
				toDoList: [],
				currentMessageId: 0,
				previousMessageId: 0,
				secondMessageId: 0,
				currentList: '🛒 Покупки',
			});
			await newChatId.save();
			return newChatId;
		},
		async findOneAndUpdate(chatId, args) {
			return await TelegramChatIds.findOneAndUpdate(
				{ id: chatId },
				{ ...args },
				{ new: true }
			);
		},
	},
};
