/**
 * ConfigManager - Manages engine configuration with JSON overrides
 */
export class ConfigManager {
    /**
     * @constructor
     * @param {Object} initialConfig - Initial configuration values
     */
    constructor(initialConfig = {}) {
        // Default engine configuration
        this.defaults = {
            // General settings
            debugMode: false,
            autoPause: true,
            
            // Rendering settings
            renderer: {
                /* @tweakable Type of renderer to use: '2d' or '3d' */
                type: '3d',
                /* @tweakable Clear color for renderer background */
                clearColor: '#000000',
                /* @tweakable Enable antialiasing */
                antialias: true,
                /* @tweakable Shadow quality: 'off', 'low', 'medium', 'high' */
                shadowQuality: 'medium',
                /* @tweakable Post-processing effects quality: 'off', 'low', 'medium', 'high' */
                postProcessing: 'medium',
                /* @tweakable Pixel ratio for renderer (affects sharpness) */
                pixelRatio: window.devicePixelRatio || 1
            },
            
            // Physics settings
            physics: {
                /* @tweakable Enable physics simulation */
                enabled: true,
                /* @tweakable Gravity strength */
                gravity: { x: 0, y: -9.8, z: 0 },
                /* @tweakable Physics simulation steps per second */
                stepsPerSecond: 60
            },
            
            // Input settings
            input: {
                /* @tweakable Mouse sensitivity for camera control */
                mouseSensitivity: 1.0,
                /* @tweakable Gamepad deadzone (0.0 to 1.0) */
                gamepadDeadzone: 0.25,
                /* @tweakable Enable touch controls on mobile devices */
                touchControls: true
            },
            
            // Audio settings
            audio: {
                /* @tweakable Master volume (0.0 to 1.0) */
                masterVolume: 1.0,
                /* @tweakable Music volume (0.0 to 1.0) */
                musicVolume: 0.7,
                /* @tweakable Sound effects volume (0.0 to 1.0) */
                sfxVolume: 1.0,
                /* @tweakable Maximum number of simultaneous audio sources */
                maxSources: 32,
                /* @tweakable Positional audio enabled */
                positional: true
            },
            
            // Network settings
            network: {
                /* @tweakable Network update rate (updates per second) */
                updateRate: 20,
                /* @tweakable Interpolation delay in milliseconds */
                interpolationDelay: 100,
                /* @tweakable Maximum number of players in a room */
                maxPlayers: 50
            },
            
            // UI settings
            ui: {
                /* @tweakable UI scale (1.0 is default) */
                scale: 1.0,
                /* @tweakable UI theme: 'dark', 'light', 'custom' */
                theme: 'dark',
                /* @tweakable Show FPS counter */
                showFps: true,
                /* @tweakable Show ping display */
                showPing: true
            },
            
            // Asset settings
            assets: {
                /* @tweakable Base path for asset loading */
                basePath: './assets/',
                /* @tweakable Enable texture compression */
                textureCompression: true,
                /* @tweakable Model detail level: 'low', 'medium', 'high' */
                modelDetail: 'medium',
                /* @tweakable Maximum texture size (power of 2) */
                maxTextureSize: 2048
            }
        };
        
        // Current configuration (merge defaults with initial config)
        this.config = this._deepMerge({}, this.defaults, initialConfig);
        
        // User overrides (stored in localStorage)
        this.userOverrides = {};
        
        // Flag to track initialization
        this.initialized = false;
    }
    
    /**
     * Initialize the configuration manager
     * @returns {Promise} Resolves when initialization is complete
     */
    async init() {
        try {
            // Load user overrides from localStorage
            await this._loadUserOverrides();
            
            // Apply user overrides to current config
            if (Object.keys(this.userOverrides).length > 0) {
                this.config = this._deepMerge({}, this.config, this.userOverrides);
                console.log('Applied user configuration overrides');
            }
            
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize ConfigManager:', error);
            return false;
        }
    }
    
    /**
     * Get a configuration value
     * @param {string} key - Dot-notation path to config value
     * @param {any} defaultValue - Default value if key not found
     * @returns {any} Configuration value
     */
    getValue(key, defaultValue = undefined) {
        const value = this._getNestedValue(this.config, key);
        return value !== undefined ? value : defaultValue;
    }
    
    /**
     * Set a configuration value
     * @param {string} key - Dot-notation path to config value
     * @param {any} value - New value to set
     * @param {boolean} saveAsOverride - Whether to save as a user override
     */
    setValue(key, value, saveAsOverride = true) {
        this._setNestedValue(this.config, key, value);
        
        if (saveAsOverride) {
            this._setNestedValue(this.userOverrides, key, value);
            this._saveUserOverrides();
        }
    }
    
