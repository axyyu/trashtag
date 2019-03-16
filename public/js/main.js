$(document).ready(() => {
	initMap();
});

/* Set the width of the side navigation to 250px and the left margin of the page content to 250px and add a black background color to body */
function openNav() {
	document.getElementById('mySidenav').style.width = '830px';
	document.getElementById('main').style.marginLeft = '830px';
	document.body.style.backgroundColor = 'rgba(0,0,0,0.4)';
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
	var map = new mapboxgl.Map({
		container: 'mapcontainer',
		center: [ -73.679246, 42.729734 ],
		style: 'mapbox://styles/mapbox/dark-v10',
		zoom: 16
	});
}
