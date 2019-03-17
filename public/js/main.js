var map;
var geolocate;
var currentLocation;
var markers = [];

var confirmationState = false;
var database = firebase.database();
var eventsRef = database.ref('admin/events');
var tagsRef = database.ref('user/tags');

var tagDict = {};
var tagKeys = [];

var eventsDict = {};
var currentKeys = [];
var futureKeys = [];

$(document).ready(() => {
	initMap();
	getTags();
	getEvents();
});

function updateDisplay() {
	showMarkers();
	showEvents();
}

// Events
function showEvents() {
	$('#eventsList').empty();
	showEventsType(currentKeys, 'current');
	showEventsType(futureKeys, 'planned');
}
function showEventsType(keys, status) {
	keys.forEach((key) => {
		addEventToList(eventsDict[key], status, key);
	});
}
function addEventToList(curEvent, status, key) {
	var html = `<div class='eventPanel' onclick='gotoEvent("${key}")'>
    <label class='${status}'>${status.toUpperCase()}</label>
    <h1>${curEvent.date}</h1>
    <h4>${curEvent.start} - ${curEvent.end}<h4>
    </div>`;
	$('#eventsList').append(html);
}

function gotoEvent(key) {
	let loc = [
		eventsDict[key]['location']['0'],
		eventsDict[key]['location']['1']
	];
	map.flyTo({ center: loc });
}

// Markers

function showMarkers() {
	markers.forEach((m) => {
		m.remove();
	});
	markers = [];
	showMarkersType(tagKeys, tagDict, 'tag');
	showMarkersType(currentKeys, eventsDict, 'current');
	showMarkersType(futureKeys, eventsDict, 'future');
}

function showMarkersType(keys, dict, className) {
	keys.forEach((key) => {
		addMarker(dict, key, `marker-${className}`);
	});
}

function getTags() {
	tagsRef.on('value', function(data) {
		tagDict = data.val();
		tagKeys = Object.keys(tagDict);
		updateDisplay();
	});
}

function getEvents() {
	eventsRef.on('value', function(data) {
		currentKeys = [];
		futureKeys = [];

		eventsDict = data.val();

		var currentDate = new Date();

		for (key in eventsDict) {
			const curEvent = eventsDict[key];
			const startDate = new Date(`${curEvent.date} ${curEvent.start}`);
			const endDate = new Date(`${curEvent.date} ${curEvent.end}`);

			if (startDate > currentDate) {
				// future
				futureKeys.push(key);
			} else if (currentDate > startDate && currentDate < endDate) {
				// present
				currentKeys.push(key);
			}
		}

		updateDisplay();
	});
}

function addMarker(valDict, key, className) {
	var el = document.createElement('div');
	el.className = `marker ${className}`;
	el.innerHTML = '';

	let loc = [ valDict[key]['location']['0'], valDict[key]['location']['1'] ];

	let m = new mapboxgl.Marker(el).setLngLat(loc).addTo(map);

	$(el).off().on('click', () => {
		map.flyTo({ center: loc });
	});
	markers.push(m);
}

// When the user clicks on div, open the popup
function popup() {
	var popup = document.getElementById('myPopup');
	popup.classList.toggle('show');
}

/* Set the width of the side navigation to 250px and the left margin of the page content to 250px and add a black background color to body */
function openNav() {
	document.getElementById('mySidenav').style.width = '325px';
	document.getElementById('main').style.marginLeft = '325px';
	document.body.style.backgroundColor = 'rgba(0,0,0,0.3)';
}

/* Set the width of the side navigation to 0 and the left margin of the page content to 0, and the background color of body to white */
function closeNav() {
	document.getElementById('mySidenav').style.width = '0';
	document.getElementById('main').style.marginLeft = '0';
	document.body.style.backgroundColor = 'white';
}

mapboxgl.accessToken =
	'pk.eyJ1IjoiY3JvdHRtIiwiYSI6ImNqdGJ2eDFsdTBxNTY0NG9hajA5YjZkY3YifQ.yDXoV7EwWmqJuEydkMAkbQ';
function initMap() {
	map = new mapboxgl.Map({
		container: 'mapcontainer',
		center: [ -73.679246, 42.729734 ],
		style: 'mapbox://styles/mapbox/dark-v10',
		zoom: 16
	});

	// map.addControl(new mapboxgl.NavigationControl());

	geolocate = new mapboxgl.GeolocateControl({
		positionOptions: {
			enableHighAccuracy: true
		},
		trackUserLocation: true
	});

	map.addControl(new mapboxgl.NavigationControl());
	map.addControl(geolocate);

	geolocate.on('geolocate', ({ coords }) => {
		currentLocation = [ coords.longitude, coords.latitude ];
	});

	map.on('load', () => {
		// geolocate.trigger();
	});
}

function report() {
	console.log(currentLocation);
	tagsRef.push({
		location: currentLocation
	});
}

$('#toggle').click(function() {
	$('#dates').toggle();
});
