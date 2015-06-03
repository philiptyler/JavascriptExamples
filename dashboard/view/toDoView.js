/* Summary:
 * This view renders one ToDoCollection Item in the toDoListView
 * This view also handles user interface
 */

define(['text!dashboard/template/toDo.html'],
    function(ToDoTemplate) {
        'use strict';

        var ToDoView = Marionette.ItemView.extend({
            template: _.template(ToDoTemplate),

            ui: {
                destroy: '.removeToDo',
                checkbox: 'i'
            },

            events: {
                'click .removeToDo': 'removeToDo',
                'dblclick .toDoTitle': 'triggerEditDialog',
            },

            //When a ToDoView's checkbox is clicked,
            // the checkbox should change to show a checkmark or
            // change back to an empty box
            toggleCompleted: function() {
                if (this.model.get('completed')) {
                    this.model.set('completed', false);
                    this.ui.checkbox.switchClass('fa-check-square', 'fa-square-o');
                } else {
                    this.model.set('completed', true);
                    this.ui.checkbox.switchClass('fa-square-o', 'fa-check-square');
                }
            },

            //When a ToDoView's 'X' is clicked, tell the server to delete
            // the ToDoItem and trigger and event so the collection will
            // remove the ToDoView from the DOM on server success.
            removeToDo: function() {
                this.model.trigger('removeToDo', this.model);
            },

            //IF the toDoItem is already completed, change its checkbox
            // icon, then add the tooltip to the ToDoView
            onRender: function() {
                this.setCheckbox();
                this.setToolTip();
            },

            //If the model (todoItem) has either a valid dueDate, description or taskSequence then
            // create a tooltip.
            setToolTip: function() {
                this.listenTo(this.model, 'removeTooltip', this.removeToolTip.bind(this));
                if (this.model.get('dueDate') !== null || this.model.get('description') !== '' || this.model.get('taskSequence') !== '') {
                    this.$el.qtip({
                        content: {
                            text: this.$('.toDoItemWrapper').next('div')
                        },
                        position: {
                            my: 'right center',
                            at: 'left center',
                            container: $('#toDoTooltips')
                        },
                        style: {
                            widget: true
                        },
                        // Hides all other tooltips when this tooltip appears
                        show: {
                            solo: true
                        },
                        // fixed/delay keeps the tooltip on the screen so the user can click the Task link or copy text
                        hide: {
                            fixed: true,
                            delay: 500
                        }
                    });
                }
            },

            removeToolTip: function() {
                this.$el.qtip('destroy', true);
            },

            // trigger parent view to open edit dialog
            triggerEditDialog: function() {
                this.model.trigger('openEditDialog', this.model);
            },

            // Changes the checkbox icon to either an empty square or a checkmark depending on the model data
            setCheckbox: function() {
                if (this.model.get('completed')) {
                    this.ui.checkbox.switchClass('fa-square-o', 'fa-check-square');
                }
            },

            // Removes all click event callbacks from the todoview's checkbox
            offCheckboxClick: function() {
                this.ui.checkbox.off('click');
                this.ui.checkbox.toggleClass('disabled');
            },

            // Sets a click callback handler
            onCheckboxClick: function() {
                this.ui.checkbox.on('click', this.toggleCompleted.bind(this));
                this.ui.checkbox.toggleClass('disabled');
            }
        });

        return ToDoView;
    });