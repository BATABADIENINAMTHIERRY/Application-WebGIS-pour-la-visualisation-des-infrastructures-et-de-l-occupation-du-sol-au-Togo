let map = L.map('map', {
    zoomControl: true,
    fullscreenControl: true,
    fullscreenControlOptions: {
        position: 'topright'
    }
}).setView([8.32, 1], 7);

let openstreetmap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
let Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

baseLayers = {
    "openstreetmap": openstreetmap,
    "Esri_WorldImagery": Esri_WorldImagery
};

let Limite, school, hospital, road;


function getColor(Reg) {
    return Reg == "Savanes" ? '#9467BD' :
        Reg == "Kara" ? '#D62728' :
            Reg == "Centrale" ? '#FF7F0E' :
                Reg == "Plateaux" ? '#2CA02C' :
                    Reg == "Maritime" ? '#1F77B4' :
                        '#FFEDA0';
}

function style(feature) {
    return {
        fillColor: getColor(feature.properties.Region),
        weight: 2,
        opacity: 2,
        color: 'gray',
        dashArray: '',
        fillOpacity: 0.5
    };
}

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 3,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.3,
    });

    layer.bringToFront();
    info.update(layer.feature.properties);
}

function resetHighlight(e) {
    Limite.resetStyle(e.target);
    info.update();
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
    this._div.innerHTML = '<h4> TOGO </h4>' + '<b>' + "Region: " + '</b>' + (props ?
        '<b>' + props.Region + '</b><br />' + '<b>' + "Préfecture: " + '</b>' + '<b>' + props.Prefecture + '</b><br />' + '<b>' + "Localité: " + '</b>' + '<b>' + props.Chef_Lieu + '</b>'
        : 'Survolez une localité'
    );
};

info.addTo(map);

fetch("togo_admin2.geojson")
    .then(response => response.json())
    .then(data => {
        Limite = L.geoJSON(data, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);
        checkLayersLoaded();
    });

const LandLayer = L.tileLayer.wms("http://localhost:8080/geoserver/wms", {
    layers: "examen:landcover",
    format: 'image/png',
    uppercase: true,
    transparent: true,
    continuousWorld: true,
    tiled: true,
    info_format: 'text/html',
    opacity: 0.7,
    identify: false,
    version: "1.1.0",
    attribution: "GeoServer"
});


//Geoserver Web Feature Service
let url = "http://localhost:8080/geoserver/examen/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=examen:roads_tgo&outputFormat=application/json"
fetch(url)
    .then(res => res.json())
    .then(data => {
        road = L.geoJSON(data, {
            style: {
                color: "red",
                weight: 2
            },
            onEachFeature: (feature, layer) => {
                layer.bindPopup(`
                    <b>Type:</b> ${feature.properties.TYPE_ROUTE}
                `);
            }
        });
        checkLayersLoaded();
    });



var ecoleIcon = L.icon({
    iconUrl: 'school-outline-svgrepo-com.svg',
    iconSize: [15, 15],
    iconAnchor: [8, 15],
    popupAnchor: [0, -20]
});


fetch("school.geojson")
    .then(response => response.json())
    .then(data => {
        school = L.geoJSON(data, {
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, { icon: ecoleIcon }).bindPopup(feature.properties.name);
            }
        });
        checkLayersLoaded();
    });

var hopitalIcon = L.icon({
    iconUrl: 'hospital-first-aid-svgrepo-com.svg',
    iconSize: [15, 15],
    iconAnchor: [8, 15],
    popupAnchor: [0, -20]
});


fetch("hospital.geojson")
    .then(response => response.json())
    .then(data => {
        hospital = L.geoJSON(data, {
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, { icon: hopitalIcon }).bindPopup(feature.properties.name);
            }
        });
        checkLayersLoaded();
    });

function checkLayersLoaded() {
    if (Limite && school && hospital && road) {

        L.control.layers(baseLayers, {
            "Landcover": LandLayer,
            "Routes": road,
            "Écoles": school,
            "Hôpitaux": hospital,
            "Limite administrative": Limite,
        }).addTo(map);

        console.log("Tous les fichiers GeoJSON ont été chargés !");
    }
}

