const Discord = require("discord.js");
const botconfig = require("../botconfig.json");
var request = require('request');

module.exports.run = async(bot, message, args) => {
    message.delete();

    let id = args.join(" ");
    request(`https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=` + botconfig.steamKey + `&steamids=${id}`, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            if (body.includes('"NumberOfVACBans":1' || '"NumberOfVACBans":2' || '"NumberOfVACBans":3' || '"NumberOfGameBans":2' || '"NumberOfGameBans":3' && '"DaysSinceLastBan":0' || '"DaysSinceLastBan":1' || '"DaysSinceLastBan":2')) {
                let checkBanned = new Discord.RichEmbed()
                    .setDescription("Discord Steam feature BOT by OurmineOGTv")
                    .setColor("#00ff08")
                    .addField(`:tada: [${id}](https://steamcommunity.com/profiles/${id}) is banned.`, "Credits: OurmineOGTv | **OGTvDevils.eu**")
                    .setFooter("Powered by ©2019 - 2019 OGTVDevils.eu");
                message.channel.send(checkBanned).then(m => m.delete(20000));
            } else {
                let checkNoBanned = new Discord.RichEmbed()
                    .setDescription("Discord Steam feature BOT by OurmineOGTv")
                    .setColor("#00ff08")
                    .addField("Credits: OurmineOGTv | **OGTvDevils.eu**", `${id} is not banned.`)
                    .setFooter("Powered by ©2019 - 2019 OGTVDevils.eu");
                message.channel.send(checkNoBanned).then(m => m.delete(20000));
            }

        } else {
            let checkBannedError = new Discord.RichEmbed()
                .setDescription("Discord Steam feature BOT by OurmineOGTv")
                .setColor("#f50000")
                .addField("Credits: OurmineOGTv | **OGTvDevils.eu**", "Steam Error.. Please try again later..")
                .setFooter("Powered by ©2019 - 2019 OGTVDevils.eu");
            message.channel.send(checkBannedError).then(m => m.delete(20000));
        }
    });

    // suppress the direct output of the call. you can expand the result below
    "Checking ban..."
}

module.exports.help = {
    name: "check"
}