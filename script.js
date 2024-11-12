let filterA = document.getElementById("blur");
let filterB = document.getElementById("contrast");
let filterC = document.getElementById("hue-rotate");
let filterD = document.getElementById("sepia");
let filterE = document.getElementById("invert");
let filterF = document.getElementById("saturate"); 

let noFlipBtn = document.getElementById("no-flip");
let flipXBtn = document.getElementById("flip-x");
let flipYBtn = document.getElementById("flip-y");

let uploadButton = document.getElementById("upload-button");
let image = document.getElementById("chosen-image");
let downloadButton = document.getElementById("download-btn");

let undoButton = document.getElementById("undo-btn");
let redoButton = document.getElementById("redo-btn");
let grayscaleButton = document.getElementById("grayscale-btn");
let cropRatioSelect = document.getElementById("crop-ratio");

let undoStack = [];
let redoStack = [];

function resetFilter() {
    filterA.value = "0";
    filterB.value = "100";
    filterC.value = "0";
    filterD.value = "0";
    filterE.value = "0";
    filterF.value = "100";

    noFlipBtn.checked = true;

    isGrayscale = false;
    addGrayscaleFilter();
    addFilter();
    flipImage();
}

uploadButton.onchange = () => {
    document.querySelector('.upload-group').style.display = 'none';
    document.querySelector('.editor').style.display = '';
    document.querySelector('.reset-btn').style.display = '';
    downloadButton.style.display = '';
    undoButton.style.display = '';
    redoButton.style.display = '';
    grayscaleButton.style.display = '';
    cropRatioSelect.style.display = '';

    resetFilter();
    document.querySelector(".image-container").style.display = "block";

    // Reset the undo and redo stacks
    undoStack = [];
    redoStack = [];
    undoButton.disabled = true;
    redoButton.disabled = true;

    let reader = new FileReader();
    reader.readAsDataURL(uploadButton.files[0]);
    reader.onload = () => {
        image.setAttribute("src", reader.result);
        // Save the initial uploaded state
        saveState();
    }
};


cropRatioSelect.addEventListener("change", function() {
    let selectedRatio = cropRatioSelect.value;
    let aspectRatio;

    // Determine the aspect ratio based on the selected option
    if (selectedRatio === "1:1") {
        aspectRatio = 1;
    } else if (selectedRatio === "16:9") {
        aspectRatio = 16 / 9;
    } else if (selectedRatio === "4:3") {
        aspectRatio = 4 / 3;
    } else if (selectedRatio === "3:2") {
        aspectRatio = 3 / 2;
    } else if (selectedRatio === "21:9") {
        aspectRatio = 21 / 9;
    }

    // Perform the crop operation
    updateCropAreaWithRatio(aspectRatio);
});


// Function to update the crop area with the selected aspect ratio
function updateCropAreaWithRatio(ratio) {
    if (!image.src) return;

    // Create a temporary canvas for cropping
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");

    // Get the natural dimensions of the image
    let imgWidth = image.naturalWidth;
    let imgHeight = image.naturalHeight;

    // Calculate the new crop width and height based on the selected ratio
    let cropWidth, cropHeight;
    if (imgWidth / imgHeight > ratio) {
        cropHeight = imgHeight;
        cropWidth = cropHeight * ratio;
    } else {
        cropWidth = imgWidth;
        cropHeight = cropWidth / ratio;
    }

    // Set canvas dimensions to the crop size
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // Draw the cropped image onto the canvas
    ctx.drawImage(
        image,
        (imgWidth - cropWidth) / 2, // Center crop horizontally
        (imgHeight - cropHeight) / 2, // Center crop vertically
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
    );

    // Update the displayed image with the cropped result
    image.src = canvas.toDataURL("image/png");

    // Save the current state for undo/redo functionality
    saveState();
}


grayscaleButton.addEventListener("click", () => {
    isGrayscale = !isGrayscale;  // Toggle grayscale state
    addGrayscaleFilter();  // Apply the grayscale filter based on state
    saveState();  // Save the current state for undo/redo functionality
});

