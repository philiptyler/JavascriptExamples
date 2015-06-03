define(['dashboard/model/xDomRack',
    'dashboard/enum/heightOptions'],
    function (Rack, HeightOptions) {
        'use strict';

        var Racks = Backbone.Collection.extend({
            model: Rack,

            // <0 if all models received from the server were INVALID for 3D rendering (where x = number of models received from server)
            // =0 DEFAULT, or if all models received from the server were VALID for 3D rendering
            // >0 if some models were valid from 3D rendering (where x is the number of invalid models)
            rackWarningsCount: 0,

            colorByProperty: 'all',
            heightOption: HeightOptions.RackUnit,
            allRackAlerts: null,

            /* MARIONETTE FUNCTIONS */
            /************************/

            initialize: function () {
                this.allRackAlerts = [];
            },

            // Takes the array of data calls parse on each individual piece
            parse: function (models) {
                var filteredModels = _.filter(models, this.can3DRender.bind(this));
                if (filteredModels.length === 0) {
                    this.rackWarningsCount = 0 - models.length;
                    return filteredModels;
                }

                var parsedModels = _.map(filteredModels, Rack.prototype.parse);
                if (parsedModels.length === 0) {
                    // No valid models in the collection after parse
                    this.rackWarningsCount = parsedModels.length - models.length;
                } else {
                    this.rackWarningsCount = models.length - parsedModels.length;
                }

                return parsedModels;
            },

            /* PUBLIC FUNCTIONS */
            /********************/

            // Calls server with the widgets data center ID and
            // gets all the rack info objects for the racks stored in
            // the DB.
            refresh: function (componentID, options) {
                var self = this;
                return $.ajax({
                    type: 'GET',
                    url: '/csweb/PlanView/GetRackInfosByComponentID',
                    data: {
                        componentID: componentID,
                        includeThresholdProperties: !!options.includeAlerts
                    },
                    success: function (response) {
                        if (response.success) {
                            
                            if (response.warnings.length) {
                                // These warnings occurr because componentID does not
                                // reference a component that is a DC or is in a DC
                                self.trigger('serverWarning', response.warnings);
                                self.trigger('racksLoaded', -1);
                            } else {
                                var dataCenterChange = self.dataCenterID !== response.data.dataCenterID;

                                // ONLY CREATE NEW MODELS ON FIRST DATA REFRESH
                                // If a new model is added to the collection that was NOT
                                // in the first refresh packet it will not be rendered on the 
                                // canvas correctly
                                self.set(self.parse(response.data.racks), { add: dataCenterChange, remove: dataCenterChange });
                                self.invoke('adjustProperties', self.heightOption, self.colorByProperty);

                                // If the model's don't exist before response trigger
                                if (dataCenterChange) {
                                    self.trigger('racksLoaded', self.rackWarningsCount, response.data.dataCenterID);
                                }

                                // need to call this after triggering racksLoaded because the
                                // attributes selectView will not be built until after the racksloadedhandle
                                self.getAllRackAlerts();
                            }

                        } else {
                            //The View listens for these error events
                            // and renders alertify errors
                            self.trigger('serverError', response.errors);
                        }
                    },
                    error: function (error) {
                        self.trigger('ajaxError', error);
                    }
                });
            },

            // If the collection is not centered within the scene
            // update the x and y positions so that it will be centered.
            // Also if the model are different heights some models will float.
            // In order to correct that also set the zPosition
            updateRackPositions: function (offsetX, offsetY, maxHeight) {
                if (arguments.length !== 3) {
                    throw (new Error('updateRackPositions must have three arguments'));
                }
                this.each(function (model) {
                    model.set('floorPlanX', model.get('floorPlanX') + offsetX);
                    model.set('floorPlanY', model.get('floorPlanY') + offsetY);
                    // Even out the racks so that they are all resting on the grid
                    // Take the difference of maxHeight and modelHeight divide by 2 and multiply by -1
                    model.set('adjustedZPosition', -(maxHeight - model.get('floorPlanDepth')) / 2);
                });
            },

            setRackColors: function (colorByProperty) {
                this.colorByProperty = colorByProperty;
                this.invoke('setColorByProperty', colorByProperty);
            },

            setRackHeights: function (heightOption) {
                this.heightOption = heightOption;
                this.invoke('setHeight', heightOption);
            },
            
            getAllRackAlerts: function () {
                var allRackAlerts = { 'all': { warning: 0, critical: 0 } };
                this.each(this._addRackAlerts, allRackAlerts);
                this.trigger('alertAttributesLoaded', allRackAlerts);
            },

            /* PRIVATE FUNCTIONS */
            /*********************/

            // ONLY USE THIS FUNCTiON VIA getAllRackAlerts
            _addRackAlerts: function (rack) {
                this.all.warning += rack.get('totalWarningAlerts');
                this.all.critical += rack.get('totalCriticalAlerts');
                _.each(rack.get('alertAttributes'), function (alertAttribute) {
                    if (_.isUndefined(this[alertAttribute.attributeName])) {
                        this[alertAttribute.attributeName] = { warning: 0, critical: 0 };
                    }
                    var alertCounts = this[alertAttribute.attributeName];
                    alertCounts.warning += alertAttribute.warningAlertsCount;
                    alertCounts.critical += alertAttribute.criticalAlertsCount;
                }.bind(this));
            },

            // Determines if a JSON rack received from the server has enough valid
            // parameters to render it in 3D.
            can3DRender: function (rack) {
                if (!_.isUndefined(rack.attributes)) {
                    rack = rack.toJSON();
                }

                return rack.name.indexOf('Tile') === -1 &&
                    _.isNumber(rack.floorPlanX) && _.isNumber(rack.floorPlanY) &&
                    _.isNumber(rack.floorPlanWidth) && rack.floorPlanWidth > 0 &&
                    _.isNumber(rack.floorPlanHeight) && rack.floorPlanHeight > 0 &&
                    _.isNumber(rack.rackUnitHeight) && rack.rackUnitHeight > 0;
            }
        });

        return Racks;
    }
);