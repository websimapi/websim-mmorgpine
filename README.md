# MMORPGine - MMORPG Game Engine

MMORPGine is a flexible frontend game engine specifically designed for creating MMORPG games with advanced 2D and 3D graphics, AI-powered asset generation, and real-time multiplayer capabilities.

## Features

### Core Engine
- Modular architecture with manager and system components
- Support for both 2D and 3D rendering (using Three.js for 3D)
- Entity-Component-System (ECS) architecture for game objects
- Scene management with transitions
- Event-driven communication between systems
- Configurable with JSON overrides for easy customization

### Input Handling
- Keyboard, mouse, touch, and gamepad support
- Unified input system for cross-platform compatibility
- Customizable input sensitivity and deadzones

### Rendering
- 2D rendering with Canvas API
- 3D rendering with Three.js
- Post-processing effects for enhanced visuals
- Configurable quality settings

### Asset Management
- Asset loading, caching, and management
- AI-powered asset generation:
  - Image generation for textures, sprites, and UI elements
  - Voice generation with text-to-speech
  - Game content generation (characters, items, quests, etc.)

### Networking
- Real-time multiplayer support
- Presence synchronization
- Room state management
- Event broadcasting
- Automatic username and avatar handling

### User Interface
- Flexible UI management
- Customizable themes
- Debug overlays
- In-game editors

## Getting Started

1. Open the project in your browser
2. Use the F2, F3, and F4 keys to toggle debug panels, editor panel, and asset panel
3. Explore the engine features through the demo scene

## Configuration

MMORPGine is designed to be highly configurable. Many settings can be adjusted through:  

1. Initial configuration passed to the Engine constructor
2. Runtime configuration via the ConfigManager
3. User overrides that are saved to localStorage

## Creating Games

To create a game with MMORPGine:

1. Define your game scenes by extending the Scene class
2. Create entity templates for game objects
3. Set up network synchronization for multiplayer
4. Design your UI and game mechanics
5. Use AI asset generation to create game content

## License

This project is available for use under standard license terms.