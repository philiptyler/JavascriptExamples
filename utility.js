define(['jsonpack', 'moment'], function(jsonpack, moment){
    'use strict';
    var Utility = {
        // Transform a snake case style `word-one` to a camel case style `wordOne`
        // base on // http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/
        snakeToCamelCase: function(string) {
            var CapCase = string.replace(/(\-[a-zA-Z])/g, function($1) {
                return $1.toUpperCase().replace('-', '');
            });
            return CapCase.substring(0,1).toLowerCase() + CapCase.substring(1);
        },

        // Transforms a snake case style to a "title" style case.
        // Example: "snake_case" becomes "Snake Case".
        snakeToTitle: function (string) {
            return _.reduce(string.split('_'), function (result, part, index) {
                if (index > 0) {
                    result = result + ' ';
                }
                return result + part.charAt(0).toUpperCase() + part.substring(1);
            }, '');
        },

        // Encodes json for use in the URI hash string.
        encodeForURI: function (obj) {
            var encodedString = encodeURIComponent(jsonpack.pack(obj));
            
            return encodedString;
        },

        // Decodes a string encoded by `encodeForURI()` into an object.
        decodeFromURI: function (encodedString) {
            var obj = jsonpack.unpack(decodeURIComponent(encodedString));

            return obj;
        },

        //  Converts a datetime to its equivalent in minutes from now
        dateTimeToMinutes: function(dateTime) {
            if (dateTime && dateTime.indexOf('/') !== -1) { // search for date format
                var now = moment();
                var durationAsDate = moment(dateTime, 'dd/mm/yy h:m');
                dateTime = durationAsDate.unix() - now.unix();
            }
            return dateTime;
        },

        formatTime: function(time) {
            var today = new Date(time);
            var dd = today.getDate();
            var mm = today.getMonth() + 1; //January is 0!
            var hr = today.getHours();
            var min = today.getMinutes();
            var yyyy = today.getFullYear();
            if (dd < 10) {
                dd = '0' + dd;
            }
            if (mm < 10) {
                mm = '0' + mm;
            }
            return dd + '/' + mm + '/' + yyyy + ' ' + hr + ':' + min;
        },

        // Returns true if the strings are the same. 
        stringEquals: function (string1, string2) {
            var bothArgsAreStrings = _.isString(string1) && _.isString(string2);
            if (!bothArgsAreStrings) {
                throw(new TypeError('stringEquals() expects two string arguments.'));
            }
            
            return string1.toUpperCase() === string2.toUpperCase();
        },

        // Creates a new Marionette region for a view and shows it.
        showView: function (view) {
            // Create a temporary element for the region.
            var $div = $('<div>');
            $('body').append($div);
            var region = new Marionette.Region({
                el: $div
            });

            // Listener to remove the region when the view is destroyed.
            view.on('destroy', function () {
                $div.remove();
            });

            region.show(view);
        },
        
        // Takes an array of attribute hashes of objects and creates
        // a .csv file where each row represents the attributes of a model
        parseObjectsToCsv: function(jsonObjects) {
            var dataString, csvContent = 'data:text/csv;charset=utf-8';
            var infoArray = [], keys = [];
            
            if (jsonObjects.length === 0 || _.isEmpty(jsonObjects[0])) {
                return null;
            }

            // Get all the keys of the first object
            keys = Object.keys(jsonObjects[0]);
            for (var index in keys) {
                if (jsonObjects[0].hasOwnProperty(keys[index])) {
                    // add keys to first row of csv file (column headers)
                    csvContent += ',' + keys[index];
                }
            }

            csvContent += '\n';
            
            // for each attribute object, collect all attribute values in the same
            // order by using the same list of keys
            _.each(jsonObjects, function (jsonObject) {
                infoArray.length = 0;
                for (var index = 0; index < keys.length; index++) {
                    if (jsonObject.hasOwnProperty(keys[index])) {
                        infoArray.push(jsonObject[keys[index]]);
                    } else {
                        // If the object does not have a value for keys[index], push a space char
                        // to maintain key column correctness
                        infoArray.push(' ');
                    }
                }

                // join all the attribute values with a comma for csv cell separation
                // \n for row separation
                dataString = infoArray.join(',');
                csvContent += dataString + '\n';
            });

            return csvContent;
        }
    };
    Object.freeze(Utility);
    return Utility;
});