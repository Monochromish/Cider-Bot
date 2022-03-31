const Discord = require('discord.js');
const auth = require('./tokens.json');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const deploy = require('./deploy-commands.js');
const { MessageEmbed } = require('discord.js');
const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_PRESENCES, Discord.Intents.FLAGS.GUILD_MEMBERS]
});

let cider_guild = "843954443845238864"

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag} at`);
    console.log(Date())
});



client.on('presenceUpdate', async(oldMember, newMember) => {
    //If role not found in guild, do nothing.
    try { if (oldMember.guild.id !== cider_guild || newMember.guild.id !== cider_guild) return } catch (e) { return }
    // or else it'll go BONK

    const role = newMember.guild.roles.cache.get("932784788115427348");
    let using_cider = false
    for (const activity of newMember.activities) {
        // 911790844204437504 - Cider
        // 886578863147192350 - Apple Music
        if (activity && (activity.applicationId === ("911790844204437504") || (activity.applicationId === ("886578863147192350")))) {
            let listenerinfo = {
                userid: newMember.userId,
                userName: newMember.member.user.username,
                songName: activity.details
            }

            if (newMember.member._roles.includes("932784788115427348")) { // user already has listening role, no need to change roles
                console.log("\x1b[2m", "Listener updated -", listenerinfo)
                return // not changing any roles, just a log
            } else {
                console.log('\x1b[35m%s\x1b[0m', "Listener added -", listenerinfo)
                using_cider = true // code below will handle it
                break
            }
        }
    }
    if (using_cider) {
        try {
            newMember.member.roles.add(role) // add listening on cider role
            if (!newMember.member._roles.includes("932816700305469510")) {
                try {
                    newMember.member.roles.add("932816700305469510")
                } catch (e) {
                    console.log("An error occurred while adding role. ", e)
                } // Add Cider User role.
            }
        } catch (e) {
            console.log("An error occurred. ", e)
        }

    } else { // Remove role if exists or ignore.
        try {
            if (newMember.member._roles.includes("932784788115427348")) {
                try {
                    newMember.member.roles.remove("932784788115427348"); // remove listening on cider role
                } catch (e) {
                    console.log("An error occurred on role removal. ", e)
                }
                let rmlistenerinfo = {
                    userid: newMember.userId,
                    userName: newMember.member.user.username,
                    dateRemoved: Date()
                }
                console.log("\x1b[33m%s\x1b[0m", "Listener removed -", rmlistenerinfo)
            }
        } catch (e) {
            console.log(e)
        }
    }
})

client.on('messageCreate', async message => {
    if (message.author.bot) return

    if (String(message).includes('turn on lossless') || String(message).includes('is lossless')) {
        const embed = new Discord.MessageEmbed()
        .setColor('#fb003f')
        .setTitle("Notice on Lossless Support in Cider")
        .setDescription("Lossless playback is not currently supported in Cider. This is due to MusicKit not having lossless capability.")
        .setFooter({ text: "Requested by " + message.author.username, iconURL: message.author.avatarURL() })
        .setTimestamp()
        return message.channel.send({ embeds: [embed] });
    } else if (message.content.match(/^(?!cider:\/\/).+(music\.apple\.com)([^\s]+)/gi)) {
        const link = message.content.match(/^(?!cider:\/\/).+(music\.apple\.com)([^\s]+)/gi)
        console.log("[Link] Creating redirect embed.")
        try {
            fetch(link).catch(e => console.log("[Link] Error creating redirect embed."))
                .then(result => result.text()).catch(e => null)
                .then(html => {
                    const $ = cheerio.load(html)
                    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || $('meta[name="title"]').attr('content')
                    const description = $('meta[property="twitter:description"]').attr('content') || $('meta[name="twitter:description"]').attr('content')
                    const image = $('meta[property="og:image"]').attr('content') || $('meta[property="og:image:url"]').attr('content')
                    const modlink = link[0].replace('https://', '')
                    const play_link = "https://cider.sh/p?" + modlink
                    const view_link = "https://cider.sh/o?" + modlink
                    const embed = new Discord.MessageEmbed()
                        .setColor('#fb003f')
                        .setTitle(title)
                        .setURL(link.toString())
                        .setThumbnail(image)
                        .setDescription(description)
                        .setFooter({ text: "Shared by " + message.author.username, iconURL: message.author.avatarURL() })
                        .setTimestamp()
                    const interaction = new Discord.MessageActionRow()
                        .addComponents(
                            new Discord.MessageButton()
                            .setLabel('Play In Cider')
                            .setStyle('LINK')
                            .setURL(play_link),
                            new Discord.MessageButton()
                            .setLabel('View In Cider')
                            .setStyle('LINK')
                            .setURL(view_link)
                        )
                    try {
                        message.delete()
                        return message.channel.send({ embeds: [embed], components: [interaction] });
                    } catch (e) {}
                }).catch(e => null)
        } catch (e) {}
    }

    


})
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const { commandName } = interaction;
    if (commandName === 'nightly' || commandName === 'branchbuilds') {
        let branch = interaction.options.getString('branch') || 'main'
        let show = interaction.options.getBoolean('show') || false
        let buttons = new Discord.MessageActionRow()
        let releases = await fetch(`https://api.github.com/repos/ciderapp/cider-releases/releases`)
        releases = await releases.json()
        for (let release of releases) {
            if (String(release.name).split(' ')[String(release.name).split(' ').length - 1].replace(/[(+)]/g, '') === branch) {
                release = await fetch(`https://api.github.com/repos/ciderapp/cider-releases/releases/${release.id}/assets`)
                release = await release.json()
                release.forEach(element => {
                    if (String(element.name).split('.')[String(element.name).split('.').length - 1] == 'yml') return;
                    else if (String(element.name).split('.')[String(element.name).split('.').length - 1] == 'blockmap') return;
                    else if (String(element.name).split('-')[String(element.name).split('-').length - 3] == 'winget') return;
                    buttons.addComponents(
                        new Discord.MessageButton()
                        .setLabel(`.${String(element.name).split('.')[String(element.name).split('.').length - 1]}`)
                        .setStyle('LINK')
                        .setURL(element.browser_download_url)
                    )
                })
                break;
            }
        }
        if (buttons.components.length == 0) {
            await interaction.reply({ content: `I have failed to retrieve any installers from the **${branch}** branch.`, ephemeral: !show })
        } else {
            await interaction.reply({ content: `What installer do you want from the **${branch}** branch?`, ephemeral: !show, components: [buttons] })
        }
    } else if (commandName === 'macos') {
        let buttons = new Discord.MessageActionRow()
        buttons.addComponents(
            new Discord.MessageButton()
            .setLabel(`.dmg (Universal)`)
            .setStyle('LINK')
            .setURL('https://github.com/ciderapp/Cider/releases/download/macos-beta/Cider.dmg')
        )
        buttons.addComponents(
            new Discord.MessageButton()
            .setLabel(`.pkg (Universal)`)
            .setStyle('LINK')
            .setURL('https://github.com/ciderapp/Cider/releases/download/macos-beta/Cider.pkg')
        )

        if (typeof interaction.options.getBoolean('show') == 'undefined') { show = false } else { show = interaction.options.getBoolean('show') }
        await interaction.reply({ content: `Listing available macOS installation packages.`, ephemeral: !show, components: [buttons] })
    } else if (commandName === 'sauceme') {
        let saucerequest = await fetch('https://api.waifu.im/random/?selected_tags=hentai')
        let sauce = await saucerequest.json()
        let buttons = new Discord.MessageActionRow()
        let saucecontent = await sauce.images[0].url;
        let sauceart = await sauce.images[0].source;
        let saucecolor = await sauce.images[0].dominant_color;
        buttons.addComponents(
            new Discord.MessageButton()
            .setLabel("Open in Browser")
            .setStyle('LINK')
            .setURL(saucecontent.toString())
        )
        buttons.addComponents(
            new Discord.MessageButton()
            .setLabel("Open Artist/Source in Browser")
            .setStyle('LINK')
            .setURL(sauceart.toString())
        )
        let embed = new Discord.MessageEmbed()
            .setColor(saucecolor.toString())
            .setTitle("Sauce Randomizer")
            .setURL(saucecontent.toString())
            .setFooter({ text: "Requested by " + interaction.member.user.username, iconURL: interaction.member.user.avatarURL() })
            .setImage(saucecontent.toString())
            .setTimestamp()

        await interaction.reply({ content: `feeling down bad are we?`, embeds: [embed], ephemeral: true, components: [buttons] })
    } else if (commandName === 'marin') {
        let marinrequest = await fetch('https://api.waifu.im/random/?selected_tags=marin-kitagawa')
        let marin = await marinrequest.json()
        let buttons = new Discord.MessageActionRow()
        let marincontent = await marin.images[0].url;
        let marinart = await marin.images[0].source;
        let marincolor = await marin.images[0].dominant_color;
        buttons.addComponents(
            new Discord.MessageButton()
            .setLabel("Open in Browser")
            .setStyle('LINK')
            .setURL(marincontent.toString())
        )
        buttons.addComponents(
            new Discord.MessageButton()
            .setLabel("Open Artist/Source in Browser")
            .setStyle('LINK')
            .setURL(marinart.toString())
        )
        let embed = new Discord.MessageEmbed()
            .setColor(marincolor.toString())
            .setTitle("Marin, my beloved.")
            .setURL(marincontent.toString())
            .setFooter({ text: "Requested by " + interaction.member.user.username, iconURL: interaction.member.user.avatarURL() })
            .setImage(marincontent.toString())
            .setTimestamp()

        await interaction.reply({ content: `marin best girl <3`, embeds: [embed], ephemeral: true, components: [buttons] })
    } else if (commandName === 'donate') {
        let embed = new Discord.MessageEmbed()
            .setColor(client.user.hexAccentColor)
            .setTitle("Donate")
            .setDescription(`You can donate via our Open Collective Organization (<@&923351772532199445>) or via Ko-Fi (<@&905457688211783690>, <@&905457957486067843>). Whichever is most convenient for your country/payment method and both are eligible for a <@&932811694751768656> role.\n\n Some of us also have individual donation links, if you would rather support one person.\n\n  **Note: the payment processor might take a percentage of your donation before the rest reaches to us!**`)
            .setFooter({ text: "Requested by " + interaction.member.user.username, iconURL: interaction.member.user.avatarURL() })
            .setTimestamp()
        let user = interaction.options.getUser('user') || null
        let oc = new Discord.MessageButton()
            .setLabel(`OpenCollective`)
            .setStyle('LINK')
            .setURL(`https://opencollective.com/ciderapp`)
        let kofi = new Discord.MessageButton()
            .setLabel(`Ko-fi`)
            .setStyle('LINK')
            .setURL(`https://ko-fi.com/cryptofyre`)
        let ghSponsors = new Discord.MessageButton()
            .setLabel(`Github Sponsors`)
            .setStyle('LINK')
            .setURL(`https://github.com/sponsors/ciderapp`)

        if (user) {
            client.channels.cache.get(interaction.channelId).send({ content: `${user}`, embeds: [embed], components: [new Discord.MessageActionRow().addComponents([oc, kofi, ghSponsors])] })
        } else {
            client.channels.cache.get(interaction.channelId).send({ embeds: [embed], components: [new Discord.MessageActionRow().addComponents([oc, kofi, ghSponsors])] })
        }
        client.channels.cache.get(interaction.channelId).send({ content: `${user}`, embeds: [embed], components: [new Discord.MessageActionRow().addComponents([oc, kofi, ghSponsors])] })
            await interaction.reply({ ephemeral: true, content: "Sent!" })
    } else if (commandName === 'discordrpc') {
        let embed = new Discord.MessageEmbed()
            .setColor(client.user.hexAccentColor)
            .setTitle("Why is Discord RPC not working?")
            .setURL()
            .setDescription(`Make sure that 'Display current activity as a status message' is enabled in your Activity Status category in the Discord settings. Cider will not appear as a game, so do not manually add it.\n\n If you are using Discord from the Snap Store, you are advised to install from a different source (Discords Website or using another package manager). The Snap Store version of Discord is known to have issues with DiscordRPC. \n\n Ensure that you are running Discord on a level that is below Cider. If Discord is being elevated, Cider will be unable to connect. Furthermore, ensure that Discord is started first. Cider has to connect to Discord and this is only done on Cider's launch. So **make sure Discord is started before Cider.**`)
            .setImage("https://camo.githubusercontent.com/6c8838c5a50fc6f061ead8787e54e4367420bc3169ddbc37e524adb3180a7848/68747470733a2f2f692e696d6775722e636f6d2f337a6e664f4d682e706e67")
            .setFooter({ text: "Requested by " + interaction.member.user.username, iconURL: interaction.member.user.avatarURL() })
            .setTimestamp()
        let user = interaction.options.getUser('user') || null
        if (user) {
            client.channels.cache.get(interaction.channelId).send({ content: `${user}`, embeds: [embed] })
        } else {
            client.channels.cache.get(interaction.channelId).send({ embeds: [embed] })
        }
        await interaction.reply({ ephemeral: true, content: "Sent!" })
    }
})
client.login(auth.token)


// Reload Commands to take into account branch changes
// 20 minutes in milliseconds
setInterval(() => { const deploy = require('./deploy-commands.js'); }, 1200000)