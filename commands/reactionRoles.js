const { SlashCommandBuilder, EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
require('dotenv').config()
module.exports = {
	data: new SlashCommandBuilder()
		.setName('reactionrole')
		.setDescription('Send one or more reaction role embeds.')
        .addStringOption(option => option.setName('name').setDescription('The name of the Role Configuration to use. Seperate with ,\'s to bulk send.').setRequired(true)),
	async execute(interaction, server, prisma) {
        //Split the config names
		let string=interaction.options.getString('name')
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
                        .setCustomId(`reactionrole:${config.roles[role].roleId}:${config.roles[role].removable}:${role}`)
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
                                .setValue(`${config.roles[role].roleId}:${config.roles[role].removable}:${role}`)
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
	},
};