const twitch = {};
twitch.chat = new WebSocket("wss://irc-ws.chat.twitch.tv/")
twitch.pub = new WebSocket("wss://pubsub-edge.twitch.tv/v1")

const CLIENT_ID = "kimne78kx3ncx6brgo4mv6wki5h1ko";
const CHANNEL = {};
CHANNEL.NAME = location.hash.substr(1);
CHANNEL.ID = 0;

const UI = {};
UI.prediction = document.querySelector("#prediction");
UI.prediction.ptitle = UI.prediction.querySelector(".pred-title");
UI.prediction.blue = UI.prediction.querySelector("#choice-blue > .choice-title");
UI.prediction.red = UI.prediction.querySelector("#choice-red > .choice-title");
UI.prediction.bar = UI.prediction.querySelector("#prediction > .bar > .progress");

UI.poll = document.querySelector("#poll");
UI.poll.ptitle = UI.poll.querySelector(".poll-title");
UI.poll.choices = UI.poll.querySelector(".poll-choices");

UI.poll.choices.sort = function() {
	let ch = Array.prototype.slice.call(this.children, 0)

	ch.sort(function(a, b) {
		var aord = Number(a.querySelector(".progress").style.width.replace('%', ''));
		var bord = Number(b.querySelector(".progress").style.width.replace('%', ''));
		return bord - aord;
	});

	this.innerHTML = "";

	for(var i = 0, l = ch.length; i < l; i++) {
		this.appendChild(ch[i]);
	}	
}

function handleChat(event) {
	let msg = event.data;
	if (msg.startsWith("PING")) {
		this.send("PONG");
		setTimeout(function() { twitch.chat.send("PING") }, 60000); // 1min delay
	} else {
		// console.log(msg); // Actually parse and handle this
	}
}

twitch.pub.polls = {};
twitch.pub.predictions = {};
twitch.pub.hypetrain = {};

twitch.pub.polls.update = function(poll) {
	let choices = [];
	for (let i in poll.choices) {
		choices[i] = {
			"title": poll.choices[i].title,
			"votes": poll.choices[i].votes.total
		}
	}
	this[poll.poll_id] = { "title": poll.title, "choices": choices, "votes": poll.votes.total } 
	if (UI.poll.outcomes != undefined && UI.poll.outcomes.length > 0) {
		for (let i in choices) {
			let num = ((choices[i].votes / poll.votes.total) * 100) + "%";
			UI.poll.outcomes[i].querySelector(".progress").style.width = num
		}
		setTimeout(function() { 
			UI.poll.choices.sort();
		}, 500); // 1min delay
	}
}
twitch.pub.predictions.update = function(pred) {
	let outcomes = [];
	for (let i in pred.outcomes) {
		outcomes[i] = {
			"id": pred.outcomes[i].id,
			"title": pred.outcomes[i].title,
			"points": pred.outcomes[i].total_points
		}
	}
	this[pred.id] = { "title": pred.title, "outcomes": outcomes}
	
	UI.prediction.bar.style.width = ((outcomes[0].points / (outcomes[0].points + outcomes[1].points)) * 100) + "%";
}

