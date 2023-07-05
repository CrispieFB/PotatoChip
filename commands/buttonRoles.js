const { SlashCommandBuilder, EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder } = require('discord.js');
require('dotenv').config()
module.exports = {
	data: new SlashCommandBuilder()
		.setName('reactionrole-create')
		.setDescription('Create Reaction Role configuration.')
		.addStringOption(option => option.setName('type').setDescription('The type of the Role Configuration.').setRequired(true).addChoices(
			{ name: 'Buttons', value: 'BUTTON' },
			{ name: 'List', value: 'LIST' }
		))
		.addStringOption(option => option.setName('name').setDescription('The name of the Role Configuration.').setRequired(true))
		.addStringOption(option => option.setName('roles').setDescription('The roles to include. [Removable optional, true/false.] Format: Name:Role:Removable,->').setRequired(true)),
	async execute(interaction, server, prisma) {
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
				max=15
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
			prismaRoles.push({name:roles[role].name, roleId:roles[role].id})
		}
		try{
			await prisma.reactionRoles.create({
				data: {
					name: interaction.options.getString('name'),
					guildId: String(interaction.guild.id),
					type: type,
					roles: {
						create: prismaRoles
					}
				}
			})
		}catch(err){
			if (err.code=="P2002"){
				await interaction.reply({ content: 'A role configuration with that name already exists!', ephemeral: true });
				return;
			}
			await interaction.reply({ content: 'An error occured while creating the role configuration!', ephemeral: true });
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
			.setTitle('Role Configuration Created')
			.setDescription('The following roles were added to the configuration:\n\n'+roleStr)
			.setTimestamp()
			.setFooter({text:process.env.VERSION})
			
		await interaction.reply({ embeds: [embed], ephemeral: true });
	},
};