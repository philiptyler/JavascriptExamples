// RackScene is the scene of the x3d element.
// Will handle the lights, views, grid, and racks
// Want to convert this view into a layout view
define([
    'dashboard/collection/xDomRackPointLights',
    'dashboard/collection/xDomRackViewPoints',
    'dashboard/model/xDomRackFloor',
    'dashboard/model/xDomRackGrid',
    'text!dashboard/template/xDomRackScene.html',
    'dashboard/view/xDomRackGridView',
    'dashboard/view/xDomRackPointLightsView',
    'dashboard/view/xDomRacksView',
    'dashboard/view/xDomRackViewPointsView'
], function(
    RackPointLights,
    RackViewPoints,
    RackFloor,
    RackGrid,
    RackSceneTemplate,
    RackGridView,
    RackPointLightsView,
    RacksView,
    RackViewPointsView
) {
    'use strict';

    var RackSceneView = Marionette.LayoutView.extend({
        tagName: 'scene',
        template: _.template(RackSceneTemplate),

        regions: {
            pointLightGroup: '.pointlights-group-region',
            viewpointsGroup: '.viewpoints-group-region',
            gridGroup: '.grid-group-region',
            racksGroup: '.racks-group-region'
        },

        // Create the rackfloor based on the data on the collection
        // Store the channelid to make sure the scene view is using
        // the right event vents
        initialize: function(options) {
            this.rackFloor = new RackFloor({
                collection: this.collection
            });
            this.channelid = options.channelid;
            this.viewDimensions = options.viewDimensions;
            this.loadedWithFlash = options.loadedWithFlash;
        },

        // Changed from onRender to onShow.
        // This means the scene will render first then the child elements after
        onShow: function() {
            this._addViews();
            this._addGrid();
            this._addRacks();
        },

        // Called after x3dom.reload() is run
        afterShow: function() {
            this.racksView.afterShow();
        },

        // Create some lights for the scene
        _addLights: function(rackViewPoints) {
            var rackPointLights = new RackPointLights({
                rackViewPoints: rackViewPoints
            }, {
                parse: true
            });

            this.pointLightGroup.show(
                new RackPointLightsView({
                    collection: rackPointLights
                })
            );
        },

        // Create some viewpoints for the scene
        _addViews: function() {
            var rackViewPoints = new RackViewPoints({
                rackFloor: this.rackFloor,
                viewDimensions: this.viewDimensions
            }, {
                parse: true
            });

            this.viewpointsGroup.show(
                new RackViewPointsView({
                    collection: rackViewPoints,
                    channelid: this.channelid
                })
            );

            this._addLights(rackViewPoints);
        },

        // Add the html for the grid.
        // Will toggle transparencies
        _addGrid: function() {
            var rackGrid = new RackGrid({
                rackFloor: this.rackFloor
            });

            this.gridGroup.show(
                new RackGridView({
                    model: rackGrid,
                    channelid: this.channelid,
                    loadedWithFlash: this.loadedWithFlash
                })
            );
        },

        // Initialize the racks view based on the rackfloor
        // and the collection of rack info objects
        _addRacks: function() {
            this.racksView = new RacksView({
                collection: this.collection,
                channelid: this.channelid
            });
            this.racksGroup.show(this.racksView);
        }
    });

    return RackSceneView;
});