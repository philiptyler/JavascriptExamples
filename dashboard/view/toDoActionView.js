/* Summary:
 * This view controls the user interaction of the Action Button
 * once clicked, a menu appears with options to edit the toDoList data
 * each selection triggers an event.  The ToDoWidgetView listens to the
 * events and responds. */

define(['text!dashboard/template/actionButton.html'],
    function(actionButtonTemplate) {
        'use strict';

        var ActionButtonView = Backbone.View.extend({
            template: _.template(actionButtonTemplate),

            events: {
                'click #toDoActionButton': 'toggleMenu',
                'click #toDoActionMenu div': 'triggerOption'
            },

            initialize: function() {},

            render: function() {
                this.$el.html(this.template());
                this.button = this.$('#toDoActionButton').button();
                this.setupMenu();
            },

            setupMenu: function() {
                this.menu = this.$('#toDoActionMenu');
                this.addOption = this.$('#addToDo');
                this.markOption = this.$('#markToDosComplete');
                this.applyOption = this.$('#applyChanges');
            },

            toggleMenu: function() {
                this.menu.toggleClass('hidden');
            },

            toggleDisabledOptions: function($target) {
                if (!($target.is(this.addOption))) {
                    this.markOption.children().toggleClass('disabled');
                    this.applyOption.children().toggleClass('disabled');
                }
            },

            triggerOption: function(eventObject) {
                var $target = $(eventObject.currentTarget);
                if (!($target.children().hasClass('disabled'))) {
                    this.toggleMenu();
                    this.toggleDisabledOptions($target);
                    this.trigger($target.attr('id'));
                }
            }

        });

        return ActionButtonView;
    });