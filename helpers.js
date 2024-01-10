const appName = 'TimeTrack';

const defaultSettings = {
    // TODO
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [].slice.call(scope.querySelectorAll(selector));

exports.$ = $;
exports.$$ = $$;
exports.appName = appName;

const extend = (target, source) => {
    for (let prop in source) {
        if (typeof source[prop] === 'object') {
            extend(target[prop], source[prop]);
        } else {
            target[prop] = source[prop];
        }
    }

    return target;
};

exports.extend = extend;

exports.formatTime = (input, omit = ['ms']) => {
    if (typeof input === 'string' && isNaN(input)) input = new Date(input).getTime();
    if (typeof input === 'undefined') input = Date.now();

    const result = {};
    let time = input;

    result.years = Math.floor(time / 1000 / 60 / 60 / 24 / 365);
    time -= result.years * 365 * 24 * 60 * 60 * 1000;
    result.months = Math.floor(time / 1000 / 60 / 60 / 24 / 30.4);
    time -= result.months * 30.4 * 24 * 60 * 60 * 1000;
    result.days = Math.floor(time / 1000 / 60 / 60 / 24);
    time -= result.days * 24 * 60 * 60 * 1000;
    result.hours = Math.floor(time / 1000 / 60 / 60);
    time -= result.hours * 60 * 60 * 1000;
    result.minutes = Math.floor(time / 1000 / 60);
    time -= result.minutes * 60 * 1000;
    result.seconds = Math.floor(time / 1000);
    time -= result.seconds * 1000;
    result.milliseconds = Math.floor(time);
    result.timestamp = result.stamp = new Date(input).getTime();
    result.formatted = (result.years ? `${result.years} years` : '');

    if (result.months) result.formatted += `${result.formatted ? ', ' : ''}${result.months} month${result.months !== 1 ? 's' : ''}`;
    if (result.days) result.formatted += `${result.formatted ? ', ' : ''}${result.days} day${result.days !== 1 ? 's' : ''}`;
    if (result.hours) result.formatted += `${result.formatted ? ', ' : ''}${result.hours} hour${result.hours !== 1 ? 's' : ''}`;
    if (result.minutes) result.formatted += `${result.formatted ? ', ' : ''}${result.minutes} minute${result.minutes !== 1 ? 's' : ''}`;
    if (result.seconds) result.formatted += `${result.formatted ? ', ' : ''}${result.seconds} second${result.seconds !== 1 ? 's' : ''}`;
    if (result.milliseconds && !omit.includes('ms')) result.formatted += `${result.formatted ? ', ' : ''}${result.milliseconds} millisecond${result.milliseconds !== 1 ? 's' : ''}`;
    
    result.shortFormat = `${result.years ? `${result.years}y` : ''}`;
    
    if (result.months) result.shortFormat += `${result.shortFormat ? ', ' : ''}${result.months}mo`;
    if (result.days) result.shortFormat += `${result.shortFormat ? ', ' : ''}${result.days}d`;
    if (result.hours) result.shortFormat += `${result.shortFormat ? ', ' : ''}${result.hours}h`;
    if (result.minutes) result.shortFormat += `${result.shortFormat ? ', ' : ''}${result.minutes}m`;
    if (result.seconds) result.shortFormat += `${result.shortFormat ? ', ' : ''}${result.seconds}s`;
    if (result.milliseconds && !omit.includes('ms')) result.shortFormat += `${result.shortFormat ? ', ' : ''}${result.milliseconds}ms`;

    return result;
};

exports.loadSettings = async () => {
    const result = localStorage[appName];
    const savedData = JSON.parse(result || '{}');

    return extend(Object.assign({}, defaultSettings), savedData);
};

exports.saveSettings = () => {
    localStorage[appName] = JSON.stringify(settings);
};

exports.serializeForm = form => [].slice.call(form.elements).reduce((result, element) => {
    const key = element.name;

    if (!key) return result;

    const group = element.closest('fieldset');
    const groupId = group && group.dataset.groupId;
    const value = (element.type === 'checkbox') ? element.checked : (element.dataset.numeric === 'true' ? Number(element.value) : element.value);

    if (groupId) {
        if (!result[groupId]) result[groupId] = {};

        result[groupId][key] = value;
    } else {
        result[key] = value;
    }

    return result;
}, {});

exports.slug = id => String(id).toLowerCase().replace(/[^\w-]+/g, '-').replace(/\-+/g, '-').replace(/^\-|\-$/g, '');

exports.toast = (message, options) => {
    const $notifyContainer = document.getElementById('notification-container');
    const $notifyElement = document.getElementById('notification');
    const $notifyMessage = document.getElementById('notification-message');

    clearTimeout($notifyContainer.timeout);

    if (!options) options = {};
    if (!options.timeout) options.timeout = 5000;

    if (message === false) {
        $notifyElement.classList.remove('fadeInUp');
        $notifyElement.classList.add('fadeOutDown');

        $notifyContainer.timeout = setTimeout(function() {
            $notifyContainer.hidden = true;
            $notifyMessage.textContent = '';
        }, 800);

        delete toast.target;

        return;
    }

    $notifyMessage.innerHTML = message;
    $notifyContainer.hidden = false;
    $notifyElement.classList.remove('fadeOutDown');
    $notifyElement.classList.add('animated', 'fadeInUp');

    $notifyContainer.timeout = setTimeout(function() {
        toast(false);
    }, options.timeout);

    delete toast.target;
};