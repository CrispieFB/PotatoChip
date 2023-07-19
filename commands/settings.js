const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
require('dotenv').config()
module.exports = {
	permissions: [PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ManageGuild, PermissionsBitField.Flags.ManageRoles],
	data: new SlashCommandBuilder()
		.setName('settings')
		.setDescription('Change bot settings.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('embed-color')
                .setDescription('Change the color of the embeds sent by the bot.')
                .addStringOption(option => option.setName('color').setDescription('The color of the embeds. (Hexidecimal)').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('manager-role')
                .setDescription('Set a role that overrides the permissions required to use ALL COMMANDS.')
                .addRoleOption(option => option.setName('role').setDescription('The role to set as the manager role.').setRequired(true))),
	async execute(interaction, server, prisma, pCfg) {
		switch (interaction.options.getSubcommand()) {
			case 'embed-color':
                await embedColor(interaction, server, prisma, pCfg);
                break;
            case 'manager-role':
                await managerRole(interaction, server, prisma, pCfg);
                break
			default:
				await interaction.reply({ content: 'Invalid subcommand!', ephemeral: true });
				break;		
		}

	},
};
async function embedColor(interaction, server, prisma, pCfg){
    let color=interaction.options.getString('color');
    color=color.replace('#', '');
    //Check if color is valid
    if(!color.match(/^([0-9a-f]{3}){1,2}$/i)){
        await interaction.reply({ content: 'Invalid color!', ephemeral: true });
        return;
    }
    //Update color  
    await prisma.Server.update({
        where: {
            guildId: String(interaction.guild.id)
        },
        data: {
            embedColor: color
        }
    })
    await interaction.reply({ content: `Embed color set to #${color}!`, ephemeral: true });
}
async function managerRole(interaction, server, prisma, pCfg){
    const role = interaction.options.getRole('role');
    let roleId=role.id;
    //Update role
    await prisma.Server.update({
        where: {
            guildId: String(interaction.guild.id)
        },
        data: {
            managerRoleId: roleId
        }
    })
    await interaction.reply({ content: `Manager role set to <@&${role.id}>!`, ephemeral: true });
}