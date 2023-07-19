module.exports = {execute};
const { SlashCommandBuilder, EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
async function execute(interaction, server, prisma, pCfg){
    //Split by :
    let split=interaction.customId.split(":")
    //Determine function
    switch(split[0]){
        case "reactionrole":
            await reactionrole(interaction, server, prisma, pCfg, split)
            break;
        case "form":
            await form(interaction, server, prisma, pCfg, split)
            break;
        default:
            await interaction.reply({ content: 'Button not found.', ephemeral: true });
            return;
    }
}

async function reactionrole(interaction, server, prisma, pCfg, split){
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
        return
    }
}
async function form(interaction, server, prisma, pCfg, split){
    //Get the name
	let id = split[1]
	//Find matching form
	let form = await prisma.form.findFirst({
		where: {
			guildId: String(interaction.guild.id),
			id: Number(id)
		},
		include: {
			fields: true
		}
	})
	//Check if the form exists
	if (form==null || form.length==0){
		await interaction.reply({ content: `Form ${name} does not exist!`, ephemeral: true });
		return;
	}
	//Check if the form is enabled
	if (!form.enabled){
		await interaction.reply({ content: `This form is not accepting responses.`, ephemeral: true });
		return;
	}
	//Check if the user has submitted the max number of responses
	let responses = await prisma.formResponse.findFirst({
		where: {
			formId: form.id,
			userId: interaction.user.id
		}
	})
	//Check if the user exists
	if (responses!=null && responses.length!=0){
		//Check if the user has submitted the max number of responses
		if (responses.count>=form.maxResponses && form.maxResponses!=0){
			await interaction.reply({ content: `You have already submitted the max number of responses!`, ephemeral: true });
			return;
		}
	}
	//Create the form
	let modal = new ModalBuilder()
		.setCustomId(`formRes:${form.id}`)
		.setTitle(`${form.name}`)
		//Add the components
		for (field of form.fields){
			//Create the text input
			let textInput = new TextInputBuilder()
				.setCustomId(`${field.id}`)
				.setLabel(field.name)
				.setMinLength(10)
				.setMaxLength(100)
				.setPlaceholder(field.placeholder)
                .setRequired(field.isRequired);
			if(field.style=='SHORT'){
				textInput.setStyle(TextInputStyle.Short)
			}else{
				textInput.setStyle(TextInputStyle.Paragraph)
			}
			//Add the text input to the modal
			let row=new ActionRowBuilder().addComponents(textInput)
			modal.addComponents(row)
		}
	//Display the form
	await interaction.showModal(modal)
    return
}