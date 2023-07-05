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
    const removable=split[2]
    //Check if the role exists
    let role=await interaction.guild.roles.fetch(roleID)
    if (!role){
        await interaction.reply({ content: 'Role not found!', ephemeral: true });
        return;
    }
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
        //Add it
        await interaction.member.roles.add(roleID)
        await interaction.reply({ content: 'Role added!', ephemeral: true });
    }
}