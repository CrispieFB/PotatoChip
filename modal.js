module.exports = {execute};
const { SlashCommandBuilder, EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
async function execute(interaction, server, prisma, pCfg){
    //Split by :
    let split=interaction.customId.split(":")
    //Determine function
    switch(split[0]){
        case "formRes":
            await formRes(interaction, server, prisma, pCfg, split)
            break;
        default:
            await interaction.reply({ content: 'Form not found.', ephemeral: true });
            return;
    }
}
async function formRes(interaction, server, prisma, pCfg, split){
    //Get the form
    let form=await prisma.form.findFirst({
        where: {
            id: Number(split[1])
        },
        include: {
            fields: true
        }
    })
    //Check if the form exists
    if (form==null || form.length==0){
        await interaction.reply({ content: 'Form not found!', ephemeral: true });
        return;
    }
    //Check if the form is enabled
    if (!form.enabled){
        await interaction.reply({ content: 'This form is not currently accepting submissions.', ephemeral: true });
        return;
    }
    let data=[]
    for(i of interaction.fields.fields){
        let field=i[1]
        let id=field.customId
        let response=field.value
        //Get the field from the database
        let dbField=await prisma.formFields.findFirst({
            where: {
                id: Number(id)
            }
        })
        //Check if the field exists
        if (dbField==null || dbField.length==0){
            await interaction.reply({ content: 'Field not found!', ephemeral: true });
            return;
        }
        let newData={
            value: response,
            field: dbField
        }
        data.push(newData)
    }
    //Check if the user has the max number of submissions
    let submissions=await prisma.formResponse.findMany({
        where: {
            formId: form.id,
            userId: interaction.user.id
        }
    })
    //Check if it exists, if not create
    console.log(submissions)
    if (submissions==null || submissions==undefined || submissions.length==0 || submissions==[]){
        submissions=await prisma.formResponse.create({
            data: {
                formId: form.id,
                userId: interaction.user.id,
            }
        })
    }else{
        if (submissions[0].count>=form.maxResponses && form.maxResponses!=0){
            await interaction.reply({ content: 'You have reached the maximum number of submissions for this form!', ephemeral: true });
            return;
        }
    }
    //Create the embed
    try{
        let embed=new EmbedBuilder()
            .setTitle(`New Submission for \"${form.name}.\"`)
            .setAuthor({name: interaction.user.tag, iconURL: interaction.user.avatarURL()})
            .setTimestamp()
            .setColor(server.embedColor)
            .setFooter({text: `User ID: ${interaction.user.id}`})
            //Add the fields
            for(i of data){
                let field=i.field
                let value=i.value
                embed.addFields({ name: field.name, value: value, inline: false })
            }
        //Send the embed
        let channel=await interaction.guild.channels.fetch(form.responseChannel)
        if (!channel){
            await interaction.reply({ content: 'Response channel not found!', ephemeral: true });
            return;
        }
        await channel.send({embeds: [embed]});
    }catch(err){
        console.log(err)
        await interaction.reply({ content: 'An error occured while sending the response!', ephemeral: true });
        return;
    }
    //Add a submission to the user
    await prisma.formResponse.update({
        where: {
            id: submissions[0].id
        },
        data: {
            count: submissions[0].count+1
        }
    })
    //Send the response
    await interaction.reply({ content: 'Form submitted!', ephemeral: true });
}