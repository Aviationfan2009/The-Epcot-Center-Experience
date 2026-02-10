let zones = [];
let watchID = null;

// 1. Fetch and Parse XML
async function loadZones() {
    try {
        const response = await fetch('zones.xml');
        const text = await response.text();
        const xml = new DOMParser().parseFromString(text, "text/xml");
        
        zones = Array.from(xml.querySelectorAll("zone")).map(z => ({
            name: z.getAttribute("name"),
            points: Array.from(z.querySelectorAll("point")).map(p => ({
                lat: parseFloat(p.getAttribute("lat")),
                lng: parseFloat(p.getAttribute("lng"))
            }))
        }));
    } catch (e) {
        console.error("Error loading XML:", e);
    }
}

// 2. Point-in-Polygon Algorithm
function isInside(lat, lng, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].lng;
        const xj = polygon[j].lat, yj = polygon[j].lng;
        const intersect = ((yi > lng) !== (yj > lng)) && 
                          (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// 3. Initialize Tracking
async function init() {
    await loadZones();
    if (!navigator.geolocation) return alert("GPS not supported");

    document.getElementById("status-box").innerText = "Locating...";

    watchID = navigator.geolocation.watchPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        document.getElementById("coords").innerText = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        
        // Check Zones
        let activeZone = "Outside All Zones";
        let isInsideAny = false;

        zones.forEach(zone => {
            if (isInside(latitude, longitude, zone.points)) {
                activeZone = `Zone: ${zone.name}`;
                isInsideAny = true;
            }
        });

        // Update UI
        const statusBox = document.getElementById("status-box");
        statusBox.innerText = activeZone;
        statusBox.className = isInsideAny ? "inside" : "";

        // Update Map (Zoom 18 = ~0.1 mile)
        document.getElementById("map-container").style.display = "block";
        document.getElementById("map-frame").src = `https://maps.google.com{latitude},${longitude}&z=18&output=embed`;

    }, (err) => console.error(err), { enableHighAccuracy: true });
}
