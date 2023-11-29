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
        (() => {
            const params = {
                lat: latlng.lat,
                lon: latlng.lng,
                zoom: 18,
                format: 'json'
            };
            const url = 'https://nominatim.openstreetmap.org/reverse';
            $.get(addParamsToURL(url, params), function receivedAddress(address) {
                $('#nearest-address').empty().append($('<p></p>').text(address.display_name));
            });
        })();
        (() => {
            const params = {
                lat: latlng.lat,
                lon: latlng.lng,
                product: 'civillight',
                output: 'json'
            };
            const url = 'http://www.7timer.info/bin/api.pl';
            $.get(addParamsToURL(url, params), function receivedWeather(weatherString) {
                const weather = JSON.parse(weatherString);
                const cards = weather.dataseries.map((x) => {
                    return $('<div></div>')
                        .addClass('card').append(
                            $('<div></div')
                                .addClass('card-content').append([
                                    $('<p></p>').text(x.date),
                                    $('<p></p>').text(x.weather),
                                    $('<p></p>').text(`Min: ${cToF(x.temp2m.min)}° F, Max: ${cToF(x.temp2m.max)}° F`),
                                    $('<p></p>').text(`Wind Speed: ${windSpeed(x.wind10m_max)}`)
                                ])
                        );
                });
                $('#weather').empty().append(cards);
            });
        })();
    }
});

function addParamsToURL(url, params) {
    let first = true;
    // let url = url;
    for (const k in params) {
        const v = Array.isArray(params[k]) ? params[k].join(',') : params[k];
        const sep = first ? '?' : '&';
        url += `${sep}${k}=${v}`;
        if (first) first = false;
    }
    return url;
}

function cToF(c) {
    return (c * 9 / 5) + 32;
}

function windSpeed(x) {
    switch(x) {
    case 1:
        return 'calm';
    case 2:
        return 'light';
    case 3:
        return 'moderate';
    case 4:
        return 'fresh';
    case 5:
        return 'strong';
    case 6:
        return 'gale';
    case 7:
        return 'storm';
    case 8:
        return 'hurricane';
    default:
        throw new Error('Invalid Wind Speed', x);
    }
}
