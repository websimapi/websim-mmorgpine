/**
 * InputSystem - Handles user input from keyboard, mouse, touch, and gamepad
 */
export class InputSystem {
    /**
     * @constructor
     * @param {Object} engine - Reference to the main engine instance
     */
    constructor(engine) {
        this.engine = engine;
        
        // Input state
        this.keys = new Map();         // Keyboard keys
        this.mouseButtons = new Map(); // Mouse buttons
        this.touches = new Map();      // Touch points
        this.gamepads = new Map();     // Connected gamepads
        
        // Mouse position
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseMovement = { x: 0, y: 0 };
        
        // Input settings
        this.mouseSensitivity = 1.0;
        this.gamepadDeadzone = 0.25;
        
        // Locked mouse state
        this.isMouseLocked = false;
        
        // Canvas reference for coordinates
        this.canvas = null;
        
        // Listen for settings changes
        if (this.engine.configManager) {
            this.mouseSensitivity = this.engine.configManager.getValue('input.mouseSensitivity', 1.0);
            this.gamepadDeadzone = this.engine.configManager.getValue('input.gamepadDeadzone', 0.25);
        }
        
        // Bind event handlers
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseWheel = this._onMouseWheel.bind(this);
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._onGamepadConnected = this._onGamepadConnected.bind(this);
        this._onGamepadDisconnected = this._onGamepadDisconnected.bind(this);
        this._onContextMenu = this._onContextMenu.bind(this);
        this._onBlur = this._onBlur.bind(this);
    }
    
    /**
     * Initialize the input system
     * @returns {Promise} Resolves when initialization is complete
     */
    async init() {
        try {
            // Get canvas reference for mouse coordinates
            this.canvas = document.getElementById('game-canvas');
            
            if (!this.canvas) {
                console.warn('Game canvas element not found for input system');
            }
            
            // Set up event listeners
            this._setupEventListeners();
            
            // Listen for settings changes
            this.engine.events.on('config:changed:input.mouseSensitivity', (value) => {
                this.mouseSensitivity = value;
            });
            
            this.engine.events.on('config:changed:input.gamepadDeadzone', (value) => {
                this.gamepadDeadzone = value;
            });
            
            console.log('InputSystem initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize InputSystem:', error);
            return false;
        }
    }
    
    /**
     * Update the input system state
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update gamepad state
        this._updateGamepads();
    }
    
    /**
     * Check if a keyboard key is currently pressed
     * @param {string} key - Key code or name
     * @returns {boolean} Whether the key is pressed
     */
    isKeyPressed(key) {
        return this.keys.get(key.toLowerCase()) === true;
    }
    
    /**
     * Check if a mouse button is currently pressed
     * @param {number} button - Mouse button (0: left, 1: middle, 2: right)
     * @returns {boolean} Whether the button is pressed
     */
    isMouseButtonPressed(button) {
        return this.mouseButtons.get(button) === true;
    }
    
    /**
     * Get the current mouse position relative to the canvas
     * @returns {Object} Object with x and y properties
     */
    getMousePosition() {
        return { x: this.mouseX, y: this.mouseY };
    }
    
    /**
     * Get the gamepad axis value with deadzone applied
     * @param {number} gamepadIndex - Index of the gamepad
     * @param {number} axisIndex - Index of the axis
     * @returns {number} Axis value from -1 to 1, or 0 if no gamepad
     */
    getGamepadAxis(gamepadIndex, axisIndex) {
        const gamepad = this.gamepads.get(gamepadIndex);
        if (!gamepad || !gamepad.axes || axisIndex >= gamepad.axes.length) {
            return 0;
        }
        
        // Apply deadzone
        const value = gamepad.axes[axisIndex];
        return Math.abs(value) < this.gamepadDeadzone ? 0 : value;
    }
    
    /**
     * Check if a gamepad button is pressed
     * @param {number} gamepadIndex - Index of the gamepad
     * @param {number} buttonIndex - Index of the button
     * @returns {boolean} Whether the button is pressed
     */
    isGamepadButtonPressed(gamepadIndex, buttonIndex) {
        const gamepad = this.gamepads.get(gamepadIndex);
        if (!gamepad || !gamepad.buttons || buttonIndex >= gamepad.buttons.length) {
            return false;
        }
        
        return gamepad.buttons[buttonIndex].pressed;
    }
    
    /**
     * Request pointer lock on the canvas
     */
    lockMouse() {
        if (!this.canvas) return;
        
        if (this.canvas.requestPointerLock) {
            this.canvas.requestPointerLock();
        }
    }
    
    /**
     * Exit pointer lock
     */
    unlockMouse() {
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
    }
    
    /**
     * Toggle pointer lock
     */
    toggleMouseLock() {
        if (this.isMouseLocked) {
            this.unlockMouse();
        } else {
            this.lockMouse();
        }
    }
    
