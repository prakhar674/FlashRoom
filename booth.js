/* =========================================================
   FLASHROOM — 2 PERSON PHOTO BOOTH
   booth.js
========================================================= */

const socket = io();

/* =========================================================
   ELEMENTS
========================================================= */

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const captureBtn = document.getElementById("captureBtn");
const countdown = document.getElementById("countdown");
const countdownNumber = document.getElementById("countdownNumber");

const flash = document.getElementById("cameraFlash");

const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");

const roomCodeElement = document.getElementById("roomCode");
const photoStrip = document.getElementById("photoStrip");
const photoCount = document.getElementById("photoCount");

const micBtn = document.getElementById("micBtn");
const cameraBtn = document.getElementById("cameraBtn");
const exitBtn = document.getElementById("exitBtn");

/* =========================================================
   VARIABLES
========================================================= */

let localStream = null;
let peerConnection = null;

let roomId = localStorage.getItem("roomId");
let username = localStorage.getItem("username") || "Guest";

let photos = [];

let micEnabled = true;
let cameraEnabled = true;

let isHost = false;

const peerConfig = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};

/* =========================================================
   ROOM ID
========================================================= */

if (!roomId) {
    roomId =
        "FR-" +
        Math.random()
            .toString(36)
            .substring(2, 7)
            .toUpperCase();

    localStorage.setItem("roomId", roomId);
}

if (roomCodeElement) {
    roomCodeElement.textContent = "ROOM " + roomId;
}

/* =========================================================
   START CAMERA
========================================================= */

async function startCamera() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user",
                width: {
                    ideal: 1280
                },
                height: {
                    ideal: 720
                }
            },
            audio: true
        });

        if (localVideo) {
            localVideo.srcObject = localStream;
            localVideo.muted = true;
            localVideo.play().catch(() => {});
        }

        console.log("Camera started");

        socket.emit("join-room", {
            roomId: roomId,
            username: username
        });

    } catch (error) {
        console.error("Camera error:", error);

        showSystemMessage(
            "Camera/microphone permission is required for the booth."
        );
    }
}

/* =========================================================
   CREATE PEER CONNECTION
========================================================= */

function createPeerConnection() {

    peerConnection = new RTCPeerConnection(peerConfig);

    if (localStream) {
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(
                track,
                localStream
            );
        });
    }

    peerConnection.ontrack = event => {

        if (!remoteVideo) return;

        if (event.streams && event.streams[0]) {

            remoteVideo.srcObject =
                event.streams[0];

            remoteVideo.play().catch(() => {});

            hideWaitingScreen();
        }
    };

    peerConnection.onicecandidate = event => {

        if (event.candidate) {

            socket.emit("ice-candidate", {
                roomId: roomId,
                candidate: event.candidate
            });
        }
    };

    peerConnection.onconnectionstatechange = () => {

        console.log(
            "Connection:",
            peerConnection.connectionState
        );

        if (
            peerConnection.connectionState ===
            "connected"
        ) {
            hideWaitingScreen();
        }
    };
}

/* =========================================================
   SOCKET — ROOM JOIN
========================================================= */

socket.on("room-created", data => {

    isHost = true;

    console.log(
        "Room created:",
        data.roomId
    );

    showSystemMessage(
        "Room created. Waiting for your friend..."
    );
});

/* =========================================================
   SOME SERVER VERSIONS MAY USE THIS
========================================================= */

socket.on("room-joined", data => {

    console.log(
        "Joined room:",
        data
    );
});

/* =========================================================
   FRIEND JOINED
========================================================= */

socket.on("user-joined", async data => {

    console.log(
        "Friend joined:",
        data
    );

    showSystemMessage(
        `${data.username || "Your friend"} joined the room!`
    );

    if (!peerConnection) {
        createPeerConnection();
    }

    try {

        const offer =
            await peerConnection.createOffer();

        await peerConnection.setLocalDescription(
            offer
        );

        socket.emit("offer", {
            roomId: roomId,
            offer: offer
        });

    } catch (error) {

        console.error(
            "Offer error:",
            error
        );
    }
});

/* =========================================================
   RECEIVE OFFER
========================================================= */

