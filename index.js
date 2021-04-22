require('dotenv').config();
const express = require('express');
const Discord = require('discord.js');
const { prefix } = require('./config.json');

const app = express();
const PORT = process.env.PORT || 8080;

const client = new Discord.Client();


// Start: Express server
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
	console.log(req);
});

app.listen(PORT, () => console.log(`Server is listening on port ${PORT}...`));


// Start: Bot logic

client.once('ready', () => {
	console.log('UWC Tasks bot is Ready!');
	client.user.setPresence({ activity: { type: 'WATCHING', name: 'Projects, use: !task' }, status: 'online' });
});

client.login(process.env.BOT_TOKEN);

client.on('message', message => {
	// console.log(message.content);
	if (message.content === `${prefix}ping`) {
		// send back "Pong." to the channel the message was sent in
		message.channel.send('Pong.');
	}
	else if (message.content === `${prefix}beep`) {
		message.channel.send('Boop.');
	}
	else if (message.content === `${prefix}server`) {
		message.channel.send(`This server's name is: ${message.guild.name}`);
	}
	else if (message.content === `${prefix}server-extras`) {
		message.channel.send(`Server name: ${message.guild.name}\nTotal members: ${message.guild.memberCount}`);
	}
	else if (message.content === `${prefix}user-info`) {
		message.channel.send(`Your username: ${message.author.username}\nYour ID: ${message.author.id}`);
	}
});