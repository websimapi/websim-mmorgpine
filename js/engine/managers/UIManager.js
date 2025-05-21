/**
 * UIManager - Handles UI elements, HUD, menus, and UI events
 */
export class UIManager {
    /**
     * @constructor
     * @param {Object} engine - Reference to the main engine instance
     */
    constructor(engine) {
        this.engine = engine;
        
        // UI elements containers
        this.uiElements = new Map();
        this.uiPanels = new Map();
        
        // UI state
        this.activePanel = null;
        
        // UI overlay reference
        this.uiOverlay = null;
        
        // Specific UI panels
        this.editorPanel = null;
        this.debugPanel = null;
        this.assetPanel = null;
        
        // UI scale
        this.uiScale = 1.0;
        
        // UI theme
        this.theme = 'dark';
        
        // Debug visibility
        this.showDebugUI = false;
        
        // Custom UI style overrides
        this.styleOverrides = {};
    }
    
    /**
     * Initialize the UI manager
     * @returns {Promise} Resolves when initialization is complete
     */
    async init() {
        try {
            // Get UI references
            this.uiOverlay = document.getElementById('ui-overlay');
            this.editorPanel = document.getElementById('editor-panel');
            this.debugPanel = document.getElementById('debug-panel');
            this.assetPanel = document.getElementById('asset-panel');
            
            // Get UI settings from config
            if (this.engine.configManager) {
                this.uiScale = this.engine.configManager.getValue('ui.scale', 1.0);
                this.theme = this.engine.configManager.getValue('ui.theme', 'dark');
                this.showDebugUI = this.engine.configManager.getValue('ui.showDebugUI', false);
            }
            
            // Apply UI scale
            this._applyUIScale();
            
            // Apply theme
            this._applyTheme();
            
            // Initialize UI panels
            this._initPanels();
            
            // Add event listeners
            this._setupEventListeners();
            
            // Show/hide debug UI based on debug mode
            this.toggleDebugUI(this.engine.debugMode);
            
            // Show the UI overlay
            if (this.uiOverlay) {
                this.uiOverlay.classList.remove('hidden');
            }
            
            console.log('UIManager initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize UIManager:', error);
            return false;
        }
    }
    
    /**
     * Update the UI manager
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update FPS display if debug panel is visible
        if (this.showDebugUI && this.debugPanel && !this.debugPanel.classList.contains('hidden')) {
            this._updateDebugInfo();
        }
    }
    
    /**
     * Show a UI panel
     * @param {string} panelId - Panel identifier
     */
    showPanel(panelId) {
        const panel = this.uiPanels.get(panelId) || document.getElementById(panelId);
        
        if (!panel) {
            console.warn(`Panel not found: ${panelId}`);
            return;
        }
        
        // Hide currently active panel if it's different
        if (this.activePanel && this.activePanel !== panel) {
            this.activePanel.classList.add('hidden');
        }
        
        // Show the panel
        panel.classList.remove('hidden');
        this.activePanel = panel;
        
        // Emit panel show event
        this.engine.events.emit('ui:panelShow', { panelId });
    }
    
    /**
     * Hide a UI panel
     * @param {string} panelId - Panel identifier
     */
    hidePanel(panelId) {
        const panel = this.uiPanels.get(panelId) || document.getElementById(panelId);
        
        if (!panel) {
            console.warn(`Panel not found: ${panelId}`);
            return;
        }
        
        // Hide the panel
        panel.classList.add('hidden');
        
        // Clear active panel reference if this was the active one
        if (this.activePanel === panel) {
            this.activePanel = null;
        }
        
        // Emit panel hide event
        this.engine.events.emit('ui:panelHide', { panelId });
    }
    
    /**
     * Toggle a UI panel
     * @param {string} panelId - Panel identifier
     */
    togglePanel(panelId) {
        const panel = this.uiPanels.get(panelId) || document.getElementById(panelId);
        
        if (!panel) {
            console.warn(`Panel not found: ${panelId}`);
            return;
        }
        
        if (panel.classList.contains('hidden')) {
            this.showPanel(panelId);
        } else {
            this.hidePanel(panelId);
        }
    }
    
