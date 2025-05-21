/**
 * MMORPGine - Core Engine Class
 * Serves as the main entry point for the game engine.
 */
 
import { RenderSystem } from '../systems/RenderSystem.js';
import { InputSystem } from '../systems/InputSystem.js';
import { AssetManager } from '../managers/AssetManager.js';
import { UIManager } from '../managers/UIManager.js';
import { SceneManager } from '../managers/SceneManager.js';
import { EntityManager } from '../managers/EntityManager.js';
import { NetworkManager } from '../managers/NetworkManager.js';
import { ConfigManager } from '../managers/ConfigManager.js';
import { EventEmitter } from '../utils/EventEmitter.js';
import { Time } from '../utils/Time.js';
 
export class Engine {
    /**
     * @constructor
     * @param {Object} config - Engine configuration options
     */
    constructor(config = {}) {
        // Create an event system for the engine
        this.events = new EventEmitter();
        
        // Time management
        this.time = new Time();
        
        // Configuration system
        this.configManager = new ConfigManager(config);
        
        // Create core managers
        this.assetManager = new AssetManager(this);
        this.sceneManager = new SceneManager(this);
        this.entityManager = new EntityManager(this);
        this.networkManager = new NetworkManager(this);
        this.uiManager = new UIManager(this);
        
        // Create core systems
        this.renderSystem = new RenderSystem(this);
        this.inputSystem = new InputSystem(this);
        
        // Engine state
        this.isRunning = false;
        this.isPaused = false;
        this.debugMode = this.configManager.getValue('debugMode', false);
        
        // Register event listeners
        this._registerEvents();
        
        // Log initialization
        console.log('MMORPGine initialized');
    }
    
    /**
     * Initialize the engine
     * @returns {Promise} Resolves when engine is fully initialized
     */
    async init() {
        console.log('Initializing MMORPGine...');
        
        try {
            // Initialize all systems in sequence
            await this.configManager.init();
            await this.assetManager.init();
            await this.renderSystem.init();
            await this.inputSystem.init();
            await this.sceneManager.init();
            await this.entityManager.init();
            await this.networkManager.init();
            await this.uiManager.init();
            
            this.events.emit('engine:initialized');
            console.log('MMORPGine initialization complete');
            return true;
        } catch (error) {
            console.error('Failed to initialize engine:', error);
            this.events.emit('engine:error', error);
            return false;
        }
    }
    
    /**
     * Start the engine main loop
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.time.start();
        this.events.emit('engine:start');
        
        // Start the main loop
        this._loop();
        
        console.log('MMORPGine started');
    }
    
    /**
     * Pause the engine
     */
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        this.time.pause();
        this.events.emit('engine:pause');
        
        console.log('MMORPGine paused');
    }
    
    /**
     * Resume the engine from a paused state
     */
    resume() {
        if (!this.isRunning || !this.isPaused) return;
        
        this.isPaused = false;
        this.time.resume();
        this.events.emit('engine:resume');
        
        console.log('MMORPGine resumed');
    }
    
    /**
     * Stop the engine
     */
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.isPaused = false;
        this.time.stop();
        this.events.emit('engine:stop');
        
        console.log('MMORPGine stopped');
    }
    
    /**
     * Toggle debug mode
     */
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        this.configManager.setValue('debugMode', this.debugMode);
        this.events.emit('engine:debugMode', this.debugMode);
        
        console.log(`Debug mode ${this.debugMode ? 'enabled' : 'disabled'}`);
        
        // Show/hide debug UI
        if (this.uiManager) {
            this.uiManager.toggleDebugUI(this.debugMode);
        }
    }
    
    /**
     * Private method for the main engine loop
     * @private
     */
    _loop() {
        if (!this.isRunning) return;
        
        // Request next frame
        requestAnimationFrame(() => this._loop());
        
        // Skip updates if paused
        if (this.isPaused) return;
        
        // Update time
        this.time.update();
        
        // Get delta time
        const deltaTime = this.time.deltaTime;
        
        // Update all systems
        this.events.emit('engine:preUpdate', deltaTime);
        this.update(deltaTime);
        this.events.emit('engine:postUpdate', deltaTime);
        
        // Render
        this.events.emit('engine:preRender', deltaTime);
        this.render(deltaTime);
        this.events.emit('engine:postRender', deltaTime);
    }
    
    /**
     * Update all engine systems
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update core systems
        this.inputSystem.update(deltaTime);
        this.networkManager.update(deltaTime);
        this.entityManager.update(deltaTime);
        this.sceneManager.update(deltaTime);
        this.uiManager.update(deltaTime);
    }
    
    /**
     * Render the current scene
     * @param {number} deltaTime - Time since last render in seconds
     */
    render(deltaTime) {
        this.renderSystem.render(deltaTime);
    }
    
    /**
     * Register internal event handlers
     * @private
     */
    _registerEvents() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.events.emit('window:resize', {
                width: window.innerWidth,
                height: window.innerHeight
            });
        });
        
        // Handle visibility change for auto-pausing
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.isRunning && !this.isPaused && this.configManager.getValue('autoPause', true)) {
                    this.pause();
                    this._wasAutoPaused = true;
                }
            } else {
                if (this.isRunning && this.isPaused && this._wasAutoPaused) {
                    this.resume();
                    this._wasAutoPaused = false;
                }
            }
        });
    }
}
 
// Export as a global for easier access
window.MMORPGine = { Engine };