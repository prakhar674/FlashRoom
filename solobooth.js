/* =========================================================
   FLASHROOM — SOLO BOOTH
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const video =
        document.getElementById(
            "soloVideo"
        ) ||
        document.getElementById(
            "localVideo"
        );

    const captureBtn =
        document.getElementById(
            "captureBtn"
        );

    const cameraBtn =
        document.getElementById(
            "cameraBtn"
        );

    const countdown =
        document.getElementById(
            "countdown"
        );

    const countdownNumber =
        document.getElementById(
            "countdownNumber"
        );

    const flash =
        document.getElementById(
            "cameraFlash"
        );

    const photoStrip =
        document.getElementById(
            "photoStrip"
        );

    const photoCount =
        document.getElementById(
            "photoCount"
        );

    const exitBtn =
        document.getElementById(
            "exitBtn"
        );

    let stream = null;

    let cameraOn = true;

    let photos = [];

    /* ---------- Start Camera ---------- */

    async function startCamera() {

        try {

            stream =
                await navigator.mediaDevices
                    .getUserMedia({
                        video: {
                            facingMode:
                                "user",
                            width: {
                                ideal: 1280
                            },
                            height: {
                                ideal: 720
                            }
                        },
                        audio: false
                    });

            if (video) {

                video.srcObject =
                    stream;

                video.muted =
                    true;

                video.play()
                    .catch(() => {});
            }

        } catch (error) {

            console.error(
                error
            );

            alert(
                "Please allow camera access."
            );
        }
    }

    /* ---------- Camera Toggle ---------- */

    if (cameraBtn) {

        cameraBtn.addEventListener(
            "click",
            () => {

                if (!stream) return;

                cameraOn =
                    !cameraOn;

                stream
                    .getVideoTracks()
                    .forEach(
                        track => {
                            track.enabled =
                                cameraOn;
                        }
                    );

                cameraBtn.textContent =
                    cameraOn
                        ? "📷"
                        : "🚫";
            }
        );
    }

    /* ---------- Capture ---------- */

    if (captureBtn) {

        captureBtn.addEventListener(
            "click",
            async () => {

                if (!cameraOn)
                    return;

                captureBtn.disabled =
                    true;

                await countdownAnimation();

                capture();

                captureBtn.disabled =
                    false;
            }
        );
    }

    /* ---------- Countdown ---------- */

    async function countdownAnimation() {

        if (!countdown ||
            !countdownNumber) {
            return;
        }

        countdown.classList.add(
            "show"
        );

        for (
            let i = 3;
            i >= 1;
            i--
        ) {

            countdownNumber.textContent =
                i;

            await wait(800);
        }

        countdownNumber.textContent =
            "📸";

        await wait(300);

        countdown.classList.remove(
            "show"
        );
    }

    /* ---------- Capture Photo ---------- */

    function capture() {

        if (!video) return;

        const canvas =
            document.createElement(
                "canvas"
            );

        const width =
            video.videoWidth ||
            1280;

        const height =
            video.videoHeight ||
            720;

        canvas.width =
            width;

        canvas.height =
            height;

        const ctx =
            canvas.getContext(
                "2d"
            );

        ctx.translate(
            width,
            0
        );

        ctx.scale(
            -1,
            1
        );

        ctx.drawImage(
            video,
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

        if (photos.length > 4) {
            photos.shift();
        }

        updateStrip();

        flashEffect();
    }

    /* ---------- Update Strip ---------- */

    function updateStrip() {

        if (!photoStrip)
            return;

        photoStrip.innerHTML =
            "";

        photos.forEach(
            (photo, index) => {

                const slot =
                    document.createElement(
                        "div"
                    );

                slot.className =
                    "photo-slot";

                const img =
                    document.createElement(
                        "img"
                    );

                img.src =
                    photo;

                img.alt =
                    "Photo " +
                    (index + 1);

                slot.appendChild(
                    img
                );

                photoStrip.appendChild(
                    slot
                );
            }
        );

        if (photoCount) {

            photoCount.textContent =
                `${photos.length}/4`;
        }
    }

    /* ---------- Flash ---------- */

    function flashEffect() {

        if (!flash)
            return;

        flash.classList.remove(
            "active"
        );

        void flash.offsetWidth;

        flash.classList.add(
            "active"
        );
    }

    /* ---------- Exit ---------- */

    if (exitBtn) {

        exitBtn.addEventListener(
            "click",
            () => {

                stopCamera();

                window.location.href =
                    "waiting.html";
            }
        );
    }

    function stopCamera() {

        if (!stream)
            return;

        stream
            .getTracks()
            .forEach(
                track => {
                    track.stop();
                }
            );

        stream = null;
    }

    function wait(ms) {

        return new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    ms
                )
        );
    }

    startCamera();

});