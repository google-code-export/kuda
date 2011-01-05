o3djs.require('hext.tools.htmlView');

var hext = (function(hext) {
	hext.html = hext.html || {};
	
	/* Id of the HTML container for the ToolViews */
	var containerId = 'hext-toolviews';
	/* jQuery object representing the HTML container for the ToolViews */
	var container = null;
	/* Array of HtmlViews added to the ToolViews */
	var views = [];
	
	/**
	 * @namespace A set of functions for displaying HtmlViews. In order for the
	 * the ToolViews to be displayed, you need to have a div with the container
	 * id in your viewer page. The default container id that ToolViews searches
	 * for is 'hext-toolviews', but you may change the id if you wish.
	 */
	hext.html.toolViews = {
		/**
		 * Add the given HtmlView to the ToolViews.
		 *
		 * @param {hext.tools.HtmlView} htmlView the HtmlView to add
		 * @return {boolean} true if the HtmlView was added
		 */
		addView: function(htmlView) {
			var added = false;
			
			if (htmlView instanceof hext.tools.HtmlView) {
				container.append(htmlView.container);
				views.push(htmlView);
				added = true;
			}
			
			return added;
		},
		
		/**
		 * Set the loaded Hext ToolViews to be hidden.
		 */
		hide: function() {
			if (container != null) {
				container.hide();
			}
		},
		/**
		 * Remove the given HtmlView from the ToolViews.
		 *
		 * @param {hext.tools.HtmlView} htmlView the HtmlView to remove
		 * @return {boolean} true if the HtmlView was removed
		 */
		removeView: function(htmlView) {
			var removed = false;
			
			if (htmlView instanceof hext.tools.HtmlView) {
				var ndx = views.indexOf(htmlView);
				
				if (ndx != -1) {
					var spliced = views.splice(ndx, 1);
					
					if (spliced.length === 1) {
						htmlView.container.detach();
						removed = true;
					}
				}
			}
			
			return removed;
		},
		
		/**
		 * Search for the HTML element with the given id. If one is found, use
		 * it as the container for the ToolViews. This will reinitialize the
		 * ToolViews container if it was already created with a different id.
		 * 
		 * @param {string} id the id of the HTML element to act as the ToolViews
		 *     container
		 */
		setContainerId: function(id) {
			containerId = id;
			setupContainer();
		},
		
		/**
		 * Set the loaded Hext ToolViews to be visible.
		 */
		show: function() {
			if (container != null) {
				container.show();
			}
		}
	};
	
	/*
	 * Create the jQuery object for the HTML container that the ToolViews is
	 * contained within.
	 */
	var setupContainer = function() {
		container = jQuery('#' + containerId);
		
		if (container.size() == 0) {
			// There is no DIV on the page for the ToolViews
			container = null;
		}
	};
	
	/*
	 * Wait until the DOM is fully loaded before setting up the elements.
	 */
	jQuery(window).ready(function() {
		setupContainer();
	});
	
	return hext;
})(hext || {});
