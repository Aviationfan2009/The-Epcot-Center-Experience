let geoData = null;
let player = new Audio();
player.loop = true;
let currentTrack = "";

async function startTracking() {
    try {
        const response = await fetch('zones.json');
        geoData = await response.json();
    } catch (e) {
        return alert("Check your zones.json file!");
    }

    navigator.geolocation.watchPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        let insideZone = null;

        // Check if user is inside the GeoJSON Polygon
        geoData.features.forEach(zone => {
            // GeoJSON coordinates are [longitude, latitude]
            if (isInside(latitude, longitude, zone.geometry.coordinates[0])) {
                insideZone = zone;
            }
        });

        const status = document.getElementById("status-box");

        if (insideZone) {
            const trackUrl = insideZone.properties.music;
            status.innerText = "Playing: " + insideZone.properties.name;
            status.className = "inside";

            if (currentTrack !== trackUrl) {
                currentTrack = trackUrl;
                player.src = trackUrl;
                player.play().catch(err => console.log("User gesture needed for audio."));
            }
        } else {
            status.innerText = "Searching for Zone...";
            status.className = "";
            player.pause();
            currentTrack = "";
        }
    }, (err) => console.error(err), { enableHighAccuracy: true });
}

// PIP Algorithm
function isInside(lat, lng, vs) {
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i][1], yi = vs[i][0]; // Map [lng, lat] to [lat, lng]
        let xj = vs[j][1], yj = vs[j][0];
        let intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}
