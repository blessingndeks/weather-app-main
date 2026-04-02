 // Weather Now — app.js
 // Uses Open-Meteo Geocoding API for city search
 
const ICON_PATH = 'assets/images/';
const ICON_EXT  = '.webp';

const ICON_MAP = {
  0:  { day: 'icon-sunny',              night: 'icon-overcast'             },
  1:  { day: 'icon-sunny',              night: 'icon-overcast'             },
  2:  { day: 'icon-partly-cloudy',      night: 'icon-partly-cloudy'        },
  3:  { day: 'icon-overcast',           night: 'icon-overcast'             },
  45: { day: 'icon-fog',                night: 'icon-fog'                  },
  48: { day: 'icon-fog',                night: 'icon-fog'                  },
  51: { day: 'icon-drizzle',            night: 'icon-drizzle'              },
  53: { day: 'icon-drizzle',            night: 'icon-drizzle'              },
  55: { day: 'icon-drizzle',            night: 'icon-drizzle'              },
  56: { day: 'icon-drizzle',            night: 'icon-drizzle'              },
  57: { day: 'icon-drizzle',            night: 'icon-drizzle'              },
  61: { day: 'icon-rain',               night: 'icon-rain'                 },
  63: { day: 'icon-rain',               night: 'icon-rain'                 },
  65: { day: 'icon-rain',               night: 'icon-rain'                 },
  66: { day: 'icon-rain',               night: 'icon-rain'                 },
  67: { day: 'icon-rain',               night: 'icon-rain'                 },
  71: { day: 'icon-snow',               night: 'icon-snow'                 },
  73: { day: 'icon-snow',               night: 'icon-snow'                 },
  75: { day: 'icon-snow',               night: 'icon-snow'                 },
  77: { day: 'icon-snow',               night: 'icon-snow'                 },
  80: { day: 'icon-rain',               night: 'icon-rain'                 },
  81: { day: 'icon-rain',               night: 'icon-rain'                 },
  82: { day: 'icon-rain',               night: 'icon-rain'                 },
  85: { day: 'icon-snow',               night: 'icon-snow'                 },
  86: { day: 'icon-snow',               night: 'icon-snow'                 },
  95: { day: 'icon-storm',              night: 'icon-storm'                },
  96: { day: 'icon-storm',              night: 'icon-storm'                },
  99: { day: 'icon-storm',              night: 'icon-storm'                },
};

/* State */
const S = { IDLE: 'idle', LOADING: 'loading', LOADED: 'loaded', ERROR: 'error', NO_RESULTS: 'no-results' };

let appState      = S.IDLE;
let weatherData   = null;
let selectedLoc   = null;
let selDayIdx     = 0;
let lastFetch     = null;
let searchTimer   = null;

// Unit prefs — default metric
let units = { temp: 'celsius', wind: 'kmh', precip: 'mm' };

/* Dom Refs */
const $ = id => document.getElementById(id);

const dom = {
  unitsWrapper:      $('unitsWrapper'),
  unitsBtn:          $('unitsBtn'),
  unitsDropdown:     $('unitsDropdown'),
  switchAllBtn:      $('switchAllBtn'),
  searchInput:       $('searchInput'),
  searchInputWrap:   $('searchInputWrap'),
  searchBtn:         $('searchBtn'),
  searchDropdown:    $('searchDropdown'),
  searchInProgress:  $('searchInProgress'),
  suggestionsList:   $('suggestionsList'),
  errorFullpage:     $('errorFullpage'),
  mainContent:       $('mainContent'),
  noResults:         $('noResults'),
  weatherLayout:     $('weatherLayout'),
  retryBtn:          $('retryBtn'),
  weatherCard:       $('weatherCard'),
  cardSkeleton:      $('cardSkeleton'),
  cardLoadedData:    $('cardLoadedData'),
  cardCity:          $('cardCity'),
  cardDate:          $('cardDate'),
  cardIcon:          $('cardIcon'),
  cardTemp:          $('cardTemp'),
  statFeels:         $('statFeels'),
  statHumidity:      $('statHumidity'),
  statWind:          $('statWind'),
  statPrecip:        $('statPrecip'),
  dailyGrid:         $('dailyGrid'),
  hourlyList:        $('hourlyList'),
  dayPickerWrap:     $('dayPickerWrap'),
  dayPickerBtn:      $('dayPickerBtn'),
  dayPickerLabel:    $('dayPickerLabel'),
  dayPickerDropdown: $('dayPickerDropdown'),
};

