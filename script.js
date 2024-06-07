const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");

var mykey = config.MY_KEY;
var secretkey = config.SECRET_KEY;

const API_KEY = mykey; // API key for OpenWeatherMap API

const getDayOfWeek = (dateString) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = new Date(dateString);
    return days[date.getUTCDay()];
}

const createWeatherCard = (cityName, weatherItem, index) => {
    if (index === 0) { // Main weather card
        return `<div class="details">
                    <h2>${cityName}</h2>
                    <h6>Temperature: ${(weatherItem.main.temp - 273.15).toFixed(2)} °C</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity} %</h6>
                </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                    <h6>${weatherItem.weather[0].description}</h6>
                </div>`;
    } else { // Five-day forecast card
        return `<li class="card">
                    <h3>${getDayOfWeek(weatherItem.dt_txt)}</h3>
                    <div class="icon">
                        <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                        <h6>${weatherItem.weather[0].description}</h6>
                    </div>
                    <h6>Temp: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </li>`;
    }
}

const getWeatherDetails = (cityName, latitude, longitude) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;

    fetch(WEATHER_API_URL).then(response => response.json()).then(data => {
        const uniqueForecastDays = [];
        const fiveDaysForecast = data.list.filter(forecast => {
            const forecastDate = new Date(forecast.dt_txt).getDate();
            if (!uniqueForecastDays.includes(forecastDate)) {
                return uniqueForecastDays.push(forecastDate);
            }
        });
        // Previous value cleared
        cityInput.value = "";
        currentWeatherDiv.innerHTML = "";
        weatherCardsDiv.innerHTML = "";

        fiveDaysForecast.forEach((weatherItem, index) => {
            const html = createWeatherCard(cityName, weatherItem, index);
            if (index === 0) {
                currentWeatherDiv.insertAdjacentHTML("beforeend", html);
            } else {
                weatherCardsDiv.insertAdjacentHTML("beforeend", html);
            }
        });        
    }).catch(() => {
        alert("An error occurred while fetching the weather forecast!");
    });
}

const getCityCoordinates = () => {
    const cityName = cityInput.value.trim();
    if (cityName === "") return;

    const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
    
    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            if (!data.length) return alert(`No coordinates found for ${cityName}`);
            const { lat, lon, name } = data[0];
            getWeatherDetails(name, lat, lon); // Fetch weather details
            getAQIData(lat, lon); // Fetch AQI data
        })
        .catch(() => {
            alert("An error occurred while fetching the coordinates!");
        });
}

const getAQIAdvisory = (aqi) => {
    if (aqi <= 1) {
        return `
            <span class="advisory-level">Advisory: Good.</span>
            <span class="advisory-detail">Air quality is satisfactory, and air pollution poses little or no risk.</span>
        `;
    } else if (aqi <= 2) {
        return `
            <span class="advisory-level">Advisory: Moderate.</span>
            <span class="advisory-detail">Members of sensitive groups may experience health effects. The general public is less likely to be affected.</span>
        `;
    } else if (aqi <= 3) {
        return `
            <span class="advisory-level">Advisory: Unhealthy for Sensitive Groups.</span>
            <span class="advisory-detail">Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.</span>
        `;
    } else if (aqi <= 4) {
        return `
            <span class="advisory-level">Advisory: Unhealthy.</span>
            <span class="advisory-detail">Health alert: The risk of health effects is increased for everyone.</span>
        `;
    } else if (aqi <= 5) {
        return `
            <span class="advisory-level">Advisory: Very Unhealthy.</span>
            <span class="advisory-detail">Health warning of emergency conditions: everyone is more likely to be affected.</span>
        `;
    } else {
        return `
            <span class="advisory-level">Advisory: Hazardous.</span>
            <span class="advisory-detail">Health warning of emergency conditions: everyone is more likely to be affected.</span>
        `;
    }
};

const getAQIData = (latitude, longitude) => {
    const AQI_API_URL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;

    fetch(AQI_API_URL)
        .then(response => response.json())
        .then(data => {
            const { aqi } = data.list[0].main;
            const aqiValueElement = document.getElementById("aqi-value");
            const aqiAdvisoryElement = document.getElementById("aqi-advisory");

            aqiValueElement.textContent = `AQI: ${aqi}`;
            aqiAdvisoryElement.innerHTML = getAQIAdvisory(aqi);
        })
        .catch(() => {
            alert("An error occurred while fetching the Air Quality Index!");
        });
}


const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords; // Get coordinates of user location
            // Get city name from coordinates using reverse geocoding API
            const API_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;

            fetch(API_URL)
                .then(response => response.json())
                .then(data => {
                    const { name } = data[0];
                    getWeatherDetails(name, latitude, longitude); // Fetch weather details
                    getAQIData(latitude, longitude); // Fetch AQI data
                })
                .catch(() => {
                    alert("An error occurred while fetching the city name!");
                });
        },
        error => { // Show alert if user denied the location permission
            if (error.code === error.PERMISSION_DENIED) {
                alert("Geolocation request denied. Please reset location permission to grant access again.");
            } else {
                alert("Geolocation request error. Please reset location permission.");
            }
        });
}

const displayDefaultWeather = () => {
    const bengaluruCoordinates = { lat: 12.9716, lon: 77.5946 };
    const bengaluruCityName = "Bengaluru"; // City name for Bengaluru

    getWeatherDetails(bengaluruCityName, bengaluruCoordinates.lat, bengaluruCoordinates.lon);

    // Fetch AQI data and update the AQI card
    const AQI_API_URL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${bengaluruCoordinates.lat}&lon=${bengaluruCoordinates.lon}&appid=${API_KEY}`;

    fetch(AQI_API_URL)
        .then(response => response.json())
        .then(data => {
            const { aqi } = data.list[0].main;
            const aqiValueElement = document.getElementById("aqi-value");
            const aqiAdvisoryElement = document.getElementById("aqi-advisory");

           // Update AQI values in the card
            aqiValueElement.textContent = `AQI: ${aqi}`;

            // Advisory messages
            if (aqi <= 50) {
                aqiAdvisoryElement.textContent = "Advisory: Good";
            } else if (aqi <= 100) {
                aqiAdvisoryElement.textContent = "Advisory: Moderate";
            } else if (aqi <= 150) {
                aqiAdvisoryElement.textContent = "Advisory: Unhealthy for Sensitive Groups";
            } else if (aqi <= 200) {
                aqiAdvisoryElement.textContent = "Advisory: Unhealthy";
            } else if (aqi <= 300) {
                aqiAdvisoryElement.textContent = "Advisory: Very Unhealthy";
            } else {
                aqiAdvisoryElement.textContent = "Advisory: Hazardous";
            }
        })
        .catch(() => {
            alert("An error occurred while fetching the Air Quality Index!");
        });
}


locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());

displayDefaultWeather();
