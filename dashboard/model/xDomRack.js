define([
    'dashboard/enum/colorOptions',
    'dashboard/enum/heightOptions',
    'dashboard/enum/hexValues',
    'dashboard/utility'
], function (ColorOptions, HeightOptions, HexValues, Utility) {
    'use strict';

    var Rack = Backbone.Model.extend({
        defaults: function () {
            return {
                name: '',
                // DO NOT SET A DEFAULT FOR componentID.  IT WILL MESS UP TESTS
                // BECAUSE IT IS THE IDATTRIBUTE OF XDOMRACK OBJECTS!!
                //componentID: 0,

                // These three properties will position the rack
                floorPlanX: 0,
                floorPlanY: 0,
                // Used to keep the rack to the grid
                adjustedZPosition: 0,

                // These are the dimensions of the rack
                floorPlanWidth: 0,
                floorPlanHeight: 0,
                floorPlanDepth: 0,
                rackUnitHeight: 0,
                rackOrientation: 0,

                powerCurrent: 0,
                powerPlanned: 0,
                powerMax: 0,
                powerActual: -1,
                powerActualDerivation: -1,

                // Heat is based off of power. Watts to BTU's
                heatCurrent: 0,
                heatPlanned: 0,
                coolingMax: 0,

                weightCurrent: 0,
                weightPlanned: 0,
                weightMax: 0,

                largestUnitLocation: 0,
                largestUnitSize: 0,
                usedUnitsCurrent: 0,
                usedUnitsPlanned: 0,

                // View dependent properties
                // Properties that do not need to be saved on the server but are needed on the views
                rackColor: '',
                renderName: false,

                // This array contains objects with three properties:
                // attributeName: (The name of the rack property tied to a threhold)
                // criticalAlertsCount: (The number of open critical alerts associated with this rack and attribute)
                // warningAlertsCount: (The number of open warning alerts associated with this rack and attribute)
                alertAttributes: [],
                totalCriticalAlerts: 0,
                totalWarningAlerts: 0,
                criticalAlerts: 0,
                warningAlerts: 0
            };
        },

        idAttribute: 'componentID',
        _roundingAmount: 2,

        /* MARIONETTE FUNCTIONS */
        /************************/

        parse: function(jsonModel) {
            // Convert from power to heat Watts to BTU'
            if (_.isNumber(jsonModel.powerCurrent) && _.isNumber(jsonModel.powerPlanned)) {
                jsonModel.heatCurrent = jsonModel.powerCurrent * 3.412141633;
                jsonModel.heatPlanned = jsonModel.powerPlanned * 3.412141633;
            }

            // Scale down the floorPlan width and height
            jsonModel.floorPlanX /= 1000;
            jsonModel.floorPlanY /= 1000;
            jsonModel.floorPlanWidth /= 1000;
            jsonModel.floorPlanHeight /= 1000;

            if (_.isNumber(jsonModel.totalCriticalAlerts) && _.isNumber(jsonModel.totalWarningAlerts)) {
                jsonModel.criticalAlerts = jsonModel.totalCriticalAlerts;
                jsonModel.warningAlerts = jsonModel.totalWarningAlerts;
            }

            return jsonModel;
        },

        /* PUBLIC FUNCTIONS */
        /********************/
        
        // This function is called by xDomRacks.js in the success callback of refresh()
        // Pluck the attribute property strings from the alertAttributes array so the model knows
        //   the rack properties it has thresholds/alerts for
        // round some of the attributes for readability and update the color
        adjustProperties: function (heightOption, propertyName) {
            this.validRackAttributes = _.pluck(this.get('alertAttributes'), 'attributeName');

            // Was put in to round a very long value in the loadSmall function
            // Might need to Round other model data if they have long values too
            this.set({
                weightCurrent: this._round(this.get('weightCurrent')),
                powerCurrent: this._round(this.get('powerCurrent')),
                powerPlanned: this._round(this.get('powerPlanned')),
                floorPlanDepth: this.getHeight(heightOption)
            });

            this.setColorByProperty(propertyName);
        },

        // If the property name is in this.validAttributes, then the user is subscribed
        // to a threshold for that property.
        hasThresholdForProperty: function (propertyName) {
            return !_.isUndefined(_.find(this.validRackAttributes, function(attributeName) {
                return propertyName === attributeName;
            }));
        },

        // returns the # of open critical alerts for this rack/rackProperty that the user has 
        getCriticalAlerts: function (propertyName) {
            if (propertyName === 'all') {
                return this.get('totalCriticalAlerts');
            } else if (this.hasThresholdForProperty(propertyName)) {
                return _.find(this.get('alertAttributes'), function (alertAttribute) {
                    return alertAttribute.attributeName === propertyName;
                }).criticalAlertsCount;
            } else {
                return -1;
            }
        },

        // returns the # of open warning alerts for this rack/rackProperty that the user has 
        getWarningAlerts: function (propertyName) {
            if (propertyName === 'all') {
                return this.get('totalWarningAlerts');
            } else if (this.hasThresholdForProperty(propertyName)) {
                return _.find(this.get('alertAttributes'), function (alertAttribute) {
                    return alertAttribute.attributeName === propertyName;
                }).warningAlertsCount;
            } else {
                return -1;
            }
        },
        
        getLeftOffset: function() {
            return this.get('floorPlanX') - this.get('floorPlanWidth') / 2.0;
        },
        
        getTopOffset: function() {
            return -1 * this.get('floorPlanY') - this.get('floorPlanHeight') / 2.0;
        },

        // updates the shown alert counts and sets the new color
        // GET COLOR MUST BE CALLED AFTER SETALERTCOUNTS
        setColorByProperty: function (propertyName) {
            this.setAlertCounts(propertyName);
            this.set('rackColor', this.getColor());
        },
        
        setAlertCounts: function (propertyName) {
            this.set('criticalAlerts', this.getCriticalAlerts(propertyName));
            this.set('warningAlerts', this.getWarningAlerts(propertyName));
        },

        // returns a hex value color depending on the alert counts the rack has
        getColor: function () {
            var criticalAlertsCount = this.get('criticalAlerts');
            if (criticalAlertsCount === 0) {
                var warningAlertsCount = this.get('warningAlerts');
                if (warningAlertsCount === 0) {
                    return HexValues.Normal;
                } else {
                    return HexValues.Warning;
                }
            } else if (criticalAlertsCount > 0) {
                return HexValues.Critical;
            } else {
                return HexValues.Invalid;
            }
        },

        setHeight: function (heightOption) {
            this.set('floorPlanDepth', this.getHeight(heightOption));
        },

        getHeight: function (heightOption) {
            switch (heightOption) {
                case HeightOptions.RackUnit:
                    // Multiplying the rackUnitHeight by .0445 will turn it into mm
                    return this.get('rackUnitHeight') * 0.0445;
                case HeightOptions.Minimized:
                    return 0.1;
                default:
                    throw new Error('This heightOption has not been set up');
            }
        },

        /* PRIVATE FUNCTIONS */
        /*********************/

        // Utility function
        _round: function (value) {
            var partialRound = _.partialRight(Utility.roundTo, this._roundingAmount);
            return partialRound(value);
        }
    });

    return Rack;
});