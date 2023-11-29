import $ from 'jquery';
import * as L from 'leaflet';

$(document).ready(function() {
    const map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    Geolocation.getCurrentPosition(function positionReceived(p) {
        const latlng = L.latLng(p.coords.latitude, p.coords.longitude);
        map.panTo(latlng);
    });


    const popup = L.popup();

    function onMapClick(e) {
        popup
            .setLatLng(e.latlng)
            .setContent(`You clicked at ${e.latlng.toString()}`)
            .openOn(map);
    }

    map.on('click', onMapClick);
});