    /**
     * Create a UI element
     * @param {string} type - Element type (button, slider, etc.)
     * @param {Object} options - Element options
     * @returns {HTMLElement} Created element
     */
    createElement(type, options) {
        const element = document.createElement(options.tag || 'div');
        element.className = options.className || '';
        
        if (options.id) {
            element.id = options.id;
        }
        
        if (options.text) {
            element.textContent = options.text;
        }
        
        if (options.html) {
            element.innerHTML = options.html;
        }
        
        if (options.attributes) {
            for (const [attr, value] of Object.entries(options.attributes)) {
                element.setAttribute(attr, value);
            }
        }
        
        if (options.styles) {
            for (const [prop, value] of Object.entries(options.styles)) {
                element.style[prop] = value;
            }
        }
        
        if (options.events) {
            for (const [event, handler] of Object.entries(options.events)) {
                element.addEventListener(event, handler);
            }
        }
        
        // Handle specific element types
        switch (type.toLowerCase()) {
            case 'button':
                element.classList.add('button');
                break;
                
            case 'slider':
                element.classList.add('slider');
                // Create input range
                const input = document.createElement('input');
                input.type = 'range';
                input.min = options.min !== undefined ? options.min : 0;
                input.max = options.max !== undefined ? options.max : 100;
                input.step = options.step !== undefined ? options.step : 1;
                input.value = options.value !== undefined ? options.value : 50;
                
                if (options.onChange) {
                    input.addEventListener('input', (e) => {
                        options.onChange(parseFloat(e.target.value));
                    });
                }
                
                element.appendChild(input);
                break;
                
            case 'toggle':
                element.classList.add('toggle');
                // Create checkbox
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = options.checked || false;
                
                if (options.onChange) {
                    checkbox.addEventListener('change', (e) => {
                        options.onChange(e.target.checked);
                    });
                }
                
                element.appendChild(checkbox);
                break;
                
            case 'dropdown':
                element.classList.add('dropdown');
                // Create select element
                const select = document.createElement('select');
                
                // Add options
                if (options.options && Array.isArray(options.options)) {
                    options.options.forEach(opt => {
                        const option = document.createElement('option');
                        option.value = opt.value;
                        option.textContent = opt.label;
                        if (opt.value === options.value) {
                            option.selected = true;
                        }
                        select.appendChild(option);
                    });
                }
                
                if (options.onChange) {
                    select.addEventListener('change', (e) => {
                        options.onChange(e.target.value);
                    });
                }
                
                element.appendChild(select);
                break;
                
            case 'color':
                element.classList.add('color-picker');
                // Create color input
                const colorInput = document.createElement('input');
                colorInput.type = 'color';
                colorInput.value = options.value || '#000000';
                
                if (options.onChange) {
                    colorInput.addEventListener('input', (e) => {
                        options.onChange(e.target.value);
                    });
                }
                
                element.appendChild(colorInput);
                break;
        }
        
        // Store the element if it has an ID
        if (options.id) {
            this.uiElements.set(options.id, element);
        }
        
        // Append to parent if specified
        if (options.parent) {
            const parent = typeof options.parent === 'string'
                ? document.getElementById(options.parent)
                : options.parent;
                
            if (parent) {
                parent.appendChild(element);
            }
        }
        
        return element;
    }
    
    /**
     * Create a button
     * @param {Object} options - Button options
     * @returns {HTMLElement} Created button
     */
    createButton(options) {
        return this.createElement('button', {
            tag: 'button',
            className: 'button',
            ...options
        });
    }
    
    /**
     * Create a slider
     * @param {Object} options - Slider options
     * @returns {HTMLElement} Created slider
     */
    createSlider(options) {
        return this.createElement('slider', options);
    }
    
    /**
     * Create a toggle/checkbox
     * @param {Object} options - Toggle options
     * @returns {HTMLElement} Created toggle
     */
    createToggle(options) {
        return this.createElement('toggle', options);
    }
    
    /**
     * Create a dropdown/select
     * @param {Object} options - Dropdown options
     * @returns {HTMLElement} Created dropdown
     */
    createDropdown(options) {
        return this.createElement('dropdown', options);
    }
    
    /**
     * Create a color picker
     * @param {Object} options - Color picker options
     * @returns {HTMLElement} Created color picker
     */
    createColorPicker(options) {
        return this.createElement('color', options);
    }
    
    /**
     * Get a UI element by ID
     * @param {string} id - Element ID
     * @returns {HTMLElement|null} Element or null if not found
     */
    getElement(id) {
        return this.uiElements.get(id) || document.getElementById(id);
    }
    
    /**
     * Show or hide the debug UI
     * @param {boolean} show - Whether to show the debug UI
     */
    toggleDebugUI(show) {
        this.showDebugUI = show;
        
        if (this.debugPanel) {
            if (show) {
                this.debugPanel.classList.remove('hidden');
                this._updateDebugInfo(); // Initial update
                
                // Emit panel show event
                this.engine.events.emit('ui:panelShow', { panelId: 'debug' });
            } else {
                this.debugPanel.classList.add('hidden');
                
                // Emit panel hide event
                this.engine.events.emit('ui:panelHide', { panelId: 'debug' });
            }
        }
    }
    
