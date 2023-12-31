const { SlashCommandBuilder, messageBuilder, PermissionsBitField } = require('discord.js');
require('dotenv').config()
module.exports = {
    permissions: [PermissionsBitField.Flags.ManageMessages],
	data: new SlashCommandBuilder()
		.setName('message')
        .setDescription('Sends an message with the desired content.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('send')
                .setDescription('Sends an message with the desired content.')
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('The content of the message.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edits an message sent by the bot with the desired content.')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('The message link of the message to edit.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('The content of the message.')
                        .setRequired(true))),
	async execute(interaction, server, prisma, pCfg) {
        switch (interaction.options.getSubcommand()) {
			case 'send':
                await messageSend(interaction, server, prisma, pCfg);
                break;
            case 'edit':
                await messageEdit(interaction, server, prisma, pCfg);
                break
			default:
				await interaction.reply({ content: 'Invalid subcommand!', ephemeral: true });
				break;				
		}
	},
};
async function messageSend(interaction, server, prisma, pCfg){
    const content = interaction.options.getString('content');
    const message = interaction.options.getString('message');
    await interaction.channel.send(content);
    await interaction.reply({ content: 'Message sent!', ephemeral: true });
}

async function messageEdit(interaction, server, prisma, pCfg){
    const content = interaction.options.getString('content');
    const message = interaction.options.getString('message');

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

    //Edit message
    await msg.edit(content);
    await interaction.reply({ content: 'Message edited!', ephemeral: true });
}