var database = firebase.database();
var eventsRef = database.ref('admin/events');
var tagsRef = database.ref('user/tags');

// Global Arrays
var tagDataList = [];
var eventsList = [];

var tempLngLat;

$(document).ready(() => {
	hidePopupHandler();
	initMap();
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
	tagsRef.on('child_added', function(data) {
		const tagData = data.val();
		tagDataList.push(tagData);
		reloadTagsOnMap();
	});
}

function getEvents() {
	eventsRef.on('child_added', function(data) {
		const eventData = data.val();
		eventsList.push(eventData);
		reloadTagsOnMap();
	});
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

async function deleteEvent(eventId) {
	const oldRef = await eventsRef.child(eventId).remove();
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
	var map = new mapboxgl.Map({
		container: 'mapcontainer',
		center: [ -73.679246, 42.729734 ],
		style: 'mapbox://styles/mapbox/dark-v10',
		zoom: 16
	});
	map.on('click', onClickMap);
	map.on('contextmenu', onRightClickMap);

	var geojson = {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [ -77.032, 38.913 ]
				}
			},
			{
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [ -122.414, 37.776 ]
				}
			},
			{
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [ -73.679246, 42.729734 ]
				}
			}
		]
	};

	geojson.features.forEach(function(marker) {
		console.log(marker, map);
		// create a HTML element for each feature
		var el = document.createElement('div');
		el.className = 'marker';

		// make a marker for each feature and add to the map
		new mapboxgl.Marker(el)
			.setLngLat(marker.geometry.coordinates)
			.addTo(map);
	});
}
