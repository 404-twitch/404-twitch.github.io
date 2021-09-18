const CLIENT_ID = "jxjltziqt6nq28n8hmsozp9jbk02sz";
const RED_URL = "https://404-twitch.github.io/auth"
// const REQ_SCOPES = "channel:manage:redemptions+channel:read:redemptions+user:read:email+chat:edit+chat:read"
const REQ_SCOPES = "bits:read+channel:read:redemptions+channel:read:subscriptions+chat:read"

var hash = location.hash.substr(1);
var token = hash.substr(hash.indexOf('access_token=')).split('&')[0].split('=')[1];

if (token) {
	document.querySelector("#token_field").innerText = token;
	localStorage.setItem('access_token', token);
} else {
	var stored = localStorage.getItem('access_token');
	if (stored) {
		document.querySelector("#token_field").innerText = stored;
	} else {
		/* No token - try getting one */
		let url = `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${RED_URL}&scope=${REQ_SCOPES}`
		document.location = url;
	}
}