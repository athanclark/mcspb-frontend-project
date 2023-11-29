import $ from 'jquery';
import * as L from 'leaflet';
import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';

const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 4;

const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xcccccc));
scene.background = new THREE.Color();
scene.fog = new THREE.Fog( 0xffffff, 1, 5);

const particlesGeometry = new THREE.PlaneGeometry(15, 5, 96, 32);
const particlesMaterial = new THREE.PointsMaterial({ color: 0xcccccc });
particlesMaterial.size = 0.02;
particlesMaterial.sizeAttenuation = true;

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
particles.rotation.x -= Math.PI / 2;
particles.position.y += 2;
scene.add(particles);

$(document).ready(function() {
    // Initialize the map
    const map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Geolocation could fail
    try {
        navigator.geolocation.getCurrentPosition(function positionReceived(p) {
            const latlng = L.latLng(p.coords.latitude, p.coords.longitude);
            assignPoint(latlng);
        });
    } catch (e) {
        console.log('Geolocation failed', e);
    }

    // Runs `assignPoint()` whenever the user clicks a point on the map
    map.on('click', function onMapClick(e) {
        assignPoint(e.latlng);
    });

    // Run a search when the submit button is clicked
    $('#submit').on('click', function clickedSubmit() {
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
                    assignPoint(L.latLng(x.lat, x.lon));
                })
            ));
            // After the results are added to the DOM, show the elements via Bulma's
            // modal procedure
            $('#search-results').addClass('is-active');
            $('html').addClass('is-clipped');
        });
    });


    // Function that consolidates all the results based on a coordinate `latlng`
    function assignPoint(latlng) {
        // Default to "Loading..." while AJAX calls are running
        $('#results .card-content').empty().append($('<em></em>').text('Loading...'));
        // Move to the coordinate in the map
        map.panTo(latlng);
        // Creates a popup that shows the position on the map
        const popup = L.popup({ autoPan: false });
        popup
            .setLatLng(latlng)
            .setContent(`Position: ${latlng.toString()}`)
            .openOn(map);

        // Each `(() => { ... })()` is just a hack to create a new scope that won't bleed
        // `params` and `url` terms into the outer scope; that way I can re-use their names
        // for each of the API calls.

        // Get the reverse geocode based on the coordinate (nearest logical address)
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

        // Get the weather information for this coordinate
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
                $('#weather').empty().append(cards);
            });
        })();

        // Get sunrise and sunset information
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
        })();
    }

    // Error if WebGL isn't available
    if ( WebGL.isWebGLAvailable() ) {
        console.log('starting animation');
        animate();
        requestAnimationFrame(animate);
        document.body.prepend(renderer.domElement);
    } else {
        const warning = WebGL.getWebGLErrorMessage();
        $(document).append($(warning));
    }
});

let intendedCameraPositionX = camera.position.x;
let intendedCameraPositionY = camera.position.y;

// Runs every frame
function timePassed(diff) {
    // represents "one full rotation every 10 seconds"
    const ang_speed = Math.PI / (5 * 1000);
    // if (monkey) {
    //     monkey.rotation.x += ang_speed * diff;
	  //     monkey.rotation.y += ang_speed * diff;
    // }
    camera.position.x += (intendedCameraPositionX - camera.position.x) * 0.05;
    camera.position.y += (- intendedCameraPositionY - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
}


// Animation loop
let last_frame = null;
function animate(now) {
	  requestAnimationFrame(animate);

    const diff = now - last_frame;

    if (diff) {
        if (diff < 0) {
            throw new Error('diff should never be negative!', diff);
        }

        timePassed(diff);
    }

	  renderer.render(scene, camera);
    last_frame = now;
}

// Move the camera around with the mouse
window.addEventListener('mousemove', (e) => {
    if (e.clientX >= 0 && e.clientY >= 0) {
        const MAX_X = 2;
        const MAX_Y = 1;
        intendedCameraPositionX =
            ((e.clientX - (window.innerWidth / 2)) / window.innerWidth) * MAX_X;
        intendedCameraPositionY =
            ((e.clientY - (window.innerHeight / 2)) / window.innerHeight) * MAX_Y;
    }
});

// Adjust the camera and renderer when the window resizes
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    // composer.setSize(window.innerWidth, window.innerHeight);
});

// Turns an object into a URL parameter list
function addParamsToURL(url, params) {
    let first = true;
    for (const k in params) {
        const v = Array.isArray(params[k]) ? params[k].join(',') : params[k];
        const sep = first ? '?' : '&';
        url += `${sep}${k}=${v}`;
        if (first) first = false;
    }
    return url;
}

// Celsius to Farenheit
function cToF(c) {
    return (c * 9 / 5) + 32;
}

// Interprets the wind speed value of the weather API
function windSpeed(x) {
    switch(x) {
    case 1:
        return 'Calm';
    case 2:
        return 'Light';
    case 3:
        return 'Moderate';
    case 4:
        return 'Fresh';
    case 5:
        return 'Strong';
    case 6:
        return 'Gale';
    case 7:
        return 'Storm';
    case 8:
        return 'Hurricane';
    default:
        throw new Error('Invalid Wind Speed', x);
    }
}

function weatherTerm(x) {
    switch(x) {
    case 'clear':
        return 'Clear';
    case 'pcloudy':
        return 'Partly Cloudy';
    case 'mcloudy':
        return 'Moderately Cloudy';
    case 'cloudy':
        return 'Cloudy';
    case 'humid':
        return 'Humid';
    case 'lightrain':
        return 'Light Rain';
    case 'oshower':
        return 'Overcast Showers';
    case 'ishower':
        return 'Intermittent Showers';
    case 'lightsnow':
        return 'Light Snow';
    case 'rain':
        return 'Rain';
    case 'snow':
        return 'Snow';
    case 'rainsnow':
        return 'Rain and Snow';
    default:
        throw new Error('Invalid weather code', x);
    }
}

// // Creates a 
// function mkIsWithinModularDistance(max) {
//     // is y <= x + distance && x - distance >= y?
//     return function isWithinDistanceOf(distance, x, y) {
//         const x_abs = x + (max / 2);
//         const y_abs = y + (max / 2);
//         const max = x + distance > max ? (x_abs + distance) - max : x_abs + distance;
//         const min = x - distance < 0 ? max + (x_abs - distance) : x_abs - distance;
//         return min < max
//             // the case where y has to be inside the interval [min,max]
//             ? min <= y_abs && y_abs <= max
//             // the case where y has to be outside the interval [max,min]
//             : min <= y_abs || y_abs <= max;
//     };
// }


// // {lat, lng} -> {lat, lng} -> bool
// function latLongIsWithinRange(reference, subject) {
//     const variance = 10.0; // "diameter"
//     const latIsWithinDistanceOf = mkIsWithinModularDistance(180);
//     const longIsWithinDistanceOf = mkIsWithinModularDistance(360);
//     return latIsWithinDistanceOf(variance / 2, reference.lat, subject.lat)
//         && longIsWithinDistanceOf(variance / 2, reference.lng, subject.lng);
// }
