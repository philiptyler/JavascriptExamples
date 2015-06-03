/* Summary:
 * this module represents a collection (or list) of to Do objects
 * This module receives the todos and loads them into the dom
 * with a Marionette.CollectionView.
 */

define(['dashboard/model/toDo'],
    function(ToDo) {
        'use strict';

        var ToDoCollection = Backbone.Collection.extend({
            model: ToDo,

            // Order ToDos by Their dueDate first
            // If the dueDates are the same or they have no dueDates, order by title
            comparator: function(model) {
                var sortByInt = 0;
                var dueDate = model.get('dueDate');
                if (dueDate !== null) {
                    //get the dueDate in milliseconds
                    sortByInt = dueDate.getTime();
                }
                //Add the ASCII code of the first letter of title to the date in milliseconds
                // to differentiate between todoItems with the same dueDate
                sortByInt += model.get('title').toLowerCase().charCodeAt(0);
                return sortByInt;
            },

            initialize: function(comparator) {
                // When a model is added to the collection, set an event
                // callback to listen to the new model's 'removeToDo' event.
                // if the event is triggered in todoview, remove model from collection
                //               this.listenTo(this, 'add', function (model, collection) {
                //                   collection.listenTo(model, 'removeToDo', function () {
                //                       collection.remove(model);
                //                   });
                //               });
                this.comparator = comparator;

                //this.listenTo(this, 'removeToDo', this.remove);
            },

            // Find all the models in the collection that have completed === true
            // Remove those models from the collection and return the models to be resorted
            removeCompleted: function() {
                var removedModels = this.where({
                    completed: true
                });
                this.remove(removedModels);
                return removedModels;
            },

            // Find all the models in the collection that have completed === false
            // Remove those models from the collection and return the models to be resorted
            removeNotCompleted: function() {
                var removedModels = this.where({
                    completed: false
                });
                this.remove(removedModels);
                return removedModels;
            }
        });

        return ToDoCollection;
    });