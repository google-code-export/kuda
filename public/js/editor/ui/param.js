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

var editor = (function(module) {
	
	module.ui = module.ui || {};
	
	module.EventTypes = module.EventTypes || {};
	
	module.EventTypes.Params = {
		SetArgument: 'params.SetArgument'
	};
	
	var CIT_TREE_PNL_ID = 'prmWgtCitTreePnl',
		CIT_TREE_ID = 'prmWgtCitTree';
	
	var prmCitTree = module.ui.createCitizensTree(),
		prmCitTreePnl = jQuery('<div id="' + CIT_TREE_PNL_ID +'"></div>'),
		prmPadding = 0
		prmBorder = 0,
		counter = 0;
	
	prmCitTree.addListener(module.EventTypes.Trees.TreeCreated, 
		function(treeUI) {		
			prmCitTreePnl.append(treeUI);
			treeUI.attr('id', CIT_TREE_ID);	
			jQuery('body').append(prmCitTreePnl);
			prmCitTreePnl.hide();
			
			prmBorder = Math.ceil(parseFloat(prmCitTreePnl.css('borderRightWidth'))) 
				+ Math.ceil(parseFloat(prmCitTreePnl.css('borderLeftWidth')));
			prmPadding = Math.ceil(parseFloat(prmCitTreePnl.css('paddingLeft'))) 
				+ Math.ceil(parseFloat(prmCitTreePnl.css('paddingRight')));
		});
			
	prmCitTree.addListener(module.EventTypes.Trees.SelectCitizen, 
		function(data) {
			var elem = prmCitTreePnl.data('curElem'),
				btn = elem.children('button'), 
				ipt = elem.children('input'),
				wgt = ipt.data('widget');
			
			prmCitTreePnl.hide().data('curElem', null);
			prmCitTree.currentParamIpt = null;
			
			jQuery(document).unbind('click.' + wgt.config.prefix + 'CitTree');
			prmCitTreePnl.data('docBound', false);
			ipt.removeClass('open');
			btn.removeClass('open');
			
			if (wgt.config.sendsNotifications) {
				wgt.notifyListeners(module.EventTypes.Params.SetArgument, data);
			}
		});
		
	/*
	 * Configuration object for the ParamWidget.
	 */
	module.ui.ParamWidgetDefaults = {
		containerId: '',
		prefix: 'prmWgt',
		sendsNotifications: true
	};
	
	module.ui.ParamWidget = module.ui.Component.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.ui.ParamWidgetDefaults, 
					options),
				wgt = this;
			this.tree = prmCitTree;
			this.curArgs = new Hashtable();
			this.id = counter++;
			
		    this._super(newOpts);
		},
		
		fillParams: function(args, vals) {
			this.reset();
			
			var list = this.container,
				wgt = this,
				prefix = this.config.prefix,
				toggleFcn = function(evt){
					var oldElem = prmCitTreePnl.data('curElem'),
						elem = jQuery(this).parent(),
						btn = elem.children('button'), 
						ipt = elem.children('input');
					
					if (prmCitTreePnl.is(':visible') && oldElem 
							&& elem[0] === oldElem[0]) {
						prmCitTreePnl.slideUp(200).data('curElem', null);
						prmCitTree.currentParamIpt = null;
						
						jQuery(document).unbind('click.' + prefix + 'CitTree');
						prmCitTreePnl.data('docBound', false);
						ipt.removeClass('open');
						btn.removeClass('open');
					}
					else {
						var position = ipt.offset(),
							isDocBound = prmCitTreePnl.data('docBound'),
							width = ipt.outerWidth() + btn.outerWidth() -
								prmBorder - prmPadding;
						
						position.top += ipt.outerHeight();
						ipt.addClass('open');
						btn.addClass('open');
						prmCitTreePnl.css({
							top: position.top,
							left: position.left
						}).width(width).slideDown(200).data('curElem', elem);
						
						if (!isDocBound) {
							jQuery(document).bind('click.' + prefix + 'CitTree', function(evt){
								var target = jQuery(evt.target),
									parent = target.parents('#' + CIT_TREE_PNL_ID),
									id = target.attr('id');
								
								if (parent.size() == 0 
									&& id != CIT_TREE_PNL_ID
									&& !target.hasClass('prmWgtCitTreeBtn')
									&& !target.hasClass('prmWgtCitTreeIpt')) {
									prmCitTreePnl.slideUp(200);
									ipt.removeClass('open');
									btn.removeClass('open');
								}
							});
							prmCitTreePnl.data('docBound', true);
						}
						
						prmCitTree.currentParamIpt = btn.data('paramIn');
					}
				};
			
			for (var ndx = 0, len = args.length; ndx < len; ndx++) {
				var li = jQuery('<li></li>'),
					ip = jQuery('<input type="text" class="prmWgtCitTreeIpt"></input>'),
					lb = jQuery('<label></label>'),
					cb = jQuery('<button class="prmWgtCitTreeBtn dialogBtn">Citizens</button>'),
					arg = args[ndx],
					id = this.id + '_prmWgtParam_' + arg;
				
	            list.append(li);
	            li.append(lb).append(ip).append(cb);
				
	            var windowHeight = window.innerHeight ? window.innerHeight 
						: document.documentElement.offsetHeight,
					position = li.offset(),
					height = windowHeight - position.top;			
				
				ip.bind('click', toggleFcn);
				cb.data('paramIn', ip).bind('click', toggleFcn);
				
				lb.text(arg + ':');
				lb.attr('for', id);
				ip.attr('id', id)
				.data('paramName', arg).data('widget', wgt)
				.css('maxHeight', height);
								
				this.curArgs.put(id, ip);
				
				if (vals && vals[ndx] != null) {
					this.setArgument(arg, vals[ndx])
				}
			}
		},
		
		finishLayout: function() {
			this._super();
			
			this.container = jQuery('<ul id="' + this.config.containerId + '"></ul>');
		},
		
		getArgs: function() {
			var argsIpt = this.curArgs.values(),
				args = [];
			
			for (var ndx = 0, len = argsIpt.length; ndx < len; ndx++) {
				var ipt = argsIpt[ndx],
					val = ipt.data('trueVal');
				
				if (hemi.utils.isNumeric(val)) {
					val = parseFloat(val);
				}
				
				args.push({
					name: ipt.data('paramName'),
					value: val
				});				
			}
			
			return args;
		},
		
		reset: function() {				
			this.curArgs.clear();			
			this.container.empty();
		},
		
		setArgument: function(argName, argValue) {
			var ipt = this.curArgs.get(this.id + '_prmWgtParam_' + argName);
			if (/id:/.test(argValue)) {
				var cit = hemi.world.getCitizenById(
					parseInt(argValue.split(':').pop()));
				ipt.val(cit.getCitizenType().split('.').pop() + '.' + cit.name);
			}
			else {
				ipt.val(argValue);
			}
		}
	});
	
	return module;
})(editor || {});