/* Init */
function init() {
  bindEvents();
  setState(S.IDLE);
}

/* Event Binding */
function bindEvents() {
  dom.searchInput.addEventListener('input', onSearchInput);
  dom.searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') triggerSearch(); });
  dom.searchBtn.addEventListener('click', triggerSearch);

  dom.unitsBtn.addEventListener('click', e => { e.stopPropagation(); toggleUnitsDropdown(); });
  dom.switchAllBtn.addEventListener('click', switchAllUnits);
  document.querySelectorAll('.unit-opt').forEach(el => {
    el.addEventListener('click', () => selectUnit(el.dataset.group, el.dataset.value));
  });

  dom.dayPickerBtn.addEventListener('click', e => { e.stopPropagation(); toggleDayPicker(); });

  dom.retryBtn.addEventListener('click', doRetry);

  document.addEventListener('click', e => {
    if (!dom.unitsWrapper.contains(e.target)) closeUnitsDropdown();
    if (!dom.searchInputWrap.contains(e.target) && !dom.searchDropdown.contains(e.target)) {
      hideSearchDropdown();
    }
    if (!dom.dayPickerWrap.contains(e.target)) {
      dom.dayPickerDropdown.style.display = 'none';
    }
  });
}

/* Search & Geocoding */
function onSearchInput() {
  const q = dom.searchInput.value.trim();
  clearTimeout(searchTimer);
  if (!q) { hideSearchDropdown(); return; }

  showSearchDropdown();
  setSearchProgress(true);
  dom.suggestionsList.innerHTML = '';

  searchTimer = setTimeout(() => fetchSuggestions(q, false), 380);
}

async function triggerSearch() {
  const q = dom.searchInput.value.trim();
  if (!q) return;
  clearTimeout(searchTimer);
  showSearchDropdown();
  setSearchProgress(true);
  dom.suggestionsList.innerHTML = '';
  await fetchSuggestions(q, true);
}

async function fetchSuggestions(query, autoSelect) {
  try {
    const res  = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
    );
    if (!res.ok) throw new Error('Geocoding error');
    const data = await res.json();
    const results = data.results || [];

    setSearchProgress(false);

    if (results.length === 0) {
      hideSearchDropdown();
      setState(S.NO_RESULTS);
      return;
    }

    if (autoSelect && results.length === 1) {
      hideSearchDropdown();
      pickLocation(results[0]);
      return;
    }

    renderSuggestions(results);
  } catch {
    setSearchProgress(false);
    hideSearchDropdown();
    if (!weatherData) {
      setState(S.ERROR);
    } else {
      showToast('Search failed. Please check your connection and try again.');
    }
  }
}

function renderSuggestions(results) {
  dom.suggestionsList.innerHTML = '';
  results.forEach(r => {
    const div = document.createElement('div');
    div.className = 'suggestion-item';
    const admin = r.admin1 ? `, ${r.admin1}` : '';
    div.textContent = `${r.name}${admin}, ${r.country}`;
    div.addEventListener('click', () => {
      hideSearchDropdown();
      dom.searchInput.value = `${r.name}, ${r.country}`;
      pickLocation(r);
    });
    dom.suggestionsList.appendChild(div);
  });
}

function pickLocation(loc) {
  selectedLoc = loc;
  dom.searchInput.value = `${loc.name}, ${loc.country}`;
  fetchWeather(loc.latitude, loc.longitude, loc.name, loc.country);
}

