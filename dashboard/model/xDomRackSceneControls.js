define(['common/collection/attributes'],
    function (Attributes) {
    'use strict';

    var RackSceneControls = Backbone.Model.extend({
        defaults: function() {
            return {
                attributesLoaded: false,
                rackAttributes: new Attributes(),
                allRackAlerts: null,
                valueAttributeName: '',
                controlsEnabled: false,
                enableNamesButton: true,
                currentViewIndex: 0,
                maxGridSpacing: 300,
                minGridSpacing: 10,
                defaultGridSpacing: 60,
                
                viewItems: [{
                    title: 'Top View',
                    className: 'view-item view-item1 selected-view'
                }, {
                    title: 'Front View',
                    className: 'view-item view-item2'
                }, {
                    title: 'Left View',
                    className: 'view-item view-item3'
                }, {
                    title: 'Right View',
                    className: 'view-item view-item4'
                }, {
                    title: 'Back View',
                    className: 'view-item view-item5'
                }],
                checkboxes: [{
                    title: 'Toggle Height',
                    value: 'dimension-toggle'
                }, {
                    title: 'Shuffle Views',
                    value: 'view-shuffle'
                }, {
                    title: 'Toggle Grid',
                    value: 'grid-toggle',
                    property: 'checked'
                }]
            };
        },

        initialize: function (options) {
            if (!_.isUndefined(options) && options.loadAttributes === true) {
                var self = this;
                this.get('rackAttributes').fetch({
                    success: (function() {
                        this.set('attributesLoaded', true);
                    }).bind(self)
                });
            }
        }

    });

    return RackSceneControls;
});