socket.on("offer", async data => {

    console.log("Offer received");

    if (!peerConnection) {
        createPeerConnection();
    }

    try {

        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(
                data.offer
            )
        );

        const answer =
            await peerConnection.createAnswer();

        await peerConnection.setLocalDescription(
            answer
        );

        socket.emit("answer", {
            roomId: roomId,
            answer: answer
        });

    } catch (error) {

        console.error(
            "Answer error:",
            error
        );
    }
});

/* =========================================================
   RECEIVE ANSWER
========================================================= */

socket.on("answer", async data => {

    console.log("Answer received");

    if (!peerConnection) return;

    try {

        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(
                data.answer
            )
        );

    } catch (error) {

        console.error(
            "Remote description error:",
            error
        );
    }
});

/* =========================================================
   ICE CANDIDATE
========================================================= */

socket.on("ice-candidate", async data => {

    if (!peerConnection) return;

    try {

        await peerConnection.addIceCandidate(
            new RTCIceCandidate(
                data.candidate
            )
        );

    } catch (error) {

        console.error(
            "ICE error:",
            error
        );
    }
});

/* =========================================================
   FRIEND LEFT
========================================================= */

socket.on("user-left", data => {

    showSystemMessage(
        `${data?.username || "Your friend"} left the room.`
    );

    showWaitingScreen();

    if (remoteVideo) {
        remoteVideo.srcObject = null;
    }

    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
});

/* =========================================================
   WAITING SCREEN
========================================================= */

function showWaitingScreen() {

    const overlay =
        document.querySelector(".waiting-overlay");

    if (overlay) {
        overlay.style.display = "flex";
    }
}

function hideWaitingScreen() {

    const overlay =
        document.querySelector(".waiting-overlay");

    if (overlay) {
        overlay.style.display = "none";
    }
}

/* =========================================================
   SYSTEM MESSAGE
========================================================= */

function showSystemMessage(message) {

    if (!chatMessages) return;

    const div =
        document.createElement("div");

    div.className =
        "chat-message";

    div.innerHTML =
        `<span class="chat-name">FLASHROOM</span>${escapeHTML(message)}`;

    chatMessages.appendChild(div);

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}

/* =========================================================
   CHAT
========================================================= */

if (chatForm) {

    chatForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const message =
                chatInput.value.trim();

            if (!message) return;

            socket.emit("chat-message", {
                roomId: roomId,
                username: username,
                message: message
            });

            addChatMessage(
                username,
                message,
                true
            );

            chatInput.value = "";
        }
    );
}

/* =========================================================
   RECEIVE CHAT
========================================================= */

socket.on("chat-message", data => {

    if (!data) return;

    if (
        data.username === username
    ) {
        return;
    }

    addChatMessage(
        data.username || "Friend",
        data.message || "",
        false
    );
});

/* =========================================================
   ADD CHAT MESSAGE
========================================================= */

function addChatMessage(
    name,
    message,
    mine
) {

    if (!chatMessages) return;

    const div =
        document.createElement("div");

    div.className =
        "chat-message" +
        (mine ? " mine" : "");

    div.innerHTML =
        `<span class="chat-name">${escapeHTML(name)}</span>${escapeHTML(message)}`;

    chatMessages.appendChild(div);

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}

/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(text) {

    const element =
        document.createElement("div");

    element.textContent =
        String(text);

    return element.innerHTML;
}

/* =========================================================
   MICROPHONE
========================================================= */

if (micBtn) {

    micBtn.addEventListener(
        "click",
        () => {

            if (!localStream) return;

            const audioTracks =
                localStream.getAudioTracks();

            if (!audioTracks.length) return;

            micEnabled =
                !micEnabled;

            audioTracks.forEach(track => {
                track.enabled =
                    micEnabled;
            });

            micBtn.textContent =
                micEnabled
                    ? "🎙️"
                    : "🔇";
        }
    );
}

/* =========================================================
   CAMERA ON/OFF
========================================================= */

if (cameraBtn) {

    cameraBtn.addEventListener(
        "click",
        () => {

            if (!localStream) return;

            const videoTracks =
                localStream.getVideoTracks();

            if (!videoTracks.length) return;

            cameraEnabled =
                !cameraEnabled;

            videoTracks.forEach(track => {
                track.enabled =
                    cameraEnabled;
            });

            cameraBtn.textContent =
                cameraEnabled
                    ? "📷"
                    : "🚫";
        }
    );
}

