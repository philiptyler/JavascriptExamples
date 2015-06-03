define([
    'dashboard/view/xDomRackViewPointView'
], function(RackViewPointView) {
    'use strict';

    var RackViewPointsViews = Marionette.CollectionView.extend({
        childView: RackViewPointView,
        tagName: 'group',

        initialize: function(options) {
            // Listened to a signal from the rackOptionsView
            // Calls the private function _changeView
            var rackOptionsChannel = Backbone.Wreqr.radio.channel('rack-options' + options.channelid);
            this.listenTo(rackOptionsChannel.vent, 'changeView', this._changeView);
            
            rackOptionsChannel.vent.trigger('minMaxZoom', {
                minZoom: this.collection.getTopDistance(), 
                maxZoom: this.collection.getMaxRackHeight()
            });
        },

        // Changes the setBind attribute in the model
        // Any changes in that attribute are picked up by childView (RackViewPointView)
        _changeView: function(viewpointName) {
            // Find the viewpointModel that matches the viewpointName
            var selectedViewpoint = this.collection.find(function(viewpointModel) {
                return viewpointModel.id === viewpointName;
            });

            // This is a trick to ensure smooth transitions between different camera views
            // In order for a transition between views both the current and the target view must have setbind to true
            // In order for the event to be triggered in the RackViewPointView the setBind needs to be changed.
            selectedViewpoint.set('setBind', '');
            selectedViewpoint.set('setBind', 'true');
        }
    });

    return RackViewPointsViews;
});