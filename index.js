const ytdl = require('ytdl-core');
const Discord = require('discord.js');
const queue = new Map();

require('dotenv').config();

const token = process.env.TOKEN;
const prefix = '~';


const playlist_urls = [
    'https://www.youtube.com/watch?v=snphzO9UFJM&t=3373s',
    'https://www.youtube.com/watch?v=DtTooerFuiQ&t=13s',
    'https://www.youtube.com/watch?v=0t9JpOJGwlY&t=436s',
    'https://www.youtube.com/watch?v=0KvlwMd3C4Y&t=494s',
    'https://www.youtube.com/watch?v=TsTtqGAxvWk&t=11s',
    'https://www.youtube.com/watch?v=eKVGPqm9ZcY',
    'https://www.youtube.com/watch?v=ND9W43gqxas&t=513s',
    'https://www.youtube.com/watch?v=dIk4rhzs__k',
    'https://www.youtube.com/watch?v=J87x1yMCbCM',
    'https://www.youtube.com/watch?v=M-5zMRLxXcw'
]


const client = new Discord.Client();
client.login(token);


client.once('ready', () => {
    console.log('Ready!');
});

client.once('reconnecting', () => {
    console.log('Reconnecting!');
});

client.once('disconnect', () => {
    console.log('Disconnect!');
});

client.on('message', async message => {

    try {



        if (message.author.bot) return; // if message from bots

        if (!message.content.startsWith(prefix)) return; // if dont start with prefix

        const serverQueue = queue.get(message.guild.id);

        if (message.content.startsWith(`${prefix}play`)) {
            execute(message, serverQueue);
            return;
        }
        else if (message.content.startsWith(`${prefix}stop`)) {
            stop(message, serverQueue);
            return;
        }
        else if (message.content.startsWith(`${prefix}skip`)) {
            execute(message, serverQueue);
        }
        else if (message.content.startsWith(`${prefix}stop`)) {
            stop(message, serverQueue);
            return;
        }
        else {
            message.channel.send(`
        You need to enter a valid command! 
        ~play - to play a random lofi playlist or chnage the playlist
        ~stop - stop playing
        ~skip - stop playing
        `)
        }


    } catch (err) {
        console.log(err);

        queue.delete(message.guild.id);

        if (serverQueue)
            serverQueue.voiceChannel.leave();

        return message.channel.send(`An error happened and i cant play 😢: ${err.message}`);
    }



});


async function execute(message, serverQueue) {

    try {

        voiceChannel = message.member.voice.channel;

        const queueConstruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
        };

        queue.set(message.guild.id, queueConstruct);

        var connection = await voiceChannel.join();

        queueConstruct.connection = connection;

        play(message.guild, message);


    } catch (err) {
        console.log(err);

        queue.delete(message.guild.id);

        if (serverQueue)
            serverQueue.voiceChannel.leave();

        return message.channel.send(`An error happened and i cant play 😢: ${err.message}`);
    }


}


function stop(message, serverQueue) {
    voiceChannel = message.member.voice.channel;

    if (!voiceChannel)
        return message.channel.send('You have to be in a voice channel to stop the music!');
    if (!serverQueue)
        return message.channel.send(`Unfortunately, I'm not playing any lo-fi right now`);

    serverQueue.voiceChannel.leave();

    queue.delete(message.guild.id);

}

async function play(guild, message) {

    try {


        const serverQueue = queue.get(guild.id);

        const url = playlist_urls[Math.floor(Math.random() * playlist_urls.length)];

        const songInfo = await ytdl.getInfo(url);

        const song = {
            title: songInfo.title,
            url: songInfo.video_url,
        };

        if (!song) {
            serverQueue.voiceChannel.leave();
            queue.delete(guild.id);
            return;
        }

        message.channel.send(`${song.title} is now playing!`);

        const stream = ytdl(song.url, { filter: 'audioonly' });

        const dispatcher = serverQueue.connection.play(stream)
            .on('start', () => {
                message.channel.send(`${songInfo.video_url}`);
            })
            .on('end', () => {
                console.log('Music ended!');
                //serverQueue.songs.shift();

                play(guild);
            })
            .on('error', error => {
                console.error(error);

                serverQueue.voiceChannel.leave();

                queue.delete(guild.id);

                return message.channel.send(`Ocorreu um erro! ${error}`);

            });

        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    }
    catch (err) {
        console.log(err);

        queue.delete(message.guild.id);

        if (serverQueue)
            serverQueue.voiceChannel.leave();

        return message.channel.send(`An error happened and i cant play 😢: ${err.message}`);
    }

}


