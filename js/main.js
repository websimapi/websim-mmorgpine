/**
 * MMORPGine - Main Entry Point
 * Initializes the game engine and sets up the demo scene
 */

import { Engine } from './engine/core/Engine.js';
import { ComponentTypes } from './engine/managers/EntityManager.js';

// Create an instance of the engine with initial configuration
const engine = new Engine({
    // Debug mode
    debugMode: true,
    
    // Renderer settings
    renderer: {
        type: '3d',
        clearColor: '#212121',
        antialias: true
    },
    
    // UI settings
    ui: {
        showFps: true,
        scale: 1.0,
        theme: 'dark'
    }
});

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize the engine
    await engine.init();
    
    // Set up a test demo scene
    setupDemoScene();
    
    // Set up the UI controls (replacing F-keys)
    setupUIControls();
    
    // Start the engine
    engine.start();
    
    // Log that the engine is running
    console.log('MMORPGine is running');
});

/**
 * Set up UI control buttons
 */
function setupUIControls() {
    // Get button elements
    const debugButton = document.getElementById('debug-button');
    const editorButton = document.getElementById('editor-button');
    const assetButton = document.getElementById('asset-button');
    
    // Debug button
    if (debugButton) {
        // Set initial state
        if (engine.debugMode) {
            debugButton.classList.add('active');
        }
        
        debugButton.addEventListener('click', () => {
            engine.toggleDebugMode();
            debugButton.classList.toggle('active', engine.debugMode);
        });
    }
    
    // Editor button
    if (editorButton) {
        // Check if editor panel is visible
        const editorPanel = document.getElementById('editor-panel');
        const isEditorVisible = editorPanel && !editorPanel.classList.contains('hidden');
        
        if (isEditorVisible) {
            editorButton.classList.add('active');
        }
        
        editorButton.addEventListener('click', () => {
            engine.uiManager.togglePanel('editor');
            const isVisible = !document.getElementById('editor-panel').classList.contains('hidden');
            editorButton.classList.toggle('active', isVisible);
        });
    }
    
    // Asset button
    if (assetButton) {
        // Check if asset panel is visible
        const assetPanel = document.getElementById('asset-panel');
        const isAssetVisible = assetPanel && !assetPanel.classList.contains('hidden');
        
        if (isAssetVisible) {
            assetButton.classList.add('active');
        }
        
        assetButton.addEventListener('click', () => {
            engine.uiManager.togglePanel('asset');
            const isVisible = !document.getElementById('asset-panel').classList.contains('hidden');
            assetButton.classList.toggle('active', isVisible);
        });
    }
    
    // Subscribe to panel visibility events to sync button states
    engine.events.on('ui:panelShow', ({ panelId }) => {
        if (panelId === 'debug' && debugButton) {
            debugButton.classList.add('active');
        } else if (panelId === 'editor' && editorButton) {
            editorButton.classList.add('active');
        } else if (panelId === 'asset' && assetButton) {
            assetButton.classList.add('active');
        }
    });
    
    engine.events.on('ui:panelHide', ({ panelId }) => {
        if (panelId === 'debug' && debugButton) {
            debugButton.classList.remove('active');
        } else if (panelId === 'editor' && editorButton) {
            editorButton.classList.remove('active');
        } else if (panelId === 'asset' && assetButton) {
            assetButton.classList.remove('active');
        }
    });
}

/**
 * Set up a simple demo scene
 */
async function setupDemoScene() {
    // Create a test cube in the 3D scene
    const cube = engine.renderSystem.createTestCube();
    
    // Create a player entity
    const playerId = engine.entityManager.createEntity({
        [ComponentTypes.TRANSFORM]: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
        },
        [ComponentTypes.NETWORK]: {
            syncPosition: true,
            syncRotation: true
        },
        [ComponentTypes.HEALTH]: {
            current: 100,
            max: 100
        }
    }, ['player']).id;
    
    // Update player presence in the network
    engine.networkManager.updatePresence({
        x: 0,
        y: 0,
        z: 0,
        health: 100,
        name: engine.networkManager.username || 'Player'
    });
    
    // Create tweakable UI for engine parameters
    createTweakableControls();
    
    // Demo of AI asset generation
    await demoAIAssetGeneration();
}

/**
 * Create UI controls for tweakable parameters
 */
function createTweakableControls() {
    // Get tweakable parameters from config manager
    const tweakableParams = engine.configManager.getTweakableParams();
    
    // Create controls in the editor panel
    const editorTools = document.getElementById('editor-tools');
    
    if (editorTools) {
        // Add a title
        const title = document.createElement('h3');
        title.textContent = 'Engine Settings';
        editorTools.appendChild(title);
        
        // Create controls for each parameter
        for (const param of Object.values(tweakableParams)) {
            engine.uiManager.createTweakControl(param, 'editor-tools');
        }
    }
}

/**
 * Demo AI asset generation capabilities
 */
async function demoAIAssetGeneration() {
    try {
        // Get the asset tools container
        const assetTools = document.getElementById('asset-tools');
        
        if (assetTools) {
            // Create a title
            const title = document.createElement('h3');
            title.textContent = 'AI Asset Generation';
            assetTools.appendChild(title);
            
            // Add explanation text
            const info = document.createElement('p');
            info.textContent = 'Examples of AI-generated assets:';
            assetTools.appendChild(info);
            
            // Create a container for generated assets
            const assetsContainer = document.createElement('div');
            assetsContainer.className = 'generated-assets';
            assetTools.appendChild(assetsContainer);
            
            // Demo: Generate an image
            const imagePrompt = 'A fantasy character avatar for an MMORPG, pixel art style';
            const imageResult = await engine.assetManager.generateImage('demo-avatar', imagePrompt, {
                aspectRatio: '1:1'
            });
            
            // Create an image display
            const imageContainer = document.createElement('div');
            imageContainer.className = 'asset-item';
            
            const imageTitle = document.createElement('h4');
            imageTitle.textContent = 'Generated Character Avatar';
            imageContainer.appendChild(imageTitle);
            
            const img = document.createElement('img');
            img.src = imageResult.url;
            img.alt = 'AI Generated Avatar';
            img.width = 150;
            img.height = 150;
            imageContainer.appendChild(img);
            
            const imagePromptText = document.createElement('div');
            imagePromptText.className = 'asset-prompt';
            imagePromptText.textContent = `Prompt: ${imagePrompt}`;
            imageContainer.appendChild(imagePromptText);
            
            assetsContainer.appendChild(imageContainer);
            
            // Demo: Generate game content (character stats)
            const contentPrompt = 'Create a legendary wizard character for a fantasy MMORPG';
            const contentResult = await engine.assetManager.generateGameContent('demo-character', contentPrompt, {
                contentType: 'character'
            });
            
            // Create a content display
            const contentContainer = document.createElement('div');
            contentContainer.className = 'asset-item';
            
            const contentTitle = document.createElement('h4');
            contentTitle.textContent = 'Generated Character Stats';
            contentContainer.appendChild(contentTitle);
            
            const contentText = document.createElement('pre');
            contentText.className = 'content-json';
            contentText.textContent = JSON.stringify(contentResult.content, null, 2);
            contentContainer.appendChild(contentText);
            
            const contentPromptText = document.createElement('div');
            contentPromptText.className = 'asset-prompt';
            contentPromptText.textContent = `Prompt: ${contentPrompt}`;
            contentContainer.appendChild(contentPromptText);
            
            assetsContainer.appendChild(contentContainer);
        }
    } catch (error) {
        console.error('Error in AI asset generation demo:', error);
    }
}