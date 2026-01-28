let trueLat, trueLng;
let guessMarker;

const aerialMap = L.map("aerial", {
  zoomControl: false,
  attributionControl: false,
});

const guessMap = L.map("guess").setView([0, 0], 2);

// 航空写真（ESRI）
L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/" +
    "World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 18,
  }
).addTo(aerialMap);

// 推測用地図（OSM）
L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 18,
  }
).addTo(guessMap);

function randomLocation() {
  trueLat = Math.random() * 120 - 60;
  trueLng = Math.random() * 360 - 180;

  aerialMap.setView([trueLat, trueLng], 12);
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

guessMap.on("click", (e) => {
  if (guessMarker) guessMap.removeLayer(guessMarker);

  guessMarker = L.marker(e.latlng).addTo(guessMap);

  const d = distanceKm(
    trueLat,
    trueLng,
    e.latlng.lat,
    e.latlng.lng
  );

  document.getElementById("result").textContent =
    `距離: ${d.toFixed(1)} km`;
});

document.getElementById("next").onclick = () => {
  document.getElementById("result").textContent = "";
  if (guessMarker) {
    guessMap.removeLayer(guessMarker);
    guessMarker = null;
  }
  randomLocation();
};

randomLocation();
