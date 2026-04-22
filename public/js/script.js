let selectedMode = "day";
let allWeatherDays = [];
let displayedWeatherDays = [];
let currentWeatherIndex = 0;
let selectedCityData = null;
let currentWeatherData = null;

document.querySelector("#countryDropdown").addEventListener("change", loadStates);
document.querySelector("#stateDropdown").addEventListener("change", loadCities);
document.querySelector("#dayBtn").addEventListener("click", setDayMode);
document.querySelector("#rangeBtn").addEventListener("click", setRangeMode);
document.querySelector("#submitBtn").addEventListener("click", getWeatherData);
document.querySelector("#prevBtn").addEventListener("click", showPreviousDay);
document.querySelector("#nextBtn").addEventListener("click", showNextDay);
document.querySelector("#favoriteForm").addEventListener("submit", handleFavorite);

async function loadCountries() {
    let response = await fetch("/api/countries");
    let countries = await response.json();

    let countryDropdown = document.querySelector("#countryDropdown");
    countryDropdown.innerHTML = `<option value="">Country Dropdown</option>`;

    let allowedCountries = ["US", "CA", "AU", "DE", "CN", "ES", "IT", "IN", "BR", "MX", "JP", "NZ", "ZA", "NL", "AF", "GR", "VN", "UA", "SE", "RU", "PT", "ID" ,"CU", "DK", "EG", "FI", "HN", "IE", "IR", "IQ", "JM", "KE", "KP", "KR", "KW", "NG", "ZW" ];

    for (let country of countries) {
        if (allowedCountries.includes(country.isoCode)) {
    
        countryDropdown.innerHTML += `
            <option value="${country.isoCode}">${country.name}</option>
        `;
        }
    }
}

async function loadStates() {
    let countryCode = document.querySelector("#countryDropdown").value;

    let stateDropdown = document.querySelector("#stateDropdown");
    let cityDropdown = document.querySelector("#cityDropdown");

    stateDropdown.innerHTML = `<option value="">State Dropdown</option>`;
    cityDropdown.innerHTML = `<option value="">City Dropdown</option>`;

    if (!countryCode) {
        return;
    }

    let response = await fetch(`/api/states/${countryCode}`);
    let states = await response.json();

    for (let state of states) {
        stateDropdown.innerHTML += `
            <option value="${state.isoCode}">${state.name}</option>
        `;
    }
}

async function loadCities() {
    let countryCode = document.querySelector("#countryDropdown").value;
    let stateCode = document.querySelector("#stateDropdown").value;

    let cityDropdown = document.querySelector("#cityDropdown");
    cityDropdown.innerHTML = `<option value="">City Dropdown</option>`;

    if (!countryCode || !stateCode) {
        return;
    }

    let response = await fetch(`/api/cities/${countryCode}/${stateCode}`);
    let cities = await response.json();

    for (let city of cities) {
        cityDropdown.innerHTML += `
            <option value="${city.name}" data-latitude="${city.latitude}" data-longitude="${city.longitude}">
                ${city.name}
            </option>
        `;
    }
}

function setDayMode() {
    selectedMode = "day";
    document.querySelector("#dayInput").style.display = "block";
    document.querySelector("#rangeInput").style.display = "none";
}

function setRangeMode() {
    selectedMode = "range";
    document.querySelector("#dayInput").style.display = "none";
    document.querySelector("#rangeInput").style.display = "block";
}

