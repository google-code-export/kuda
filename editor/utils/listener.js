var editor = (function(module, jQuery) {
	module.utils = module.utils || {};
		
    /**
     * EventTypes constants object.  Event types are used to differentiate
     * listeners of model notifications.
     */
	module.EventTypes = module.EventTypes || {};
			
    /**
     * The Listenable ...
     */
	module.utils.Listenable = module.Class.extend({
		init: function() {
			this.listeners = new Hashtable();
		},
		
		/**
		 * Adds a listener that listens for the event type given.
		 * 
		 * @param {editor.EventTypes} eventType the event type this 
		 *        listener is interested in
		 * @param {function(Object):void or Object that contains notify()} 
		 *        listener the listener to add
		 */        
        addListener: function(eventType, listener) {
			var list = this.listeners.get(eventType);
			
			if (!list) {
				list = [];
			}
			
            var ndx = list.indexOf(listener);
            
            if (ndx == -1) {
                list.push(listener);
            }
			
			this.listeners.put(eventType, list);
        },
        
		/**
		 * Removes the given listener from this object's internal list of 
		 * listeners.
		 * 
		 * @param {function(Object):void or Object that contains notify()} 
		 *        listener the listener to remove.
		 */
        removeListener: function(listener) {
            var found = null;
			
			if (this.listeners.containsValue(listener)) {
				var keys = this.listeners.keys();
				
				for (var ki = 0, kl = keys.length; ki < kl && !found; ki++) {
					var list = this.listeners.get(keys[ki]);
	                var ndx = list.indexOf(listener);
	                
	                if (ndx != -1) {
	                    var spliced = list.splice(ndx, 1);
	                    
	                    if (spliced.length == 1) {
	                        found = spliced[0];
	                    }
	                }
				}
			}
			
            return found;
        },
        
		/**
		 * Notifies listeners interested in the given event type.
		 * 
		 * @param {editor.EventTypes} eventType the event type to notify about
		 * @param {Object} value the data to give to the interested listeners.
		 */
        notifyListeners: function(eventType, value) {
			var list = this.listeners.get(eventType);
			
            if (list) {
                for (var ndx = 0, len = list.length; ndx < len; ndx++) {
                    var listener = list[ndx];
                    var isFnc = jQuery.isFunction(listener);
                    
                    if (isFnc) {
                        listener(value);
                    }
                    else {
                        listener.notify(eventType, value);
                    }
                }
            }
        }
	});
	
	return module;
})(editor || {}, jQuery);
