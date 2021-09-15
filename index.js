//const ytdl = require('ytdl-core');
const Discord = require('discord.js');
const queue = new Map();
const ytdl = require('ytdl-core-discord');
const youtube = require('youtube-search-without-api-key');
const disbut = require('discord-buttons');

require('dotenv').config();

const token = process.env.TOKEN;
const prefix = '-';

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
disbut(client);

client.login(token);

client.once('ready', async () => {
    console.log('Ready!');
});

client.once('reconnecting', () => {
    console.log('Reconnecting!');
});

client.once('disconnect', () => {
    console.log('Disconnect!');
});

let buttonStop = new disbut.MessageButton()
    .setStyle('red') //default: blurple
    .setLabel('PARAR') //default: NO_LABEL_PROVIDED
    .setID('btnStop') //note: if you use the style "url" you must provide url using .setURL('https://example.com')


client.on('clickButton', async (button) => {
    if (button.id === "btnStop") {
        try {
            await button.reply.defer()
            const serverQueue = queue.get(button.message.guild.id);
            stop(button.message, serverQueue);

        }
        catch (e) {
            console.log('Erro')
        }
    }
})


client.on('message', async message => {

    try {
        if (message.author.bot) return; // if message from bots

        if (!message.content.startsWith(prefix)) return; // if dont start with prefix

        const serverQueue = queue.get(message.guild.id);

        if (message.content.startsWith(`${prefix}lofi`)) {
            execute(message, serverQueue);
            return;
        }
        else if (message.content.startsWith(`${prefix}stop`)) {
            stop(message, serverQueue);
            return;
        }
        else if (message.content.startsWith(`${prefix}skip`)) {
            execute(message, serverQueue);
            return;

        }
        else if (message.content.startsWith(`${prefix}stop`)) {
            stop(message, serverQueue);
            return;
        }
        else if (message.content.startsWith(`${prefix}play`)) {
            searchAndPlay(message, serverQueue);
        }
        else if (message.content.startsWith(`${prefix}p`)) {
            searchAndPlay(message, serverQueue);
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

async function searchAndPlay(message, serverQueue) {
    try {
        let sanitized_message = message.content.replace(`${prefix}busca`, '')
        sanitized_message = sanitized_message.replace('-p', '');
        sanitized_message = sanitized_message.trim();

        if (!sanitized_message) {
            return message.channel.send(`Faltando o que buscar né o idiota`);
        }

        const search_param = sanitized_message

        console.log(search_param)

        message.channel.send(`Buscando **${search_param}** 🔍🤔`);

        const videos = await youtube.search(search_param);

        if (videos.length == 0) {
            return message.channel.send(`Não achei nenhum vídeo no youtube com ${search_param} 🙅‍♂️❌`);
        }

        const video = videos[0]

        const url = video.snippet.url;

        execute(message, serverQueue, url)
    }
    catch (err) {
        message.channel.send(`Cara buguei, fala com o Shiro 😢: ${err.message}`);
    }

}


async function execute(message, serverQueue, url = "") {

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

        play(message.guild, message, url);


    } catch (err) {
        console.log(err);

        queue.delete(message.guild.id);

        if (serverQueue)
            serverQueue.voiceChannel.leave();

        return message.channel.send(`Cara buguei, fala com o Shiro 😢: ${err.message}`);
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

async function play(guild, message, url = "") {
    const serverQueue = queue.get(guild.id);

    try {

        url ? url : url = playlist_urls[Math.floor(Math.random() * playlist_urls.length)];

        try {
            const songInfo = await ytdl.getInfo(url);

            const song = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url,
            };

            if (!song) {
                serverQueue.voiceChannel.leave();
                queue.delete(guild.id);
                message.channel.send(`Vídeo não encontrado!`);
                return;
            }

            console.log(song)

            const dispatcher = serverQueue.connection.play(await ytdl(url), { type: 'opus' })
                .on('start', () => {
                    message.channel.send(`🎵🎧😼 Tocando **${song.title}** ! 🎶🎸🤠`);
                    message.channel.send(`${song.url}`, buttonStop);
                })
                .on('end', () => {
                    console.log('Fim da música!');
                    //serverQueue.songs.shift();
                    serverQueue.playing = false;
                    message.channel.send(`A música acabou, indo para a próxima 🎼`);

                    play(guild, message);
                })
                .on('error', error => {
                    console.error(error);

                    serverQueue.voiceChannel.leave();

                    queue.delete(guild.id);

                    return message.channel.send(`Ocorreu um erro! ${error}`);

                });

            dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
        }
        catch (e) {
            message.channel.send(`Erro ao tentar tocar som ${url} : ${e.message}`);
            serverQueue.voiceChannel.leave();
        }
    }
    catch (err) {
        console.log(err);

        queue.delete(message.guild.id);

        if (serverQueue)
            serverQueue.voiceChannel.leave();

        return message.channel.send(`An error happened and i cant play 😢: ${err.message}`);
    }

}


