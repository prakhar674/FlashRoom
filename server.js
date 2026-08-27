/* =========================================================
   FLASHROOM — SERVER
   Room System + Socket.IO + WebRTC Signaling
========================================================= */

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});


/* =========================================================
   SETTINGS
========================================================= */

const PORT = process.env.PORT || 3000;


/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
   Serve everything from the FlashRoom folder.
*/
app.use(express.static(path.join(__dirname)));


/* =========================================================
   ROOM STORAGE
========================================================= */

const rooms = new Map();

/*
Room format:

rooms = {
    "FR-A7K2": {
        host: socketId,
        users: [
            {
                id: socketId,
                username: "Guest"
            }
        ]
    }
}
*/


/* =========================================================
   ROOM CODE GENERATOR
========================================================= */

function generateRoomCode() {

    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code;

    do {

        code = "FR-";

        for (let i = 0; i < 4; i++) {
            code += characters[
                Math.floor(Math.random() * characters.length)
            ];
        }

    } while (rooms.has(code));

    return code;
}


/* =========================================================
   FIND USER
========================================================= */

function getUser(roomCode, socketId) {

    const room = rooms.get(roomCode);

    if (!room) {
        return null;
    }

    return room.users.find(
        user => user.id === socketId
    );
}


/* =========================================================
   ROOM INFO
========================================================= */

function getRoomUsers(roomCode) {

    const room = rooms.get(roomCode);

    if (!room) {
        return [];
    }

    return room.users.map(user => ({
        id: user.id,
        username: user.username
    }));
}


/* =========================================================
   HOME ROUTE
========================================================= */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});


/* =========================================================
   SOCKET CONNECTION
========================================================= */

