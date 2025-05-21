/**
 * AssetManager - Manages loading, caching, and generating game assets
 */
export class AssetManager {
    /**
     * @constructor
     * @param {Object} engine - Reference to the main engine instance
     */
    constructor(engine) {
        this.engine = engine;
        
        // Asset caches by type
        this.textures = new Map();
        this.models = new Map();
        this.sounds = new Map();
        this.fonts = new Map();
        this.videos = new Map();
        this.shaders = new Map();
        this.sprites = new Map();
        this.json = new Map();
        
        // Loading tracking
        this.loadingAssets = new Map();
        this.totalAssets = 0;
        this.loadedAssets = 0;
        
        // Base path for assets
        this.basePath = '';
        
        // AI generation state/cache
        this.generatedAssets = new Map();
    }
    
    /**
     * Initialize the asset manager
     * @returns {Promise} Resolves when initialization is complete
     */
    async init() {
        try {
            // Set base path from config
            this.basePath = this.engine.configManager.getValue('assets.basePath', './assets/');
            
            // Create asset directory structure if needed
            // (This would be for a node.js environment, not applicable in the browser)
            
            console.log('AssetManager initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize AssetManager:', error);
            return false;
        }
    }
    
    /**
     * Load a texture
     * @param {string} key - Unique identifier for the texture
     * @param {string} path - Path to the texture file
     * @returns {Promise} Resolves with the loaded texture
     */
    async loadTexture(key, path) {
        // Check cache first
        if (this.textures.has(key)) {
            return this.textures.get(key);
        }
        
        // Start loading tracking
        this._trackLoadStart(key, 'texture');
        
        try {
            // Create a promise to load the texture
            const fullPath = this._resolvePath(path);
            
            // In a real implementation, this would use the appropriate rendering
            // library (Three.js, Pixi.js, etc.) to load the texture
            const texturePromise = new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => {
                    // In a real implementation, create a texture from the image
                    const texture = { image, width: image.width, height: image.height };
                    resolve(texture);
                };
                image.onerror = () => reject(new Error(`Failed to load texture: ${fullPath}`));
                image.src = fullPath;
            });
            
            const texture = await texturePromise;
            
            // Cache the texture
            this.textures.set(key, texture);
            
            // Update loading tracking
            this._trackLoadComplete(key);
            
