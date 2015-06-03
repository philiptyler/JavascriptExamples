define(function() {
    'use strict';

    var RackPointLight = Backbone.Model.extend({
        default: {
            intensity: '',
            color: '',
            attenuation: '',
            location: '',
            radius: ''
        }
    });

    return RackPointLight;
});