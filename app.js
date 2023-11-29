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


    $('#submit').on('click', function clickedSubmit() {
        const term = $('#search').val();
        const url = `https://nominatim.openstreetmap.org/search.php?q=${encodeURI(term)}&format=jsonv2`;
        $.get(url, function gotSearchResults(results) {
            $('#search-results .box').empty().append(results.map((x) =>
                $('<div></div>').addClass('card').append(
                    $('<div></div>').addClass('card-content').text(x.display_name)
                ).on('click', function clickedSearchResult() {
                    $('html').removeClass('is-clipped');
                    $('#search-results').removeClass('is-active');
                    $('#search-results .box').empty();
                    assignPoint(L.latLng(x.lat, x.lon));
                })
            ));
            $('#search-results').addClass('is-active');
            $('html').addClass('is-clipped');
            console.log(results);
        });
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
                const addr = address.display_name || 'No Address Found';
                $('#nearest-address').empty().append($('<p></p>').text(addr));
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
                                    $('<p></p>').text(`Min: ${cToF(x.temp2m.min).toFixed(1)}° F, Max: ${cToF(x.temp2m.max).toFixed(1)}° F`),
                                    $('<p></p>').text(`Wind Speed: ${windSpeed(x.wind10m_max)}`)
                                ])
                        );
                });
                $('#weather').empty().append(cards);
            });
        })();
        (() => {
            const params = {
                lat: latlng.lat,
                lon: latlng.lng
            };
            const url = 'https://api.sunrise-sunset.org/json';
            $.get(addParamsToURL(url, params), function receivedSolarData(solarData) {
                console.log(solarData);
                $('#solar-data').empty().append([
                    $('<p></p>')
                        .addClass('block')
                        .text(`Sunrise: ${solarData.results.sunrise}, Sunset: ${solarData.results.sunset}`),
                    $('<p></p>')
                        .addClass('block')
                        .text(`Solar Noon: ${solarData.results.solar_noon}, Day Length: ${solarData.results.day_length}`),
                    $('<table></table>').addClass('table').append([
                        $('<thead></thead>').append($('<tr></tr>').append([
                            $('<th></th>').text('Type of Twilight'),
                            $('<th></th>').text('Begin'),
                            $('<th></th>').text('End')
                        ])),
                        $('<tbody></tbody>').append(
                            ['astronomical','nautical','civil'].map((type) =>
                                $('<tr></tr>').append([
                                    $('<td></td>').text(type),
                                    $('<td></td>').text(solarData.results[`${type}_twilight_begin`]),
                                    $('<td></td>').text(solarData.results[`${type}_twilight_end`]),
                                ])
                            )
                        )
                    ])
                ]);
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

function mkIsWithinModularDistance(max) {
    // is y <= x + distance && x - distance >= y?
    return function isWithinDistanceOf(distance, x, y) {
        const x_abs = x + (max / 2);
        const y_abs = y + (max / 2);
        const max = x + distance > max ? (x_abs + distance) - max : x_abs + distance;
        const min = x - distance < 0 ? max + (x_abs - distance) : x_abs - distance;
        return min < max
            // the case where y has to be inside the interval [min,max]
            ? min <= y_abs && y_abs <= max
            // the case where y has to be outside the interval [max,min]
            : min <= y_abs || y_abs <= max;
    };
}


// {lat, lng} -> {lat, lng} -> bool
function latLongIsWithinRange(reference, subject) {
    const variance = 10.0; // "diameter"
    const latIsWithinDistanceOf = mkIsWithinModularDistance(180);
    const longIsWithinDistanceOf = mkIsWithinModularDistance(360);
    return latIsWithinDistanceOf(variance / 2, reference.lat, subject.lat)
        && longIsWithinDistanceOf(variance / 2, reference.lng, subject.lng);
}
