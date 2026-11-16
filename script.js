
const checkpoints = {
    QR01: { name: "Main Entrance", position: 1 },
    QR02: { name: "Reception", position: 2 },
    QR03: { name: "Waiting Hall", position: 3 },
    QR04: { name: "Pharmacy", position: 4 },
    QR05: { name: "Laboratory", position: 5 }
};

let currentQR = null;
let destinationQR = null;
let scanner = null;
let navigationActive = false;
let lastInstruction = "";

const locationText = document.getElementById("currentLocation");
const floorText = document.getElementById("currentFloor");
const instructionText = document.getElementById("instruction");
const nextStopText = document.getElementById("nextStop");
const routeStatus = document.getElementById("routeStatus");
const progressBar = document.getElementById("progressBar");
const directionIcon = document.getElementById("directionIcon");

function speak(message) {
    if (!("speechSynthesis" in window)) {
        alert("Voice guidance is not supported in this browser.");
        return;
    }

    window.speechSynthesis.cancel();

    const voice = new SpeechSynthesisUtterance(message);
    voice.lang = "en-IN";
    voice.rate = 0.9;
    voice.pitch = 1;

    window.speechSynthesis.speak(voice);
}

function getCheckpointId(text) {
    const match = text.match(/QR0[1-5]/i);
    return match ? match[0].toUpperCase() : null;
}

function updateLocation(qr) {
    if (!checkpoints[qr]) return;

    currentQR = qr;

    locationText.textContent = checkpoints[qr].name;
    floorText.textContent = "Ground Floor";

    if (navigationActive) {
        giveNextInstruction();
    } else {
        speak("QR scanned successfully. You are currently at " + checkpoints[qr].name);
    }
}

async function startScanner() {
    if (scanner) return;

    scanner = new Html5Qrcode("reader");

    try {
        await scanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: 230 },
            (decodedText) => {
                const qr = getCheckpointId(decodedText);

                if (!qr) {
                    routeStatus.textContent = "Invalid Brave Step QR code";
                    return;
                }

                updateLocation(qr);

                scanner.stop().then(() => {
                    scanner = null;
                }).catch(() => {
                    scanner = null;
                });
            }
        );

        routeStatus.textContent = "Scanner active";
    } catch (error) {
        scanner = null;
        routeStatus.textContent = "Camera could not start. Check permission.";
        console.error(error);
    }
}

async function stopScanner() {
    if (scanner) {
        try {
            await scanner.stop();
            scanner = null;
            routeStatus.textContent = "Scanner stopped";
        } catch (error) {
            console.error(error);
        }
    }
}

function startNavigation() {
    if (!currentQR) {
        speak("Please scan your current location QR code first.");
        routeStatus.textContent = "Scan your current location first";
        return;
    }

    destinationQR = document.getElementById("destination").value;

    if (!destinationQR) {
        speak("Please select your destination.");
        return;
    }

    if (currentQR === destinationQR) {
        speak("You are already at your destination.");
        instructionText.textContent = "Destination reached";
        nextStopText.textContent = checkpoints[currentQR].name;
        return;
    }

    navigationActive = true;

    speak(
        "Navigation started. From " +
        checkpoints[currentQR].name +
        " to " +
        checkpoints[destinationQR].name
    );

    giveNextInstruction();
}


function giveNextInstruction() {
    if (!navigationActive || !currentQR || !destinationQR) return;

    const currentPosition = checkpoints[currentQR].position;
    const destinationPosition = checkpoints[destinationQR].position;

    if (currentPosition === destinationPosition) {
        navigationActive = false;

        instructionText.textContent = "Destination reached!";
        nextStopText.textContent = checkpoints[destinationQR].name;
        routeStatus.textContent = "Navigation completed";
        directionIcon.textContent = "✓";
        progressBar.style.width = "100%";

        speak("You have reached your destination. Navigation completed.");
        return;
    }

    const direction = destinationPosition > currentPosition ? 1 : -1;

    const destinationName = checkpoints[destinationQR].name;

    const message = "Go straight to " + destinationName;

    instructionText.textContent = "Go Straight";
    nextStopText.textContent = "Destination: " + destinationName;
    directionIcon.textContent = "↑";

    progressBar.style.width = "0%";

    routeStatus.textContent =
        "From " + checkpoints[currentQR].name +
        " → To " + destinationName;

    lastInstruction = message;

    speak(message);
}


function repeatInstruction() {
    if (lastInstruction) {
        speak(lastInstruction);
    } else {
        speak("Please start navigation first.");
    }
}

function stopNavigation() {
    navigationActive = false;
    window.speechSynthesis.cancel();

    instructionText.textContent = "Navigation stopped";
    nextStopText.textContent = "Select a destination to begin again.";
    routeStatus.textContent = "Route not started";
    directionIcon.textContent = "➜";
    progressBar.style.width = "0%";

    speak("Navigation stopped.");
}

document.getElementById("startScanner")
    .addEventListener("click", startScanner);

document.getElementById("stopScanner")
    .addEventListener("click", stopScanner);

document.getElementById("startNavigation")
    .addEventListener("click", startNavigation);

document.getElementById("repeatVoice")
    .addEventListener("click", repeatInstruction);

document.getElementById("stopNavigation")
    .addEventListener("click", stopNavigation);
