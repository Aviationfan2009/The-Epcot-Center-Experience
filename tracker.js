let geoData = null;
let musicPlayer = new Audio();
musicPlayer.loop = true;
let currentTrack = "";

async function startTracking() {
    // 1. Fetch the JSON from your GitHub
    const response = await fetch('zones.json');
    geoData = await response.json();

    // 2. Start watching location
    navigator.geolocation.watchPosition((position) => {
        const { latitude, longitude } = position.coords;
        let insideZone = null;

        // 3. Check if user is inside any Polygon
        geoData.features.forEach(zone => {
            if (isInside(latitude, longitude, zone.geometry.coordinates[0])) {
                insideZone = zone;
            }
        });

        const status = document.getElementById("status-box");

        // 4. Play music if inside, pause if outside
        if (insideZone) {
            const trackUrl = insideZone.properties.music;
            status.innerText = "Inside Zone: " + insideZone.properties.name;
            status.style.background = "#1db954";

            if (currentTrack !== trackUrl) {
                currentTrack = trackUrl;
                musicPlayer.src = trackUrl;
                musicPlayer.play().catch(e => console.error("Audio block:", e));
            }
        } else {
            status.innerText = "Outside Zones";
            status.style.background = "#333";
            musicPlayer.pause();
            currentTrack = "";
        }
    }, (err) => console.error(err), { enableHighAccuracy: true });
}

// Math logic to check if Point is in Polygon
function isInside(lat, lng, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i][1], yi = polygon[i][0]; // GeoJSON is [lng, lat]
        let xj = polygon[j][1], yj = polygon[j][0];
        let intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}
