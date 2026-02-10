let geoData = null;

async function startTracking() {
    // 1. Load GeoJSON
    try {
        const response = await fetch('zones.json');
        geoData = await response.json();
    } catch (e) {
        return alert("Could not load zones.json. Make sure you are using a local server.");
    }

    if (!navigator.geolocation) return alert("Geolocation not supported");

    document.getElementById("status-box").innerText = "Locating...";

    navigator.geolocation.watchPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        document.getElementById("coords").innerText = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        
        let activeZone = "Outside All Zones";
        let isInsideAny = false;

        // 2. Loop through Features in GeoJSON
        geoData.features.forEach(feature => {
            if (feature.geometry.type === "Polygon") {
                // GeoJSON uses [lng, lat], our function expects [lat, lng]
                // polygon[0] is the exterior ring
                if (isInside(latitude, longitude, feature.geometry.coordinates[0])) {
                    activeZone = `Inside: ${feature.properties.name}`;
                    isInsideAny = true;
                }
            }
        });

        // 3. Update UI & Map
        const statusBox = document.getElementById("status-box");
        statusBox.innerText = activeZone;
        statusBox.className = isInsideAny ? "inside" : "";

        document.getElementById("map-container").style.display = "block";
        document.getElementById("map-frame").src = `https://maps.google.com{latitude},${longitude}&z=18&output=embed`;

    }, (err) => console.error(err), { enableHighAccuracy: true });
}

// PIP Algorithm adjusted for GeoJSON [lng, lat] format
function isInside(lat, lng, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][1], yi = polygon[i][0]; // [1]=lat, [0]=lng
        const xj = polygon[j][1], yj = polygon[j][0];
        const intersect = ((yi > lng) !== (yj > lng)) && 
                          (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}