async function getWeatherData() {
    let countryDropdown = document.querySelector("#countryDropdown");
    let stateDropdown = document.querySelector("#stateDropdown");
    let cityDropdown = document.querySelector("#cityDropdown");
    let weatherOutput = document.querySelector("#weatherOutput");
    let selectedCity = cityDropdown.options[cityDropdown.selectedIndex];

    document.querySelector("#favoriteMessage").textContent = "";

    if (!countryDropdown.value || !stateDropdown.value || !cityDropdown.value) {
        weatherOutput.innerHTML = "Please select a country, state, and city.";
        return;
    }

    let latitude = selectedCity.dataset.latitude;
    let longitude = selectedCity.dataset.longitude;

    selectedCityData = {
        city_name: cityDropdown.value,
        country_name: countryDropdown.options[countryDropdown.selectedIndex].text,
        state_name: stateDropdown.options[stateDropdown.selectedIndex].text,
        latitude: latitude,
        longitude: longitude
    };

    let response = await fetch(`/api/weather?latitude=${latitude}&longitude=${longitude}`);
    let data = await response.json();
    currentWeatherData = data.current;

    if (!data.daily || !data.daily.time) {
        weatherOutput.innerHTML = "Weather data unavailable.";
        return;
    }

    allWeatherDays = [];

    for (let i = 0; i < data.daily.time.length; i++) {
        allWeatherDays.push({
            date: data.daily.time[i],
            tempMax: data.daily.temperature_2m_max[i],
            tempMin: data.daily.temperature_2m_min[i]
        });
    }

    if (selectedMode == "day") {
        let chosenDay = document.querySelector("#dayInput").value;

        if (!chosenDay) {
            weatherOutput.innerHTML = "Please choose a day.";
            displayedWeatherDays = [];
            updatePageCount();
            return;
        }

        let foundDay = allWeatherDays.find(day => day.date == chosenDay);

        if (!foundDay) {
            weatherOutput.innerHTML = "Please select a valid day from today to 6 days in the future.";
            displayedWeatherDays = [];
            updatePageCount();
            return;
        }

        displayedWeatherDays = [foundDay];
        currentWeatherIndex = 0;
        displayWeather();
    } else {
        let rangeValue = Number(document.querySelector("#rangeInput").value);

        if (!rangeValue || rangeValue < 1 || rangeValue > 16) {
            weatherOutput.innerHTML = "Please enter a range between 1 and 16 days.";
            displayedWeatherDays = [];
            updatePageCount();
            return;
        }

        displayedWeatherDays = allWeatherDays.slice(0, rangeValue);
        currentWeatherIndex = 0;
        displayWeather();
    }
}

function displayWeather() {
    let weatherOutput = document.querySelector("#weatherOutput");

    if (displayedWeatherDays.length == 0) {
        weatherOutput.innerHTML = "No weather data to display.";
        updatePageCount();
        return;
    }

    let currentDay = displayedWeatherDays[currentWeatherIndex];

    let highTemp = currentDay.tempMax;
    let lowTemp = currentDay.tempMin;
    let unit = "°C";

    if (window.tempUnit == "F") {
        highTemp = (highTemp * 9/5) + 32;
        lowTemp = (lowTemp * 9/5) + 32;
        unit = "°F";
    }

    weatherOutput.innerHTML = `
        <h2>${selectedCityData.city_name}</h2>
        <p><strong>Date:</strong> ${currentDay.date}</p>
        <p><strong>High:</strong> ${highTemp.toFixed(1)}${unit}</p>
        <p><strong>Low:</strong> ${lowTemp.toFixed(1)}${unit}</p>
    `;
    document.querySelector("#fav_country").value = selectedCityData.country_name;
    document.querySelector("#fav_state").value = selectedCityData.state_name;
    document.querySelector("#fav_city").value = selectedCityData.city_name;
    document.querySelector("#fav_date").value = currentDay.date;
    document.querySelector("#fav_longitude").value = selectedCityData.longitude;
    document.querySelector("#fav_latitude").value = selectedCityData.latitude;
    document.querySelector("#fav_weather").value =`{"current":{"temperature_2m":${currentWeatherData.temperature_2m},"wind_speed_10m":${currentWeatherData.wind_speed_10m},"weather_code":${currentWeatherData.weather_code}}}`;
    document.querySelector("#fav_date").value = currentDay.date;

    updatePageCount();
}

function showPreviousDay() {
    if (displayedWeatherDays.length == 0) {
        return;
    }

    if (currentWeatherIndex > 0) {
        currentWeatherIndex--;
        displayWeather();
    }
}

function showNextDay() {
    if (displayedWeatherDays.length == 0) {
        return;
    }

    if (currentWeatherIndex < displayedWeatherDays.length - 1) {
        currentWeatherIndex++;
        displayWeather();
    }
}

function updatePageCount() {
    let weatherPageCount = document.querySelector("#weatherPageCount");

    if (displayedWeatherDays.length == 0) {
        weatherPageCount.textContent = "0/0";
    } else {
        weatherPageCount.textContent = `${currentWeatherIndex + 1}/${displayedWeatherDays.length}`;
    }
}

function handleFavorite(event) {
let favoriteMessage = document.querySelector("#favoriteMessage");
    let favDate = document.querySelector("#fav_date").value;
    let favWeather = document.querySelector("#fav_weather").value;

    favoriteMessage.textContent = "";

    if (!favDate || !favWeather) {
        event.preventDefault();
        favoriteMessage.textContent = "No current day selected.";
    }
}

loadCountries();
setDayMode();