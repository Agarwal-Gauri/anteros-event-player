const configuredLoops = window.ANTEROS_CONFIG.loopVideos || [];
const LOOP_VIDEOS = configuredLoops.length
  ? configuredLoops
  : [{ label: "Koyal Experiences", url: window.ANTEROS_CONFIG.loopVideo }].filter(
      (video) => video.url,
    );
const form = document.querySelector("#lookup-form");
const input = document.querySelector("#email");
const message = document.querySelector("#message");
const personalFilmLink = document.querySelector("#personal-film-link");
const player = document.querySelector("#player");

let experiences = {};
let idleVideoIndex = 0;

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

function hidePersonalFilm() {
  personalFilmLink.hidden = true;
  personalFilmLink.removeAttribute("href");
}

function playSharedFilm() {
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
}

function showPersonalFilm(experience) {
  personalFilmLink.href = experience.url;
  personalFilmLink.hidden = false;
  setMessage(
    "Found it. Open your film below while the event experiences keep playing.",
    "success",
  );
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hidePersonalFilm();
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
    showPersonalFilm(experience);
  } catch {
    setMessage("Something went wrong. Please ask a host for help.", "error");
  }
});

player.addEventListener("ended", () => {
  idleVideoIndex = (idleVideoIndex + 1) % LOOP_VIDEOS.length;
  playSharedFilm();
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

hidePersonalFilm();
playSharedFilm();
