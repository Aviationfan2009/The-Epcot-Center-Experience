let geoData = null;
let player = new Audio();
player.loop = true;
let currentTrack = "";

async function startTracking() {
    try {
        const response = await fetch('zones.json');
        geoData = await response.json();
    } catch (e) {
        return alert("Error loading zones.json");
    }

    navigator.geolocation.watchPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        let insideZone = null;

        geoData.features.forEach(zone => {
            if (isInside(latitude, longitude, zone.geometry.coordinates)) {
                insideZone = zone;
            }
        });

        const status = document.getElementById("status-box");
        const musicInfo = document.getElementById("music-info");

        if (insideZone) {
            const trackUrl = insideZone.properties.music;
            status.innerText = "Inside: " + insideZone.properties.name;
            status.className = "inside";

            if (currentTrack !== trackUrl) {
                currentTrack = trackUrl;
                player.src = trackUrl;
                player.play().catch(err => console.log("Waiting for user gesture..."));
            }
        } else {
            status.innerText = "Outside Zones";
            status.className = "";
            player.pause();
            currentTrack = "";
        }

        // --- NEW: DISPLAY MUSIC STATUS ---
        // decodeURIComponent cleans up the filename for display
        const fileName = currentTrack ? decodeURIComponent(currentTrack.split('/').pop()) : "None";
        const isPlaying = !player.paused; //
        
        musicInfo.innerHTML = `
            <strong>Status:</strong> ${isPlaying ? "▶ Playing" : "⏸ Stopped"}<br>
            <strong>File:</strong> ${fileName}
        `;

    }, (err) => console.error(err), { enableHighAccuracy: true });
}

function isInside(lat, lng, vs) {
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i][0], yi = vs[i][1]; 
        let xj = vs[j][0], yj = vs[j][1];
        let intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}
