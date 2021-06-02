const { model, Schema } = require('mongoose');

const chatIdsSchema = new Schema({
	id: String,
	shoppingList: [String],
	toDoList: [String],
	currentMessageId: Number,
	previousMessageId: Number,
	secondMessageId: Number,
	currentList: String,
});

module.exports = model('TelegramChatIds', chatIdsSchema);
