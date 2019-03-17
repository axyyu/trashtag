var database = firebase.database();
var eventsRef = database.ref('admin/events');
var tagsRef = database.ref('user/tags');

// Global Arrays
var tagDict = [];
var map;

// Events
var eventsDict = {};

var tempLngLat;

var geojson = {
	type: 'FeatureCollection',
	features: []
};

$(document).ready(() => {
	hidePopupHandler();
	getTags();
	initMap();
	getEvents();
});

function hidePopupHandler() {
	$(document).mousedown(function(e) {
		var container = $('#popup');
		if (!container.is(e.target) && container.has(e.target).length === 0) {
			container.hide();
		}
	});
}

// Firebase Stuff

function getTags() {
	tagsRef.on('value', function(data) {
		tagDict = data.val();
		for (key in tagDict) {
			geojson['features'].push({
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [
						tagDict[key]['location']['0'],
						tagDict[key]['location']['1']
					]
				}
			});
			var el = document.createElement('div');
			el.className = 'marker';
			new mapboxgl.Marker(el)
				.setLngLat([
					tagDict[key]['location']['0'],
					tagDict[key]['location']['1']
				])
				.addTo(map);
		}
	});
}

function getEvents() {
	eventsRef.on('value', function(data) {
		eventsDict = data.val();

		var currentDate = new Date();

		for (key in eventsDict) {
			const startDate = new Date(
				`${eventsDict[key].date} ${eventsDict[key].start}`
			);
			const endDate = new Date(
				`${eventsDict[key].date} ${eventsDict[key].end}`
			);
			if (endDate < currentDate) {
				// past
				showEvent(key);
			} else if (startDate > currentDate) {
				// future
				showEvent(key);
			} else {
				// present
				showEvent(key);
			}
		}
	});
}

function showEvent(key) {
	var el = document.createElement('div');
	el.className = 'marker';

	new mapboxgl.Marker(el)
		.setLngLat([
			eventsDict[key]['location']['0'],
			eventsDict[key]['location']['1']
		])
		.addTo(map);
}

function addEvent() {
	$('#popup').hide();
	const date = $('#dateTimePicker').val();
	const start = $('#startTime').val();
	const end = $('#endTime').val();

	eventsRef.push({
		location: [ tempLngLat.lng, tempLngLat.lat ],
		date: date,
		start: start,
		end: end
	});
}

function deleteEvent(eventId) {
	const oldRef = eventsRef.child(eventId).remove();
}
// Mapbox Stuff
//Secret Key sk.eyJ1IjoiY3JvdHRtIiwiYSI6ImNqdGJ3MWRxMDBxN3A0OWw2M3doZG02YmIifQ.R9F__o46cO5chcLmlllbFA
//Public token: pk.eyJ1IjoiY3JvdHRtIiwiYSI6ImNqdGJ2eDFsdTBxNTY0NG9hajA5YjZkY3YifQ.yDXoV7EwWmqJuEydkMAkbQ

// Popup
function showPopup(point) {
	const ref = {
		getBoundingClientRect: () => ({
			top: point.y,
			right: point.x,
			bottom: point.y,
			left: point.x,
			width: 0,
			height: 0
		}),
		clientWidth: 0,
		clientHeight: 0
	};
	const pop = new Popper(ref, $('#popup'));
	$('#popup').show();
}
function onClickMap(data) {}

function onRightClickMap({ point, lngLat }) {
	showPopup(point);
	flatpickr('#dateTimePicker', {
		altInput: true,
		altFormat: 'F j, Y',
		dateFormat: 'Y-m-d',
		defaultDate: new Date()
	});

	tempLngLat = lngLat;
	$('#location').val(`${lngLat.lng.toFixed(4)}, ${lngLat.lat.toFixed(4)}`);
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

	map.addControl(new mapboxgl.NavigationControl());

	map.on('click', onClickMap);
	map.on('contextmenu', onRightClickMap);

	geojson.features.forEach(function(marker) {
		console.log('Adding marker:', marker);
		// create a HTML element for each feature
		var el = document.createElement('div');
		el.className = 'marker';

		// make a marker for each feature and add to the map
		new mapboxgl.Marker(el)
			.setLngLat(marker.geometry.coordinates)
			.addTo(map);
	});
}
