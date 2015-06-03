// This is a collection of rackPointlights View
// Passes on the rendering to the rackpointlightview

define([
    'dashboard/view/xDomRackPointLightView'
], function(RackPointLightView) {
    'use strict';

    var RackPointLightsView = Marionette.CollectionView.extend({
        childView: RackPointLightView,
        tagName: 'group'
    });

    return RackPointLightsView;
});