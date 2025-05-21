/**
 * SceneManager - Handles game scenes, levels, and scene transitions
 */
export class SceneManager {
    /**
     * @constructor
     * @param {Object} engine - Reference to the main engine instance
     */
    constructor(engine) {
        this.engine = engine;
        
        // Scenes registry
        this.scenes = new Map();
        
        // Current active scene
        this.activeScene = null;
        this.activeSceneId = null;
        
        // Scene transition state
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.transitionDuration = 0;
        this.transitionStartTime = 0;
        this.transitionFromScene = null;
        this.transitionToScene = null;
        
        // Default scene transition duration in milliseconds
        this.defaultTransitionDuration = 500;
    }
    
    /**
     * Initialize the scene manager
     * @returns {Promise} Resolves when initialization is complete
     */
    async init() {
        try {
            console.log('SceneManager initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize SceneManager:', error);
            return false;
        }
    }
    
    /**
     * Register a scene with the manager
     * @param {string} id - Unique identifier for the scene
     * @param {Object} sceneClass - Scene class constructor
     */
    registerScene(id, sceneClass) {
        if (this.scenes.has(id)) {
            console.warn(`Scene '${id}' is already registered`);
            return;
        }
        
        this.scenes.set(id, sceneClass);
        console.log(`Registered scene: ${id}`);
    }
    
    /**
     * Create a scene instance
     * @param {string} id - Scene identifier
     * @returns {Object} Scene instance or null if not found
     * @private
     */
    _createSceneInstance(id) {
        const SceneClass = this.scenes.get(id);
        
        if (!SceneClass) {
            console.error(`Scene '${id}' not found`);
            return null;
        }
        
        try {
            // Create and return a new scene instance
            return new SceneClass(this.engine);
        } catch (error) {
            console.error(`Failed to create scene '${id}':`, error);
            return null;
        }
    }
    
    /**
     * Change to a different scene
     * @param {string} id - Scene identifier
     * @param {Object} params - Parameters to pass to the scene
     * @param {Object} options - Options for scene transition
     * @returns {Promise} Resolves when scene change is complete
     */
    async changeScene(id, params = {}, options = {}) {
        // Check if the scene exists
        if (!this.scenes.has(id)) {
            console.error(`Cannot change to scene '${id}': Scene not found`);
            return false;
        }
        
        // Check if we're already in this scene
        if (id === this.activeSceneId && !options.forceReload) {
            console.warn(`Already in scene '${id}'`);
            return true;
        }
        
        // Check if already transitioning
        if (this.isTransitioning) {
            console.warn('Scene transition already in progress');
            return false;
        }
        
        try {
            // Emit scene change start event
            this.engine.events.emit('scene:changeStart', {
                fromId: this.activeSceneId,
                toId: id,
                params
            });
            
            // Create the new scene instance
            const newScene = this._createSceneInstance(id);
            
            if (!newScene) {
                throw new Error(`Failed to create scene instance for '${id}'`);
            }
            
            // Store the current scene for the transition
            const previousScene = this.activeScene;
            const previousSceneId = this.activeSceneId;
            
            // Check if we should use a transition effect
            const useTransition = options.transition !== false;
            const transitionDuration = options.transitionDuration || this.defaultTransitionDuration;
            
            if (useTransition && previousScene) {
                // Start the transition
                this.isTransitioning = true;
                this.transitionProgress = 0;
                this.transitionDuration = transitionDuration;
                this.transitionStartTime = performance.now();
                this.transitionFromScene = previousScene;
                this.transitionToScene = newScene;
                
                // Initialize the new scene
                await newScene.init(params);
                
                // Start the new scene (will be rendered during transition)
                await newScene.start(params);
                
                // Let the transition run its course
                // This will be updated in the update method
                return true;
            }
            
            // No transition - unload previous scene if it exists
            if (previousScene) {
                await previousScene.shutdown();
            }
            
            // Initialize the new scene
            await newScene.init(params);
            
            // Set as active scene
            this.activeScene = newScene;
            this.activeSceneId = id;
            
            // Start the new scene
            await newScene.start(params);
            
            // Emit scene change complete event
            this.engine.events.emit('scene:changeComplete', {
                fromId: previousSceneId,
                toId: id,
                params
            });
            
            console.log(`Changed to scene: ${id}`);
            return true;
        } catch (error) {
            console.error(`Failed to change to scene '${id}':`, error);
            
            // Emit scene change error event
            this.engine.events.emit('scene:changeError', {
                fromId: this.activeSceneId,
                toId: id,
                error
            });
            
            return false;
        }
    }
    
