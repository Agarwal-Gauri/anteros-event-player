const configuredLoops = window.ANTEROS_CONFIG.loopVideos || [];
const LOOP_VIDEOS = configuredLoops.length
  ? configuredLoops
  : [{ label: "Koyal Experiences", url: window.ANTEROS_CONFIG.loopVideo }].filter(
      (video) => video.url,
    );
const IDLE_TIMEOUT_MS = 3 * 60 * 1000;

const form = document.querySelector("#lookup-form");
const input = document.querySelector("#email");
const message = document.querySelector("#message");
const player = document.querySelector("#player");
const experienceLabel = document.querySelector("#experience-label");
const resetButton = document.querySelector("#reset");

let experiences = {};
let idleTimer;
let idleVideoIndex = 0;
let isShowingExperience = false;

function setMessage(text = "", state = "") {
  message.textContent = text;
  if (state) {
    message.dataset.state = state;
  } else {
    delete message.dataset.state;
  }
}

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

async function hashEmail(email) {
  const bytes = new TextEncoder().encode(email);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function armIdleTimer() {
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(showIdleLoop, IDLE_TIMEOUT_MS);
}

function showIdleLoop() {
  window.clearTimeout(idleTimer);
  isShowingExperience = false;
  player.pause();
  player.controls = true;
  player.muted = true;
  player.loop = LOOP_VIDEOS.length === 1;
  if (!LOOP_VIDEOS.length) {
    setMessage("The base experience reel is not configured.", "error");
    return;
  }
  player.src = LOOP_VIDEOS[idleVideoIndex].url;
  player.load();
  player.play().catch(() => {});
  experienceLabel.textContent = "Event reel · Enter email to play yours";
  experienceLabel.hidden = false;
  resetButton.hidden = true;
  form.reset();
  setMessage();
}

function showExperience(experience) {
  isShowingExperience = true;
  player.pause();
  player.controls = true;
  player.muted = false;
  player.loop = false;
  player.src = experience.url;
  player.load();
  player.play().catch(() => {
    setMessage("Press play on the video to begin.", "success");
  });
  experienceLabel.textContent = `${experience.experience} · Your film`;
  experienceLabel.hidden = false;
  resetButton.hidden = false;
  setMessage("Found it. Enjoy your film.", "success");
  armIdleTimer();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = normalizeEmail(input.value);
  if (!email || !input.validity.valid) {
    setMessage("Enter the email you used to register.", "error");
    input.focus();
    return;
  }

  setMessage("Finding your film…");
  try {
    const key = await hashEmail(email);
    const experience = experiences[key];
    if (!experience) {
      setMessage(
        "We couldn’t find a film for that email. Check the spelling or ask a host.",
        "error",
      );
      input.select();
      return;
    }
    showExperience(experience);
  } catch {
    setMessage("Something went wrong. Please ask a host for help.", "error");
  }
});

resetButton.addEventListener("click", showIdleLoop);
player.addEventListener("ended", () => {
  if (isShowingExperience) {
    window.setTimeout(showIdleLoop, 1500);
    return;
  }
  idleVideoIndex = (idleVideoIndex + 1) % LOOP_VIDEOS.length;
  showIdleLoop();
});
["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
  document.addEventListener(eventName, () => {
    if (isShowingExperience) armIdleTimer();
  });
});

fetch("./data/experiences.json", { cache: "no-store" })
  .then((response) => {
    if (!response.ok) throw new Error("manifest unavailable");
    return response.json();
  })
  .then((data) => {
    experiences = data;
  })
  .catch(() => {
    setMessage("The experience list could not load. Please refresh.", "error");
  });

showIdleLoop();
