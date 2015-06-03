define([
    'dashboard/model/xDomRackPointLight'
], function(RackPointLight) {
    'use strict';

    var RackPointLights = Backbone.Collection.extend({
        model: RackPointLight,

        parse: function(options) {
            return [{
                color: '1.0 1.0 1.0',
                attenuation: '1.0 .05 0.01',
                location: options.rackViewPoints.getSideDistance() + ' 0 -.5',
                radius: '200.0'
            }, {
                color: '1.0 1.0 1.0',
                attenuation: '1.0 .05 0.01',
                location: (-1 * options.rackViewPoints.getSideDistance()) + ' 0 -.5',
                radius: '200.0'
            }];
        }
    });

    return RackPointLights;

});