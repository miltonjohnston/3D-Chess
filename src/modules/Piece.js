import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.0/examples/jsm/loaders/FBXLoader.js';

class Piece {
    constructor(chessBoard, isWhite) {
        this.chessBoard = chessBoard;
        this.isWhite = isWhite;
        this.type = "";
        this.coordinate = "";
        this.uuid = crypto.randomUUID();
        this.currentNode = null;
        this.model = null;
        this.material = new THREE.MeshPhongMaterial({color: 0xFFFFFF});
    }

    GetCurrentNode() {
        for (let i = 0; i < this.chessBoard.nodes.length; i++) {
            if (this.chessBoard.nodes[i].coordinate != this.coordinate)
                continue;

            return this.chessBoard.nodes[i];
        }
    }

    SetColor(hex) {
        this.material.color.setHex(hex);
    }

    GetColor() {
        return this.material.color.getHex();
    }

    SetCoordinate(coordinate) {
        this.coordinate = coordinate;
        this.currentNode = this.GetCurrentNode();

        if (this.model != null) {
            this.model.position.set(
                this.currentNode.mesh.position.x,
                this.currentNode.mesh.position.y + 0.5,
                this.currentNode.mesh.position.z
            ) 
        }
    }

    LoadModel(path) {
        const loader = new FBXLoader(this.chessBoard.loadingManager);
        loader.load(path, fbx => {
            fbx.traverse(c => {;
                if (c.isMesh) {
                    c.receiveShadow = true;
                    c.castShadow = true;
                    c.material = this.material;
                    c.geometry.computeVertexNormals();
                    c.geometry.computeFaceNormals();
                    c.PIECE = this;
                }
            })
            
            fbx.scale.setScalar(0.1);

            fbx.position.set(
                this.currentNode.mesh.position.x,
                this.currentNode.mesh.position.y + 0.5,
                this.currentNode.mesh.position.z
            );

            this.model = fbx;
            this.chessBoard.AddPiece(this, this.coordinate);
        })
    }

    GetXCoordinate() {
        return this.coordinate.charAt(0);
    }

    GetYCoordinate() {
        return parseInt(this.coordinate.charAt(1));
    }

    GetXIndex() {
        const x = this.GetXCoordinate();

        for (let i = 0; i < this.chessBoard.x.length; i++) {
            if (x != this.chessBoard.x[i]) continue;

            return i;
        }
    }

    GetYIndex() {
        const y = this.GetYCoordinate();

        for (let i = 0; i < this.chessBoard.y.length; i++) {
            if (y != this.chessBoard.y[i]) continue;

            return i;
        }
    }

    Destroy() {
        this.chessBoard.scene.remove(this.model);
    }

    GetPossibleMoves() {}
}

class Pawn extends Piece {
    constructor(chessBoard, side) {
        super(chessBoard, side);
        
        this.type = "Pawn";
        this.hasMoved = false;

        this.LoadModel("../../resources/models/Pawn.fbx");
    }

    SetCoordinate(coordinate) {
        this.coordinate = coordinate;
        this.currentNode = this.GetCurrentNode();
        this.hasMoved = true;

        if (this.model != null) {
            this.model.position.set(
                this.currentNode.mesh.position.x,
                this.currentNode.mesh.position.y + 0.5,
                this.currentNode.mesh.position.z
            );
        }

        const bool = this.isWhite == this.chessBoard.isWhite ? this.chessBoard.isWhite ? this.GetYCoordinate() == 8 : this.GetYCoordinate() == 1 : false;
        if (bool) {
            document.querySelector(".promotion-options").style.display = "flex";

            const knight = document.querySelector("#knight");
            const bishop = document.querySelector("#bishop");
            const rook = document.querySelector("#rook");
            const queen = document.querySelector("#queen");

            const k = document.querySelector("#knight").cloneNode(true);
            const b = document.querySelector("#bishop").cloneNode(true);
            const r = document.querySelector("#rook").cloneNode(true);
            const q = document.querySelector("#queen").cloneNode(true);

            knight.parentNode.replaceChild(k, knight);
            bishop.parentNode.replaceChild(b, bishop);
            rook.parentNode.replaceChild(r, rook);
            queen.parentNode.replaceChild(q, queen);

            this.chessBoard.game.selectionHandler.isPromotingPawn = true;

            k.addEventListener("click", () => this.Promote(Knight));
            b.addEventListener("click", () => this.Promote(Bishop));
            r.addEventListener("click", () => this.Promote(Rook));
            q.addEventListener("click", () => this.Promote(Queen));
        }
    }

