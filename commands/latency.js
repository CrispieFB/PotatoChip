const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
require('dotenv').config()
module.exports = {
	data: new SlashCommandBuilder()
		.setName('latency')
		.setDescription('Replies with latency statistics.'),
	async execute(interaction, server) {
		//Create embed
		const embed = new EmbedBuilder()
			.setColor(server.embedColor)
			.setTitle('Latency Statistics')
			.setDescription('Here are the latency statistics for the bot.')
			.addFields(
				{ name: 'Bot Latency:', value: `\`${Math.abs(Date.now()-interaction.createdTimestamp)}ms\``, inline: true },
			)
			.setTimestamp()
			.setFooter({text:process.env.VERSION})
		await interaction.reply({ embeds: [embed] });
	},
};