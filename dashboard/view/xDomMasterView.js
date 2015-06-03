define([
    'alertify',
    'common/model/dialogManager',
    'common/model/spinnerBuilder',
    'dashboard/collection/xDomRacks',
    'dashboard/model/xDomRack',
    'dashboard/model/xDomRackSceneControls',
    'dashboard/model/addXdomRackViewDialogOptions',
    'dashboard/view/xDomRackLegendView',
    'dashboard/view/xDomRackSceneControlsView',
    'dashboard/view/xDomRackSceneView',
    'dashboard/view/xDomRackTitleBarView',
    'dashboard/view/xDomRackToolTipView',
    'text!dashboard/template/xDomMaster.html',
    'modernizr'
], function(Alertify, DialogManager, SpinnerBuilder, Racks, Rack, RackSceneControls, AddXdomRackViewDialogOptions,
    RackLegendView, RackSceneControlsView, RackSceneView, RackTitleBarView, RackToolTipView, MasterTemplate) {
    'use strict';
    var MasterView = Marionette.LayoutView.extend({
        tagName: 'div',
        template: _.template(MasterTemplate),
        
        addDialog: null,

        // Strip the raddock's ID because it contains the Component ID of the DC to load
        // Set the model and render the template so we can manipulate the el before we append it to the DOM
        initialize: function(options) {
            this.dock = options.dock;
            this.dockID = options.dock[0].id;
            this.model = new Backbone.Model();
            this.racks = new Racks();

            this._setID();
            this._setErrorCallbacks();
            this.render();
        },

        regions: {
            x3dScene: 'x3d',
            sceneControls: '.scene-controls-region',
            rackTitleBar: '.rack-titlebar-region',
            rackLegend: '.rack-legend-region'
        },

        ui: {
            x3d: 'x3d'
        },

        _setErrorCallbacks: function() {
            var self = this;
            this.racks.once('serverError', function() {
                self.toggleLoading(false);
                Alertify.error('Error: Server could not process request');
            });
            this.racks.once('ajaxError', function() {
                self.toggleLoading(false);
                Alertify.error('Error: No response from server');
            });
        },

        _setID: function() {
            var indexOfPeriod = this.dockID.indexOf('.');
            if (indexOfPeriod >= 0) {
                this.model.set('id', this.dockID.substring(0, indexOfPeriod));
            } else {
                this.model.set('id', this.dockID);
            }
        },

        // Set the width and height of the widget.
        setWidthHeight: function(width, height) {
            this.tabContentLoading = this.$('.tabContentLoading');
            this.$el.width(width);
            this.$el.height(height);
            this.ui.x3d.attr('width', width);
            this.ui.x3d.attr('height', height);
        },

        // Toggle the loading spinner/div
        toggleLoading: function(loading) {
            if (loading) {
                this.tabContentLoading.show();
            } else {
                this.tabContentLoading.hide();
            }
        },
        
        readyToSave: function() {
            return this._hasDataCenterID();
        },

        // Start the loading spinner, request the racks from the server
        // and set the event callback function once this.racks is loaded
        buildAll: function() {
            if (this._hasDataCenterID()) {
                this._startSpinner();
                this.listenToOnce(this.racks, 'racksLoaded', this.racksLoadedHandle.bind(this));
                this.componentId = this.getComponentFromID();
                this.setupRefreshInterval();
                return this.racks.refresh(this.componentId, { includeAlerts: false });
            } else {
                this.openDataCenterDialog();
            }
        },

        // Make sure the refresh intervals are cleared when this is removed from the DOM
        cleanup: function () {
            clearInterval(this.refreshDeferred);
            $('.rack-tooltip-region').remove();
            if (!_.isNull(this.addDialog)) {
                this.addDialog.dialog('close');
                this.addDialog = null;
            }
        },

        // Called after x3dom.reload() is called
        afterShow: function() {
            this.toggleLoading(false);
            this.rackSceneView.afterShow();
            this._buildSceneControls();

            if (!Modernizr.webgl) {
                this._buildRackToolTip('object[type="application/x-shockwave-flash"]');
            } else {
                this._buildRackToolTip('canvas');
            }
        },

        // Builds the x3dom scene with all the rack <transform> tags
        _buildScene: function() {
            this.rackSceneView = new RackSceneView({
                collection: this.racks,
                channelid: this.dock.attr('id'),
                viewDimensions: {
                    width: this.$el.width(),
                    height: this.$el.height()
                },
                loadedWithFlash: !Modernizr.webgl
            });
            this.x3dScene.show(this.rackSceneView);
        },

        // Builds control panel  and title bar for x3dom scene
        _buildSceneControls: function() {
            var rackSceneControl = new RackSceneControls();
            var rackSceneControlsView = new RackSceneControlsView({
                model: rackSceneControl,
                channelid: this.dock.attr('id')
            });

            this.sceneControls.show(rackSceneControlsView);
            this._buildTitleBar(rackSceneControlsView.model);
            this._buildLegend();
        },

        // Builds titlebar for x3dom scene
        _buildTitleBar: function(rackSceneControl) {
            var rackTitleBarView = new RackTitleBarView({
                model: rackSceneControl,
                channelid: this.dock.attr('id')
            });

            // When the user selects a different view or colorization, change the title bar
            this.listenTo(rackSceneControl, 'change:selectedColor', rackTitleBarView.render);
            this.listenTo(rackSceneControl, 'change:selectedView', rackTitleBarView.render);
            this.rackTitleBar.show(rackTitleBarView);
        },

        // Builds legend for x3dom scene
        _buildLegend: function() {
            var rackLegendView = new RackLegendView({
                channelid: this.dock.attr('id')
            });
            this.rackLegend.show(rackLegendView);
        },

        // builds Tooltips that follow the mouse using
        // mouse postion taken from the canvas
        _buildRackToolTip: function(canvasSelector) {
            var $canvas = this.$(canvasSelector);
            if ($canvas.length) {
                this.ui.x3d[0].runtime.noNav();
                var toolTipParent = $('<div/>', {
                    'class': 'rack-tooltip-region',
                    id: this.model.get('id') + '-rack-tooltip'
                }).appendTo('body');
                this.rackToolTipView = new RackToolTipView({
                    el: toolTipParent[0],
                    model: new Rack(),
                    channelid: this.dock.attr('id'),
                    canvas: $canvas[0],
                    loadedWithFlash: !Modernizr.webgl
                });
            } else {
                setTimeout(this._buildRackToolTip.bind(this), 1000);
            }
        },

        _startSpinner: function () {
            var loadingSpinner = SpinnerBuilder.buildTabContentLoadingSpinner();
            loadingSpinner.spin(this.tabContentLoading[0]);
            this.toggleLoading(true);
        },
        
        _hasDataCenterID: function() {
            return this.getComponentFromID() >= 0;
        },

        // this.racks.setCollection triggers a 'racksLoaded' event
        // PARAM: rackLoadInvalidCount
        //      0: All racks from server were valid for 3D rendering (success)
        //     >0: One or more racks were invalid for 3D rendering (warning)
        //     <0: ZERO racks were valid for 3D rendering (error)
        racksLoadedHandle: function(rackLoadInvalidCount) {
            if (rackLoadInvalidCount >= 0) {
                this.finishBuilding();
            } else {
                clearInterval(this.refreshDeferred);
                this.trigger('errorBuilding');
            }
        },

        // after the racks are loaded and there were no errors
        // build the rack scene and trigger 'doneBuilding'
        finishBuilding: function() {
            this._buildScene();
            this.trigger('doneBuilding');
        },

        // So this.racks' data stays synced with the server
        setupRefreshInterval: function () {
            clearInterval(this.refreshInterval);
            this.refreshInterval = setInterval(function () {
                this.racks.refresh(this.getComponentFromID(), { includeAlerts: false });
            }.bind(this), 30000);
        },

        // Helper function to strip the data center's component ID from the RadDock's ID
        getComponentFromID: function() {
            var id = -1;
            var indexAfterPeriod = this.dock[0].id.indexOf('.') + 1;
            if (indexAfterPeriod) {
                var idString = this.dock[0].id.substring(indexAfterPeriod, this.dock[0].id.length);
                id = parseInt(idString.replace(/[^\d.]/g, ''));
            }
            return id;
        },

        // Once a DC is chosen for the view, attach the DC's componentID to the id
        // attribute of the dock so it will be saved to the DB
        addComponentToID: function(componentID) {
            this.dock[0].id = this.dockID.concat('.', componentID);
        },

        // When a new 3D rack view is created, open a dialog for the user to select which DC to render
        openDataCenterDialog: function() {
            this.toggleLoading(false);
            this.addDialog = DialogManager.buildAndOpenDialog(new AddXdomRackViewDialogOptions(this.$el));
            this.addDialog.one('applyChangesSuccess', this.handleDataCenterDialogClose.bind(this));
        },

        handleDataCenterDialogClose: function (event, args) {
            this._startSpinner();

            // Have to set the collections to the args then you can find the rackWarnings.
            this.racks.set(this.racks.parse(args.racks));
            this.racks.invoke('adjustProperties', this.racks.heightOption, this.racks.colorByProperty);
            this.racks.dataCenterID = args.dataCenterID;

            var $target = $(event.target);
            var lookupInputID = $target.find('.detailsRow #RequiredDataCenterLookup_ID').val();
            var lookupInputName = $target.find('.detailsRow #RequiredDataCenterLookup_Name').val();

            // If some racks couldn't be rendered because they lacked some required properties show these warnings
            // whether there were warnings or not, change the docks ID and title
            if (this.racks.rackWarningsCount >= 0) {
                this.addDialog = null;
                
                if (this.racks.rackWarningsCount === 1) {
                    Alertify.warn('1 Rack in ' + lookupInputName + ' could not be shown. Please edit this Floor Plan');
                }
                if (this.racks.rackWarningsCount > 1) {
                    Alertify.warn(this.racks.rackWarningsCount + ' Racks in ' + lookupInputName + ' could not be shown. Please edit this Floor Plan');
                }
                this.setupRefreshInterval();
                this.addComponentToID(lookupInputID);
                this.setDockTitle(lookupInputName);
                this.racksLoadedHandle(this.racks.rackWarningsCount);
            } else {
                Alertify.error(lookupInputName + ' does not contain any valid Racks. Please edit this Floor Plan');
                this.openDataCenterDialog();
            }
        },

        // After a DC is chosen, add its name to the title of the dock.
        setDockTitle: function(dataCenterName) {
            this.dock.find('.rdTop .rdCenter em').text('3D Rack View: ' + dataCenterName);
        },
    });

    return MasterView;
});