    Promote(Type) {
        this.chessBoard.RemovePiece(this);
        this.chessBoard.CreatePiece(Type, this.isWhite ? 0xFFFFFF : 0x000000, this.coordinate);
        document.querySelector(".promotion-options").style.display = "none";
        this.chessBoard.game.GameManager.PromotePiece(this.coordinate, Type);        
        this.chessBoard.game.selectionHandler.isPromotingPawn = false;
        this.chessBoard.game.GameManager.SwitchTurn();
    }

    GetPossibleMoves() {
        const moves = [];
        let canCaptureOppKing = false;

        let xIndex = this.GetXIndex(),
            yIndex = this.GetYIndex(),
            steps = 2;

        if (this.hasMoved) steps = 1;

        if (this.isWhite) {
            for (let i = 1; i <= steps; i++) {
                if (yIndex + i <= this.chessBoard.y.length - 1) {
                    const yOffset = yIndex + i;
                    const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex] + this.chessBoard.y[yOffset]);
                    if (this.chessBoard.GetPieceOnNode(node)) break;
                    moves.push(node);
                }
            }

            if (yIndex + 1 <= this.chessBoard.y.length - 1) {
                if (xIndex + 1 <= this.chessBoard.x.length - 1) {
                    const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex + 1] + this.chessBoard.y[yIndex + 1]);
                    const piece = this.chessBoard.GetPieceOnNode(node);
                    if (piece) {
                        if (piece.isWhite != this.isWhite) moves.push(node);
                        if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                    }
                }
                if (xIndex - 1 >= 0) {   
                    const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex - 1] + this.chessBoard.y[yIndex + 1])
                    const piece = this.chessBoard.GetPieceOnNode(node);
                    if (piece) {
                        if (piece.isWhite != this.isWhite) moves.push(node);
                        if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                    }
                } 
            }
        } else if (!this.isWhite) {
            for (let i = 1; i <= steps; i++) {
                if (yIndex - i >= 0) {
                    const yOffset = yIndex - i;
                    const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex] + this.chessBoard.y[yOffset]);
                    if (this.chessBoard.GetPieceOnNode(node)) break;
                    moves.push(node);
                }
            }

            if (yIndex - 1 >= 0) {
                if (xIndex + 1 <= this.chessBoard.x.length - 1) {
                    const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex + 1] + this.chessBoard.y[yIndex - 1]);
                    const piece = this.chessBoard.GetPieceOnNode(node);
                    if (piece) {
                        if (piece.isWhite != this.isWhite) moves.push(node);
                        if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                    }
                }
                if (xIndex - 1 >= 0) {   
                    const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex - 1] + this.chessBoard.y[yIndex - 1])
                    const piece = this.chessBoard.GetPieceOnNode(node);
                    if (piece) {
                        if (piece.isWhite != this.isWhite) moves.push(node);
                        if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                    }
                } 
            }
        }

        return { moves: moves, canCaptureOppKing: canCaptureOppKing };
    }
}

class Rook extends Piece {
    constructor(chessBoard, side) {
        super(chessBoard, side);

        this.type = "Rook";

        this.LoadModel("../../resources/models/Rook.fbx");
    }

    GetPossibleMoves() {
        const moves = [];
        let canCaptureOppKing = false;

        const xIndex = this.GetXIndex();
        const yIndex = this.GetYIndex();
        
        for (let i = 1; i < this.chessBoard.x.length; i++) {
            const xOffset = xIndex + i;

            if (xOffset <= this.chessBoard.x.length - 1) {
                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xOffset] + this.chessBoard.y[yIndex]);
                const piece = this.chessBoard.GetPieceOnNode(node);
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node);
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                    break;
                }

                moves.push(node);
            }
        }

        for (let i = 1; i < this.chessBoard.x.length; i++) {
            const xOffset = xIndex - i;
        
            if (xOffset >= 0) {
                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xOffset] + this.chessBoard.y[yIndex]);
                const piece = this.chessBoard.GetPieceOnNode(node);

                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node);
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                    break;
                }

                moves.push(node);
            }
        }

        for (let i = 1; i < this.chessBoard.y.length; i++) {
            const yOffset = yIndex + i;

            if (yOffset <= this.chessBoard.y.length - 1) {
                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex] + this.chessBoard.y[yOffset]);
                const piece = this.chessBoard.GetPieceOnNode(node);

                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node);
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                    break;
                }

                moves.push(node);
            }
        }

        for (let i = 1; i < this.chessBoard.y.length; i++) {
            const yOffset = yIndex - i;

            if (yOffset >= 0) {
                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex] + this.chessBoard.y[yOffset]);
                const piece = this.chessBoard.GetPieceOnNode(node);
                
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node);
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                    break;
                }

                moves.push(node);
            }
        }

        return { moves: moves, canCaptureOppKing: canCaptureOppKing };
    }
}

