const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Variables
const players = [];
const rooms = [];

// New connection
io.on("connection", socket => {
    AddPlayer(socket);

    socket.on("set username", username => { OnSetUsername(socket, username) }); // Player chooses username
    socket.on("create room", roomName => { OnCreateRoom(socket, roomName) }); // Player creates room
    socket.on("join room", room => { OnJoinRoom(socket, room) }); // Player joins room
    socket.on("get room data", room => { OnGetRoomData(socket, room) }); // Sends room data to client
    socket.on("start game", () => { OnStartGame(socket) }); // When creator of room starts game
    socket.on("switch turn", () => { OnSwitchTurn(socket) }); // Switches turn
    socket.on("move piece", coords => { OnMovePiece(socket, coords) }); // Player moves a piece
    socket.on("promote piece", data => { OnPromotePiece(socket, data) }); // Player promotes a pawn
    socket.on("checkmate", () => { OnCheckmate(socket) });
    socket.on("disconnect", () => { OnPlayerLeave(socket) }); // Player closes page
})

// Add player to list
function AddPlayer(socket) {
    players.push({
        username: null,
        id: socket.id,
        isInRoom: false
    });
    console.log("\x1b[32m" + `  ${socket.id} Connected!` + "\x1b[0m");
}

// When the player chooses their username
function OnSetUsername(socket, username) {
    GetPlayerByID(socket.id).username = username;
    socket.join("lobby");
    socket.emit("player data", GetPlayerByID(socket.id));
    socket.emit("get rooms", rooms);
}

// When the player creates a room
function OnCreateRoom(socket, roomName) {
    const data = {
        name: roomName,
        creator: socket.id,
        playerCount: 1,
        players: [GetPlayerByID(socket.id)]
    }
    rooms.push(data)
    GetPlayerByID(socket.id).isInRoom = true;
    socket.to("lobby").emit("new room", data);
}

// When the player joins a room
function OnJoinRoom(socket, room) {
    for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].creator != room.creator) continue;

        rooms[i].players.push(GetPlayerByID(socket.id));
        rooms[i].playerCount++;

        GetPlayerByID(socket.id).isInRoom = true;
        socket.to(room.creator).emit("player join", GetPlayerByID(socket.id));
    }
}

// Send room data to client
function OnGetRoomData(socket, room) {
    for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].creator != room.creator) continue;

        socket.emit("room data", rooms[i]);
    }
}

// When the host starts the game
function OnStartGame(socket) {
    for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].creator != socket.id) continue;
        
        socket.to(rooms[i].players[1].id).emit("game start");

        socket.emit("game side", "white");
        socket.to(rooms[i].players[1].id).emit("game side", "black");
    }
}

// Switch turns after a player makes a move
function OnSwitchTurn(socket) {
    for (let i = 0; i < rooms.length; i++) {
        for (let x = 0; x < rooms[i].players.length; x++) {
            if (rooms[i].players[x].id != socket.id) continue;

            if (x == 1) socket.to(rooms[i].players[0].id).emit("current turn");
            else if (x == 0) socket.to(rooms[i].players[1].id).emit("current turn");
        }
    }
}

// Send piece before and after coordinates to other player
function OnMovePiece(socket, coords) {
    for (let i = 0; i < rooms.length; i++) {
        for (let x = 0; x < rooms[i].players.length; x++) {
            if (rooms[i].players[x].id != socket.id) continue;

            if (x == 1) socket.to(rooms[i].players[0].id).emit("piece move", coords);
            else if (x == 0) socket.to(rooms[i].players[1].id).emit("piece move", coords);
        }
    }
}

// Send the promoted piece to the other player
function OnPromotePiece(socket, data) {
    for (let i = 0; i < rooms.length; i++) {
        for (let x = 0; x < rooms[i].players.length; x++) {
            if (rooms[i].players[x].id != socket.id) continue;

            if (x == 1) socket.to(rooms[i].players[0].id).emit("piece promote", data);
            else if (x == 0) socket.to(rooms[i].players[1].id).emit("piece promote", data);
        }
    }
}

function OnCheckmate(socket) {
    for (let i = 0; i < rooms.length; i++) {
        for (let x = 0; x < rooms[i].players.length; x++) {
            if (rooms[i].players[x].id != socket.id) continue;

            if (x == 1) socket.to(rooms[i].players[0].id).emit("lose");
            else if (x == 0) socket.to(rooms[i].players[1].id).emit("lose");

            socket.emit("win");
        }
    }
}

// Remove player from list AND remove their room if they have one
function OnPlayerLeave(socket) {
    console.log("\x1b[31m" + `  ${socket.id} Disconnected.` + "\x1b[0m");
    for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].creator == socket.id) {
            socket.broadcast.emit("remove room", rooms[i]);
            if (rooms[i].playerCount == 2) {
                socket.to(rooms[i].players[1].id).emit("kick");
                socket.to(rooms[i].players[1].id).emit("host leave game");
            }
            rooms.splice(i, 1);
            
            break;
        }
        for (let x = 0; x < rooms[i].players.length; x++) {
            if (rooms[i].players[x].id == socket.id) {
                socket.to(rooms[i].creator).emit("player leave room", GetPlayerByID(socket.id));
                socket.to(rooms[i].creator).emit("player leave game");
                rooms[i].playerCount--;
                rooms[i].players.splice(x, 1);
            }
        }
    }
    RemoveRoom(socket);
    RemovePlayer(socket);
} 


// HELPER FUNCTIONS

// Remove player's room
function RemoveRoom(socket) {
    if (!GetPlayerByID(socket.id).isInRoom) return;

    for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].creator != socket.id) continue;
        socket.broadcast.emit("remove room", rooms[i]);
        rooms.splice(i, 1);
    }
}

// Remove player from list
function RemovePlayer(socket) {
    for (let i = 0; i < players.length; i++) {
        if (players[i].id != socket.id) continue;
        players.splice(i, 1);
    }
}

// Get player from list with their ID
function GetPlayerByID(id) {
    for (let i = 0; i < players.length; i++) {
        if (players[i].id != id) continue;

        return players[i];
    }
    
    return null;
}


app.use(express.static(__dirname));

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => {
    console.log("\x1b[36m" + `\nServer running on port: ${PORT}\n` + "\x1b[0m");
})