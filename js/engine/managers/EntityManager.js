/**
 * EntityManager - Manages game entities and their components
 */
export class EntityManager {
    /**
     * @constructor
     * @param {Object} engine - Reference to the main engine instance
     */
    constructor(engine) {
        this.engine = engine;
        
        // Entities registry
        this.entities = new Map();
        
        // Entity templates
        this.templates = new Map();
        
        // Entity ID counter
        this.nextEntityId = 1;
        
        // Entity tags for quick lookup
        this.entityTags = new Map();
        
        // Entity systems
        this.systems = [];
    }
    
    /**
     * Initialize the entity manager
     * @returns {Promise} Resolves when initialization is complete
     */
    async init() {
        try {
            console.log('EntityManager initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize EntityManager:', error);
            return false;
        }
    }
    
    /**
     * Create a new entity
     * @param {Object} components - Initial components for the entity
     * @param {Array} tags - Array of tags to assign to the entity
     * @returns {Object} New entity object
     */
    createEntity(components = {}, tags = []) {
        const id = `entity_${this.nextEntityId++}`;
        
        const entity = {
            id,
            components: { ...components },
            tags: [...tags],
            active: true,
            created: performance.now()
        };
        
        // Register the entity
        this.entities.set(id, entity);
        
        // Register entity tags
        for (const tag of tags) {
            if (!this.entityTags.has(tag)) {
                this.entityTags.set(tag, new Set());
            }
            this.entityTags.get(tag).add(id);
        }
        
        // Emit entity created event
        this.engine.events.emit('entity:created', { entity });
        
        return entity;
    }
    
    /**
     * Get an entity by ID
     * @param {string} id - Entity ID
     * @returns {Object|null} Entity or null if not found
     */
    getEntity(id) {
        return this.entities.get(id) || null;
    }
    
    /**
     * Remove an entity
     * @param {string} id - Entity ID
     * @returns {boolean} Whether the entity was removed
     */
    removeEntity(id) {
        const entity = this.entities.get(id);
        
        if (!entity) {
            return false;
        }
        
        // Remove from tag sets
        for (const tag of entity.tags) {
            const tagSet = this.entityTags.get(tag);
            if (tagSet) {
                tagSet.delete(id);
            }
        }
        
        // Remove the entity
        this.entities.delete(id);
        
        // Emit entity removed event
        this.engine.events.emit('entity:removed', { entity });
        
        return true;
    }
    
    /**
     * Get all entities
     * @returns {Array} Array of entities
     */
    getAllEntities() {
        return Array.from(this.entities.values());
    }
    
    /**
     * Get entities by tag
     * @param {string} tag - Tag to filter by
     * @returns {Array} Array of entities with the tag
     */
    getEntitiesByTag(tag) {
        const entityIds = this.entityTags.get(tag);
        
        if (!entityIds) {
            return [];
        }
        
        return Array.from(entityIds).map(id => this.entities.get(id)).filter(Boolean);
    }
    
    /**
     * Check if an entity has a specific component
     * @param {string} entityId - Entity ID
     * @param {string} componentName - Component name
     * @returns {boolean} Whether the entity has the component
     */
    hasComponent(entityId, componentName) {
        const entity = this.entities.get(entityId);
        if (!entity) return false;
        
        return componentName in entity.components;
    }
    
    /**
     * Add a component to an entity
     * @param {string} entityId - Entity ID
     * @param {string} componentName - Component name
     * @param {Object} componentData - Component data
     * @returns {boolean} Whether the component was added
     */
    addComponent(entityId, componentName, componentData = {}) {
        const entity = this.entities.get(entityId);
        
        if (!entity) {
            return false;
        }
        
        // Add the component
        entity.components[componentName] = componentData;
        
        // Emit component added event
        this.engine.events.emit('entity:componentAdded', {
            entity,
            componentName,
            componentData
        });
        
        return true;
    }
    
    /**
     * Get a component from an entity
     * @param {string} entityId - Entity ID
     * @param {string} componentName - Component name
     * @returns {Object|null} Component data or null if not found
     */
    getComponent(entityId, componentName) {
        const entity = this.entities.get(entityId);
        
        if (!entity || !(componentName in entity.components)) {
            return null;
        }
        
        return entity.components[componentName];
    }
    
    /**
     * Remove a component from an entity
     * @param {string} entityId - Entity ID
     * @param {string} componentName - Component name
     * @returns {boolean} Whether the component was removed
     */
    removeComponent(entityId, componentName) {
        const entity = this.entities.get(entityId);
        
        if (!entity || !(componentName in entity.components)) {
            return false;
        }
        
        // Get the component before removing it
        const componentData = entity.components[componentName];
        
        // Remove the component
        delete entity.components[componentName];
        
        // Emit component removed event
        this.engine.events.emit('entity:componentRemoved', {
            entity,
            componentName,
            componentData
        });
        
        return true;
    }
    
    /**
     * Add a tag to an entity
     * @param {string} entityId - Entity ID
     * @param {string} tag - Tag to add
     * @returns {boolean} Whether the tag was added
     */
    addTag(entityId, tag) {
        const entity = this.entities.get(entityId);
        
        if (!entity) {
            return false;
        }
        
        // Check if entity already has the tag
        if (entity.tags.includes(tag)) {
            return true; // Already has the tag
        }
        
        // Add the tag to the entity
        entity.tags.push(tag);
        
        // Add to tag registry
        if (!this.entityTags.has(tag)) {
            this.entityTags.set(tag, new Set());
        }
        this.entityTags.get(tag).add(entityId);
        
        // Emit tag added event
        this.engine.events.emit('entity:tagAdded', { entity, tag });
        
        return true;
    }
    
