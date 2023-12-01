import * as THREE from 'three';
import $ from 'jquery';
import { skyColor } from './utils.js';

export function updateSolarPosition(coords, intendedAttrs) {
    const { sunlight, phase } = getSolarPosition(coords);
    const lightness = (sunlight + 1) / 2;
    console.log('lightness', lightness);
    console.log('phase', phase);
    const [r,g,b] = skyColor(phase);
    let hsl = {};
    const color = new THREE.Color(r / 256, g / 256, b / 256);
    color.getHSL(hsl);
    color.setHSL(hsl.h, hsl.s, lightness);
    // color.getHSL(hsl);
    intendedAttrs.scene.background.r = color.r;
    intendedAttrs.scene.background.g = color.g;
    intendedAttrs.scene.background.b = color.b;
    color.setHSL(
        hsl.h,
        hsl.s / 2,
        Math.max(0.05, lightness < 0.5 ? lightness - 0.05 : lightness + 0.05)
    );
    $(':root')
        .css('--bg', `#${color.getHexString()}`)
        .css('--color', lightness < 0.5 ? '#fff' : '#000');
    const starOpacity = Math.min(1, Math.max(0, 1 - (lightness * 2)));
    intendedAttrs.stars.opacity = starOpacity;
}


// {lat: -90-90, lng: -180-180} -> {sunlight: -1-1, phase: -1-1}
function getSolarPosition(coords) {
    const now = new Date();
    // rough time at lng
    const utcHours = now.getUTCHours() + (now.getUTCMinutes() / 60);
    let hoursAtLng = utcHours + (coords.lng * (12 / 180));
    hoursAtLng = hoursAtLng - (Math.floor(hoursAtLng / 24) * 24);
    const phase = (hoursAtLng / 24);
    // rough lat w/ most sun - 0 and .5 are highest, .25 and .75 are lowest
    const timeInPeriod = dateBasedOnJune21(now) * Math.PI * 2 / 365;
    const latWithMostSunlight = Math.cos(timeInPeriod) * 23.4; // 23.4 deg are the tropics
    // up to 1
    const daylightIdx =
          1 - Math.abs(Math.sin(degreesToRadians(coords.lat - latWithMostSunlight)));
    // down to -1
    const midnightIdx =
          (1 - Math.abs(Math.sin(degreesToRadians((180 - coords.lat) - latWithMostSunlight)))) * -1;
    const radius = (daylightIdx - midnightIdx) / 2;
    const offset = midnightIdx + radius;
    const sunlight = ((Math.cos(phase * Math.PI * 2) * -1 * radius) + offset);
    return {sunlight, phase};
};

// where june 21 is 0, and june 20 is 365
function dateBasedOnJune21(day) {
    // 172nd day = June 21st, 1st solstice
    const d = ((day.getUTCMonth() * 30) + day.getUTCDate()) - 172;
    return d < 0 ? d + 365 : d;
}

function degreesToRadians(x) {
    return Math.PI * 2 * (x / 360);
}
