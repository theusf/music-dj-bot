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
            skip(message, serverQueue);
            return;
        }
        else if (message.content.startsWith(`${prefix}play`) ||
        message.content.startsWith(`${prefix}p`) ||
        message.content.startsWith(`${prefix}P`)) {
            searchAndPlay(message, serverQueue);
        }
        else if (message.content.startsWith(`${prefix}clear`)) {
            clearQueue(message, serverQueue);
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

async function clearQueue(message, serverQueue) {
    serverQueue.songs = [];
    queue.set(message.guild.id, serverQueue)
    return message.channel.send(messages.generic('A fila foi limpa com sucesso 🎶👽'))
}

async function skip(message, serverQueue) {
    if (!serverQueue) {
        return;
    }

    return play(message.guild, message, serverQueue, '', true)
}

async function searchAndPlay(message, serverQueue) {
    try {
        let sanitized_message = message.content.replace(`${prefix}busca`, '')
        sanitized_message = sanitized_message.replace('-p', '');
        sanitized_message = sanitized_message.trim();

        if (!sanitized_message) {
            return message.channel.send(`Faltando o que buscar né o idiota burro panaca`);
        }

        const search_param = sanitized_message


        const videos = await youtube.search(search_param);

        if (videos.length == 0) {
            return message.channel.send(`Não achei nenhum vídeo no youtube com ${search_param} 🙅‍♂️❌`);
        }

        const video = videos[0]

        const url = video.snippet.url;

        execute(message, serverQueue, url)
    }
    catch (err) {
        if (err.status == 403) {
            searchAndPlay(message, serverQueue);
            return;
        }
        message.channel.send(`Cara buguei, fala com o Shiro 😢: ${err.message}`);
    }

}


async function execute(message, serverQueue, url = "") {
    try {
        voiceChannel = message.member.voice.channel;

        if (!serverQueue) {
            serverQueue = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: false,
            };

            queue.set(message.guild.id, serverQueue);
        }

        var connection = await voiceChannel.join();

        serverQueue.connection = connection;

        play(message.guild, message, serverQueue, url);


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

async function play(guild, message, serverQueue, url = '', skip = false) {
    //const serverQueue = queue.get(guild.id);
    if (!url) 
        url = serverQueue.songs.shift();

    try {
        if (!url && skip && serverQueue.songs.length == 0) {
            message.channel.send(messages.generic('Sem músicas restantes na fila 🙅‍♂️❌', '', bot.avatar))
            return stop(message, serverQueue)
        }

        if (!url) {
            return;
        }

        try {
            
            const songInfo = await ytdl.getInfo(url);
            const song = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url,
                thumb: songInfo.videoDetails.thumbnails[0].url,
                singer: songInfo.videoDetails.author.name
            };
    
            if (!song) {
                //serverQueue.voiceChannel.leave();
                //queue.delete(guild.id);
                return message.channel.send(messages.generic(`Vídeo não encontrado`, '', bot.avatar));
            }

            if (serverQueue.playing && !skip) {
                serverQueue.songs.push(url)
                return message.channel.send(messages.addedToQueue(message.author, 
                    song.title, 
                    song.thumb, 
                    song.url,
                    song.singer))
            }

            const dispatcher = serverQueue.connection.play(await ytdl(url, {filter: 'audioonly',  quality: 'highestaudio',
            highWaterMark: 1 << 25}), { type: 'opus' } )
                .on('start', () => {
                    serverQueue.playing = true;

                    message.channel.send(
                        messages.playMessage(
                        message.author, 
                        song.title, 
                        song.thumb, 
                        song.url,
                        song.singer), 
                        buttonStop);
                    
                })
                .on('finish',() => {
                    serverQueue.playing = false;
                    play(message.guild, message, serverQueue);
                })
                .on('error', error => {
                    console.error(error);
                    if (error.status == 403) {
                        serverQueue.songs.unshift(url);
                        return play(guild, message, serverQueue, url, skip);
                    }
                    serverQueue.voiceChannel.leave();

                    queue.delete(guild.id);
                    
                    return message.channel.send(messages.generic(`Ocorreu um erro!, ${error}`, bot.avatar));

                });

            dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
        }
        catch (e) {
            return message.channel.send(messages.generic('Erro ao tentar tocar som', 'Entre em contato com o Shiro 😁 ' + JSON.stringify(e), bot.avatar));
            //throw new Error(e)
            //serverQueue.voiceChannel.leave();
        }
    }
    catch (err) {
        console.log(err);

        queue.delete(message.guild.id);

       // if (serverQueue)
         //   serverQueue.voiceChannel.leave();

        return message.channel.send(messages.generic('Erro ao tentar tocar som', 'Entre em contato com o Shiro 😁 ' + JSON.stringify(e), bot.avatar));
    }

}

module.exports = {
    bot
}