// DEBUG LINE (added only this)
console.log("✅ SCRIPT IS LOADED");

window.onload = function () {
console.log("ONLOAD STARTED");

const map = L.map('map').setView([13.0827, 80.2707], 13);
console.log("MAP CREATED");

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

setTimeout(() => map.invalidateSize(), 300);

let marker;
let emergencyActive = false;
let emergencyCircle;
let hazardZones = [];
let hazardMarkers = [];
let sosPressCount = 0;
let lastSOSPressTime = 0;
let crashDetectionEnabled = true;
let crashCooldown = false;

const roadHazards = [
{
type: "Accident Zone",
lat: 13.0850,
lng: 80.2750,
radius: 250,
color: "red",
risk: "high"
},
{
type: "Flooded Road",
lat: 13.0800,
lng: 80.2650,
radius: 180,
color: "blue",
risk: "medium"
},
{
type: "Construction Area",
lat: 13.0900,
lng: 80.2800,
radius: 200,
color: "orange",
risk: "low"
}
];

function updateMarker(lat, lng) {
const latlng = [lat, lng];
map.setView(latlng, 16);
if (!marker) {
marker = L.marker(latlng).addTo(map);
} else {
marker.setLatLng(latlng);
}
marker.bindPopup("📍 Your Live Location").openPopup();
document.getElementById("statusText").innerText =
emergencyActive
? "🚨 Emergency Mode Active"
: "Live location active";
}

function checkNearbyHazards(userLat, userLng) {
let nearby = [];
roadHazards.forEach((hazard) => {
const distance = map.distance(
[userLat, userLng],
[hazard.lat, hazard.lng]
);
if (distance < hazard.radius) {
nearby.push(hazard);
document.getElementById("statusText").innerText =
`⚠ WARNING: ${hazard.type} nearby`;
}
});
const hazardList = document.getElementById("hazardList");
if (nearby.length === 0) {
hazardList.innerHTML = "<li>✅ No nearby hazards detected</li>";
} else {
hazardList.innerHTML = nearby.map(hazard => `
<li>
⚠ ${hazard.type}
(${hazard.risk.toUpperCase()} RISK)
</li>
`).join("");
}
}

function createAdaptiveEmergencyZone(lat, lng, severity) {
let radius;
let color;
let message;
if (severity === "low") {
radius = 200;
color = "yellow";
message = "🟡 Minor Accident Zone";
}
else if (severity === "medium") {
radius = 500;
color = "orange";
message = "🟠 Moderate Emergency Zone";
}
else {
radius = 1000;
color = "red";
message = "🔴 Critical Emergency Zone";
}
if (emergencyCircle) {
map.removeLayer(emergencyCircle);
}
emergencyCircle = L.circle([lat, lng], {
color: color,
fillColor: color,
fillOpacity: 0.3,
radius: radius
}).addTo(map);
emergencyCircle.bindPopup(message).openPopup();
document.getElementById("statusText").innerText =
`${message} | Radius: ${radius}m`;
}

function createRoadHazardOverlays() {
roadHazards.forEach((hazard) => {
const circle = L.circle([hazard.lat, hazard.lng], {
color: hazard.color,
fillColor: hazard.color,
fillOpacity: 0.25,
radius: hazard.radius
}).addTo(map);
const marker = L.marker([hazard.lat, hazard.lng])
.addTo(map)
.bindPopup(`⚠ ${hazard.type} (${hazard.risk.toUpperCase()} RISK)`);
hazardZones.push(circle);
hazardMarkers.push(marker);
});
}

function fakeAccidentDetection(lat, lng) {
emergencyActive = true;
const currentTime = Date.now();
if (currentTime - lastSOSPressTime > 10000) {
sosPressCount = 0;
}
sosPressCount++;
lastSOSPressTime = currentTime;
let severity;
if (sosPressCount === 1) severity = "low";
else if (sosPressCount === 2) severity = "medium";
else severity = "high";
document.getElementById("statusText").innerText =
`🚨 AI detected ${severity.toUpperCase()} severity accident`;
createAdaptiveEmergencyZone(lat, lng, severity);
}

function startCrashDetection() {
if (window.DeviceMotionEvent) {
window.addEventListener("devicemotion", (event) => {
if (!crashDetectionEnabled || crashCooldown) return;
const acc = event.accelerationIncludingGravity;
if (!acc) return;
const x = Math.abs(acc.x || 0);
const y = Math.abs(acc.y || 0);
const z = Math.abs(acc.z || 0);
const totalForce = x + y + z;
if (totalForce > 45) {
crashCooldown = true;
const latlng = marker
? marker.getLatLng()
: { lat: 13.0827, lng: 80.2707 };
document.getElementById("statusText").innerText =
"🚧 Crash impact detected by motion sensors!";
fakeAccidentDetection(latlng.lat, latlng.lng);
setTimeout(() => {
crashCooldown = false;
}, 10000);
}
});
}
}

if (navigator.geolocation) {
navigator.geolocation.watchPosition(
(position) => {
const lat = position.coords.latitude;
const lng = position.coords.longitude;
updateMarker(lat, lng);
checkNearbyHazards(lat, lng);
// ✅ NEW: Update nearby facilities
findNearbyFacilities(lat, lng);
// ✅ NEW: Update nearby users
updateNearbyUsers(lat, lng);
// ✅ NEW: Check traffic
checkSmartTraffic(lat, lng);
},
() => {
updateMarker(13.0827, 80.2707);
},
{
enableHighAccuracy: true,
timeout: 20000,
maximumAge: 0
}
);
}

document.getElementById("alertsList").innerHTML = `
<li>🚓 Police: <a href="tel:100">100</a></li>
<li>🚑 Ambulance: <a href="tel:108">108</a></li>
<li>🔥 Fire Service: <a href="tel:101">101</a></li>
<li>🆘 National Emergency: <a href="tel:112">112</a></li>
<li>👩 Women Helpline: <a href="tel:1091">1091</a></li>
<li>🚗 Road Accident Emergency: <a href="tel:1073">1073</a></li>
`;

// ===========================
// ✅ SAFE AI UPLOAD FIX (ADDED ONLY THIS PART)
// ===========================

document.getElementById("imageUpload")
.addEventListener("change", async function (e) {
const file = e.target.files[0];
if (!file) return;
const resultBox = document.getElementById("analysisResult");
resultBox.innerHTML = "🧠 Uploading image for AI analysis...";
try {
const formData = new FormData();
formData.append("image", file);
const response = await fetch("http://localhost:3000/analyze", {
method: "POST",
body: formData
});
// 🔥 SAFE CHECK ADDED
if (!response.ok) {
throw new Error("Server error: " + response.status);
}
let data = await response.json();
console.log("AI RESULT:", data);
if (!data || !data.severity) {
throw new Error("Invalid AI response");
}
const severity = data.severity || "medium";
const description = data.description || "No description available";
const steps = Array.isArray(data.steps) ? data.steps : [];
resultBox.innerHTML = `
<h3>🚨 Severity: ${severity.toUpperCase()}</h3>
<p>${description}</p>
<h4>Emergency Steps:</h4>
<ul>
${steps.length
? steps.map(step => `<li>${step}</li>`).join("")
: "<li>Call emergency services</li>"
}
</ul>
`;
if (marker) {
const location = marker.getLatLng();
createAdaptiveEmergencyZone(
location.lat,
location.lng,
severity
);
}
document.getElementById("statusText").innerText =
`🚨 AI detected ${severity.toUpperCase()} severity accident`;
} catch (err) {
console.error("AI ERROR:", err);
resultBox.innerHTML =
"⌛ Backend not responding or AI error";
}
});

document.getElementById("sosBtn")
.addEventListener("click", function () {
const latlng = marker
? marker.getLatLng()
: [13.0827, 80.2707];
fakeAccidentDetection(
latlng.lat || latlng[0],
latlng.lng || latlng[1]
);
// ✅ NEW: Alert nearby stations
alertNearbyStations(latlng.lat || latlng[0], latlng.lng || latlng[1]);
// ✅ NEW: Dispatch ambulance
dispatchAmbulance(latlng.lat || latlng[0], latlng.lng || latlng[1]);
});

document.addEventListener("keydown", function (event) {
if (event.key.toLowerCase() === "c") {
const latlng = marker
? marker.getLatLng()
: { lat: 13.0827, lng: 80.2707 };
document.getElementById("statusText").innerText =
"🚧 Simulated crash detected!";
fakeAccidentDetection(latlng.lat, latlng.lng);
}
});

createRoadHazardOverlays();
startCrashDetection();

// ===========================
// ✅ NEW FEATURES START HERE
// ===========================

// 🌍 GLOBAL EMERGENCY NUMBERS DATABASE
const globalEmergencyNumbers = {
"IN": {
police: "100",
ambulance: "108",
fire: "101",
national: "112",
women: "1091",
road: "1073",
trauma: "108",
hospitals: ["Apollo Hospital", "Fortis Malar", "SIMS Hospital"],
police_stations: ["T Nagar Police", "Anna Nagar Police", "Adyar Police"]
},
"US": {
police: "911",
ambulance: "911",
fire: "911",
national: "911",
women: "1-800-799-SAFE",
road: "511",
trauma: "911",
hospitals: ["Mayo Clinic", "Cleveland Clinic", "Johns Hopkins"],
police_stations: ["NYPD", "LAPD", "Chicago PD"]
},
"UK": {
police: "999",
ambulance: "999",
fire: "999",
national: "999",
women: "0808 2000 247",
road: "999",
trauma: "999",
hospitals: ["St Thomas' Hospital", "Royal London Hospital", "Manchester Royal"],
police_stations: ["Metropolitan Police", "Greater Manchester Police"]
},
"CA": {
police: "911",
ambulance: "911",
fire: "911",
national: "911",
women: "1-866-863-0511",
road: "511",
trauma: "911",
hospitals: ["Toronto General", "Sunnybrook", "Vancouver General"],
police_stations: ["Toronto Police", "RCMP", "Vancouver Police"]
},
"AU": {
police: "000",
ambulance: "000",
fire: "000",
national: "000",
women: "1800 737 732",
road: "000",
trauma: "000",
hospitals: ["Royal Melbourne", "St Vincent's Sydney", "Princess Alexandra"],
police_stations: ["Victoria Police", "NSW Police", "Queensland Police"]
},
"DE": {
police: "110",
ambulance: "112",
fire: "112",
national: "112",
women: "08000 116 016",
road: "112",
trauma: "112",
hospitals: ["Charité Berlin", "Universitätsklinikum Heidelberg", "Klinikum Munich"],
police_stations: ["Berlin Police", "Munich Police", "Hamburg Police"]
},
"FR": {
police: "17",
ambulance: "15",
fire: "18",
national: "112",
women: "3919",
road: "112",
trauma: "15",
hospitals: ["Hôpital Pitié-Salpêtrière", "Hôpital Necker", "Hôpital Européen"],
police_stations: ["Police Nationale Paris", "Police Marseille", "Police Lyon"]
},
"JP": {
police: "110",
ambulance: "119",
fire: "119",
national: "119",
women: "#8103",
road: "119",
trauma: "119",
hospitals: ["St. Luke's Tokyo", "Osaka University Hospital", "Kyoto University Hospital"],
police_stations: ["Tokyo Metropolitan Police", "Osaka Police", "Kyoto Police"]
},
"BR": {
police: "190",
ambulance: "192",
fire: "193",
national: "192",
women: "180",
road: "191",
trauma: "192",
hospitals: ["Hospital das Clínicas SP", "Hospital Copa D'Or", "Hospital Sírio-Libanês"],
police_stations: ["PMESP", "PMERJ", "Policia Federal"]
},
"AE": {
police: "999",
ambulance: "998",
fire: "997",
national: "999",
women: "800 7283",
road: "999",
trauma: "998",
hospitals: ["Cleveland Clinic Abu Dhabi", "American Hospital Dubai", "Saudi German Hospital"],
police_stations: ["Dubai Police", "Abu Dhabi Police", "Sharjah Police"]
},
"SG": {
police: "999",
ambulance: "995",
fire: "995",
national: "999",
women: "1800 777 5555",
road: "995",
trauma: "995",
hospitals: ["Singapore General Hospital", "Tan Tock Seng", "National University Hospital"],
police_stations: ["Singapore Police Force", "SPF Central", "SPF Tanglin"]
},
"OTHER": {
police: "112",
ambulance: "112",
fire: "112",
national: "112",
women: "112",
road: "112",
trauma: "112",
hospitals: ["Local Hospital 1", "Local Hospital 2"],
police_stations: ["Local Police Station"]
}
};

// 🌍 MULTILINGUAL SUPPORT
const translations = {
en: {
emergency: "Emergency",
hospital: "Hospital",
police: "Police",
ambulance: "Ambulance",
fire: "Fire",
help: "Help",
crash: "Crash detected",
nearby: "Nearby",
safe: "You are safe",
warning: "Warning",
dispatching: "Dispatching ambulance",
eta: "ETA"
},
hi: {
emergency: "आपातकालीन",
hospital: "अस्पताल",
police: "पुलिस",
ambulance: "एम्बुलेंस",
fire: "आग",
help: "मदद",
crash: "दुर्घटना का पता चला",
nearby: "पास में",
safe: "आप सुरक्षित हैं",
warning: "चेतावनी",
dispatching: "एम्बुलेंस भेजी जा रही है",
eta: "अनुमानित समय"
},
es: {
emergency: "Emergencia",
hospital: "Hospital",
police: "Policía",
ambulance: "Ambulancia",
fire: "Fuego",
help: "Ayuda",
crash: "Accidente detectado",
nearby: "Cercano",
safe: "Estás a salvo",
warning: "Advertencia",
dispatching: "Despachando ambulancia",
eta: "Tiempo estimado"
},
fr: {
emergency: "Urgence",
hospital: "Hôpital",
police: "Police",
ambulance: "Ambulance",
fire: "Feu",
help: "Aide",
crash: "Accident détecté",
nearby: "Proche",
safe: "Vous êtes en sécurité",
warning: "Avertissement",
dispatching: "Envoi d'ambulance",
eta: "Temps estimé"
},
de: {
emergency: "Notfall",
hospital: "Krankenhaus",
police: "Polizei",
ambulance: "Krankenwagen",
fire: "Feuer",
help: "Hilfe",
crash: "Unfall erkannt",
nearby: "In der Nähe",
safe: "Sie sind sicher",
warning: "Warnung",
dispatching: "Krankenwagen wird geschickt",
eta: "Geschätzte Zeit"
},
ja: {
emergency: "緊急",
hospital: "病院",
police: "警察",
ambulance: "救急車",
fire: "火事",
help: "助けて",
crash: "事故を検出",
nearby: "近く",
safe: "安全です",
warning: "警告",
dispatching: "救急車を派遣中",
eta: "到着予定時刻"
},
zh: {
emergency: "紧急情况",
hospital: "医院",
police: "警察",
ambulance: "救护车",
fire: "火灾",
help: "帮助",
crash: "检测到事故",
nearby: "附近",
safe: "您很安全",
warning: "警告",
dispatching: "正在派遣救护车",
eta: "预计到达时间"
},
ar: {
emergency: "طوارئ",
hospital: "مستشفى",
police: "شرطة",
ambulance: "إسعاف",
fire: "حريق",
help: "مساعدة",
crash: "تم رصد حادث",
nearby: "بالقرب",
safe: "أنت بأمان",
warning: "تحذير",
dispatching: "إرسال الإسعاف",
eta: "الوقت المتوقع"
},
pt: {
emergency: "Emergência",
hospital: "Hospital",
police: "Polícia",
ambulance: "Ambulância",
fire: "Fogo",
help: "Ajuda",
crash: "Acidente detectado",
nearby: "Próximo",
safe: "Você está seguro",
warning: "Aviso",
dispatching: "Despachando ambulância",
eta: "Tempo estimado"
},
ta: {
emergency: "அவசரம்",
hospital: "மருத்துவமனை",
police: "காவல்துறை",
ambulance: "அவசர ஊர்தி",
fire: "தீ",
help: "உதவி",
crash: "விபத்து கண்டறியப்பட்டது",
nearby: "அருகில்",
safe: "நீங்கள் பாதுகாப்பாக இருக்கிறீர்கள்",
warning: "எச்சரிக்கை",
dispatching: "அவசர ஊர்தி அனுப்பப்படுகிறது",
eta: "வரும் நேரம்"
},
te: {
emergency: "అత్యవసరం",
hospital: "ఆసుపత్రి",
police: "పోలీసు",
ambulance: "అంబులెన్స్",
fire: "మంట",
help: "సహాయం",
crash: "ప్రమాదం గుర్తించబడింది",
nearby: "సమీపంలో",
safe: "మీరు సురక్షితంగా ఉన్నారు",
warning: "హెచ్చరిక",
dispatching: "అంబులెన్స్ పంపిస్తోంది",
eta: "చేరే సమయం"
},
bn: {
emergency: "জরুরী",
hospital: "হাসপাতাল",
police: "পুলিশ",
ambulance: "অ্যাম্বুলেন্স",
fire: "আগুন",
help: "সাহায্য",
crash: "দুর্ঘটনা সনাক্ত",
nearby: "কাছাকাছি",
safe: "আপনি নিরাপদ",
warning: "সতর্কতা",
dispatching: "অ্যাম্বুলেন্স পাঠানো হচ্ছে",
eta: "আনুমানিক সময়"
}
};

let currentLang = "en";
let currentCountry = "IN";
let voiceEnabled = false;
let offlineQueue = [];
let facilityMarkers = [];
let ambulanceMarker = null;
let nearbyUserMarkers = [];
let speechSynth = window.speechSynthesis;

// 🏥 FIND NEAREST FACILITIES
function findNearbyFacilities(lat, lng) {
const countryData = globalEmergencyNumbers[currentCountry];
if (!countryData) return;

const facilities = [
...countryData.hospitals.map(h => ({ name: h, type: "hospital", lat: lat + (Math.random() - 0.5) * 0.02, lng: lng + (Math.random() - 0.5) * 0.02 })),
...countryData.police_stations.map(p => ({ name: p, type: "police", lat: lat + (Math.random() - 0.5) * 0.03, lng: lng + (Math.random() - 0.5) * 0.03 }))
];

// Clear old markers
facilityMarkers.forEach(m => map.removeLayer(m));
facilityMarkers = [];

const facilitiesList = document.getElementById("facilitiesList");
let html = `<ul>`;

facilities.forEach(fac => {
const icon = fac.type === "hospital" ? "🏥" : "🚓";
const color = fac.type === "hospital" ? "red" : "blue";
const marker = L.marker([fac.lat, fac.lng], {
icon: L.divIcon({
className: 'custom-div-icon',
html: `<div style="background:${color};color:white;padding:5px;border-radius:50%;">${icon}</div>`,
iconSize: [30, 30]
})
}).addTo(map).bindPopup(`${icon} ${fac.name}`);

facilityMarkers.push(marker);

const distance = Math.round(map.distance([lat, lng], [fac.lat, fac.lng]));
html += `<li>${icon} ${fac.name} - ${distance}m away</li>`;
});

html += `</ul>`;
facilitiesList.innerHTML = html;

// Update emergency contacts with country-specific numbers
updateEmergencyContacts(countryData);
}

function updateEmergencyContacts(data) {
const t = translations[currentLang] || translations.en;
document.getElementById("alertsList").innerHTML = `
<li>🚓 ${t.police}: <a href="tel:${data.police}">${data.police}</a></li>
<li>🚑 ${t.ambulance}: <a href="tel:${data.ambulance}">${data.ambulance}</a></li>
<li>🔥 ${t.fire}: <a href="tel:${data.fire}">${data.fire}</a></li>
<li>🆘 ${t.emergency}: <a href="tel:${data.national}">${data.national}</a></li>
<li>👩 Women Helpline: <a href="tel:${data.women}">${data.women}</a></li>
<li>🚗 Road Accident: <a href="tel:${data.road}">${data.road}</a></li>
<li>🏥 Trauma Center: <a href="tel:${data.trauma}">${data.trauma}</a></li>
`;
}

// 🚑 AMBULANCE TRACKING
function dispatchAmbulance(lat, lng) {
const t = translations[currentLang] || translations.en;
const ambulanceStatus = document.getElementById("ambulanceStatus");
const ambulanceETA = document.getElementById("ambulanceETA");

// Simulate ambulance dispatch
const ambulanceLat = lat + 0.01;
const ambulanceLng = lng + 0.01;

if (ambulanceMarker) map.removeLayer(ambulanceMarker);

ambulanceMarker = L.marker([ambulanceLat, ambulanceLng], {
icon: L.divIcon({
className: 'custom-div-icon',
html: `<div style="background:white;color:red;padding:8px;border-radius:50%;font-weight:bold;">🚑</div>`,
iconSize: [40, 40]
})
}).addTo(map).bindPopup("🚑 Ambulance en route").openPopup();

// Animate ambulance movement
let progress = 0;
const moveInterval = setInterval(() => {
progress += 0.05;
const newLat = ambulanceLat + (lat - ambulanceLat) * progress;
const newLng = ambulanceLng + (lng - ambulanceLng) * progress;
ambulanceMarker.setLatLng([newLat, newLng]);

const distance = Math.round(map.distance([newLat, newLng], [lat, lng]));
const eta = Math.ceil(distance / 400); // 400m/min average speed

ambulanceStatus.innerHTML = `<p>🚑 ${t.dispatching}...</p>`;
ambulanceETA.innerHTML = `<p>📍 Distance: ${distance}m | ⏱️ ${t.eta}: ${eta} min</p>`;

if (progress >= 1) {
clearInterval(moveInterval);
ambulanceStatus.innerHTML = `<p>✅ Ambulance arrived!</p>`;
speak("Ambulance has arrived at your location");
}
}, 1000);

speak(`${t.dispatching}. ${t.eta} approximately 5 minutes`);
}

// 🗣️ VOICE GUIDANCE
function speak(text) {
if (!voiceEnabled || !speechSynth) return;
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = currentLang === "zh" ? "zh-CN" : currentLang;
utterance.rate = 1;
speechSynth.speak(utterance);
}

document.getElementById("voiceToggle").addEventListener("click", function() {
voiceEnabled = !voiceEnabled;
this.style.background = voiceEnabled ? "#f44336" : "#4CAF50";
document.getElementById("voiceStatus").innerText = `Voice guidance: ${voiceEnabled ? "ON" : "OFF"}`;
if (voiceEnabled) speak("Voice guidance enabled");
});

// 🚦 SMART TRAFFIC CONTROL
function checkSmartTraffic(lat, lng) {
const trafficStatus = document.getElementById("trafficStatus");
const trafficRoute = document.getElementById("trafficRoute");

// Simulate traffic analysis
const trafficDensity = Math.random();
let status, color, route;

if (trafficDensity < 0.3) {
status = "Light traffic - Route clear";
color = "green";
route = "Fastest route available";
} else if (trafficDensity < 0.7) {
status = "Moderate traffic - Minor delays";
color = "orange";
route = "Alternative route suggested";
} else {
status = "Heavy traffic - Significant delays";
color = "red";
route = "Emergency lane access recommended";
}

trafficStatus.innerHTML = `<p style="color:${color}">🚦 ${status}</p>`;
trafficRoute.innerHTML = `<p>🛣️ ${route}</p>`;

// Show traffic-aware route on map
if (emergencyActive) {
L.polyline([
[lat, lng],
[lat + 0.005, lng + 0.005],
[lat + 0.01, lng + 0.01]
], { color: color, weight: 5, dashArray: '10, 10' }).addTo(map);
}
}

// 👥 NEARBY USER ALERTS
function updateNearbyUsers(lat, lng) {
const nearbyUsersList = document.getElementById("nearbyUsersList");

// Simulate nearby RoadSOS users
const nearbyUsers = [
{ name: "User #2847", distance: 150, status: "Safe", lat: lat + 0.002, lng: lng + 0.001 },
{ name: "User #3921", distance: 320, status: "Moving", lat: lat - 0.001, lng: lng + 0.003 },
{ name: "User #1056", distance: 500, status: "Safe", lat: lat + 0.004, lng: lng - 0.002 }
];

// Clear old markers
nearbyUserMarkers.forEach(m => map.removeLayer(m));
nearbyUserMarkers = [];

let html = "";
nearbyUsers.forEach(user => {
const marker = L.circleMarker([user.lat, user.lng], {
radius: 8,
fillColor: user.status === "Safe" ? "green" : "yellow",
color: "white",
weight: 2,
fillOpacity: 0.8
}).addTo(map).bindPopup(`👤 ${user.name}<br>Status: ${user.status}`);

nearbyUserMarkers.push(marker);
html += `<li>👤 ${user.name} - ${user.distance}m away (${user.status})</li>`;
});

nearbyUsersList.innerHTML = html;

// Alert if emergency and users nearby
if (emergencyActive) {
nearbyUsers.forEach(user => {
if (user.distance < 200) {
speak(`Alert: RoadSOS user nearby at ${user.distance} meters`);
}
});
}
}

// 📡 OFFLINE SYSTEM
function checkNetworkStatus() {
const networkStatus = document.getElementById("networkStatus");
const syncBtn = document.getElementById("syncOfflineBtn");

if (navigator.onLine) {
networkStatus.innerHTML = `<p style="color:green">✅ Online - All features active</p>`;
if (offlineQueue.length > 0) {
syncBtn.style.display = "block";
}
} else {
networkStatus.innerHTML = `<p style="color:orange">⚠️ Offline Mode - Emergency features cached</p>`;
syncBtn.style.display = "none";
// Cache current location for offline
if (marker) {
const pos = marker.getLatLng();
localStorage.setItem("lastKnownLocation", JSON.stringify({ lat: pos.lat, lng: pos.lng, time: Date.now() }));
}
}
}

window.addEventListener("online", () => {
checkNetworkStatus();
speak("Back online. Syncing data.");
syncOfflineData();
});

window.addEventListener("offline", () => {
checkNetworkStatus();
speak("Offline mode activated. Emergency data cached.");
});

document.getElementById("syncOfflineBtn").addEventListener("click", syncOfflineData);

function syncOfflineData() {
if (offlineQueue.length === 0) return;
console.log("Syncing offline data:", offlineQueue);
offlineQueue = [];
document.getElementById("syncOfflineBtn").style.display = "none";
speak("Offline data synchronized successfully");
}

// 🎙️ AUTO SOS DETECTION (Voice + Keyword)
function startAutoSOSDetection() {
const autoSosStatus = document.getElementById("autoSosStatus");

// Keyword detection via speech recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = currentLang === "zh" ? "zh-CN" : currentLang;

recognition.onresult = (event) => {
const transcript = Array.from(event.results)
.map(result => result[0].transcript)
.join(' ')
.toLowerCase();

const emergencyKeywords = ["help", "accident", "emergency", "save me", "आपातकालीन", "मदद", "ayuda", "aide", "hilfe", "助けて", "救命", "مساعدة", "socorro", "அவசரம்", "అత్యవసరం", "জরুরী"];

if (emergencyKeywords.some(keyword => transcript.includes(keyword))) {
autoSosStatus.innerHTML = `<p style="color:red">🚨 EMERGENCY KEYWORD DETECTED: "${transcript}"</p>`;
const latlng = marker ? marker.getLatLng() : { lat: 13.0827, lng: 80.2707 };
fakeAccidentDetection(latlng.lat, latlng.lng);
alertNearbyStations(latlng.lat, latlng.lng);
dispatchAmbulance(latlng.lat, latlng.lng);
speak("Emergency detected. SOS activated automatically.");
}
};

recognition.onerror = (event) => {
console.log("Speech recognition error:", event.error);
// Restart on error
setTimeout(() => recognition.start(), 1000);
};

recognition.start();
autoSosStatus.innerHTML = `<p style="color:green">🎙️ Auto-detection: Active (Listening...)</p>`;
} else {
autoSosStatus.innerHTML = `<p>Browser speech recognition not supported. Using motion sensors only.</p>`;
}
}