twitch.pub.polls.handle = function(evt) {
	if (evt.type == "POLL_CREATE") {
		UI.poll.outcomes = [];
		this.update(evt.data.poll);
		// add to UI
		UI.poll.choices.innerHTML = ""; // new poll;
		let poll = this[evt.data.poll.poll_id];
		for (let i in poll.choices) {
			let c = poll.choices[i];
			let div = document.createElement('div');
			div.innerHTML = `<div id="pcid-${i}" class="poll-choice"><span class="choice-title"></span><div class="progress" style="width: 0%"></div></div>`;
			let cc = div.firstChild;
			cc.querySelector(".choice-title").innerText = c.title;
			UI.poll.choices.appendChild(cc);
			UI.poll.outcomes.push(cc);
		}
		UI.poll.ptitle.innerText = poll.title;
		UI.poll.classList.remove("hidden")
	} else if (evt.type == "POLL_UPDATE") {
		this.update(evt.data.poll);
		// update UI
	} else if (evt.type == "POLL_COMPLETE") {
		let poll = evt.data.poll;
		UI.poll.classList.add("hidden")
		let winner = UI.poll.choices.firstElementChild;
		winner.style.borderColor = "#4dc2c3";
		winner.lastChild.style.width = "100%";
		winner.lastChild.style.background = "#00fff3";
		delete this[poll.poll_id];
		// remove from UI
	} else if (evt.type == "POLL_TERMINATE") {
		UI.poll.className = "hidden";
		let poll = evt.data.poll;
		delete this[poll.poll_id];
	}
}
twitch.pub.predictions.handle = function(evt) {
	if (evt.type == "event-created") {
		this.update(evt.data.event);
		// add to UI
		let pred = this[evt.data.event.id];
		if (pred != undefined) {
			UI.prediction.ptitle.innerText = pred.title;
			UI.prediction.blue.innerText = pred.outcomes[0].title;
			UI.prediction.red.innerText = pred.outcomes[1].title;
			UI.prediction.className = "";
			UI.prediction.bar.style.width = "50%";
		}
	} else if (evt.type == "event-updated") {
		let pred = evt.data.event;
		this.update(pred);
		// update UI
		if (pred.status == "LOCKED") { /* Hide Locked */
			UI.prediction.classList.add("hidden") 
		} else if (pred.status == "CANCELED") {
			UI.prediction.classList.add("hidden")
			delete this[pred.id]
		} else if (pred.status == "RESOLVED") {
			UI.prediction.className = "";
			
			let pr = this[pred.id]
			
			for (let i in pr.outcomes) {
				if  (pr.outcomes[i].id == pred.winning_outcome_id) {
					UI.prediction.bar.style = "";
					UI.prediction.classList.add(`pred-${['blue','red'][i]}-win`);
					break;
				}
			}
			setTimeout(function() { 
				UI.prediction.classList.add("hidden");
			}, 5000); // 1min delay
			delete this[pred.id]
		}
	}
	console.log(evt);
}
twitch.pub.hypetrain.handle = function(data) {
	
}
twitch.pub.handleRaid = function(data) {
	
}
twitch.pub.handlePoints = function(data) {
	// console.log(data)
}

function handlePub(event) {
	let evt = JSON.parse(event.data);
	if (evt.type == "PING") {
		this.send('{"type":"PONG"}');
		setTimeout(function() { twitch.pub.send('{"type":"PING"}') }, 9000); // 1min delay
		return;
	}
	if (evt.type == "MESSAGE") {
		let data = evt.data;
		if (data.topic.startsWith("polls")) this.polls.handle(JSON.parse(data.message));
		else if (data.topic.startsWith("predictions-channel")) this.predictions.handle(JSON.parse(data.message));
		else if (data.topic.startsWith("hype-train")) this.hypetrain.handle(JSON.parse(data.message));
		else if (data.topic.startsWith("raid")) this.handleRaid(JSON.parse(data.message));
		else if (data.topic.startsWith("community-points-channel")) this.handlePoints(JSON.parse(data.message));
	}
}

function connectClient() {
	twitch.chat.onopen = function (event) {
		this.USER = `justinfan${Math.floor((Math.random() * 80000) + 1000)}`;
		this.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
		this.send("PASS SCHMOOPIIE");
		this.send("NICK " + this.USER);
		this.send(`USER ${this.USER} 8 * :${this.USER}`);
	};
	twitch.chat.onmessage = function (event) { // Original Auth
		if (event.data.startsWith(":tmi.twitch.tv 001")) {
			this.send("JOIN #" + CHANNEL.NAME);
			this.onmessage = handleChat;
		}
	}
	
	let pub_channels = ["community-points-channel-v1", "predictions-channel-v1", "raid", "polls", "hype-train-events-v1"]
	
	twitch.pub.onopen = function (event) {
		this.send('{"type":"PING"}');
		
		let topics = [];
		for (let c of pub_channels)
			topics.push(c + "." + CHANNEL.ID);

		this.send(JSON.stringify({"type":"LISTEN","nonce":"dL3BXYJMCQXZHPDZn5AG6Lo6D38TZ8","data":{"topics":topics}}))
	}
	twitch.pub.onmessage = handlePub;
}


fetch("https://gql.twitch.tv/gql", {
  "headers": {
    "accept": "*/*",
    "client-id": "kimne78kx3ncx6brgo4mv6wki5h1ko",
  },
  "body": JSON.stringify({
    "operationName": "ChannelPollContext_GetViewablePoll",
    "variables": {
        "login": CHANNEL.NAME
    },
    "extensions": {
        "persistedQuery": {
            "version": 1,
            "sha256Hash": "d37a38ac165e9a15c26cd631d70070ee4339d48ff4975053e622b918ce638e0f"
        }
    }
}),
  "method": "POST",
}).then(response => response.json())
.then(r => {
	CHANNEL.ID = r.data.channel.id;
}).then(connectClient())