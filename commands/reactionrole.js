const { SlashCommandBuilder, EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionsBitField } = require('discord.js');
require('dotenv').config()
module.exports = {
	permissions: [PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.ManageChannels],
	data: new SlashCommandBuilder()
		.setName('reactionrole')
		.setDescription('Manage Reaction Roles.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('send-embed')
				.setDescription('Send a Reaction Role Configuration as a message.')
				.addStringOption(option => option.setName('name-title').setDescription('The name of the Reaction Role Configuration to send. Seperate with ,\'s to bulk send.').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('send-existant')
				.setDescription('Add Reaction Roles to a message the bot already sent.')
				.addStringOption(option => option.setName('name-title').setDescription('The name of the Reaction Role Configuration to send. Seperate with ,\'s to bulk send.').setRequired(true))
				.addStringOption(option => option.setName('message').setDescription('The message link of the role configuration message to update.').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('update')
				.setDescription('Update the ENTIRE MESSAGE (content/roles) To update only roles use /reactionrole send-existant.')
				.addStringOption(option => option.setName('name-title').setDescription('The name of the Reaction Role Configuration to update.').setRequired(true))
				.addStringOption(option => option.setName('message').setDescription('The message link of the role configuration message to update.').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('create')
				.setDescription('Create a new Reaction Role Configuration.')
				.addStringOption(option => option.setName('type').setDescription('The type of the Reaction Role Configuration.').setRequired(true).addChoices(
					{ name: 'Buttons', value: 'BUTTON' },
					{ name: 'List', value: 'LIST' }
				))
				.addStringOption(option => option.setName('name-title').setDescription('The name of the Reaction Role Configuration.').setRequired(true))
				.addBooleanOption(option => option.setName('unique').setDescription('If true the user can have multiple of these roles.').setRequired(true))
				.addStringOption(option => option.setName('roles').setDescription('The roles to include. [Removable optional, true/false.] Format: Name:Role:Removable,->').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('delete')
				.setDescription('Delete a Reaction Role Configuration.')
				.addStringOption(option => option.setName('name-title').setDescription('The name of the Reaction Role Configuration to delete.').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('list')
				.setDescription('List all Reaction Role Configurations.')),
	async execute(interaction, server, prisma) {
		switch (interaction.options.getSubcommand()) {
			case 'send-embed':
				await sendEmbed(interaction, server, prisma);
				break;
			case 'send-existant':
				await sendExistant(interaction, server, prisma);
				break;
			case 'update':
				await update(interaction, server, prisma);
				break;
			case 'create':
				await create(interaction, server, prisma);
				break;
			case 'delete':
				await deleteConfig(interaction, server, prisma);
				break;
			case 'list':
				await list(interaction, server, prisma);
				break;
			default:
				await interaction.reply({ content: 'Invalid subcommand!', ephemeral: true });
				break;				
		}
	}
}
async function sendEmbed(interaction, server, prisma) {
	//Split the config names
	let string=interaction.options.getString('name-title')
	//Parse configs
	let splitConfigs = string.split(',');
	let configs = [];
	//Get the configs
	for(config in splitConfigs){
		let configName=splitConfigs[config]
		//Find the config
		cfg=await prisma.reactionRoles.findFirst({
			where:{
				guildId:interaction.guild.id,
				name:configName
			},
			include:{
				roles:true
			}
		})
		//Check if it exists
		if(cfg.length==0 || cfg==null){
			await interaction.reply({ content: `Config ${configName} not found!`, ephemeral: true });
			return;
		}
		//Add it to the list
		configs.push(cfg)
	}
	//Send the configs
	for(config in configs){
		//Get the config
		cfg=configs[config]
		
		//Create buttons/list
		config=configs[config]
		if(config.type=="BUTTON"){
			//Create buttons
			row=new ActionRowBuilder()
			for(role in config.roles){
				//Create button
				button=new ButtonBuilder()
					.setCustomId(`reactionrole:${config.roles[role].roleId}:${config.id}:${role}`)
					.setLabel(config.roles[role].name)
					if (config.roles[role].removable){
						button.setStyle(ButtonStyle.Primary)
					}else{
						button.setStyle(ButtonStyle.Secondary)
					}
				//Add button to row
				row.addComponents(button)
			}
		}else if(config.type=="LIST"){
			//Create menu
			row=new ActionRowBuilder()
			menu=new StringSelectMenuBuilder()
				.setCustomId(`reactionrole`)
				.setPlaceholder("Select the role to add/remove.")
				for(role in config.roles){
					//Create option
						opt=new StringSelectMenuOptionBuilder()
							.setLabel(config.roles[role].name)
							.setValue(`${config.roles[role].roleId}:${config.id}:${role}`)
						if(config.roles[role].removable){
							opt.setDescription('🟢 This role can be removed.')
						}else{
							opt.setDescription('🔴 This role cannot be removed.')
						}
						menu.addOptions(opt)
				}
			//Add menu to row
			row.addComponents(menu)
		}
		//Create embed
		let embed = new EmbedBuilder()
			.setColor(server.embedColor)
			.setTitle(String(config.name))
			.setDescription('Select which roles you want. Roles that cannot be removed are greyed out or otherwise noted.')
			.setTimestamp()
			.setFooter({text:process.env.VERSION})
		await interaction.channel.send({ embeds: [embed], components: [row] });
	}
	await interaction.reply({ content: 'Reaction Roles sent!', ephemeral: true });
}
async function sendExistant(interaction, server, prisma) {
	//Split the config names
	let string=interaction.options.getString('name-title')
	let splitConfigs = [string]
	let configs = [];
	//Get the configs
	for(config in splitConfigs){
		let configName=splitConfigs[config]
		//Find the config
		cfg=await prisma.reactionRoles.findFirst({
			where:{
				guildId:interaction.guild.id,
				name:configName
			},
			include:{
				roles:true
			}
		})
		//Check if it exists
		if(cfg.length==0 || cfg==null){
			await interaction.reply({ content: `Config ${configName} not found!`, ephemeral: true });
			return;
		}
		//Add it to the list
		configs.push(cfg)
	}
	//Send the configs
	for(config in configs){
		//Get the config
		cfg=configs[config]
		
		//Create buttons/list
		config=configs[config]
		if(config.type=="BUTTON"){
			//Create buttons
			row=new ActionRowBuilder()
			for(role in config.roles){
				//Create button
				button=new ButtonBuilder()
					.setCustomId(`reactionrole:${config.roles[role].roleId}:${config.id}:${role}`)
					.setLabel(config.roles[role].name)
					if (config.roles[role].removable){
						button.setStyle(ButtonStyle.Primary)
					}else{
						button.setStyle(ButtonStyle.Secondary)
					}
				//Add button to row
				row.addComponents(button)
			}
		}else if(config.type=="LIST"){
			//Create menu
			row=new ActionRowBuilder()
			menu=new StringSelectMenuBuilder()
				.setCustomId(`reactionrole`)
				.setPlaceholder("Select the role to add/remove.")
				for(role in config.roles){
					//Create option
						opt=new StringSelectMenuOptionBuilder()
							.setLabel(config.roles[role].name)
							.setValue(`${config.roles[role].roleId}:${config.id}:${role}`)
						if(config.roles[role].removable){
							opt.setDescription('🟢 This role can be removed.')
						}else{
							opt.setDescription('🔴 This role cannot be removed.')
						}
						menu.addOptions(opt)
				}
			//Add menu to row
			row.addComponents(menu)
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

		//Get current message embeds and content
		let embeds=msg.embeds
		let content=msg.content
		await msg.edit({ contnet: content, embeds: embeds, components: [row] });
	}
	await interaction.reply({ content: 'Reaction Roles added!', ephemeral: true });
}
async function update(interaction, server, prisma) {
	//Split the config names
	let string=interaction.options.getString('name-title')
	//Parse configs
	let splitConfigs = string.split(',');
	let configs = [];
	//Get the configs
	for(config in splitConfigs){
		let configName=splitConfigs[config]
		//Find the config
		cfg=await prisma.reactionRoles.findFirst({
			where:{
				guildId:interaction.guild.id,
				name:configName
			},
			include:{
				roles:true
			}
		})
		//Check if it exists
		if(cfg.length==0 || cfg==null){
			await interaction.reply({ content: `Config ${configName} not found!`, ephemeral: true });
			return;
		}
		//Add it to the list
		configs.push(cfg)
	}
	//Send the configs
	for(config in configs){
		//Get the config
		cfg=configs[config]
		
		//Create buttons/list
		config=configs[config]
		if(config.type=="BUTTON"){
			//Create buttons
			row=new ActionRowBuilder()
			for(role in config.roles){
				//Create button
				button=new ButtonBuilder()
					.setCustomId(`reactionrole:${config.roles[role].roleId}:${config.id}:${role}`)
					.setLabel(config.roles[role].name)
					if (config.roles[role].removable){
						button.setStyle(ButtonStyle.Primary)
					}else{
						button.setStyle(ButtonStyle.Secondary)
					}
				//Add button to row
				row.addComponents(button)
			}
		}else if(config.type=="LIST"){
			//Create menu
			row=new ActionRowBuilder()
			menu=new StringSelectMenuBuilder()
				.setCustomId(`reactionrole`)
				.setPlaceholder("Select the role to add/remove.")
				for(role in config.roles){
					//Create option
						opt=new StringSelectMenuOptionBuilder()
							.setLabel(config.roles[role].name)
							.setValue(`${config.roles[role].roleId}:${config.id}:${role}`)
						if(config.roles[role].removable){
							opt.setDescription('🟢 This role can be removed.')
						}else{
							opt.setDescription('🔴 This role cannot be removed.')
						}
						menu.addOptions(opt)
				}
			//Add menu to row
			row.addComponents(menu)
		}
		//Get the message
		let message=interaction.options.getString('message')
		//Check if it is a link and if the link is valid
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

		//Create embed
		let embed = new EmbedBuilder()
			.setColor(server.embedColor)
			.setTitle(String(config.name))
			.setDescription('Select which roles you want. Roles that cannot be removed are greyed out or otherwise noted.')
			.setTimestamp()
			.setFooter({text:process.env.VERSION})
		await msg.edit({ embeds: [embed], components: [row] });
	}
	await interaction.reply({ content: 'Reaction Roles updated!', ephemeral: true });
}

async function create(interaction, server, prisma) {
	//Check current amount of configs
	let cfgs=await prisma.reactionRoles.findMany({
		where:{
			guildId:interaction.guild.id
		}
	})
	if (cfgs.length>=server.maxReactionRoles){
		await interaction.reply({ content: `You have reached the maximum amount of Reaction Role Configurations!`, ephemeral: true });
		return;
	}

	//Remove all spaces
	let string=interaction.options.getString('roles')
	//Parse roles
	let splitRoles = string.split(',');
	let roles = [];
	for (let i = 0; i < splitRoles.length; i++) {
		let splitRole = splitRoles[i].split(':');
		if (splitRole.length != 2 && splitRole.length != 3) {
			await interaction.reply({ content: 'Invalid role format!', ephemeral: true });
			return;
		}
		//Remove spaces
		splitRole[1] = splitRole[1].replace(" ", "");
		//Remove role syntax
		splitRole[1] = splitRole[1].replace("<", "");
		splitRole[1] = splitRole[1].replace("@", "");
		splitRole[1] = splitRole[1].replace("&", "");
		splitRole[1] = splitRole[1].replace(">", "");
		//Ensure it contains only numbers
		let isnum = /^\d+$/.test(splitRole[1]);
		if (!isnum) {
			await interaction.reply({ content: 'Invalid role format!', ephemeral: true });
			return;
		}
		//Check that 3 is a boolean
		if (splitRole.length == 3) {
			splitRole[2] = splitRole[2].replace(" ", "");
			if (splitRole[2] != "true" && splitRole[2] != "false") {
				await interaction.reply({ content: 'Invalid role format!', ephemeral: true });
				return;
			}
			if (splitRole[2]=="false"){
				splitRole[2]=false
			}else{
				splitRole[2]=true
			}
		}
		let role = await interaction.guild.roles.fetch(splitRole[1]);
		if (!role) {
			await interaction.reply({ content: `Role ${splitRole[0]} not found!`, ephemeral: true });
			return;
		}
		roles.push({ name: splitRole[0], id: splitRole[1], removable: splitRole[2]});
	}
	let type=interaction.options.getString('type')
	let max;
	switch (type){
		case "BUTTON":
			max=5
			break;
		case "LIST":
			max=20
			break;
		default:
			await interaction.reply({ content: 'Invalid type!', ephemeral: true });
			return;
	}
	if (roles.length > max) {
		await interaction.reply({ content: `You can only have a maximum of ${max} roles for this type.`, ephemeral: true });
		return;
	}
	
	//Create the role config
	prismaRoles=[]
	for (role in roles){
		prismaRoles.push({name:roles[role].name, roleId:roles[role].id, removable:roles[role].removable})
	}
	try{
		await prisma.reactionRoles.create({
			data: {
				name: interaction.options.getString('name-title'),
				guildId: String(interaction.guild.id),
				unique: interaction.options.getBoolean('unique'),
				type: type,
				roles: {
					create: prismaRoles
				}
			}
		})
	}catch(err){
		if (err.code=="P2002"){
			await interaction.reply({ content: 'A Reaction Role Configuration with that name already exists!', ephemeral: true });
			return;
		}
		await interaction.reply({ content: 'An error occured while creating the Reaction Role Configuration!', ephemeral: true });
		return;
	}

	//Create embed
	let roleStr="";
	for (role in roles){
		let rmvStr;
		if (roles[role].removable || roles[role].removable==undefined){
			rmvStr="Removable"
		}else{
			rmvStr="Not Removable"
		}
		roleStr+=`${roles[role].name} : <@&${roles[role].id}> : ${rmvStr}\n`
	}
	const embed = new EmbedBuilder()
		.setColor(server.embedColor)
		.setTitle('Reaction Role Configuration Created')
		.setDescription('The following roles were added to the configuration:\n\n'+roleStr)
		.setTimestamp()
		.setFooter({text:process.env.VERSION})
		
	await interaction.reply({ embeds: [embed], ephemeral: true });
};
async function deleteConfig(interaction, server, prisma) {
	const name = interaction.options.getString('name-title');
	//Find the config
	cfg=await prisma.reactionRoles.findFirst({
		where:{
			guildId:interaction.guild.id,
			name:name
		},
	})
	//Check if it exists
	if(cfg==null || cfg.length==0){
		await interaction.reply({ content: `Config ${name} not found!`, ephemeral: true });
		return;
	}
	//Delete any roles
	await prisma.role.deleteMany({
		where:{
			reactionRolesId:cfg.id
		}
	})
	//Delete the config
	await prisma.reactionRoles.delete({
		where:{
			id:cfg.id
		}
	})
	await interaction.reply({ content: `Config ${name} deleted!`, ephemeral: true });
}
async function list(interaction, server, prisma) {
	//Get the configs
	cfgs=await prisma.reactionRoles.findMany({
		where:{
			guildId:interaction.guild.id
		}
	})
	//Check if it exists
	if(cfgs.length==0 || cfgs==null){
		await interaction.reply({ content: `No configs found!`, ephemeral: true });
		return;
	}
	//Create embed
	let cfgStr="";
	for (cfg in cfgs){
		cfgStr+=`${cfgs[cfg].name}\n`
	}
	const embed = new EmbedBuilder()
		.setColor(server.embedColor)
		.setTitle('Reaction Role Configurations')
		.setDescription('The following configurations exist:\n\n'+cfgStr)
		.setTimestamp()
		.setFooter({text:process.env.VERSION})
		
	await interaction.reply({ embeds: [embed], ephemeral: true });
}