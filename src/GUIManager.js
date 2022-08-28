import { Game } from './modules/Game.js';

// DOM elements
const container = document.querySelector(".container");
const background = document.querySelector("#background");
const homePage = document.querySelector("#home-page");
const usernameInput = document.querySelector("#username");
const findRoomButton = document.querySelector("#look-for-rooms");
const roomsContainer = document.querySelector(".look-for-rooms-container");
const roomsList = document.querySelector(".rooms-list");
const createRoomButton = document.querySelector("#create-room-button");
const createRoomContainer = document.querySelector(".waiting-room-container");
const roomNameText = document.querySelector(".room-name");
const playerList = document.querySelector(".players");
const playerCountText = document.querySelector("#player-count");
const endScreen = document.querySelector(".end-screen")
const startGameButton = document.querySelector("#start-game-button");
const backToRoomButton = document.querySelector(".back-to-room-button");
const checkWarning = document.querySelector(".check-warning");

let playersInRoom = 0;

class GUIManager {
    constructor(SocketManager) {
        this.playerData;
        this.SocketManager = SocketManager;

        const bg = new Game(true);
        background.appendChild(bg.renderer.domElement);

        this.AddListeners();
    }

    AddListeners() {
        findRoomButton.addEventListener("click", () => this.OnFindRoomsButtonClicked(), false);
        createRoomButton.addEventListener("click", () => this.OnCreateRoomButtonClicked(), false);
        startGameButton.addEventListener("click", () => this.OnStartGameButtonClicked(), false);
        backToRoomButton.addEventListener("click", () => this.OnBackToRoomButtonClicked(), false);

        this.SocketManager.SOCKET.on("player data", data => this.OnGetPlayerData(data));
        this.SocketManager.SOCKET.on("get rooms", data => this.OnGetRooms(data));
        this.SocketManager.SOCKET.on("new room", data => this.OnNewRoom(data));
        this.SocketManager.SOCKET.on("room data", data => this.OnGetRoomData(data));
        this.SocketManager.SOCKET.on("remove room", data => this.OnRemoveRoom(data));
        this.SocketManager.SOCKET.on("player join", data => this.OnPlayerJoinRoom(data));
        this.SocketManager.SOCKET.on("player leave room", data => this.OnPlayerLeaveRoom(data));
        this.SocketManager.SOCKET.on("kick", () => this.OnKickedFromRoom());
        this.SocketManager.SOCKET.on("host leave game", () => this.OnHostLeaveGame());
        this.SocketManager.SOCKET.on("player leave game", () => this.OnPlayerLeaveGame());
        this.SocketManager.SOCKET.on("game start", () => this.OnGameStart());
    }

    OnFindRoomsButtonClicked() {
        if (usernameInput.value.trim() == "") {
            this.CreateErrorMessage("Please Enter a Username.");
            return;
        }
        const username = usernameInput.value.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&#34;");
        this.ChangeHomePageVisibility(false);

        this.SocketManager.SOCKET.emit("set username", username);
    }
    
    OnCreateRoomButtonClicked() {
        this.ChangeRoomsListVisibility(false);
        this.AddToPlayerList(this.playerData);
        startGameButton.style.display = "flex";
        const roomName = `Room ${roomsList.childElementCount + 1}`;
        roomNameText.innerText = roomName;
        playersInRoom++;

        this.SocketManager.EmitEvent("create room", roomName)
    }

    OnStartGameButtonClicked() {
        if (playersInRoom < 2) {
            this.CreateErrorMessage("2 Players Required to Start Game!");
            return;
        }
        this.ChangeWaitingRoomVisibility(false);
        background.style.display = "none";

        this.SocketManager.EmitEvent("start game");
    }
    
    OnBackToRoomButtonClicked() {
        endScreen.style.display = "none";
        this.ChangeWaitingRoomVisibility(true);
        document.querySelector(".canvas-container").innerHTML = "";
        document.querySelector("#background").style.display = "block";
    }

    OnGetPlayerData(data) {
        this.playerData = data;
    }

    OnGetRooms(rooms) {
        for (let i = 0; i < rooms.length; i++) {
            const html = `<div class="room" id="${rooms[i].creator}">${rooms[i].name}</div>`;
            roomsList.insertAdjacentHTML("beforeend", html);
    
            document.getElementById(rooms[i].creator).addEventListener("click", () => {
                this.SocketManager.EmitEvent("get room data", rooms[i]);
            }, false);
        }
    }    

