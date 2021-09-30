const Discord = require('discord.js');
const roxo = '6034b2'


module.exports = {
    playMessage(author, videoTitle = 'Sem titulo', urlThumb = '', urlVideo = '', videoAuthor = '') {
        try {
            const embed = new Discord.MessageEmbed()
            //.setDescription(videoTitle)
            .addField(videoTitle, ` de ${videoAuthor}`)
            .setColor(roxo)
            .setThumbnail(urlThumb)
            .setURL(urlVideo)
            .setAuthor(author.username + " | " + `🎵🎧😼 Tocando agora 🎶🎸🤠`, author.avatarURL())
    
            return embed
        }
        catch(e) {
            console.log(e)
            return `🎵🎧😼 Tocando **${videoTitle}** ! 🎶🎸🤠 ${e}`
        }
    },

    searchMessage(author, searchParam = '') {
        try {
            const embed = new Discord.MessageEmbed()
            .setDescription(searchParam)
            .setColor(roxo)
            .setAuthor(author.username + " | " + `Buscando 🔍🤔`, author.avatarURL())

            return embed
        }
        catch(e) {
            console.log(e)
            return `Buscando **${searchParam}** 🔍🤔`
        }
    },

    generic(content, content2 ='', image = '') {
        try {
            const embed = new Discord.MessageEmbed()
            .setAuthor(content, image)
            .setDescription(content2)
            .setColor(roxo)
            return embed
        }
        catch(e) {
            console.log(e)
            return content
        }
    }
}