import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import { Node } from './Node.js';
import {Pawn, Rook, Knight, Bishop, Queen, King } from './Piece.js';

class ChessBoard {
    constructor(game, isWhite) {
        this.nodes = [];
        this.pieces = [];

        this.x = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        this.y = [1, 2, 3, 4, 5, 6, 7, 8];

        this.whitePiecesModels = [];
        this.blackPiecesModels = [];

        this.layout = [
            [2, 3, 4, 5, 6, 4, 3, 2],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [2, 3, 4, 5, 6, 4, 3, 2]
        ];

        this.game = game;
        this.scene = this.game.scene;
        this.isWhite = isWhite;

        this.whitePieceColor = 0xe6e4e3;
        this.blackPieceColor = 0x141210;

        this.CreateChessBoard();

        this.loadingManager = new THREE.LoadingManager();

        this.SetupBoard();
    }

    GetNodeFromCoordinate(coordinate) {
        if (!this.nodes) return;

        for (let i = 0; i < this.nodes.length; i++) {
            if (coordinate != this.nodes[i].coordinate) continue;

            return this.nodes[i];
        }
    }

    GetPieceOnNode(node) {
        for (let i = 0; i < this.pieces.length; i++) {
            if (this.pieces[i].coordinate != node.coordinate) continue;

            return this.pieces[i];
        }
    }

    RemovePiece(piece) {
        for (let i = 0; i < this.pieces.length; i++) {
            if (this.pieces[i].uuid != piece.uuid) continue;
            
            this.pieces.splice(i, 1);
            break;
        }
        if (piece.isWhite) {
            for (let i = 0; i < this.whitePiecesModels.length; i++) {
                if (this.whitePiecesModels[i].uuid != piece.model.children[0].uuid) continue;
                this.whitePiecesModels.splice(i, 1);
                break;
           }
        } else if (!piece.isWhite) {
            for (let i = 0; i < this.blackPiecesModels.length; i++) {
                if (this.blackPiecesModels[i].uuid != piece.model.children[0].uuid) continue;
                this.blackPiecesModels.splice(i, 1);
                break;
            }
        }
        this.scene.remove(piece.model);
    } 

    CreateChessBoard() {
        for (let i = 0; i < this.layout.length; i++) {
            for (let x = 0; x < this.layout[i].length; x++) {
                const node = new Node(i * 5, x * 5);
                node.SetCoordinate(this.x[x] + this.y[i]);

                if ((i + x) % 2 == 0) node.SetColor(0x000000);

                this.nodes.push(node);
                this.scene.add(node.mesh);
            }
        }
    }

    CreatePiece(Type, color, coordinate) {
        const piece = color == this.whitePieceColor ? new Type(this, true) : new Type(this, false);
        piece.SetColor(color);
        piece.SetCoordinate(coordinate);
        this.pieces.push(piece);

        if (Type == Pawn || Type == King) {
            piece.hasMoved = false;
        }

        return piece;
    }

    AddPiece(piece, coordinate) {
        if (!piece.model) return;

        if (piece.GetColor() == this.whitePieceColor) {
            piece.model.rotation.set(0, Math.PI / 2, 0);
            this.whitePiecesModels.push(piece.model.children[0]);
        } else {
            piece.model.rotation.set(0, -Math.PI / 2, 0);
            this.blackPiecesModels.push(piece.model.children[0]);
        }

        this.scene.add(piece.model);

        if (piece.type == "Pawn" || piece.type == "King") return;

        piece.SetCoordinate(coordinate);
    }

    SetupBoard() {
        for (let i = 0; i < this.layout.length; i++) {
            for (let x = 0; x < this.layout[i].length; x++) {
                let color = i <= 3 ? this.whitePieceColor : this.blackPieceColor;

                switch(this.layout[i][x]) {
                    case 0:
                        break;
                    case 1:
                        this.CreatePiece(Pawn, color, this.x[x] + this.y[i]);
                        break;
                    case 2:
                        this.CreatePiece(Rook, color, this.x[x] + this.y[i]);
                        break;
                    case 3:
                        this.CreatePiece(Knight, color, this.x[x] + this.y[i]);
                        break;
                    case 4:
                        this.CreatePiece(Bishop, color, this.x[x] + this.y[i]);
                        break;
                    case 5:
                        this.CreatePiece(Queen, color, this.x[x] + this.y[i]);
                        break;
                    case 6:
                        this.CreatePiece(King, color, this.x[x] + this.y[i]);
                }
            }
        }
    }
}

export { ChessBoard }