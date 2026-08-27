/* =========================================================
   FLASHROOM — WAITING ROOM
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const username =
        localStorage.getItem(
            "username"
        ) || "Guest";

    let roomId =
        localStorage.getItem(
            "roomId"
        );

    const roomCode =
        document.getElementById(
            "roomCode"
        );

    const usernameDisplay =
        document.getElementById(
            "usernameDisplay"
        );

    const createRoomBtn =
        document.getElementById(
            "createRoomBtn"
        );

    const soloBtn =
        document.getElementById(
            "soloBtn"
        );

    const groupBtn =
        document.getElementById(
            "groupBtn"
        );

    const inviteBtn =
        document.getElementById(
            "inviteBtn"
        );

    /* ---------- Username ---------- */

    if (usernameDisplay) {
        usernameDisplay.textContent =
            username;
    }

    /* ---------- Create Room ---------- */

    function createRoom() {

        roomId =
            "FR-" +
            Math.random()
                .toString(36)
                .substring(2, 7)
                .toUpperCase();

        localStorage.setItem(
            "roomId",
            roomId
        );

        if (roomCode) {
            roomCode.textContent =
                roomId;
        }

        if (createRoomBtn) {

            createRoomBtn.textContent =
                "ROOM CREATED ✓";
        }
    }

    if (createRoomBtn) {

        createRoomBtn.addEventListener(
            "click",
            createRoom
        );
    }

    /* ---------- Solo Booth ---------- */

    if (soloBtn) {

        soloBtn.addEventListener(
            "click",
            () => {

                localStorage.setItem(
                    "boothMode",
                    "solo"
                );

                window.location.href =
                    "solobooth.html";
            }
        );
    }

    /* ---------- Group Booth ---------- */

    if (groupBtn) {

        groupBtn.addEventListener(
            "click",
            () => {

                if (!roomId) {
                    createRoom();
                }

                localStorage.setItem(
                    "boothMode",
                    "group"
                );

                window.location.href =
                    "booth.html";
            }
        );
    }

    /* ---------- Invite ---------- */

    if (inviteBtn) {

        inviteBtn.addEventListener(
            "click",
            async () => {

                if (!roomId) {
                    createRoom();
                }

                const inviteText =
                    `Join my FlashRoom 📸\nRoom: ${roomId}`;

                try {

                    if (
                        navigator.share
                    ) {

                        await navigator.share({
                            title:
                                "FlashRoom",
                            text:
                                inviteText
                        });

                    } else {

                        await navigator.clipboard
                            .writeText(
                                inviteText
                            );

                        alert(
                            "Invite copied!"
                        );
                    }

                } catch (error) {

                    console.log(
                        "Share cancelled."
                    );
                }
            }
        );
    }

});