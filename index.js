const Discord = require('discord.js');
const auth = require('./tokens.json');
const client = new Discord.Client({
    intents: [ Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_PRESENCES, Discord.Intents.FLAGS.GUILD_MEMBERS ]
});

client.on('ready', () => {
 console.log(`Logged in as ${client.user.tag} at`);
 console.log(Date())
});

client.on('presenceUpdate', async (oldMember, newMember) => {
    const role = newMember.guild.roles.cache.get("932784788115427348");
    const activities = newMember.activities[1];
    
    // 911790844204437504 - Cider
    // 886578863147192350 - Apple Music

    if (activities && (activities.applicationId === ( "911790844204437504" ) || (activities.applicationId === ( "886578863147192350" )))) {
        try {
            let listenerinfo = {
                userid: newMember.userId,
                userName: newMember.member.user.username,
                songName: activities.details
            }

            if (newMember.member._roles.includes("932784788115427348")) {
                console.log("\x1b[2m", "Listener updated -", listenerinfo)
            } else {
                console.log('\x1b[35m%s\x1b[0m', "Listener added -", listenerinfo)
                return newMember.member.roles.add(role)
            }

            if (!newMember.member._roles.includes("932816700305469510")) {
                newMember.member.roles.add("932816700305469510") // Add Cider User role.
            }
        } catch(e) {
            console.log("An error occurred. ",e)
        }
    } else { // Remove role if exists or ignore.
        try {
            if (newMember.member._roles.includes("932784788115427348")) {
                newMember.member.roles.remove("932784788115427348");
                let rmlistenerinfo = {
                    userid: newMember.userId,
                    userName: newMember.member.user.username,
                    dateRemoved: Date()
                }
                console.log("\x1b[33m%s\x1b[0m", "Listener removed -", rmlistenerinfo)
            }
        } catch(e) {
            console.log(e)
        }
    }
})

client.login(auth.token).then();
