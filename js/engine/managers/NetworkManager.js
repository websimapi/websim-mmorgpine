/**
 * NetworkManager - Handles multiplayer networking and synchronization
 */
export class NetworkManager {
    /**
     * @constructor
     * @param {Object} engine - Reference to the main engine instance
     */
    constructor(engine) {
        this.engine = engine;
        
        // Room instance for multiplayer
        this.room = null;
        
        // Connected status
        this.isConnected = false;
        
        // Local client ID and username
        this.clientId = null;
        this.username = null;
        
        // Connection settings
        this.updateRate = 20; // Network updates per second
        
        // Network stats
        this.latency = 0;
        this.lastUpdateTime = 0;
        
        // Event handler references
        this._handleMessage = this._handleMessage.bind(this);
    }
    
    /**
     * Initialize the network manager
     * @returns {Promise} Resolves when initialization is complete
     */
    async init() {
        try {
            // Get network settings from config
            if (this.engine.configManager) {
                this.updateRate = this.engine.configManager.getValue('network.updateRate', 20);
            }
            
            // Initialize the WebSocket room
            this.room = new WebsimSocket();
            
            // Set up message handler
            this.room.onmessage = this._handleMessage;
            
            // Initialize the room connection
            await this.room.initialize();
            
            // Store client ID and username
            this.clientId = this.room.clientId;
            
            // Get our username if available
            if (this.room.peers && this.room.peers[this.clientId]) {
                this.username = this.room.peers[this.clientId].username;
            }
            
            this.isConnected = true;
            
            // Log connection info
            console.log(`NetworkManager initialized. Client ID: ${this.clientId}`);
            if (this.username) {
                console.log(`Username: ${this.username}`);
            }
            
            // Listen for presence changes
            this.room.subscribePresence((newPresence) => {
                this._handlePresenceUpdate(newPresence);
            });
            
            // Listen for room state changes
            this.room.subscribeRoomState((newState) => {
                this._handleRoomStateUpdate(newState);
            });
            
            // Listen for presence update requests from other clients
            this.room.subscribePresenceUpdateRequests((updateRequest, fromClientId) => {
                this._handlePresenceUpdateRequest(updateRequest, fromClientId);
            });
            
            return true;
        } catch (error) {
            console.error('Failed to initialize NetworkManager:', error);
            return false;
        }
    }
    
    /**
     * Update network state - called each frame
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.isConnected) return;
        
        const currentTime = performance.now();
        
        // Limit update rate
        if (currentTime - this.lastUpdateTime >= 1000 / this.updateRate) {
            // This is where we would handle regular network updates
            // like sending player position updates
            
            this.lastUpdateTime = currentTime;
        }
    }
    
    /**
     * Update the local player presence (position, state, etc.)
     * @param {Object} data - Presence data to update
     */
    updatePresence(data) {
        if (!this.isConnected) return;
        
        try {
            this.room.updatePresence(data);
        } catch (error) {
            console.error('Failed to update presence:', error);
        }
    }
    
    /**
     * Update the shared room state
     * @param {Object} data - Room state data to update
     */
    updateRoomState(data) {
        if (!this.isConnected) return;
        
        try {
            this.room.updateRoomState(data);
        } catch (error) {
            console.error('Failed to update room state:', error);
        }
    }
    
    /**
     * Request a presence update from another client
     * @param {string} clientId - Target client ID
     * @param {Object} data - Update request data
     */
    requestPresenceUpdate(clientId, data) {
        if (!this.isConnected) return;
        
        try {
            this.room.requestPresenceUpdate(clientId, data);
        } catch (error) {
            console.error('Failed to request presence update:', error);
        }
    }
    
