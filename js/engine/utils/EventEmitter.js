/**
 * EventEmitter - Simple event emitter for engine-wide communication
 */
export class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} listener - Event callback
     * @returns {Function} Unsubscribe function
     */
    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        
        this.events[event].push(listener);
        
        // Return unsubscribe function
        return () => this.off(event, listener);
    }
    
    /**
     * Subscribe to an event for a single execution
     * @param {string} event - Event name
     * @param {Function} listener - Event callback
     * @returns {Function} Unsubscribe function
     */
    once(event, listener) {
        const onceListener = (...args) => {
            this.off(event, onceListener);
            listener(...args);
        };
        
        return this.on(event, onceListener);
    }
    
    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} listener - Event callback to remove
     */
    off(event, listener) {
        if (!this.events[event]) return;
        
        const index = this.events[event].indexOf(listener);
        if (index !== -1) {
            this.events[event].splice(index, 1);
        }
        
        // Clean up empty event arrays
        if (this.events[event].length === 0) {
            delete this.events[event];
        }
    }
    
    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {...any} args - Arguments to pass to listeners
     */
    emit(event, ...args) {
        if (!this.events[event]) return;
        
        // Create a copy of the listeners array in case handlers modify it during iteration
        const listeners = [...this.events[event]];
        
        for (const listener of listeners) {
            try {
                listener(...args);
            } catch (error) {
                console.error(`Error in event listener for '${event}':`, error);
            }
        }
    }
    
    /**
     * Clear all event listeners
     * @param {string} [event] - Optional event name. If not provided, clears all events.
     */
    clear(event) {
        if (event) {
            delete this.events[event];
        } else {
            this.events = {};
        }
    }
    
    /**
     * Get all registered event names
     * @returns {string[]} Array of event names
     */
    eventNames() {
        return Object.keys(this.events);
    }
    
    /**
     * Get the number of listeners for an event
     * @param {string} event - Event name
     * @returns {number} Number of listeners
     */
    listenerCount(event) {
        return this.events[event]?.length || 0;
    }
}