    /**
     * Reset a specific configuration value to default
     * @param {string} key - Dot-notation path to config value
     */
    resetValue(key) {
        const defaultValue = this._getNestedValue(this.defaults, key);
        this._setNestedValue(this.config, key, defaultValue);
        
        // Remove from user overrides
        const parts = key.split('.');
        let current = this.userOverrides;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part]) return;
            current = current[part];
        }
        
        delete current[parts[parts.length - 1]];
        this._saveUserOverrides();
    }
    
    /**
     * Reset all configuration values to defaults
     */
    resetAll() {
        this.config = this._deepMerge({}, this.defaults);
        this.userOverrides = {};
        this._saveUserOverrides();
    }
    
    /**
     * Export current configuration as JSON
     * @returns {string} JSON string of current config
     */
    exportConfig() {
        return JSON.stringify(this.config, null, 2);
    }
    
    /**
     * Import configuration from JSON
     * @param {string} json - JSON string with configuration data
     * @param {boolean} applyAsOverride - Whether to apply as user override
     * @returns {boolean} Success state
     */
    importConfig(json, applyAsOverride = true) {
        try {
            const importedConfig = JSON.parse(json);
            
            // Validate the imported config structure
            if (typeof importedConfig !== 'object') {
                throw new Error('Invalid configuration format');
            }
            
            // Apply the imported configuration
            this.config = this._deepMerge({}, this.defaults, importedConfig);
            
            if (applyAsOverride) {
                // Save as user overrides
                this.userOverrides = this._deepMerge({}, importedConfig);
                this._saveUserOverrides();
            }
            
            return true;
        } catch (error) {
            console.error('Failed to import configuration:', error);
            return false;
        }
    }
    
    /**
     * Get all tweakable configuration parameters
     * @returns {Object} Object containing paths and metadata for tweakable parameters
     */
    getTweakableParams() {
        // This would normally parse the source code for @tweakable annotations
        // but for demo purposes, we'll return a static list
        return {
            'renderer.type': {
                path: 'renderer.type',
                description: 'Type of renderer to use',
                type: 'select',
                options: ['2d', '3d'],
                current: this.getValue('renderer.type')
            },
            'renderer.clearColor': {
                path: 'renderer.clearColor',
                description: 'Clear color for renderer background',
                type: 'color',
                current: this.getValue('renderer.clearColor')
            },
            // Add more tweakable params here
        };
    }
    
    /**
     * Load user overrides from localStorage
     * @private
     */
    async _loadUserOverrides() {
        try {
            const saved = localStorage.getItem('mmorgpine_user_config');
            if (saved) {
                this.userOverrides = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Failed to load user configuration overrides:', error);
            this.userOverrides = {};
        }
    }
    
    /**
     * Save user overrides to localStorage
     * @private
     */
    _saveUserOverrides() {
        try {
            localStorage.setItem('mmorgpine_user_config', JSON.stringify(this.userOverrides));
        } catch (error) {
            console.warn('Failed to save user configuration overrides:', error);
        }
    }
    
    /**
     * Helper to get a nested object value from a dot notation string
     * @param {Object} obj - Object to get value from
     * @param {string} path - Dot notation path
     * @returns {any} Value at path or undefined
     * @private
     */
    _getNestedValue(obj, path) {
        const parts = path.split('.');
        let current = obj;
        
        for (const part of parts) {
            if (current === undefined || current === null) {
                return undefined;
            }
            current = current[part];
        }
        
        return current;
    }
    
    /**
     * Helper to set a nested object value from a dot notation string
     * @param {Object} obj - Object to set value in
     * @param {string} path - Dot notation path
     * @param {any} value - Value to set
     * @private
     */
    _setNestedValue(obj, path, value) {
        const parts = path.split('.');
        let current = obj;
        
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part]) {
                current[part] = {};
            }
            current = current[part];
        }
        
        current[parts[parts.length - 1]] = value;
    }
    
    /**
     * Deep merge objects
     * @param {Object} target - Target object
     * @param {...Object} sources - Source objects to merge
     * @returns {Object} Merged object
     * @private
     */
    _deepMerge(target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();
        
        if (this._isObject(target) && this._isObject(source)) {
            for (const key in source) {
                if (this._isObject(source[key])) {
                    if (!target[key]) {
                        Object.assign(target, { [key]: {} });
                    }
                    this._deepMerge(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
        
        return this._deepMerge(target, ...sources);
    }
    
    /**
     * Check if value is a plain object
     * @param {any} item - Value to check
     * @returns {boolean} Whether value is a plain object
     * @private
     */
    _isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }
}