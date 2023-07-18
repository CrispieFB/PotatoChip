const { SlashCommandBuilder, EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionsBitField } = require('discord.js');
require('dotenv').config()
module.exports = {
	permissions: [PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.ManageChannels],
	data: new SlashCommandBuilder()
		.setName('form')
		.setDescription('Manage forms.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('send-embed')
				.setDescription('Send a Reaction Role Configuration as a message.')
				.addStringOption(option => option.setName('name-title').setDescription('The name of the Reaction Role Configuration to send. Seperate with ,\'s to bulk send.').setRequired(true))),
	async execute(interaction, server, prisma) {
		switch (interaction.options.getSubcommand()) {

			default:
				await interaction.reply({ content: 'Invalid subcommand!', ephemeral: true });
				break;				
		}
	}
}