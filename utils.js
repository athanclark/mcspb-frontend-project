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
