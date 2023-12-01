// Celsius to Farenheit
export function cToF(c) {
    return (c * 9 / 5) + 32;
};

// Interprets the wind speed value of the weather API
export function windSpeed(x) {
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
};


export function weatherTerm(x) {
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
    case 'ts':
        return 'Thunderstorms';
    case 'tsrain':
        return 'Thunderstorms with Rain';
    default:
        throw new Error('Invalid weather code', x);
    }
};


// Turns an object into a URL parameter list
export function addParamsToURL(url, params) {
    let first = true;
    for (const k in params) {
        const v = Array.isArray(params[k]) ? params[k].join(',') : params[k];
        const sep = first ? '?' : '&';
        url += `${sep}${k}=${v}`;
        if (first) first = false;
    }
    return url;
};


export function normalizeCoords(x) {
    const latDivisor = Math.floor((x.lat + 90) / 180);
    const latOffset = -1 * latDivisor * 180;
    const lngDivisor = Math.floor((x.lng + 180) / 360);
    const lngOffset = -1 * lngDivisor * 360;
    return {
        lat: (x.lat + latOffset),
        lng: (x.lng + lngOffset)
    };
}


export function linearInterpolate(lo, hi, x) {
    return ((hi - lo) * x) + lo;
}

export function skyColor(phase) {
    let stops = [
        [0, [0x1f, 0x14, 0x45]],
        [.2, [0x61, 0x2d, 0x4a]],
        [.23, [0x93, 0x49, 0x12]],
        [.32, [0x8a, 0x71, 0x34]],
        [.42, [0x9d, 0xca, 0xe7]],
        [.56, [0xbd, 0xd8, 0xe9]],
        [.75, [0x30, 0x84, 0xb9]],
        [.8, [0x87, 0x2e, 0xa6]],
        [.85, [0x4b, 0x1a, 0x93]],
        [.93, [0x1f, 0x14, 0x45]],
    ];
    // makes gradient continuous at the end
    stops.push([1, stops[0][1]]);
    let firstStop = stops[0];
    let secondStop;
    for (const stop of stops) {
        if (firstStop) {
            if (phase <= stop[0]) {
                secondStop = stop;
                break;
            } else {
                firstStop = stop;
            }
        }
    }
    const internalPhase = (phase - firstStop[0]) / (secondStop[0] - firstStop[0]);
    return [
        linearInterpolate(firstStop[1][0], secondStop[1][0], internalPhase),
        linearInterpolate(firstStop[1][1], secondStop[1][1], internalPhase),
        linearInterpolate(firstStop[1][2], secondStop[1][2], internalPhase)
    ];
}