    /**
     * Set the UI scale
     * @param {number} scale - Scale factor (1.0 is default)
     */
    setUIScale(scale) {
        this.uiScale = scale;
        this._applyUIScale();
        
        // Update config
        if (this.engine.configManager) {
            this.engine.configManager.setValue('ui.scale', scale);
        }
    }
    
    /**
     * Set the UI theme
     * @param {string} theme - Theme name ('dark', 'light', 'custom')
     */
    setTheme(theme) {
        this.theme = theme;
        this._applyTheme();
        
        // Update config
        if (this.engine.configManager) {
            this.engine.configManager.setValue('ui.theme', theme);
        }
    }
    
    /**
     * Apply custom style overrides
     * @param {Object} overrides - CSS variable overrides
     */
    applyStyleOverrides(overrides) {
        this.styleOverrides = { ...this.styleOverrides, ...overrides };
        this._applyStyleOverrides();
    }
    
    /**
     * Create a popup message
     * @param {string} message - Message to display
     * @param {Object} options - Popup options
     */
    showPopup(message, options = {}) {
        const type = options.type || 'info';
        const duration = options.duration || 3000;
        
        // Create popup element
        const popup = document.createElement('div');
        popup.className = `popup popup-${type}`;
        popup.textContent = message;
        
        // Add to UI overlay
        if (this.uiOverlay) {
            this.uiOverlay.appendChild(popup);
            
            // Trigger animation
            setTimeout(() => {
                popup.classList.add('active');
            }, 10);
            
            // Auto-remove after duration
            if (duration > 0) {
                setTimeout(() => {
                    popup.classList.remove('active');
                    
                    // Remove from DOM after fade out
                    setTimeout(() => {
                        if (popup.parentNode) {
                            popup.parentNode.removeChild(popup);
                        }
                    }, 300);
                }, duration);
            }
        }
        
        return popup;
    }
    
    /**
     * Create a modal dialog
     * @param {Object} options - Modal options
     * @returns {HTMLElement} Modal element
     */
    showModal(options = {}) {
        const title = options.title || 'Dialog';
        const content = options.content || '';
        const buttons = options.buttons || [{ label: 'OK', action: () => {}, primary: true }];
        
        // Create modal container
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'modal-header';
        
        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        header.appendChild(titleElement);
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'modal-close';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => {
            this.closeModal(modalOverlay);
            if (options.onClose) {
                options.onClose();
            }
        });
        header.appendChild(closeButton);
        
        // Create content area
        const contentElement = document.createElement('div');
        contentElement.className = 'modal-content';
        
        if (typeof content === 'string') {
            contentElement.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            contentElement.appendChild(content);
        }
        
        // Create footer with buttons
        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        
        for (const btn of buttons) {
            const button = document.createElement('button');
            button.className = `button ${btn.primary ? 'primary' : 'secondary'}`;
            button.textContent = btn.label;
            button.addEventListener('click', () => {
                if (btn.action) {
                    btn.action();
                }
                if (btn.closeOnClick !== false) {
                    this.closeModal(modalOverlay);
                }
            });
            footer.appendChild(button);
        }
        
        // Assemble the modal
        modal.appendChild(header);
        modal.appendChild(contentElement);
        modal.appendChild(footer);
        modalOverlay.appendChild(modal);
        
        // Add to UI overlay
        if (this.uiOverlay) {
            this.uiOverlay.appendChild(modalOverlay);
            
            // Trigger animation
            setTimeout(() => {
                modalOverlay.classList.add('active');
            }, 10);
        }
        
