/* Summary:
 * This view is the top layer for the toDoApp within the dashboard.
 * It draws the to do controls such as the add button, date, title and borders
 * It also renders all six to do lists within it
 */

define(['alertify',
        'text!dashboard/template/toDoWidget.html',
        'dashboard/model/addToDoDialogOptions',
        'dashboard/model/editToDoDialogOptions',
        'common/model/dialogManager',
        'dashboard/view/toDoListView',
        'dashboard/view/toDoActionView'
    ],

    function(Alertify, ToDoWidgetTemplate, AddDialogOptions, EditDialogOptions, DialogManager, ToDoListView, ActionButtonView) {
        'use strict';

        var ToDoWidgetView = Backbone.View.extend({
            template: _.template(ToDoWidgetTemplate),
            el: $('#toDoWidgetContainer'),

            events: {
                'click #toDoTitle': 'toggleTriggerAndList'
            },

            // Create all the views, passing them a list title, a collection
            // and classNames for styling
            initialize: function() {
                this.pastDueView = new ToDoListView({
                    title: 'Past Due',
                    collection: this.model.pastDueList,
                    className: 'pastDueToDo'
                });
                this.todayView = new ToDoListView({
                    title: 'Today',
                    collection: this.model.todayList,
                    className: 'todayToDo'
                });
                this.tomorrowView = new ToDoListView({
                    title: 'Tomorrow',
                    collection: this.model.tomorrowList
                });
                this.upcomingView = new ToDoListView({
                    title: 'Upcoming',
                    collection: this.model.upcomingList
                });
                this.noDateView = new ToDoListView({
                    title: 'Not Scheduled',
                    collection: this.model.noDateList,
                    className: 'noDateToDo'
                });
                this.completedView = new ToDoListView({
                    title: 'Completed',
                    collection: this.model.completedList,
                    className: 'noDateToDo'
                });

                this.views = [this.pastDueView, this.todayView, this.tomorrowView, this.upcomingView, this.noDateView, this.completedView];
                this.views.forEach(function(view) {
                    this.listenTo(view, 'openEditDialog', this.openEditDialog);
                }.bind(this));
                this.markingCompleted = false;
                this.listenTo(this.model, 'markCompletedSuccess', function(numberMarkedCompleted) {
                    Alertify.success('Marked ' + numberMarkedCompleted + ' Todos completed');
                });
            },

            // When the MarkToDosComplete option is clicked, show/hide the todoview checkboxes
            markToDosComplete: function() {
                this.views.forEach(function(view) {
                    view.turnOnCheckboxes();
                });
                this.model.collectChangeCompletedIds();
                Alertify.warn('You must select \' Apply Changes \'\nto finish marking Todos completed');
            },

            // When the Apply Changes option is clicked, send modified TODOITEM ids to server
            applyMarkComplete: function() {
                this.views.forEach(function(view) {
                    view.turnOffCheckboxes();
                });
                this.model.sendMarkCompletedIds();
            },

            // When the ToDoWidget recieves an error on an AJAX request it will trigger one of the two
            // following events, the view will show an error alertify message
            bindModelEvents: function() {
                this.listenTo(this.model, 'ajaxError', function(error) {
                    console.error(error);
                    var errorMessage = 'An issue was encountered while retrieving To Dos';
                    Alertify.error(errorMessage);
                });
                this.listenTo(this.model, 'serverError', function(errors) {
                    Alertify.error(errors);
                });
            },

            // Overwrite of the usual render function that appends all the Composite views to the correct div
            render: function() {
                this.$el.html(this.template(this.model.toJSON()));
                var toDoLists = this.$el.find('#toDoLists');
                this.setupActionButton();

                this.views.forEach(function(view) {
                    toDoLists.append(view.render().el);
                });

                this.trigger = $('#todo-trigger');
                this.trigger.click(this.toggleTriggerAndList.bind(this));

                return this;
            },

            setupActionButton: function() {
                this.actionButtonView = new ActionButtonView({
                    el: this.$('#actionButton')
                });
                this.actionButtonView.render();
                this.actionButtonView.on('addToDo', this.openAddDialog.bind(this));
                this.actionButtonView.on('markToDosComplete', this.markToDosComplete.bind(this));
                this.actionButtonView.on('applyChanges', this.applyMarkComplete.bind(this));
            },

            // Hide the trigger div and show the ToDoWidget and vice-versa
            toggleTriggerAndList: function() {
                this.trigger.toggle('fast');
                this.$el.toggle('fast');
            },

            // Build the Add dialog with the addDialogOptions module
            openAddDialog: function() {
                this.addDialog = DialogManager.buildAndOpenDialog(new AddDialogOptions());
                this.setDialogDateEvents(this.addDialog);
                this.addDialog.on('applyChangesSuccess', this.handleAddDialogResponse.bind(this));
            },

            handleAddDialogResponse: function(e, response) {
                this.model.addToDoFromServer(response);
                Alertify.success(response.title + ' Todo created');
            },

            // Build the edit dialog
            openEditDialog: function(model, listView) {
                this.editDialog = DialogManager.buildAndOpenDialog(new EditDialogOptions(model.get('id')));
                this.setDialogDateEvents(this.editDialog);

                //Need to use anonymous function here to operate on listView
                this.editDialog.on('applyChangesSuccess', function(e, response) {
                    Alertify.success('Changes to ' + response.title + ' saved');
                    listView.collection.remove(model);
                    this.model.addToDoFromServer(response);
                }.bind(this));
            },

            // In order for the server to parse the dueDate field correclty it must be in the standardized text
            // format of dd-mm-yy ex: 31-08-2014 but we'd like to display the date to the user as 31 August 2014
            // If theres an error on the server we must revert the date field back to the readable format
            setDialogDateEvents: function(dialog) {
                dialog.on('dialogOK', function() {
                    var dateContainer = dialog.find('.dateContainer > input');
                    dialog.oldDateValue = dateContainer.val();
                    if (dialog.oldDateValue !== '') {
                        dateContainer.val($.datepicker.formatDate('dd-mm-yy', new Date(dateContainer.val())));
                    }
                });
                dialog.on('serverResponseError', function() {
                    var dateContainer = dialog.find('.dateContainer > input');
                    dateContainer.val(dialog.oldDateValue);
                });
            }
        });

        return ToDoWidgetView;
    });