class Knight extends Piece {
    constructor(chessBoard, side) {
        super(chessBoard, side);

        this.type = "Knight";

        this.LoadModel("../../resources/models/Knight.fbx");
    }

    GetPossibleMoves() {
        const moves = [];
        let canCaptureOppKing = false;

        const xIndex = this.GetXIndex();
        const yIndex = this.GetYIndex();

        if (yIndex + 2 <= this.chessBoard.y.length - 1) {
            if (xIndex + 1 <= this.chessBoard.x.length - 1) {
                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex + 1] + this.chessBoard.y[yIndex + 2]);
                const piece = this.chessBoard.GetPieceOnNode(node);
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node); 
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                } else moves.push(node);
            } 
            if (xIndex - 1 >= 0) {
                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex - 1] + this.chessBoard.y[yIndex + 2]);
                const piece = this.chessBoard.GetPieceOnNode(node);
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node); 
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                } else moves.push(node);
            }
        }

        if (yIndex - 2 >= 0) {
            if (xIndex + 1 <= this.chessBoard.x.length - 1) {
                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex + 1] + this.chessBoard.y[yIndex - 2]);
                const piece = this.chessBoard.GetPieceOnNode(node);
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node); 
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                } else moves.push(node);
            }
            if (xIndex - 1 >= 0) {
                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex - 1] + this.chessBoard.y[yIndex - 2]);
                const piece = this.chessBoard.GetPieceOnNode(node);
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node); 
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                } else moves.push(node);
            }
        }

        if (xIndex + 2 <= this.chessBoard.x.length - 1) {
            if (yIndex + 1 <= this.chessBoard.y.length - 1) {
                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex + 2] + this.chessBoard.y[yIndex + 1]);
                const piece = this.chessBoard.GetPieceOnNode(node);
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node); 
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                } else moves.push(node);
            }
            if (yIndex - 1 >= 0) {
                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex + 2] + this.chessBoard.y[yIndex - 1]);
                const piece = this.chessBoard.GetPieceOnNode(node);
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node); 
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                } else moves.push(node);
            }
        }

        if (xIndex - 2 >= 0) {
            if (yIndex + 1 <= this.chessBoard.y.length - 1) {
                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex - 2] + this.chessBoard.y[yIndex + 1]);
                const piece = this.chessBoard.GetPieceOnNode(node);
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node); 
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                } else moves.push(node);
            }
            if (yIndex - 1 >= 0) {
                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex - 2] + this.chessBoard.y[yIndex - 1]);
                const piece = this.chessBoard.GetPieceOnNode(node);
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node); 
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                } else moves.push(node);
            }
        }

        return { moves: moves, canCaptureOppKing: canCaptureOppKing };
    }
}

class Bishop extends Piece {
    constructor(chessBoard, side) {
        super(chessBoard, side);

        this.type = "Bishop";

        this.LoadModel("../../resources/models/Bishop.fbx");
    }
    
    GetPossibleMoves() {
        const moves = [];
        let canCaptureOppKing = false;

        let xIndex = this.GetXIndex();
        let yIndex = this.GetYIndex();


        for (let i = 1; i < this.chessBoard.x.length; i++) {
            if (xIndex + i <= this.chessBoard.x.length - 1 && yIndex + i <= this.chessBoard.y.length - 1) {
                const xOffset = xIndex + i;
                const yOffset = yIndex + i;

                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xOffset] + this.chessBoard.y[yOffset]);
                const piece = this.chessBoard.GetPieceOnNode(node);
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node);
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                    break;
                }

                moves.push(node);
            } 
        }
        for (let i = 1; i < this.chessBoard.x.length; i++) {
            if (xIndex - i >= 0 && yIndex + i <= this.chessBoard.y.length - 1) {
                const xOffset = xIndex - i;
                const yOffset = yIndex + i;

                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xOffset] + this.chessBoard.y[yOffset])
                const piece = this.chessBoard.GetPieceOnNode(node);
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node);
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                    break;
                }

                moves.push(node);
            }   
        }
        for (let i = 1; i < this.chessBoard.x.length; i++) {
            if (xIndex + i <= this.chessBoard.x.length - 1 && yIndex - i >= 0) {
                const xOffset = xIndex + i;
                const yOffset = yIndex - i;

                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xOffset] + this.chessBoard.y[yOffset])
                const piece = this.chessBoard.GetPieceOnNode(node);
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node);
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                    break;
                }

                moves.push(node);
            } 
        }
        for (let i = 1; i < this.chessBoard.x.length; i++) {
            if (xIndex - i >= 0 && yIndex - i >= 0) {
                const xOffset = xIndex - i;
                const yOffset = yIndex - i;

                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xOffset] + this.chessBoard.y[yOffset])
                const piece = this.chessBoard.GetPieceOnNode(node);
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node);
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                    break;
                }

                moves.push(node);
            }
        }

        return { moves: moves, canCaptureOppKing: canCaptureOppKing };
    }
}

