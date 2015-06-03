define([
    'text!dashboard/template/xDomRackLegend.html'
], function (RackLegendTemplate) {
    'use strict';

    var RackLegendView = Marionette.ItemView.extend({
        className: 'rack-color-legend',
        template: _.template(RackLegendTemplate),

        ui: {
            legendWrapper: '.legend-wrapper',
            bars: '.scene-controls-icon'
        },

        // After the controls are appened to the DOM, setup the hover() event callback
        // so when the user hovers over the font-awesome cogs the controls menu shows up
        onShow: function() {
            this.oldWidth = this.ui.legendWrapper.width();
            this.oldHeight = this.ui.legendWrapper.height();

            var self = this;
            this.$el.hover(function() {
                self.ui.bars.stop(true, true).hide();
                self.toggleRegionSize();
                self.ui.legendWrapper.stop(true, true).show(200);
                // TODO: lookup stop function or CSS3 transitions
            }, function() {
                self.ui.bars.stop(true, true).show(600);
                self.ui.legendWrapper.stop(true, true).hide(400, self.toggleRegionSize.bind(self));
            });
        },

        // Toggle the size of the region between a 40px x 40px box
        // around the font-awesome cogs and the 115px x 105px box
        // around the scene controls
        toggleRegionSize: function() {
            var oldHeight = this.oldHeight;
            this.oldHeight = this.$el.height();
            this.$el.height(oldHeight);

            var oldWidth = this.oldWidth;
            this.oldWidth = this.$el.width();
            this.$el.width(oldWidth);

            this.$el.stop();
        },
    });

    return RackLegendView;
});