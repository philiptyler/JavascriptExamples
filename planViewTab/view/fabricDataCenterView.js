﻿// Summary:
// This view is swapped into planViewTabView.js's DataCenterView Region.
// Its purpose is to show a 2D top-down view of the selected data center in 
// the assets tree.

/* global fabric */
define(['text!assets/information/planViewTab/template/fabricDataCenterView.html',
        'common/cormantFabric',
        'common/model/notificationManager'
], function (FabricDataCenterViewTemplate, FabricUtility, NotificationManager) {
    'use strict';

    var FabricDataCenterView = Marionette.ItemView.extend({
        template: _.template(FabricDataCenterViewTemplate),

        /* PUBLIC PROPERTIES */
        /*********************/

        domParent: null,            // the jQuery object of this view's parent (needed for resizing)
        fabricCanvas: null,         // the fabric.Canvas object generated by cormantFabric.js
        rackRects: null,            // array of fabric.Rects that represent all the racks in the planview
        gridData: null,             // js object that stores the fabric.Line objects and positioning for drawing the grid

        /* MARIONETTE FUNCTIONS */
        /************************/

        initialize: function (options) {
            this.domParent = options.domParent;
            this.rackViewChannel = Backbone.Wreqr.radio.channel('rack-view' + options.channelid);
            this.rackOptionsChannel = Backbone.Wreqr.radio.channel('rack-options' + options.channelid);
            this.listenTo(this.rackOptionsChannel.vent, 'toggleNames', this._toggleNames.bind(this));
            this.listenTo(this.rackOptionsChannel.vent, 'changeGrid', this._redrawGrid.bind(this));
        },

        // Create Fabric canvas, set its dimensions and event handlers
        // Use fabric.js to draw all the models as rects to the canvas
        onShow: function () {
            this.fabricCanvas = FabricUtility.createCanvas();
            this._setupCanvasSizing();
            this._setupRackEvents();
            this._setScaleFactorAndBoundingBox();
            this._setGridData();
            
            this._drawGrid();
            this._drawRackRects();
            this._setupEditCallbacks();

            this.fabricCanvas.renderAll();
        },

        /* PUBLIC FUNCTIONS */
        /********************/
        
        generateRackRects: function(xDomRacks) {
            this.rackRects = xDomRacks.map(FabricUtility.createRackRect);
        },
        
        // Called by parent view when the 'save' control is clicked in the planview toolbar
        // Sends the 'dirty' (editted) rack objects back to the server 
        savePlanview: function (onSuccessCallback) {
            var modifiedRacks = this.model.getModifiedModels()

            if (modifiedRacks.length) {
                // Show loading spinner
                $.csAjax({
                    type: 'POST',
                    contentType: 'application/json',
                    url: '/csweb/PlanView/UpdateRackPositions',
                    data: JSON.stringify(modifiedRacks),
                    // complete: remove loading spinner
                    success: function() {
                        onSuccessCallback();
                    }
                });
            } else {
                NotificationManager.showWarnings('No PlanView Edits to Save');
            }
        },

        /* PRIVATE FUNCTIONS */
        /*********************/
        
        // Sets canvas width and adds event handle for browser resizing
        _setupCanvasSizing: function () {
            this.fabricCanvas.setWidth(this.domParent.width());
            this.fabricCanvas.setHeight(400);
            
            var resize = this._resize.bind(this);
            window.addEventListener('resize', resize);
            this.onBeforeDestroy = function() {
                window.removeEventListener('resize', resize);
            };
        },
        
        // called on browser resize
        _resize: function () {
            this.fabricCanvas.setWidth(this.domParent.width());
            this.fabricCanvas.calcOffset();
            this._redrawGrid();
        },

        // Scales and centers the fabric.Rects to the fabric.Canvas
        // Tells fabric.js to draw the Rects
        _drawRackRects: function () {
            if (this.rackRects.length) {
                this._scaleAndCenterRackRects();
                this._addRackRectsToCanvas();
            } else return;
        },
        
        // Generates all the objects and positioning data needed to draw the grid with fabric
        _setGridData: function () {
            if (!_.isNull(this.gridData) && this.gridData.lines.length) {
                this.gridData.lines.length = 0;
            }
            this.gridData = FabricUtility.createGridData({
                origin: this.model.getOriginPixelOffset(),
                width: this.fabricCanvas.getWidth(),
                height: this.fabricCanvas.getHeight(),
                spacing: this.model.getGridSpacing()
            });
        },

        // When the user edits racks on the canvas, we need to fire event handlers to log/verify the changes
        _setupEditCallbacks: function () {
            // snap to grid
            this.fabricCanvas.on('object:moving', function (event) {
                event.target.set({
                    left: Math.round(event.target.left / this.gridData.spacing) * this.gridData.spacing + this.gridData.gridOffset.left,
                    top: Math.round(event.target.top / this.gridData.spacing) * this.gridData.spacing + this.gridData.gridOffset.top
                });
            }.bind(this));
            
            // When the user is done rotating/scaling/moving a rack, this handler is called
            this.fabricCanvas.on('object:modified', this._onRackModified.bind(this));
        },
        
        _onRackModified: function (event) {
            this.model.addDirtyFabricObject(event.target);
        },
        
        // remove old grid, draw new one with updated grid spacing
        _redrawGrid: function (newGridSpacing) {
            if (newGridSpacing) {
                this.model.set('gridSize', newGridSpacing);
            }
            this._removeGrid();
            this._setGridData();
            this._drawGrid();
        },
        
        // Generate an array of horizontal and verticle lines based
        // on the origin of the floorplan.  Then draw the lines with fabric.js
        _drawGrid: function () {
            _.each(this.gridData.lines, function(gridLine) {
                this.fabricCanvas.add(gridLine);
                gridLine.sendToBack();
            }.bind(this));
        },
        
        _removeGrid: function() {
            _.each(this.gridData.lines, function(gridLine) {
                this.fabricCanvas.remove(gridLine);
            }.bind(this));
        },

        _addRackRectsToCanvas: function () {
            _.each(this.rackRects, function (rackRect) {
                this.fabricCanvas.add(rackRect);
                rackRect.bringToFront();
                rackRect.setCoords();
            }.bind(this));
        },

        // created a cloned group of rackrects, use the fabric.js API to generate a bounding box,
        // also do aspect ration comparisons to calculate scale factor.  Save both to the model.
        _setScaleFactorAndBoundingBox: function () {
            var scaleFactor;
            var rackGroup = this._createCloneGroupOfRackRects();
            var boundingBox = rackGroup.getBoundingRect();

            //calculate scale factor
            var canvasAspect = this.fabricCanvas.getHeight() / this.fabricCanvas.getWidth();
            var boundingBoxAspect = boundingBox.height / boundingBox.width;
            if (canvasAspect > boundingBoxAspect) {
                scaleFactor = (this.fabricCanvas.getWidth() * this.model.get('canvasPaddingScalar')) / boundingBox.width;
            } else {
                scaleFactor = (this.fabricCanvas.getHeight() * this.model.get('canvasPaddingScalar')) / boundingBox.height;
            }

            // These values are stored in the model so we can use them to scale and center other objects
            this.model.set('scaleFactor', scaleFactor);
            this.model.set('boundingBox', boundingBox);
            this.model.set('centerOfCanvas', this.fabricCanvas.getCenter());
        },
        
        // Use the difference between the center of the bounding box (in mm) and the center of the fabric.Canvas
        // to translate and scale all the fabric.Rects
        _scaleAndCenterRackRects: function () {
            var centerOfBoundingBox = this.model.get('boundingBoxCenter');

            if (!_.isNull(centerOfBoundingBox)) {
                var centerOfCanvas = this.model.get('centerOfCanvas');
                var scaleFactor = this.model.get('scaleFactor');
                
                _.each(this.rackRects, function(rackRect) {
                    var relativeCenterDiff = {
                        top: rackRect.getTop() - centerOfBoundingBox.top,
                        left: rackRect.getLeft() - centerOfBoundingBox.left
                    };
                    
                    rackRect.scale(scaleFactor);
                    rackRect.setTop(relativeCenterDiff.top * scaleFactor + centerOfCanvas.top);
                    rackRect.setLeft(relativeCenterDiff.left * scaleFactor + centerOfCanvas.left);
                    rackRect.setShadow(FabricUtility.getRackShadow(scaleFactor));
                    
                    // Always setCoords after scale to keep the fabric.Rect's coordinates updated
                    rackRect.setCoords();
                });
            }
        },

        // This function is used for creating a group of the rack fabric.Rects
        // if you created a group of the original fabric.Rects, all its coordinates
        // would be changed to be relative of the group.  This clone group is used to extract
        // the floorplan bounding box of the racks
        _createCloneGroupOfRackRects: function () {
            var clonedRackRects = _.map(this.rackRects, function (rackRect) {
                return rackRect.clone();
            });

            return new fabric.Group(clonedRackRects);
        },

        // This function sets up the events channel to keep the planview tool tip updated on hover over
        _setupRackEvents: function () {
            this.fabricCanvas.on('mouse:over', function (e) {
                this.rackViewChannel.vent.trigger('mouseoverRack', e.target.model);
            }.bind(this));
        },

        // UNDER CONSTRUCTION
        _toggleNames: function () {

        }
    });

    return FabricDataCenterView;
});