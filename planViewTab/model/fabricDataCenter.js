/* Summary:
 * This is a Backbone model that represents all the data needed to render the fabric.js 2D Rack View.
 */

define(['dashboard/model/xDomRackFloor'],
  function () {
      'use strict';

      var FabricDataCenterModel = Backbone.Model.extend({
          defaults: function () {
              return {
                  racks: null,                      // Backbone.Collection of xDomRack.js models
                  modifiedRackRects: {},
                  boundingBox: null,                // Rectangle outlining all the Floorplan rack rects
                  boundingBoxCenter: null,          // Center of the floorplan bounding box
                  centerOfCanvas: null,             // pixel width and height of canvas when scaleFactor, boundingBox and origin are set

                  scaleFactor: 1,                   // Scalar used to scale the Rects to fit the canvas size
                  canvasPaddingScalar: 0.8,         // pecercentage of canvas width/height that will be filled by the Rects
                  gridSize: 0.6                     // grid size stored in meters, 60cm is default tile size
              };
          },

          /* MARIONETTE FUNCTIONS */
          /************************/

          initialize: function () {
              this._setupEventCallbacks();
          },

          /* PUBLIC FUNCTIONS */
          /********************/
          
          // Iterates through 'modifiedRackRects' and converts the fabric.Rects new pixel positions
          // back to floorplan-relative METERS, then updates its attached models with the new size/position
          // Returns an array of xDomRack.js models 
          getModifiedModels: function() {
              var modifiedModelAttributes = [];
              var modifiedRackRects = this.get('modifiedRackRects');

              for (var rackID in modifiedRackRects) {
                  if (modifiedRackRects.hasOwnProperty(rackID)) {
                      var updatedRackModel = this._cloneAndUpdateAttributes(modifiedRackRects[rackID]);
                      modifiedModelAttributes.push(updatedRackModel);
                  }
              }
              return modifiedModelAttributes;
          },
          
          // When a fabric.Object is scaled, rotated or moved this function is called.
          // Depending on the type of object (fabric.Group, fabric.Rect.. etc.) the associated Rack Rect(s)
          // will be plucked and added to a hash table.
          addDirtyFabricObject: function (fabricObject) {
              // fabric.Group objects have an array called '_objects' that stores all the fabric.Objects
              // of the group
              if (fabricObject._objects) {
                  _.each(fabricObject._objects, this.addDirtyFabricRect.bind(this));
              } else {
                  this.addDirtyFabricRect(fabricObject);
              }
          },
          
          // Adds fabric.Rect objects to the modifiedRackRects Hash Table, where the hash of a fabric.Rect
          // is its model's componentID.  This hash table ensures fabric.Rect uniqueness.
          addDirtyFabricRect: function(fabricRect) {
              if (fabricRect.model) {
                  this.get('modifiedRackRects')[fabricRect.model.get('componentID')] = fabricRect;
                  fabricRect.setCoords();
              }
          },

          // This function calculates where the floorplan origin (0m, 0m) is translated to on the fabric
          // Canvas in pixels.  (needed for drawing grid and reverse translating user floorplan edits)
          getOriginPixelOffset: function () {
              var boundingBoxCenter = this.get('boundingBoxCenter');
              var scaleFactor = this.get('scaleFactor');
              var centerOfCanvas = this.get('centerOfCanvas');
              var offset = {
                  left: -1 * boundingBoxCenter.left,
                  top: -1 * boundingBoxCenter.top
              };

              return {
                  left: offset.left * scaleFactor + centerOfCanvas.left,
                  top: offset.top * scaleFactor + centerOfCanvas.top
              };
          },
          
          getGridSpacing: function() {
              return this.get('gridSize') * this.get('scaleFactor');
          },

          /* PRIVATE FUNCTIONS */
          /*********************/

          _setupEventCallbacks: function () {
              this.on('change:boundingBox', this._setCenterOfBoundingBox);
          },

          _setCenterOfBoundingBox: function(model, newBoundingBox) {
              var center = {
                  left: newBoundingBox.left + newBoundingBox.width / 2,
                  top: newBoundingBox.top + newBoundingBox.height / 2
              };

              model.set('boundingBoxCenter', center);
          },
          
          _cloneAndUpdateAttributes: function (rackRect) {
              var scaleFactor = this.get('scaleFactor');
              var originPixelOffset = this.getOriginPixelOffset();
              var modifiedRackAttributes = {
                  componentID: rackRect.model.get('componentID'),
                  floorPlanHeight: rackRect.height * rackRect.scaleY / scaleFactor * 1000,
                  floorPlanWidth: rackRect.width * rackRect.scaleX / scaleFactor * 1000,
                  floorPlanY: (originPixelOffset.top - rackRect.getCenterPoint().y) / scaleFactor * 1000,
                  floorPlanX: (rackRect.getCenterPoint().x - originPixelOffset.left) / scaleFactor * 1000,
                  rackOrientation: rackRect.angle
              };

              // TODO: remove these when this function is stable
              //console.log("rackRect attrs:", rackRect.left, rackRect.top, rackRect.height, rackRect.width, rackRect.angle);
              //console.log("original model:", _.pick(rackRect.model.attributes, 'floorPlanHeight', 'floorPlanWidth', 'floorPlanY', 'floorPlanX', 'rackOrientation'));
              //console.log("model too send:", modifiedRackAttributes);
              
              return modifiedRackAttributes;
          }

      });

      return FabricDataCenterModel;
  });