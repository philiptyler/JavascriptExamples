define([
    'dashboard/model/xDomRackViewPoint'
], function(RackViewPoint) {
    'use strict';

    var RackViewPoints = Backbone.Collection.extend({
        model: RackViewPoint,

        /* BACKBONE FUNCTIONS */
        /**********************/

        initialize: function(options) {
            this.rackFloor = options.rackFloor;
            this.viewDimensions = options.viewDimensions;
            this.focalAngle = 0.75;
        },

        parse: function () {
            var topDistance = this.getTopDistance();
            return [{
                id: 'Top View',
                centerOfRotation: '0 0 0',
                position: '0 0 ' + topDistance,
                orientation: '0.0 0.0 0.0 0.0',
                fieldOfView: this.focalAngle + ''
            }, {
                id: 'Front View',
                centerOfRotation: '0 0 0',
                position: '0 -' + topDistance + ' ' + topDistance / 1.5,
                orientation: '1.0 0.0 0.0 1.0',
                fieldOfView: this.focalAngle + ''
            }, {
                id: 'Left View',
                centerOfRotation: '0 0 0',
                position: (this.getSideDistance()) + ' 0 ' + topDistance / 4,
                orientation: '0.50 -0.50 -0.75 1.87',
                fieldOfView: this.focalAngle + ''
            }, {
                id: 'Right View',
                centerOfRotation: '0 0 0',
                position: -this.getSideDistance() + ' 0 ' + topDistance / 4,
                orientation: '.5 .5 0.75 1.87',
                fieldOfView: this.focalAngle + ''
            }, {
                id: 'Back View',
                centerOfRotation: '0 0 0',
                position: '0 ' + topDistance + ' ' + topDistance / 1.5,
                orientation: '0.0 0.45 0.85 3.14',
                fieldOfView: this.focalAngle + ''
            }];
        },
        
        /* PUBLIC FUNCTIONS */
        /********************/

        /* Returns the top distance needed for view */
        getTopDistance: function () {
            var boudingBox = this.rackFloor.get('boundingBox');
            var maxRackHeight = this.getMaxRackHeight();
            var width = this.viewDimensions.width,
                height = this.viewDimensions.height;
            var differenceX = boudingBox.maxX - boudingBox.minX;
            var differenceY = boudingBox.maxY - boudingBox.minY;
            var floorRatio = differenceX / differenceY,
                aspectRatio = width / height;
            var viewHeight, fieldOfView = 1.0 / Math.tan(this.focalAngle / 2);

            // The raddock is wider than the grid
            if (floorRatio <= aspectRatio) {
                viewHeight = (differenceY / 2 * fieldOfView);
            }
                // The Raddock is taller than the grid
            else {
                viewHeight = (differenceX / 2 * fieldOfView / aspectRatio);
            }

            return viewHeight + maxRackHeight + 5;
        },
        
        getMaxRackHeight: function() {
            return this.rackFloor.get('maxHeight');
        },

        /* Returns the front distance needed for view */
        getSideDistance: function() {
            var differenceY = this.rackFloor.get('boundingBox').maxY - this.rackFloor.get('boundingBox').minY;
            //minimumX corrected by Xoffset - largest FloorPlanWidth - the Ydifference
            return this.rackFloor.get('boundingBox').minX + this.rackFloor.get('offsetX') - this.rackFloor.get('maxFloorPlanWidth') - differenceY;
        }
    });

    return RackViewPoints;
});