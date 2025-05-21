/**
 * RenderSystem - Handles rendering of 2D and 3D graphics
 */

// Import Three.js for 3D rendering
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export class RenderSystem {
    /**
     * @constructor
     * @param {Object} engine - Reference to the main engine instance
     */
    constructor(engine) {
        this.engine = engine;
        
        // Canvas reference
        this.canvas = null;
        
        // Renderers
        this.renderer2D = null;  // Canvas 2D context
        this.renderer3D = null;  // THREE.WebGLRenderer
        
        // Active renderer (2D or 3D)
        this.activeRenderer = null;
        
        // 3D rendering properties
        this.scene = null;
        this.camera = null;
        this.controls = null;
        this.composer = null;
        
        // Post-processing enabled
        this.postProcessingEnabled = false;
        
        // Render settings
        this.clearColor = '#000000';
        this.rendererType = '3d'; // '2d' or '3d'
        
        // Screen dimensions
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Bind methods
        this._handleResize = this._handleResize.bind(this);
    }
    
    /**
     * Initialize the rendering system
     * @returns {Promise} Resolves when initialization is complete
     */
    async init() {
        try {
            // Get the canvas element
            this.canvas = document.getElementById('game-canvas');
            if (!this.canvas) {
                throw new Error('Game canvas element not found');
            }
            
            // Get render settings from config
            this.rendererType = this.engine.configManager.getValue('renderer.type', '3d');
            this.clearColor = this.engine.configManager.getValue('renderer.clearColor', '#000000');
            
            // Initialize the appropriate renderer
            if (this.rendererType === '2d') {
                await this._init2DRenderer();
            } else {
                await this._init3DRenderer();
            }
            
            // Register window resize event
            window.addEventListener('resize', this._handleResize);
            
            // Listen for renderer type changes
            this.engine.events.on('config:changed:renderer.type', (value) => {
                this.setRendererType(value);
            });
            
            // Listen for clear color changes
            this.engine.events.on('config:changed:renderer.clearColor', (value) => {
                this.setClearColor(value);
            });
            
            console.log(`RenderSystem initialized with ${this.rendererType} renderer`);
            return true;
        } catch (error) {
            console.error('Failed to initialize RenderSystem:', error);
            return false;
        }
    }
    
    /**
     * Initialize the 2D renderer
     * @private
     */
    async _init2DRenderer() {
        this.renderer2D = this.canvas.getContext('2d');
        
        if (!this.renderer2D) {
            throw new Error('Failed to get 2D rendering context');
        }
        
        // Set the canvas dimensions
        this._updateCanvasSize();
        
        // Set the active renderer
        this.activeRenderer = '2d';
        
        // Set the clear color
        this.setClearColor(this.clearColor);
    }
    
    /**
     * Initialize the 3D renderer
     * @private
     */
    async _init3DRenderer() {
        // Create a Three.js scene
        this.scene = new THREE.Scene();
        
        // Create a camera
        const aspect = this.width / this.height;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.z = 5;
        
        // Create a WebGL renderer
        const antialias = this.engine.configManager.getValue('renderer.antialias', true);
        this.renderer3D = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: antialias,
            alpha: true
        });
        
        // Set renderer size and pixel ratio
        const pixelRatio = this.engine.configManager.getValue('renderer.pixelRatio', window.devicePixelRatio || 1);
        this.renderer3D.setSize(this.width, this.height);
        this.renderer3D.setPixelRatio(pixelRatio);
        
        // Set the clear color
        this.setClearColor(this.clearColor);
        
        // Setup orbit controls for camera manipulation
        this.controls = new OrbitControls(this.camera, this.renderer3D.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.25;
        
        // Setup post-processing pipeline
        this._setupPostProcessing();
        
        // Set the active renderer
        this.activeRenderer = '3d';
        
        // Add some default lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
    }
    
    /**
     * Setup post-processing effects
     * @private
     */
    _setupPostProcessing() {
        const ppQuality = this.engine.configManager.getValue('renderer.postProcessing', 'medium');
        
        // Skip if post-processing is disabled
        if (ppQuality === 'off') {
            this.postProcessingEnabled = false;
            return;
        }
        
        // Create composer
        this.composer = new EffectComposer(this.renderer3D);
        
        // Add render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Add bloom pass with quality-dependent settings
        let bloomStrength = 0.5;
        let bloomRadius = 0.4;
        let threshold = 0.85;
        
        switch (ppQuality) {
            case 'low':
                bloomStrength = 0.3;
                bloomRadius = 0.2;
                threshold = 0.9;
                break;
            case 'high':
                bloomStrength = 0.7;
                bloomRadius = 0.6;
                threshold = 0.8;
                break;
        }
        
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height),
            bloomStrength,
            bloomRadius,
            threshold
        );
        this.composer.addPass(bloomPass);
        
        this.postProcessingEnabled = true;
    }
    
    /**
     * Set the renderer type (2D or 3D)
     * @param {string} type - Renderer type ('2d' or '3d')
     */
    async setRendererType(type) {
        if (type !== '2d' && type !== '3d') {
            console.error(`Invalid renderer type: ${type}`);  
            return;
        }
        
        if (type === this.activeRenderer) {
            return; // Already using this renderer
        }
        
        // Initialize the new renderer
        if (type === '2d' && !this.renderer2D) {
            await this._init2DRenderer();
        } else if (type === '3d' && !this.renderer3D) {
            await this._init3DRenderer();
        }
        
        // Update config
        this.engine.configManager.setValue('renderer.type', type, false);
        
        // Set the active renderer
        this.activeRenderer = type;
        this.rendererType = type;
        
        console.log(`Switched to ${type} renderer`);
    }
    
    /**
     * Set the clear color
     * @param {string} color - CSS color string
     */
    setClearColor(color) {
        this.clearColor = color;
        
        if (this.activeRenderer === '2d' && this.renderer2D) {
            // For 2D, we'll use the clear color when clearing the canvas
        } else if (this.activeRenderer === '3d' && this.renderer3D) {
            // For 3D, set the renderer clear color
            this.renderer3D.setClearColor(new THREE.Color(color));
            if (this.scene) {
                this.scene.background = new THREE.Color(color);
            }
        }
        
        // Update config
        this.engine.configManager.setValue('renderer.clearColor', color, false);
    }
    
    /**
     * Add an object to the 3D scene
     * @param {Object} object - Three.js object to add
     */
    addToScene(object) {
        if (this.activeRenderer !== '3d' || !this.scene) {
            console.warn('Cannot add object to scene: 3D renderer not active');
            return;
        }
        
        this.scene.add(object);
    }
    
    /**
     * Remove an object from the 3D scene
     * @param {Object} object - Three.js object to remove
     */
    removeFromScene(object) {
        if (this.activeRenderer !== '3d' || !this.scene) {
            console.warn('Cannot remove object from scene: 3D renderer not active');
            return;
        }
        
        this.scene.remove(object);
    }
    
    /**
     * Clear the entire scene (for 3D) or canvas (for 2D)
     */
    clear() {
        if (this.activeRenderer === '2d' && this.renderer2D) {
            this.renderer2D.clearRect(0, 0, this.width, this.height);
        } else if (this.activeRenderer === '3d' && this.scene) {
            // Remove all objects from the scene except lights and camera
            while (this.scene.children.length > 0) {
                const object = this.scene.children[0];
                if (object instanceof THREE.Light || object instanceof THREE.Camera) {
                    // Skip lights and cameras
                    this.scene.children.splice(0, 1);
                    this.scene.children.push(object);
                } else {
                    this.scene.remove(object);
                }
            }
        }
    }
    
    /**
     * Render the scene
     * @param {number} deltaTime - Time since last render in seconds
     */
    render(deltaTime) {
        if (this.activeRenderer === '2d' && this.renderer2D) {
            // Clear the canvas
            this.renderer2D.fillStyle = this.clearColor;
            this.renderer2D.fillRect(0, 0, this.width, this.height);
            
            // Render 2D content
            this._render2D(deltaTime);
        } else if (this.activeRenderer === '3d') {
            // Update orbit controls
            if (this.controls) {
                this.controls.update();
            }
            
            // Render 3D content
            this._render3D(deltaTime);
        }
    }
    
    /**
     * Render 2D content
     * @param {number} deltaTime - Time since last render in seconds
     * @private
     */
    _render2D(deltaTime) {
        // This would typically iterate through a list of sprites or other 2D objects
        // and draw them to the canvas
        
        // For demonstration, we'll draw a simple spinning rectangle
        const ctx = this.renderer2D;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const size = 100;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.engine.time.elapsedTime);
        
        ctx.fillStyle = '#3498db';
        ctx.fillRect(-size / 2, -size / 2, size, size);
        
        ctx.restore();
        
        // Draw debug info if enabled
        if (this.engine.debugMode) {
            this._drawDebugInfo();
        }
    }
    
    /**
     * Render 3D content
     * @param {number} deltaTime - Time since last render in seconds
     * @private
     */
    _render3D(deltaTime) {
        if (!this.renderer3D || !this.scene || !this.camera) return;
        
        // Use post-processing if enabled
        if (this.postProcessingEnabled && this.composer) {
            this.composer.render();
        } else {
            this.renderer3D.render(this.scene, this.camera);
        }
    }
    
    /**
     * Draw debug information on the canvas
     * @private
     */
    _drawDebugInfo() {
        if (this.activeRenderer !== '2d' || !this.renderer2D) return;
        
        const ctx = this.renderer2D;
        const fps = this.engine.time.fps;
        const elapsedTime = this.engine.time.elapsedTime.toFixed(2);
        
        ctx.font = '14px monospace';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        ctx.fillText(`FPS: ${fps}`, 10, 10);
        ctx.fillText(`Time: ${elapsedTime}s`, 10, 30);
        ctx.fillText(`Renderer: ${this.activeRenderer}`, 10, 50);
        ctx.fillText(`Canvas: ${this.width}x${this.height}`, 10, 70);
    }
    
    /**
     * Handle window resize event
     * @private
     */
    _handleResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Update canvas size
        this._updateCanvasSize();
        
        // Update 3D renderer if active
        if (this.activeRenderer === '3d' && this.renderer3D) {
            this.renderer3D.setSize(this.width, this.height);
            
            // Update camera aspect ratio
            if (this.camera) {
                this.camera.aspect = this.width / this.height;
                this.camera.updateProjectionMatrix();
            }
            
            // Update composer if using post-processing
            if (this.postProcessingEnabled && this.composer) {
                this.composer.setSize(this.width, this.height);
            }
        }
        
        // Emit resize event
        this.engine.events.emit('renderer:resize', { width: this.width, height: this.height });
    }
    
    /**
     * Update the canvas size
     * @private
     */
    _updateCanvasSize() {
        if (!this.canvas) return;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    
    /**
     * Create a 3D cube and add it to the scene
     * This is a utility method for testing
     */
    createTestCube() {
        if (this.activeRenderer !== '3d' || !this.scene) {
            console.warn('Cannot create test cube: 3D renderer not active');
            return;
        }
        
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x3498db });
        const cube = new THREE.Mesh(geometry, material);
        
        this.scene.add(cube);
        
        // Animate the cube
        const animate = () => {
            if (!this.scene.children.includes(cube)) return;
            
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            
            requestAnimationFrame(animate);
        };
        
        animate();
        
        return cube;
    }
}