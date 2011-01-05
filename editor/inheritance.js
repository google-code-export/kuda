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
 
 /* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
var editor = (function(module){
    var initializing = false, 
		fnTest = /xyz/.test(function(){
	        xyz;
	    }) ? /\b_super\b/ : /.*/;
    
    // The base Class implementation (does nothing)
    module.Class = function(){};
    
    // Create a new Class that inherits from this class
    module.Class.extend = function(prop){
        var _super = this.prototype;
        
        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;
        
        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" &&
            typeof _super[name] == "function" &&
            fnTest.test(prop[name]) ? (function(name, fn){
                return function(){
                    var tmp = this._super;
                    
                    // Add a new ._super() method that is the same method
                    // but on the super-class
                    this._super = _super[name];
                    
                    // The method only need to be bound temporarily, so we
                    // remove it when we're done executing
                    var ret = fn.apply(this, arguments);
                    this._super = tmp;
                    
                    return ret;
                };
            })(name, prop[name]) : prop[name];
        }
        
        // The dummy class constructor
        function Class(){
            // All construction is actually done in the init method
            if (!initializing && this.init) 
                this.init.apply(this, arguments);
        }
        
        // Populate our constructed prototype object
        Class.prototype = prototype;
        
        // Enforce the constructor to be what we expect
        Class.constructor = Class;
        
        // And make this class extendable
        Class.extend = arguments.callee;
        
        return Class;
    };
	
	return module;
})(editor || {});
