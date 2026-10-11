/* =========================================================
   1. PARTICLES BACKGROUND (จำลองสนามพลังงานไฟฟ้า Ambient)
========================================================= */
const canvas = document.getElementById('ambient-canvas');
const ctx = canvas.getContext('2d');

let particles = [];
const particleCount = 45;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class ElectricParticle {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.8;
        this.speedX = (Math.random() - 0.5) * 0.8;
        this.speedY = -Math.random() * 1.2 - 0.3;
        this.opacity = Math.random() * 0.6 + 0.15;
        this.isRed = Math.random() > 0.4;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.y < 0) {
            this.y = canvas.height;
            this.x = Math.random() * canvas.width;
        }
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.isRed 
            ? `rgba(232, 33, 39, ${this.opacity})` 
            : `rgba(0, 210, 255, ${this.opacity})`;
        ctx.fill();
    }
}

for (let i = 0; i < particleCount; i++) {
    particles.push(new ElectricParticle());
}

function renderParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(renderParticles);
}
renderParticles();

/* =========================================================
   2. COLOR PALETTE SWITCHER (ระบบสลับสีตัวรถ)
========================================================= */
const colorDots = document.querySelectorAll('.color-dot');
const carImage = document.getElementById('carImage');
const colorLabel = document.getElementById('colorLabel');

colorDots.forEach(dot => {
    dot.addEventListener('click', () => {
        colorDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');

        const newImg = dot.getAttribute('data-img');
        const colorName = dot.getAttribute('data-color');

        carImage.style.opacity = '0.3';
        setTimeout(() => {
            carImage.src = newImg;
            carImage.style.opacity = '1';
            colorLabel.innerText = `${colorName} Multi-Coat`;
        }, 200);
    });
});

/* =========================================================
   3. WEB AUDIO SYNTHESIZER & LAUNCH SIMULATOR
========================================================= */
let audioCtx = null;
let motorOsc = null;
let motorGain = null;
let launchInterval = null;
let isHolding = false;
let spoolProgress = 0;

function initAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function startElectricSound() {
    initAudio();
    motorOsc = audioCtx.createOscillator();
    motorGain = audioCtx.createGain();

    motorOsc.type = 'sawtooth';
    motorOsc.frequency.setValueAtTime(110, audioCtx.currentTime);

    motorGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    motorGain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.3);

    motorOsc.connect(motorGain);
    motorGain.connect(audioCtx.destination);
    motorOsc.start();
}

function rampFrequency(freq) {
    if (motorOsc && audioCtx) {
        motorOsc.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.05);
    }
}

function stopElectricSound() {
    if (motorGain && audioCtx) {
        motorGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        setTimeout(() => {
            if (motorOsc) {
                motorOsc.stop();
                motorOsc.disconnect();
            }
        }, 400);
    }
}

const launchBtn = document.getElementById('launchBtn');
const progressBar = document.getElementById('launchProgress');
const timerDisplay = document.getElementById('timerDisplay');
const speedDisplay = document.getElementById('speedDisplay');
const gforceDisplay = document.getElementById('gforceDisplay');

function startSpool(e) {
    if (e) e.preventDefault();
    if (isHolding) return;
    isHolding = true;
    launchBtn.classList.add('active');

    startElectricSound();

    launchInterval = setInterval(() => {
        if (spoolProgress < 100) {
            spoolProgress += 2.5;
            progressBar.style.width = `${spoolProgress}%`;
            rampFrequency(110 + spoolProgress * 6);
        }
    }, 25);
}

function triggerLaunch(e) {
    if (e) e.preventDefault();
    if (!isHolding) return;
    isHolding = false;
    launchBtn.classList.remove('active');
    clearInterval(launchInterval);

    if (spoolProgress >= 70) {
        rampFrequency(1200);
        simulateSprint();
    } else {
        stopElectricSound();
        resetTelemetry();
    }
    spoolProgress = 0;
    progressBar.style.width = '0%';
}

function simulateSprint() {
    let speed = 0;
    let time = 0;
    const sprintTimer = setInterval(() => {
        time += 0.05;
        speed += 3.8;
        
        const gForce = (1.2 + Math.random() * 0.18).toFixed(2);
        timerDisplay.innerHTML = `${time.toFixed(2)} <span class="unit">s</span>`;
        speedDisplay.innerHTML = `${Math.min(100, Math.floor(speed))} <span class="unit">km/h</span>`;
        gforceDisplay.innerHTML = `${gForce} <span class="unit">G</span>`;

        if (speed >= 100) {
            clearInterval(sprintTimer);
            timerDisplay.innerHTML = `3.10 <span class="unit">s</span>`;
            speedDisplay.innerHTML = `100 <span class="unit">km/h</span>`;
            gforceDisplay.innerHTML = `1.35 <span class="unit">G (PEAK)</span>`;
            stopElectricSound();
        }
    }, 50);
}

function resetTelemetry() {
    timerDisplay.innerHTML = `0.00 <span class="unit">s</span>`;
    speedDisplay.innerHTML = `0 <span class="unit">km/h</span>`;
    gforceDisplay.innerHTML = `0.00 <span class="unit">G</span>`;
}

launchBtn.addEventListener('mousedown', startSpool);
window.addEventListener('mouseup', triggerLaunch);
launchBtn.addEventListener('touchstart', startSpool, { passive: false });
window.addEventListener('touchend', triggerLaunch);