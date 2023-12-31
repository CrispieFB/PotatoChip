console.log('Starting bot...');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config()
const pCfg = require('./publicConfig.json');
const { Client, Events, GatewayIntentBits, Collection, EmbedBuilder, Embed, ActivityType } = require('discord.js');
const token = process.env.TOKEN;
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const functions = require('./functions/index.js');
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds
	],
});
const button = require('./button.js');
const modal = require('./modal.js');
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
	if (interaction.isModalSubmit()) {
		try{
			console.log(`Executing modal submission \"${interaction.customId}\" for ${interaction.user.tag}. (${interaction.user.id})`);
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
			await modal.execute(interaction, server, prisma, pCfg);
		}catch(err){
			console.log(err);
			await interaction.reply({content: 'An error occured while handling this Submission!', ephemeral: true});
		}
	}
	if (interaction.isButton()) {
		try{
			console.log(`Executing button \"${interaction.customId}\" for ${interaction.user.tag}. (${interaction.user.id})`);
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
			await button.execute(interaction, server, prisma, pCfg);
		}catch(err){
			console.log(err);
			await interaction.reply({content: 'An error occured while handling this button!', ephemeral: true});
			return
		}
	};
	if (interaction.isSelectMenu()) {
		try{
			console.log(`Executing select menu \"${interaction.customId}\" for ${interaction.user.tag}. (${interaction.user.id})`);
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
			await button.execute(interaction, server, prisma, pCfg);
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
		if (server==null || server.length==0){
			server=await prisma.Server.create({
				data: {
					guildId: String(interaction.guild.id)
				}
			})
		}
		//Check if they have permission to run this command
		let subcommand;
		try{
			subcommand=interaction.options.getSubcommand()
		}catch{
			subcommand=null
		}
		let isAllowed=await functions.checkPerms(interaction, server, prisma, pCfg, command.permissions)
		if (subcommand!=undefined && subcommand!=null && command.permissionsExclude!=undefined && command.permissionsExclude!=null && command.permissionsExclude.length>0){
			//Check if this subcommand is allowed
			for(exc of command.permissionsExclude){
				if (exc==subcommand){
					isAllowed=true
					break
				}
			}
		}
		if(isAllowed){
			await command.execute(interaction, server, prisma, pCfg);
		}else{
			await interaction.reply({ content: 'You do not have permission to run this command!', ephemeral: true });
		}
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});
//On Ready
client.on(Events.ClientReady, async () => {
	console.log(`Logged in as ${client.user.tag}! (${client.user.id})`);

	statusLoop();
});

//Status loop
let currentStat=1
function statusLoop(){
	//Choose status
	let statDat={}
	switch(currentStat){
		case 1:
			statDat={
				status: 'online',
				type: ActivityType.Watching,
				name: `${client.guilds.cache.size} servers. ${pCfg.Version}`,
			}
			break;
		case 2:
			statDat={
				status: 'online',
				type: ActivityType.Listening,
				name: `commands. (/) ${pCfg.Version}`,
			}
			break;
		case 3:
			statDat={
				status: 'online',
				type: ActivityType.Streaming,
				name: `${process.env.STATUS_MESSAGE} ${pCfg.Version}`,
			}
			break
		default:
			currentStat=1
			statusLoop()
			return
	}
	//Set status
	client.user.setPresence({
		status: statDat.status,
		activities: [
			{
				type: statDat.type,
				name: statDat.name,
			}
		]
	});
	//Increment status
	currentStat++
	//Loop
	setTimeout(statusLoop, 10000);
}

client.login(token);