    /**
     * Reload the current scene
     * @param {Object} params - Parameters to pass to the scene
     * @returns {Promise} Resolves when scene reload is complete
     */
    async reloadScene(params = {}) {
        if (!this.activeSceneId) {
            console.warn('No active scene to reload');
            return false;
        }
        
        return this.changeScene(this.activeSceneId, params, { forceReload: true });
    }
    
    /**
     * Update the scene manager and active scene
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Handle scene transitions
        if (this.isTransitioning) {
            this._updateTransition(deltaTime);
        }
        
        // Update the active scene
        if (this.activeScene && typeof this.activeScene.update === 'function') {
            this.activeScene.update(deltaTime);
        }
    }
    
    /**
     * Update scene transition progress
     * @param {number} deltaTime - Time since last update in seconds
     * @private
     */
    _updateTransition(deltaTime) {
        const now = performance.now();
        const elapsed = now - this.transitionStartTime;
        this.transitionProgress = Math.min(1, elapsed / this.transitionDuration);
        
        // Emit transition progress event
        this.engine.events.emit('scene:transitionProgress', {
            progress: this.transitionProgress,
            fromId: this.transitionFromScene ? this.activeSceneId : null,
            toId: this.transitionToScene ? this.transitionToScene.id : null
        });
        
        // Check if transition is complete
        if (this.transitionProgress >= 1) {
            this._completeTransition();
        }
    }
    
    /**
     * Complete the scene transition
     * @private
     */
    async _completeTransition() {
        if (!this.isTransitioning) return;
        
        try {
            // Store previous scene info for event
            const previousSceneId = this.activeSceneId;
            
            // Shut down the previous scene
            if (this.transitionFromScene) {
                await this.transitionFromScene.shutdown();
            }
            
            // Set the new scene as active
            this.activeScene = this.transitionToScene;
            this.activeSceneId = this.activeScene.id;
            
            // Reset transition state
            this.isTransitioning = false;
            this.transitionFromScene = null;
            this.transitionToScene = null;
            
            // Emit scene change complete event
            this.engine.events.emit('scene:changeComplete', {
                fromId: previousSceneId,
                toId: this.activeSceneId
            });
            
            console.log(`Transition complete to scene: ${this.activeSceneId}`);
        } catch (error) {
            console.error('Error completing scene transition:', error);
            
            // Reset transition state
            this.isTransitioning = false;
            this.transitionFromScene = null;
            this.transitionToScene = null;
            
            // Emit error event
            this.engine.events.emit('scene:transitionError', {
                error
            });
        }
    }
    
    /**
     * Get the current active scene
     * @returns {Object|null} Current scene or null if none
     */
    getActiveScene() {
        return this.activeScene;
    }
    
    /**
     * Check if a scene with the given ID exists
     * @param {string} id - Scene identifier
     * @returns {boolean} Whether the scene exists
     */
    hasScene(id) {
        return this.scenes.has(id);
    }
    
    /**
     * Get all registered scene IDs
     * @returns {Array} Array of scene IDs
     */
    getSceneIds() {
        return Array.from(this.scenes.keys());
    }
    
    /**
     * Get the transition progress
     * @returns {number} Progress from 0 to 1
     */
    getTransitionProgress() {
        return this.transitionProgress;
    }
    
    /**
     * Check if a scene transition is in progress
     * @returns {boolean} Whether a transition is in progress
     */
    isTransitionInProgress() {
        return this.isTransitioning;
    }
}

/**
 * Base Scene class - extend this to create game scenes
 */
export class Scene {
    /**
     * @constructor
     * @param {Object} engine - Reference to the main engine instance
     */
    constructor(engine) {
        this.engine = engine;
        this.id = null; // Should be set by derived classes
    }
    
    /**
     * Initialize the scene
     * @param {Object} params - Parameters passed to the scene
     * @returns {Promise} Resolves when initialization is complete
     */
    async init(params) {
        // Implement in derived classes
        return true;
    }
    
    /**
     * Start the scene
     * @param {Object} params - Parameters passed to the scene
     * @returns {Promise} Resolves when start is complete
     */
    async start(params) {
        // Implement in derived classes
        return true;
    }
    
    /**
     * Update the scene
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Implement in derived classes
    }
    
    /**
     * Render the scene
     * @param {number} deltaTime - Time since last render in seconds
     */
    render(deltaTime) {
        // Implement in derived classes
    }
    
    /**
     * Pause the scene
     */
    pause() {
        // Implement in derived classes
    }
    
    /**
     * Resume the scene
     */
    resume() {
        // Implement in derived classes
    }
    
    /**
     * Shutdown the scene
     * @returns {Promise} Resolves when shutdown is complete
     */
    async shutdown() {
        // Implement in derived classes
        return true;
    }
}