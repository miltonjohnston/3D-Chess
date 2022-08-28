import 'https://cdn.jsdelivr.net/npm/socket.io-client@3.1.3/dist/socket.io.min.js';


class SocketManager {
    constructor() {
        this.SOCKET = io();
    }

    EmitEvent(event, data) {
        this.SOCKET.emit(event, data);
    }
}

export { SocketManager }