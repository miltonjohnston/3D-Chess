import { Game } from './modules/Game.js';
import { GUIManager } from './GUIManager.js';
import { SocketManager } from './SocketManager.js';

import { Knight, Bishop, Rook, Queen } from './modules/Piece.js';

class GameManager {
    constructor() {
        window.DEBUG = this;

        this.SocketManager = new SocketManager();
        this.GUIManager = new GUIManager(this.SocketManager);
        this.SetUpSocket();
    }

    SetUpSocket() {
        this.SocketManager.SOCKET.on("game side", side => {
            const isWhite = side == "white";
            this.GAME = new Game(false, isWhite, this);
        });

        this.SocketManager.SOCKET.on("current turn", () => {
            this.GAME.selectionHandler.isEnabled = true;
        });

        this.SocketManager.SOCKET.on("piece move", coords => {
            const piece = this.GAME.chessBoard.GetPieceOnNode(this.GAME.chessBoard.GetNodeFromCoordinate(coords.from));
            const piece2 = this.GAME.chessBoard.GetPieceOnNode(this.GAME.chessBoard.GetNodeFromCoordinate(coords.to));

            if (piece2) this.GAME.chessBoard.RemovePiece(piece2);

            piece.SetCoordinate(coords.to);
            this.GAME.selectionHandler.moveSFX.play();
            const pieces = this.GAME.isWhite ? this.GAME.chessBoard.whitePiecesModels : this.GAME.chessBoard.blackPiecesModels;
            this.GAME.selectionHandler.UpdateTargets(pieces);

            this.GAME.selectionHandler.CheckIfChecked();
        });

        this.SocketManager.SOCKET.on("piece promote", data => {
            const piece = this.GAME.chessBoard.GetPieceOnNode(this.GAME.chessBoard.GetNodeFromCoordinate(data.coord));
            const type = data.type == "knight" ? Knight :
                        data.type == "bishop" ? Bishop :
                        data.type == "rook" ? Rook :
                        data.type == "queen" ? Queen : null;

            this.GAME.chessBoard.RemovePiece(piece);
            this.GAME.chessBoard.CreatePiece(type, !this.GAME.isWhite ? 0xFFFFFF : 0x000000, data.coord);
        });

        this.SocketManager.SOCKET.on("win", () => {
            document.querySelector("#end-screen-title").innerText = "YOU WIN!";
            document.querySelector(".end-screen").style.display = "flex";
        });

        this.SocketManager.SOCKET.on("lose", () => {
            document.querySelector("#end-screen-title").innerText = "YOU LOSE";
            document.querySelector(".end-screen").style.display = "flex";
        });
    }

    SwitchTurn() {
        this.SocketManager.EmitEvent("switch turn");
    }

    MovePiece(coordinate1, coordinate2) {
        this.SocketManager.EmitEvent("move piece", { from: coordinate1, to: coordinate2 });
    }

    PromotePiece(coordinate, Type) {
        const type = Type == Knight ? "knight" : 
                   Type == Bishop ? "bishop" :
                   Type == Rook ? "rook" :
                   Type == Queen ? "queen" : null;

        this.SocketManager.EmitEvent("promote piece", { coord: coordinate, type: type });
    }

    KingChecked() {
        this.GUIManager.ShowKingCaptureWarning();
    }

    Checkmate() {
        this.SocketManager.EmitEvent("checkmate");
    }
}

new GameManager();