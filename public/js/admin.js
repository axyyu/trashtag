var database = firebase.database();
var eventsRef = database.ref('admin/events');
var tagsRef = database.ref('user/tags');
mapboxgl.accessToken =
	'pk.eyJ1IjoiY3JvdHRtIiwiYSI6ImNqdGJ2eDFsdTBxNTY0NG9hajA5YjZkY3YifQ.yDXoV7EwWmqJuEydkMAkbQ';

// Mapbox Stuff
//Secret Key sk.eyJ1IjoiY3JvdHRtIiwiYSI6ImNqdGJ3MWRxMDBxN3A0OWw2M3doZG02YmIifQ.R9F__o46cO5chcLmlllbFA
//Public token: pk.eyJ1IjoiY3JvdHRtIiwiYSI6ImNqdGJ2eDFsdTBxNTY0NG9hajA5YjZkY3YifQ.yDXoV7EwWmqJuEydkMAkbQ

// 4 sq
var clientId = 'IQV4YVX01AZ0UDL0NIWJ044L2LZF3BND0BUUHXCOEY4MVFUM';
var clientSec = 'G0JEHUKM4V1RGBXHQWM1ZVEDC4TJMD23UWM3ULM3AYIU2VQD';

// Map
var map;
var markers = [];

// Data
var tagDict = {};
var tagKeys = [];

var eventsDict = {};
var pastKeys = [];
var currentKeys = [];
var futureKeys = [];

// Filters
var currentFilter = true;
var futureFilter = true;
var pastFilter = false;
var tagFilter = true;

// Temp Var
var tempLngLat;

$(document).ready(() => {
	hidePopupHandler();
	initMap();
	getTags();
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

function updateDisplay() {
	showFilters();
	showMarkers();
	showEvents();
}

// Filters

function showFilters() {
	filterClass(tagFilter, 'filter-tag');
	filterClass(pastFilter, 'filter-past');
	filterClass(currentFilter, 'filter-current');
	filterClass(futureFilter, 'filter-future');
}

function filterClass(filter, className) {
	if (filter) {
		if ($(`#filterlist .${className}`).hasClass('off'))
			$(`#filterlist .${className}`).removeClass('off');
	} else {
		if (!$(`#filterlist .${className}`).hasClass('off'))
			$(`#filterlist .${className}`).addClass('off');
	}
}

function toggleFilter(filter) {
	switch (filter) {
		case 'tag':
			tagFilter = !tagFilter;
			break;
		case 'past':
			pastFilter = !pastFilter;
			break;
		case 'current':
			currentFilter = !currentFilter;
			break;
		case 'future':
			futureFilter = !futureFilter;
			break;
		default:
			break;
	}
	updateDisplay();
}

// Map
function initMap() {
	map = new mapboxgl.Map({
		container: 'mapcontainer',
		center: [ -73.679246, 42.729734 ],
		style: 'mapbox://styles/mapbox/dark-v10',
		zoom: 16
	});

	geolocate = new mapboxgl.GeolocateControl({
		positionOptions: {
			enableHighAccuracy: true
		},
		trackUserLocation: true
	});

	map.addControl(new mapboxgl.NavigationControl());
	map.addControl(geolocate);

	map.on('contextmenu', onRightClickMap);
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

function showMarkers() {
	markers.forEach((m) => {
		m.remove();
	});
	markers = [];
	showMarkersType(tagFilter, tagKeys, tagDict, 'tag');
	showMarkersType(pastFilter, pastKeys, eventsDict, 'past');
	showMarkersType(currentFilter, currentKeys, eventsDict, 'current');
	showMarkersType(futureFilter, futureKeys, eventsDict, 'future');
}

function showMarkersType(filter, keys, dict, className) {
	if (filter) {
		keys.forEach((key) => {
			addMarker(dict, key, `marker-${className}`);
		});
	}
}

// Popup
async function addEvent() {
	$('#popup').hide();
	const date = $('#dateTimePicker').val();
	const start = $('#startTime').val();
	const end = $('#endTime').val();

	var res = await fetch(
		`https://api.foursquare.com/v2/venues/search?client_id=${clientId}&client_secret=${clientSec}&v=20190317&ll=${tempLngLat.lat},${tempLngLat.lng}&intent=checkin`
	);
	var data = await res.json();

	var venue = data.response.venues[0];

	console.log(venue);

	eventsRef.push({
		name: venue.name != null ? venue.name : '',
		address: venue.location.address != null ? venue.location.address : '',
		location: [ tempLngLat.lng, tempLngLat.lat ],
		date: date,
		start: start,
		end: end,
		interested: [0],
		attended: 0
	});
}

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

function onRightClickMap({ point, lngLat }) {
	showPopup(point);
	flatpickr('#dateTimePicker', {
		altInput: true,
		altFormat: 'F j, Y',
		dateFormat: 'Y-m-d',
		defaultDate: new Date()
	});

	$('#startTime').val(moment().format('HH:mm'));
	$('#endTime').val(moment().add(2, 'hours').format('HH:mm'));

	tempLngLat = lngLat;
	$('#location').val(`${lngLat.lng.toFixed(4)}, ${lngLat.lat.toFixed(4)}`);
}

// Events
function showEvents() {
	$('#eventsList').empty();
	showEventsType(currentFilter, currentKeys, 'current');
	showEventsType(futureFilter, futureKeys, 'planned');
	showEventsType(pastFilter, pastKeys, 'ended');
}
function showEventsType(filter, keys, status) {
	if (filter) {
		keys.forEach((key) => {
			addEventToList(eventsDict[key], status, key);
		});
	}
}
function addEventToList(curEvent, status, key) {
	var startdate = moment(`${curEvent.date} ${curEvent.start}`);
	var enddate = moment(`${curEvent.date} ${curEvent.end}`);

	var dateFormat = 'dddd, MMM D h:mm A';

	var timeString = '';
	var userString = '';
	switch (status) {
		case 'planned':
			timeString = `Begins: ${startdate.format(dateFormat)}`;
			userString = `${curEvent.interested.length} Interested`;
			break;
		case 'current':
			timeString = `Ends: ${enddate.format(dateFormat)}`;
			userString = `${curEvent.attended} Attending`;
			break;
		case 'ended':
			timeString = `Ended: ${enddate.format(dateFormat)}`;
			userString = `${curEvent.attended} Attended`;
			break;
		default:
			break;
	}

	var html = `<div class='eventPanel' onclick='gotoEvent("${key}")'>
    <label class='${status}'>${status.toUpperCase()}</label>
    <h1>${curEvent.name}</h1>
    <h4>${curEvent.address}</h4>
    <p>${timeString}<p>
    <p>${userString}</p>
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

// Firebase
function getTags() {
	tagsRef.on('value', function(data) {
		tagDict = data.val();
		tagKeys = tagDict == null ? [] : Object.keys(tagDict);
		updateDisplay();
	});
}

function getEvents() {
	eventsRef.on('value', function(data) {
		pastKeys = [];
		currentKeys = [];
		futureKeys = [];

		eventsDict = data.val();

		var currentDate = new Date();

		for (key in eventsDict) {
			const curEvent = eventsDict[key];
			const startDate = new Date(`${curEvent.date} ${curEvent.start}`);
			const endDate = new Date(`${curEvent.date} ${curEvent.end}`);

			if (endDate < currentDate) {
				// past
				pastKeys.push(key);
			} else if (startDate > currentDate) {
				// future
				futureKeys.push(key);
			} else {
				// present
				currentKeys.push(key);
			}
		}

		updateDisplay();
	});
}
