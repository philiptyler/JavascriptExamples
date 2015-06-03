/* Summary:
 * this model is the parent model of 5 toDoList collections.
 * It fetches all ToDos for a user from the server then sorts them
 * into 5 lists based on the dueDates of the toDos
 */

define(['dashboard/collection/toDoCollection'],
    function(ToDoCollection) {
        'use strict';

        var ToDoWidget = Backbone.Model.extend({

            //Instantiate 6 collections and get data from server
            initialize: function() {
                this.allToDos = new ToDoCollection();
                this.pastDueList = new ToDoCollection();
                this.todayList = new ToDoCollection();
                this.tomorrowList = new ToDoCollection();
                this.upcomingList = new ToDoCollection();
                this.noDateList = new ToDoCollection();
                this.completedList = new ToDoCollection();

                // Atempted to pass { comparator: 'title' } to the constructor but got a lodash error..
                this.completedList.comparator = 'title';

                this.refreshToDoLists();
                this.markCompletedIds = [];
                this.collections = [this.pastDueList, this.todayList, this.tomorrowList,
                    this.upcomingList, this.noDateList, this.completedList
                ];

                // This event listener is for when the user is marking todoitems complete
                this.collections.forEach(function(collection) {
                    this.listenTo(collection, 'removeToDo', function(model) {
                        this.removeToDo(model, collection);
                    }.bind(this));
                    this.listenTo(collection, 'change:completed', this.toggleInMarkCompletedIds.bind(this));
                }.bind(this));
            },

            //AJAX request to server to retrieve all ToDoItems and sort them
            refreshToDoLists: function() {
                var self = this;
                $.ajax({
                    type: 'GET',
                    url: '../Dashboard/GetToDos',
                    success: function(response) {
                        if (response.success) {
                            self.setToDoLists(response.data);
                        } else {
                            //The ToDoWidgetView listens for these error events
                            // and renders alertify errors
                            self.trigger("serverError", response.errors);
                        }
                    },
                    error: function(error) {
                        self.trigger("ajaxError", error);
                    }
                });
            },

            // Tells server to remove this ToDoItem from the DB
            // On success, remove from its collection and remove its tooltip
            removeToDo: function(model, collection) {
                var self = this;
                $.ajax({
                    type: 'POST',
                    url: '../Dashboard/DeleteToDo',
                    data: {
                        toDoItemID: model.get('id')
                    },
                    success: function(response) {
                        if (response.success) {
                            model.trigger('removeTooltip', model);
                            collection.remove(model);
                            self.allToDos.remove(model);
                        } else {
                            //The ToDoWidgetView listens for these error events
                            // and renders alertify errors
                            self.trigger("serverError", response.errors);
                        }
                    },
                    error: function(error) {
                        self.trigger("ajaxError", error);
                    }
                });
            },

            //Reset the array when a user begins to start marking
            // todos as complete
            collectChangeCompletedIds: function() {
                this.markCompletedIds.length = 0;
            },

            //Since complete is a boolean, adding an ID to the list
            // means its value is different from the server, but if the same
            // ID is added again its client-side value is now the same as on
            // the server.
            toggleInMarkCompletedIds: function(model) {
                var id = model.get('id');
                var idIndex = this.markCompletedIds.indexOf(id);

                if (idIndex !== -1) {
                    this.markCompletedIds.splice(idIndex, 1);
                } else {
                    this.markCompletedIds.push(id);
                }
            },

            // Send list of ToDoItem IDs to the server
            // The Dashboard controller will load the associated ToDoItems and toggle their 'completed' bool
            // On success, resort the modified ToDoItems and trigger the View to Show an alertify div
            sendMarkCompletedIds: function() {
                if (this.markCompletedIds.length) {
                    var self = this;

                    jQuery.ajaxSettings.traditional = true;
                    $.ajax({
                        type: 'POST',
                        url: '../Dashboard/MarkToDosCompleted',
                        data: {
                            toDoItemIDs: this.markCompletedIds
                        },
                        success: function(response) {
                            if (response.success) {
                                self.moveCompletedToDos();
                                self.trigger("markCompletedSuccess", self.markCompletedIds.length);
                            } else {
                                //The ToDoWidgetView listens for these error events
                                // and renders alertify errors
                                self.trigger("serverError", response.errors);
                            }
                        },
                        error: function(error) {
                            self.trigger("ajaxError", error);
                        }
                    });
                }
            },

            // After the server has responded from the MarkToDosComplete we must move the changed ToDoModels around
            // so the completed ToDoModels are in the completed list.
            moveCompletedToDos: function() {
                var notSortedCorrectly = this.completedList.removeNotCompleted();

                // length-1 so loop doesnt run on the completedList
                for (var collectionIndex = 0; collectionIndex < this.collections.length - 1; collectionIndex++) {
                    notSortedCorrectly = notSortedCorrectly.concat(this.collections[collectionIndex].removeCompleted());
                }

                notSortedCorrectly.forEach(this.sortToDo.bind(this));
            },

            //Sort all todoItems received from the server
            setToDoLists: function(toDoListFromServer) {
                this.toDoListFromServer = toDoListFromServer;
                this.emptyToDoCollections();
                this.setToday();

                // Add the JSON ToDoItem to the allToDosCollection
                // so backbone will create a toDoModel from the JSON.
                // Then sort that ToDoModel
                toDoListFromServer.forEach(function(toDo) {
                    if (toDo.dueDate !== null) {
                        toDo.dueDate = new Date(toDo.dueDate);
                    }
                    this.allToDos.add(toDo);
                }.bind(this));

                this.allToDos.forEach(function(toDo) {
                    this.sortToDo(toDo);
                }.bind(this));
            },

            addToDoFromServer: function(toDo) {
                this.setToday();
                if (toDo.dueDate !== null && toDo.dueDate !== "") {
                    toDo.dueDate = new Date(toDo.dueDate);
                }
                this.allToDos.remove(toDo.id);
                this.allToDos.add(toDo);
                this.sortToDo(this.allToDos.get(toDo.id));
            },

            // This function puts a ToDoItem from the server into the correct collection
            // Because the toDoParemeter is JSON the collection will automatically covert it to a model
            sortToDo: function(toDo) {
                var dueDate = toDo.get('dueDate');
                if (toDo.get('completed') === true) {
                    this.completedList.add(toDo);
                } else if (dueDate === null || _.isUndefined(dueDate)) {
                    this.noDateList.add(toDo);
                } else if (dueDate.getTime() < this.todayTime) {
                    this.pastDueList.add(toDo);
                } else if (dueDate.getTime() === this.todayTime) {
                    this.todayList.add(toDo);
                } else if (dueDate.getTime() === this.tomorrowTime) {
                    this.tomorrowList.add(toDo);
                } else {
                    this.upcomingList.add(toDo);
                }
            },

            // reseting a collection empties all items from it
            emptyToDoCollections: function() {
                this.allToDos.reset();
                this.collections.forEach(function(collection) {
                    collection.reset();
                });
            },

            //find current date in user's browser.
            //TODO Move to Helpers object
            setToday: function() {
                //Get current date and time
                var today = new Date();
                // 24 hr * 60 min/hr * 60 sec/min * 1000 ms/sec = one day in milliseconds
                var oneDayMilli = (24 * 60 * 60 * 1000);
                //create new date object without time
                today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                this.todayTime = today.getTime();
                this.tomorrowTime = today.getTime() + oneDayMilli;
            }

        });

        return ToDoWidget;
    });