define([
    'dashboard/utility'
], function(Utility) {
    'use strict';

    var RackGrid = Backbone.Model.extend({
        defaults: {
            // String that has three color values (r g b)
            color: '',
            transparency: '',

            coordinateConnections: '',
            coordinates: '',

            // These properties are used for the flash render. Used to set an image up
            topLeftCorner: '',
            topRightCorner: '',
            bottomRightCorner: '',
            bottomLeftCorner: '',
        },

        initialize: function(options) {
            // standard grid interval is 60cm but we are scaling down by 1000 to .6
            this._gridInterval = 0.6;
            this._roundAmount = 2;

            this.set('color', '0.5, 0.5, 0.5');
            this.set('gridTransparency', '.5');

            this._setGridBounds(options.rackFloor);
            this._createGrid();
        },

        _setGridBounds: function(rackFloor) {
            var boundingBox, maxFloorPlanHeight, maxFloorPlanWidth, offsetY, offsetX;

            this._gridBounds = {};

            boundingBox = rackFloor.get('boundingBox');
            maxFloorPlanHeight = rackFloor.get('maxFloorPlanHeight');
            maxFloorPlanWidth = rackFloor.get('maxFloorPlanWidth');
            offsetY = rackFloor.get('offsetY');
            offsetX = rackFloor.get('offsetX');

            // Take the floor point and adjust it based on the offset and largest rack size
            // That value will be divided by the gridInterval to give it an even pattern
            // Round that number up and add one to that value
            // This will ensure that the grid is larger then the racks with some additional padding
            this._gridBounds.minY = Utility.roundTo(
                Math.floor(
                    (boundingBox.minY - maxFloorPlanHeight + offsetY) / this._gridInterval - 1
                ) * this._gridInterval,
                this._roundAmount
            );

            this._gridBounds.maxY = Utility.roundTo(
                Math.ceil(
                    (boundingBox.maxY + maxFloorPlanHeight + offsetY) / this._gridInterval + 1
                ) * this._gridInterval,
                this._roundAmount
            );

            this._gridBounds.minX = Utility.roundTo(
                Math.floor(
                    (boundingBox.minX - maxFloorPlanWidth + offsetX) / this._gridInterval - 1
                ) * this._gridInterval,
                this._roundAmount
            );

            this._gridBounds.maxX = Utility.roundTo(
                Math.ceil(
                    (boundingBox.maxX + maxFloorPlanWidth + offsetX) / this._gridInterval + 1
                ) * this._gridInterval,
                this._roundAmount
            );

            // Set the corner properties based on the gridBounds
            this.set('topLeftCorner', this._gridBounds.minX + ' ' + this._gridBounds.maxY + ' -1');
            this.set('topRightCorner', this._gridBounds.maxX + ' ' + this._gridBounds.maxY + ' -1');
            this.set('bottomRightCorner', this._gridBounds.maxX + ' ' + this._gridBounds.minY + ' -1');
            this.set('bottomLeftCorner', this._gridBounds.minX + ' ' + this._gridBounds.minY + ' -1');
        },

        _createGrid: function() {
            var coordinateConnections, coordinates, connections, gridStart;

            /* coordinateConnections: string representing connection of coordinates
		    all coordinates are connected until it reaches a -1
		    1, 2, -1, 3, 4 will connect coordinate 1 and 2
		    but will not connect coordinate 2 and 3
		    */
            coordinateConnections = '';

            /* coordinates is a string representing the coordinates (x, y, z) */
            coordinates = '';

            /* connections signifies what set of line user is on */
            connections = 0;

            /* Vertical lines on the Grid */
            for (gridStart = this._gridBounds.minX; gridStart <= this._gridBounds.maxX; connections++) {
                coordinates += gridStart + ' ' + this._gridBounds.minY + ' -1 ';
                coordinates += gridStart + ' ' + this._gridBounds.maxY + ' -1 ';
                coordinateConnections += (connections * 2) + ' ' + (connections * 2 + 1) + ' -1 ';
                gridStart = Utility.roundTo(gridStart + this._gridInterval, this._roundAmount);
            }

            /* Horizontal Lines on the Grid */
            for (gridStart = this._gridBounds.minY; gridStart <= this._gridBounds.maxY; connections++) {
                coordinates += this._gridBounds.minX + ' ' + gridStart + ' -1 ';
                coordinates += this._gridBounds.maxX + ' ' + gridStart + ' -1 ';
                coordinateConnections += (connections * 2) + ' ' + (connections * 2 + 1) + ' -1 ';
                gridStart = Utility.roundTo(gridStart + this._gridInterval, this._roundAmount);
            }

            this.set('coordinateConnections', coordinateConnections);
            this.set('coordinates', coordinates);
        }
    });

    return RackGrid;
});