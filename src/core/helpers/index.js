let getType = {};

export function generateRandomString(length, chars) {
    let result = '';

    for(let i = length; i > 0; --i) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }

    return result;
}

export function isUndefined(value) {
    return typeof value === 'undefined';
}

export function isDefined(value) {
    return !isUndefined(value) && value !== null;
}

export function isFunction(functionToCheck) {
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

export function isString(value) {
    return isDefined(value) && typeof value === 'string';
}

export function hasClass(node, className) {
    if(!isDefined(node.classList)) {
        return false;
    }

    return node.classList.contains(className);
}

export function hasClassTree(node) {
    let args = Array.from(arguments).slice(1);
    let current = node;

    for(let i = 0; i < args.length; ++i) {
        // Ensure parent exists
        if(!isDefined(current)) {
            return false;
        }

        // Check if `current` matches class
        let className = args[i];

        if(!isDefined(className)) {
            // Switch to parent node
            current = current.parentNode;
            continue;
        }

        if(!isDefined(current.classList) || !current.classList.contains(className)) {
            return false;
        }

        // Switch to parent node
        current = current.parentNode;
    }

    return true;
}

export function round(value, digits) {
    return +(Math.round(value + 'e+' + digits) + 'e-' + digits);
}

export function setDefault(value, defaultValue) {
    if(!isDefined(value)) {
        if(!isDefined(defaultValue)) {
            return null;
        }

        return defaultValue;
    }

    return value;
}

export function toCssUrl(url) {
    if(!isDefined(url)) {
        return null;
    }

    return 'url(' + url + ')';
}
