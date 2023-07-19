const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
require('dotenv').config()
module.exports = {
    permissions: [PermissionsBitField.Flags.ManageMessages],
	data: new SlashCommandBuilder()
		.setName('embed')
        .setDescription('Sends an embed with the desired content.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('send')
                .setDescription('Sends an embed with the desired content.')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('The title of the embed.')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('The description of the embed.')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('color')
                        .setDescription('The color of the embed. (Hexidecimal)')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('footer')
                        .setDescription('The footer of the embed.')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('include-timestamp')
                        .setDescription('Whether or not to include a timestamp in the embed.')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edits an embed sent by the bot with the desired content.')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('The message link of the embed to edit.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('The title of the embed.')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('The description of the embed.')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('color')
                        .setDescription('The color of the embed. (Hexidecimal)')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('footer')
                        .setDescription('The footer of the embed.')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('include-timestamp')
                        .setDescription('Whether or not to include a timestamp in the embed.')
                        .setRequired(false))),
	async execute(interaction, server, prisma, pCfg) {
        switch (interaction.options.getSubcommand()) {
			case 'send':
                await embedSend(interaction, server, prisma, pCfg);
                break;
            case 'edit':
                await embedEdit(interaction, server, prisma, pCfg);
                break
			default:
				await interaction.reply({ content: 'Invalid subcommand!', ephemeral: true });
				break;				
		}
	},
};
async function embedSend(interaction, server, prisma, pCfg){
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    //Make sure title or description is provided
    if((title==null || title==undefined || title=='') && (description==null || description==undefined || description=='')){
        await interaction.reply({ content: 'You must provide a title or description!', ephemeral: true });
        return;
    }
    let color = interaction.options.getString('color');
    const footer = interaction.options.getString('footer');
    let includeTimestamp = interaction.options.getBoolean('include-timestamp');
    if(includeTimestamp==null || includeTimestamp==undefined){
        includeTimestamp = false;
    }
    if(color==null || color==undefined || color==''){
        color = server.embedColor;
    }
    color=color.replace('#', '');
    //Check if color is valid
    if(!color.match(/^([0-9a-f]{3}){1,2}$/i)){
        await interaction.reply({ content: 'Invalid color!', ephemeral: true });
        return;
    }
    //Send embed
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setFooter({ text: footer })
        if (includeTimestamp){
            embed.setTimestamp();
        }
    await interaction.channel.send({ embeds: [embed], ephemeral: false });
    await interaction.reply({ content: 'Embed sent!', ephemeral: true });
}

async function embedEdit(interaction, server, prisma, pCfg){
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    //Make sure title or description is provided
    if((title==null || title==undefined || title=='') && (description==null || description==undefined || description=='')){
        await interaction.reply({ content: 'You must provide a title or description!', ephemeral: true });
        return;
    }
    let color = interaction.options.getString('color');
    const footer = interaction.options.getString('footer');
    let includeTimestamp = interaction.options.getBoolean('include-timestamp');
    const message=interaction.options.getString('message');
    if(includeTimestamp==null || includeTimestamp==undefined){
        includeTimestamp = false;
    }
    if(color==null || color==undefined || color==''){
        color = server.embedColor;
    }
    color=color.replace('#', '');
    //Check if color is valid
    if(!color.match(/^([0-9a-f]{3}){1,2}$/i)){
        await interaction.reply({ content: 'Invalid color!', ephemeral: true });
        return;
    }

    //Find message
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

    //Send embed
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setFooter({ text: footer })
        if (includeTimestamp){
            embed.setTimestamp();
        }
    await msg.edit({ embeds: [embed], ephemeral: false });
    await interaction.reply({ content: 'Embed edited!', ephemeral: true });
}