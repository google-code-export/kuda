/* 
 * Kuda includes a library and editor for authoring interactive 3D content for the web.
 * Copyright (C) 2011 SRI International.
 *
 * This program is free software; you can redistribute it and/or modify it under the terms
 * of the GNU General Public License as published by the Free Software Foundation; either 
 * version 2 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program; 
 * if not, write to the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, 
 * Boston, MA 02110-1301 USA.
 */

var editor = (function(editor) {
	editor.utils = editor.utils || {};
			
    /**
     * The Listenable ...
     */
	editor.utils.Listenable = editor.Class.extend({
		init: function() {
			this.listeners = new Hashtable();
		},
		
		/**
		 * Adds a listener that listens for the event type given.
		 * 
		 * @param {string} eventType the event this listener is interested in
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
		 * @param {string} eventType the event to notify about
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
	
	// make the editor a listener
	var notifier = new editor.utils.Listenable();
			
	editor.addListener = function(eventType, listener) {
		notifier.addListener(eventType, listener);
	};
	
	editor.notifyListeners = function(eventType, value) {
		notifier.notifyListeners(eventType, value);
	};
	
	editor.removeListener = function(listener) {
		notifier.removeListener(listener);
	};			
	
	return editor;
})(editor || {});
