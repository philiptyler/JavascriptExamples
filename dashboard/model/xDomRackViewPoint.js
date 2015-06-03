define(function() {
    'use strict';

    var RackViewPoint = Backbone.Model.extend({
        defaults: {
            id: '',
            centerOfRotation: '',
            position: '',
            orientation: '',
            fieldOfView: '',
            setBind: ''
        }
    });

    return RackViewPoint;
});