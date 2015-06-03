// RackStage requires a racks view and will also require a rackFloorView
// I might want to change how the buttons by making them with a template
// Not sure if making a button is too small for a view
define([
    'text!dashboard/template/xDomRackSceneControls.html'
], function(RackSceneControlsTemplate) {
    'use strict';

    var RackSceneControlsView = Marionette.ItemView.extend({
        template: _.template(RackSceneControlsTemplate),

        ui: {
            controlsContainer: '.controls-container',
            allControlsWrapper: '.all-controls-wrapper',
            colorItems: '.color-item',
            colorTitle: '.color-option > h3',
            colorList: '.color-option > ul',
            viewItems: '.view-item',
            viewTitle: '.camera-option > h3',
            viewList: '.camera-option > ul',
            gridToggle: '#grid-toggle',
            viewShuffle: '#view-shuffle',
            dimensionToggle: '#dimension-toggle',
            cogs: '.scene-controls-icon'
        },

        events: {
            'click @ui.viewTitle': 'toggleViewOptions',
            'click @ui.colorTitle': 'toggleColorOptions',
            'click .camera-option .view-item': 'toggleCamera',
            'click .color-option .color-item': 'toggleColor',
            'click @ui.gridToggle': '_toggleGridTransparency',
            'click @ui.viewShuffle': 'shuffleViewActivated',
            'click @ui.dimensionToggle': '_toggleDimension'
        },

        modelEvents: {
            'change:selectedColor': '_onChangeSelectedColor',
            'change:selectedView': '_onChangeSelectedView'
        },

        // Setup the backbone channels based on the channelid given
        initialize: function(options) {
            this.channelid = options.channelid;
            // Setup some channels for some requests
            var rackViewChannel = Backbone.Wreqr.radio.channel('rack-view' + options.channelid);
            var racksViewChannel = Backbone.Wreqr.radio.channel('racks-view' + options.channelid);

            // Set up handlers to handle the requests from other files
            rackViewChannel.reqres.setHandler('currentColorState', this._getCurrentColorState.bind(this));
            racksViewChannel.reqres.setHandler('currentColorState', this._getCurrentColorState.bind(this));

            // Bind the rackOptions channel to this
            this.racksOptionsChannel = Backbone.Wreqr.radio.channel('rack-options' + options.channelid);
        },

        // After the controls are appened to the DOM, setup the hover() event callback
        // so when the user hovers over the font-awesome cogs the controls menu shows up
        onShow: function() {
            this.oldParentWidth = this.ui.allControlsWrapper.width();
            this.oldParentHeight = this.ui.allControlsWrapper.height();

            // Clicking the first element in the camera and color options group.
            // This will activate events that go with the click (toggleCamera and toggleColor)
            this.model.set('selectedColor', 'Power');
            this.model.set('selectedView', 'Top View');

            var self = this;
            this.$el.parent().hover(function() {
                // .stop() will prevent the animation from stacking.
                self.ui.cogs.stop(true, true).hide();
                self.ui.allControlsWrapper.stop(true, true).show(200);
                self.toggleRegionSize();
            }, function() {
                self.$('.active-list').removeClass('active-list');
                self.ui.cogs.stop(true, true).show(600);
                self.ui.allControlsWrapper.stop(true, true).hide(400, self.toggleRegionSize.bind(self));
            });
        },

        // Toggle the size of the region between a 40px x 40px box
        // around the font-awesome cogs and the 115px x 105px box
        // around the scene controls
        toggleRegionSize: function() {
            var oldParentWidth = this.oldParentWidth;
            this.oldParentWidth = this.$el.parent().width();
            this.$el.parent().width(oldParentWidth);

            var oldParentHeight = this.oldParentHeight;
            this.oldParentHeight = this.$el.parent().height();
            this.$el.parent().height(oldParentHeight);
        },

        // When the user clicks the 'Views' control button,
        // show the list of view options.  Hide if they click again
        toggleViewOptions: function() {
            this._toggleListOptions(this.ui.viewList);
        },

        // When the user clicks the 'Colors' control button,
        // show the list of color options.  Hide if they click again
        toggleColorOptions: function() {
            this._toggleListOptions(this.ui.colorList);
        },

        _toggleListOptions: function(list) {
            if (list.hasClass('active-list')) {
                list.animate({
                    opacity: 0
                }, 400, function() {
                    list.removeClass('active-list');
                });
            } else {
                this.ui.controlsContainer.children().removeClass('active-list');
                list.addClass('active-list');
                list.animate({
                    opacity: 1
                }, 200);
            }
        },

        // Will change the scene view to the next one on the list view list
        shuffleView: function() {
            var currentView, currentNumber, targetNumber, targetView;

            currentView = this.ui.viewList.find('.selected-view').first();
            currentView.removeClass('selected-view');

            if (!_.isUndefined(currentView)) {
                currentNumber = parseInt(
                    currentView[0].className.replace(new RegExp('(view-item)+', 'g'), ''), 10
                );
                targetNumber = currentNumber === this.ui.viewItems.length ? 1 : currentNumber + 1;
                targetView = this.$('.view-item' + targetNumber);

                targetView.addClass('selected-view');

                this.model.set('selectedView', targetView.first().data('value'));
            }
        },

        // If activated this function will call shuffleView every 5sec
        // This is used to go and shuffle through each view.
        shuffleViewActivated: function() {
            if (this.ui.viewShuffle[0].checked === true) {
                this.shuffleId = setInterval((function() {
                    this.shuffleView();
                }).bind(this), 5000);
            } else {
                window.clearInterval(this.shuffleId);
            }
        },

        // toggleCamera is throttled to avoid mutating the views.
        toggleCamera: _.throttle(function(event) {
            // Continue if the currentTarget does NOT have the class selectedView
            if (!$(event.currentTarget).hasClass('selectedView')) {

                if (_.isUndefined(event.currentTarget.className)) {
                    throw (new Error('currentTargets class is undefined'));
                }

                this.model.set('selectedView', event.currentTarget.dataset.value);
                // Removing the previous selectedView and assign it the new target.
                // Should not be using event.currentTarget but will figure that out later
                this.ui.viewList.find('.selected-view').removeClass('selected-view');
                event.currentTarget.className += ' selected-view';

                // After a view is selected, the shuffle mode should quit.
                this.ui.viewShuffle[0].checked = false;
                this.shuffleViewActivated();

                // clean up open lists
                this.toggleViewOptions();
            }

        }, 1500),

        toggleColor: function(event) {
            // Continue if the currentTarget does NOT have the class selectedColor
            if (!$(event.currentTarget).hasClass('selected-color')) {

                // Removing the previous selectedColor and assign it the new target.
                this.ui.colorList.find('.selected-color').removeClass('selected-color');
                event.currentTarget.className += ' selected-color';

                this.model.set('selectedColor', event.currentTarget.dataset.value);
                this.toggleColorOptions();
            }
        },

        _getCurrentColorState: function() {
            return this.model.get('selectedColor');
        },

        _onChangeSelectedColor: function(model, selectedColor) {
            // Send a signal to xDomRacksView
            this.racksOptionsChannel.vent.trigger('changeColor', selectedColor);
        },

        _onChangeSelectedView: function(model, selectedView) {
            this.racksOptionsChannel.vent.trigger('changeView', selectedView);
        },

        _toggleDimension: function() {
            // Trigger an event caught in racksView
            this.racksOptionsChannel.vent.trigger('changeDimension', this.ui.dimensionToggle.prop('checked'));
        },

        _toggleGridTransparency: function() {
            // Trigger an event caught in rackGridView
            this.racksOptionsChannel.vent.trigger('gridClicked', this.ui.gridToggle[0].checked);
        }

    });

    return RackSceneControlsView;
});