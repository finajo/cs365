//This part is the same as usual...
var express = require("express");
var app = express();

var http = require("http");
var server = http.Server(app);
var socketio = require("socket.io");
var io = socketio(server);

app.use(express.static("pub"));

var gameWon = false;
var relativePos = 0;
var players = {};
var spectators = [];

io.on("connection", function(socket) {
	assignToSide(socket);

	if (isNotSpectator(socket)) {
		socket.on("reset", reset);
		socket.on("moveDog", moveDog.bind(null, socket));
	}

	socket.on("getPos", sendPosToClient);
	socket.on("disconnect", disconnect.bind(null, socket));
});

server.listen(8037, function() {
	console.log("Server is listening on port 8037");
});

/** Only the players are kept tracked of. Any additional players are ignored. */
function assignToSide(socket) {
	setPlayerTo(null, socket);

	if (gameWon) {
		socket.emit((relativePos < 0) ? "leftWon" : "rightWon");
	}
}

function disconnect(socket) {
	setPlayerTo(socket, null);
}

/** Only players can play the game. */
function isNotSpectator(socket) {
	return (players['left'] === socket || players['right'] === socket);
}

function moveDog(socket) {
	if(!gameWon) {
		relativePos += ((players['left'] === socket) ? -10 : 10);

		sendPosToClient();

		if (Math.abs(relativePos) > 100) {
			io.emit((relativePos < 0) ? "leftWon" : "rightWon");
			gameWon = true;
		}
	}
}

function reset() {
	if (gameWon) {
		console.log("Resetting game.");
		relativePos = 0;
		gameWon = false;
		io.emit("resetClient");
		sendPosToClient();
	}
}

function sendPosToClient() {
	io.emit("updatePos", relativePos);
}

/**
* Find and set the appropriate player, if it exists.
*
* @param	comparison	mixed	Find the player according to this parameter
* @param	newPlayer	mixed	Set the player to a new value
*
* @return	bool		Whether or not the player was found
*/
function setPlayerTo(comparison, newPlayer) {
	if (players['left'] == comparison) {
		players['left'] = (!newPlayer && spectators[0]) ? spectators.pop() : newPlayer;
 		return true;
	}

	if (players['right'] == comparison) {
		players['right'] = (!newPlayer && spectators[0]) ? spectators.pop() : newPlayer;
		return true;
	}

	if (!newPlayer) {
		spectators.push(newPlayer);
	}
	return false;
}
