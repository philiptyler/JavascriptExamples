define([
    'text!dashboard/template/xDomRackView.html'
], function(RackViewTemplate) {
    'use strict';

    var RackView = Marionette.ItemView.extend({
        // Each rack is the type transform
        tagName: 'transform',
        template: _.template(RackViewTemplate),

        initialize: function(options) {
            this.rackViewChannel = Backbone.Wreqr.radio.channel('rack-view' + options.channelid);
            this.rackOptionsChannel = Backbone.Wreqr.radio.channel('rack-options' + options.channelid);
            this.listenTo(this.rackOptionsChannel.vent, 'toggleNames', this._toggleName.bind(this));
        },

        // Set the attributes to the transform element
        attributes: function() {
            return {
                id: 'rack' + this.model.get('componentID'),
                translation: this.model.get('floorPlanX') + ' ' + this.model.get('floorPlanY') + ' ' + this.model.get('adjustedZPosition'),
                def: 'rack'
            };
        },

        // When the models property changes run the private function
        modelEvents: {
            'change:floorPlanDepth': '_onChangeHeight',
            'change:rackColor': '_onChangeRackColor',
            'change:adjustedZPosition': '_onChangeZPosition'
        },

        ui: {
            rackMaterial: '.rack-material',
            rackBox: '.rack-box',
            textMaterial: '.text-material',
            textTransform: '.text-transform',
            componentId: '#ComponentID-Data',
            timeSensor: '.rack-time-sensor'
        },

        _handleRackMouseover: function() {
            // Trigger custom event mouseoverRack that is listened by rackToolTipView
            this.rackViewChannel.vent.trigger('mouseoverRack', this.model);
        },

        _handleRackMouseout: function() {
            // Hide the rackInformation panel when you mouse out
            // Create a command event that is listened by rackToolTipView
            this.rackViewChannel.commands.execute('mouseoutRack');
        },

        _handleRackClick: function() {
            // Hide the rackInformation panel when you mouse out
            // Create a command event that is listened by rackToolTipView
            this.rackViewChannel.vent.trigger('clickRack', this.model);
        },

        _handleRackDblclick: function() {
            // Hide the rackInformation panel when you mouse out
            // Create a command event that is listened by rackToolTipView
            this.rackViewChannel.vent.trigger('dblclickRack', this.model);
        },

        afterShow: function() {
            this.el.addEventListener('click', this._handleRackClick.bind(this));
            this.el.addEventListener('dblclick', this._handleRackDblclick.bind(this));
            this.el.addEventListener('mouseover', this._handleRackMouseover.bind(this));
            this.el.addEventListener('mouseout', this._handleRackMouseout.bind(this));
        },

        _onChangeZPosition: function(model, zposition) {
            var translation = this.$el.attr('translation').split(' ');
            translation[2] = zposition;
            this.$el.attr('translation', translation.join(' '));
        },

        _onChangeRackColor: function(model, color) {
            this.ui.rackMaterial.attr('diffusecolor', color);
        },

        _onChangeHeight: function(model, height) {
            var transform, oldHieght;

            // Update the rack to the new height
            transform = this.ui.rackBox.attr('size').split(' ');
            oldHieght = transform[2];
            transform[2] = height;
            this.ui.rackBox.attr('size', transform.join(' '));

            // Adjust the zPosition of the rack when you change the height.
            // This will keep the rack on the grid instead of having it float above it
            model.set('adjustedZPosition', model.get('adjustedZPosition') - ((oldHieght - height) / 2));
        },

        // This function is called when a 'toggleNames' event is aggregated on the rack-options channel
        // It toggles the transparancy attribute of the text material html
        _toggleName: function() {
            if (this.model.get('renderName')) {
                var transparencyValue = this.ui.textMaterial.attr('transparency');
                this.ui.textMaterial.attr('transparency', transparencyValue == '1.0' ? '0.0' : '1.0');
            }

        }
    });

    return RackView;
});