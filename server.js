// nodeIRCbot by Daniel Vestol

// Specify irc bot parameters and stuffs. Channels is an array, can be extended.
// Most networks works fine, for registering and using the TMI network look up the IRC library on npmjs.
var config = {
	channels: ["#bottesting"],
	server: "irc.freenode.net",
	botName: "_Sam",
	retryCount: 10,
	autoRejoin: true,
	floodProtection: true
};

// Require irc library
var irc = require('irc');
// Add "string".contains('ring') prototype
String.prototype.contains = function(it) { return this.indexOf(it) != -1; };

// Require the database
var Datastore = require('nedb');
db = {};
// Initialize database
db.commands = new Datastore({ filename: 'database/commands.db', autoload: true });

// function to index words in string, used for security (what security?) and simplicity
function wordify(sentence) {
	return sentence.replace(/[;()-]/g, " ").replace(/\s+/g, " ").toLowerCase().split(" ");
}

// Create commands from IRC without access to the server! Should probably be commented out if you are afraid of abuse.
db.commands.addcommand = function(object) {
	db.commands.findOne({name:object.name}, function (err, doc) {
		// console.dir(doc);
		if (doc) {
			// Update existing commands if command name already exists
			db.commands.update(doc, object, {multi:true}, function (err, numReplaced) {
				// console.dir(object);
				console.log('Command updated!');
			});
		} else {
			// If command does not match an entry, insert new document
			db.commands.insert(object);
			console.log('Command created!');
		}
	})
}

// Insert template commands
db.commands.addcommand({
	name:'!help',
	result:'Im a bot. Beep boop.'
});

// Cool command using the script functionality to add new commands.
// Commands that execute scripts can't be added from IRC due to security concerns. (Im lazy)
db.commands.addcommand({
	name:'!addcmd',
	result:'Im learning, yay!',
	js:'message = wordify(text); returnString = ""; for(i = 2;message.length > i;i++){returnString = returnString + " " + message[i]};db.commands.addcommand({name:message[1], result:returnString});'
});

// Query command template
/*
db.commands.findOne({ name: '!help' }, function (err, doc) {
	if (!err && doc) {
		console.log(doc.name, doc.result);
	} else if (err) {
		console.log(err);
	}
});
*/

// Initialize bot
var bot = new irc.Client(config.server, config.botName, {
	channels: config.channels
});

// Listen to and return messages
bot.addListener("message", function(from, to, text, message) {
	console.log(from + ' | ' + to + ' | ' + text);
	// Check if message is a command in database
	db.commands.findOne({name: wordify(text)[0]}, function(err, doc) {
		// Is message is an indexed command, return its return value
		if (doc) {
			bot.say(to, doc.result)
			// If command also includes code, run the code
			if (doc.js) {
				eval(doc.js);
			}
		} else {
			// If it ain't a command, shut the fuck up and complain in silence
			console.log('Command not found');
		}
		
	});
});
