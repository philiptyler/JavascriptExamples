/* Summary:
 * This Module will detect all JSCormantRadDocks loaded into the telerik dashboard
 * fill them with the corresponding widget content.
 * This view should be rendered everytime the telerik dashboard is changed. (resized or tab switching or editting)
*/

define(['dashboard/view/xDomMasterView',
    'thirdParty/x3dom'],
    function (RackMasterView) {

        var JSRadDockView = Backbone.View.extend({

            // Array of widget 'objects'.  As I add more JS widgets to the dashboard, these objects
            // should eventually be moved to models.
            widgets: [
                {
                    selector: ".3DRack", className: "3DRack", views: [], viewsRendered: 0, view: RackMasterView, afterRender: x3dom.reload, onUnload: function () {
                        if (x3dom.canvases) {
                            for (var i = 0; i < x3dom.canvases.length; i++) { x3dom.canvases[i].doc.shutdown(x3dom.canvases[i].gl); }
                            x3dom.canvases = [];
                        }
                    }
                }
            ],

            divToLoadSelector: ".rdContent", // Where the JS will be loaded into the CormantRadDocks in the DOM
            parentHeightOffset: 39,  // Height of Telerik.RadDock Header
            parentWidthOffset: 14, //Width of Telerik.RadDock padding/margin
            dashboardTabSelector: "#DashboardMultiPage > div:not([class=rmpHiddenView])", // This selector is used to find the currently opened Dashboard Tab

            // finds all JS widgets RadDocks, sets their sizes, populates them with JS Widget views
            render: function () {
                this.setupRadDocks();
                this.renderAllWidgets();
            },
            
            allWidgetsReadyForSave: function () {
                var every = _.every(this.widgets, this._widgetReadyForSave);
                return every;
            },
            
            // Checks every view of a widget to see if it is ready to be saved to the DB
            _widgetReadyForSave: function (widget) {
                if (widget.views.length) {
                    return _.every(widget.views, function (view) {
                        return view.readyToSave();
                    });
                } else return true;
            },

            // When a single JS widget is dragged into a Pane, dashboard.js triggers an event to run this function
            // Which takes the ID of the dockzone and populates the new JSRadDock with the correct JS Widget
            addOneView: function (dockZoneID) {
                for (var widgetIndex = 0; widgetIndex < this.widgets.length; widgetIndex++) {
                    var widget = this.widgets[widgetIndex];
                    var foundDock = $("#" + dockZoneID + " " + this.widgets[widgetIndex].selector);
                    if (foundDock.length) {
                        var view = new widget.view({ el: foundDock.find(this.divToLoadSelector)[0], dock: foundDock });
                        this._setViewSize(widget, view);
                        this._renderView(widget, view);
                        widget.views.push(view);
                        break;
                    }
                }
            },

            // Finds the currently-opened dashboard tab, looks for all JSRadDocks to be loaded on that tab
            // Then sets the size of each JSRadDock
            setupRadDocks: function () {
                this.currentDashboardTab = $(this.dashboardTabSelector);
                this._forEachWidget(this._findWidgetDocks.bind(this));
                this._forEachWidget(this._setWidgetSizes.bind(this));
            },

            // CALL THIS AFTER setupRadDocks
            // After Raddocks have been found and sized, this function renders all JS widgets and puts their
            // HTML into the JSRadDocks
            renderAllWidgets: function () {
                this._forEachWidget(this._renderWidgetViews.bind(this));
            },

            // Util function for calling a single function on each widget object
            _forEachWidget: function (widgetFunction) {
                for (var widget = 0; widget < this.widgets.length; widget++) {
                    widgetFunction(this.widgets[widget]);
                }
            },

            // Util function for calling a single function on each raddock object stored in a single widget object
            _forEachView: function (widget, viewFunction) {
                for (var viewIndex = 0; viewIndex < widget.views.length; viewIndex++) {
                    viewFunction(widget, widget.views[viewIndex], viewIndex);
                }
            },

            // Use the widget objects selector and jQuery to find all the JSradDocks on the current Dashboard tab
            // Add the JSRadDock jquery objects to the widget object
            _findWidgetDocks: function (widget) {
                var newWidgets = [];
                var $widgets = this.currentDashboardTab.find(widget.selector);
                for (var widgetSelector = 0; widgetSelector < $widgets.length; widgetSelector++) {
                    var foundDock = $($widgets[widgetSelector]);
                    newWidgets.push(new widget.view({ el: foundDock.find(this.divToLoadSelector)[0], dock: foundDock }));
                }
                widget.views = newWidgets;
            },
            
            // When a view has already been built and just needs to be re-added to the DOM
            // after a telerik resize, update its dock to the new one on the DOM with the same id
            _tryUpdateView: function (widget, foundDock) {
                var newView = null;
                for (var viewIndex = 0; viewIndex < widget.views.length; viewIndex++) {
                    if (widget.views[viewIndex].dockID === foundDock[0].id) {
                        var foundView = widget.views[viewIndex];
                        newView = new widget.view({ el: foundDock.find(this.divToLoadSelector)[0], dock: foundDock });
                        //foundDock.find(this.divToLoadSelector).html(foundView.$el.children());
                    }
                }
                return newView;
            },

            // Loops through all the radDocks of a widget object and sets their sizes
            _setWidgetSizes: function (widget) {
                this._forEachView(widget, this._setViewSize.bind(this));
            },

            // Sets a JSRadDock's Height/Width based on the dockzone(parent) size
            _setViewSize: function (widget, view) {
                var parent = view.dock.parent();
                var parentWidth = parent.width();
                var parentHeight = parent.height();
                view.setWidthHeight(parentWidth - this.parentWidthOffset, parentHeight - this.parentHeightOffset);
            },

            // Renders all JSRadDocks of a widget to the current dashboard tab
            _renderWidgetViews: function (widget) {
                widget.viewsRendered = 0;
                for (var viewIndex = 0; viewIndex < widget.views.length; viewIndex++) {
                    var view = widget.views[viewIndex];
                    view.listenToOnce(view, 'doneBuilding', function () {
                        widget.viewsRendered++;
                        
                        //Wait for all widget's views to trigger their 'doneBuilding' event
                        //Once all have triggered, call afterRender() and each view's afterShow()
                        if (widget.viewsRendered == widget.views.length) {
                            widget.afterRender();
                            _.each(widget.views, function(widgetView) {
                                widgetView.afterShow();
                            });
                        }
                    });
                    view.buildAll();
                }
            },

            // Renders a only single view of a widget
            _renderView: function (widget, view) {
                view.buildAll();
                this.listenToOnce(view, 'doneBuilding', function() {
                    widget.afterRender();
                    view.afterShow();
                });
            },
            
            // When the user switches tabs, cleanup all the JS-inserted
            // HTML on the old tab.
            cleanup: function () {
                this._forEachWidget(this._destroyViews.bind(this));
            },
            
            cleanupView: function (event, parentDock) {
                var dockClassName = parentDock._element.className;
                var dockID = parentDock._uniqueID;
                
                var widgetOfView = _.find(this.widgets, function(widget) {
                    return dockClassName.indexOf(widget.className) >= 0;
                });
                for (var viewIndex = 0; viewIndex < widgetOfView.views.length; viewIndex++) {
                    var view = widgetOfView.views[viewIndex];
                    if (view.dockID === dockID) {
                        view.cleanup();
                        widgetOfView.views.splice(viewIndex, 1);
                        break;
                    }
                };
            },
            
            // call the cleanup() function on every view of a widget.
            _destroyViews: function (widget) {
                widget.onUnload();
                $(widget.selector + " .rdContent").empty();
                for (var viewIndex = 0; viewIndex < widget.views.length; viewIndex++) {
                    widget.views[viewIndex].cleanup();
                }
                widget.views.length = 0;
            }

        });

        return JSRadDockView;

    });