/* Weather Fetch */
async function fetchWeather(lat, lon, name, country) {
  const hadData = !!weatherData;
  setState(S.LOADING);
  lastFetch = { lat, lon, name, country };

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weathercode,windspeed_10m,is_day` +
      `&hourly=temperature_2m,weathercode,precipitation` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum` +
      `&timezone=auto&forecast_days=7`;

    const res  = await fetch(url);
    if (!res.ok) throw new Error('Weather API error');
    const data = await res.json();

    data._name    = name;
    data._country = country;

    weatherData = data;
    selDayIdx   = 0;

    setState(S.LOADED);
    renderAll(data);
  } catch {
    if (hadData && weatherData) {
      setState(S.LOADED);
      renderAll(weatherData);
      showToast('Could not fetch weather for that location. Please try again.');
    } else {
      setState(S.ERROR);
    }
  }
}

/* Render */
function renderAll(data) {
  renderCard(data);
  renderStats(data);
  renderDaily(data);
  renderDayPicker(data);
  renderHourly(data, selDayIdx);
}

function renderCard(data) {
  const c = data.current;
  const isDay = c.is_day === 1;

  dom.cardCity.textContent = `${data._name}, ${data._country}`;
  dom.cardDate.textContent = formatDateFull(c.time.split('T')[0]);

  const cardRight = document.getElementById('cardRight');
  cardRight.innerHTML = iconHTML(c.weathercode, isDay, 'card-weather-icon') +
    `<div class="card-temp" id="cardTemp">${formatTemp(c.temperature_2m)}°</div>`;
  dom.cardTemp = document.getElementById('cardTemp');

  dom.cardSkeleton.style.display = 'none';
  dom.cardLoadedData.style.display = 'flex';
  dom.weatherCard.classList.add('loaded');
}

function renderStats(data) {
  const c = data.current;
  dom.statFeels.textContent    = `${formatTemp(c.apparent_temperature)}°`;
  dom.statHumidity.textContent = `${Math.round(c.relative_humidity_2m)}%`;
  dom.statWind.textContent     = formatWind(c.windspeed_10m);
  dom.statPrecip.textContent   = formatPrecip(c.precipitation);
}

function renderDaily(data) {
  const { daily } = data;
  const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  dom.dailyGrid.innerHTML = '';
  for (let i = 0; i < daily.time.length; i++) {
    const d    = new Date(daily.time[i] + 'T12:00:00');
    const code = daily.weathercode[i];
    const high = formatTemp(daily.temperature_2m_max[i]);
    const low  = formatTemp(daily.temperature_2m_min[i]);

    const card = document.createElement('div');
    card.className = 'day-card';
    card.innerHTML = `
      <div class="day-name">${DAY_SHORT[d.getDay()]}</div>
      ${iconHTML(code, true, 'day-icon')}
      <div class="day-temps">
        <span class="day-high">${high}°</span>
        <span class="day-low">${low}°</span>
      </div>`;
    dom.dailyGrid.appendChild(card);
  }
}

function renderDayPicker(data) {
  const { daily } = data;
  const DAY_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  dom.dayPickerDropdown.innerHTML = '';

  for (let i = 0; i < daily.time.length; i++) {
    const d    = new Date(daily.time[i] + 'T12:00:00');
    const name = DAY_FULL[d.getDay()];

    const opt = document.createElement('div');
    opt.className = 'day-pick-opt' + (i === selDayIdx ? ' active' : '');
    opt.textContent = name;
    opt.addEventListener('click', e => {
      e.stopPropagation();
      selDayIdx = i;
      dom.dayPickerLabel.textContent = name;
      dom.dayPickerDropdown.style.display = 'none';
      dom.dayPickerDropdown.querySelectorAll('.day-pick-opt').forEach((el, idx) => {
        el.classList.toggle('active', idx === i);
      });
      renderHourly(data, i);
    });
    dom.dayPickerDropdown.appendChild(opt);
  }

  const todayD = new Date(daily.time[0] + 'T12:00:00');
  dom.dayPickerLabel.textContent = DAY_FULL[todayD.getDay()];
}

