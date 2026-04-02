This is a solution to the Weather app challenge on Frontend Mentor.

These challenges are designed to sharpen real-world frontend skills by building production-level UI with real APIs.

## Table of contents
* Overview
* The challenge
* Screenshot
* Links
* My process
* Built with
* What I learned
* Continued development
* Useful resources
* AI Collaboration
* Author

## Users should be able to:
- Search for weather information by entering a location
- View current weather conditions (temperature, weather icon, location)
- See additional metrics like humidity, wind speed, precipitation, and “feels like” temperature
- Browse a 7-day weather forecast
- View hourly weather data for selected days
- Switch between measurement units (Celsius/Fahrenheit, km/h/mph, mm/in)
- Interact with dropdowns and UI states smoothly
- Experience responsive design across devices
- See loading, error, and empty states handled properly

## Screenshot
![alt text](<Screenshot 2026-04-02 151733.png>)

## Links
- Solution URL: https://github.com/blessingndeks/weather-app-main
- Live Site URL: https://wnow-app.netlify.app/

## My process
Built with:
* Semantic HTML5
* CSS custom properties (design system vibes)
* Flexbox & CSS Grid
* Vanilla JavaScript
* Open-Meteo API (weather + geocoding)
* Mobile-first workflow

## What I learned
- State management without frameworks
- I implemented a mini state system to control UI states like loading, error, no-results, and loaded. That forced me to think in terms of application flow, not just UI.
const S = { IDLE: 'idle', LOADING: 'loading', LOADED: 'loaded', ERROR: 'error', NO_RESULTS: 'no-results' };
Debounced search for better UX

- Instead of firing API calls on every keystroke, I used a timeout to optimize performance.
clearTimeout(searchTimer);
searchTimer = setTimeout(() => fetchSuggestions(q, false), 380);
Dynamic DOM rendering

- Instead of static HTML, most UI sections (daily forecast, suggestions, hourly data) are generated dynamically. That’s real-world frontend behavior.

- Error handling
If the API fails, the app doesn’t crash—it either restores previous data or shows a proper error UI. That’s production thinking.

## Continued development
If I keep building this (and I probably will), here’s the roadmap:
- Add geolocation (current location detection)
- Introduce local storage for saving last searched city
- Add dark/light theme toggle
- Refactor into React or Next.js for scalability
- Add animations (micro-interactions) for smoother UX
- Improve accessibility (ARIA roles are already started 👀)

## Useful resources
* Open-Meteo API
 – Free weather API, no API key stress
* MDN Web Docs
 – For DOM, fetch, and event handling clarity
* CSS Tricks
 – Helped refine layout and responsiveness patterns
* AI Collaboration
Tools used: ChatGPT
- How I used it:
- Debugging tricky JavaScript logic
- Structuring parts of the UI logic
- Brainstorming UX improvements
* What worked well:
- Speed. Like, ridiculously fast iteration
- Helped break down complex flows (especially state handling)
* What didn’t:
- Needed manual cleanup sometimes (AI can overcomplicate things)
- Still had to think through architecture myself

Bottom line: AI didn’t build the app, I did. It just acted like a really fast pair programmer.

## Author
- Name: Blessing Ndekhedehe
- Frontend Mentor: @blessingndeks
- Twitter/X: @blynk_dev
- Portfolio: https://myportfolionew12.netlify.app/