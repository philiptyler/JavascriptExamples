// This view is solely responsible for handling the racks.
// All racks will be inside a group element.
// This group element will have events bound to it.

define([
    'dashboard/enum/colorOptions',
    'dashboard/enum/heightOptions',
    'dashboard/view/xDomRackView',
], function(ColorOptions, HeightOptions, RackView) {
    'use strict';

    var RacksView = Marionette.CollectionView.extend({
        childView: RackView,
        tagName: 'group',

        // Setup all event handlers and vent channels
        initialize: function(options) {
            this.channelid = options.channelid;
            this.childViewOptions = {
                channelid: this.channelid
            };
            var rackOptionsChannel = Backbone.Wreqr.radio.channel('rack-options' + this.channelid);
            var topListItemChannel = Backbone.Wreqr.radio.channel('top-list-item' + this.channelid);

            // After racks are loaded, they are parsed and their alerts stripped and compiled into allRackAlerts
            // This view then triggers the alerts list so the scene controls will hear the event and color the attributes list correctly
            this.listenTo(this.collection, 'alertAttributesLoaded', function (allRackAlerts) {
                rackOptionsChannel.vent.trigger('alertAttributesLoaded', allRackAlerts);
            });

            // Set up listeners that listen to user interaction from the rack-options and the top-list-item views.
            this.listenTo(rackOptionsChannel.vent, 'changeRackColor', this._onChangeRacksColor);
            this.listenTo(rackOptionsChannel.vent, 'changeDimension', this._onChangeHeight);
            this.listenTo(topListItemChannel.vent, 'onMouseover', this._setAllRacksMouseover);
            this.listenTo(topListItemChannel.vent, 'onMouseout', this._setAllRacksMouseout);
        },

        // Called after x3dom.js is run on the page
        afterShow: function() {
            this.children.each(function(child) {
                child.afterShow();
            });
        },

        _onChangeRacksColor: function (colorByProperty) {
            this.collection.setRackColors(colorByProperty);
        },

        _onChangeHeight: function(dimensionBoolean) {
            var heightOption;
            if (dimensionBoolean) {
                heightOption = HeightOptions.Minimized;
            } else {
                heightOption = HeightOptions.RackUnit;
            }

            // Change the heightDeterminant on all models
            this.collection.setRackHeights(heightOption);
        },

        // These two functions are not used yet. Need to be used with TopList
        _setAllRacksMouseover: function(allRacks) {
            // Change all racks not in top list to dark grey.
            // This is to indicate which racks are in the top list.
            var oppositeList = this.collection.filter(function(rack) {
                return !_.contains(allRacks, rack);
            });
            _.invoke(oppositeList, 'set', 'colorDeterminant', ColorOptions.TopListHover);
        },

        _setAllRacksMouseout: function(allRacks) {
            // Set all changed racks back to the original color it was.
            // Preserve the original color of the rack.
            var racksViewChannel = Backbone.Wreqr.radio.channel('racks-view' + this.channelid);
            var oppositeList = this.collection.filter(function(rack) {
                return !_.contains(allRacks, rack);
            });
            _.invoke(oppositeList, 'set', 'colorDeterminant', racksViewChannel.reqres.request('currentColorState'));
        }
    });

    return RacksView;
});