// Function to apply grayscale filter
function addGrayscaleFilter() {
    if (isGrayscale) {
        image.style.filter += " grayscale(100%)";  // Apply grayscale effect
    } else {
        image.style.filter = image.style.filter.replace("grayscale(100%)", "");  // Remove grayscale effect
    }
}

function saveState() {
    const state = {
        filterA: filterA.value,
        filterB: filterB.value,
        filterC: filterC.value,
        filterD: filterD.value,
        filterE: filterE.value,
        filterF: filterF.value,
        flipX: flipXBtn.checked,
        flipY: flipYBtn.checked,
        imageSrc: image.src // Capture the current image source
    };
    undoStack.push(state);
    redoStack = []; // Clear redo stack after new action
    updateButtonStates();
}



function updateButtonStates() {
    undoButton.disabled = undoStack.length === 0;
    redoButton.disabled = redoStack.length === 0;
}

function getCurrentState() {
    return {
        filterA: filterA.value,
        filterB: filterB.value,
        filterC: filterC.value,
        filterD: filterD.value,
        flipX: flipXBtn.checked,
        flipY: flipYBtn.checked
    };
}

function applyState(state) {
    filterA.value = state.filterA;
    filterB.value = state.filterB;
    filterC.value = state.filterC;
    filterD.value = state.filterD;
    filterE.value = state.filterE;
    filterF.value = state.filterF;
    flipXBtn.checked = state.flipX;
    flipYBtn.checked = state.flipY;

    // Restore the image source
    image.src = state.imageSrc;

    addFilter(); // Apply filter values
    flipImage(); // Apply flip transformations
}


// Undo functionality
undoButton.addEventListener("click", () => {
    if (undoStack.length > 0) {
        const state = undoStack.pop();
        redoStack.push(getCurrentState()); // Save current state to redo stack
        applyState(state); // Apply the undo state
    }
    updateButtonStates(); // Update button states after action
});

// Redo functionality
redoButton.addEventListener("click", () => {
    if (redoStack.length > 0) {
        const state = redoStack.pop();
        undoStack.push(getCurrentState()); // Save current state to undo stack
        applyState(state); // Apply the redo state
    }
    updateButtonStates(); // Update button states after action
});

let sliders = document.querySelectorAll(".filter input[type='range']");
sliders.forEach(slider => {
    slider.addEventListener("input", () => {
        addFilter();
        saveState(); // Save state after changes
    });
});

function addFilter() {
    image.style.filter = `blur(${filterA.value}px) 
    contrast(${filterB.value}%) 
    hue-rotate(${filterC.value}deg) 
    sepia(${filterD.value}%) 
    invert(${filterE.value}%) 
    saturate(${filterF.value}%)`;
}

let radioBtns = document.querySelectorAll(".flip-option input[type='radio']");
radioBtns.forEach(radioBtn => {
    radioBtn.addEventListener("click", () => {
        flipImage();
        saveState(); // Save state after changes
    });
});

function flipImage() {
    if (flipXBtn.checked) {
        image.style.transform = "scaleX(-1)";
    } else if (flipYBtn.checked) {
        image.style.transform = "scaleY(-1)";
    } else {
        image.style.transform = "scale(1,1)";
    }
}

// Download functionality
downloadButton.addEventListener("click", () => {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    ctx.filter = `blur(${filterA.value}px) contrast(${filterB.value}%) hue-rotate(${filterC.value}deg) sepia(${filterD.value}%)`;

    if (flipXBtn.checked) {
        ctx.scale(-1, 1);
        ctx.drawImage(image, -canvas.width, 0, canvas.width, canvas.height);
    } else if (flipYBtn.checked) {
        ctx.scale(1, -1);
        ctx.drawImage(image, 0, -canvas.height, canvas.width, canvas.height);
    } else {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    }

    let imageUrl = canvas.toDataURL("image/png");

    let link = document.createElement("a");
    link.href = imageUrl;
    link.download = "edited-image.png";
    link.click();
});
