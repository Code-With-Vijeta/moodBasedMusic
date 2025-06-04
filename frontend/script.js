const moodContainer = document.getElementById("navbar-moods");
const suggestionsContainer = document.getElementById("suggestions");
const videoPlayer = document.getElementById("video-player");

const shuffleBtn = document.getElementById("shuffle-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");

const modeToggleBtn = document.getElementById("mode-toggle");

let currentSongs = [];
let currentIndex = 0;
let currentMood = "happy";

function setMode(dark) {
  if (dark) {
    document.body.classList.add("dark");
    modeToggleBtn.textContent = "🌚";
  } else {
    document.body.classList.remove("dark");
    modeToggleBtn.textContent = "🌞";
  }
  localStorage.setItem("darkMode", dark);
}

const savedMode = localStorage.getItem("darkMode");
if (savedMode !== null) {
  setMode(savedMode === "true");
} else {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setMode(prefersDark);
}

modeToggleBtn.addEventListener("click", () => {
  const isDark = document.body.classList.contains("dark");
  setMode(!isDark);
});

async function loadMoods() {
  try {
    const res = await fetch("http://localhost:9000/moods");
    const moods = await res.json();

    moodContainer.innerHTML = "";
    moods.forEach((mood) => {
      const btn = document.createElement("button");
      btn.textContent = mood.charAt(0).toUpperCase() + mood.slice(1);
      btn.classList.add("mood-btn");
      btn.onclick = () => {
        currentMood = mood;
        loadSuggestions(mood);
      };
      moodContainer.appendChild(btn);
    });
  } catch (err) {
    console.error("Failed to load moods:", err);
  }
}

async function loadSuggestions(mood) {
  suggestionsContainer.innerHTML = "Loading...";
  try {
    const res = await fetch(`http://localhost:9000/suggestions?mood=${mood}`);
    const songs = await res.json();

    if (!songs.length) {
      suggestionsContainer.innerHTML = "No suggestions found for this mood.";
      currentSongs = [];
      videoPlayer.src = "";
      return;
    }

    currentSongs = songs;
    currentIndex = 0;

    displaySuggestions(currentSongs);
    playSong(currentIndex);
  } catch (err) {
    console.error("Failed to load suggestions:", err);
    suggestionsContainer.innerHTML = "Failed to load suggestions.";
  }
}

function displaySuggestions(songs) {
  suggestionsContainer.innerHTML = "";
  songs.forEach((song, i) => {
    const div = document.createElement("div");
    div.classList.add("suggestion-item");
    div.textContent = `${song.title} - ${song.artist}`;
    div.onclick = () => {
      currentIndex = i;
      playSong(currentIndex);
    };
    suggestionsContainer.appendChild(div);
  });
}
function playSong(index) {
  const song = currentSongs[index];
  if (!song) return;

  const url = song.videoUrl;
  const match = url.match(/\/track\/([a-zA-Z0-9]+)/);
  const trackId = match ? match[1] : null;

  if (trackId) {
    videoPlayer.src = `https://open.spotify.com/embed/track/${trackId}`;
  } else {
    videoPlayer.src = ""; 
  }
}

shuffleBtn.onclick = () => {
  if (currentSongs.length === 0) return;
  for (let i = currentSongs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [currentSongs[i], currentSongs[j]] = [currentSongs[j], currentSongs[i]];
  }
  currentIndex = 0;
  displaySuggestions(currentSongs);
  playSong(currentIndex);
};

prevBtn.onclick = () => {
  if (currentSongs.length === 0) return;
  currentIndex = (currentIndex - 1 + currentSongs.length) % currentSongs.length;
  playSong(currentIndex);
};

nextBtn.onclick = () => {
  if (currentSongs.length === 0) return;
  currentIndex = (currentIndex + 1) % currentSongs.length;
  playSong(currentIndex);
};

window.onload = () => {
  loadMoods();
  loadSuggestions(currentMood);
};

function updateSuggestions(songs) {
  const suggestionsEl = document.getElementById("suggestions");
  suggestionsEl.innerHTML = "";

  if (songs.length === 0) {
    suggestionsEl.innerHTML = `
      <div class="no-suggestions-message" style="padding: 20px; text-align: center; color: var(--text-color); font-style: italic;">
        No suggestions found for this mood.
      </div>
    `;
    return;
  }

  songs.forEach((song) => {
    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.textContent = song.title;
    suggestionsEl.appendChild(item);
  });
}