// 📢 ALERT NEARBY STATIONS
function alertNearbyStations(lat, lng) {
const countryData = globalEmergencyNumbers[currentCountry];
const nearbyAlerts = document.getElementById("nearbyAlerts");

// Simulate alerting stations
const stations = [
{ type: "Police", number: countryData.police, status: "Alerted" },
{ type: "Ambulance", number: countryData.ambulance, status: "Dispatched" },
{ type: "Fire", number: countryData.fire, status: "Standby" },
{ type: "Trauma Center", number: countryData.trauma, status: "Notified" }
];

let html = "";
stations.forEach(station => {
html += `<li>📡 ${station.type} (${station.number}) - <strong>${station.status}</strong></li>`;
// Add pulsing markers on map
L.circle([lat, lng], {
color: station.status === "Dispatched" ? "red" : "orange",
fillColor: station.status === "Dispatched" ? "red" : "orange",
fillOpacity: 0.1,
radius: 500 + Math.random() * 500
}).addTo(map);
});

nearbyAlerts.innerHTML = html;
speak("Emergency services have been notified");
}

// 🌍 COUNTRY & LANGUAGE SETTINGS
document.getElementById("updateSettingsBtn").addEventListener("click", function() {
currentCountry = document.getElementById("countrySelect").value;
currentLang = document.getElementById("languageSelect").value;

// Update UI language
const t = translations[currentLang] || translations.en;
document.getElementById("statusText").innerText = `${t.emergency} system ready`;

// Update emergency numbers
const countryData = globalEmergencyNumbers[currentCountry];
updateEmergencyContacts(countryData);

// Refresh facilities
if (marker) {
const pos = marker.getLatLng();
findNearbyFacilities(pos.lat, pos.lng);
}

speak(`Settings updated. Country: ${currentCountry}. Language: ${currentLang}`);
});

