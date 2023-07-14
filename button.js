module.exports = {execute};
async function execute(interaction, server, prisma){
    //Split by :
    let split=interaction.customId.split(":")
    //Determine function
    switch(split[0]){
        case "reactionrole":
            await reactionrole(interaction, server, prisma, split)
            break;
    }
}

async function reactionrole(interaction, server, prisma, split){
    const roleID=split[1]
    const configId=Number(split[2])
    //Check if the role exists
    let role=await interaction.guild.roles.fetch(roleID)
    if (!role){
        await interaction.reply({ content: 'Role not found!', ephemeral: true });
        return;
    }
    //Get the role config
    let roleConfig=await prisma.reactionRoles.findUnique({
        where: {
            id: configId
        },
        include: {
            roles: true
        }
    })
    //Check if the role config exists
    if (roleConfig==null || roleConfig.length==0){
        await interaction.reply({ content: 'Role config not found!', ephemeral: true });
        return;
    }
    //Check if the role is removable
    let configRole=roleConfig.roles.find(r => r.roleId==roleID)
    let removable=configRole.removable
    let unique=roleConfig.exclusive
            
    //Check if the user has the role
    if (interaction.member.roles.cache.has(roleID)){
        //Remove it if it is removable
        if (removable){
            await interaction.member.roles.remove(roleID)
            await interaction.reply({ content: 'Role removed!', ephemeral: true });
        }else{
            await interaction.reply({ content: 'You cannot remove this role!', ephemeral: true });
        }
    }else{
        //Check if they have any of the other roles in the config
        let hasRole=false
        if (unique){
            //Get the roles they have
            let roles=interaction.member.roles.cache
            //Check if they have any of the other roles
            for (role of roleConfig.roles){
                if (roles.has(role.roleId)){
                    hasRole=true
                    //Check if the role is removable
                    if (role.removable){
                        await interaction.member.roles.remove(role.roleId)
                    }else{
                        await interaction.reply({ content: 'You can only have one of these roles and your current role is not removable!', ephemeral: true });
                        return;
                    }
                }
            }
        }
        //Add it
        await interaction.member.roles.add(roleID)
        if(hasRole){
            await interaction.reply({ content: 'Role changed!', ephemeral: true });
            return;
        }
        await interaction.reply({ content: 'Role added!', ephemeral: true });
    }
}