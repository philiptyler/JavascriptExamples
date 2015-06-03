define([
    'text!dashboard/template/xDomRackToolTip.html',
    'dashboard/utility'
], function(RackToolTipTemplate, Utility) {
    'use strict';

    var RackToolTipView = Marionette.ItemView.extend({
        template: _.template(RackToolTipTemplate),

        // When the model is changed re-render the tooltip
        // Was considering running it into another function as render is an expensive function
        // but I decided against it as the entire model is being changed
        // I performed a profile of both sides and didnt see that much of a difference.
        // If performance becomes an issue I can change what I have done.
        modelEvents: {
            'change': 'render'
        },

        ui: {
            controlsColor: '.controls-color'
        },

        templateHelpers: {
            roundTo: function(value) {
                return Utility.roundTo(value);
            }
        },

        // Listeners will pick up events from the rack-view to determine whether the state of hover.
        initialize: function (options) {
            var rackViewChannel = Backbone.Wreqr.radio.channel('rack-view' + options.channelid);
            
            this.loadedWithFlash = _.isUndefined(options.loadedWithFlash) ? false : options.loadedWithFlash;
            this.channelid = options.channelid;
            this.listenTo(rackViewChannel.vent, 'mouseoverRack', this._hoverOverChange);

            if (!_.isUndefined(options.canvas)) {
                var self = this;
                this.canvas = options.canvas;
                rackViewChannel.commands.setHandler('mouseoutRack', this._hoverOffChange.bind(this));
                this.canvas.addEventListener('mousemove', this.setElementPosition.bind(this));
                this.canvas.addEventListener('mouseleave', function() {
                    self.$el.hide(0);
                });
            }
        },

        // This function finds the current mouse position on the canvas and renders the tooltip
        // in a viewable location near the mouse.
        setElementPosition: function(event) {
            var left, top;
            var width = 150,
                height = this.$el.height();
            if (event.clientX > window.innerWidth - width - 50) {
                left = event.clientX - width - 50;
            } else {
                left = event.clientX + 50;
            }

            if (event.clientY > window.innerHeight - height + 100) {
                top = window.innerHeight - height;
            } else {
                top = event.clientY - 100;
            }

            this.$el.css({
                left: left,
                top: top
            });
        },

        // Color coat different parts of the tool tip to make the tool tip stand out more.
        //onRender: function() {
        //    this.ui.controlsColor.each(function(index, value) {
        //        var $value = $(value);
        //        $value.css('background-color', this.model.getColor($value.data('type')));
        //    }.bind(this));
        //},

        // If the user is now hovering over a different rack than the tooltips
        // model was last updated to, reset the tooltips model data and stop
        // listening to changes in the old model
        _hoverOverChange: function (newModel) {
            if (!_.isUndefined(newModel) && this.model.get('componentID') !== newModel.get('componentID')) {
                var self = this;
                this.model.set(newModel.attributes);
                if (!_.isUndefined(this.displayModel)) {
                    this.stopListening(this.displayModel);
                }
                this.listenTo(newModel, 'change', function(model) {
                    self.model.set(model.attributes);
                });
                this.displayModel = newModel;
            }
            this.$el.show();
        },

        _hoverOffChange: function() {
            this.$el.hide();
        }

    });

    return RackToolTipView;
});