    /**
     * Set up event listeners
     * @private
     */
    _setupEventListeners() {
        // Keyboard events
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
        
        // Mouse events
        window.addEventListener('mousedown', this._onMouseDown);
        window.addEventListener('mouseup', this._onMouseUp);
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('wheel', this._onMouseWheel);
        window.addEventListener('contextmenu', this._onContextMenu);
        
        // Touch events
        if (this.canvas) {
            this.canvas.addEventListener('touchstart', this._onTouchStart);
            this.canvas.addEventListener('touchend', this._onTouchEnd);
            this.canvas.addEventListener('touchmove', this._onTouchMove);
        }
        
        // Gamepad events
        window.addEventListener('gamepadconnected', this._onGamepadConnected);
        window.addEventListener('gamepaddisconnected', this._onGamepadDisconnected);
        
        // Pointer lock change events
        document.addEventListener('pointerlockchange', () => {
            this.isMouseLocked = document.pointerLockElement === this.canvas;
            this.engine.events.emit('input:pointerLockChange', this.isMouseLocked);
        });
        
        // Window blur event (to reset input state when window loses focus)
        window.addEventListener('blur', this._onBlur);
    }
    
    /**
     * Update gamepad state
     * @private
     */
    _updateGamepads() {
        // Get all connected gamepads
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        
        // Update our gamepad map
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            
            if (gamepad) {
                // Store the gamepad state
                this.gamepads.set(gamepad.index, gamepad);
            }
        }
    }
    
    /**
     * Reset all input state (when window loses focus)
     * @private
     */
    _resetState() {
        // Clear key states
        this.keys.clear();
        
        // Clear mouse button states
        this.mouseButtons.clear();
        
        // Clear touch states
        this.touches.clear();
        
        // Reset mouse movement
        this.mouseMovement = { x: 0, y: 0 };
    }
    
    /**
     * Convert screen coordinates to canvas coordinates
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {Object} Object with x and y properties in canvas space
     * @private
     */
    _screenToCanvas(screenX, screenY) {
        if (!this.canvas) {
            return { x: screenX, y: screenY };
        }
        
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: screenX - rect.left,
            y: screenY - rect.top
        };
    }
    
    /**
     * Handle keydown event
     * @param {Event} event - Keydown event
     * @private
     */
    _onKeyDown(event) {
        const key = event.key.toLowerCase();
        this.keys.set(key, true);
        
        this.engine.events.emit('input:keyDown', { key, event });
    }
    
    /**
     * Handle keyup event
     * @param {Event} event - Keyup event
     * @private
     */
    _onKeyUp(event) {
        const key = event.key.toLowerCase();
        this.keys.set(key, false);
        
        this.engine.events.emit('input:keyUp', { key, event });
    }
    
    /**
     * Handle mousedown event
     * @param {Event} event - Mousedown event
     * @private
     */
    _onMouseDown(event) {
        const button = event.button;
        this.mouseButtons.set(button, true);
        
        // Update coordinates
        const coords = this._screenToCanvas(event.clientX, event.clientY);
        this.mouseX = coords.x;
        this.mouseY = coords.y;
        
        this.engine.events.emit('input:mouseDown', { 
            button, 
            x: this.mouseX, 
            y: this.mouseY, 
            event 
        });
    }
    
    /**
     * Handle mouseup event
     * @param {Event} event - Mouseup event
     * @private
     */
    _onMouseUp(event) {
        const button = event.button;
        this.mouseButtons.set(button, false);
        
        // Update coordinates
        const coords = this._screenToCanvas(event.clientX, event.clientY);
        this.mouseX = coords.x;
        this.mouseY = coords.y;
        
        this.engine.events.emit('input:mouseUp', { 
            button, 
            x: this.mouseX, 
            y: this.mouseY, 
            event 
        });
    }
    
    /**
     * Handle mousemove event
     * @param {Event} event - Mousemove event
     * @private
     */
    _onMouseMove(event) {
        // Calculate movement with sensitivity applied
        let movementX = event.movementX || 0;
        let movementY = event.movementY || 0;
        
        // Apply sensitivity
        movementX *= this.mouseSensitivity;
        movementY *= this.mouseSensitivity;
        
        this.mouseMovement = { x: movementX, y: movementY };
        
        // Update coordinates
        const coords = this._screenToCanvas(event.clientX, event.clientY);
        this.mouseX = coords.x;
        this.mouseY = coords.y;
        
        this.engine.events.emit('input:mouseMove', { 
            x: this.mouseX, 
            y: this.mouseY, 
            movementX, 
            movementY,
            event 
        });
    }
    
    /**
     * Handle mouse wheel event
     * @param {Event} event - Wheel event
     * @private
     */
    _onMouseWheel(event) {
        const delta = Math.sign(event.deltaY);
        
        this.engine.events.emit('input:mouseWheel', { 
            delta, 
            x: this.mouseX, 
            y: this.mouseY, 
            event 
        });
    }
    
    /**
     * Handle touchstart event
     * @param {Event} event - Touchstart event
     * @private
     */
    _onTouchStart(event) {
        // Prevent default to avoid scrolling on mobile
        event.preventDefault();
        
        // Store each touch point
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            const coords = this._screenToCanvas(touch.clientX, touch.clientY);
            
            this.touches.set(touch.identifier, { 
                id: touch.identifier,
                x: coords.x, 
                y: coords.y, 
                startX: coords.x, 
                startY: coords.y 
            });
        }
        
        // If this is the first touch, also update mouse position for convenience
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            const coords = this._screenToCanvas(touch.clientX, touch.clientY);
            this.mouseX = coords.x;
            this.mouseY = coords.y;
        }
        
        this.engine.events.emit('input:touchStart', { 
            touches: Array.from(this.touches.values()), 
            event 
        });
    }
    
    /**
     * Handle touchend event
     * @param {Event} event - Touchend event
     * @private
     */
    _onTouchEnd(event) {
        // Prevent default to avoid scrolling on mobile
        event.preventDefault();
        
        // Remove ended touches
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            this.touches.delete(touch.identifier);
        }
        
        this.engine.events.emit('input:touchEnd', { 
            touches: Array.from(this.touches.values()), 
            event 
        });
    }
    
    /**
     * Handle touchmove event
     * @param {Event} event - Touchmove event
     * @private
     */
    _onTouchMove(event) {
        // Prevent default to avoid scrolling on mobile
        event.preventDefault();
        
        // Update touch positions
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            const existingTouch = this.touches.get(touch.identifier);
            
            if (existingTouch) {
                const coords = this._screenToCanvas(touch.clientX, touch.clientY);
                existingTouch.x = coords.x;
                existingTouch.y = coords.y;
            }
        }
        
        // If tracking a single touch, also update mouse position for convenience
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            const coords = this._screenToCanvas(touch.clientX, touch.clientY);
            this.mouseX = coords.x;
            this.mouseY = coords.y;
        }
        
        this.engine.events.emit('input:touchMove', { 
            touches: Array.from(this.touches.values()), 
            event 
        });
    }
    
    /**
     * Handle gamepad connected event
     * @param {Event} event - Gamepad event
     * @private
     */
    _onGamepadConnected(event) {
        const gamepad = event.gamepad;
        this.gamepads.set(gamepad.index, gamepad);
        
        console.log(`Gamepad connected: ${gamepad.id} (index ${gamepad.index})`);
        
        this.engine.events.emit('input:gamepadConnected', { 
            gamepad, 
            index: gamepad.index 
        });
    }
    
    /**
     * Handle gamepad disconnected event
     * @param {Event} event - Gamepad event
     * @private
     */
    _onGamepadDisconnected(event) {
        const gamepad = event.gamepad;
        this.gamepads.delete(gamepad.index);
        
        console.log(`Gamepad disconnected: ${gamepad.id} (index ${gamepad.index})`);
        
        this.engine.events.emit('input:gamepadDisconnected', { 
            gamepad, 
            index: gamepad.index 
        });
    }
    
    /**
     * Handle context menu event (right click)
     * @param {Event} event - Context menu event
     * @private
     */
    _onContextMenu(event) {
        // Prevent the context menu by default
        // This can be overridden by returning true from a listener
        const shouldShowContextMenu = this.engine.events.emit('input:contextMenu', { event });
        
        if (!shouldShowContextMenu) {
            event.preventDefault();
        }
    }
    
    /**
     * Handle window blur event
     * @private
     */
    _onBlur() {
        // Reset all input state when window loses focus
        this._resetState();
        
        this.engine.events.emit('input:blur');
    }
    
    /**
     * Clean up event listeners (call when shutting down)
     */
    cleanup() {
        // Remove event listeners
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
        window.removeEventListener('mousedown', this._onMouseDown);
        window.removeEventListener('mouseup', this._onMouseUp);
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('wheel', this._onMouseWheel);
        window.removeEventListener('contextmenu', this._onContextMenu);
        window.removeEventListener('blur', this._onBlur);
        
        if (this.canvas) {
            this.canvas.removeEventListener('touchstart', this._onTouchStart);
            this.canvas.removeEventListener('touchend', this._onTouchEnd);
            this.canvas.removeEventListener('touchmove', this._onTouchMove);
        }
        
        window.removeEventListener('gamepadconnected', this._onGamepadConnected);
        window.removeEventListener('gamepaddisconnected', this._onGamepadDisconnected);
    }
}