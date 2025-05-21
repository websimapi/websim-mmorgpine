/**
 * Time - Utility class for managing time-related functionality
 */
export class Time {
    constructor() {
        // Time values in milliseconds
        this._startTime = 0;
        this._lastTime = 0;
        this._currentTime = 0;
        this._pauseStartTime = 0;
        this._totalPausedTime = 0;
        
        // Calculated times in seconds
        this._deltaTime = 0;
        this._elapsedTime = 0;
        this._timeScale = 1.0;
        
        // State
        this._running = false;
        this._paused = false;
        
        /* @tweakable Multiplier for game speed. 1.0 is normal speed. */
        this.timeScale = 1.0;
        
        // Frame counting
        this._frameCount = 0;
        this._fpsUpdateInterval = 500; // Update FPS every 500ms
        this._lastFpsUpdateTime = 0;
        this._fps = 0;
    }
    
    /**
     * Start the time tracking
     */
    start() {
        const now = performance.now();
        this._startTime = now;
        this._lastTime = now;
        this._currentTime = now;
        this._totalPausedTime = 0;
        this._frameCount = 0;
        this._lastFpsUpdateTime = now;
        this._running = true;
        this._paused = false;
    }
    
    /**
     * Pause time tracking
     */
    pause() {
        if (!this._running || this._paused) return;
        
        this._pauseStartTime = performance.now();
        this._paused = true;
    }
    
    /**
     * Resume time tracking from pause
     */
    resume() {
        if (!this._running || !this._paused) return;
        
        const now = performance.now();
        this._totalPausedTime += (now - this._pauseStartTime);
        this._lastTime = now;
        this._paused = false;
    }
    
    /**
     * Stop time tracking
     */
    stop() {
        this._running = false;
        this._paused = false;
    }
    
    /**
     * Update time values, should be called each frame
     */
    update() {
        if (!this._running || this._paused) return;
        
        const now = performance.now();
        
        // Update times
        this._currentTime = now;
        this._deltaTime = (this._currentTime - this._lastTime) / 1000 * this._timeScale; // Convert to seconds
        this._elapsedTime = (this._currentTime - this._startTime - this._totalPausedTime) / 1000; // Convert to seconds
        this._lastTime = now;
        
        // Update frame counter
        this._frameCount++;
        
        // Update FPS count
        if (now - this._lastFpsUpdateTime > this._fpsUpdateInterval) {
            this._fps = Math.round((this._frameCount * 1000) / (now - this._lastFpsUpdateTime));
            this._frameCount = 0;
            this._lastFpsUpdateTime = now;
        }
    }
    
    /**
     * Delta time in seconds (time since last frame)
     */
    get deltaTime() {
        return this._deltaTime;
    }
    
    /**
     * Total elapsed time in seconds
     */
    get elapsedTime() {
        return this._elapsedTime;
    }
    
    /**
     * Current frames per second
     */
    get fps() {
        return this._fps;
    }
    
    /**
     * Get the current time scale
     */
    get timeScale() {
        return this._timeScale;
    }
    
    /**
     * Set the current time scale
     * @param {number} value - Time scale value (1.0 is normal speed)
     */
    set timeScale(value) {
        this._timeScale = Math.max(0, value);
    }
    
    /**
     * Check if time tracking is running
     */
    get isRunning() {
        return this._running;
    }
    
    /**
     * Check if time tracking is paused
     */
    get isPaused() {
        return this._paused;
    }
}