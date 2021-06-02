const TelegramChatIds = require('../models/ChatIds');

module.exports = {
	keyboard_list(arr) {
		return arr.map(text => {
			return [{ text: text, callback_data: text }];
		});
	},
	html: `<u><strong>Список:</strong></u>`,
	mongooseData: {
		async findById(id) {
			return await TelegramChatIds.findOne({ id });
		},
		async newChat(chatId) {
			const newChatId = new TelegramChatIds({
				id: chatId,
				list: [],
				currentMessageId: 0,
				previousMessageId: 0,
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
