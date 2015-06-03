// Not yet used. Will be used to set up a grid
define([
    'dashboard/utility'
], function (Utility) {
    'use strict';

    var RackFloor = Backbone.Model.extend({
        defaults: {
            boundingBox: {
                minX: Number.MAX_VALUE,
                maxX: Number.MIN_VALUE,
                minY: Number.MAX_VALUE,
                maxY: Number.MIN_VALUE
            },

            // find the max width and height of a rack to extend the grid and views
            maxFloorPlanWidth: 0,
            maxFloorPlanHeight: 0,
            maxHeight: 0,
            offsetX: 0,
            offsetY: 0
        },

        _roundingAmount: 2,

        /* MARIONETTE FUNCTIONS */
        /************************/
        initialize: function (options) {
            this.racks = options.collection;
            this.setProperties();
            this._updateCollectionPositions();
        },

        /* PUBLIC FUNCTIONS */
        /********************/
        setProperties: function () {
            this._setBounds();
            this._setOffset(this.get('boundingBox'));
            this._setMaxHeightWidthDepth();
        },

        /* PRIVATE FUNCTIONS */
        /*********************/
        _updateCollectionPositions: function () {
            this.racks.updateRackPositions(this.get('offsetX'), this.get('offsetY'), this.get('maxHeight'));
        },

        _round: function (value) {
            var partialRound = _.partialRight(Utility.roundTo, this._roundingAmount);
            return partialRound(value);
        },

        _setMaxHeightWidthDepth: function () {
            // Round all the data to the roundingAmount
            this.set({
                maxFloorPlanWidth: this._round(_.max(this.racks.pluck('floorPlanWidth'))),
                maxFloorPlanHeight: this._round(_.max(this.racks.pluck('floorPlanHeight'))),
                maxHeight: _.max(this.racks.pluck('floorPlanDepth'))
            });
        },

        _setBounds: function () {
            var minX, maxX, minY, maxY;

            // Will find the min and max values for x and y position //
            minX = _.min(this.racks.pluck('floorPlanX'));
            maxX = _.max(this.racks.pluck('floorPlanX'));
            minY = _.min(this.racks.pluck('floorPlanY'));
            maxY = _.max(this.racks.pluck('floorPlanY'));

            this.set('boundingBox', {
                minX: this._round(minX),
                maxX: this._round(maxX),
                minY: this._round(minY),
                maxY: this._round(maxY)
            });

        },

        _setOffset: function (boundingBox) {
            // OffsetX and OffsetY are the numerical values that
            // would take the center of the rack collections to 0, 0
            var offsetX, offsetY;

            // Take the difference between the max and min value
            // Divide that difference by 2 and multiply by -1
            // Then add the opposite sign of the minimum value (add -minimumValue)
            offsetX = -(boundingBox.maxX - boundingBox.minX) / 2 - boundingBox.minX;
            offsetY = -(boundingBox.maxY - boundingBox.minY) / 2 - boundingBox.minY;
            this.set({
                offsetX: offsetX,
                offsetY: offsetY
            });
        }
    });

    return RackFloor;

});