    OnNewRoom(room) {
        const html = `<div class="room" id="${room.creator}">${room.name}</div>`;
        roomsList.insertAdjacentHTML("beforeend", html);
        document.getElementById(room.creator).addEventListener("click", () => {
            this.SocketManager.EmitEvent("get room data", room);
        }, false);
    }

    OnGetRoomData(data) {
        if (data.playerCount >= 2) {
            alert(`${data.name} is full!`);
            return;
        }

        playerList.innerHTML = "";
        this.ChangeRoomsListVisibility(false);
        startGameButton.style.display = "none";
        roomNameText.innerText = data.name;
        this.AddToPlayerList(this.playerData);
        this.AddToPlayerList(data.players[0]);
        this.UpdatePlayerCount(data.playerCount + 1);
        this.SocketManager.EmitEvent("join room", data); 
    }

    OnRemoveRoom(room) {
        roomsList.removeChild(document.getElementById(room.creator));
    }

    OnPlayerJoinRoom(player) {
        this.AddToPlayerList(player);
        this.UpdatePlayerCount(2);
        playersInRoom++;
    }

    OnPlayerLeaveRoom(player) {
        const elms = document.getElementById(player.id);
        elms.remove();
        this.UpdatePlayerCount(1);
        playersInRoom--;
    }

    OnKickedFromRoom() {
        this.ChangeWaitingRoomVisibility(false);
        this.ChangeRoomsListVisibility(true);
        playerList.innerHTML = "";
        this.UpdatePlayerCount(1);
        this.CreateErrorMessage("You Were Kicked From The Room");
    }

    OnHostLeaveGame() {
        this.ChangeWaitingRoomVisibility(false);
        this.ChangeRoomsListVisibility(true);
        document.querySelector(".canvas-container").innerHTML = "";
        document.querySelector("#background").style.display = "block";
        this.CreateErrorMessage("Host Left The Game!");
    }

    OnPlayerLeaveGame() {
        this.ChangeWaitingRoomVisibility(true);
        document.querySelector(".canvas-container").innerHTML = "";
        document.querySelector("#background").style.display = "block";
        this.CreateErrorMessage("Player Left The Game!");
    }

    OnGameStart() {
        this.ChangeWaitingRoomVisibility(false);
        background.style.display = "none";
    }

    ShowKingCaptureWarning() {
        checkWarning.style.display = "block";

        setTimeout(() => {
            checkWarning.style.display = "none";
        }, 2000);
    }

    AddToPlayerList(playerData) {
        const html = `<div id="${playerData.id}">${playerData.username}</div>`;
        playerList.insertAdjacentHTML("beforeend", html);
    }

    UpdatePlayerCount(count) {
        playerCountText.innerText = `Players: ${count} / 2`;
    }

    ChangeHomePageVisibility(isShown) {
        if (isShown) {
            homePage.style.display = "flex";
            roomsContainer.style.display = "none";
        } else {
            homePage.style.display = "none";
            roomsContainer.style.display = "flex";
        }
    }

    ChangeRoomsListVisibility(isShown) {
        if (isShown) {
            roomsContainer.style.display = "flex";
            createRoomContainer.style.display = "none";
        } else {
            roomsContainer.style.display = "none";
            createRoomContainer.style.display = "flex";
        }
    }

    ChangeWaitingRoomVisibility(isShown) {
        if (isShown) {
            createRoomContainer.style.display = "flex";
        } else {
            createRoomContainer.style.display = "none";
        }
    }

    CreateErrorMessage(message) {
        let needsToClear = true;

        const prevErrors = document.getElementsByClassName("error-message");
        if (prevErrors.length > 0) {
            for (let i = 0; i < prevErrors.length; i++) {
                prevErrors[i].remove();
            }
            needsToClear = false;
        }
        const html = `<div class="error-message">ERROR: ${message}</div>`;
        container.insertAdjacentHTML("afterbegin", html);
        setTimeout(() => {
            if (needsToClear) document.querySelector(".error-message").remove();
        }, 2000);
    }
}

export { GUIManager }