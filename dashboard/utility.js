// Creates a Utility object that contains some utility functions

define(function() {
    'use strict';
    var Utility = {
        // Should probably use a different library Math.js
        // Can round to a certain placement
        roundTo: function(number, amount) {
            if (_.isNull(amount) || _.isUndefined(amount)) {
                amount = 0;
            }
            return Math.round(number * Math.pow(10, amount)) / Math.pow(10, amount);
        }
    };

    return Utility;
});