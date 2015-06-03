// This view does use a template
// Not sure if it can be built without one but
// I want to use the attributes property if it is possible

define(function() {
    'use strict';

    var RackPointLightView = Marionette.ItemView.extend({
        // Currently using a directional light might need to rename all my files later
        tagName: 'pointlight',
        template: _.template(''),
        attributes: function() {
            return {
                attenuation: this.model.get('attenuation'),
                color: this.model.get('color'),
                location: this.model.get('location'),
                radius: this.model.get('radius'),
                // shadowIntensity: ".1",
                // shadowFilterSize: "32",
                // shadowOffset: "1"
            };
        }
    });

    return RackPointLightView;
});