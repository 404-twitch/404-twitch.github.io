var SE_ID;

var hash = location.hash.substr(1);
var TOKENS = {};
for (let v of hash.split('&')) {
	let s = v.split('=');
	TOKENS[s[0]] = (s.length > 1) ? s[1] : undefined;
}
var token = hash.substr(hash.indexOf('access_token=')).split('&')[0].split('=')[1];

if (TOKENS.TW == undefined || TOKENS.SE == undefined) {
	document.querySelector("#error").className = "";
}

async function SE_say(msg) {
	fetch("https://api.streamelements.com/kappa/v2/bot/" + SE_ID + "/say", {
	  "method": "POST",
	  "headers": {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'authorization': 'Bearer ' + TOKENS.SE
	  },
	  "body": JSON.stringify({"message": msg})
	})
}

ComfyJS.onReward = ( user, reward, cost, message, extra ) => {
	let points = 0;
	if (reward === "Yigglys for points x1.5") points = cost * 1.5;
	if (reward === "Yigglys for points x2") points = cost * 2;
	if (reward === "Yigglys for points x2.5") points = cost * 2.5;
	
	if (points > 0) {
		fetch('https://api.streamelements.com/kappa/v2/points/' + SE_ID + '/' + user + '/' + points, {
		  method: 'PUT',
		  headers: {
			'Content-Type': 'application/json',
			'authorization': 'Bearer ' + TOKENS.SE
		  }
		}).then(response => response.json())
		.then(data => {
			SE_say(`${user} received ${points} points. They now have ${data.newAmount} points!`)
		}).catch(err => console.error(err))
	}
}

fetch('https://api.streamelements.com/kappa/v2/channels/me', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
	'authorization': 'Bearer ' + TOKENS.SE
  }
})
.then(response => response.json())
.then(data => {
  SE_ID = data._id;
  ComfyJS.Init( data.username, TOKENS.TW );
}).catch(err => {
	console.error(err)
});
if (SE_ID == undefined) {
	document.querySelector("#error").className = "";
}