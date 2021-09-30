//const ytdl = require('ytdl-core');
const Discord = require('discord.js');
const queue = new Map();
const ytdl = require('ytdl-core-discord');
const youtube = require('./libs/youtube-search-without-api-key');
const disbut = require('discord-buttons');
const messages = require('./messages')
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

let bot;

client.login(token);

client.once('ready', async () => {
    console.log('Ready!');

    bot = {
        name: client.user.username,
        avatar: client.user.avatarURL(),
    }
});

client.once('reconnecting', () => {
    console.log('Reconnecting!');
});

client.once('disconnect', () => {
    console.log('Disconnect!');
});

let buttonStop = new disbut.MessageButton()
    .setStyle('red') //default: blurple
    .setLabel('Parar 🛑') //default: NO_LABEL_PROVIDED
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
            stop(message, serverQueue);
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
            message.channel.send(">" + " **Comando inválido**")
            message.channel.send(`
> -p ou -play ➡ *Busca e toca música do youtube*
> -skip ou -stop ➡ *Para de tocar música*
> -lofi ➡ *Toca lofi de minecraft aleatório*
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

        //message.channel.send(messages.searchMessage(message.author, search_param));

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

        const queueConstruct = queue.get(message.guild.id) || {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: false,
        };

        queue.set(message.guild.id, queueConstruct);

        if (queueConstruct.playing)
            return 

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

    if (!serverQueue)
        return message.channel.send(messages.generic(`Ta chapando?`, 'Não estou tocando nada agora.', bot.avatar));

    serverQueue.voiceChannel.leave();

    queue.delete(message.guild.id);

}

async function play(guild, message, url = "") {
    const serverQueue = queue.get(guild.id);
    
    try {

        url ? url : url = playlist_urls[Math.floor(Math.random() * playlist_urls.length)];

        try {
            const songInfo = await ytdl.getInfo(url);
            //console.log(songInfo)
            const song = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url,
                thumb: songInfo.videoDetails.thumbnails[0].url,
                singer: songInfo.videoDetails.author.name
            };

            //console.log(songInfo)

            if (!song) {
                serverQueue.voiceChannel.leave();
                queue.delete(guild.id);
                message.channel.send(messages.generic(`Vídeo não encontrado!`));
                return;
            }

            const dispatcher = serverQueue.connection.play(await ytdl(url), { type: 'opus' })
                .on('start', () => {
                    message.channel.send(
                        messages.playMessage(
                        message.author, 
                        song.title, 
                        song.thumb, 
                        song.url,
                        song.singer), 
                        buttonStop);
                    
                })
                .on('end', () => {
                    console.log('Fim da música!');
                    //serverQueue.songs.shift();
                    serverQueue.playing = false;
                    //message.channel.send(`A música acabou, indo para a próxima 🎼`);

                    play(guild, message);
                })
                .on('finish',() => {
                    serverQueue.playing = false;
                    message.channel.send(messages.generic('O som que estava tocando acabou.', '', bot.avatar))
                })
                .on('error', error => {
                    console.error(error);

                    serverQueue.voiceChannel.leave();

                    queue.delete(guild.id);

                    return message.channel.send(messages.generic(`Ocorreu um erro!, ${error}`, bot.avatar));

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


module.exports = {
    bot
}