const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
    data:  new SlashCommandBuilder()
        .setName('nightly')
        .setDescription('Gives you download links for the latest nightly builds')
        .addBooleanOption(option => option.setName('show')
            .setDescription('Show to everyone!')
            .setRequired(false)
        ),
    async execute(interaction) {
        interaction.reply({ content: `${interaction.user}, the \`/nightly\` command has been depricated, pls use the branchbuilds command and select **main** to get the latest release`, ephemeral: !interaction.options.getBoolean('show') })
    },
};
