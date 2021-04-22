require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const Discord = require('discord.js');
const { prefix } = require('./config.json');

const app = express();
const PORT = process.env.PORT || 8080;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

const client = new Discord.Client();


// ===========> Start: Bot logic
client.once('ready', () => {
	console.log('UWC Tasks bot is Ready!');
	client.user.setPresence({ activity: { type: 'WATCHING', name: 'Projects, use: !task' }, status: 'online' });
});

client.login(process.env.BOT_TOKEN);

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(' ');
	const command = args.shift().toLowerCase();

	if (command === 'server-info') {
		if (!args.length) {
			return message.channel.send(`You didn't provide any arguments, ${message.author}!`);
		}
		message.channel.send(`This server's name is: ${message.guild.name}`);
	}
	else if (command === 'server-extras') {
		if (!args.length) {
			return message.channel.send(`You didn't provide any arguments, ${message.author}!`);
		}
		message.channel.send(`Server name: ${message.guild.name}\nTotal members: ${message.guild.memberCount}`);
	}
	else if (command === 'user-info') {
		if (!args.length) {
			return message.channel.send(`You didn't provide any arguments, ${message.author}!`);
		}
		message.channel.send(`Your username: ${message.author.username}\nYour ID: ${message.author.id}`);
	}
	else if (command === 'channel-info') {
		if (!args.length) {
			return message.channel.send(`You didn't provide any arguments, ${message.author}!`);
		}
		message.channel.send(`Channel name: ${message.channel.name}\nChannel ID: ${message.channel.id}`);
	}
});


// ===========> Start: Express server
const data = '{"example":{"online":true,"status":"200"}}';

app.get('/', function(req, res) {
    res.send('<html><head></head><body>UW Tasks</body></html>');
    // res.send('<html><head><script>window.location.href = \'https://google.com/\'</script></head><body>You shouldn\'t be here! <a href=\'https://google.com\'>Exit</a></body></html>');
    /** Redirect the browser to google with window.location.href
     *  Change this to your site */
});

app.post('/', function(req, res) {
    /** You could add some auth code here but
     *  if your sending it all to the client there isn't much of a difference
     *  because people could read it from the website. */
	console.log(req);
    res.type('json');
    res.json(data);
    /* Webserver --> Bot */
    res.end();
});

app.post('/notify/send', function(req, res) {
	console.log(req.body);
	res.type('json');
	res.json(data);
	res.end();
});

app.listen(PORT, () => console.log(`Server is listening on port ${PORT}...`));