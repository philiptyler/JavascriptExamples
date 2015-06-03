define([
    'dashboard/model/xDomRackGrid',
    'text!dashboard/template/xDomRackGrid.html'
], function(RackGrid, RackGridTemplate) {
    'use strict';

    var RackGridView = Marionette.ItemView.extend({
        tagName: 'group',

        getTemplate: function() {
            var template;
            if (this.model.get('gridTransparency') === '1') {
                // Do not render a template if you do not wish for the grid to be seen
                template = _.template('');
            } else {
                // Load in the standard Template when you want the grid to be shown
                template = _.template(RackGridTemplate);
            }
            return template;
        },

        // Template Helper has to be written like this to access this.loadedWithFlash
        templateHelpers: function() {
            return {
                loadedWithFlash: this.loadedWithFlash
            };
        },

        modelEvents: {
            'change:gridTransparency': 'render'
        },

        initialize: function(options) {
            // Check to see if the scene is rendered with flash
            this.loadedWithFlash = options.loadedWithFlash;

            this.listenTo(Backbone.Wreqr.radio.channel('rack-options' + options.channelid).vent, 'gridClicked', this._toggleGrid);
        },

        // Changes the transparency of the grid when the user toggles the grid
        _toggleGrid: function(toShow) {
            this.model.set('gridTransparency', toShow ? '0.5' : '1');
        }

    });

    return RackGridView;

});