class Queen extends Piece {
    constructor(chessBoard, side) {
        super(chessBoard, side);

        this.type = "Queen";

        this.LoadModel("../../resources/models/Queen.fbx");
    }

    GetPossibleMoves() {
        const moves = [];
        let canCaptureOppKing = false;

        let xIndex = this.GetXIndex();
        let yIndex = this.GetYIndex();

        for (let i = 1; i < this.chessBoard.x.length; i++) {
            const xOffset = xIndex + i;

            if (xOffset <= this.chessBoard.x.length - 1) {
                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xOffset] + this.chessBoard.y[yIndex]);
                const piece = this.chessBoard.GetPieceOnNode(node);

                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node);
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                    break;
                }

                moves.push(node);
            }
        }

        for (let i = 1; i < this.chessBoard.x.length; i++) {
            const xOffset = xIndex - i;
        
            if (xOffset >= 0) {
                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xOffset] + this.chessBoard.y[yIndex]);
                const piece = this.chessBoard.GetPieceOnNode(node);

                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node);
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                    break;
                }

                moves.push(node);
            }
        }

        for (let i = 1; i < this.chessBoard.y.length; i++) {
            const yOffset = yIndex + i;

            if (yOffset <= this.chessBoard.y.length - 1) {
                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex] + this.chessBoard.y[yOffset]);
                const piece = this.chessBoard.GetPieceOnNode(node);

                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node);
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                    break;
                }

                moves.push(node);
            }
        }

        for (let i = 1; i < this.chessBoard.y.length; i++) {
            const yOffset = yIndex - i;

            if (yOffset >= 0) {
                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex] + this.chessBoard.y[yOffset]);
                const piece = this.chessBoard.GetPieceOnNode(node);
                
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node);
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                    break;
                }

                moves.push(node);
            }
        }

        for (let i = 1; i < this.chessBoard.x.length; i++) {
            if (xIndex + i <= this.chessBoard.x.length - 1 && yIndex + i <= this.chessBoard.y.length - 1) {
                const xOffset = xIndex + i;
                const yOffset = yIndex + i;

                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xOffset] + this.chessBoard.y[yOffset]);
                const piece = this.chessBoard.GetPieceOnNode(node);
                
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node);
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                    break;
                }

                moves.push(node);
            } 
        }
        for (let i = 1; i < this.chessBoard.x.length; i++) {
            if (xIndex - i >= 0 && yIndex + i <= this.chessBoard.y.length - 1) {
                const xOffset = xIndex - i;
                const yOffset = yIndex + i;

                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xOffset] + this.chessBoard.y[yOffset])
                const piece = this.chessBoard.GetPieceOnNode(node);
                
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node);
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                    break;
                }

                moves.push(node);
            }   
        }
        for (let i = 1; i < this.chessBoard.x.length; i++) {
            if (xIndex + i <= this.chessBoard.x.length - 1 && yIndex - i >= 0) {
                const xOffset = xIndex + i;
                const yOffset = yIndex - i;

                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xOffset] + this.chessBoard.y[yOffset])
                const piece = this.chessBoard.GetPieceOnNode(node);
                
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node);
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                    break;
                }

                moves.push(node);
            } 
        }
        for (let i = 1; i < this.chessBoard.x.length; i++) {
            if (xIndex - i >= 0 && yIndex - i >= 0) {
                const xOffset = xIndex - i;
                const yOffset = yIndex - i;

                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xOffset] + this.chessBoard.y[yOffset])
                const piece = this.chessBoard.GetPieceOnNode(node);
                
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node);
                    if (piece.isWhite != this.isWhite && piece.type == "King") canCaptureOppKing = true;
                    break;
                }

                moves.push(node);
            }
        }

        return { moves: moves, canCaptureOppKing: canCaptureOppKing };
    }
}

