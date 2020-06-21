const ytdl = require('ytdl-core');
const Discord = require('discord.js');
const queue = new Map();


const {
    prefix,
    token,
} = require('./config.json');


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
  
    if (message.author.bot) return; // if message from bots

    if (!message.content.startsWith(prefix)) return; // if dont start with prefix

    const serverQueue = queue.get(message.guild.id);

    if (message.content.startsWith(`${prefix}play`)) {
        execute(message, serverQueue);
        return;
       } 
       else if (message.content.startsWith(`${prefix}skip`)) {
        skip(message, serverQueue);
        return;
       } 
       else if (message.content.startsWith(`${prefix}stop`)) {
        stop(message, serverQueue);
        return;
       } 
       else {
        message.channel.send('You need to enter a valid command!')
       }
       

    });




async function execute(message, serverQueue) {
    
    const voiceChannel = message.member.voice.channel ;
    //console.log(message)
    //console.log(message.member)
   // console.log(message.member.voice.channel )

    const songInfo = await ytdl.getInfo('https://www.youtube.com/watch?v=snphzO9UFJM&t=3373s');

    //console.log(songInfo);

    const song = {
		title: songInfo.title,
		url: songInfo.video_url,
    };
    
  //  console.log(song)

    const queueContruct = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true,
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);
    

    try {
        var connection = await voiceChannel.join();
        queueContruct.connection = connection;
        play(message.guild, queueContruct.songs[0]);
    } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        return message.channel.send(err);
    }

    play(message.guild, queueContruct.songs[0]);
    
    return message.channel.send(`${song.title} is now playing!`);

   }


function skip(message, serverQueue) {
    if (!message.member.voiceChannel) 
        return message.channel.send('You have to be in a voice channel to stop the music!');
    if (!serverQueue) 
        return message.channel.send('There is no song that I could skip!');

        const voiceChannel = message.member.voice.channel ;
      voiceChannel.leave();

}

function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
    }


    const stream = ytdl(song.url,  { filter: 'audioonly' });

	const dispatcher = serverQueue.connection.play(stream)
		.on('end', () => {
			console.log('Music ended!');
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => {
			console.error(error);
        });
        
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}