function renderHourly(data, dayIdx) {
  const { hourly, daily } = data;
  const targetDate = daily.time[dayIdx];
  const now = new Date();

  dom.hourlyList.innerHTML = '';

  let count = 0;
  for (let i = 0; i < hourly.time.length; i++) {
    if (!hourly.time[i].startsWith(targetDate)) continue;

    const dt = new Date(hourly.time[i]);
    if (dayIdx === 0 && dt < now && count === 0) continue;

    const h       = dt.getHours();
    const isDay   = h >= 6 && h < 20;
    const code    = hourly.weathercode[i];
    const timeStr = formatHour(hourly.time[i]);
    const temp    = formatTemp(hourly.temperature_2m[i]);

    const item = document.createElement('div');
    item.className = 'hourly-item';
    item.innerHTML = `
      ${iconHTML(code, isDay, 'hourly-icon')}
      <span class="hourly-time">${timeStr}</span>
      <span class="hourly-temp">${temp}°</span>`;
    dom.hourlyList.appendChild(item);
    count++;
  }

  if (count === 0 && dayIdx === 0) {
    for (let i = 0; i < hourly.time.length; i++) {
      if (!hourly.time[i].startsWith(targetDate)) continue;
      const dt    = new Date(hourly.time[i]);
      const h     = dt.getHours();
      const isDay = h >= 6 && h < 20;

      const item = document.createElement('div');
      item.className = 'hourly-item';
      item.innerHTML = `
        ${iconHTML(hourly.weathercode[i], isDay, 'hourly-icon')}
        <span class="hourly-time">${formatHour(hourly.time[i])}</span>
        <span class="hourly-temp">${formatTemp(hourly.temperature_2m[i])}°</span>`;
      dom.hourlyList.appendChild(item);
    }
  }
}

/* State MGT */
function setState(newState) {
  appState = newState;

  const show = el => el && (el.style.display = '');
  const hide = el => el && (el.style.display = 'none');

  hide(dom.errorFullpage);
  show(dom.mainContent);
  hide(dom.noResults);
  hide(dom.weatherLayout);

  switch (newState) {

    case S.IDLE:
      break;

    case S.LOADING:
      show(dom.weatherLayout);
      dom.weatherCard.classList.remove('loaded');
      dom.cardSkeleton.style.display = '';
      dom.cardLoadedData.style.display = 'none';
      dom.statFeels.textContent    = '—';
      dom.statHumidity.textContent = '—';
      dom.statWind.textContent     = '—';
      dom.statPrecip.textContent   = '—';
      dom.dailyGrid.innerHTML  = Array(7).fill('<div class="day-card skeleton"></div>').join('');
      dom.hourlyList.innerHTML = Array(8).fill('<div class="hourly-item skeleton"></div>').join('');
      dom.dayPickerLabel.textContent = '–';
      break;

    case S.LOADED:
      show(dom.weatherLayout);
      break;

    case S.ERROR:
      hide(dom.mainContent);
      show(dom.errorFullpage);
      break;

    case S.NO_RESULTS:
      show(dom.noResults);
      break;
  }
}

/* Units */
function selectUnit(group, value) {
  units[group] = value;

  document.querySelectorAll(`.unit-opt[data-group="${group}"]`).forEach(el => {
    const active = el.dataset.value === value;
    el.classList.toggle('active', active);
    const chk = el.querySelector('.opt-check');
    if (chk) chk.classList.toggle('hidden', !active);
  });

  updateSwitchLabel();
  if (appState === S.LOADED && weatherData) reRenderUnits();
}

function switchAllUnits() {
  const toImperial = units.temp === 'celsius';
  if (toImperial) {
    selectUnit('temp',   'fahrenheit');
    selectUnit('wind',   'mph');
    selectUnit('precip', 'in');
  } else {
    selectUnit('temp',   'celsius');
    selectUnit('wind',   'kmh');
    selectUnit('precip', 'mm');
  }
}

function updateSwitchLabel() {
  const toImperial = units.temp === 'celsius';
  dom.switchAllBtn.textContent = toImperial ? 'Switch to Imperial' : 'Switch to Metric';
}