class King extends Piece {
    constructor(chessBoard, side) {
        super(chessBoard, side);

        this.type = "King";
        this.hasMoved = false;

        this.LoadModel("../../resources/models/King.fbx");
    }

    SetCoordinate(coordinate) {
        this.coordinate = coordinate;
        this.currentNode = this.GetCurrentNode();
        this.hasMoved = true;

        if (this.model != null) {
            this.model.position.set(
                this.currentNode.mesh.position.x,
                this.currentNode.mesh.position.y + 0.5,
                this.currentNode.mesh.position.z
            );
        }
    }

    GetPossibleMoves() {
        const moves = [];
        
        const xIndex = this.GetXIndex();
        const yIndex = this.GetYIndex();

        if (yIndex + 1 <= this.chessBoard.y.length - 1) {
            if (xIndex + 1 <= this.chessBoard.x.length - 1) {
                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex + 1] + this.chessBoard.y[yIndex + 1]);
                const piece = this.chessBoard.GetPieceOnNode(node);
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node);
                } else moves.push(node);
            }
            if (xIndex - 1 >= 0) {
                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex - 1] + this.chessBoard.y[yIndex + 1]);
                const piece = this.chessBoard.GetPieceOnNode(node);
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node);
                } else moves.push(node);
            }
            const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex] + this.chessBoard.y[yIndex + 1])
            const piece = this.chessBoard.GetPieceOnNode(node);
            if (piece) {
                if (piece.isWhite != this.isWhite) moves.push(node);
            } else moves.push(node);
        }

        if (yIndex - 1 >= 0) {
            if (xIndex + 1 <= this.chessBoard.x.length - 1) {
                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex + 1] + this.chessBoard.y[yIndex - 1]);
                const piece = this.chessBoard.GetPieceOnNode(node);
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node);
                } else moves.push(node);
            }
            if (xIndex - 1 >= 0) {
                const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex - 1] + this.chessBoard.y[yIndex - 1]);
                const piece = this.chessBoard.GetPieceOnNode(node);
                if (piece) {
                    if (piece.isWhite != this.isWhite) moves.push(node);
                } else moves.push(node);
            }
            const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex] + this.chessBoard.y[yIndex - 1])
            const piece = this.chessBoard.GetPieceOnNode(node);
            if (piece) {
                if (piece.isWhite != this.isWhite) moves.push(node);
            } else moves.push(node);
        }

        if (xIndex + 1 <= this.chessBoard.x.length - 1) {
            const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex + 1] + (yIndex + 1));
            const piece = this.chessBoard.GetPieceOnNode(node);
            if (piece) {
                if (piece.isWhite != this.isWhite) moves.push(node);
            } else moves.push(node);
        }

        if (xIndex - 1 >= 0) {
            const node = this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[xIndex - 1] + (yIndex + 1));
            const piece = this.chessBoard.GetPieceOnNode(node);
            if (piece) {
                if (piece.isWhite != this.isWhite) moves.push(node);
            } else moves.push(node);
        }

        const castleMoves = [];

        const rookRight = this.chessBoard.GetPieceOnNode(this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[this.chessBoard.x.length - 1] + this.GetYCoordinate()));
        const rookLeft = this.chessBoard.GetPieceOnNode(this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[0] + this.GetYCoordinate()));

        if (!this.hasMoved) {
            if (rookRight) {
                let canCastle = true;
                for (let i = this.GetXIndex() + 1; i < this.chessBoard.x.length - 1; i++) { 
                    const piece = this.chessBoard.GetPieceOnNode(this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[i] + this.GetYCoordinate()));

                    if (piece) canCastle = false;
                }
                const node = this.chessBoard.GetNodeFromCoordinate("G" + this.GetYCoordinate());
                if (canCastle) castleMoves.push(node);
            }

            if (rookLeft) {
                let canCastle = true;
                for (let i = this.GetXIndex() - 1; i > 0; i--) { 
                    const piece = this.chessBoard.GetPieceOnNode(this.chessBoard.GetNodeFromCoordinate(this.chessBoard.x[i] + this.GetYCoordinate()));

                    if (piece) canCastle = false;
                }
                const node = this.chessBoard.GetNodeFromCoordinate("C" + this.GetYCoordinate());
                if (canCastle) castleMoves.push(node);
            }
        }

        return { moves: moves, castleMoves: castleMoves };
    }
}

export { Pawn, Rook, Knight, Bishop, Queen, King }