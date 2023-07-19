const { SlashCommandBuilder, EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
require('dotenv').config()
module.exports = {
	permissions: [PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ManageChannels],
	permissionsExclude: ["submit", "list"],
	data: new SlashCommandBuilder()
		.setName('form')
		.setDescription('Manage forms.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('submit')
				.setDescription('Submit a form.')
				.addStringOption(option => option.setName('name-title').setDescription('The name of the form to submit.').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('send-embed')
				.setDescription('Send a form embed.')
				.addStringOption(option => option.setName('name-title').setDescription('The name of the form to send. Seperate with ,\'s to send up to 5 forms on one embed.').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('send-existant')
				.setDescription('Add/update a form to an existing embed.')
				.addStringOption(option => option.setName('name-title').setDescription('The name of the form to send. Seperate with ,\'s to send up to 5 forms on one embed.').setRequired(true))
				.addStringOption(option => option.setName('message').setDescription('The message link of the form to update.').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('update')
				.setDescription('Update the ENTIRE MESSAGE including the form.')
				.addStringOption(option => option.setName('name-title').setDescription('The name of the form to update.').setRequired(true))
				.addStringOption(option => option.setName('message').setDescription('The message link of the form to update.').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('create')
				.setDescription('Create a new form.')
				.addStringOption(option => option.setName('name-title').setDescription('The name of the Form to create.').setRequired(true))
				.addChannelOption(option => option.setName('channel').setDescription('Link to the channel where form responses should be sent.').setRequired(true))
				.addStringOption(option => option.setName('fields').setDescription('[Required=true/false, Style=short/long] Format: Name:Required:Style:MaxLength:MinLength,->').setRequired(true))
				.addIntegerOption(option => option.setName('max-responses').setDescription('The maximum number of responses a user can submit.').setRequired(false))
				.addRoleOption(option => option.setName('role').setDescription('The role to ping when a response is submitted.').setRequired(false)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('view')
				.setDescription('View a form.')
				.addStringOption(option => option.setName('name-title').setDescription('The name of the form to view.').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('delete')
				.setDescription('Delete a form.')
				.addStringOption(option => option.setName('name-title').setDescription('The name of the form to delete.').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('list')
				.setDescription('List all forms.')),
	async execute(interaction, server, prisma, pCfg) {
		switch (interaction.options.getSubcommand()) {
			case 'submit':
				await submit(interaction, server, prisma, pCfg);
				break;
			case 'send-embed':
				await sendEmbed(interaction, server, prisma, pCfg);
				break;
			case 'send-existant':
				await sendExistant(interaction, server, prisma, pCfg);
				break;
			case 'update':
				await update(interaction, server, prisma, pCfg);
				break;
			case 'create':
				await create(interaction, server, prisma, pCfg);
				break;
			case 'view':
				await view(interaction, server, prisma, pCfg);
				break;
			case 'delete':
				await deleteForm(interaction, server, prisma, pCfg);
				break;
			case 'list':
				await list(interaction, server, prisma, pCfg);
				break;			
			default:
				await interaction.reply({ content: 'Invalid subcommand!', ephemeral: true });
				break;				
		}
	}
}
async function submit(interaction, server, prisma, pCfg){
	//Get the name
	let name = interaction.options.getString('name-title')
	//Find matching form
	let form = await prisma.form.findFirst({
		where: {
			guildId: String(interaction.guild.id),
			name: name
		},
		include: {
			fields: true
		}
	})
	//Check if the form exists
	if (form==null || form.length==0){
		await interaction.reply({ content: `Form ${name} does not exist!`, ephemeral: true });
		return;
	}
	//Check if the form is enabled
	if (!form.enabled){
		await interaction.reply({ content: `This form is not accepting responses.`, ephemeral: true });
		return;
	}
	//Check if the user has submitted the max number of responses
	let responses = await prisma.formResponse.findFirst({
		where: {
			formId: form.id,
			userId: interaction.user.id
		}
	})
	//Check if the user exists
	if (responses!=null && responses.length!=0){
		//Check if the user has submitted the max number of responses
		if (responses.count>=form.maxResponses && form.maxResponses!=0){
			await interaction.reply({ content: `You have already submitted the max number of responses!`, ephemeral: true });
			return;
		}
	}
	//Create the form
	let modal = new ModalBuilder()
		.setCustomId(`formRes:${form.id}`)
		.setTitle(`${form.name}`)
		//Add the components
		for (field of form.fields){
			//Create the text input
			let textInput = new TextInputBuilder()
				.setCustomId(`${field.id}`)
				.setLabel(field.name)
				.setMinLength(10)
				.setMaxLength(100)
				.setPlaceholder(field.placeholder)
				.setRequired(field.isRequired);
			if(field.style=='SHORT'){
				textInput.setStyle(TextInputStyle.Short)
			}else{
				textInput.setStyle(TextInputStyle.Paragraph)
			}
			//Add the text input to the modal
			let row=new ActionRowBuilder().addComponents(textInput)
			modal.addComponents(row)
		}
	//Display the form
	await interaction.showModal(modal)
}
async function sendEmbed(interaction, server, prisma, pCfg){
	//Get the name
	let names = interaction.options.getString('name-title')
	let namesSplit = names.split(',')
	//Make sure there are no more than 5 names
	if (namesSplit.length>5){
		await interaction.reply({ content: 'You can only send up to 5 forms at once!', ephemeral: true });
		return;
	}
	//Create row
	let row = new ActionRowBuilder()
	//Fetch current forms
	for(i in namesSplit){
		//Find matching form
		let form = await prisma.form.findFirst({
			where: {
				guildId: String(interaction.guild.id),
				name: namesSplit[i]
			}
		})
		//Check if the form exists
		if (form==null || form.length==0){
			await interaction.reply({ content: `Form ${namesSplit[i]} does not exist!`, ephemeral: true });
			return;
		}
		//Create the button
		let button = new ButtonBuilder()
			.setCustomId(`form:${form.id}:${i}`)
			.setLabel(form.name)
			.setStyle(ButtonStyle.Primary)
		//Add the button to the row
		row.addComponents(button)
	}
	//Create the embed
	const embed = new EmbedBuilder()
		.setColor(server.embedColor)
		.setTitle('Forms')
		.setDescription(`Click on a button to fill out the desired form!`)
		.setTimestamp()
		.setFooter({text:pCfg.Version})
	//Send the embed
	await interaction.channel.send({ embeds: [embed], components: [row], ephemeral: false });
	await interaction.reply({ content: `Form(s) sent!`, ephemeral: true });
}
async function sendExistant(interaction, server, prisma, pCfg){
		//Get the name
		let names = interaction.options.getString('name-title')
		let namesSplit = names.split(',')
		//Make sure there are no more than 5 names
		if (namesSplit.length>5){
			await interaction.reply({ content: 'You can only send up to 5 forms at once!', ephemeral: true });
			return;
		}
		//Create row
		let row = new ActionRowBuilder()
		//Fetch current forms
		for(i in namesSplit){
			//Find matching form
			let form = await prisma.form.findFirst({
				where: {
					guildId: String(interaction.guild.id),
					name: namesSplit[i]
				}
			})
			//Check if the form exists
			if (form==null || form.length==0){
				await interaction.reply({ content: `Form ${namesSplit[i]} does not exist!`, ephemeral: true });
				return;
			}
			//Create the button
			let button = new ButtonBuilder()
				.setCustomId(`form:${form.id}:${i}`)
				.setLabel(form.name)
				.setStyle(ButtonStyle.Primary)
			//Add the button to the row
			row.addComponents(button)
		}

		//Get the message
		let message=interaction.options.getString('message')
		//Check if it is a link and if the link is valid
		let msg
		if(message.includes('https://discord.com/channels/')){
			//Split the link
			let split=message.split('/')
			//Get the message
			try{
				msg=await interaction.guild.channels.cache.get(split[5]).messages.fetch(split[6])
			}catch(err){
				await interaction.reply({ content: `Invalid message link!`, ephemeral: true });
				return;
			}
		}else{
			await interaction.reply({ content: `Invalid message link!`, ephemeral: true });
		}
		
		//Edit
		let embeds=msg.embeds
		let content=msg.content
		await msg.edit({ content: content, embeds: embeds, components: [row] })
		await interaction.reply({ content: `Form(s) sent!`, ephemeral: true });
}
async function update(interaction, server, prisma, pCfg){
	//Get the name
	let names = interaction.options.getString('name-title')
	let namesSplit = names.split(',')
	//Make sure there are no more than 5 names
	if (namesSplit.length>5){
		await interaction.reply({ content: 'You can only send up to 5 forms at once!', ephemeral: true });
		return;
	}
	//Create row
	let row = new ActionRowBuilder()
	//Fetch current forms
	for(i in namesSplit){
		//Find matching form
		let form = await prisma.form.findFirst({
			where: {
				guildId: String(interaction.guild.id),
				name: namesSplit[i]
			}
		})
		//Check if the form exists
		if (form==null || form.length==0){
			await interaction.reply({ content: `Form ${namesSplit[i]} does not exist!`, ephemeral: true });
			return;
		}
		//Create the button
		let button = new ButtonBuilder()
			.setCustomId(`form:${form.id}:${i}`)
			.setLabel(form.name)
			.setStyle(ButtonStyle.Primary)
		//Add the button to the row
		row.addComponents(button)
	}

	//Get the message
	let message=interaction.options.getString('message')
	//Check if it is a link and if the link is valid
	let msg
	if(message.includes('https://discord.com/channels/')){
		//Split the link
		let split=message.split('/')
		//Get the message
		try{
			msg=await interaction.guild.channels.cache.get(split[5]).messages.fetch(split[6])
		}catch(err){
			await interaction.reply({ content: `Invalid message link!`, ephemeral: true });
			return;
		}
	}else{
		await interaction.reply({ content: `Invalid message link!`, ephemeral: true });
	}
	//Make embed
	const embed = new EmbedBuilder()
		.setColor(server.embedColor)
		.setTitle('Forms')
		.setDescription(`Click on a button to fill out the desired form!`)
		.setTimestamp()
		.setFooter({text:pCfg.Version})

	await msg.edit({ content: null, embeds: [embed], components: [row] })
	await interaction.reply({ content: `Form(s) sent!`, ephemeral: true });
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
	//Check if fields are valid
	let fields = interaction.options.getString('fields')
	let fieldsSplit = fields.split(',')
	for (field of fieldsSplit) {
		let fieldSplit = field.split(':')
		if (fieldSplit.length!=5){
			await interaction.reply({ content: 'Invalid field format!', ephemeral: true });
			return;
		}
	}
	//Parse form into JSON
	let fieldsJSON = []
	for (field of fieldsSplit) {
		let fieldSplit = field.split(':')
		let isRequired=false
		//Check length of name
		if (fieldSplit[0].length>45){
			await interaction.reply({ content: 'Field name may only be 45 characters!', ephemeral: true });
			return;
		}
		if (fieldSplit[1].toLowerCase()=='true'){ isRequired=true }
		let style=fieldSplit[2]
		let jStyle;
		if(style.toLowerCase()!='short' && style.toLowerCase()!='long'){
			await interaction.reply({ content: 'Invalid field style!', ephemeral: true });
			return;
		}
		if (style.toLowerCase()=='short'){
			jStyle='SHORT'
		}else{
			jStyle='LONG'
		}
		fieldsJSON.push({
			name: fieldSplit[0],
			isRequired: isRequired,
			style: jStyle,
			maxLength: Number(fieldSplit[3]),
			minLength: Number(fieldSplit[4])
		})
	}
	//Create the form
	let maxRes=interaction.options.getInteger('max-responses')
	if (maxRes==undefined || maxRes==null || maxRes==0){
		maxRes=undefined
	}
	let form;
	try{
		form = await prisma.form.create({
			data: {
				guildId: String(interaction.guild.id),
				name: interaction.options.getString('name-title'),
				responseChannel: interaction.options.getChannel('channel').id,
				role: interaction.options.getRole('role').id,
				maxResponses: maxRes,
				fields: {
					create: fieldsJSON
				}
			}
		})
	}catch(err){
		if (err.code=="P2002"){
			await interaction.reply({ content: 'A Form with that name already exists!', ephemeral: true });
			return;
		}
		await interaction.reply({ content: 'An error occured while creating the Form!', ephemeral: true });
		return;
	}	
	//Create the embed
	const embed = new EmbedBuilder()
		.setColor(server.embedColor)
		.setTitle('Form')
		.setDescription(`A new form has been created!`)
		.addFields(
			{ name: 'Name:', value: `\`${form.name}\``, inline: true },
			{ name: 'Response Channel:', value: `<#${form.responseChannel}>`, inline: true },
			{ name: 'Role to ping:', value: `<@&${form.role}>`, inline: true },
			{ name: 'Fields:', value: `\`\`\`json\n${JSON.stringify(fieldsJSON, null, 2)}\`\`\``, inline: true },
		)
		.setTimestamp()
		.setFooter({text:pCfg.Version})
	//Send the embed
	await interaction.reply({ embeds: [embed], ephemeral: true });
}
async function view(interaction, server, prisma, pCfg){
	//Get a list of forms
	let form = await prisma.form.findFirst({
		where: {
			guildId: String(interaction.guild.id),
			name: interaction.options.getString('name-title')
		},
		include: {
			fields: true
		}
	})
	//Check if there are any forms
	if (form==null || form.length==0){
		await interaction.reply({ content: 'Did not find any matching forms.', ephemeral: true });
		return;
	}
	//Create the embed
	const embed = new EmbedBuilder()
		.setColor(server.embedColor)
		.setTitle('Form')
		.setDescription(`Here is the form you requested!`)
		.addFields(
			{ name: 'Name:', value: `\`${form.name}\``, inline: true },
			{ name: 'Response Channel:', value: `<#${form.responseChannel}>`, inline: true },
			{ name: 'Role to ping:', value: `<@&${form.role}>`, inline: true },
			{ name: 'Fields:', value: `\`\`\`json\n${JSON.stringify(form.fields, null, 2)}\`\`\``, inline: true },
		)
		.setTimestamp()
		.setFooter({text:pCfg.Version})
	//Send the embed
	await interaction.reply({ embeds: [embed], ephemeral: true });
}
async function deleteForm(interaction, server, prisma, pCfg){
	//Find the config
	let form = await prisma.form.findFirst({
		where: {
			guildId: String(interaction.guild.id),
			name: interaction.options.getString('name-title')
		}
	})
	//Check if it exists
	if (form==null || form.length==0){
		await interaction.reply({ content: 'Did not find any matching forms.', ephemeral: true });
		return;
	}
	//Delete any responses
	await prisma.formResponses.deleteMany({
		where: {
			formId: form.id
		}
	})
	//Delete any fields
	await prisma.formFields.deleteMany({
		where: {
			formId: form.id
		}
	})
	//Delete the form
	await prisma.form.delete({
		where: {
			id: form.id
		}
	})
	await interaction.reply({ content: `Form ${form.name} deleted!`, ephemeral: true });
}
async function list(interaction, server, prisma, pCfg){
	//Get a list of forms
	let forms = await prisma.form.findMany({
		where: {
			guildId: String(interaction.guild.id)
		}
	})
	//Check if there are any forms
	if (forms==null || forms.length==0){
		await interaction.reply({ content: 'Did not find any forms.', ephemeral: true });
		return;
	}
	//Create the embed
	const embed = new EmbedBuilder()
		.setColor(server.embedColor)
		.setTitle('Forms')
		.setDescription(`**The following forms exist:**\n\n${forms.map(f => `${f.name}`).join('\n')}`)
		.setTimestamp()
		.setFooter({text:pCfg.Version})
	//Send the embed
	await interaction.reply({ embeds: [embed], ephemeral: true });
}