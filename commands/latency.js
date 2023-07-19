const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
require('dotenv').config()
module.exports = {
	permissions: null,
	data: new SlashCommandBuilder()
		.setName('latency')
		.setDescription('Replies with latency statistics.'),
	async execute(interaction, server, prisma, pCfg {
		//Create embed
		const embed = new EmbedBuilder()
			.setColor(server.embedColor)
			.setTitle('Latency Statistics')
			.setDescription('Here are the latency statistics for the bot.')
			.addFields(
				{ name: 'Bot Latency:', value: `\`${Math.abs(Date.now()-interaction.createdTimestamp)}ms\``, inline: true },
			)
			.setTimestamp()
			.setFooter({text:pCfg.Version})
		await interaction.reply({ embeds: [embed] });
	},
};