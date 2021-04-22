require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const Discord = require('discord.js');
const { prefix, task_types } = require('./config.json');

const app = express();
const PORT = process.env.PORT || 8080;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

const client = new Discord.Client();


// ===========> Start: Bot logic
client.once('ready', async () => {
	console.log('UWC Tasks bot is Ready!');
	const users = await client.users.cache;
	console.log(users);
	client.user.setPresence({ activity: { type: 'WATCHING', name: 'Projects, use: !task' }, status: 'online' });
});

client.login(process.env.BOT_TOKEN);

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(' ');
	const command = args.shift().toLowerCase();

	if (command === 'server-info') {
		// if (!args.length) {
		// 	return message.channel.send(`You didn't provide any arguments, ${message.author}!`);
		// }
		message.channel.send(`Server name: ${message.guild.name}`);
	}
	else if (command === 'user-info') {
		message.channel.send(`Your username: ${message.author.username}\nYour ID: ${message.author.id}`);
	}
	else if (command === 'channel-info') {
		message.channel.send(`Channel name: ${message.channel.name}\nChannel ID: ${message.channel.id}`);
	}
});


// ===========> Start: Express server
const resp_data = '{"uwc_tasks":{"online":true,"status":"200"}}';

app.get('/', function(req, res) {
	res.send('<html><head></head><body>UW Tasks</body></html>');
	// res.send('<html><head><script>window.location.href = \'https://google.com/\'</script></head><body>You shouldn\'t be here! <a href=\'https://google.com\'>Exit</a></body></html>');
});

app.post('/', function(req, res) {
	console.log(req);
	res.type('json');
	res.json(resp_data);
	/* Webserver --> Bot */
	res.end();
});

app.post('/notify/send', function(req, res) {
	console.log(req.body);
	res.type('json');
	res.json(resp_data);

	// Proccess data variables
	let data = req.body;
	let description, link_title;

	switch (data.event_name) {
	case 'task.created':
		description = data.event_data.task.description;
		link_title = 'Task Links';
		break;
	default:
		description = data.event_data.task.description;
		link_title = 'Links';
	}

	const notifyEmbed = new Discord.MessageEmbed()
		.setColor(data.event_data.task.color_id)
		.setTitle(task_types[data.event_name])
		.setDescription(data.event_title)
		.addFields(
			{ name: 'Details', value: description },
			{ name: link_title, value: `[Board View](${data.task_url}) | [Public View](${data.task_url_pub})` },
		);

	if (data.notify_type === 'project') {
		client.channels.cache.get(data.channel).send(notifyEmbed);
	}
	// else if (req.body.notify_type === 'user') {
	// 	client.channels.cache.get(req.body.user).send('<content user>');
	// }

	res.end();
});

app.listen(PORT, () => console.log(`Server is listening on port ${PORT}...`));