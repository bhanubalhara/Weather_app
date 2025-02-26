// Weather API_KEY
const API_KEY = "7b24afee0cf29cfb44bbda74d46fe66f";
// Retriving recent searched city from local storage
let recentCities = JSON.parse(localStorage.getItem("recentCities")) || [];

// Function to update the recent cities dropdown
function updateRecentCitiesDropdown() {
  const dropdown = document.getElementById("recentCities");
  dropdown.innerHTML = 
  '<option value="">Recent Searches</option>' + recentCities.map((city) => 
    `<option value="${city}">${city}</option>`).join("");
  dropdown.classList.toggle("hidden", recentCities.length === 0); //Dropdown hidden if no city available
}

// Fetch current weather data for a city
async function fetchWeather(city) {
  try{
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );
    const data = await res.json();
    if(data.cod !== 200)        //Checking susscess of request
      throw new Error(data.message || "City Not Found");
    return data;
  }catch (error) {
    showError(error.message);
    return null;
  }
}

// Feathing 5-days weather forcasting data
async function fetchForecast(city) {
  try{
    const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );
    const data = await res.json();
    if(data.cod !== "200")       //Checking susscess of request
      throw new Error(data.message || "City Not Found");
    return data;
  }catch (error) {
    showError(error.message);
    return null;
  }
}

// The main function to get current and forcasted weather
async function getWeather() {
  let city = document.getElementById("cityInput").value.trim().toLowerCase();
  if(!city) return alert("Please enter the city");

  const weather = await fetchWeather(city);  //Fetch weather data
  if(weather) displayWeather(weather);

  const forecast = await fetchForecast(city);  //Fetch forecast data
  if(forecast) displayForecast(forecast);

  // Store city in recent search if request successful
  if(weather) {
    let formattedCity = weather.name;
    if(!recentCities.includes(city)) {
    recentCities.unshift(formattedCity);
    if (recentCities.length > 5) recentCities.pop(); //Keeping only 5 recent searched cities
    localStorage.setItem("recentCities", JSON.stringify(recentCities));
    updateRecentCitiesDropdown();
  }
}
document.getElementById("cityInput").value=""; //Clear search bar after searched
}

// Weather featching from dropdown section
async function getWeatherFromDropdown() {
  const city = document.getElementById("recentCities").value;
  if(city) {
    document.getElementById("cityInput").value = city;
    await getWeather();
  }
}

// Current weather display
function displayWeather(data) {
  if(!data.weather || data.weather.length === 0){
    showError("Weather data is unavailable");
    return;
  }
  const weatherCondition = data.weather[0]?.description || "Unknown";
  const weatherIcon = `https://openweathermap.org/img/wn/${data.weather[0]?.icon || "01d"}@2x.png`;

  document.getElementById("weatherResult").innerHTML = 
  `<div class="flex flex-col items-center text-center">
  <h2 class="text-2xl font-bold">${data.name},${data.sys?.country || "N/A"}</h2>
  <img src="${weatherIcon}" alt="${weatherCondition}" class="mx-auto w-20" />
  <p class="capitalize "> 🌥️ ${weatherCondition}</p>
  <p>💧 Humidity: ${data.main?.humidity ?? "N/A"}% </p> 
  <p> 💨 Wind: ${data.wind?.speed ?? "N/A"} m/s</p> 
  <p class="text-lg">Temperature: 🌡️${data.main?.temp ?? "N/A"}°C</p>
  </div>
  `;
}

// 5-days weather forecast displaying
function displayForecast(data) {
  const forecastDiv = document.getElementById("forecast");
  forecastDiv.innerHTML = "";

  if(!data.list || data.list.length === 0){
    forecastDiv.innerHTML = "<p class='text-gray-500'>No forecast data available</p>"
    return;
  }

  const dailyForecasts =new Map();
  const today = new Date().toDateString();

  // Filter forecast data to get only one entry per day
  data.list.forEach((item) => {
    const date = new Date(item.dt * 1000).toDateString();

    if(date !==today && !dailyForecasts.has(date)) 
      dailyForecasts.set(date, item);
  });

  let count = 0;
  dailyForecasts.forEach((day) => {
     if(count>= 5)  //Only 5 days weather to be displayed
      return;

    const weatherCondition = day.weather[0]?.description || "Unknown";
    const weatherIcon = `https://openweathermap.org/img/wn/${day.weather[0]?.icon || "01d"}@2x.png`;


    const humidity = day.main?.humidity ?? "N/A";
    forecastDiv.innerHTML += 
    `<div class="bg-blue-700 text-white p-4 rounded-lg text-center shadow-md flex flex-col items-center">
    <p>
      ${new Date(day.dt*1000).toLocaleDateString("en-US",{
      weekday: "short",
      month: "short",
      day: "numeric",
    })}</p>
    <img src="${weatherIcon}" alt="${weatherCondition}"
    class="mx-auto w-12" />
    <p class="capitalize"> 🌥️ ${weatherCondition}</p>
    <p>Temp : 🌡️${day.main?.temp ?? "N/A"} °C</p>
    <p>Wind :💨 ${day.wind?.speed ?? "N/A"} m/s</p> 
    <p>💧 Humidity: ${humidity}%</p>
    </div>
    `;
    count++;
  });
}

// Weather info based on current location
function getCurrentLocation() {
  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async(position) => {
        const {latitude, longitude } = position.coords;
        const weather = await fetchWeatherByCoords( latitude, longitude);
        if (weather) displayWeather(weather);

        const forecast = await fetchForecastByCoords(latitude, longitude);
        if (forecast) displayForecast(forecast);
      },
      () => showError("Access of location denied")
    );
  }else{
    showError("The Geolocation isn't supported by your browser");
  }
}

// Weather featching based on longitde and latitude
async function fetchWeatherByCoords(lat, lon) {
  try{
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    const data = await res.json();
    if (data.cod !== 200)
      throw new Error(data.message || "Location not found");
    return data;
  }catch(error) {
    showError(error.message);
    return null;
  }
}

// Weather forecasting based on longitde and latitude
async function fetchForecastByCoords(lat, lon) {
  try{
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    const data = await res.json();
    if (data.cod !== "200")
      throw new Error(data.message || "Location not found !!");
    return data;
  }catch(error) {
    showError(error.message);
    return null;
  }
}

// Error message
function showError(message) {
  document.getElementById("weatherResult").innerHTML = `<p class="text-red-700">${message}</p>`;
  document.getElementById("forecast").innerHTML = "";
}

// Initialize dropdown menu on page load
updateRecentCitiesDropdown();