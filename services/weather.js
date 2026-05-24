const API_BASE = 'https://api.openweathermap.org/data/2.5';

function buildUrl(path, params) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error('API_KEY is not set in .env');
  }
  const search = new URLSearchParams({ ...params, appid: apiKey, units: 'metric' });
  return `${API_BASE}${path}?${search.toString()}`;
}

async function fetchJson(url) {
  const response = await fetch(url);
  const body = await response.json();
  if (!response.ok) {
    const message =
      body.message || `Weather API error (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return body;
}

async function getCurrentWeather({ city, lat, lon }) {
  const params = city
    ? { q: city }
    : { lat: String(lat), lon: String(lon) };
  const url = buildUrl('/weather', params);
  return fetchJson(url);
}

async function getForecast({ city, lat, lon }) {
  const params = city
    ? { q: city }
    : { lat: String(lat), lon: String(lon) };
  const url = buildUrl('/forecast', params);
  return fetchJson(url);
}

function formatDayLabel(dateStr) {
  const date = new Date(`${dateStr}T12:00:00`);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, tomorrow)) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function aggregateFiveDayForecast(forecastData) {
  const byDay = {};

  for (const item of forecastData.list) {
    const date = item.dt_txt.split(' ')[0];
    if (!byDay[date]) {
      byDay[date] = { temps: [], items: [] };
    }
    byDay[date].temps.push(item.main.temp);
    byDay[date].items.push(item);
  }

  return Object.keys(byDay)
    .slice(0, 5)
    .map((date) => {
      const day = byDay[date];
      const midday = day.items[Math.floor(day.items.length / 2)];
      const weather = midday.weather[0];

      return {
        date,
        label: formatDayLabel(date),
        tempMin: Math.round(Math.min(...day.temps)),
        tempMax: Math.round(Math.max(...day.temps)),
        description: weather.description,
        icon: weather.icon,
      };
    });
}

function getQueryForResults(weatherData, reqQuery) {
  if (reqQuery.city) {
    return { city: reqQuery.city };
  }
  return {
    lat: reqQuery.lat || weatherData.coord.lat,
    lon: reqQuery.lon || weatherData.coord.lon,
  };
}

module.exports = {
  getCurrentWeather,
  getForecast,
  aggregateFiveDayForecast,
  getQueryForResults,
};
