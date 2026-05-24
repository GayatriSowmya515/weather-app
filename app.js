var express = require('express');
var app = express();
require('dotenv').config();

var {
  getCurrentWeather,
  getForecast,
  aggregateFiveDayForecast,
  getQueryForResults,
} = require('./services/weather');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

function parseCoords(lat, lon) {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  if (
    Number.isNaN(latitude) ||
    Number.isNaN(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }
  return { lat: latitude, lon: longitude };
}

function getLocationParams(body) {
  const city = typeof body.city === 'string' ? body.city.trim() : '';
  if (city) {
    return { city };
  }

  const coords = parseCoords(body.lat, body.lon);
  if (coords) {
    return coords;
  }

  return null;
}

function showForecastFromBody(body) {
  return body.forecast === '1' || body.forecast === 1;
}

function renderSearchError(res, message) {
  res.render('search', { error: message });
}

app.get('/', function (req, res) {
  res.render('search', { error: null });
});

app.post('/results', async function (req, res) {
  const location = getLocationParams(req.body);
  const showForecast = showForecastFromBody(req.body);

  if (!location) {
    return renderSearchError(res, 'Please enter a city or use your location.');
  }

  if (!process.env.API_KEY) {
    return renderSearchError(
      res,
      'API key is missing. Add API_KEY to your .env file.'
    );
  }

  try {
    const data = await getCurrentWeather(location);
    const resultParams = getQueryForResults(data, req.body);

    let forecastDays = null;
    if (showForecast) {
      const forecastData = await getForecast(resultParams);
      forecastDays = aggregateFiveDayForecast(forecastData);
    }

    res.render('result', {
      data,
      error: null,
      showForecast,
      forecastDays,
      resultParams,
      searchCity: resultParams.city || data.name,
    });
  } catch (err) {
    let message = 'Could not load weather. Please try again.';
    if (err.status === 404) {
      message = 'City not found. Check the spelling and try again.';
    } else if (err.message && err.message.includes('API_KEY')) {
      message = err.message;
    }
    renderSearchError(res, message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log(`Server listening on port ${PORT}`);
});
