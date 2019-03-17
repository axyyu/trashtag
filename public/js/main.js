mapboxgl.accessToken =
	'pk.eyJ1IjoiY3JvdHRtIiwiYSI6ImNqdGJ2eDFsdTBxNTY0NG9hajA5YjZkY3YifQ.yDXoV7EwWmqJuEydkMAkbQ';

var clientId = 'IQV4YVX01AZ0UDL0NIWJ044L2LZF3BND0BUUHXCOEY4MVFUM';
var clientSec = 'G0JEHUKM4V1RGBXHQWM1ZVEDC4TJMD23UWM3ULM3AYIU2VQD';

var map;
var geolocate;
var currentLocation = [ -73.679246, 42.729734 ];
var markers = [];

var confirmationState = false;
var database = firebase.database();
var eventsRef = database.ref('admin/events');
var tagsRef = database.ref('user/tags');
var likesRef = database.ref('user/likes');
var attendedRef = database.ref('user/attended');

var tagDict = {};
var tagKeys = [];

var eventsDict = {};
var currentKeys = [];
var futureKeys = [];

var likedKeys = [];
var attendedKeys = [];

var tagExp = 10;
var eventExp = 20;
var userExp = 0;

$(document).ready(() => {
	initMap();
	getTags();
	getEvents();
	getLikes();
	getAttended();
});

function updateDisplay() {
	showProgressBar();
	showMarkers();
	showEvents();
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function openNav() {
	$('#sidecontainer').show();
	$('#sidecontainer').css('width', 'calc(100vw - 64px)');
	showEvents();
}

function closeNav() {
	$('#sidecontainer').css('width', '0px');
	$('#sidecontainer').hide();
}

// Progress Bar
function showProgressBar() {
	$('#progressfront').css('width', `calc(100% - ${userExp}%)`);
}

// Map
function initMap() {
	map = new mapboxgl.Map({
		container: 'mapcontainer',
		center: currentLocation,
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

	geolocate.on('geolocate', ({ coords }) => {
		currentLocation = [ coords.longitude, coords.latitude ];
		updateDisplay();
	});

	map.on('load', () => {
		geolocate.trigger();
	});
}

async function getEstimatedTime(key) {
	var dest = eventsDict[key];
	var coords = `${currentLocation[0]},${currentLocation[1]};${dest
		.location[0]},${dest.location[1]}`;
	var res = await fetch(
		`https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coords}?access_token=${mapboxgl.accessToken}`
	);
	var data = await res.json();

	try {
		return data.durations[0][1] / 60;
	} catch (err) {
		console.error(err);
		return 1000;
	}
}

// Likes & Checked In
function getLikes() {
	likesRef.on('value', function(data) {
		likedKeys = data.val() == null ? [] : Object.keys(data.val());

		updateDisplay();
	});
}
async function likeEvent(key) {
	let itemRef = likesRef.child(key);
	let eRef = eventsRef.child(key).child('interested');
	if (!likedKeys.includes(key)) {
		itemRef.set(true);
		await sleep(100);
		eRef.set(eventsDict[key].interested + 1);
	} else {
		itemRef.remove();
		await sleep(100);
		eRef.set(eventsDict[key].interested - 1);
	}
}

function getAttended() {
	attendedRef.on('value', function(data) {
		attendedKeys = data.val() == null ? [] : Object.keys(data.val());
		updateDisplay();
	});
}
async function attendEvent(key) {
	userExp += eventExp;
	eventsRef.child(key).child('attended').set(eventsDict[key].attended + 1);
	attendedRef.child(key).set(true);

	var venueName = await getDiscount();
	var discount = (Math.random() * 15).toFixed(0);
	swal({
		icon: 'success',
		title: 'Checked In',
		text: `Thanks for attending the ${eventsDict[key]
			.name} clean-up event! Save this screenshot to get ${discount}% off at ${venueName}`
	});
}

async function getDiscount() {
	var res = await fetch(
		`https://api.foursquare.com/v2/venues/explore?client_id=${clientId}&client_secret=${clientSec}&v=20190317&ll=${currentLocation[1]},${currentLocation[0]}&section=topPicks&limit=10`
	);
	var data = await res.json();
	var venues = data.response.groups[0].items;
	var item = venues[Math.floor(Math.random() * venues.length)];
	return item.venue.name;
}

// Events
function showEvents() {
	$('#currentList').empty();
	$('#plannedList').empty();

	showEventsType(currentKeys, 'current');
	showEventsType(futureKeys, 'planned');
}
function showEventsType(keys, status) {
	$('#checkInContainer').css('display', 'none');
	keys.forEach((key) => {
		addEventToList(eventsDict[key], status, key);
	});
}
async function addEventToList(curEvent, status, key) {
	var startdate = moment(`${curEvent.date} ${curEvent.start}`);
	var enddate = moment(`${curEvent.date} ${curEvent.end}`);

	var dateFormat = 'dddd, MMM D h:mm A';
	var estimatedTime = await getEstimatedTime(key);
	var inLiked = likedKeys.includes(key);

	var timeString = '';
	var userString = '';
	var buttonSection = '';
	switch (status) {
		case 'planned':
			timeString = `Begins: ${startdate.format(dateFormat)}`;
			userString = `${curEvent.interested} Interested`;
			buttonSection = `
            <div class='eventOptions'>
            <i class="${inLiked
				? 'fas'
				: 'far'} fa-heart" onclick='likeEvent("${key}"); event.stopPropagation();'></i>
            </div>`;
			break;
		case 'current':
			timeString = `Ends: ${enddate.format(dateFormat)}`;
			userString = `${curEvent.attended} Attending`;
			break;
		default:
			break;
	}

	var html = `<div id=${key} class='eventPanel' onclick='gotoEvent("${key}")'>
    <label class='${status}'>${status.toUpperCase()}</label>
    <h2>${curEvent.name}</h2>
    <h4>${curEvent.address}</h4>
    <p>${timeString}<p>
    <div class='panelRow'>
        <div>
            <p>${userString}</p>
            <p>${estimatedTime.toFixed(1)} Minutes</p>
        </div>
        ${buttonSection}
    </div>
    </div>`;

	if (!$(`#${key}`).length) {
		$(`#${status}List`).append(html);
	}

	if (
		estimatedTime < 1 &&
		status === 'current' &&
		!attendedKeys.includes(key)
	) {
		$('#checkInContainer').css('display', 'flex');
		$('#checkInContainer').off().on('click', () => {
			attendEvent(key);
		});
	}
}
function gotoEvent(key) {
	let loc = [
		eventsDict[key]['location']['0'],
		eventsDict[key]['location']['1']
	];
	map.flyTo({ center: loc });
	closeNav();
}

// Markers
function showMarkers() {
	markers.forEach((m) => {
		m.remove();
	});
	markers = [];
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
		tagKeys = tagDict == null ? [] : Object.keys(tagDict);
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

// User Actions
function report() {
	userExp += tagExp;
	tagsRef.push({
		location: currentLocation
	});
	swal({
		icon: 'success',
		title: 'Trash Tagged',
		text: `+${tagExp} XP`
	});
}
