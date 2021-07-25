const Discord = require("discord.js");
const config = require('./config/config.json');

const client = new Discord.Client({
    restTimeOffset: 0, // reaction speed
    presence: {
        status: "dnd",
        activity: {
            name: "Project inco",
            type: "PLAYING"
        }
    }
});

const Distube = require('distube');

const distube = new Distube(client, {
    searchSongs: false,
    emitNewSongOnly: false,
    highWaterMark: 1024*1024*64,
    leaveOnEmpty: true,
    leaveOnStop: true,
    leaveOnFinish: true,
    youtubeDL: true,
    updateYouTubeDL: true
    // youtubecookie prevent ERROR ---> "429",
    // custom filters {object}
})

client.login(config.token)
client.on("ready", () => {
    console.log(`${client.user.tag} is online.`)
})

client.on("message", (message) => {
    if (!message.guild) {
        return;
    }
    if (message.author.bot) return;

    const args = message.content.slice(config.prefix.length).split(" ");

    const command = args.shift();

    if (command === "ping") { 
        return message.reply(`${client.ws.ping}ms`)
    }
    else if (command === "play") {
        distube.play(message, args.join(" "))
        return;
    }
    else if (command === "stop") {
        distube.stop(message);
        return message.reply("Music Stopped.")
    }
    else if (command === "skip") {
        distube.skip(message);
        return message.reply("Music Skipped.")
    }
})

// Queue status template
const status = (queue) => `Volume: \`${queue.volume}%\` | Filter: \`${queue.filter || "Off"}\` | Loop: \`${queue.repeatMode ? queue.repeatMode == 2 ? "All Queue" : "This Song" : "Off"}\` | Autoplay: \`${queue.autoplay ? "On" : "Off"}\``;

// DisTube event listeners, more in the documentation page
distube
    //ONCE A SONG STARTS PLAYING SEND INFORMATIONAL MESSAGE
    .on("playSong", (message, queue, song) => message.channel.send(
        `Playing \`${song.name}\` - \`${song.formattedDuration}\`\nRequested by: ${song.user}\n${status(queue)}`
    ))
    //ONCE A SONG IS ADDED TO THE QUEUE SEND INFORMATIONAL MESSAGE
    .on("addSong", (message, queue, song) => message.channel.send(
        `Added ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user}`
    ))
    //ONCE A PLAYLIST STARTS PLAYING SEND INFORMATIONAL MESSAGE
    .on("playList", (message, queue, playlist, song) => message.channel.send(
        `Play \`${playlist.name}\` playlist (${playlist.songs.length} songs).\nRequested by: ${song.user}\nNow playing \`${song.name}\` - \`${song.formattedDuration}\`\n${status(queue)}`
    ))
    //ONCE A PLAYLIST IS ADDED TO THE QUEUE SEND INFORMATIONAL MESSAGE
    .on("addList", (message, queue, playlist) => message.channel.send(
        `Added \`${playlist.name}\` playlist (${playlist.songs.length} songs) to queue\n${status(queue)}`
    ))
    // DisTubeOptions.searchSongs = true
    .on("searchResult", (message, result) => {
        let i = 0;
        message.channel.send(`**Choose an option from below**\n${result.map(song => `**${++i}**. ${song.name} - \`${song.formattedDuration}\``).join("\n")}\n*Enter anything else or wait 60 seconds to cancel*`);
    })
    // DisTubeOptions.searchSongs = true
    .on("searchCancel", (message) => message.channel.send(`Searching canceled`))
    .on("error", (message, e) => {
        console.error(e)
        message.channel.send("An error encountered: " + e);
    });