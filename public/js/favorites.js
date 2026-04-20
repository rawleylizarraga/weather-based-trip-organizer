document.addEventListener("DOMContentLoaded", () => {
  const favoriteButtons = document.querySelectorAll(".favorite-day-btn");
  console.log("favorites.js loaded");
  console.log("buttons found:", favoriteButtons.length);

  const detailsTitle = document.getElementById("detailsTitle");
  const weatherOutput = document.getElementById("weatherOutput");
  const notesOutput = document.getElementById("notesOutput");

  const noteModal = document.getElementById("noteModal");
  const modalNoteTitle = document.getElementById("modalNoteTitle");
  const modalIconInput = document.getElementById("modalIconInput");
  const noteTextArea = document.getElementById("noteTextArea");
  const editNoteBtn = document.getElementById("editNoteBtn");
  const saveNoteBtn = document.getElementById("saveNoteBtn");
  const cancelNoteBtn = document.getElementById("cancelNoteBtn");

  let selectedNote = null;
  let editingEnabled = false;

  function getWeatherDescription(code) {
    const weatherCodes = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Rime fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      71: "Slight snow",
      73: "Moderate snow",
      75: "Heavy snow",
      80: "Rain showers",
      81: "Moderate rain showers",
      82: "Violent rain showers",
      95: "Thunderstorm"
    };
    return weatherCodes[code] || "Unknown";
  }

  function openModal(note) {
    if (!noteModal || !modalNoteTitle || !modalIconInput || !noteTextArea) return;

    selectedNote = note;
    editingEnabled = false;

    modalNoteTitle.value = note.note_title || "";
    modalIconInput.value = note.icon_path || "";
    noteTextArea.value = note.note_text || "";

    modalNoteTitle.readOnly = true;
    modalIconInput.readOnly = true;
    noteTextArea.readOnly = true;

    noteModal.classList.remove("hidden");
  }

  function closeModal() {
    if (!noteModal || !modalNoteTitle || !modalIconInput || !noteTextArea) return;

    noteModal.classList.add("hidden");
    selectedNote = null;
    editingEnabled = false;

    modalNoteTitle.readOnly = true;
    modalIconInput.readOnly = true;
    noteTextArea.readOnly = true;
  }

  function renderNotes(notes) {
    if (!notes || notes.length === 0) {
      notesOutput.innerHTML = `<p>No notes attached to this favorite day.</p>`;
      return;
    }

    notesOutput.innerHTML = notes.map((note, index) => `
      <div class="note-card">
        <h4>${note.note_title || "Untitled Note"}</h4>
        <p>${note.note_text || ""}</p>
        <p><strong>Icon:</strong> ${note.icon_path || "None"}</p>
        <button class="open-note-btn" data-note-index="${index}">Open Note</button>
      </div>
    `).join("");

    const openButtons = document.querySelectorAll(".open-note-btn");
    openButtons.forEach(button => {
      button.addEventListener("click", () => {
        const noteIndex = Number(button.dataset.noteIndex);
        openModal(notes[noteIndex]);
      });
    });
  }

  function displayFavorite(button) {
    const city = button.dataset.city;
    const state = button.dataset.state;
    const country = button.dataset.country;
    const date = button.dataset.date;

    let weatherData = {};
    let notes = [];

    try {
      weatherData = JSON.parse(button.dataset.weather || "{}");
    } catch (err) {
      weatherData = {};
    }

    try {
      notes = JSON.parse(button.dataset.notes || "[]");
    } catch (err) {
      notes = [];
    }

    const formattedDate = new Date(date).toLocaleDateString();

    detailsTitle.textContent = `${city}, ${state}, ${country} - ${formattedDate}`;

    const current = weatherData.current || {};

    weatherOutput.innerHTML = `
      <p><strong>Temperature:</strong> ${current.temperature_2m ?? "N/A"}°</p>
      <p><strong>Wind Speed:</strong> ${current.wind_speed_10m ?? "N/A"}</p>
      <p><strong>Weather:</strong> ${getWeatherDescription(current.weather_code)}</p>
    `;

    renderNotes(notes);
    localStorage.setItem("lastSelectedDayId", button.dataset.dayId);
  }

  favoriteButtons.forEach(button => {
    button.addEventListener("click", () => {
      displayFavorite(button);
    });
  });

  if (editNoteBtn) {
    editNoteBtn.addEventListener("click", () => {
      editingEnabled = !editingEnabled;

      if (modalNoteTitle) modalNoteTitle.readOnly = !editingEnabled;
      if (modalIconInput) modalIconInput.readOnly = !editingEnabled;
      if (noteTextArea) noteTextArea.readOnly = !editingEnabled;

      if (editingEnabled && modalNoteTitle) {
        modalNoteTitle.focus();
      }
    });
  }

  if (saveNoteBtn) {
    saveNoteBtn.addEventListener("click", async () => {
      if (!selectedNote) return;

      try {
        const response = await fetch("/notes/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            note_id: selectedNote.note_id,
            note_title: modalNoteTitle.value,
            icon_path: modalIconInput.value,
            note_text: noteTextArea.value
          })
        });

        const result = await response.json();

        if (result.success) {
          alert("Note updated successfully.");
          window.location.reload();
        } else {
          alert("Could not update note.");
        }
      } catch (error) {
        console.error("Error updating note:", error);
        alert("Error updating note.");
      }
    });
  }

  if (cancelNoteBtn) {
    cancelNoteBtn.addEventListener("click", closeModal);
  }

  if (noteModal) {
    noteModal.addEventListener("click", (event) => {
      if (event.target === noteModal) {
        closeModal();
      }
    });
  }

  const lastSelectedDayId = localStorage.getItem("lastSelectedDayId");
  if (lastSelectedDayId) {
    const lastButton = document.querySelector(`.favorite-day-btn[data-day-id="${lastSelectedDayId}"]`);
    if (lastButton) {
      displayFavorite(lastButton);
    }
  }
});