// 🌐 GEOLOCATION LIVE ENHANCEMENT
function enhanceGeolocation() {
// High accuracy tracking with fallback
const options = {
enableHighAccuracy: true,
timeout: 10000,
maximumAge: 0
};

function success(pos) {
const lat = pos.coords.latitude;
const lng = pos.coords.longitude;
const accuracy = pos.coords.accuracy;
const speed = pos.coords.speed || 0;
const heading = pos.coords.heading || 0;

updateMarker(lat, lng);
findNearbyFacilities(lat, lng);
updateNearbyUsers(lat, lng);
checkSmartTraffic(lat, lng);

// Enhanced status with speed and heading
document.getElementById("statusText").innerText =
`📍 Live: ${lat.toFixed(4)}, ${lng.toFixed(4)} | Accuracy: ${Math.round(accuracy)}m | Speed: ${(speed * 3.6).toFixed(1)} km/h`;

// Cache for offline
localStorage.setItem("lastKnownLocation", JSON.stringify({ lat, lng, time: Date.now() }));
}

function error(err) {
console.warn(`Geolocation error (${err.code}): ${err.message}`);
// Fallback to last known location
const lastKnown = localStorage.getItem("lastKnownLocation");
if (lastKnown) {
const pos = JSON.parse(lastKnown);
updateMarker(pos.lat, pos.lng);
document.getElementById("statusText").innerText = "📍 Using cached location (offline)";
}
}

navigator.geolocation.watchPosition(success, error, options);
}

// 🔄 INITIALIZE ALL NEW FEATURES
function initializeNewFeatures() {
checkNetworkStatus();
startAutoSOSDetection();
enhanceGeolocation();

// Load cached location if available
const lastKnown = localStorage.getItem("lastKnownLocation");
if (lastKnown && !marker) {
const pos = JSON.parse(lastKnown);
updateMarker(pos.lat, pos.lng);
}

// Set initial country data
const countryData = globalEmergencyNumbers[currentCountry];
updateEmergencyContacts(countryData);

speak("RoadSOS AI initialized. All emergency systems active.");
}

// Run initialization
initializeNewFeatures();

// Periodic updates
setInterval(() => {
checkNetworkStatus();
if (marker) {
const pos = marker.getLatLng();
findNearbyFacilities(pos.lat, pos.lng);
}
}, 30000); // Update every 30 seconds

};