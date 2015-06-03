// Summary:
// This is a utility class that adds some commom Cormant-CS functionality to fabric.js
// such as initializing canvas objects, overwriting certain fabric.js functions, drawing
// grids, etc.

/* global fabric */
define(['dashboard/enum/hexValues', 'thirdparty/fabric'],
  function (HexValues) {
      'use strict';

      //Edit fabric.js object prototypes
      fabric.Object.prototype.transparentCorners = false;
      fabric.Object.prototype.hasBorders = false;
      fabric.Object.prototype.cornerSize = 6;
      fabric.Object.prototype.cornerColor = '#3D6AA2';

      var FabricUtility = {

          /* PUBLIC FUNCTIONS */
          /********************/

          createCanvas: function () {
              var canvas = new fabric.Canvas('plan-view-fabric-canvas');

              this._updateCanvasFindTarget(canvas);
              this._limitObjectRotation(canvas, 90);

              return canvas;
          },

          // Creates a fabric.Rect based on a xDomRack.js model
          // Also binds the model to the RackRect after creation
          // so we know which model's floorplan properties need adjusting and saving
          // after the user edits a racks position
          createRackRect: function (model) {
              var rackWidth = model.get('floorPlanWidth');
              var rackHeight = model.get('floorPlanHeight');
              var strokeWidthDeterminent = _.min([rackWidth, rackHeight]);
              var rackRect = new fabric.Rect({
                  left: model.getLeftOffset(),
                  top: model.getTopOffset(),
                  height: rackHeight,
                  width: rackWidth,
                  angle: model.get('rackOrientation'),
                  fill: HexValues.Invalid,
                  strokeWidth: strokeWidthDeterminent * 0.04,
                  stroke: 'black'
              });
              rackRect.model = model;

              return rackRect;
          },

          // UNDER CONSTRUCTION
          createRackText: function (model) {
              var rackText = new fabric.Text(model.get('name'), {
                  height: model.get('floorPlanHeight'),
                  width: model.get('floorPlanWidth'),
                  angle: model.get('rackOrientation'),
                  fill: 'black',
                  fontSize: model.get('floorPlanHeight') / 2,
                  //fontWeight: ,
                  //fontFamily: ,
                  textAlign: 'center'
              });

              return rackText;
          },
          
          // options must have these parameters!
          //    origin: the canvas pixel coordinates of (0,0) on the floorplan,
          //    width: width of the fabricjs canvas,
          //    height: height of the fabricjs canvas,
          //    spacing: cell width/height of each tile in the grid (in pixels)
          createGridData: function (options) {
              var pixelIndex;
              var gridData = {
                  lines: [],
                  spacing: options.spacing,
                  gridOffset: this._findGridOffset(options.origin, options.spacing)
              };
              
              for (pixelIndex = gridData.gridOffset.left; pixelIndex < options.width; pixelIndex += gridData.spacing) {
                  gridData.lines.push(this._createLine([pixelIndex, 0, pixelIndex, options.height]));
              }
              for (pixelIndex = gridData.gridOffset.top; pixelIndex < options.height; pixelIndex += gridData.spacing) {
                  gridData.lines.push(this._createLine([0, pixelIndex, options.width, pixelIndex]));
              }

              return gridData;
          },

          // Returns default fabric.Shadow object for Racks
          // TODO : replace magic numbers with numbers based on median rack floorplanwidth
          getRackShadow: function (scaleFactor) {
              return {
                  color: 'rgba(0,0,0, 0.7)',
                  blur: 7 / scaleFactor,
                  offsetX: 6 / scaleFactor,
                  offsetY: 6 / scaleFactor,
                  fillShadow: true,
                  strokeShadow: true
              };
          },

          /* PRIVATE FUNCTIONS */
          /*********************/
          
          _limitObjectRotation: function(canvas, angleInterval) {
              canvas.on('object:rotating', function(event) {
                  event.target.set({
                      angle: Math.round(event.target.angle / angleInterval) * angleInterval
                  });
              });
          },

          _updateCanvasFindTarget: function (canvas) {
              // Modify the canvas' findTarget function so it will fire mousemove and mouseout events
              // stackoverflow.com/questions/21511383/fabricjs-detect-mouse-over-object-path
              canvas.findTarget = (function (originalFunction) {
                  return function () {
                      var target = originalFunction.apply(this, arguments);
                      if (target) {
                          if (this._hoveredTarget !== target) {
                              canvas.fire('object:over', { target: target });
                              if (this._hoveredTarget) {
                                  canvas.fire('object:out', { target: this._hoveredTarget });
                              }
                              this._hoveredTarget = target;
                          }
                      }
                      else if (this._hoveredTarget) {
                          canvas.fire('object:out', { target: this._hoveredTarget });
                          this._hoveredTarget = null;
                      }
                      return target;
                  };
              })(canvas.findTarget);

              return canvas;
          },

          // Instanciates a single fabric.Line for creating grids
          _createLine: function (coords) {
              return new fabric.Line(coords, {
                  fill: '#c5dbec',
                  stroke: '#c5dbec',
                  strokeWidth: 1,
                  selectable: false
              });
          },
          
          // This function uses the floorplan origin to find the starting
          // intersection of the grid to be drawn by adding or subtracting spacing intervals
          // spacing and origin points are in pixel coordinates from the fabric canvas
          _findGridOffset: function (origin, spacing) {
              var left = origin.left;
              var top = origin.top;
              
              while (left < 0) left += spacing;
              while (left >= spacing) left -= spacing;
              while (top < 0) top += spacing;
              while (top >= spacing) top -= spacing;

              return { left: left, top: top };
          }
      };

      return FabricUtility;
  });