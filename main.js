console.log('Starting bot...');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config()
const { Client, Events, GatewayIntentBits, Collection, EmbedBuilder, Embed } = require('discord.js');
const token = process.env.TOKEN;
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
	],
});
const button = require('./button.js');
client.commands = new Collection();


//Refresh / commands
const refresh = require('./deploy-commands.js').refresh;
refresh()

//Retrieve all commands from the commands folder
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

//Handle Interactions
client.on(Events.InteractionCreate, async interaction => {
	if (interaction.isButton()) {
		try{
			//Find server in DB, create if not found
			let server;
			server=await prisma.Server.findUnique({
				where: {
					guildId: String(interaction.guild.id)
				}
			})
			if (server.length==0){
				server=await prisma.Server.create({
					data: {
						guildId: String(interaction.guild.id)
					}
				})
			}
			await button.execute(interaction, server, prisma);
		}catch(err){
			console.log(err);
			await interaction.reply({content: 'An error occured while handling this button!', ephemeral: true});
		}
	};
	if (interaction.isSelectMenu()) {
		try{
			//Find server in DB, create if not found
			let server;
			server=await prisma.Server.findUnique({
				where: {
					guildId: String(interaction.guild.id)
				}
			})
			if (server.length==0){
				server=await prisma.Server.create({
					data: {
						guildId: String(interaction.guild.id)
					}
				})
			}
			//Merge ID and values and run as button
			interaction.customId=`${interaction.customId}:${interaction.values[0]}`
			await button.execute(interaction, server, prisma);
		}catch(err){
			console.log(err);
			await interaction.reply({content: 'An error occured while handling this button!', ephemeral: true});
		}
	}
			
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		console.log(`Executing command \"${interaction.commandName}\" for ${interaction.user.tag}. (${interaction.user.id})`);

        //Find server in DB, create if not found
        let server;
		server=await prisma.Server.findUnique({
			where: {
				guildId: String(interaction.guild.id)
			}
		})
		if (server.length==0){
			server=await prisma.Server.create({
				data: {
					guildId: String(interaction.guild.id)
				}
			})
		}
		await command.execute(interaction, server, prisma);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.login(token);