io.on("connection", (socket) => {

    console.log(
        "Connected:",
        socket.id
    );


    /* =====================================================
       CREATE ROOM
    ===================================================== */

    socket.on("create-room", (username, callback) => {

        const roomCode = generateRoomCode();

        const safeUsername =
            typeof username === "string" &&
            username.trim()
                ? username.trim().slice(0, 30)
                : "Guest";

        rooms.set(roomCode, {

            host: socket.id,

            users: [
                {
                    id: socket.id,
                    username: safeUsername
                }
            ]

        });

        socket.join(roomCode);

        socket.roomCode = roomCode;
        socket.username = safeUsername;

        console.log(
            `Room created: ${roomCode} by ${safeUsername}`
        );


        socket.emit("room-created", {

            roomCode,
            username: safeUsername,
            isHost: true

        });


        socket.emit("room-users", {
            users: getRoomUsers(roomCode)
        });


        if (typeof callback === "function") {

            callback({
                success: true,
                roomCode
            });

        }

    });


    /* =====================================================
       JOIN ROOM
    ===================================================== */

    socket.on("join-room", (data, callback) => {

        if (!data) {
            return;
        }

        const roomCode =
            String(
                data.roomCode || ""
            )
            .trim()
            .toUpperCase();

        const safeUsername =
            typeof data.username === "string" &&
            data.username.trim()
                ? data.username.trim().slice(0, 30)
                : "Guest";


        if (!roomCode) {

            socket.emit("room-error", {
                message: "Please enter a room code."
            });

            if (typeof callback === "function") {
                callback({
                    success: false,
                    message: "Please enter a room code."
                });
            }

            return;
        }


        const room = rooms.get(roomCode);


        if (!room) {

            socket.emit("room-error", {
                message: "Room not found."
            });

            if (typeof callback === "function") {
                callback({
                    success: false,
                    message: "Room not found."
                });
            }

            return;
        }


        /*
           FlashRoom is currently a 2-person booth.
        */

        if (room.users.length >= 2) {

            socket.emit("room-full");

            if (typeof callback === "function") {
                callback({
                    success: false,
                    message: "This room is full."
                });
            }

            return;
        }


        room.users.push({

            id: socket.id,
            username: safeUsername

        });


        socket.join(roomCode);

        socket.roomCode = roomCode;
        socket.username = safeUsername;


        console.log(
            `${safeUsername} joined ${roomCode}`
        );


        /* Tell new user */

        socket.emit("room-joined", {

            roomCode,
            username: safeUsername,
            isHost: false,
            users: getRoomUsers(roomCode)

        });


        /* Tell everyone current users */

        io.to(roomCode).emit("room-users", {
            users: getRoomUsers(roomCode)
        });


        /*
           Tell host that someone joined.
        */

        socket.to(roomCode).emit(
            "friend-joined",
            {
                user: {
                    id: socket.id,
                    username: safeUsername
                }
            }
        );


        /*
           Useful for WebRTC.
        */

        socket.to(roomCode).emit(
            "peer-joined",
            {
                peerId: socket.id,
                username: safeUsername
            }
        );


        if (typeof callback === "function") {

            callback({
                success: true,
                roomCode
            });

        }

    });


    /* =====================================================
       WEBRTC OFFER
    ===================================================== */

    socket.on("webrtc-offer", (data) => {

        if (!data) return;

        const roomCode = socket.roomCode;

        if (!roomCode) return;


        socket.to(roomCode).emit(
            "webrtc-offer",
            {
                offer: data.offer,
                from: socket.id,
                username: socket.username
            }
        );

    });


    /*
       Alias for clients using "offer".
    */

    socket.on("offer", (data) => {

        if (!data) return;

        const roomCode = socket.roomCode;

        if (!roomCode) return;

        socket.to(roomCode).emit(
            "offer",
            {
                offer: data.offer,
                from: socket.id,
                username: socket.username
            }
        );

    });


    /* =====================================================
       WEBRTC ANSWER
    ===================================================== */

    socket.on("webrtc-answer", (data) => {

        if (!data) return;

        const roomCode = socket.roomCode;

        if (!roomCode) return;


        socket.to(roomCode).emit(
            "webrtc-answer",
            {
                answer: data.answer,
                from: socket.id,
                username: socket.username
            }
        );

    });


    /*
       Alias for clients using "answer".
    */

    socket.on("answer", (data) => {

        if (!data) return;

        const roomCode = socket.roomCode;

        if (!roomCode) return;

        socket.to(roomCode).emit(
            "answer",
            {
                answer: data.answer,
                from: socket.id,
                username: socket.username
            }
        );

    });


    /* =====================================================
       ICE CANDIDATE
    ===================================================== */

    socket.on("ice-candidate", (data) => {

        if (!data) return;

        const roomCode = socket.roomCode;

        if (!roomCode) return;


        socket.to(roomCode).emit(
            "ice-candidate",
            {
                candidate: data.candidate,
                from: socket.id
            }
        );

    });


    /*
       WebRTC alias.
    */

    socket.on("webrtc-candidate", (data) => {

        if (!data) return;

        const roomCode = socket.roomCode;

        if (!roomCode) return;


        socket.to(roomCode).emit(
            "webrtc-candidate",
            {
                candidate: data.candidate,
                from: socket.id
            }
        );

    });


    /* =====================================================
       CHAT
    ===================================================== */

    socket.on("chat-message", (message) => {

        const roomCode = socket.roomCode;

        if (!roomCode) return;


        let text;

        if (typeof message === "string") {

            text = message;

        } else if (
            message &&
            typeof message.text === "string"
        ) {

            text = message.text;

        } else {

            return;

        }


        text = text.trim().slice(0, 500);

        if (!text) return;


        const chatData = {

            id: Date.now(),

            senderId: socket.id,

            username:
                socket.username || "Guest",

            text,

            time:
                new Date().toLocaleTimeString(
                    [],
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                )

        };


        io.to(roomCode).emit(
            "chat-message",
            chatData
        );

    });


    /* =====================================================
       TYPING
    ===================================================== */

    socket.on("typing", (isTyping) => {

        const roomCode = socket.roomCode;

        if (!roomCode) return;


        socket.to(roomCode).emit(
            "typing",
            {
                username:
                    socket.username || "Guest",

                isTyping: Boolean(isTyping)
            }
        );

    });


    /* =====================================================
       CAMERA STATUS
    ===================================================== */

    socket.on("camera-status", (status) => {

        const roomCode = socket.roomCode;

        if (!roomCode) return;


        socket.to(roomCode).emit(
            "friend-camera-status",
            {
                userId: socket.id,
                status: status
            }
        );

    });


    /* =====================================================
       MICROPHONE STATUS
    ===================================================== */

    socket.on("microphone-status", (status) => {

        const roomCode = socket.roomCode;

        if (!roomCode) return;


        socket.to(roomCode).emit(
            "friend-microphone-status",
            {
                userId: socket.id,
                status: status
            }
        );

    });


    /* =====================================================
       PHOTO CAPTURE SYNC
    ===================================================== */

    socket.on("photo-captured", (data) => {

        const roomCode = socket.roomCode;

        if (!roomCode) return;


        socket.to(roomCode).emit(
            "friend-photo-captured",
            {
                ...data,
                userId: socket.id,
                username:
                    socket.username || "Guest"
            }
        );

    });


    /* =====================================================
       PHOTO INDEX / COUNTDOWN SYNC
    ===================================================== */

    socket.on("photo-countdown", (data) => {

        const roomCode = socket.roomCode;

        if (!roomCode) return;


        socket.to(roomCode).emit(
            "photo-countdown",
            {
                ...data,
                userId: socket.id
            }
        );

    });


    /* =====================================================
       READY STATUS
    ===================================================== */

    socket.on("ready", () => {

        const roomCode = socket.roomCode;

        if (!roomCode) return;


        socket.to(roomCode).emit(
            "friend-ready",
            {
                userId: socket.id,
                username:
                    socket.username || "Guest"
            }
        );

    });


    /* =====================================================
       START BOOTH
    ===================================================== */

    socket.on("start-booth", () => {

        const roomCode = socket.roomCode;

        if (!roomCode) return;


        io.to(roomCode).emit(
            "booth-started"
        );

    });


    /* =====================================================
       LEAVE ROOM
    ===================================================== */

    socket.on("leave-room", () => {

        leaveRoom(socket);

    });


    /* =====================================================
       DISCONNECT
    ===================================================== */

    socket.on("disconnect", () => {

        console.log(
            "Disconnected:",
            socket.id
        );

        leaveRoom(socket);

    });

});


