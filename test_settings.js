
import settings from './js/core/settings.js';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        clear: () => { store = {}; }
    };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

console.log('--- Testing Settings ---');

// 1. Initial load
console.log('Initial target.fillColor:', settings.get('target.fillColor'));

// 2. Set new value
console.log('Setting target.fillColor to #FF0000');
settings.set('target.fillColor', '#FF0000');

// 3. Get new value
const newVal = settings.get('target.fillColor');
console.log('New target.fillColor:', newVal);

if (newVal === '#FF0000') {
    console.log('SUCCESS: Settings updated correctly.');
} else {
    console.log('FAILURE: Settings did not update.');
}

// 4. Check nested object structure
console.log('Full settings.target:', settings.get('target'));
