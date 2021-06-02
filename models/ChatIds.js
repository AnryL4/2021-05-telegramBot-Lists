const { model, Schema } = require('mongoose');

const chatIdsSchema = new Schema({
	id: String,
	list: [String],
	currentMessageId: Number,
	previousMessageId: Number,
});

module.exports = model('TelegramChatIds', chatIdsSchema);
