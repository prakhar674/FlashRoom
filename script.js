/* =========================================================
   FLASHROOM — SHARED SCRIPT
========================================================= */

const FlashRoom = {

    getUsername() {
        return localStorage.getItem("flashroom_username") || "Guest";
    },

    getRoomCode() {
        return localStorage.getItem("flashroom_room") || "";
    },

    saveRoomCode(code) {
        localStorage.setItem(
            "flashroom_room",
            code.toUpperCase().trim()
        );
    },

    clearRoom() {
        localStorage.removeItem("flashroom_room");
    },

    generateRoomCode() {

        const characters =
            "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        let code = "";

        for (let i = 0; i < 4; i++) {

            code += characters[
                Math.floor(
                    Math.random() * characters.length
                )
            ];

        }

        return "FR-" + code;
    },

    goTo(page) {
        window.location.href = page;
    },

    isCameraSupported() {
        return !!(
            navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia
        );
    },

    async getCamera(options = {}) {

        const constraints = {

            video: options.video !== false
                ? {
                    facingMode:
                        options.facingMode || "user"
                }
                : false,

            audio: options.audio === true

        };

        return navigator.mediaDevices
            .getUserMedia(constraints);
    },

    stopStream(stream) {

        if (!stream) return;

        stream.getTracks().forEach(track => {
            track.stop();
        });

    },

    downloadDataURL(dataURL, filename) {

        const link =
            document.createElement("a");

        link.href = dataURL;
        link.download = filename;

        document.body.appendChild(link);

        link.click();

        link.remove();

    }

};


/* =========================================================
   GLOBAL PAGE HELPERS
========================================================= */

function getFlashRoomUsername() {

    return FlashRoom.getUsername();

}


function getFlashRoomCode() {

    return FlashRoom.getRoomCode();

}


function createFlashRoom() {

    const code =
        FlashRoom.generateRoomCode();

    FlashRoom.saveRoomCode(code);

    return code;

}


/* =========================================================
   PAGE EXIT
========================================================= */

function leaveFlashRoom() {

    FlashRoom.clearRoom();

    window.location.href =
        "index.html";

}


/* =========================================================
   CAMERA ERROR HELPER
========================================================= */

function showCameraError(error) {

    console.error(
        "FlashRoom camera error:",
        error
    );

    let message =
        "Camera could not be started.";

    if (
        error &&
        error.name === "NotAllowedError"
    ) {

        message =
            "Camera permission was denied. Please allow camera access.";

    } else if (
        error &&
        error.name === "NotFoundError"
    ) {

        message =
            "No camera was found on this device.";

    } else if (
        error &&
        error.name === "NotReadableError"
    ) {

        message =
            "The camera is already being used by another app.";

    }

    return message;

}


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const username =
            FlashRoom.getUsername();

        document
            .querySelectorAll(
                "[data-flashroom-username]"
            )
            .forEach(element => {

                element.textContent =
                    username;

            });

        const roomCode =
            FlashRoom.getRoomCode();

        document
            .querySelectorAll(
                "[data-flashroom-room]"
            )
            .forEach(element => {

                element.textContent =
                    roomCode || "NO ROOM";

            });

    }
);