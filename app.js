import $ from 'jquery';
import * as L from 'leaflet';
import * as THREE from 'three';
import { cToF, windSpeed, weatherTerm, addParamsToURL } from './utils.js';
import * as G from './graphics.js';
import * as UI from './ui.js';

const renderer = G.setupRenderer();

const camera = G.setupCamera();

const scene = G.setupScene();

const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2,
    fog: false,
    transparent: true,
    opacity: 0
});
const stars = G.setupParticles(starsMaterial);
scene.add(stars);

const textureLoader = new THREE.TextureLoader();
const fogSprite = textureLoader.load('public/fog.png');
const fogMaterial = new THREE.PointsMaterial({
    size: 50,
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

const particlesGroup = new THREE.Group();
const particlesMaterial = new THREE.PointsMaterial({
    color: 0xcccccc,
    size: 0
});
const particles = G.setupParticles(particlesMaterial);
particles.position.z -= 1050;
particlesGroup.add(particles);
const particles2Material = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 0
});
const particles2 = G.setupParticles(particles2Material);
particles2.position.z -= 1050;
particlesGroup.add(particles2);
scene.add(particlesGroup);

let intendedAttrs = G.makeInitialAttrs(camera);
let actualAttrs = G.makeInitialAttrs(camera);
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
            UI.assignPoint(map, latlng, effects, scene, intendedAttrs);
        });
    } catch (e) {
        console.log('Geolocation failed', e);
    }

    // Runs `assignPoint()` whenever the user clicks a point on the map
    map.on('click', (e) => UI.assignPoint(map, e.latlng, effects, scene, intendedAttrs));

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

$('#clear-btn').on('click', () => {
    effects.precip.clear();
});
$('#partly-cloudy-btn').on('click', () => {
    effects.precip.partlyCloudy();
});
$('#moderately-cloudy-btn').on('click', () => {
    effects.precip.moderatelyCloudy();
});
$('#cloudy-btn').on('click', () => {
    effects.precip.cloudy();
});
$('#humid-btn').on('click', () => {
    effects.precip.humid();
});
$('#light-rain-btn').on('click', () => {
    effects.precip.lightRain();
});
$('#overcast-showers-btn').on('click', () => {
    effects.precip.overcastShowers();
});
$('#intermittent-showers-btn').on('click', () => {
    effects.precip.intermittentShowers();
});
$('#rain-btn').on('click', () => {
    effects.precip.rain();
});
$('#light-snow-btn').on('click', () => {
    effects.precip.lightSnow();
});
$('#snow-btn').on('click', () => {
    effects.precip.snow();
});
$('#rain-and-snow-btn').on('click', () => {
    effects.precip.rainAndSnow();
});

$('#calm-btn').on('click', () => {
    effects.wind.calm();
});
$('#light-btn').on('click', () => {
    effects.wind.light();
});
$('#moderate-btn').on('click', () => {
    effects.wind.moderate();
});
$('#fresh-btn').on('click', () => {
    effects.wind.fresh();
});
$('#strong-btn').on('click', () => {
    effects.wind.strong();
});
$('#gale-btn').on('click', () => {
    effects.wind.gale();
});
$('#storm-btn').on('click', () => {
    effects.wind.storm();
});
$('#hurricane-btn').on('click', () => {
    effects.wind.hurricane();
});
