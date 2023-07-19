const axios = require('axios');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
require('dotenv').config()
module.exports = {
	permissions: null,
	data: new SlashCommandBuilder()
		.setName('femboy')
		.setDescription('Sends a random image of a femboy.'),
	async execute(interaction, server, prisma, pCfg {
        //Get image
        let response;
        try{
            response=await axios.get('https://femboyapi.crispie.ovh/api/random')
        }catch(e){
            await interaction.reply({ content: `Failed to fetch an image.`, ephemeral: true });
            return;
        }
		//Create embed
		const embed = new EmbedBuilder()
			.setColor(server.embedColor)
			.setTitle('Here\'s a femboy.')
			.setImage(response.data.content)
			.setTimestamp()
			.setFooter({text:pCfg.Version})
		await interaction.reply({ embeds: [embed] });
	},
};