        return modalOverlay;
    }
    
    /**
     * Close a modal dialog
     * @param {HTMLElement} modal - Modal element to close
     */
    closeModal(modal) {
        if (!modal) return;
        
        modal.classList.remove('active');
        
        // Remove from DOM after fade out
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
    
    /**
     * Create a tweakable parameter UI control
     * @param {Object} param - Parameter definition
     * @param {string} containerId - Container element ID
     * @returns {HTMLElement} Created control
     */
    createTweakControl(param, containerId) {
        // Get current value from config
        const currentValue = this.engine.configManager.getValue(param.path, param.defaultValue);
        
        // Create container
        const container = document.createElement('div');
        container.className = 'tweak-control';
        container.dataset.path = param.path;
        
        // Create label
        const label = document.createElement('div');
        label.className = 'tweak-label';
        label.textContent = param.description || param.path;
        container.appendChild(label);
        
        // Create control based on type
        let control;
        
        switch (param.type) {
            case 'number':
                control = this.createSlider({
                    min: param.min !== undefined ? param.min : 0,
                    max: param.max !== undefined ? param.max : 100,
                    step: param.step !== undefined ? param.step : 1,
                    value: currentValue,
                    onChange: (value) => {
                        this.engine.configManager.setValue(param.path, value);
                    }
                });
                break;
                
            case 'boolean':
                control = this.createToggle({
                    checked: currentValue,
                    onChange: (value) => {
                        this.engine.configManager.setValue(param.path, value);
                    }
                });
                break;
                
            case 'select':
                const options = param.options.map(opt => ({
                    value: opt,
                    label: opt
                }));
                
                control = this.createDropdown({
                    options,
                    value: currentValue,
                    onChange: (value) => {
                        this.engine.configManager.setValue(param.path, value);
                    }
                });
                break;
                
            case 'color':
                control = this.createColorPicker({
                    value: currentValue,
                    onChange: (value) => {
                        this.engine.configManager.setValue(param.path, value);
                    }
                });
                break;
                
            default:
                // Text input for other types
                control = document.createElement('input');
                control.type = 'text';
                control.value = currentValue;
                control.addEventListener('change', (e) => {
                    this.engine.configManager.setValue(param.path, e.target.value);
                });
                break;
        }
        
        container.appendChild(control);
        
        // Add reset button
        const resetButton = document.createElement('button');
        resetButton.className = 'tweak-reset';
        resetButton.textContent = 'Reset';
        resetButton.addEventListener('click', () => {
            this.engine.configManager.resetValue(param.path);
            // Update control with default value
            // This would be more sophisticated in a real implementation
            container.parentNode.removeChild(container);
            this.createTweakControl(param, containerId);
        });
        container.appendChild(resetButton);
        
        // Add to container if specified
        if (containerId) {
            const parent = document.getElementById(containerId);
            if (parent) {
                parent.appendChild(container);
            }
        }
        
        return container;
    }
    
    /**
     * Initialize UI panels
     * @private
     */
    _initPanels() {
        // Store panel references
        if (this.editorPanel) {
            this.uiPanels.set('editor', this.editorPanel);
        }
        
        if (this.debugPanel) {
            this.uiPanels.set('debug', this.debugPanel);
        }
        
        if (this.assetPanel) {
            this.uiPanels.set('asset', this.assetPanel);
        }
    }
    
    /**
     * Set up event listeners
     * @private
     */
    _setupEventListeners() {
        // Listen for engine debug mode changes
        this.engine.events.on('engine:debugMode', (debugMode) => {
            this.toggleDebugUI(debugMode);
        });
        
        // Listen for config changes
        if (this.engine.configManager) {
            this.engine.events.on('config:changed:ui.scale', (value) => {
                this.uiScale = value;
                this._applyUIScale();
            });
            
            this.engine.events.on('config:changed:ui.theme', (value) => {
                this.theme = value;
                this._applyTheme();
            });
        }
    }
    
    /**
     * Apply UI scale to elements
     * @private
     */
    _applyUIScale() {
        // Set CSS variable for UI scale
        document.documentElement.style.setProperty('--ui-scale', this.uiScale);
    }
    
    /**
     * Apply UI theme
     * @private
     */
    _applyTheme() {
        // Remove previous theme class
        document.body.classList.remove('theme-dark', 'theme-light', 'theme-custom');
        
        // Add new theme class
        document.body.classList.add(`theme-${this.theme}`);
        
        // Apply style overrides if using custom theme
        if (this.theme === 'custom') {
            this._applyStyleOverrides();
        }
    }
    
    /**
     * Apply custom style overrides
     * @private
     */
    _applyStyleOverrides() {
        for (const [property, value] of Object.entries(this.styleOverrides)) {
            document.documentElement.style.setProperty(`--${property}`, value);
        }
    }
    
    /**
     * Update debug information panel
     * @private
     */
    _updateDebugInfo() {
        if (!this.debugPanel) return;
        
        const debugInfo = this.debugPanel.querySelector('#debug-info');
        if (!debugInfo) return;
        
        // Get debug info
        const fps = this.engine.time.fps || 0;
        const elapsedTime = this.engine.time.elapsedTime || 0;
        const activeScene = this.engine.sceneManager.activeSceneId || 'none';
        const rendererType = this.engine.renderSystem.activeRenderer || 'none';
        const connectedPeers = this.engine.networkManager ? 
            Object.keys(this.engine.networkManager.room?.peers || {}).length || 0 : 0;
        
        // Update debug info HTML
        debugInfo.innerHTML = `
            <div class="debug-item"><span>FPS:</span> ${fps}</div>
            <div class="debug-item"><span>Time:</span> ${elapsedTime.toFixed(2)}s</div>
            <div class="debug-item"><span>Scene:</span> ${activeScene}</div>
            <div class="debug-item"><span>Renderer:</span> ${rendererType}</div>
            <div class="debug-item"><span>Connected Peers:</span> ${connectedPeers}</div>
        `;
    }
}