const Discord = require("discord.js");

module.exports.run = async(bot, message, args) => {
    message.delete();
    let steamID = args.join(" ");

    console.log(message.member.user.username + " Reporting this SteamID: " + steamID + " Sent report time: " + message.createdAt);

    var fs = require("fs"),
        Steam = require("steam"),
        SteamID = require("steamid"),
        IntervalIntArray = {},
        readlineSync = require("readline-sync"),
        Protos = require("../protos/protos.js"),
        CountReports = 0,
        Long = require("long"),
        SteamClients = {},
        SteamUsers = {},
        SteamGCs = {},
        SteamFriends = {},
        process = require("process"),
        ClientHello = 4006,
        ClientWelcome = 4004;

    var accounts = [];

    var arrayAccountsTxt = fs.readFileSync("accounts.txt").toString().split("\n");
    for (i in arrayAccountsTxt) {
        var accInfo = arrayAccountsTxt[i].toString().trim().split(":");
        var username = accInfo[0];
        var password = accInfo[1];
        accounts[i] = [];
        accounts[i].push({
            username: username,
            password: password
        });
    }

    var size = 0;
    size = arrayAccountsTxt.length;

    arrayAccountsTxt.forEach(processSteamReport);

    function processSteamReport(element, indexElement, array) {
        if (element != "") {
            var account = element.toString().trim().split(":");
            var account_name = account[0];
            var password = account[1];
            SteamClients[indexElement] = new Steam.SteamClient();
            SteamUsers[indexElement] = new Steam.SteamUser(SteamClients[indexElement]);
            SteamGCs[indexElement] = new Steam.SteamGameCoordinator(SteamClients[indexElement], 730);
            SteamFriends[indexElement] = new Steam.SteamFriends(SteamClients[indexElement]);

            SteamClients[indexElement].connect();

            var sentryfile;
            if (fs.existsSync(account_name + '.sentry')) {
                sentryfile = fs.readFileSync(account_name + '.sentry');
            }

            SteamClients[indexElement].on("connected", function() {
                if (fs.existsSync(account_name + '.sentry')) {
                    SteamUsers[indexElement].logOn({
                        account_name: account_name,
                        password: password,
                        sha_sentryfile: sentryfile
                    });
                } else {
                    SteamUsers[indexElement].logOn({
                        account_name: account_name,
                        password: password
                    });
                }
            });

            SteamClients[indexElement].on("logOnResponse", function(res) {
                if (res.eresult !== Steam.EResult.OK) {
                    if (res.eresult == Steam.EResult.ServiceUnavailable) {
                        let errLoginAcc1 = new Discord.RichEmbed()
                            .setTitle("Error ReportBOT write to: OurmineOGtv")
                            .setDescription("Discord ReportBOT by OurmineOGTv")
                            .setColor("#ff0000")
                            .addField(`[STEAM CLIENT]`, "Login failed - STEAM IS DOWN!")
                            .setFooter("Powered by ©2019 - 2019 OGTVDevils.eu");
                        message.channel.send(errLoginAcc1).then(m => m.delete(60000));
                        //message.channel.send("\n[STEAM CLIENT - Login failed - STEAM IS DOWN!");
                        SteamClients[indexElement].disconnect();
                        process.exit();
                    } else {
                        let errLoginAcc2 = new Discord.RichEmbed()
                            .setTitle("Error ReportBOT write to: OurmineOGtv")
                            .setDescription("Discord ReportBOT by OurmineOGTv")
                            .setColor("#ff0000")
                            .addField(`[STEAM CLIENT]`, account_name.substring(0, 4) + `- Login failed!` + res.eresult)
                            .setFooter("Powered by ©2019 - 2019 OGTVDevils.eu");
                        message.channel.send(errLoginAcc2).then(m => m.delete(60000));
                        //message.channel.send("\n[STEAM CLIENT (" + account_name.substring(0, 4) + "**) - Login failed!" + res.eresult);
                        SteamClients[indexElement].disconnect();
                        SteamClients.splice(indexElement, 1);
                        SteamFriends.splice(indexElement, 1);
                        SteamGCs.splice(indexElement, 1);
                        SteamUsers.splice(indexElement, 1);
                        IntervalIntArray.splice(indexElement, 1);
                    }
                } else {
                    SteamFriends[indexElement].setPersonaState(Steam.EPersonaState.Offline);

                    SteamUsers[indexElement].gamesPlayed({
                        games_played: [{
                            game_id: 730
                        }]
                    });

                    if (SteamGCs[indexElement]) {
                        IntervalIntArray[indexElement] = setInterval(function() {
                            SteamGCs[indexElement].send({
                                msg: ClientHello,
                                proto: {}
                            }, new Protos.CMsgClientHello({}).toBuffer());
                        }, 2000);

                    } else {
                        SteamClients[indexElement].disconnect();
                        SteamClients.splice(indexElement, 1);
                        SteamFriends.splice(indexElement, 1);
                        SteamGCs.splice(indexElement, 1);
                        SteamUsers.splice(indexElement, 1);
                        IntervalIntArray.splice(indexElement, 1);
                    }
                }
            });

            SteamClients[indexElement].on("error", function(err) {

                let errLoginAcc3 = new Discord.RichEmbed()
                    .setTitle("Error ReportBOT write to: OurmineOGtv")
                    .setDescription("Discord ReportBOT by OurmineOGTv")
                    .setColor("#ff0000")
                    .addField(`[STEAM CLIENT]`, indexElement + " Account is probably ingame! Logged out!\n" + err)
                    .setFooter("Powered by ©2019 - 2019 OGTVDevils.eu");
                message.channel.send(errLoginAcc3).then(m => m.delete(60000));
                //message.channel.send("[STEAM CLIENT - " + indexElement + "] Account is probably ingame! Logged out!\n" + err);
                size = size - 1;
                SteamClients[indexElement].disconnect();
                SteamClients.splice(indexElement, 1);
                SteamFriends.splice(indexElement, 1);
                SteamGCs.splice(indexElement, 1);
                SteamUsers.splice(indexElement, 1);
                IntervalIntArray.splice(indexElement, 1);
            });

            SteamGCs[indexElement].on("message", function(header, buffer, callback) {
                switch (header.msg) {
                    case ClientWelcome:
                        clearInterval(IntervalIntArray[indexElement]);


                        IntervalIntArray[indexElement] = setInterval(function() {
                            sendReport(SteamGCs[indexElement], SteamClients[indexElement], account_name, steamID);
                        }, 2000);
                        break;
                    case Protos.ECsgoGCMsg.k_EMsgGCCStrike15_v2_MatchmakingGC2ClientHello:

                        break;
                    case Protos.ECsgoGCMsg.k_EMsgGCCStrike15_v2_ClientReportResponse:
                        CountReports++;
                        message.channel.send(`\`\`\`[Discord Report BOT by OurmineOGTv] - [` + CountReports + `] report with confirmation ID: ` + Protos.CMsgGCCStrike15_v2_ClientReportResponse.decode(buffer).confirmationId.toString() + ` sent!\`\`\``).then(m => m.delete(120000));
                        //message.channel.send("[Discord Report Bot by OGTvDevils.eu] - (" + CountReports + ")] Report with confirmation ID: " + Protos.CMsgGCCStrike15_v2_ClientReportResponse.decode(buffer).confirmationId.toString() + " sent!");
                        if (CountReports == size) {
                            let thxReport = new Discord.RichEmbed()
                                .setDescription("Discord ReportBOT by OurmineOGTv")
                                .setColor("#00ff08")
                                .addField(`[Discord Report BOT by OurmineOGTv] - [` + CountReports + `] Reports for this faggot.\nThanks for using Discord Report Bot by OGTvDevils.eu`, "Credits: OurmineOGTv | **OGTvDevils.eu**")
                                .addField("Check this faggot account: ", `https://steamcommunity.com/profiles/${steamID}`)
                                .setFooter("Powered by ©2019 - 2019 OGTVDevils.eu");
                            message.member.send(thxReport);
                            //message.channel.send("\n\n" + CountReports + " Reports for this faggot.\nThanks for using Discord Report Bot by OGTvDevils.eu");
                        }
                        SteamClients[indexElement].disconnect();
                        SteamClients.splice(indexElement, 1);
                        SteamFriends.splice(indexElement, 1);
                        SteamGCs.splice(indexElement, 1);
                        SteamUsers.splice(indexElement, 1);
                        IntervalIntArray.splice(indexElement, 1);
                        break;
                    default:
                        break;
                }
            });
        }
    }

    function sendReport(GC, Client, account_name) {
        var account_id = new SteamID(steamID).accountid;
        GC.send({
            msg: Protos.ECsgoGCMsg.k_EMsgGCCStrike15_v2_ClientReportPlayer,
            proto: {}
        }, new Protos.CMsgGCCStrike15_v2_ClientReportPlayer({
            accountId: account_id,
            matchId: 8,
            rptAimbot: 2,
            rptWallhack: 3,
            rptSpeedhack: 4,
            rptTeamharm: 5,
            rptTextabuse: 6,
            rptVoiceabuse: 7
        }).toBuffer());
    }

    process.on("uncaughtException", function(err) {});

    let channelInfoEmbed = new Discord.RichEmbed()
        .setDescription("Discord ReportBOT by OurmineOGTv")
        .setColor("#00ff08")
        .addField("Initializing Discord Report Bot by OGTvDevils.eu", "Credits: OurmineOGTv | **OGTvDevils.eu**")
        .setFooter("Powered by ©2019 - 2019 OGTVDevils.eu");
    message.channel.send(channelInfoEmbed).then(m => m.delete(20000));

    let channelInfo2Embed = new Discord.RichEmbed()
        .setDescription("Discord ReportBOT by OurmineOGTv")
        .setColor("#00ff08")
        .addField(`Reporting SteamID: **${steamID}**`, "\nStarting Accounts...")
        .setFooter("Powered by ©2019 - 2019 OGTVDevils.eu");
    message.channel.send(channelInfo2Embed).then(m => m.delete(20000));

}
module.exports.help = {
    name: "report"
}