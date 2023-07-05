const axios = require('axios');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
require('dotenv').config()
module.exports = {
	data: new SlashCommandBuilder()
		.setName('crisp')
		.setDescription('Sends a random image of a crispy snack.'),
	async execute(interaction, server) {
        //Get image
        let response;
        try{
            response=await axios.get('https://crispapi.crispie.ovh/api/random')
        }catch(e){
            await interaction.reply({ content: `Failed to fetch an image.`, ephemeral: true });
            return;
        }
		//Create embed
		const embed = new EmbedBuilder()
			.setColor(server.embedColor)
			.setTitle('Here\'s a crispie delight.')
			.setImage(response.data.content)
			.setTimestamp()
			.setFooter({text:process.env.VERSION})
		await interaction.reply({ embeds: [embed] });
	},
};