const { PermissionsBitField } = require('discord.js');
module.exports={
    default: async function execute(interaction, server, prisma, pCfg, permissions) {
        //If the user is the developer of the bot
        if(interaction.member.id=="414605608931688449"){
            return true
        }

        //Check if the user is the owner
        if(interaction.member.id==interaction.guild.ownerId){
            return true
        }

        //Check if the manager role is set
        if(server.managerRole!=null){
            //Check if they have the role
            if(interaction.member.roles.cache.has(server.managerRole)){
                return true
            }
        }

        //Check if the user has the permissions required
        if(permissions!=null){
            //Check if they have the permissions
            if(interaction.member.permissions.has(permissions)){
                return true
            }
        }

        if (permissions==null){
            return true
        }
        return false
    }
}