            return texture;
        } catch (error) {
            // Update loading tracking
            this._trackLoadError(key, error);
            
            throw error;
        }
    }
    
    /**
     * Load a sound file
     * @param {string} key - Unique identifier for the sound
     * @param {string} path - Path to the sound file
     * @param {Object} options - Sound loading options
     * @returns {Promise} Resolves with the loaded sound
     */
    async loadSound(key, path, options = {}) {
        // Check cache first
        if (this.sounds.has(key)) {
            return this.sounds.get(key);
        }
        
        // Start loading tracking
        this._trackLoadStart(key, 'sound');
        
        try {
            // Create a promise to load the sound
            const fullPath = this._resolvePath(path);
            
            // In a real implementation, this would use the Web Audio API
            // or a library like Howler.js to load the sound
            const soundPromise = new Promise((resolve, reject) => {
                const audio = new Audio();
                audio.oncanplaythrough = () => {
                    // Create a sound object with the loaded audio
                    const sound = { audio, duration: audio.duration };
                    resolve(sound);
                };
                audio.onerror = () => reject(new Error(`Failed to load sound: ${fullPath}`));
                audio.src = fullPath;
                audio.load();
            });
            
            const sound = await soundPromise;
            
            // Cache the sound
            this.sounds.set(key, sound);
            
            // Update loading tracking
            this._trackLoadComplete(key);
            
            return sound;
        } catch (error) {
            // Update loading tracking
            this._trackLoadError(key, error);
            
            throw error;
        }
    }
    
    /**
     * Load a 3D model
     * @param {string} key - Unique identifier for the model
     * @param {string} path - Path to the model file
     * @param {Object} options - Model loading options
     * @returns {Promise} Resolves with the loaded model
     */
    async loadModel(key, path, options = {}) {
        // This would be implemented with Three.js or another 3D library
        // For demonstration, we'll just return a placeholder
        
        // Check cache first
        if (this.models.has(key)) {
            return this.models.get(key);
        }
        
        // Start loading tracking
        this._trackLoadStart(key, 'model');
        
        try {
            // Placeholder for model loading
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const model = { geometry: {}, materials: [] };
            
            // Cache the model
            this.models.set(key, model);
            
            // Update loading tracking
            this._trackLoadComplete(key);
            
            return model;
        } catch (error) {
            // Update loading tracking
            this._trackLoadError(key, error);
            
            throw error;
        }
    }
    
    /**
     * Load a JSON file (for configurations, level data, etc.)
     * @param {string} key - Unique identifier for the JSON data
     * @param {string} path - Path to the JSON file
     * @returns {Promise} Resolves with the parsed JSON data
     */
    async loadJSON(key, path) {
        // Check cache first
        if (this.json.has(key)) {
            return this.json.get(key);
        }
        
        // Start loading tracking
        this._trackLoadStart(key, 'json');
        
        try {
            const fullPath = this._resolvePath(path);
            
            // Load and parse the JSON file
            const response = await fetch(fullPath);
            if (!response.ok) {
                throw new Error(`Failed to load JSON: ${fullPath}`);
            }
            
            const data = await response.json();
            
            // Cache the JSON data
            this.json.set(key, data);
            
            // Update loading tracking
            this._trackLoadComplete(key);
            
            return data;
        } catch (error) {
            // Update loading tracking
            this._trackLoadError(key, error);
            
            throw error;
        }
    }
    
    /**
     * Load a shader file
     * @param {string} key - Unique identifier for the shader
     * @param {string} vertPath - Path to the vertex shader
     * @param {string} fragPath - Path to the fragment shader
     * @returns {Promise} Resolves with the shader program
     */
    async loadShader(key, vertPath, fragPath) {
        // This would be implemented with WebGL or a graphics library
        // For demonstration, we'll just return a placeholder
        
        // Check cache first
        if (this.shaders.has(key)) {
            return this.shaders.get(key);
        }
        
        // Start loading tracking
        this._trackLoadStart(key, 'shader');
        
        try {
            // Placeholder for shader loading
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const shader = { vertexShader: {}, fragmentShader: {} };
            
            // Cache the shader
            this.shaders.set(key, shader);
            
            // Update loading tracking
            this._trackLoadComplete(key);
            
            return shader;
        } catch (error) {
            // Update loading tracking
            this._trackLoadError(key, error);
            
            throw error;
        }
    }
    
    /**
     * Load multiple assets at once
     * @param {Array} assetsList - List of assets to load
     * @returns {Promise} Resolves when all assets are loaded
     */
    async loadAssets(assetsList) {
        const promises = [];
        
        for (const asset of assetsList) {
            const { type, key, path, options } = asset;
            
            // Call the appropriate loading method based on type
            switch (type.toLowerCase()) {
                case 'texture':
                case 'image':
                    promises.push(this.loadTexture(key, path));
                    break;
                    
                case 'sound':
                case 'audio':
                    promises.push(this.loadSound(key, path, options));
                    break;
                    
                case 'model':
                    promises.push(this.loadModel(key, path, options));
                    break;
                    
                case 'json':
                    promises.push(this.loadJSON(key, path));
                    break;
                    
                case 'shader':
                    if (!options || !options.fragPath) {
                        throw new Error(`Shader '${key}' requires vertPath and fragPath`);
                    }
                    promises.push(this.loadShader(key, path, options.fragPath));
                    break;
                    
                default:
                    console.warn(`Unknown asset type: ${type}`);
                    break;
            }
        }
        
        // Wait for all assets to load
        return Promise.all(promises);
    }
    
    /**
     * Generate an image using AI
     * @param {string} key - Unique identifier for the generated image
     * @param {string} prompt - Text prompt for the AI image generator
     * @param {Object} options - Generation options
     * @returns {Promise} Resolves with the generated image
     */
    async generateImage(key, prompt, options = {}) {
        // Check if already cached
        if (this.generatedAssets.has(`image:${key}`)) {
            return this.generatedAssets.get(`image:${key}`);
        }
        
        try {
            console.log(`Generating image: ${prompt}`);
            
            // Use the AI inference ability to generate the image
            const ratio = options.aspectRatio || '1:1';
            const transparent = options.transparent || false;
            
            const result = await websim.imageGen({
                prompt: prompt,
                aspect_ratio: ratio,
                transparent: transparent,
                seed: options.seed
            });
            
            // Create an image element from the result URL
            const imagePromise = new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => {
                    // Create an image object
                    const generatedImage = {
                        image,
                        url: result.url,
                        width: image.width,
                        height: image.height,
                        prompt
                    };
                    resolve(generatedImage);
                };
                image.onerror = () => reject(new Error(`Failed to load generated image: ${key}`));
                image.src = result.url;
            });
            
            const generatedImage = await imagePromise;
            
            // Cache the generated asset
            this.generatedAssets.set(`image:${key}`, generatedImage);
            
            // Also add to textures cache for convenience
            this.textures.set(key, generatedImage);
            
            console.log(`Generated image: ${key}`);
            return generatedImage;
        } catch (error) {
            console.error(`Failed to generate image '${key}':`, error);
            throw error;
        }
    }
    
    /**
     * Generate a voice clip using AI text-to-speech
     * @param {string} key - Unique identifier for the generated audio
     * @param {string} text - Text to convert to speech
     * @param {Object} options - Generation options
     * @returns {Promise} Resolves with the generated audio
     */
    async generateVoice(key, text, options = {}) {
        // Check if already cached
        if (this.generatedAssets.has(`voice:${key}`)) {
            return this.generatedAssets.get(`voice:${key}`);
        }
        
        try {
            console.log(`Generating voice: ${text.substring(0, 30)}...`);
            
            // Default voice settings
            const voice = options.voice || 'en-male';
            
            // Use the AI inference ability to generate speech
            const ttsOptions = {
                text: text,
                voice: voice
            };
            
            // Add voice sample if provided
            if (options.voiceSample) {
                ttsOptions.voice_sample = options.voiceSample;
            }
            
            const result = await websim.textToSpeech(ttsOptions);
            
            // Create an audio element from the result URL
            const audioPromise = new Promise((resolve, reject) => {
                const audio = new Audio();
                audio.oncanplaythrough = () => {
                    // Create an audio object
                    const generatedVoice = {
                        audio,
                        url: result.url,
                        duration: audio.duration,
                        text
                    };
                    resolve(generatedVoice);
                };
                audio.onerror = () => reject(new Error(`Failed to load generated voice: ${key}`));
                audio.src = result.url;
                audio.load();
            });
            
            const generatedVoice = await audioPromise;
            
            // Cache the generated asset
            this.generatedAssets.set(`voice:${key}`, generatedVoice);
            
            // Also add to sounds cache for convenience
            this.sounds.set(key, generatedVoice);
            
            console.log(`Generated voice: ${key}`);
            return generatedVoice;
        } catch (error) {
            console.error(`Failed to generate voice '${key}':`, error);
            throw error;
        }
    }
    
    /**
     * Generate game content using AI (e.g., level descriptions, character stats)
     * @param {string} key - Unique identifier for the generated content
     * @param {string} prompt - Prompt for content generation
     * @param {Object} options - Generation options
     * @returns {Promise} Resolves with the generated content
     */
    async generateGameContent(key, prompt, options = {}) {
        // Check if already cached
        if (this.generatedAssets.has(`content:${key}`)) {
            return this.generatedAssets.get(`content:${key}`);
        }
        
        try {
            console.log(`Generating game content: ${key}`);
            
            // Create system prompt based on content type
            let systemPrompt = '';
            const format = options.format || 'json';
            const contentType = options.contentType || 'generic';
            
            // Define different system prompts based on content type
            switch (contentType) {
                case 'character':
                    systemPrompt = `Generate character stats and description for an RPG character.
                    Respond directly with JSON, following this schema, and no other text:
                    {
                      name: string,
                      class: string,
                      level: number,
                      strength: number,
                      dexterity: number,
                      intelligence: number,
                      charisma: number,
                      health: number,
                      mana: number,
                      skills: string[],
                      background: string,
                      appearance: string
                    }`;
                    break;
                    
                case 'quest':
                    systemPrompt = `Generate a quest for an RPG game.
                    Respond directly with JSON, following this schema, and no other text:
                    {
                      title: string,
                      description: string,
                      objectives: string[],
                      rewards: object,
                      difficulty: string,
                      requiredLevel: number,
                      location: string,
                      questGiver: string,
                      isMainQuest: boolean
                    }`;
                    break;
                    
                case 'item':
                    systemPrompt = `Generate an item for an RPG game.
                    Respond directly with JSON, following this schema, and no other text:
                    {
                      name: string,
                      type: string,
                      rarity: string,
                      stats: object,
                      description: string,
                      value: number,
                      requiredLevel: number
                    }`;
                    break;
                    
                case 'location':
                    systemPrompt = `Generate a location for an RPG game.
                    Respond directly with JSON, following this schema, and no other text:
                    {
                      name: string,
                      type: string,
                      description: string,
                      climate: string,
                      dangers: string[],
                      points_of_interest: string[],
                      inhabitants: string[]
                    }`;
                    break;
                    
                default:
                    systemPrompt = `Generate game content based on the provided prompt.
                    Respond directly with ${format === 'json' ? 'JSON' : 'text'}.`;
            }
            
            // Use the AI inference ability to generate content
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                json: format === 'json'
            });
            
            let content;
            if (format === 'json') {
                content = JSON.parse(completion.content);
            } else {
                content = completion.content;
            }
            
            // Cache the generated content
            const generatedContent = {
                content,
                prompt,
                contentType,
                timestamp: Date.now()
            };
            
            this.generatedAssets.set(`content:${key}`, generatedContent);
            
            console.log(`Generated game content: ${key}`);
            return generatedContent;
        } catch (error) {
            console.error(`Failed to generate game content '${key}':`, error);
            throw error;
        }
    }
    
    /**
     * Check if an asset is loaded and cached
     * @param {string} key - Asset key
     * @param {string} type - Asset type
     * @returns {boolean} Whether the asset is loaded
     */
    isLoaded(key, type) {
        switch (type.toLowerCase()) {
            case 'texture':
            case 'image':
                return this.textures.has(key);
                
            case 'sound':
            case 'audio':
                return this.sounds.has(key);
                
            case 'model':
                return this.models.has(key);
                
            case 'json':
                return this.json.has(key);
                
            case 'shader':
                return this.shaders.has(key);
                
            case 'generated':
                return this.generatedAssets.has(key);
                
            default:
                return false;
        }
    }
    
    /**
     * Get the loading progress
     * @returns {number} Progress from 0 to 1
     */
    getLoadingProgress() {
        if (this.totalAssets === 0) return 1;
        return this.loadedAssets / this.totalAssets;
    }
    
    /**
     * Clear cached assets of a specific type
     * @param {string} type - Asset type to clear (or 'all' for everything)
     */
    clearCache(type = 'all') {
        if (type === 'all') {
            this.textures.clear();
            this.models.clear();
            this.sounds.clear();
            this.fonts.clear();
            this.videos.clear();
            this.shaders.clear();
            this.sprites.clear();
            this.json.clear();
            this.generatedAssets.clear();
            return;
        }
        
        switch (type.toLowerCase()) {
            case 'texture':
            case 'image':
                this.textures.clear();
                break;
                
            case 'sound':
            case 'audio':
                this.sounds.clear();
                break;
                
            case 'model':
                this.models.clear();
                break;
                
            case 'font':
                this.fonts.clear();
                break;
                
            case 'video':
                this.videos.clear();
                break;
                
            case 'shader':
                this.shaders.clear();
                break;
                
            case 'sprite':
                this.sprites.clear();
                break;
                
            case 'json':
                this.json.clear();
                break;
                
            case 'generated':
                this.generatedAssets.clear();
                break;
        }
    }
    
    /**
     * Resolve an asset path relative to the base path
     * @param {string} path - Asset path
     * @returns {string} Full path
     * @private
     */
    _resolvePath(path) {
        // If path is a URL, return it as is
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
            return path;
        }
        
        // Otherwise, prepend the base path
        return `${this.basePath}${path}`;
    }
    
    /**
     * Track the start of an asset load
     * @param {string} key - Asset key
     * @param {string} type - Asset type
     * @private
     */
    _trackLoadStart(key, type) {
        this.loadingAssets.set(key, { type, startTime: performance.now() });
        this.totalAssets++;
        
        // Emit loading event
        this.engine.events.emit('asset:loadStart', { key, type });
    }
    
    /**
     * Track the completion of an asset load
     * @param {string} key - Asset key
     * @private
     */
    _trackLoadComplete(key) {
        const asset = this.loadingAssets.get(key);
        if (!asset) return;
        
        this.loadingAssets.delete(key);
        this.loadedAssets++;
        
        const loadTime = performance.now() - asset.startTime;
        
        // Emit loading event
        this.engine.events.emit('asset:loadComplete', { 
            key, 
            type: asset.type, 
            loadTime 
        });
        
        // Emit progress event
        this.engine.events.emit('asset:loadProgress', this.getLoadingProgress());
    }
    
    /**
     * Track an error during asset loading
     * @param {string} key - Asset key
     * @param {Error} error - Error that occurred
     * @private
     */
    _trackLoadError(key, error) {
        const asset = this.loadingAssets.get(key);
        if (!asset) return;
        
        this.loadingAssets.delete(key);
        this.totalAssets--; // Don't count failed loads in the progress
        
        // Emit error event
        this.engine.events.emit('asset:loadError', { 
            key, 
            type: asset.type, 
            error 
        });
    }
}