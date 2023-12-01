import $ from 'jquery';
import * as L from 'leaflet';
import { cToF, windSpeed, weatherTerm, addParamsToURL, normalizeCoords } from './utils.js';
import * as T from './time.js';


// Function that consolidates all the results based on a coordinate `latlng`
export function assignPoint(map, latlng, effects, intendedAttrs) {
    // Default to "Loading..." while AJAX calls are running
    $('#results .card-content:not(:last-child)').empty().append($('<em></em>').text('Loading...'));
    // Move to the coordinate in the map
    map.panTo(latlng);
    // Creates a popup that shows the position on the map
    const popup = L.popup({ autoPan: false });
    popup
        .setLatLng(latlng)
        .setContent(`Lat: ${latlng.lat.toFixed(4)}&deg;, Long: ${latlng.lng.toFixed(4)}&deg;`)
        .openOn(map);

    const latlngNorm = normalizeCoords(latlng);
    getNearestAddress(latlngNorm);
    getWeather(latlngNorm, effects);
    getSolarData(latlngNorm);
    T.updateSolarPosition(latlngNorm, intendedAttrs);
};

export function clickedSubmit(map) {
    const searchTerm = $('#search').val();
    const url = `https://nominatim.openstreetmap.org/search.php?q=${encodeURI(searchTerm)}&format=jsonv2`;
    $.get(url, function gotSearchResults(results) {
        // empty the results before appending new ones
        $('#search-results .box').empty().append(results.map((x) =>
            // each result will be a card
            $('<div></div>').addClass('card').append(
                // content of the card is the `display_name`
                $('<div></div>').addClass('card-content').text(x.display_name)
            // when clicking the card, select that result
            ).on('click', function clickedSearchResult() {
                // turn off the modal
                $('html').removeClass('is-clipped');
                $('#search-results').removeClass('is-active');
                // empty the results
                $('#search-results .box').empty();
                // Runs `assignPoint()` with the result coordinates, just like selecting one
                // in the map.
                assignPoint(map, L.latLng(x.lat, x.lon));
            })
        ));
        // After the results are added to the DOM, show the elements via Bulma's
        // modal procedure
        $('#search-results').addClass('is-active');
        $('html').addClass('is-clipped');
    });
};


// Get the reverse geocode based on the coordinate (nearest logical address)
export function getNearestAddress(latlng) {
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
};

// Get the weather information for this coordinate
export function getWeather(latlng, effects) {
    const params = {
        lat: latlng.lat,
        lon: latlng.lng,
        product: 'civillight',
        output: 'json'
    };
    const url = 'https://www.7timer.info/bin/api.pl';
    $.get(addParamsToURL(url, params), function receivedWeather(weatherString) {
        try {
            const weather = JSON.parse(weatherString);
            const cards = weather.dataseries.map((x) => {
                const cardBody = [
                    $('<p></p>').text(x.date),
                    $('<p></p>').text(weatherTerm(x.weather)),
                    $('<p></p>').text(`${cToF(x.temp2m.min).toFixed(1)}° - ${cToF(x.temp2m.max).toFixed(1)}° F`),
                    $('<p></p>').text(`Wind: ${windSpeed(x.wind10m_max)}`)
                ];
                return $('<div></div>')
                    .addClass('card')
                    .append($('<div></div')
                            .addClass('card-content')
                            .append(cardBody));
            });
            $('#weather')
                .empty()
                .css('grid-template-columns', '')
                .append(cards);

            switch(weather.dataseries[0].weather) {
            case 'clear':
                effects.precip.clear();
                break;
            case 'pcloudy':
                effects.precip.partlyCloudy();
                break;
            case 'mcloudy':
                effects.precip.moderatelyCloudy();
                break;
            case 'cloudy':
                effects.precip.cloudy();
                break;
            case 'humid':
                effects.precip.humid();
                break;
            case 'lightrain':
                effects.precip.lightRain();
                break;
            case 'oshower':
                effects.precip.overcastShowers();
                break;
            case 'ishower':
                effects.precip.intermittentShowers();
                break;
            case 'lightsnow':
                effects.precip.lightSnow();
                break;
            case 'rain':
                effects.precip.rain();
                break;
            case 'snow':
                effects.precip.snow();
                break;
            case 'rainsnow':
                effects.precip.rainAndSnow();
                break;
            case 'ts':
                // TODO
                break;
            case 'tsrain':
                // TODO
                break;
            default:
                throw new Error('Invalid weather code', x);
            }

            switch(weather.dataseries[0].wind10m_max) {
            case 1:
                effects.wind.calm();
                break;
            case 2:
                effects.wind.light();
                break;
            case 3:
                effects.wind.moderate();
                break;
            case 4:
                effects.wind.fresh();
                break;
            case 5:
                effects.wind.strong();
                break;
            case 6:
                effects.wind.gale();
                break;
            case 7:
                effects.wind.storm();
                break;
            case 8:
                effects.wind.hurricane();
                break;
            default:
                throw new Error('Invalid Wind Speed', x);
            }
        } catch(e) {
            console.warn(e, weatherString);
            $('#weather')
                .empty()
                .css('grid-template-columns', 'none')
                .append('Couldn\'t load weather data for this coordinate');
        }
    });
};


// Get sunrise and sunset information
export function getSolarData(latlng) {
    const params = {
        lat: latlng.lat,
        lon: latlng.lng
    };
    const url = 'https://api.sunrise-sunset.org/json';
    $.get(addParamsToURL(url, params), function receivedSolarData(solarData) {
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
                $('<tbody></tbody>').append(['astronomical','nautical','civil']
                    .map((type) =>
                        $('<tr></tr>').append([
                            $('<td></td>').text(type),
                            $('<td></td>').text(solarData.results[`${type}_twilight_begin`]),
                            $('<td></td>').text(solarData.results[`${type}_twilight_end`]),
                        ]))
                )
            ])
        ]);
    });
};