    /**
     * Remove a tag from an entity
     * @param {string} entityId - Entity ID
     * @param {string} tag - Tag to remove
     * @returns {boolean} Whether the tag was removed
     */
    removeTag(entityId, tag) {
        const entity = this.entities.get(entityId);
        
        if (!entity) {
            return false;
        }
        
        // Remove the tag from the entity
        const index = entity.tags.indexOf(tag);
        if (index === -1) {
            return false; // Entity doesn't have the tag
        }
        entity.tags.splice(index, 1);
        
        // Remove from tag registry
        const tagSet = this.entityTags.get(tag);
        if (tagSet) {
            tagSet.delete(entityId);
        }
        
        // Emit tag removed event
        this.engine.events.emit('entity:tagRemoved', { entity, tag });
        
        return true;
    }
    
    /**
     * Check if an entity has a specific tag
     * @param {string} entityId - Entity ID
     * @param {string} tag - Tag to check
     * @returns {boolean} Whether the entity has the tag
     */
    hasTag(entityId, tag) {
        const entity = this.entities.get(entityId);
        if (!entity) return false;
        
        return entity.tags.includes(tag);
    }
    
    /**
     * Register an entity template
     * @param {string} templateId - Template identifier
     * @param {Object} template - Template definition
     */
    registerTemplate(templateId, template) {
        this.templates.set(templateId, template);
    }
    
    /**
     * Create an entity from a template
     * @param {string} templateId - Template identifier
     * @param {Object} overrides - Property overrides
     * @returns {Object|null} Created entity or null if template not found
     */
    createEntityFromTemplate(templateId, overrides = {}) {
        const template = this.templates.get(templateId);
        
        if (!template) {
            console.warn(`Template not found: ${templateId}`);
            return null;
        }
        
        // Deep clone the template components
        const components = JSON.parse(JSON.stringify(template.components || {}));
        
        // Apply component overrides
        if (overrides.components) {
            for (const [componentName, componentData] of Object.entries(overrides.components)) {
                if (!components[componentName]) {
                    components[componentName] = {};
                }
                
                // Merge component data
                components[componentName] = {
                    ...components[componentName],
                    ...componentData
                };
            }
        }
        
        // Get tags
        const tags = [...(template.tags || [])];
        
        // Add override tags
        if (overrides.tags && Array.isArray(overrides.tags)) {
            for (const tag of overrides.tags) {
                if (!tags.includes(tag)) {
                    tags.push(tag);
                }
            }
        }
        
        // Create the entity
        const entity = this.createEntity(components, tags);
        
        // Store template ID as reference
        entity.templateId = templateId;
        
        return entity;
    }
    
    /**
     * Register an entity system
     * @param {Object} system - System object
     * @param {number} priority - System priority (lower runs first)
     */
    registerSystem(system, priority = 0) {
        system.priority = priority;
        this.systems.push(system);
        
        // Sort systems by priority
        this.systems.sort((a, b) => a.priority - b.priority);
        
        // Initialize the system if it has an init method
        if (typeof system.init === 'function') {
            system.init(this.engine);
        }
    }
    
    /**
     * Unregister an entity system
     * @param {Object} system - System object
     * @returns {boolean} Whether the system was unregistered
     */
    unregisterSystem(system) {
        const index = this.systems.indexOf(system);
        
        if (index === -1) {
            return false;
        }
        
        // Call cleanup method if it exists
        if (typeof system.cleanup === 'function') {
            system.cleanup(this.engine);
        }
        
        // Remove the system
        this.systems.splice(index, 1);
        return true;
    }
    
    /**
     * Update all entity systems
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Update all systems in priority order
        for (const system of this.systems) {
            if (typeof system.update === 'function') {
                system.update(deltaTime, this.engine);
            }
        }
    }
    
    /**
     * Clear all entities
     */
    clear() {
        // Remove all entities
        for (const entity of this.entities.values()) {
            this.removeEntity(entity.id);
        }
        
        // Reset entity ID counter
        this.nextEntityId = 1;
    }
}

/**
 * Common component types for entities
 */
export const ComponentTypes = {
    TRANSFORM: 'transform',
    SPRITE: 'sprite',
    MODEL: 'model',
    PHYSICS: 'physics',
    COLLIDER: 'collider',
    HEALTH: 'health',
    INPUT: 'input',
    AI: 'ai',
    CAMERA: 'camera',
    LIGHT: 'light',
    AUDIO: 'audio',
    PARTICLE: 'particle',
    SCRIPT: 'script',
    NETWORK: 'network',
    ANIMATION: 'animation',
    INVENTORY: 'inventory',
    UI: 'ui'
};

/**
 * Base System class - extend this to create entity systems
 */
export class System {
    constructor() {
        this.priority = 0;
    }
    
    /**
     * Initialize the system
     * @param {Object} engine - Engine instance
     */
    init(engine) {
        this.engine = engine;
    }
    
    /**
     * Update the system
     * @param {number} deltaTime - Time since last update in seconds
     * @param {Object} engine - Engine instance
     */
    update(deltaTime, engine) {
        // Override in derived classes
    }
    
    /**
     * Clean up the system
     * @param {Object} engine - Engine instance
     */
    cleanup(engine) {
        // Override in derived classes
    }
}