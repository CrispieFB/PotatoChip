const { SlashCommandBuilder, EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionsBitField } = require('discord.js');
require('dotenv').config()
module.exports = {
	permissions: [PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ManageChannels],
	data: new SlashCommandBuilder()
		.setName('form')
		.setDescription('Manage forms.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('create')
				.setDescription('Create a new form.')
				.addStringOption(option => option.setName('name-title').setDescription('The name of the Reaction Role Configuration to send. Seperate with ,\'s to bulk send.').setRequired(true))
				.addStringOption(option => option.setName('channel').setDescription('Link to the channel where form responses should be sent.').setRequired(true))
				.addStringOption(option => option.setName('fields').setDescription('The fields for the form. [Required=true/false] Format: Name:Required:MaxLength:MinLength,->').setRequired(true))
				.addStringOption(option => option.setName('role').setDescription('Role to ping for new responses.').setRequired(false))),
	async execute(interaction, server, prisma, pCfg) {
		switch (interaction.options.getSubcommand()) {
			case 'create':
				await create(interaction, server, prisma, pCfg);
				break;				
			default:
				await interaction.reply({ content: 'Invalid subcommand!', ephemeral: true });
				break;				
		}
	}
}
async function create(interaction, server, prisma, pCfg){
	//Get the name
	let name = interaction.options.getString('name')
	//Fetch current forms
	let forms = await prisma.form.findMany({
		where: {
			guildId: String(interaction.guild.id)
		}
	})
	//Check if the max number of forms has been reached
	if (forms.length >= server.maxForms) {
		await interaction.reply({ content: 'The maximum number of forms has been reached!', ephemeral: true });
		return;
	}
	//Parse form into JSON
	let fields = interaction.options.getString('fields')
	let fieldsJSON = []
	let fieldsSplit = fields.split(',')
	for (field of fieldsSplit) {
		let fieldSplit = field.split(':')
		fieldsJSON.push({
			name: fieldSplit[0],
			required: fieldSplit[1],
			maxLength: fieldSplit[2],
			minLength: fieldSplit[3]
		})
	}
}