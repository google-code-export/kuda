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

var editor = (function(editor) {
    editor.tools = editor.tools || {};
    
    editor.EventTypes = editor.EventTypes || {};
	
	// model events
    editor.EventTypes.ModelPicked = "animator.ModelPicked";
    editor.EventTypes.AnimationCreated = "animator.AnimationCreated";
    editor.EventTypes.AnimationUpdated = "animator.AnimationUpdated";
	editor.EventTypes.AnimationRemoved = "animator.AnimationRemoved";
    editor.EventTypes.AnimationStopped = "animator.AnimationStopped";
	
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
	editor.EventTypes.CancelCreateAnm = "crtAnm.CancelCreateAnm";
	
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
    editor.tools.AnimatorModel = editor.ui.ToolModel.extend({
		init: function() {
			this._super('editor.tools.Animator');
	        
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
	        this.notifyListeners(editor.EventTypes.AnimationRemoved, animation);
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
	        }
	    },
		
	    saveAnimation: function() {
			var retVal = null,
				msgType = this.isUpdate ? editor.EventTypes.AnimationUpdated
					: editor.EventTypes.AnimationCreated;
			
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
			this.animation = animation;
			this.name = animation.name;
			this.startTime = animation.beginTime;
			this.endTime = animation.endTime;
			this.isUpdate = true;
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
	            this.notifyListeners(editor.EventTypes.AnimationRemoved, anm);
	        }
	    },
		
	    worldLoaded: function() {
			var animations = hemi.world.getAnimations();
			
			for (var ndx = 0, len = animations.length; ndx < len; ndx++) {
				var anm = animations[ndx];
	            this.notifyListeners(editor.EventTypes.AnimationCreated, anm);
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
				uiFile: 'js/editor/plugins/geometry/html/animationsForms.htm',
		        instructions: 'Click on a model to select it',
				manualVisible: true
			});
			
			this.hiddenItems = new Hashtable();	
			var wgt = this;	
			
			hemi.msg.subscribe(hemi.msg.load, function(msg) {
				if (msg.src instanceof hemi.model.Model) {
					var mdl = msg.src,
						id = mdl.getId();
					wgt.selector.append('<option id="anmMdlSel_' + id + '" value="' + id + '">'
						+ mdl.name + '</option>');
				}
			});
			
			hemi.msg.subscribe(hemi.msg.unload, function(msg) {
				if (msg.src instanceof hemi.Model) {
					var id = 'anmMdlSel_' + msg.src.getId();						
					wgt.find('#' + id).remove();
				}
			});
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
				formDiv = jQuery('<div class="loopForms"></div>'),
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
						
		                wgt.notifyListeners(editor.EventTypes.EditAnmLoop, {
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
					
	                wgt.notifyListeners(editor.EventTypes.EditAnmLoop, {
	                    loop: loop,
						start: values[0],
						end: values[1],
						itr: itr
	                });
			});
			
			removeBtn.bind('click', function(evt) {
				var loop = wrapper.data('obj');
				
				wrapper.remove();
				wgt.notifyListeners(editor.EventTypes.RemoveAnmLoop, loop);
			});
			
			formDiv.append(startLbl).append(startInput).append(endLbl)
				.append(endInput).append(itrLbl).append(itrInput);
			wrapper.append(slider).append(formDiv).append(removeBtn)
				.data('obj', loop);
				
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
			
			new editor.ui.Validator(startInput, checkFcn);
			new editor.ui.Validator(endInput, checkFcn);
			
			this.loopList.append(wrapper);
		},
		
		finishLayout: function() {
			this._super();
			this.slider = this.find('#anmSlider');
			
			this.selector = this.find('#anmModelSelect');
	        this.addBtn = this.find('#anmLoopAdd');
        	this.saveBtn = this.find('#anmSaveBtn');
			this.cancelBtn = this.find('#anmCancelBtn');
			this.anmPreviewBtn = this.find('#anmPreviewBtn');
			this.beginInput = this.find('#anmBeginFrame');
			this.endInput = this.find('#anmEndFrame');
			this.loopList = this.find('#anmLoopList');
			this.insLabel = this.find('#anmModelVal');
			
			var wgt = this,
				inputs = this.find('#anmBeginFrame, #anmEndFrame, #anmName'),
				frameInputs = this.find('#anmBeginFrame, #anmEndFrame');   
			                 
	        this.find('form').submit(function() {
	            return false;
	        });
			
	        this.find('#anmModelVal').html(this.config.instructions);
			
			// add validation
			new editor.ui.Validator(frameInputs, function(elem) {
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
			
			this.selector.bind('change', function(evt) {
				var mdl = hemi.world.getCitizenById(
					parseInt(jQuery(this).val()));
				wgt.notifyListeners(editor.EventTypes.ModelSelected, mdl);
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
					    msgType = editor.EventTypes.SetAnmBeginFrame;
						break; 
					case 'anmEndFrame':
					    msgType = editor.EventTypes.SetAnmEndFrame;
						break;
					case 'anmName':
					    msgType = editor.EventTypes.SetAnmName;
						val = txtVal;
						break;
				}

				if (txtVal !== '' && begins <= ends && begins >= min 
						&& ends <= max){	
					wgt.canSave();	
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
			.bind('keyup', function(evt) {				
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
					
					wgt.canSave();
				},
				change: function(evt, ui) {					
					var min = ui.values[0],
						max = ui.values[1];
						
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
					var start = parseInt(wgt.beginInput.val()), 
						end = parseInt(wgt.endInput.val());
					
					if (start != null && end != null) {
						wgt.notifyListeners(editor.EventTypes.StartPreview, {
							start: start,
							end: end
						});
					}
					btn.text(ButtonText.STOP).data('previewing', true);
				}
	        });
	        
	        this.addBtn.bind('click', function(evt) {         
	            var start = parseInt(wgt.beginInput.val()),
	            	end = parseInt(wgt.endInput.val());
						
	            wgt.notifyListeners(editor.EventTypes.AddAnmLoop, {
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
				
				wgt.notifyListeners(editor.EventTypes.SaveAnimation, {
					start: start,
					end: end,
					name: name
				});
				wgt.reset();
	        });
			
			this.cancelBtn.bind('click', function(evt) {
				wgt.reset();
				wgt.notifyListeners(editor.EventTypes.CancelCreateAnm, null);
				wgt.find('input.error').removeClass('error');
			});
			
			editor.ui.sizeAndPosition.call(this);
		},	
	    
	    modelSelected: function(model) { 
			var max = parseInt(model.getMaxAnimationTime() * hemi.view.FPS);
			
			if (max > 0) {
				this.find('#anmKeyframes, #anmLoops, #anmPreview').show(200);
				this.slider.slider('option', {
					min: 0,
					max: max,
					values: [0, max]
				});
				this.beginInput.val(0).data('oldVal', 0);
				this.endInput.val(max).data('oldVal', max);
				this.notifyListeners(editor.EventTypes.SetAnmBeginFrame, 0);
				this.notifyListeners(editor.EventTypes.SetAnmEndFrame, max);
			}
//			else {
//				this.insLabel.html('Model has no animations');
//			}
	    },
		
		reset: function() {
	        this.insLabel.html(this.config.instructions);
	        this.find('input[type="text"]').val('');
	        this.find('#anmKeyframes, #anmLoops, #anmPreview').hide();
	        this.find('#anmLoopList').find('.loopEditor').remove();
			
			this.saveBtn.attr('disabled', 'disabled');
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
			this.anmPreviewBtn.removeAttr('disabled');
			
			this.notifyListeners(editor.EventTypes.SetAnimation, animation);
		},
		
		canSave: function() {
	        var start = this.beginInput.val(),
            	end = this.endInput.val(),
            	name = this.find('#anmName').val();
            
            if (start !== '' && end !== '') {
				this.startBtn.removeAttr('disabled');
				
				if (name !== '') {
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
			
			this.items = new Hashtable();	
			this.container.addClass('second');			
			editor.ui.sizeAndPosition.call(this);	
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
		
		createListItemWidget: function() {
			return new editor.ui.BhvListItemWidget();
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
     * 
     * @param {Object} options configuration options.  Uses 
     *         editor.tools.AnimatorViewDefaults as default options
     */
    editor.tools.AnimatorView = editor.ui.ToolView.extend({
		init: function(options){
			this._super({
		        toolName: 'Animator',
				toolTip: 'Animations: Create and edit animations',
		        elemId: 'animationsBtn',
				id: 'editor.tools.Animator'
		    });
			
			this.addPanel(new editor.ui.Panel({
				name: 'sidePanel',
				classes: ['anmSidePanel']
			}));
			
			this.sidePanel.addWidget(new CreateWidget());
			this.sidePanel.addWidget(new ListWidget());
			this.sidePanel.addWidget(editor.ui.getBehaviorWidget());
		}
	});
	
    
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The AnimatorController facilitates AnimatorModel and AnimatorView
     * communication by binding event and message handlers.
     */
    editor.tools.AnimatorController = editor.ui.ToolController.extend({
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
				lstWgt = view.sidePanel.anmListWidget,
				bhvWgt = view.sidePanel.behaviorWidget,
	        	that = this;
	        
	        view.addListener(editor.EventTypes.ToolModeSet, function(value) {
	            var isDown = value.newMode == editor.ui.ToolConstants.MODE_DOWN;				
	            model.enableModelPicking(isDown);
	            model.stopAnimation();
	        });	
			
			// creat animation widget specific		    
	        crtWgt.addListener(editor.EventTypes.AddAnmLoop, function(obj) {
				model.setStart(obj.start);
				model.setEnd(obj.end);
				
	            var loop = model.createLoop(obj.loopStart, obj.loopEnd, 
						obj.loopItr);
						
	            crtWgt.addLoopInput(loop, obj.start, obj.end);      
	        });	  	
			crtWgt.addListener(editor.EventTypes.CancelCreateAnm, function () {
				model.unSelectAll();
			});   
	        crtWgt.addListener(editor.EventTypes.EditAnmLoop, function(obj) {				
	            var loop = model.saveLoop(obj.loop, obj.start, obj.end, 
					obj.itr);     
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
				model.setModel(animation.target);
				crtWgt.set(animation);
				model.setAnimation(animation);
			});			
			lstWgt.addListener(editor.EventTypes.RemoveAnimation, function(animation) {
				model.removeAnimation(animation);
			});
	        
			// model specific	
			model.addListener(editor.EventTypes.AnimationCreated, function(animation) {
				lstWgt.add(animation);
			});	     	
	        model.addListener(editor.EventTypes.AnimationRemoved, function(animation) {
	            lstWgt.remove(animation);
	        });				
	        model.addListener(editor.EventTypes.AnimationStopped, function(value) {
	            crtWgt.find('#anmStartBtn').removeAttr('disabled');
	            crtWgt.find('#anmStopBtn').attr('disabled', 'disabled');
	        });   
	        model.addListener(editor.EventTypes.AnimationUpdated, function(animation) {
	            lstWgt.update(animation);
	        });		
	        model.addListener(editor.EventTypes.ModelPicked, function(model) {
	            crtWgt.modelSelected(model);
	        });		
			
			// behavior widget specific
			bhvWgt.addListener(editor.EventTypes.Sidebar.WidgetVisible, function(obj) {
				if (obj.updateMeta) {
					var isDown = view.mode === editor.ui.ToolConstants.MODE_DOWN;
					
					lstWgt.setVisible(!obj.visible && isDown);
					crtWgt.setVisible(!obj.visible && isDown);
				}
			});
	    }
	});
    
    
    return editor;
})(editor || {});