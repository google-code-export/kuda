var hemi = (function(parent, jQuery) {

    parent.test = parent.test || {};
    
    o3djs.require('hemi.tools.shapeView');
        
    var UnitTest = {
        runTests: function() {
            module("shapeView");
            
            test("ShapeView: constructor", function() {
				// test default constructor
                var view = new parent.tools.ShapeView();
				
				ok(view.shapeTransformNames != null, "Shape names not null");
				ok(view.hideTransforms != null, "Hide transforms not null");
                ok(view.showTransforms != null, "Show transforms not null");
				ok(view.model == null, "Model is null");
				equals(view.type, parent.tools.ViewType.ShapeView, "View type is ShapeView");
            });
			
			test("ShapeView: add/remove shape", function() {
                // test default constructor
                var view = new parent.tools.ShapeView();
				var list = view.shapeTransformNames;
                
                equals(list.length, 0, "ShapeView shouldn't have shapes");
				
				var shape = {
					id: 1
				};
				var shape2 = {
					id: 2
				};
				var shape3 = {
					id: 3
				};
				
				view.addShape(shape);
				equals(list[0].id, shape.id, "ShapeView should have the added shape");
				
				view.addShape(shape2);
                equals(list[1].id, shape2.id, "ShapeView should have the added shape");
				
				var retVal = view.removeShape(shape3);
				ok(!retVal, "ShapeView should have returned false upon removing non-existant shape");
				equals(list.length, 2, "ShapeView should still have the same number of shapes");
				
				retVal = view.removeShape(shape2);
                ok(retVal, "ShapeView should have returned true upon removing shape");
                equals(list.length, 1, "ShapeView should have less shapes");
			});
			
			test("ShapeView: bindEvents", function() {
                var view = new parent.tools.ShapeView();
                var transformName1 = 'Transform name 1';
                var transformName2 = 'Transform name 2';
                var transformName3 = 'Transform name 3';
                var model = new parent.model.Model('');
                var transform1 = {
                    name: transformName1,
                    children: [],
                    clientId: 2323
                };
                var transform2 = {
                    name: transformName2,
                    children: [],
                    clientId: 2323
                };
                var transform3 = {
                    name: transformName3,
                    children: [],
                    clientId: 2323
                };
                
                model.transforms = [transform1, transform2, transform3];
                model.modelTransform = {
                    name: 'modelTransform',
                    children: [transform1, transform2, transform3],
                    clientId: 3434
                };
                
                parent.core.addToTransformTable(model.modelTransform);
				
				// test with empty shapes and model                
                view.bindEvents();
				
                equals(view.showTransforms.length, 0, "View show transforms list is populated");
                equals(view.hideTransforms.length, 0, "View hide transforms list is populated");				
                
				// test with added shapes and model
				view.addShape(transformName1);
                view.addShape(transformName2);
                view.addShape(transformName3);
				
				view.setModel(model);
				
				view.bindEvents();
				
				equals(view.showTransforms.length, 3, "View show transforms list is populated");
                equals(view.hideTransforms.length, 3, "View hide transforms list is populated");
			});
            
            test("ShapeView: setVisible", function() {
                var view = new parent.tools.ShapeView();
                var transformName1 = 'Transform name 1';
                var transformName2 = 'Transform name 2';
                var transformName3 = 'Transform name 3';
                var model = new parent.model.Model('');
                var transform1 = {
                    name: transformName1,
                    children: [],
                    clientId: 2323,
					visible: false
                };
                var transform2 = {
                    name: transformName2,
                    children: [],
                    clientId: 2323,
                    visible: false
                };
                var transform3 = {
                    name: transformName3,
                    children: [],
                    clientId: 2323,
                    visible: false
                };
                
                model.transforms = [transform1, transform2, transform3];
                model.modelTransform = {
                    name: 'modelTransform',
                    children: [transform1, transform2, transform3],
                    clientId: 3434
                };
                
                parent.core.addToTransformTable(model.modelTransform);
                
                // test with empty shapes and model                
                view.bindEvents();
				view.setVisible(true);   
				ok(!transform1.visible, "Transform event wasn't fired");
                ok(!transform2.visible, "Transform event wasn't fired");
                ok(!transform3.visible, "Transform event wasn't fired");                          
                
                // test with added shapes and model
                view.addShape(transformName1);
                view.addShape(transformName2);
                view.addShape(transformName3);
                
                view.setModel(model);
                
                view.bindEvents();
                view.setVisible(true);  
                ok(transform1.visible, "Transform event was fired");
                ok(transform2.visible, "Transform event was fired");
                ok(transform3.visible, "Transform event was fired"); 
                equals(transform1.parent, model.modelTransform, "Transform event was fired");
                equals(transform2.parent, model.modelTransform, "Transform event was fired");
                equals(transform3.parent, model.modelTransform, "Transform event was fired");         
				  
                view.setVisible(false);  
                equals(transform1.parent, parent.core.hiddenRoot, "Transform event was fired");
                equals(transform2.parent, parent.core.hiddenRoot, "Transform event was fired");
                equals(transform3.parent, parent.core.hiddenRoot, "Transform event was fired");             
            });
            
            test("ShapeView: toOctane", function() {
                var view = new parent.tools.ShapeView();
                var transformName1 = 'Transform name 1';
                var transformName2 = 'Transform name 2';
                var transformName3 = 'Transform name 3';
                var model = new parent.model.Model('');
                var transform1 = {
                    name: transformName1,
                    children: [],
                    clientId: 2323,
                    visible: false
                };
                var transform2 = {
                    name: transformName2,
                    children: [],
                    clientId: 2323,
                    visible: false
                };
                var transform3 = {
                    name: transformName3,
                    children: [],
                    clientId: 2323,
                    visible: false
                };
                
                model.transforms = [transform1, transform2, transform3];
                model.modelTransform = {
                    name: 'modelTransform',
                    children: [transform1, transform2, transform3],
                    clientId: 3434
                };
				model.setId(23435);
				view.setId(223);
                
                parent.core.addToTransformTable(model.modelTransform);                        
                
                view.addShape(transformName1);
                view.addShape(transformName2);
                view.addShape(transformName3);
                
                view.setModel(model);
				view.bindEvents();
				
				var octane = view.toOctane();
				equals(octane.wi, view.getId(), "Id is the same");
                equals(octane.mi, view.model.getId(), "Model id is the same");
                equals(octane.ss[0], transformName1, "Transform name is the same");
                equals(octane.ss[1], transformName2, "Transform name is the same");
                equals(octane.ss[2], transformName3, "Transform name is the same");
                ok(octane.ht[0] != null, "Hide transform id exists");
                ok(octane.ht[1] != null, "Hide transform id exists");
                ok(octane.ht[2] != null, "Hide transform id exists");
                ok(octane.st[0] != null, "Show transform id exists");
                ok(octane.st[1] != null, "Show transform id exists");
                ok(octane.st[2] != null, "Show transform id exists");
            });
        }
    };
    
    parent.test.addUnitTest(UnitTest);
    
    return parent;
})(hemi || {}, jQuery);
