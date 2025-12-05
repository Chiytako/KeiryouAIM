/**
 * Internationalization (i18n) Manager
 * Manages language resources and text translation
 */

class I18nManager {
    constructor() {
        this.currentLang = 'ja'; // Default language
        this.translations = {};
        this.loaded = false;
        this.observers = [];
    }

    /**
     * Initialize i18n manager
     * @param {string} lang - Initial language code (e.g., 'ja', 'en')
     */
    async init(lang = 'ja') {
        this.currentLang = lang;
        await this.loadTranslations(lang);
        this.loaded = true;
        this.updatePage();
        console.log(`I18n initialized with language: ${lang}`);
    }

    /**
     * Load translation resources for a language
     * @param {string} lang - Language code
     */
    async loadTranslations(lang) {
        try {
            const response = await fetch(`assets/i18n/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load translations for ${lang}`);
            }
            this.translations = await response.json();
        } catch (error) {
            console.error('I18n load error:', error);
            // Fallback to empty translations or handle error
            this.translations = {};
        }
    }

    /**
     * Change current language
     * @param {string} lang - Language code
     */
    async setLanguage(lang) {
        if (this.currentLang === lang) return;

        this.currentLang = lang;
        await this.loadTranslations(lang);
        this.updatePage();

        // Notify observers
        this.notifyObservers();
    }

    /**
     * Get translated string
     * @param {string} key - Translation key (dot notation supported)
     * @param {Object} params - Parameters for interpolation
     * @returns {string} Translated string or key if not found
     */
    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations;

        for (const k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                console.warn(`Missing translation for key: ${key}`);
                return key;
            }
        }

        if (typeof value !== 'string') {
            return key;
        }

        // Interpolate parameters
        return value.replace(/\{(\w+)\}/g, (match, param) => {
            return params[param] !== undefined ? params[param] : match;
        });
    }

    /**
     * Update all elements with data-i18n attribute
     */
    updatePage() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translated = this.t(key);

            // Handle placeholders if needed (can be extended)
            if (el.tagName === 'INPUT' && el.type === 'placeholder') {
                el.placeholder = translated;
            } else {
                el.textContent = translated;
            }
        });

        // Update HTML lang attribute
        document.documentElement.lang = this.currentLang;
    }

    /**
     * Subscribe to language changes
     * @param {Function} callback 
     */
    onLanguageChange(callback) {
        this.observers.push(callback);
    }

    /**
     * Notify all observers
     */
    notifyObservers() {
        this.observers.forEach(callback => callback(this.currentLang));
    }
}

// Export as singleton
const i18n = new I18nManager();
export default i18n;