/* =========================================================
   LEAVE ROOM FUNCTION
========================================================= */

function leaveRoom(socket) {

    const roomCode = socket.roomCode;

    if (!roomCode) {
        return;
    }


    const room = rooms.get(roomCode);

    if (!room) {
        return;
    }


    room.users =
        room.users.filter(
            user => user.id !== socket.id
        );


    socket.leave(roomCode);


    /*
       Tell remaining user.
    */

    socket.to(roomCode).emit(
        "friend-left",
        {
            userId: socket.id,
            username:
                socket.username || "Guest"
        }
    );


    socket.to(roomCode).emit(
        "peer-left",
        {
            peerId: socket.id
        }
    );


    /*
       Update user list.
    */

    io.to(roomCode).emit(
        "room-users",
        {
            users: getRoomUsers(roomCode)
        }
    );


    /*
       Delete empty room.
    */

    if (room.users.length === 0) {

        rooms.delete(roomCode);

        console.log(
            `Room deleted: ${roomCode}`
        );

    }


    socket.roomCode = null;
    socket.username = null;

}


/* =========================================================
   SERVER START
========================================================= */

server.listen(PORT, () => {

    console.log(
        "======================================"
    );

    console.log(
        "        FLASHROOM SERVER"
    );

    console.log(
        "======================================"
    );

    console.log(
        `Server running on port ${PORT}`
    );

    console.log(
        "======================================"

    );

});