import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Events,
  ActivityType,
} from "discord.js";

import APP_CONFIG from "./config.json" assert { type: "json" };
const { prefix, task_types, emojis, kanboard_colors } = APP_CONFIG;

const app = express();
const PORT = process.env.PORT || 8080;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // Allows your bot to receive events related to guilds
    GatewayIntentBits.GuildMessages, // Allows your bot to receive events related to messages
    GatewayIntentBits.MessageContent, // If your bot needs message content
    GatewayIntentBits.GuildMembers, // If your bot interacts with guild members
  ],
});

// ===========> Start: Bot logic
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`UWC Tasks bot is Ready! Logged in as ${readyClient.user.tag}`);
  client.user.setPresence({
    activities: [
      { type: ActivityType.Watching, name: "Projects, use: !task help" },
    ],
    status: "online",
  });
});

client.login(process.env.BOT_TOKEN);

client.on(Events.MessageCreate, async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(" ");
  const command = args.shift().toLowerCase();

  if (command === "server-info") {
    const serverInfo = `**Server name:** ${message.guild.name}\n**Server ID:** ${message.guild.id}`;
    if (serverInfo.trim()) {
      message.channel.send(serverInfo);
    } else {
      message.channel.send("Server information is not available.");
    }
  } else if (command === "channel-info") {
    const channelInfo = `**Channel name:** ${message.channel.name}\n**Channel ID:** ${message.channel.id}`;
    if (channelInfo.trim()) {
      message.channel.send(channelInfo);
    } else {
      message.channel.send("Channel information is not available.");
    }
  } else if (command === "user-info") {
    message.channel.send(
      `**Your username:** ${message.author.username}\n**Your ID:** ${message.author.id}`
    );
  } else if (command === "args-info") {
    if (!args.length) {
      return message.channel.send(
        `You didn't provide any arguments, ${message.author}!`
      );
    }
    message.channel.send(`Command name: ${command}\nArguments: ${args}`);
  } else if (command === "help") {
    const helpEmbed = new EmbedBuilder()
      .setColor(0x003a99)
      .setAuthor({
        name: client.user.username,
        iconURL: "https://apps.umbrella.co/cdn/uw_icon_notify_64x64.png",
      })
      .setDescription(
        `Welcome to ${client.user.username}, a Discord bot that let you receive instant notifications about projects managed on [UW Tasks](https://apps.umbrella.co/tasks/) (Kanboard Projects Management).\n\nThese are the commands available in the ${client.user.username} bot!\n\n> Bot prefix is: \` ${prefix} \``
      )
      .addFields({
        name: "Commands",
        value:
          "`server-info` | `channel-info` | `user-info` | `args-info` | `help`",
      })
      .addFields({ name: "Use example", value: "`!task server-info`" })
      .setTimestamp()
      .setFooter({ text: `${client.user.username} by Umbrella Worldwide!` });
    message.channel.send({ embeds: [helpEmbed] });
  }
});

// ===========> Start: Express server
const resp_data = '{"uwc_tasks":{"online":true,"status":"200"}}';

app.get("/", function (req, res) {
  res.send("<html><head></head><body>UW Tasks</body></html>");
  // res.send('<html><head><script>window.location.href = \'https://google.com/\'</script></head><body>You shouldn\'t be here! <a href=\'https://google.com\'>Exit</a></body></html>');
});

app.post("/", function (req, res) {
  console.log(req);
  res.type("json");
  res.json(resp_data);
  /* Webserver --> Bot */
  res.end();
});

app.post("/notify/send", function (req, res) {
  // console.log({ kanboard_object: req.body });
  res.type("json");
  res.json(resp_data);

  // Proccess data variables
  const data = req.body;
  let description;
  let details_title = "Details";

  switch (data.event_name) {
    case "task.create":
      description = data.event_data.task.description
        ? data.event_data.task.description
        : "*No description provided.*";
      break;
    case "task.file.create":
      description = `File: ${data.event_data.file.name}\nSize: ${bytesToSize(
        data.event_data.file.size,
        " "
      )}`;
      break;
    case "comment.create":
      description = data.event_data.comment.comment;
      details_title = "Comment";
      break;
    case "comment.update":
      description = data.event_data.comment.comment;
      details_title = "Comment";
      break;
    case "subtask.create":
      description = data.event_data.subtask.title;
      break;
    case "subtask.update":
      description = `Title: ${data.event_data.subtask.title}\nStatus: ${
        data.event_data.subtask.status_name
      } ${emojis[data.event_data.subtask.status_name]}`;
      break;
    default:
    // description = data.event_data.task.description ? data.event_data.task.description : '*No description provided.*';
  }

  const notifyEmbed = new EmbedBuilder()
    .setColor(kanboard_colors[data.event_data.task.color_id])
    .setTitle(`${emojis[data.event_name]} ${task_types[data.event_name]}`)
    .setDescription(
      `${data.event_title}\n\n**Project:** ${data.project_name}\n**Task:** [#${data.event_data.task.id}] ${data.event_data.task.title}`
    )
    .setTimestamp();

  if (description) {
    notifyEmbed.addFields({ name: details_title, value: description });
  }

  notifyEmbed.addFields({
    name: "Task Links",
    value: `[Board View](${data.task_url}) | [Public View](${data.task_url_pub})`,
  });

  if (data.notify_type === "project") {
    client.channels.cache.get(data.channel).send({ embeds: [notifyEmbed] });
  }
  // else if (req.body.notify_type === 'user') {
  // 	client.channels.cache.get(req.body.user).send('<content user>');
  // }

  res.end();
});

// Helpers
function bytesToSize(bytes, seperator = "") {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes == 0) return "n/a";
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
  if (i === 0) return `${bytes}${seperator}${sizes[i]}`;
  return `${(bytes / 1024 ** i).toFixed(1)}${seperator}${sizes[i]}`;
}

app.listen(PORT, () => console.log(`Server is listening on port ${PORT}...`));
