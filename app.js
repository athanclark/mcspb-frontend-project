import $ from 'jquery';
import * as L from 'leaflet';

$(document).ready(function() {
    const map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    try {
        navigator.geolocation.getCurrentPosition(function positionReceived(p) {
            const latlng = L.latLng(p.coords.latitude, p.coords.longitude);
            assignPoint(latlng);
        });
    } catch (e) {
        console.log('Geolocation failed', e);
    }


    map.on('click', function onMapClick(e) {
        assignPoint(e.latlng);
    });

    function assignPoint(latlng) {
        $('#results .card-content').empty().append($('<em></em>').text('Loading...'));
        map.panTo(latlng);
        const popup = L.popup({ autoPan: false });
        popup
            .setLatLng(latlng)
            .setContent(`Position: ${latlng.toString()}`)
            .openOn(map);
        const params = {
            zoom: 18,
            format: 'json'
        };
        let url = `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}`;
        for (const k in params) {
            url += `&${k}=${params[k]}`;
        }
        $.get(url, function receivedAddress(address) {
            $('#nearest-address').empty().append($('<p></p>').text(address.display_name));
        });
    }
});