function reRenderUnits() {
  const c = weatherData.current;
  dom.cardTemp.textContent     = `${formatTemp(c.temperature_2m)}°`;
  dom.statFeels.textContent    = `${formatTemp(c.apparent_temperature)}°`;
  dom.statHumidity.textContent = `${Math.round(c.relative_humidity_2m)}%`;
  dom.statWind.textContent     = formatWind(c.windspeed_10m);
  dom.statPrecip.textContent   = formatPrecip(c.precipitation);
  renderDaily(weatherData);
  renderHourly(weatherData, selDayIdx);
}

/* Conversion */
function formatTemp(c) {
  if (c == null) return '—';
  if (units.temp === 'fahrenheit') return Math.round(c * 9 / 5 + 32);
  return Math.round(c);
}

function formatWind(kmh) {
  if (kmh == null) return '—';
  if (units.wind === 'mph') return `${Math.round(kmh * 0.6214)} mph`;
  return `${Math.round(kmh)} km/h`;
}

function formatPrecip(mm) {
  if (mm == null) return '—';
  if (units.precip === 'in') return `${(mm / 25.4).toFixed(2)} in`;
  return `${mm % 1 === 0 ? mm : mm.toFixed(1)} mm`;
}

/* Utils */
function getIconPath(code, isDay = true) {
  const entry = ICON_MAP[code] ?? ICON_MAP[2];
  const name  = isDay ? entry.day : (entry.night ?? entry.day);
  return `${ICON_PATH}${name}${ICON_EXT}`;
}

function iconHTML(code, isDay, cssClass) {
  return `<img class="${cssClass}" src="${getIconPath(code, isDay)}" alt="${wmoDescription(code)}" />`;
}

function formatDateFull(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
}

function formatHour(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
}

function wmoDescription(code) {
  const map = {
    0:'Clear sky', 1:'Mainly clear', 2:'Partly cloudy', 3:'Overcast',
    45:'Foggy', 48:'Icy fog',
    51:'Light drizzle', 53:'Drizzle', 55:'Heavy drizzle',
    61:'Light rain', 63:'Rain', 65:'Heavy rain',
    71:'Light snow', 73:'Snow', 75:'Heavy snow', 77:'Snow grains',
    80:'Rain showers', 81:'Rain showers', 82:'Heavy rain showers',
    85:'Snow showers', 86:'Heavy snow showers',
    95:'Thunderstorm', 96:'Thunderstorm with hail', 99:'Thunderstorm with heavy hail',
  };
  return map[code] ?? 'Unknown';
}

/* Toast Notification */
function showToast(msg) {
  let toast = document.getElementById('searchToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'searchToast';
    toast.className = 'search-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('visible'), 4000);
}

/* Dropdown Toggles */
function toggleUnitsDropdown() {
  const open = dom.unitsDropdown.classList.toggle('open');
  dom.unitsBtn.setAttribute('aria-expanded', open);
  dom.unitsDropdown.setAttribute('aria-hidden', !open);
}

function closeUnitsDropdown() {
  dom.unitsDropdown.classList.remove('open');
  dom.unitsBtn.setAttribute('aria-expanded', 'false');
}

function showSearchDropdown() {
  dom.searchDropdown.style.display = 'block';
}

function hideSearchDropdown() {
  dom.searchDropdown.style.display = 'none';
  dom.suggestionsList.innerHTML = '';
  setSearchProgress(false);
}

function setSearchProgress(show) {
  dom.searchInProgress.style.display = show ? 'flex' : 'none';
}

function toggleDayPicker() {
  const dd = dom.dayPickerDropdown;
  dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
}

/* Retry */
function doRetry() {
  if (lastFetch) {
    fetchWeather(lastFetch.lat, lastFetch.lon, lastFetch.name, lastFetch.country);
  }
}

/* Kick Off */
init();

// Default city — Berlin, Germany
fetchWeather(52.5244, 13.4105, 'Berlin', 'Germany');