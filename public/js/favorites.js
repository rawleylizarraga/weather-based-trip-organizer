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
  const deleteNoteBtn = document.getElementById("deleteNoteBtn");
  const cancelNoteBtn = document.getElementById("cancelNoteBtn");
  const addNoteBtn = document.getElementById("addNoteBtn");

  let selectedNote = null;
  let selectedDayId = null;
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
    modalIconInput.disabled = true;
    noteTextArea.readOnly = true;

    if (deleteNoteBtn) deleteNoteBtn.style.display = "inline-block";

    noteModal.classList.remove("hidden");
  }

   function closeModal() {
   if (!noteModal || !modalNoteTitle || !modalIconInput || !noteTextArea) return;

   noteModal.classList.add("hidden");
   selectedNote = null;
   editingEnabled = false;

   modalNoteTitle.readOnly = true;
   modalIconInput.disabled = true;
   noteTextArea.readOnly = true;

   if (deleteNoteBtn) deleteNoteBtn.style.display = "none";
}

  function renderNotes(notes) {
    if (!notes || notes.length === 0) {
      notesOutput.innerHTML = `<p class="text-muted mb-0">No notes attached to this favorite day.</p>`;
      return;
    }

    notesOutput.innerHTML = notes.map((note, index) => `
      <div class="card mb-3 shadow-sm">
        <div class="card-body">
          <h5 class="card-title mb-2">${note.note_title || "Untitled Note"}</h5>
          <p class="card-text mb-2">${note.note_text || ""}</p>
          <p class="mb-3"><strong>Icon:</strong> ${note.icon_path || "None"}</p>
          <button class="open-note-btn btn btn-outline-primary btn-sm" data-note-index="${index}">
            Open Note
          </button>
        </div>
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
    selectedDayId = button.dataset.dayId;

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

 if (addNoteBtn) {
  addNoteBtn.addEventListener("click", () => {
    if (!selectedDayId) {
      alert("Please select a favorite day first.");
      return;
    }

    selectedNote = null;
    editingEnabled = true;

    modalNoteTitle.value = "";
    modalIconInput.value = "";
    noteTextArea.value = "";

    modalNoteTitle.readOnly = false;
    modalIconInput.disabled = false;
    noteTextArea.readOnly = false;

   if (deleteNoteBtn) deleteNoteBtn.style.display = "none";

    noteModal.classList.remove("hidden");
    modalNoteTitle.focus();
  });
}

if (editNoteBtn) {
  editNoteBtn.addEventListener("click", () => {
    editingEnabled = !editingEnabled;

    if (modalNoteTitle) modalNoteTitle.readOnly = !editingEnabled;
    if (modalIconInput) modalIconInput.disabled = !editingEnabled;
    if (noteTextArea) noteTextArea.readOnly = !editingEnabled;

    if (editingEnabled && modalNoteTitle) {
      modalNoteTitle.focus();
    }
  });
}

  if (saveNoteBtn) {
  saveNoteBtn.addEventListener("click", async () => {
    try {
      let url = "/notes/update";
      let payload = {
        note_title: modalNoteTitle.value,
        icon_path: modalIconInput.value,
        note_text: noteTextArea.value
      };

      if (selectedNote) {
        payload.note_id = selectedNote.note_id;
      } else {
        url = "/notes/add";
        payload.day_id = selectedDayId;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        alert(selectedNote ? "Note updated successfully." : "Note added successfully.");
        window.location.reload();
      } else {
        alert("Could not save note.");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Error saving note.");
    }
  });
}

if (deleteNoteBtn) {
  deleteNoteBtn.addEventListener("click", async () => {
    if (!selectedNote || !selectedNote.note_id) {
      alert("No note selected to delete.");
      return;
    }

    const confirmed = confirm("Are you sure you want to delete this note?");
    if (!confirmed) return;

    try {
      const response = await fetch("/notes/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          note_id: selectedNote.note_id
        })
      });

      const result = await response.json();

      if (result.success) {
        alert("Note deleted successfully.");
        closeModal();
        window.location.reload();
      } else {
        alert("Could not delete note.");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Error deleting note.");
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