L.control.scale({
    metric: true,
    imperial: false,
    maxWidth: 200
}).addTo(map);

L.control.locate({
    position: 'topleft'
}).addTo(map);
new L.Control.Geocoder({
    position: 'topright'
}).addTo(map);
L.control.mousePosition({
    position: 'bottomleft'
}).addTo(map);

// OUVERTURE / FERMETURE DU SIDEBAR 
document.getElementById("toggleSidebar").onclick = function () {
    document.getElementById("sidebar").classList.toggle("open");
};

// EXEMPLE DE COULEURS POUR LES RÉGIONS
var regionColors = {
    "Maritime": "#1f78b4",
    "Plateaux": "#33a02c",
    "Centrale": "#ff7f00",
    "Kara": "#e31a1c",
    "Savanes": "#6a3d9a"
};

// URL des légendes WMS
var legendLandcover = "http://localhost:8080/geoserver/examen/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&LAYER=examen:landcover";

// Fonction pour replier / ouvrir une section
function toggleLegendSection(id) {
    const section = document.getElementById(id);
    section.style.display = (section.style.display === "none") ? "block" : "none";
}

// Générer la légende dans le sidebar
function updateLegend() {
    var legendDiv = document.getElementById("legend");
    legendDiv.innerHTML = ""; // reset

    // ---------------- REGIONS ----------------
    legendDiv.innerHTML += `
        <div class="legend-section-title" onclick="toggleLegendSection('regionsLegend')">
            Régions ▼
        </div>
        <div id="regionsLegend" class="legend-content">
        </div>
    `;
    var regionsLegend = document.getElementById("regionsLegend");
    for (let region in regionColors) {
        regionsLegend.innerHTML += `
            <div class="legend-item">
                <i class="legend-color" style="background:${regionColors[region]}"></i>
                <span>${region}</span>
            </div>
        `;
    }



    // ---------------- LANDCOVER ----------------
    legendDiv.innerHTML += `
        <div class="legend-section-title" onclick="toggleLegendSection('landcoverLegend')">
            Occupation du sol 
        </div>
        <div id="landcoverLegend" class="legend-content">
            <img src="${legendLandcover}" alt="Légende landcover" style="width:30%;">
        </div>
    `;

    // ---------------- ROUTES ----------------
    legendDiv.innerHTML += `
        <div class="legend-section-title" onclick="toggleLegendSection('routesLegend')">
            Routes 
        </div>
        <div id="routesLegend" class="legend-content"></div>
    `;
    // Légende simple pour un seul type de route
    function generateSingleRouteLegend() {
        const legendDiv = document.getElementById("routesLegend");
        if (!legendDiv) return;
        legendDiv.innerHTML = `
        <div class="legend-item">
            <i class="legend-color" style="background:red;width:20px;height:5px;display:inline-block;margin-right:5px;"></i>
            <span>Route</span>
        </div>
    `;
    }
    // Appel de la fonction après le chargement du WFS
    generateSingleRouteLegend();


    // ---------------- ÉCOLES ----------------
    legendDiv.innerHTML += `
        <div class="legend-section-title" onclick="toggleLegendSection('schoolLegend')">
            Écoles
        </div>
        <div id="schoolLegend" class="legend-content">
            <div class="legend-item">
                <img class="legend-icon" src="school-outline-svgrepo-com.svg" />
                <span>École</span>
            </div>
        </div>
    `;

    // ---------------- HÔPITAUX ----------------
    legendDiv.innerHTML += `
        <div class="legend-section-title" onclick="toggleLegendSection('hospitalLegend')">
            Hôpitaux
        </div>
        <div id="hospitalLegend" class="legend-content">
            <div class="legend-item">
                <img class="legend-icon" src="hospital-first-aid-svgrepo-com.svg" />
                <span>Hôpital</span>
            </div>
        </div>
    `;
}

// Lancer la génération
updateLegend();
