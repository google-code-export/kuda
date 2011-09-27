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

(function() {
	
////////////////////////////////////////////////////////////////////////////////
//                     			   Initialization  		                      //
////////////////////////////////////////////////////////////////////////////////

	editor.tools.animations = editor.tools.animations || {};

	editor.tools.animations.init = function() {
		var tabpane = editor.ui.getTabPane('Animation'),
			
			anmMdl = new AnimatorModel(),
			anmView = new AnimatorView(),
			anmCtr = new AnimatorController();
						
		anmCtr.setModel(anmMdl);
		anmCtr.setView(anmView);
		
		tabpane.toolbar.add(anmView);
	};
	
////////////////////////////////////////////////////////////////////////////////
//                     			  Tool Definition  		                      //
////////////////////////////////////////////////////////////////////////////////
    
    editor.EventTypes = editor.EventTypes || {};
	
	// model events
    editor.EventTypes.AnimationSet = "animator.AnimationSet";
    editor.EventTypes.AnimationStopped = "animator.AnimationStopped";
    editor.EventTypes.LoopRemoved = "animator.LoopRemoved";
    editor.EventTypes.ModelPicked = "animator.ModelPicked";
	
	// create animation widget events
    editor.EventTypes.ModelSelected = "crtAnm.ModelSelected";
    editor.EventTypes.RemoveAnmLoop = "crtAnm.RemoveAnmLoop";
    editor.EventTypes.SetAnimation = "crtAnm.SetAnimation";
    editor.EventTypes.StartPreview = "crtAnm.StartPreview";
    editor.EventTypes.StopPreview = "crtAnm.StopPreview";
    editor.EventTypes.AddAnmLoop = "crtAnm.AddAnmLoop";
    editor.EventTypes.EditAnmLoop = "crtAnm.EditAnmLoop";
	editor.EventTypes.SaveAnimation = "crtAnm.SaveAnimation";
	editor.EventTypes.SetAnmBeginFrame = "crtAnm.SetAnmBeginFrame";
	editor.EventTypes.SetAnmEndFrame = "crtAnm.SetAnmEndFrame";
	editor.EventTypes.SetAnmName = "crtAnm.SetAnmName";
	
	// animation list events
	editor.EventTypes.CreateAnimation = "anmList.CreateAnimation";
	editor.EventTypes.EditAnimation = "anmList.EditAnimation";
	editor.EventTypes.RemoveAnimation = "anmList.RemoveAnimation";
	
	// view events
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
    
    /**
     * An AnimatorModel handles the creation and playing of animations as well
     * as model picking for the animation tool.
     */
    var AnimatorModel = editor.ToolModel.extend({
		init: function() {
			this._super('animations');
	        
	        this.selectedModel;
	        this.hilights = new Hashtable();
	        this.hilightMaterial;
	        this.animation = null;
			this.animDirty = false;
			this.msgHandler = null;
			this.name = 'No Name';
			this.isUpdate = false;
	        
	        this.initSelectorUI();
			var that = this;
			
			hemi.msg.subscribe(hemi.msg.stop,
	            function(msg) {
					if (that.animation && msg.src === that.animation) {
						that.notifyListeners(editor.EventTypes.AnimationStopped, 
							that.animation);
					}
				});
	    },
	    
	    /**
	     * Creates an animation object
	     */
	    createAnimation: function() {	        
	        if (!this.animation) {				
	            this.animation = hemi.animation.createModelAnimation(
					this.selectedModel, this.startTime, this.endTime);
				this.animation.name = this.name;
				this.animation.reset();
				this.animDirty = true;
	        }   
	        else if (this.startTime != null && this.endTime != null) {				
	            this.stopAnimation();
	            this.animation.beginTime = this.startTime;
	            this.animation.endTime = this.endTime;
	            this.animation.reset();
				this.animation.name = this.name;
	        } 
	    },  
	    
	    /**
	     * Creates an animation loop and adds it to the current animation 
	     * object.  If no animation object exists, this  returns false, true
	     * otherwise.
	     * 
	     * @param {number} start the starting keyframe for the loop 
	     * @param {number} end the end keyframe for the loop
	     * @param {number} iterations the number of iterations to loop over.  
	     *        Specify a -1 if looping infinitely.
	     *        
	     * @return {boolean} true if the loop was created, false otherwise.
	     */
	    createLoop: function(start, end, iterations) {			
	        if (!this.animation) {
				this.createAnimation();
			}

            var loop = new hemi.animation.Loop();
			loop.startTime = hemi.view.getTimeOfFrame(start);
			loop.stopTime = hemi.view.getTimeOfFrame(end);
			loop.iterations = iterations;
			
            this.stopAnimation();
            this.animation.addLoop(loop);
        
	        return loop;
	    },
	    
	    /**
	     * Enables or disables pick message handling
	     * 
	     * @param {boolean} enable flag that enables pick handling if true, 
	     *        disables otherwise.
	     */
	    enableModelPicking: function(enable) {
	        this.enable = enable;
			
			if (this.msgHandler !== null) {
				hemi.world.unsubscribe(this.msgHandler, hemi.msg.pick);
				this.msgHandler = null;
			}
	        
	        if (enable) {	            
	            if (this.selectedModel) {
//	                this.hilightShapes();
	            }
	        }
	        else {
	            this.removeHilights();
	        }
	    },
	
	    /**
	     * Highlights all shapes in the selected model.
	     * 
	     * TODO: Highlights cause performance problems. Try shader manipulation
	     * instead.
	     */
	    hilightShapes: function() {
	        var transforms = this.selectedModel.transforms;
	        
	        for (var ndx = 0, len = transforms.length; ndx < len; ndx++) {
	            // make a copy of the selected shape so we can use it to hilight.
	            var transform = transforms[ndx];
	            var shapes = transform.shapes;
	            var hilightedShapes = [];
	            
	            for (var sndx = 0, slen = shapes.length; sndx < slen; sndx++) {
	                var hilightShape = hemi.core.shape.duplicateShape(
						hemi.core.mainPack, shapes[sndx], 'hilight_');
	                
	                // Set all of it's elements to use the hilight material.
	                var elements = hilightShape.elements;
	                
	                for (var ee = 0; ee < elements.length; ee++) {
	                    elements[ee].material = this.hilightMaterial;
	                }
	                
	                // Add it to the same transform
	                transform.addShape(hilightShape);
	                hilightedShapes.push(hilightShape);
	            }
	            
	            this.hilights.put(transform, hilightedShapes);
	        }
	    },
	    
	    /**
	     * Initializes UI for highlighting a selection.
	     */
	    initSelectorUI: function() {
	        this.hilightMaterial = hemi.core.material.createConstantMaterial(
	            hemi.core.mainPack, 
	            hemi.view.viewInfo, 
	            [0, 1, 0, 0.3],
	            true);
	        // Setup a state to bring the lines forward.
	        var state = hemi.core.mainPack.createObject('State');
	        state.getStateParam('PolygonOffset2').value = -1.0;
	        state.getStateParam('FillMode').value = 
				hemi.core.o3d.State.WIREFRAME;
	        this.hilightMaterial.state = state;
	    },
	    
	    /**
	     * Starts an animation for preview purposes.
	     */
	    previewAnimation: function() {
			this.createAnimation();
			
	        this.animation.start();	                   
	    }, 
		
	    removeAnimation: function(animation) {
	        this.notifyListeners(editor.events.Removed, animation);
			animation.cleanup();
		},
	    
	    /**
	     * Removes highlight shapes from the selected model.
	     */
	    removeHilights: function() {
	        if (this.selectedModel) {
	            var transforms = this.hilights.keys();
	            
	            for (var ndx = 0, len = transforms.length; ndx < len; ndx++) {
	                var transform = transforms[ndx];
	                var shapes = this.hilights.get(transform);
	                
	                for (var ndx2 = 0, len2 = shapes.length; ndx2 < len2; ndx2++) {
	                    var shape = shapes[ndx2];
	                    // Remove it from the transform of the selected object.
	                    transform.removeShape(shape);
	                    // Remove everything related to it.
	                    hemi.core.shape.deleteDuplicateShape(shape, 
							hemi.core.mainPack);
	                }
	            }
	            
	            this.hilights.clear();
	        }
	    },   
	    
	    /**
	     * Removes the given loop.
	     * 
	     * @param {hemi.animation.Loop} loop the loop to remove.
	     */
	    removeLoop: function(loop) {
	        if (this.animation) {
	            this.stopAnimation();
	            this.animation.removeLoop(loop);
	            this.notifyListeners(editor.EventTypes.LoopRemoved, loop);
	        }
	    },
		
	    saveAnimation: function() {
			var retVal = null,
				msgType = this.isUpdate ? editor.events.Updated
					: editor.events.Created;
			
			this.createAnimation();
			
			retVal = this.animation;
			
			this.stopAnimation();
			this.notifyListeners(msgType, this.animation);
			
			this.animation = null;
			this.animDirty = this.isUpdate = false;	
			this.startTime = this.endTime = null;
			this.name = 'No Name';
			
			return retVal;
		},
		
		saveLoop: function(loop, start, end, iterations) {
			this.stopAnimation();
			
			loop.startTime = hemi.view.getTimeOfFrame(start);
			loop.stopTime = hemi.view.getTimeOfFrame(end);
			loop.iterations = iterations;
			loop.current = 0;
		},
		
		setAnimation: function(animation) {
			this.setModel(animation.target);
			this.animation = animation;
			this.name = animation.name;
			this.startTime = animation.beginTime;
			this.endTime = animation.endTime;
			this.isUpdate = true;
			this.notifyListeners(editor.EventTypes.AnimationSet, animation);
		},
		
		setEnd: function(endFrame) {
			this.endTime = hemi.view.getTimeOfFrame(endFrame);
		},
		
		setModel: function(model) {	            
			if (this.selectedModel !== model) {
        		this.unSelectAll();
				this.notifyListeners(editor.EventTypes.ModelPicked, model);
	            this.selectedModel = model;
				if (model != null) {
//					this.hilightShapes();
				}
			}
		},
		
		setName: function(name) {
			this.name = name;
		},
		
		setStart: function(startFrame) {
			this.startTime = hemi.view.getTimeOfFrame(startFrame);
		},
	    
	    /**
	     * Stops an animation and resets to the beginning keyframe.
	     */
	    stopAnimation: function() {
	        if (this.animation && this.animation.target.isAnimating) {
	            this.animation.stop();
	            this.animation.reset();
	            this.animation.updateTarget(this.animation.currentTime);
	        }
	    },
	    
	    /**
	     * Unselects the current selection(s).
	     */
	    unSelectAll: function() {
	        if (this.selectedModel) {
	            this.removeHilights();
	            this.selectedModel = null;
				this.animation = null;
	        }
	    },
		
	    worldCleaned: function() {
	        var animations = hemi.world.getAnimations();
	    	
	        for (var ndx = 0, len = animations.length; ndx < len; ndx++) {
	            var anm = animations[ndx];
	            this.notifyListeners(editor.events.Removed, anm);
	        }
	    },
		
	    worldLoaded: function() {
			var animations = hemi.world.getAnimations();
			
			for (var ndx = 0, len = animations.length; ndx < len; ndx++) {
				var anm = animations[ndx];
	            this.notifyListeners(editor.events.Created, anm);
			}
	    }
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     Create Animation Sidebar Widget                        //
//////////////////////////////////////////////////////////////////////////////// 
	
	var ButtonText = {
		START: 'Start Preview',
		STOP: 'Stop Preview'
	};
	
	var CreateWidget = editor.ui.FormWidget.extend({
		init: function(options) {
		    this._super({
				name: 'createAnmWidget',
				uiFile: 'js/editor/plugins/animations/html/animationsForms.htm',
		        instructions: 'Click on a model to select it'
			});
		    
		    this.loops = [];
		    var wgt = this;
			
			hemi.msg.subscribe(hemi.msg.load, function(msg) {
				if (msg.src instanceof hemi.model.Model) {
					var mdl = msg.src,
						id = mdl.getId();
					wgt.selector.append('<option id="anmMdlSel_' + id + '" value="' + id + '">'
						+ mdl.name + '</option>');
					wgt.selector.sb('refresh');
				}
			});
			
			hemi.msg.subscribe(hemi.msg.unload, function(msg) {
				if (msg.src instanceof hemi.model.Model) {
					var id = msg.src.getId(),
						elemId = 'anmMdlSel_' + id;
					if (parseInt(wgt.selector.val()) === id) {
						wgt.reset();
					}
					
					wgt.find('#' + elemId).remove();
					wgt.selector.sb('refresh');
				}
			});
		},
		
		addLoopInput: function(loop, min, max) {
			var wgt = this,
				wrapper = jQuery('<li class="loopEditor"></li>'),
				startVal = loop.startTime * hemi.view.FPS,
				endVal = loop.stopTime * hemi.view.FPS,
				itrVal = loop.iterations,
				validator = new editor.ui.Validator(null, function(elem) {
					var val = elem.val(),
						begins = startInput.getValue(),
						ends = endInput.getValue(),
						min = slider.slider('option', 'min'),
						max = slider.slider('option', 'max'),
						msg = null;
						
					if (val !== '' && !hemi.utils.isNumeric(val)) {
						msg = 'must be a number';
					}
					else if (elem.hasClass('loopStart')) {
						if (begins > ends && ends >= min) {
							msg = 'beginning must be less than end';
						}
						else if (begins < min) {
							msg = 'must be greater than or equal to ' + min; 
						}
					}
					else if (elem.hasClass('loopEnd')) {
						if (begins > ends && begins <= max) {
							msg = 'end must be greater than beginning';
						}
						else if (ends > max) {
							msg = 'must be less than or equal to ' + max;
						}
					}
					
					return msg;
				}),
				blurFcn = function(ipt, evt) {
					var begins = startInput.getValue(),
						ends = endInput.getValue(),
						itr = itrInput.getValue(),
						curMin = slider.slider('option', 'min'),
						curMax = slider.slider('option', 'max');
					
					if (begins != null && ends != null && itr != null
							&& begins <= ends && begins >= curMin
							&& ends <= curMax) {
						slider.slider('option', 'values', [begins, ends]);
						
		                wgt.notifyListeners(editor.EventTypes.EditAnmLoop, {
		                    loop: wrapper.data('obj'),
							start: begins,
							end: ends,
							itr: itr
		                });
					}
				},
				startInput = new editor.ui.Input({
					inputClass: 'loopStart',
					onBlur: blurFcn,
					placeHolder: 'From',
					type: 'integer',
					validator: validator
				}),
				endInput = new editor.ui.Input({
					inputClass: 'loopEnd',
					onBlur: blurFcn,
					placeHolder: 'To',
					type: 'integer',
					validator: validator
				}),
				itrInput = new editor.ui.Input({
					onBlur: blurFcn,
					placeHolder: 'Repeat',
					type: 'integer',
					validator: validator
				}),
				removeBtn = jQuery('<button class="icon removeBtn">Remove</button>'),
				formDiv = jQuery('<div class="loopForms"></div>'),
				slider = jQuery('<div class="loopSlider"></div>').slider({
						range: true,
						min: min,
						max: max,
						slide: function(evt, ui) {
							var min = ui.values[0],
								max = ui.values[1];
								
							startInput.setValue(min);	
							endInput.setValue(max);
						},
						values: [startVal, endVal]
					});
			
			this.find('#anmLoopData').show();
			slider.bind('slidechange', function(evt, ui) {
				var loop = wrapper.data('obj'),				
					values = slider.slider('option', 'values'),
					itr = itrInput.getValue();
					
	                wgt.notifyListeners(editor.EventTypes.EditAnmLoop, {
	                    loop: loop,
						start: values[0],
						end: values[1],
						itr: itr
	                });
			});
			
			removeBtn.bind('click', function(evt) {
				var loop = wrapper.data('obj');
				wgt.notifyListeners(editor.EventTypes.RemoveAnmLoop, loop);
			});
			
			formDiv.append(startInput.getUI()).append(endInput.getUI())
				.append(itrInput.getUI());
			wrapper.append(slider).append(formDiv).append(removeBtn)
				.data('obj', loop);
			
			startInput.setValue(startVal);
			endInput.setValue(endVal);
			itrInput.setValue(itrVal);
			
			this.loopList.append(wrapper);
			this.loops.push({
				loop: loop,
				start: startInput,
				end: endInput,
				slider: slider
			});
		},
		
		removeLoop: function(loop) {
			for (var i = 0, il = this.loops.length; i < il; ++i) {
				var obj = this.loops[i];
				
				if (obj.loop === loop) {
					obj.wrapper.remove();
					this.loops.splice(i, 1);
					break;
				}
			}
		},
		
		finishLayout: function() {
			this._super();
			
			var wgt = this,
				inputs = this.find('#anmBeginFrame, #anmEndFrame, #anmName'),
				validator = new editor.ui.Validator(null, function(elem) {
					var val = elem.val(),
						id = elem.attr('id');
						begins = wgt.beginInput.getValue(),
						ends = wgt.endInput.getValue(),
						min = wgt.slider.slider('option', 'min'),
						max = wgt.slider.slider('option', 'max'),
						msg = null;
						
					if (val !== '' && !hemi.utils.isNumeric(val)) {
						msg = 'must be a number';
					}
					else if (id === 'anmBeginFrame') {
						if (begins > ends && ends >= min) {
							msg = 'beginning must be less than end';
						}
						else if (begins < min) {
							msg = 'must be greater than or equal to ' + min; 
						}
					}
					else if (id === 'anmEndFrame') {
						if (begins > ends && begins <= max) {
							msg = 'end must be greater than beginning';
						}
						else if (ends > max) {
							msg = 'must be less than or equal to ' + max;
						}
					}
					
					return msg;
				}),
				blurFcn = function(ipt, evt) {
					var param = ipt.getUI().attr('id'),
						begins = wgt.beginInput.getValue(),
						ends = wgt.endInput.getValue(),
						min = wgt.slider.slider('option', 'min'),
						max = wgt.slider.slider('option', 'max'),
						msgType = null,
						val = null;
					
					switch(param) {
						case 'anmBeginFrame':
						    msgType = editor.EventTypes.SetAnmBeginFrame;
						    val = begins;
							break; 
						case 'anmEndFrame':
						    msgType = editor.EventTypes.SetAnmEndFrame;
						    val = ends;
							break;
						case 'anmName':
						    msgType = editor.EventTypes.SetAnmName;
							val = wgt.nameInput.getValue();
							break;
					}
	
					if (val != null && begins <= ends && begins >= min 
							&& ends <= max) {	
						wgt.canSave();	
						wgt.slider.slider('option', {
							values: [begins, ends]
						});
						wgt.find('.loopSlider').slider('option', {
							min: begins,
							max: ends
						});
						wgt.notifyListeners(msgType, val);
					}
				};
			
			this.slider = this.find('#anmSlider');
			this.selector = this.find('#anmModelSelect');
	        this.addBtn = this.find('#anmLoopAdd');
        	this.saveBtn = this.find('#anmSaveBtn');
			this.cancelBtn = this.find('#anmCancelBtn');
			this.anmPreviewBtn = this.find('#anmPreviewBtn');
			this.loopList = this.find('#anmLoopList');
			
			this.beginInput = new editor.ui.Input({
				container: wgt.find('#anmBeginFrame'),
				onBlur: blurFcn,
				validator: validator
			});
			this.endInput = new editor.ui.Input({
				container: wgt.find('#anmEndFrame'),
				onBlur: blurFcn,
				validator: validator
			});
			this.nameInput = new editor.ui.Input({
				container: wgt.find('#anmName'),
				onBlur: blurFcn,
				type: 'string'
			});
			                 
	        this.find('form').submit(function() {
	            return false;
	        });
			
			this.selector.bind('change', function(evt) {
				var mdl = hemi.world.getCitizenById(
					parseInt(jQuery(this).val()));
				wgt.notifyListeners(editor.EventTypes.ModelSelected, mdl);
				wgt.invalidate();
			})
			.addClass('fixedWidth').sb({
				fixedWidth: true
			});
	            
	        inputs.bind('keyup', function(evt) {				
				wgt.canSave();
			});
			
			this.slider.slider({
				range: true,
				min: 0,
				max: 100,
				values: [0, 100],
				slide: function(evt, ui) {
					var min = ui.values[0],
						max = ui.values[1];
						
					wgt.beginInput.setValue(min);	
					wgt.endInput.setValue(max);
					wgt.updateLoopLimits(min, max);
					wgt.canSave();
				},
				change: function(evt, ui) {					
					var min = ui.values[0],
						max = ui.values[1];

					wgt.updateLoopLimits(min, max);
					wgt.notifyListeners(editor.EventTypes.SetAnmBeginFrame, min);
					wgt.notifyListeners(editor.EventTypes.SetAnmEndFrame, max);
				}
			});
	        
	        this.anmPreviewBtn.bind('click', function(evt) {
				var btn = jQuery(this);
				
				if (btn.data('previewing')) {
	            	wgt.notifyListeners(editor.EventTypes.StopPreview, null);
					btn.text(ButtonText.START).data('previewing', false);
				}
				else {
					wgt.notifyListeners(editor.EventTypes.StartPreview, null);
					btn.text(ButtonText.STOP).data('previewing', true);
				}
	        }).data('previewing', false);
	        
	        this.addBtn.bind('click', function(evt) {         
	        	var start = wgt.beginInput.getValue(), 
					end = wgt.endInput.getValue();
						
	            wgt.notifyListeners(editor.EventTypes.AddAnmLoop, {
	                start: start,
	                end: end
	            });
				wgt.invalidate();
	        });
	        
	        this.saveBtn.bind('click', function(evt) {
	        	var start = wgt.beginInput.getValue(), 
					end = wgt.endInput.getValue(),
	            	name = wgt.nameInput.getValue();
				
				wgt.notifyListeners(editor.EventTypes.SaveAnimation, {
					start: start,
					end: end,
					name: name
				});
				wgt.reset();
	        });
			
			this.cancelBtn.bind('click', function(evt) {
				wgt.reset();
				wgt.notifyListeners(editor.events.Cancel, null);
				wgt.find('input.error').removeClass('error');
				wgt.invalidate();
			});
		},	
	    
	    modelSelected: function(model) { 
	    	this.reset();
	    	
	    	if (model) {
	    		var max = parseInt(model.getMaxAnimationTime() * hemi.view.FPS);
	    		this.selector.val(model.getId());
				
				if (max > 0) {
					this.find('#anmKeyframes, #anmLoops, #anmPreview').show(200);
					this.slider.slider('option', {
						min: 0,
						max: max,
						values: [0, max]
					});
					this.beginInput.setValue(0);
					this.endInput.setValue(max);
					this.notifyListeners(editor.EventTypes.SetAnmBeginFrame, 0);
					this.notifyListeners(editor.EventTypes.SetAnmEndFrame, max);
				}
				
				this.canSave();
			} 
	    },
		
		reset: function() {
	        this.loops = [];
	        this.beginInput.reset();
			this.endInput.reset();
			this.nameInput.reset();
			this.selector.val(-1);
	        this.find('#anmKeyframes, #anmLoops, #anmPreview').hide();
	        this.find('#anmLoopList').find('.loopEditor').remove();
	        this.canSave();
		},
		
		set: function(animation) {
			this.reset();
			this.selector.val(animation.target.getId());
	        this.find('#anmKeyframes, #anmLoops, #anmPreview').show();
			
			var loopList = animation.loops,
				min = animation.beginTime * hemi.view.FPS,
				max = animation.endTime * hemi.view.FPS;
			
			for (var ndx = 0, len = loopList.length; ndx < len; ndx++) {
				this.addLoopInput(loopList[ndx], min, max);
			}
			
	        this.beginInput.setValue(min);
	        this.endInput.setValue(max);
	        this.nameInput.setValue(animation.name);
			
			this.slider.slider('option', {
				values: [min, max]
			});
			
			this.anmPreviewBtn.removeAttr('disabled');
			this.notifyListeners(editor.EventTypes.SetAnimation, animation);
		},
		
		updateLoopLimits: function(min, max) {
			for (var i = 0, il = this.loops.length; i < il; ++i) {
				var obj = this.loops[i],
					starts = obj.start.getValue(),
					ends = obj.end.getValue();
				
				if (starts < min) {
					starts = min;
					obj.start.setValue(min);
				}
				if (ends > max) {
					ends = max;
					obj.end.setValue(max);
				}
				
				obj.slider.slider('option', {
					min: min,
					max: max
				})
				.slider('option', 'values', [starts, ends]);
			}
		},
		
		canSave: function() {
			var start = this.beginInput.getValue(), 
				end = this.endInput.getValue(),
            	name = this.nameInput.getValue();
            
            if (start != null && end != null) {				
            	this.anmPreviewBtn.removeAttr('disabled');
            	
            	if (name != null) {
	                this.saveBtn.removeAttr('disabled');
	            } else {
					this.saveBtn.attr('disabled', 'disabled');
				}
            } else {
                this.saveBtn.attr('disabled', 'disabled');
                this.anmPreviewBtn.attr('disabled', 'disabled');
            }
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     	 Animation List Sidebar Widget                        //
////////////////////////////////////////////////////////////////////////////////     
		
	var ListWidget = editor.ui.ListWidget.extend({
		init: function(options) {
		    this._super({
				name: 'anmListWidget',
				listId: 'animationList',
				prefix: 'anmLst',
				instructions: "Add animations above.",
				title: 'Animations'
			});	
		},
		
		bindButtons: function(li, obj) {
			var wgt = this;
			
			li.editBtn.bind('click', function(evt) {
				wgt.notifyListeners(editor.EventTypes.EditAnimation, 
					obj);
			});
			
			li.removeBtn.bind('click', function(evt) {
				wgt.notifyListeners(editor.EventTypes.RemoveAnimation, 
					obj);
			});
		},
		
		getOtherHeights: function() {
			return this.buttonDiv.outerHeight(true);
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////    
    
    /**
     * The AnimatorView controls the dialog and toolbar widget for the 
     * animation tool.
     */
    var AnimatorView = editor.ToolView.extend({
		init: function() {
			this._super({
		        toolName: 'Animator',
				toolTip: 'Create and edit key frame animations',
		        elemId: 'animationsBtn',
				id: 'animations'
		    });
			
			this.addPanel(new editor.ui.Panel({
				name: 'sidePanel',
				classes: ['anmSidePanel']
			}));
			
			this.sidePanel.addWidget(new CreateWidget());
			this.sidePanel.addWidget(new ListWidget());
		}
	});
	
    
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The AnimatorController facilitates AnimatorModel and AnimatorView
     * communication by binding event and message handlers.
     */
    var AnimatorController = editor.ToolController.extend({
		init: function() {
			this._super();
    	},
		
	    /**
	     * Binds event and message handlers to the view and model this object 
	     * references.  
	     */
	    bindEvents: function() {
			this._super();
	        
	        var model = this.model,
	        	view = this.view,
				crtWgt = view.sidePanel.createAnmWidget,
				lstWgt = view.sidePanel.anmListWidget;
	        
	        view.addListener(editor.events.ToolModeSet, function(value) {
	            var isDown = value.newMode == editor.ToolConstants.MODE_DOWN;				
	            model.enableModelPicking(isDown);
	            model.stopAnimation();
	        });	
			
			// creat animation widget specific		    
	        crtWgt.addListener(editor.EventTypes.AddAnmLoop, function(obj) {
				var loop = model.createLoop(obj.start, obj.end, -1);		
	            crtWgt.addLoopInput(loop, obj.start, obj.end);      
	        });	  	
			crtWgt.addListener(editor.events.Cancel, function () {
				model.unSelectAll();
			});   
	        crtWgt.addListener(editor.EventTypes.EditAnmLoop, function(obj) {				
	            model.saveLoop(obj.loop, obj.start, obj.end, obj.itr);     
	        });	
			crtWgt.addListener(editor.EventTypes.RemoveAnmLoop, function(value) {
				model.removeLoop(value);
			});		
			crtWgt.addListener(editor.EventTypes.SaveAnimation, function (value) {
				var animation = model.saveAnimation();       	            
	            if (animation) {
					crtWgt.reset();
	                model.unSelectAll();
	            }
			});			
			crtWgt.addListener(editor.EventTypes.SetAnimation, function(value) {
				if (value === null && model.animDirty) {
					model.removeAnimation(model.animation);
					model.animDirty = false;
				}
				
				model.animation = value;
			});		
			crtWgt.addListener(editor.EventTypes.SetAnmBeginFrame, function (starts) {
				model.setStart(starts);     
			});			
			crtWgt.addListener(editor.EventTypes.SetAnmEndFrame, function (ends) {
				model.setEnd(ends);     
			});			
			crtWgt.addListener(editor.EventTypes.SetAnmName, function (name) {
				model.setName(name);     
			});	
			crtWgt.addListener(editor.EventTypes.StartPreview, function(value) {
	            model.previewAnimation();			
			});	        
	        crtWgt.addListener(editor.EventTypes.StopPreview, function(value) {
	            model.stopAnimation();
	        });	   
	        crtWgt.addListener(editor.EventTypes.ModelSelected, function(mdl) {
	            model.setModel(mdl);
	        });		 	
			
			// animation list widget specific
			lstWgt.addListener(editor.EventTypes.EditAnimation, function(animation) {
				model.setAnimation(animation);
			});			
			lstWgt.addListener(editor.EventTypes.RemoveAnimation, function(animation) {
				model.removeAnimation(animation);
			});
	        
			// model specific	
			model.addListener(editor.events.Created, function(animation) {
				lstWgt.add(animation);
			});	     	
	        model.addListener(editor.events.Removed, function(animation) {
	            lstWgt.remove(animation);
	        });
	        model.addListener(editor.EventTypes.AnimationSet, function(animation) {
	        	crtWgt.set(animation);
	        });
	        model.addListener(editor.EventTypes.AnimationStopped, function(value) {
	        	crtWgt.anmPreviewBtn.text(ButtonText.START).data('previewing', false);
	        });
	        model.addListener(editor.EventTypes.LoopRemoved, function(loop) {
	            crtWgt.removeLoop(loop);
	        });
	        model.addListener(editor.events.Updated, function(animation) {
	            lstWgt.update(animation);
	        });		
	        model.addListener(editor.EventTypes.ModelPicked, function(model) {
	            crtWgt.modelSelected(model);
	        });
	    }
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     			  	Extra Scripts  		                      //
////////////////////////////////////////////////////////////////////////////////

	editor.getCss('js/editor/plugins/animations/css/style.css');
})();