/* =========================================================
   CAPTURE BUTTON
========================================================= */

if (captureBtn) {

    captureBtn.addEventListener(
        "click",
        startPhotoSequence
    );
}

/* =========================================================
   PHOTO SEQUENCE
========================================================= */

async function startPhotoSequence() {

    if (!cameraEnabled) {

        showSystemMessage(
            "Turn your camera on before taking a photo."
        );

        return;
    }

    captureBtn.disabled = true;

    await countdownAnimation(3);
    capturePhoto();

    await wait(700);

    captureBtn.disabled = false;
}

/* =========================================================
   COUNTDOWN
========================================================= */

async function countdownAnimation(seconds) {

    if (!countdown || !countdownNumber) return;

    countdown.classList.add("show");

    for (
        let number = seconds;
        number > 0;
        number--
    ) {

        countdownNumber.textContent =
            number;

        countdownNumber.style.animation =
            "none";

        void countdownNumber.offsetWidth;

        countdownNumber.style.animation =
            "countdownPop 0.8s ease";

        await wait(900);
    }

    countdownNumber.textContent =
        "📸";

    await wait(300);

    countdown.classList.remove("show");
}

/* =========================================================
   CAPTURE PHOTO
========================================================= */

function capturePhoto() {

    if (!localVideo) return;

    const canvas =
        document.createElement("canvas");

    const width =
        localVideo.videoWidth || 1280;

    const height =
        localVideo.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx =
        canvas.getContext("2d");

    /* Mirror the local camera */
    ctx.translate(width, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(
        localVideo,
        0,
        0,
        width,
        height
    );

    const image =
        canvas.toDataURL(
            "image/jpeg",
            0.92
        );

    photos.push(image);

    updatePhotoStrip();

    playFlash();

    socket.emit("photo-captured", {
        roomId: roomId,
        image: image,
        username: username
    });
}

/* =========================================================
   FRIEND PHOTO
========================================================= */

socket.on("photo-captured", data => {

    if (!data || !data.image) return;

    /*
       We don't add the friend's photo
       as a duplicate local photo.
       It can be used later for the
       combined strip.
    */

    showSystemMessage(
        `${data.username || "Your friend"} took a photo 📸`
    );
});

/* =========================================================
   PHOTO STRIP
========================================================= */

function updatePhotoStrip() {

    if (!photoStrip) return;

    photoStrip.innerHTML = "";

    photos.forEach(
        (photo, index) => {

            const slot =
                document.createElement("div");

            slot.className =
                "photo-slot";

            const img =
                document.createElement("img");

            img.src = photo;

            img.alt =
                `Photo ${index + 1}`;

            slot.appendChild(img);

            photoStrip.appendChild(slot);
        }
    );

    if (photoCount) {

        photoCount.textContent =
            `${photos.length}/4`;
    }
}

/* =========================================================
   FLASH
========================================================= */

function playFlash() {

    if (!flash) return;

    flash.classList.remove("active");

    void flash.offsetWidth;

    flash.classList.add("active");
}

/* =========================================================
   WAIT
========================================================= */

function wait(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );
}

/* =========================================================
   EXIT ROOM
========================================================= */

if (exitBtn) {

    exitBtn.addEventListener(
        "click",
        exitRoom
    );
}

function exitRoom() {

    if (
        !confirm(
            "Leave this photo booth?"
        )
    ) {
        return;
    }

    stopCamera();

    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    socket.emit(
        "leave-room",
        {
            roomId: roomId,
            username: username
        }
    );

    window.location.href =
        "index.html";
}

/* =========================================================
   STOP CAMERA
========================================================= */

function stopCamera() {

    if (!localStream) return;

    localStream
        .getTracks()
        .forEach(track => {
            track.stop();
        });

    localStream = null;

    if (localVideo) {
        localVideo.srcObject = null;
    }
}

/* =========================================================
   PAGE EXIT
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (localStream) {

            localStream
                .getTracks()
                .forEach(track => {
                    track.stop();
                });
        }

        socket.emit(
            "leave-room",
            {
                roomId: roomId,
                username: username
            }
        );
    }
);

/* =========================================================
   START
========================================================= */

startCamera();

console.log(
    "✨ FLASHROOM booth started"
);