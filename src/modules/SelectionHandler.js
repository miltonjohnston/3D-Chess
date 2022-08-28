import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

class SelectionHandler {
    constructor(targets, game, isWhite) {
        this.targets = targets;
        this.game = game;
        this.chessBoard = this.game.chessBoard;
        this.isWhite = isWhite;

        this.isPromotingPawn = false;
        this.isEnabled = isWhite;
        this.color = isWhite ? this.chessBoard.whitePieceColor : this.chessBoard.blackPieceColor;
        this.moveSFX = new Audio("../../resources/Sound/Move.mp3");

        this.pointer = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();

        this.isMovingPiece = false;
        this.selectedPiece = null;
        this.possibleMoves = [];  
        this.castleMoves = [];

        this.game.renderer.domElement.addEventListener("pointerup", event => this.OnClick(event));
    }

    OnClick(event) {
        if (!this.targets) return;

        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.pointer, this.game.camera);

        if (this.isMovingPiece) {
            const intersects = this.raycaster.intersectObjects(this.possibleMoves, false);

            if (intersects.length > 0) {
                if (!this.isPromotingPawn) this.game.GameManager.SwitchTurn(this.isWhite);

                this.MovePiece(intersects[0].object.NODE.coordinate);
                this.isEnabled = false;
            } else this.DeselectAllPieces();

        } else if (this.isEnabled) {
            const intersects = this.raycaster.intersectObjects(this.targets, false);

            if (intersects.length > 0) this.SelectPiece(intersects[0].object);
        }
    }

    SelectPiece(target) {
        this.DeselectAllPieces();

        target.material.color.setHex(0x00FF00);

        this.selectedPiece = target.PIECE;
        this.isMovingPiece = true;

        this.castleMoves = [];

        this.HideMoves();

        if (this.selectedPiece.type == "King") {
            const possibleMoves = this.selectedPiece.GetPossibleMoves();
            this.ShowMoves(possibleMoves.moves);
            this.ShowMoves(possibleMoves.castleMoves);

            this.possibleMoves = possibleMoves.moves.map(x => x.moveMesh);
            this.possibleMoves.push(...possibleMoves.castleMoves.map(x => x.moveMesh));
        } else {
            const possibleMoves = this.selectedPiece.GetPossibleMoves().moves;

            this.ShowMoves(possibleMoves);
            this.possibleMoves = possibleMoves.map(x => x.moveMesh);
        }
    }

    DeselectAllPieces() {
        for (let i = 0; i < this.targets.length; i++) {
            this.targets[i].material.color.setHex(this.color);
        }

        this.isMovingPiece = false;
        this.HideMoves();
    }

    ShowMoves(moves) {
        for (let i = 0; i < moves.length; i++) {
            moves[i].ShowMove(this.chessBoard.scene);
        }
    }

    HideMoves() {
        for (let i = 0; i < this.chessBoard.nodes.length; i++) {
            this.chessBoard.nodes[i].HideMove(this.chessBoard.scene);
        }
    }

    MovePiece(coordinate) {
        const pieceOnDst = this.chessBoard.GetPieceOnNode(this.chessBoard.GetNodeFromCoordinate(coordinate));

        if (pieceOnDst) {
            if (pieceOnDst.type == "King") this.game.GameManager.Checkmate();
            if (pieceOnDst.isWhite != this.isWhite) this.chessBoard.RemovePiece(pieceOnDst);
        }

        if (this.selectedPiece.type == "King" && !this.selectedPiece.hasMoved) {
            if (coordinate.charAt(0) == "C") {
                const leftRook = this.chessBoard.GetPieceOnNode(this.chessBoard.GetNodeFromCoordinate("A" + coordinate.charAt(1)));
                if (leftRook.type == "Rook") {
                    this.game.GameManager.MovePiece(leftRook.coordinate, "D" + coordinate.charAt(1));
                    this.game.GameManager.MovePiece(this.selectedPiece.coordinate, coordinate);
                    this.selectedPiece.SetCoordinate(coordinate);
                    leftRook.SetCoordinate("D" + coordinate.charAt(1));
                }
            } else if (coordinate.charAt(0) == "G") {
                const rightRook = this.chessBoard.GetPieceOnNode(this.chessBoard.GetNodeFromCoordinate("H" + coordinate.charAt(1)));
                if (rightRook.type == "Rook") {
                    this.game.GameManager.MovePiece(rightRook.coordinate, "F" + coordinate.charAt(1));
                    this.game.GameManager.MovePiece(this.selectedPiece.coordinate, coordinate);
                    this.selectedPiece.SetCoordinate(coordinate);
                    rightRook.SetCoordinate("F" + coordinate.charAt(1));
                }
            }
        } else {
            this.game.GameManager.MovePiece(this.selectedPiece.coordinate, coordinate);
            this.selectedPiece.SetCoordinate(coordinate);
        }

        this.moveSFX.play();
        this.isMovingPiece = false;

        this.DeselectAllPieces();
    }

    UpdateTargets(targets) {
        this.targets = targets;
    } 

    CheckIfChecked() {
        const oppSidePieces = this.isWhite ? this.chessBoard.blackPiecesModels : this.chessBoard.whitePiecesModels;

        for (let i = 0; i < oppSidePieces.length; i++) {
            if (oppSidePieces[i].PIECE.GetPossibleMoves().canCaptureOppKing) {
                this.game.GameManager.KingChecked();
                break;
            }
        }
    }
}

export { SelectionHandler }