    /**
     * Send a message to all connected clients
     * @param {Object} data - Message data to send
     */
    sendMessage(data) {
        if (!this.isConnected) return;
        
        try {
            this.room.send(data);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }
    
    /**
     * Get a list of all connected peers
     * @returns {Array} Array of peer objects with username, id, etc.
     */
    getConnectedPeers() {
        if (!this.isConnected || !this.room.peers) return [];
        
        return Object.values(this.room.peers).map(peer => ({
            id: peer.id,
            username: peer.username,
            avatarUrl: peer.avatarUrl
        }));
    }
    
    /**
     * Get a specific peer by client ID
     * @param {string} clientId - Client ID to look up
     * @returns {Object|null} Peer object or null if not found
     */
    getPeer(clientId) {
        if (!this.isConnected || !this.room.peers) return null;
        
        return this.room.peers[clientId] || null;
    }
    
    /**
     * Get all presence data
     * @returns {Object} Object containing all clients' presence data
     */
    getAllPresence() {
        if (!this.isConnected) return {};
        
        return this.room.presence || {};
    }
    
    /**
     * Get presence data for a specific client
     * @param {string} clientId - Client ID to get presence for
     * @returns {Object|null} Presence data or null if not found
     */
    getPresence(clientId) {
        if (!this.isConnected || !this.room.presence) return null;
        
        return this.room.presence[clientId] || null;
    }
    
    /**
     * Get the current room state
     * @returns {Object} Current room state
     */
    getRoomState() {
        if (!this.isConnected) return {};
        
        return this.room.roomState || {};
    }
    
    /**
     * Handle WebSocket messages
     * @param {Object} event - Message event
     * @private
     */
    _handleMessage(event) {
        const data = event.data;
        
        // Forward the message to engine event system
        this.engine.events.emit('network:message', data);
        
        // Handle built-in message types
        switch (data.type) {
            case 'connected':
                this._handleClientConnected(data);
                break;
                
            case 'disconnected':
                this._handleClientDisconnected(data);
                break;
                
            default:
                // Custom message type - specific handlers can be registered via events
                break;
        }
    }
    
    /**
     * Handle client connected message
     * @param {Object} data - Connection data
     * @private
     */
    _handleClientConnected(data) {
        console.log(`Client connected: ${data.username} (${data.clientId})`);
        
        this.engine.events.emit('network:clientConnected', {
            clientId: data.clientId,
            username: data.username
        });
    }
    
    /**
     * Handle client disconnected message
     * @param {Object} data - Disconnection data
     * @private
     */
    _handleClientDisconnected(data) {
        console.log(`Client disconnected: ${data.username} (${data.clientId})`);
        
        this.engine.events.emit('network:clientDisconnected', {
            clientId: data.clientId,
            username: data.username
        });
    }
    
    /**
     * Handle presence updates from all clients
     * @param {Object} newPresence - Updated presence data
     * @private
     */
    _handlePresenceUpdate(newPresence) {
        // Emit specific events for local client and other clients
        Object.keys(newPresence).forEach(clientId => {
            const isLocal = clientId === this.clientId;
            const eventName = isLocal ? 'network:localPresenceUpdate' : 'network:remotePresenceUpdate';
            
            this.engine.events.emit(eventName, {
                clientId,
                presence: newPresence[clientId]
            });
        });
        
        // Emit general presence update event
        this.engine.events.emit('network:presenceUpdate', newPresence);
    }
    
    /**
     * Handle room state updates
     * @param {Object} newState - Updated room state
     * @private
     */
    _handleRoomStateUpdate(newState) {
        this.engine.events.emit('network:roomStateUpdate', newState);
    }
    
    /**
     * Handle presence update requests from other clients
     * @param {Object} updateRequest - The update request
     * @param {string} fromClientId - Client ID that sent the request
     * @private
     */
    _handlePresenceUpdateRequest(updateRequest, fromClientId) {
        // Forward the request to the engine event system
        this.engine.events.emit('network:presenceUpdateRequest', {
            request: updateRequest,
            fromClientId
        });
        
        // Handle common update request types here
        switch (updateRequest.type) {
            case 'damage':
                // Example: Handle damage request
                this._handleDamageRequest(updateRequest, fromClientId);
                break;
                
            default:
                // Unknown request type - handled by listeners
                break;
        }
    }
    
    /**
     * Handle damage update request
     * @param {Object} request - Damage request
     * @param {string} fromClientId - Client ID that sent the request
     * @private
     */
    _handleDamageRequest(request, fromClientId) {
        // Example implementation - would be customized for the game
        if (!request.amount) return;
        
        // Get current presence
        const currentPresence = this.room.presence[this.clientId] || {};
        
        // Get health or set default
        const currentHealth = currentPresence.health || 100;
        
        // Calculate new health
        const newHealth = Math.max(0, currentHealth - request.amount);
        
        // Update presence with new health
        this.updatePresence({
            ...currentPresence,
            health: newHealth,
            damaged: true, // Flag for animation
            dead: newHealth <= 0
        });
        
        // If we died, emit a death event
        if (newHealth <= 0 && currentHealth > 0) {
            this.engine.events.emit('player:died', {
                killedBy: fromClientId
            });
            
            // Send a message about the kill
            this.sendMessage({
                type: 'playerKilled',
                victimId: this.clientId,
                killerId: fromClientId
            });
        }
    }
}