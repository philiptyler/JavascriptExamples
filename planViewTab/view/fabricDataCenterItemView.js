// Summary:
// This view creates a single fabricjs rect based on the properties of a 
// single xDomRack.js model

define([], function () {
    'use strict';

    var FabricDataCenterItemView = Marionette.ItemView.extend({

        initialize: function() {
            console.log('Fabric x3dom model', this.model);
        },
    });

    return FabricDataCenterItemView;
});