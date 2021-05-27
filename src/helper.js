module.exports = {
	keyboard_list(arr) {
		return arr.map(text => {
			return [{ text: text, callback_data: text }];
		});
	},
	html: `<u><strong>=============== Список ===============</strong></u>`,
};
