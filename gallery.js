/* =========================================================
   FLASHROOM — GALLERY / EDITOR
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const gallery =
        document.getElementById("gallery");

    const preview =
        document.getElementById("preview");

    const filterSelect =
        document.getElementById("filterSelect");

    const brightness =
        document.getElementById("brightness");

    const contrast =
        document.getElementById("contrast");

    const saturation =
        document.getElementById("saturation");

    const rotateBtn =
        document.getElementById("rotateBtn");

    const resetBtn =
        document.getElementById("resetBtn");

    const downloadBtn =
        document.getElementById("downloadBtn");

    const backBtn =
        document.getElementById("backBtn");

    /* =====================================================
       STATE
    ===================================================== */

    let selectedPhoto = null;

    let rotation = 0;

    let settings = {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        filter: "none"
    };

    let photos = [];

    /* =====================================================
       LOAD PHOTOS
    ===================================================== */

    try {

        const saved =
            localStorage.getItem(
                "flashroomPhotos"
            );

        if (saved) {
            photos =
                JSON.parse(saved);
        }

    } catch (error) {

        console.error(
            "Could not load photos:",
            error
        );

        photos = [];
    }

    /* =====================================================
       FALLBACK — LOAD FROM OTHER PHOTO STORAGE
    ===================================================== */

    if (!photos.length) {

        const singlePhoto =
            localStorage.getItem(
                "flashroomPhoto"
            );

        if (singlePhoto) {

            photos = [
                singlePhoto
            ];
        }
    }

    /* =====================================================
       DISPLAY GALLERY
    ===================================================== */

    function renderGallery() {

        if (!gallery) return;

        gallery.innerHTML = "";

        if (!photos.length) {

            const empty =
                document.createElement(
                    "div"
                );

            empty.className =
                "gallery-empty";

            empty.innerHTML = `
                <div style="font-size:40px;">📸</div>
                <h3>No photos yet</h3>
                <p>Take some photos in the booth and they'll appear here.</p>
            `;

            gallery.appendChild(
                empty
            );

            return;
        }

        photos.forEach(
            (photo, index) => {

                const item =
                    document.createElement(
                        "button"
                    );

                item.type =
                    "button";

                item.className =
                    "gallery-item";

                const img =
                    document.createElement(
                        "img"
                    );

                img.src =
                    photo;

                img.alt =
                    `FlashRoom photo ${index + 1}`;

                item.appendChild(
                    img
                );

                item.addEventListener(
                    "click",
                    () => {

                        selectPhoto(
                            photo,
                            index
                        );
                    }
                );

                gallery.appendChild(
                    item
                );
            }
        );
    }

    /* =====================================================
       SELECT PHOTO
    ===================================================== */

    function selectPhoto(
        photo,
        index
    ) {

        selectedPhoto = photo;

        rotation = 0;

        settings = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            filter: "none"
        };

        if (brightness) {
            brightness.value = 100;
        }

        if (contrast) {
            contrast.value = 100;
        }

        if (saturation) {
            saturation.value = 100;
        }

        if (filterSelect) {
            filterSelect.value =
                "none";
        }

        updatePreview();

        console.log(
            "Selected photo:",
            index + 1
        );
    }

    /* =====================================================
       PREVIEW
    ===================================================== */

    function updatePreview() {

        if (!preview ||
            !selectedPhoto) {
            return;
        }

        preview.src =
            selectedPhoto;

        preview.style.transform =
            `rotate(${rotation}deg)`;

        preview.style.filter =
            buildFilter();
    }

    /* =====================================================
       FILTER BUILDER
    ===================================================== */

    function buildFilter() {

        let filter =
            `brightness(${settings.brightness}%) ` +
            `contrast(${settings.contrast}%) ` +
            `saturate(${settings.saturation}%)`;

        switch (
            settings.filter
        ) {

            case "grayscale":

                filter +=
                    " grayscale(100%)";

                break;

            case "vintage":

                filter +=
                    " sepia(45%) contrast(105%)";

                break;

            case "cool":

                filter +=
                    " hue-rotate(20deg)";

                break;

            case "warm":

                filter +=
                    " sepia(20%) saturate(125%)";

                break;

            case "dream":

                filter +=
                    " brightness(110%) saturate(115%) blur(0.2px)";

                break;

            case "mono":

                filter +=
                    " grayscale(100%) contrast(120%)";

                break;

            case "none":
            default:

                break;
        }

        return filter;
    }

    /* =====================================================
       FILTER CHANGE
    ===================================================== */

    if (filterSelect) {

        filterSelect.addEventListener(
            "change",
            () => {

                settings.filter =
                    filterSelect.value;

                updatePreview();
            }
        );
    }

    /* =====================================================
       BRIGHTNESS
    ===================================================== */

    if (brightness) {

        brightness.addEventListener(
            "input",
            () => {

                settings.brightness =
                    Number(
                        brightness.value
                    );

                updatePreview();
            }
        );
    }

    /* =====================================================
       CONTRAST
    ===================================================== */

    if (contrast) {

        contrast.addEventListener(
            "input",
            () => {

                settings.contrast =
                    Number(
                        contrast.value
                    );

                updatePreview();
            }
        );
    }

    /* =====================================================
       SATURATION
    ===================================================== */

    if (saturation) {

        saturation.addEventListener(
            "input",
            () => {

                settings.saturation =
                    Number(
                        saturation.value
                    );

                updatePreview();
            }
        );
    }

    /* =====================================================
       ROTATE
    ===================================================== */

    if (rotateBtn) {

        rotateBtn.addEventListener(
            "click",
            () => {

                rotation += 90;

                if (
                    rotation >= 360
                ) {
                    rotation = 0;
                }

                updatePreview();
            }
        );
    }

    /* =====================================================
       RESET
    ===================================================== */

    if (resetBtn) {

        resetBtn.addEventListener(
            "click",
            () => {

                rotation = 0;

                settings = {
                    brightness: 100,
                    contrast: 100,
                    saturation: 100,
                    filter: "none"
                };

                if (brightness) {
                    brightness.value = 100;
                }

                if (contrast) {
                    contrast.value = 100;
                }

                if (saturation) {
                    saturation.value = 100;
                }

                if (filterSelect) {
                    filterSelect.value =
                        "none";
                }

                updatePreview();
            }
        );
    }

    /* =====================================================
       DOWNLOAD EDITED PHOTO
    ===================================================== */

    if (downloadBtn) {

        downloadBtn.addEventListener(
            "click",
            () => {

                if (!selectedPhoto) {

                    alert(
                        "Select a photo first."
                    );

                    return;
                }

                downloadEditedPhoto();
            }
        );
    }

    /* =====================================================
       CREATE EDITED IMAGE
    ===================================================== */

    function downloadEditedPhoto() {

        const image =
            new Image();

        image.onload = () => {

            const canvas =
                document.createElement(
                    "canvas"
                );

            const rotated =
                rotation % 180 !== 0;

            canvas.width =
                rotated
                    ? image.height
                    : image.width;

            canvas.height =
                rotated
                    ? image.width
                    : image.height;

            const ctx =
                canvas.getContext(
                    "2d"
                );

            ctx.filter =
                buildFilter();

            ctx.translate(
                canvas.width / 2,
                canvas.height / 2
            );

            ctx.rotate(
                rotation *
                Math.PI /
                180
            );

            ctx.drawImage(
                image,
                -image.width / 2,
                -image.height / 2
            );

            const link =
                document.createElement(
                    "a"
                );

            link.download =
                `flashroom-${Date.now()}.jpg`;

            link.href =
                canvas.toDataURL(
                    "image/jpeg",
                    0.95
                );

            link.click();
        };

        image.src =
            selectedPhoto;
    }

    /* =====================================================
       BACK
    ===================================================== */

    if (backBtn) {

        backBtn.addEventListener(
            "click",
            () => {

                window.location.href =
                    "waiting.html";
            }
        );
    }

    /* =====================================================
       GLOBAL PHOTO SAVER
    ===================================================== */

    window.saveFlashroomPhoto =
        function(photo) {

            if (!photo) return;

            photos.push(photo);

            localStorage.setItem(
                "flashroomPhotos",
                JSON.stringify(
                    photos
                )
            );

            renderGallery();
        };

    /* =====================================================
       INITIALIZE
    ===================================================== */

    renderGallery();

});