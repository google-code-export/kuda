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
 
 o3djs.require('hemi.animation');
o3djs.require('hemi.effect');
o3djs.require('hemi.handlers.valueCheck');
o3djs.require('hemi.hud');
o3djs.require('hemi.manip');
o3djs.require('hemi.model');
o3djs.require('hemi.motion');
o3djs.require('hemi.scene');
o3djs.require('hemi.view');
o3djs.require('hemi.world');

var hemi = (function(hemi) {
	/**
	 * @namespace A module for creating objects (including Worlds) from Octane.
	 */
	hemi.octane = hemi.octane || {};
	
	/**
	 * Create the World and Dispatch from the given Octane.
	 * 
	 * @param {Object} octane the structure containing information for setting
	 *     up the World and Dispatch
	 */
	hemi.octane.createWorld = function(octane) {
		hemi.world.cleanup();
		var citizenCount = octane.citizens.length;
		// Set the nextId value to a negative number so that we don't have to
		// worry about overlapping world ids between the constructed Citizens
		// and their actual ids that are restored from Octane.
		var fakeId = citizenCount * -2;
		hemi.world.setNextId(fakeId);
		
		// Do the bare minimum: create Citizens and set their ids
		for (var ndx = 0; ndx < citizenCount; ndx++) {
			var citOctane = octane.citizens[ndx];
			
			if (citOctane.id === octane.camera) {
				// Get rid of the old one first
				hemi.world.setCamera(null);
			}
			
			var obj = hemi.octane.createObject(citOctane);
			
			if (citOctane.id === octane.camera) {
				hemi.world.setCamera(obj);
			}
		}
		
		// Now set the World nextId to its proper value.
		hemi.world.setNextId(octane.nextId);
		
		if (octane.fog != null) {
			var f = octane.fog;
			hemi.world.setFog(f.color, f.start, f.end);
		}
		
		// Next set up the message dispatch
		var entryOctane = octane.dispatch.ents;
		var entries = [];
		
		for (var ndx = 0, len = entryOctane.length; ndx < len; ndx++) {
			var entry = hemi.octane.createObject(entryOctane[ndx]);
			hemi.octane.setProperties(entry, entryOctane[ndx]);
			entries.push(entry);
		}
		
		hemi.dispatch.loadEntries(entries);
		hemi.dispatch.setNextId(octane.dispatch.nextId);
		
		// Now rebuild the transform registry
		hemi.world.tranReg = hemi.octane.createObject(octane.tranReg);
		hemi.octane.setProperties(hemi.world.tranReg, octane.tranReg);
		
		// Now set Citizen properties and resolve references to other Citizens
		for (var ndx = 0; ndx < citizenCount; ndx++) {
			var citOctane = octane.citizens[ndx];
			hemi.octane.setProperties(hemi.world.getCitizenById(citOctane.id), citOctane);
		}
	};
	
	/**
	 * Create an object from the given Octane structure and set its id. No other
	 * properties will be set yet.
	 * 
	 * @param {Object} octane the structure containing information for creating
	 *     an object
	 * @return {Object} the newly created object
	 */
	hemi.octane.createObject = function(octane) {
		if (!octane.type) {
			alert("Unable to process octane: missing type");
			return null;
		}
		
		var object = eval("new " + octane.type + "();");
		
		if (octane.id !== undefined) {
			object.setId(octane.id);
		}
		
		return object;
	};
	
	/**
	 * Iterate through the given Octane structure and set properties for the
	 * given object. Properties stored by value will be set directly, by Octane
	 * will be recursively created, by id will be retrieved from the World, and
	 * by arg will be set by calling the specified function on the object.
	 * 
	 * @param {Object} object the object created from the given Octane
	 * @param {Object} octane the structure containing information about the
	 *     given object
	 */
	hemi.octane.setProperties = function(object, octane) {
		for (var ndx = 0, len = octane.props.length; ndx < len; ndx++) {
			var property = octane.props[ndx];
			var name = property.name;
			
			if (property.oct !== undefined) {
				if (property.oct instanceof Array) {
					value = [];
					
					for (var p = 0, pLen = property.oct.length; p < pLen; p++) {
						var child = hemi.octane.createObject(property.oct[p]);
						hemi.octane.setProperties(child, property.oct[p]);
						value.push(child);
					}
				} else {
					value = hemi.octane.createObject(property.oct);
					hemi.octane.setProperties(value, property.oct);
				}
				
				object[name] = value;
			} else if (property.val !== undefined) {
				object[name] = property.val;
			} else if (property.id !== undefined) {
				var value;
				
				if (property.id instanceof Array) {
					value = [];
					
					for (var p = 0, pLen = property.id.length; p < pLen; p++) {
						value.push(hemi.world.getCitizenById(property.id[p]));
					}
				} else {
					value = hemi.world.getCitizenById(property.id);
				}
				
				object[name] = value;
			} else if (property.arg !== undefined) {
				var func = object[name];
				func.apply(object, property.arg);
			} else {
				alert('Unable to process octane for ' + octane.id + ': missing property value');
			}
		}
	};
	
	return hemi;
})(hemi || {});
