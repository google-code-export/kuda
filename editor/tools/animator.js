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

var editor = (function(module) {
    module.tools = module.tools || {};
    
    module.EventTypes = module.EventTypes || {};
	
	// model events
    module.EventTypes.ModelPicked = "animator.ModelPicked";
    module.EventTypes.AnimationCreated = "animator.AnimationCreated";
    module.EventTypes.AnimationUpdated = "animator.AnimationUpdated";
	module.EventTypes.AnimationRemoved = "animator.AnimationRemoved";
    module.EventTypes.AnimationStopped = "animator.AnimationStopped";
	
	// create animation widget events
    module.EventTypes.RemoveAnmLoop = "crtAnm.RemoveAnmLoop";
    module.EventTypes.SetAnimation = "crtAnm.SetAnimation";
    module.EventTypes.StartPreview = "crtAnm.StartPreview";
    module.EventTypes.StopPreview = "crtAnm.StopPreview";
    module.EventTypes.AddAnmLoop = "crtAnm.AddAnmLoop";
    module.EventTypes.EditAnmLoop = "crtAnm.EditAnmLoop";
	module.EventTypes.SaveAnimation = "crtAnm.SaveAnimation";
	module.EventTypes.SetAnmBeginFrame = "crtAnm.SetAnmBeginFrame";
	module.EventTypes.SetAnmEndFrame = "crtAnm.SetAnmEndFrame";
	module.EventTypes.SetAnmName = "crtAnm.SetAnmName";
	module.EventTypes.CancelCreateAnm = "crtAnm.CancelCreateAnm";
	
	// animation list events
	module.EventTypes.CreateAnimation = "anmList.CreateAnimation";
	module.EventTypes.EditAnimation = "anmList.EditAnimation";
	module.EventTypes.RemoveAnimation = "anmList.RemoveAnimation";
	
	// view events
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
    
    /**
     * An AnimatorModel handles the creation and playing of animations as well
     * as model picking for the animation tool.
     */
    module.tools.AnimatorModel = module.tools.ToolModel.extend({
		init: function() {
			this._super();
	        
	        this.selectedModel;
	        this.hilights = new Hashtable();
	        this.hilightMaterial;
	        this.animation;
			this.animDirty = false;
			this.msgHandler = null;
			this.name = 'No Name';
			this.isUpdate = false;
	        
	        this.initSelectorUI();
			var that = this;
			
			hemi.msg.subscribe(hemi.msg.stop,
	            function(msg) {
					if (that.animation && msg.src === that.animation) {
						that.notifyListeners(module.EventTypes.AnimationStopped, 
							that.animation);
					}
				});
	    },
		
	    worldCleaned: function() {
	        var animations = hemi.world.getAnimations();
	    	
	        for (var ndx = 0, len = animations.length; ndx < len; ndx++) {
	            var anm = animations[ndx];
	            this.notifyListeners(module.EventTypes.AnimationRemoved, anm);
	        }
	    },
		
	    worldLoaded: function() {
			var animations = hemi.world.getAnimations();
			
			for (var ndx = 0, len = animations.length; ndx < len; ndx++) {
				var anm = animations[ndx];
	            this.notifyListeners(module.EventTypes.AnimationCreated, anm);
			}
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
	            this.msgHandler = hemi.world.subscribe(
	                hemi.msg.pick,
	                this,
	                "onPick",
	                [hemi.dispatch.MSG_ARG + "data.pickInfo"]);
	            
	            if (this.selectedModel) {
	                this.hilightShapes();
	            }
	        }
	        else {
	            this.removeHilights();
	        }
	    },
	    
	    /**
	     * Called when a pick occurs.  
	     * 
	     * @param {Object} pickInfo pick information
	     */
	    onPick: function(pickInfo) {
	        this.selectModel(pickInfo);
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
	     * Selects a model based off the pickInfo.  Once selected, the model
	     * gets highlighted and sends a hemi.msg.modelPicked message.  
	     * 
	     * @param {Object} pickInfo the pick information
	     */
	    selectModel: function(pickInfo) {			
	        if (pickInfo) {
	            var transform = pickInfo.shapeInfo.parent.transform,
					model = hemi.world.getTranOwner(transform);
				
				this.setModel(model);
	        }
	    },
		
		setModel: function(model) {	            
			if (this.selectedModel !== model) {
        		this.unSelectAll();
				this.notifyListeners(module.EventTypes.ModelPicked, model);
	            this.selectedModel = model;
	            this.hilightShapes();
			}
		},
	
	    /**
	     * Highlights all shapes in the selected model.
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
	     * Unselects the current selection(s).
	     */
	    unSelectAll: function() {
	        if (this.selectedModel) {
	            this.removeHilights();
	            this.selectedModel = null;
				this.animation = null;
	        }
	    },
		
		setAnimation: function(animation) {
			this.animation = animation;
			this.name = animation.name;
			this.startTime = animation.beginTime;
			this.endTime = animation.endTime;
			this.isUpdate = true;
		},
		
		setStart: function(startFrame) {
			this.startTime = hemi.view.getTimeOfFrame(startFrame);
		},
		
		setEnd: function(endFrame) {
			this.endTime = hemi.view.getTimeOfFrame(endFrame);
		},
		
		setName: function(name) {
			this.name = name;
		},
	    
	    /**
	     * Starts an animation for preview purposes.
	     */
	    previewAnimation: function() {
			this.createAnimation();
			
	        this.animation.start();	                   
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
			
            var start = hemi.view.getTimeOfFrame(start),
            	end = hemi.view.getTimeOfFrame(end),
            	iterations = parseInt(iterations),            
            	loop = new hemi.animation.Loop();
				
			loop.startTime = start;
			loop.stopTime = end;
			loop.iterations = iterations;
            this.stopAnimation();
            this.animation.addLoop(loop);
        
	        return loop;
	    },
		
		saveLoop: function(loop, start, end, iterations) {
			this.stopAnimation();
			
			loop.startTime = hemi.view.getTimeOfFrame(start);
			loop.stopTime = hemi.view.getTimeOfFrame(end);
			loop.iterations = iterations;
			loop.current = 0;
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
	        }
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
		
	    saveAnimation: function() {
			var retVal = null,
				msgType = this.isUpdate ? module.EventTypes.AnimationUpdated
					: module.EventTypes.AnimationCreated;
			
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
		
	    removeAnimation: function(animation) {
	        this.notifyListeners(module.EventTypes.AnimationRemoved, animation);
			animation.cleanup();
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     Create Animation Sidebar Widget                        //
//////////////////////////////////////////////////////////////////////////////// 
		
	/*
	 * Configuration object for the HiddenItemsSBWidget.
	 */
	module.tools.CreateAnmSBWidgetDefaults = {
		name: 'createAnmSBWidget',
		uiFile: 'editor/tools/html/animationsForms.htm',
        instructions: 'Click on a model to select it',
		manualVisible: true
	};
	
	module.tools.CreateAnmSBWidget = module.ui.SidebarWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, 
				module.tools.CreateAnmSBWidgetDefaults, options);
		    this._super(newOpts);
			
			this.hiddenItems = new Hashtable();		
		},
		
		finishLayout: function() {
			this._super();
			this.slider = this.find('#anmSlider');
			
	        this.addBtn = this.find('#anmLoopAdd');
        	this.saveBtn = this.find('#anmSaveBtn');
			this.cancelBtn = this.find('#anmCancelBtn');
			this.startBtn = this.find('#anmStartBtn');
			this.stopBtn = this.find('#anmStopBtn');
			this.beginInput = this.find('#anmBeginFrame');
			this.endInput = this.find('#anmEndFrame');
			this.loopList = this.find('#anmLoopList');
			
			var wgt = this,
				inputs = this.find('#anmBeginFrame, #anmEndFrame, #anmName'),
				frameInputs = this.find('#anmBeginFrame, #anmEndFrame');   
			                 
	        this.find('form').submit(function() {
	            return false;
	        });
			
	        this.find('#anmModelVal').html(this.config.instructions);
			
			// add validation
			new module.ui.Validator(frameInputs, function(elem) {
				var val = elem.val(),
					id = elem.attr('id');
					begins = parseInt(wgt.beginInput.val()),
					ends = parseInt(wgt.endInput.val()),
					min = wgt.slider.slider('option', 'min'),
					max = wgt.slider.slider('option', 'max'),
					msg = null;
					
				if (val !== '' && !hemi.utils.isNumeric(val)) {
					msg = 'must be a number';
				}
				else if (id === 'anmBeginFrame') {
					if (begins > ends && ends >= min) {
						msg = 'begin must be less than end';
					}
					else if (begins < min) {
						msg = 'begin must be greater than ' + min; 
					}	
				}
				else if (id === 'anmEndFrame') {
					if (begins > ends && begins <= max) {
						msg = 'end must be greater than beginning';
					}
					else if (ends > max) {
						msg = 'end must be lass than ' + max;
					}					
				}
				
				return msg;
			});
	            
	        inputs.bind('change', function(evt) {
				var elem = jQuery(this),
					oldVal = elem.data('oldVal'),
					txtVal = elem.val(),
					val = parseInt(txtVal),
					param = elem.attr('id'),
					begins = parseInt(wgt.beginInput.val()),
					ends = parseInt(wgt.endInput.val()),
					min = wgt.slider.slider('option', 'min'),
					max = wgt.slider.slider('option', 'max'),
					msgType = null;
				
				switch(param) {
					case 'anmBeginFrame':
					    msgType = module.EventTypes.SetAnmBeginFrame;
						break; 
					case 'anmEndFrame':
					    msgType = module.EventTypes.SetAnmEndFrame;
						break;
					case 'anmName':
					    msgType = module.EventTypes.SetAnmName;
						val = txtVal;
						break;
				}

				if (txtVal !== '' && begins <= ends && begins >= min 
						&& ends <= max){	
					wgt.validate();	
					wgt.slider.slider('option', {
						values: [begins, ends]
					});
					wgt.find('.loopSlider').slider('option', {
						min: begins,
						max: ends
					});
					wgt.notifyListeners(msgType, val);
					
					elem.data('oldVal', val);
				}
			})
			.bind('keypress', function(evt) {				
				wgt.validate();
			});
			
			this.slider.slider({
				range: true,
				slide: function(evt, ui) {
					var min = ui.values[0],
						max = ui.values[1];
						
					wgt.beginInput.val(min).data('oldVal', min);	
					wgt.endInput.val(max).data('oldVal', max);
					
					wgt.find('.loopSlider').slider('option', {
						min: min,
						max: max
					});
					wgt.find('.loopStart').each(function() {
						var elem = jQuery(this),
							slider = elem.parent().find('.loopSlider'),
							values = slider.slider('option', 'values'),
							val = parseInt(elem.val());
						
						if (val < min) {
							elem.val(min);
						}
						
						slider.slider('option', 'values', [elem.val(), values[1]]);
					});
					wgt.find('.loopEnd').each(function() {
						var elem = jQuery(this),
							slider = elem.parent().find('.loopSlider'),
							values = slider.slider('option', 'values'),
							val = parseInt(elem.val());
						
						if (val > max) {
							elem.val(max);
						}
						
						slider.slider('option', 'values', [values[0], elem.val()]);	
					});					
					
					wgt.validate();
				},
				change: function(evt, ui) {					
					var min = ui.values[0],
						max = ui.values[1];
						
					wgt.notifyListeners(module.EventTypes.SetAnmBeginFrame, min);
					wgt.notifyListeners(module.EventTypes.SetAnmEndFrame, max);
				}
			});
	        
	        this.startBtn.bind('click', function(evt) {
	            var start = parseInt(wgt.beginInput.val()),
	            	end = parseInt(wgt.endInput.val());
	            
	            if (start != null && end != null) {
	                wgt.notifyListeners(module.EventTypes.StartPreview, {
						start: start,
						end: end
					});
					wgt.startBtn.attr('disabled', 'disabled');
					wgt.stopBtn.removeAttr('disabled');
	            }
	        });
	        
	        this.stopBtn.bind('click', function(evt) {
	            wgt.notifyListeners(module.EventTypes.StopPreview, null);
	            wgt.startBtn.removeAttr('disabled');
	        });
	        
	        this.addBtn.bind('click', function(evt) {         
	            var start = parseInt(wgt.beginInput.val()),
	            	end = parseInt(wgt.endInput.val());
						
	            wgt.notifyListeners(module.EventTypes.AddAnmLoop, {
	                start: start,
	                end: end,
					loopStart: start,
					loopEnd: end,
					loopItr: -1
	            });
				wgt.invalidate();
	        });
	        
	        this.saveBtn.bind('click', function(evt) {
	            var start = parseInt(wgt.beginInput.val()),
	            	end = parseInt(wgt.endInput.val()),
	            	name = wgt.find('#anmName').val();
				
				wgt.notifyListeners(module.EventTypes.SaveAnimation, {
					start: start,
					end: end,
					name: name
				});
				wgt.reset();
	        });
			
			this.cancelBtn.bind('click', function(evt) {
				wgt.setVisible(false);
				wgt.reset();
				wgt.notifyListeners(module.EventTypes.CancelCreateAnm, null);
				wgt.find('input.error').removeClass('error');
			});
		},
		
		validate: function() {
	        var start = this.beginInput.val(),
            	end = this.endInput.val(),
            	name = this.find('#anmName').val();
            
            if (start && end) {
				this.startBtn.removeAttr('disabled');
                if (name) {
                    this.saveBtn.removeAttr('disabled');
                }
            }
            else {
                this.saveBtn.attr('disabled', 'disabled');
                this.startBtn.attr('disabled', 'disabled');
            }			
		},		
		
		reset: function() {
	        this.find('#anmModelVal').html(this.config.instructions);
	        this.find('input[type="text"]').val('');
	        this.find('#anmKeyframes, #anmLoops, #anmPreview').hide();
	        this.find('#anmLoopList').find('.loopEditor').remove();
			
			this.saveBtn.attr('disabled', 'disabled');
		},
		
		set: function(animation) {
	        this.find('#anmKeyframes, #anmLoops, #anmPreview').show();   
	        this.find('#anmModelVal').html(animation.target.name);
			
			var loopList = animation.loops,
				min = animation.beginTime * hemi.view.FPS,
				max = animation.endTime * hemi.view.FPS,
				wgt = this;
			
			for (var ndx = 0, len = loopList.length; ndx < len; ndx++) {
				this.addLoopInput(loopList[ndx], min, max);
			}
			
	        this.beginInput.val(animation.beginTime * hemi.view.FPS);
	        this.endInput.val(animation.endTime * hemi.view.FPS);
	        this.find('#anmName').val(animation.name);
			
			this.slider.slider('option', {
				values: [animation.beginTime * hemi.view.FPS,
					animation.endTime * hemi.view.FPS]
			});
			this.startBtn.removeAttr('disabled');
			
			this.notifyListeners(module.EventTypes.SetAnimation, animation);
		},
		
		addLoopInput: function(loop, min, max) {
			var wgt = this,
				wrapper = jQuery('<li class="loopEditor"></li>'),
				startVal = loop.startTime * hemi.view.FPS,
				endVal = loop.stopTime * hemi.view.FPS,
				itrVal = loop.iterations,
				startInput = jQuery('<input class="loopStart blend" type="text" value="' + startVal + '"/>'),
				endInput = jQuery('<input class="loopEnd blend" type="text" value="' + endVal + '"/>'),
				itrInput = jQuery('<input type="text" class="blend" value="' + itrVal + '" />'),
				startLbl = jQuery('<label>From</label>'),
				endLbl = jQuery('<label>To</label>'),
				itrLbl = jQuery('<label># Times</label>'),
				removeBtn = jQuery('<button class="icon removeBtn">Remove</button>'),
				slider = jQuery('<div class="loopSlider"></div>').slider({
						range: true,
						min: min,
						max: max,
						slide: function(evt, ui) {
							var min = ui.values[0],
								max = ui.values[1];
								
							startInput.val(min).data('oldVal', min);	
							endInput.val(max).data('oldVal', max);
						},
						values: [startVal, endVal]
					}),
				changeFcn = function(evt) {
					var elem = jQuery(this),
						loop = wrapper.data('obj'),
						val = elem.val(),
						begins = parseInt(startInput.val()),
						ends = parseInt(endInput.val()),
						itr = parseInt(itrInput.val()),
						oldStart = startInput.data('oldVal'),
						oldEnd = endInput.data('oldVal'),
						oldItr = itrInput.data('oldVal'),
						curMin = slider.slider('option', 'min'),
						curMax = slider.slider('option', 'max');
					
					if (hemi.utils.isNumeric(val) && begins <= ends 
							&& begins >= curMin && ends <= curMax) {
						slider.slider('option', 'values', [begins, ends]);
						startInput.data('oldVal', begins);
						endInput.data('oldVal', ends);
						itrInput.data('oldVal', itr);
						
		                wgt.notifyListeners(module.EventTypes.EditAnmLoop, {
		                    loop: loop,
							start: begins,
							end: ends,
							itr: itr
		                });
					}
					else {
						itrInput.val(oldItr);
					}
				};
				
			this.find('#anmLoopData').show();
			startInput.bind('change', changeFcn).data('oldVal', startVal);	
			endInput.bind('change', changeFcn).data('oldVal', endVal);
			itrInput.bind('change', changeFcn).data('oldVal', itrVal);
			slider.bind('slidechange', function(evt, ui) {
				var loop = wrapper.data('obj'),				
					values = slider.slider('option', 'values'),
					itr = parseInt(itrInput.val());
					
	                wgt.notifyListeners(module.EventTypes.EditAnmLoop, {
	                    loop: loop,
						start: values[0],
						end: values[1],
						itr: itr
	                });
			});
			
			removeBtn.bind('click', function(evt) {
				var loop = wrapper.data('obj');
				
				wrapper.remove();
				wgt.notifyListeners(module.EventTypes.RemoveAnmLoop, loop);
			});
			
			wrapper.append(slider).append(startLbl).append(startInput)
				.append(endLbl).append(endInput).append(itrLbl)
				.append(itrInput).append(removeBtn).data('obj', loop);
				
			// add validation
			var checkFcn = function(elem) {
				var val = elem.val(),
					begins = parseInt(startInput.val()),
					ends = parseInt(endInput.val()),
					min = slider.slider('option', 'min'),
					max = slider.slider('option', 'max'),
					msg = null;
					
				if (val !== '' && !hemi.utils.isNumeric(val)) {
					msg = 'must be a number';
				}
				else if (elem.hasClass('loopStart')) {
					if (begins > ends && ends >= min) {
						msg = 'begin must be less than end';
					}
					else if (begins < min) {
						msg = 'begin must be greater than ' + min; 
					}	
				}
				else if (elem.hasClass('loopEnd')) {
					if (begins > ends && begins <= max) {
						msg = 'end must be greater than beginning';
					}
					else if (ends > max) {
						msg = 'end must be lass than ' + max;
					}					
				}
				return msg;
			};
			
			new module.ui.Validator(startInput, checkFcn);
			new module.ui.Validator(endInput, checkFcn);
			
			this.loopList.append(wrapper);
		},
	    
	    modelSelected: function(model) { 
			var max = parseInt(model.getMaxAnimationTime() * hemi.view.FPS);
			    
	        this.find('#anmModelVal').html(model.name);
	        this.find('#anmKeyframes, #anmLoops, #anmPreview').show(200);
			this.slider.slider('option', {
				min: 0,
				max: max,
				values: [0, max]
			});
			this.beginInput.val(0).data('oldVal', 0);
			this.endInput.val(max).data('oldVal', max);
	    },
		
		resize: function(maxHeight) {
			this._super(maxHeight);
			var form = this.find('form'),
				oldHeight = form.outerHeight(true),
				borderHeight = parseInt(form.css('borderTopWidth')) 
					+ parseInt(form.css('borderBottomWidth')),
				marginHeight = parseInt(form.css('marginTop')) 
					+ parseInt(form.css('marginBottom')),
				paddingHeight = parseInt(form.css('paddingTop')) 
					+ parseInt(form.css('paddingBottom')),
				newHeight = maxHeight - borderHeight - marginHeight 
					- paddingHeight;
			
			if (form) {
				form.height(newHeight);
				
				if (oldHeight > newHeight) {
					form.addClass('scrolling');
				}
				else {
					form.removeClass('scrolling');
				}
			}
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     	 Animation List Sidebar Widget                        //
////////////////////////////////////////////////////////////////////////////////     
	
	/*
	 * Configuration object for the HiddenItemsSBWidget.
	 */
	module.tools.AnmListSBWidgetDefaults = {
		name: 'animationListSBWidget',
		listId: 'animationList',
		prefix: 'anmLst',
		instructions: "Click 'Create Animation' to create a new animation.",
		title: 'Animations'
	};
	
	module.tools.AnmListSBWidget = module.ui.ListSBWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.tools.AnmListSBWidgetDefaults, options);
		    this._super(newOpts);
			
			this.items = new Hashtable();		
		},
		
		layoutExtra: function() {
			this.buttonDiv = jQuery('<div class="buttons"></div>');
			this.createBtn = jQuery('<button id="createAnimation">Create Animation</button>');
			var wgt = this;
			
			this.createBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.CreateAnimation, null);
			});
			
			this.buttonDiv.append(this.createBtn);
			
			return this.buttonDiv;
		},
		
		bindButtons: function(li, obj) {
			var wgt = this;
			
			li.editBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.EditAnimation, 
					obj);
			});
			
			li.removeBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.RemoveAnimation, 
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

    /*
     * Configuration object for the AnimatorView.
     */
    module.tools.AnimatorViewDefaults = {
        toolName: 'Animator',
		toolTip: 'Animations: Create and edit animations',
        widgetId: 'animationsBtn'
    };
    
    /**
     * The AnimatorView controls the dialog and toolbar widget for the 
     * animation tool.
     * 
     * @param {Object} options configuration options.  Uses 
     *         editor.tools.AnimatorViewDefaults as default options
     */
    module.tools.AnimatorView = module.tools.ToolView.extend({
		init: function(options){
			var newOpts = jQuery.extend({}, module.tools.AnimatorViewDefaults, options);
			this._super(newOpts);
			
			this.addSidebarWidget(new module.tools.CreateAnmSBWidget());
			this.addSidebarWidget(new module.tools.AnmListSBWidget());
		}
	});
	
    
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The AnimatorController facilitates AnimatorModel and AnimatorView
     * communication by binding event and message handlers.
     */
    module.tools.AnimatorController = module.tools.ToolController.extend({
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
				crtAnmWgt = view.createAnmSBWidget,
				anmLstWgt = view.animationListSBWidget,
	        	that = this;
	        
	        view.addListener(module.EventTypes.ToolModeSet, function(value) {
	            var isDown = value == module.tools.ToolConstants.MODE_DOWN;				
	            model.enableModelPicking(isDown);
	            model.stopAnimation();
	        });
			
			// creat animation widget specific
			crtAnmWgt.addListener(module.EventTypes.RemoveAnmLoop, function(value) {
				model.removeLoop(value);
			});			
			crtAnmWgt.addListener(module.EventTypes.SetAnimation, function(value) {
				if (value === null && model.animDirty) {
					model.removeAnimation(model.animation);
					model.animDirty = false;
				}
				
				model.animation = value;
			});			
			crtAnmWgt.addListener(module.EventTypes.StartPreview, function(value) {
	            model.previewAnimation();			
			});	        
	        crtAnmWgt.addListener(module.EventTypes.StopPreview, function(value) {
	            model.stopAnimation();
	        });	        
	        crtAnmWgt.addListener(module.EventTypes.AddAnmLoop, function(obj) {
				model.setStart(obj.start);
				model.setEnd(obj.end);
				
	            var loop = model.createLoop(obj.loopStart, obj.loopEnd, 
						obj.loopItr);
						
	            crtAnmWgt.addLoopInput(loop, obj.start, obj.end);      
	        });	     
	        crtAnmWgt.addListener(module.EventTypes.EditAnmLoop, function(obj) {				
	            var loop = model.saveLoop(obj.loop, obj.start, obj.end, 
					obj.itr);     
	        });		
			crtAnmWgt.addListener(module.EventTypes.SaveAnimation, function (value) {
				var animation = model.saveAnimation();       	            
	            if (animation) {
					crtAnmWgt.reset();
					crtAnmWgt.setVisible(false);
					anmLstWgt.setVisible(true);
	                model.unSelectAll();
	            }
			});			
			crtAnmWgt.addListener(module.EventTypes.SetAnmBeginFrame, function (starts) {
				model.setStart(starts);     
			});			
			crtAnmWgt.addListener(module.EventTypes.SetAnmEndFrame, function (ends) {
				model.setEnd(ends);     
			});			
			crtAnmWgt.addListener(module.EventTypes.SetAnmName, function (name) {
				model.setName(name);     
			});			
			crtAnmWgt.addListener(module.EventTypes.CancelCreateAnm, function () {
				anmLstWgt.setVisible(true);
				model.unSelectAll();
			});
			
			// animation list widget specific
			anmLstWgt.addListener(module.EventTypes.CreateAnimation, function() {
				anmLstWgt.setVisible(false);
				crtAnmWgt.setVisible(true);
			});			
			anmLstWgt.addListener(module.EventTypes.EditAnimation, function(animation) {
				model.setModel(animation.target);
				crtAnmWgt.set(animation);
				model.setAnimation(animation);
				anmLstWgt.setVisible(false);
				crtAnmWgt.setVisible(true);
			});			
			anmLstWgt.addListener(module.EventTypes.RemoveAnimation, function(animation) {
				model.removeAnimation(animation);
			});
	        
			// model specific
	        model.addListener(module.EventTypes.ModelPicked, function(model) {
	            crtAnmWgt.modelSelected(model);
	        });			
			model.addListener(module.EventTypes.AnimationCreated, function(animation) {
				anmLstWgt.add(animation);
			});	        
	        model.addListener(module.EventTypes.AnimationUpdated, function(animation) {
	            anmLstWgt.update(animation);
	        });			
	        model.addListener(module.EventTypes.AnimationRemoved, function(animation) {
	            anmLstWgt.remove(animation);
	        });				
	        model.addListener(module.EventTypes.AnimationStopped, function(value) {
	            crtAnmWgt.find('#anmStartBtn').removeAttr('disabled');
	            crtAnmWgt.find('#anmStopBtn').attr('disabled', 'disabled');
	        });
	    }
	});
    
    
    return module;
})(editor || {});