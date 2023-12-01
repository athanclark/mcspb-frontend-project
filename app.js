import $ from 'jquery';
import * as L from 'leaflet';
import * as THREE from 'three';
import { cToF, windSpeed, weatherTerm, addParamsToURL } from './utils.js';
import * as G from './graphics.js';
import * as UI from './ui.js';

const renderer = G.setupRenderer();

const camera = G.setupCamera();

const scene = G.setupScene();
const textureLoader = new THREE.TextureLoader();

// Create stars
const starSprite = textureLoader.load('./public/star.png');
const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 20,
    fog: false,
    map: starSprite,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
    opacity: 0
});
const stars = G.setupParticles(starsMaterial);
scene.add(stars);

// Create fog
const fogSprite = textureLoader.load('./public/fog.png');
const fogMaterial = new THREE.PointsMaterial({
    size: 100,
    color: 0xcccccc,
    map: fogSprite,
    depthTest: false,
    transparent: true,
    opacity: 0
});
const fog = G.setupParticles(fogMaterial);
fog.position.y -= 500;
fog.scale.x = 0.5;
fog.scale.y = 0.5;
fog.scale.z = 0.5;
scene.add(fog);

// Create clouds
const cloudsMaterial = new THREE.PointsMaterial({
    size: 100,
    color: 0xcccccc,
    map: fogSprite,
    depthTest: false,
    transparent: true,
    opacity: 0
});
const clouds = G.setupParticles(cloudsMaterial);
clouds.position.y += 1000;
clouds.scale.x = 0.5;
clouds.scale.y = 0.2;
clouds.scale.z = 0.5;
scene.add(clouds);

// Create both particle sets for precipitation
const snowSprite = textureLoader.load('./public/snow.png');
const particlesGroup = new THREE.Group();
const particlesMaterial = new THREE.PointsMaterial({
    color: 0xcccccc,
    map: snowSprite,
    depthTest: false,
    transparent: true,
    opacity: 1,
    size: 0
});
const particles = G.setupParticles(particlesMaterial);
particles.position.z -= 1050;
particlesGroup.add(particles);
const particles2Material = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    map: snowSprite,
    depthTest: false,
    transparent: true,
    opacity: 1,
    size: 0
});
const particles2 = G.setupParticles(particles2Material);
particles2.position.z -= 1050;
particlesGroup.add(particles2);
scene.add(particlesGroup);

// Intended args tracks what "ought to be", actual is "what ought to be right now"
let intendedAttrs = G.makeInitialAttrs(camera);
let actualAttrs = G.makeInitialAttrs(camera);
// Altered objects is the set of real scene objects getting modified
const alteredObjects = {
    scene,
    camera,
    starsMaterial,
    fogMaterial,
    fog,
    cloudsMaterial,
    clouds,
    particlesGroup,
    particlesMaterial,
    particles,
    particles2Material,
    particles2
};

const effects = G.makeEffects(intendedAttrs);
// effects.precip.lightSnow();
// effects.wind.fresh();

const timePassed = G.makeTimePassed(actualAttrs, intendedAttrs, alteredObjects);
const animate = G.makeAnimate(renderer, timePassed, scene, camera);

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
            UI.assignPoint(map, latlng, effects, intendedAttrs);
        });
    } catch (e) {
        console.log('Geolocation failed', e);
    }

    // Runs `assignPoint()` whenever the user clicks a point on the map
    map.on('click', (e) => UI.assignPoint(map, e.latlng, effects, intendedAttrs));

    // Run a search when the submit button is clicked
    $('#submit').on('click', () => UI.clickedSubmit(map));


    G.initiateAnimation(animate, renderer, camera);
});



// Move the camera around with the mouse
window.addEventListener('mousemove', (e) => {
    if (e.clientX >= 0 && e.clientY >= 0) {
        const MAX_X = 2;
        const MAX_Y = 1;
        intendedAttrs.camera.position.x =
            ((e.clientX - (window.innerWidth / 2)) / window.innerWidth) * MAX_X;
        intendedAttrs.camera.position.y =
            ((e.clientY - (window.innerHeight / 2)) / window.innerHeight) * MAX_Y;
    }
});

// Bind to buttons
[
    ['#clear-btn', effects.precip.clear],
    ['#partly-cloudy-btn', effects.precip.partlyCloudy],
    ['#moderately-cloudy-btn', effects.precip.moderatelyCloudy],
    ['#cloudy-btn', effects.precip.cloudy],
    ['#humid-btn', effects.precip.humid],
    ['#light-rain-btn', effects.precip.lightRain],
    ['#overcast-showers-btn', effects.precip.overcastShowers],
    ['#intermittent-showers-btn', effects.precip.intermittentShowers],
    ['#rain-btn', effects.precip.rain],
    ['#light-snow-btn', effects.precip.lightSnow],
    ['#snow-btn', effects.precip.snow],
    ['#rain-and-snow-btn', effects.precip.rainAndSnow],
    ['#calm-btn', effects.wind.calm],
    ['#light-btn', effects.wind.light],
    ['#moderate-btn', effects.wind.moderate],
    ['#fresh-btn', effects.wind.fresh],
    ['#strong-btn', effects.wind.strong],
    ['#gale-btn', effects.wind.gale],
    ['#storm-btn', effects.wind.storm],
    ['#hurricane-btn', effects.wind.hurricane]
].forEach(([id,f]) => {
    $(id).on('click', () => { f(); });
});
