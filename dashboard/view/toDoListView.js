/* Summary:
 * This View renders the header for a specific toDoList such as the 'Past Due' list
 * Under each header is a collection view of the corresponding toDoItems
 * each list can be minimized to just the header
 */

define([
    'text!dashboard/template/toDoList.html',
    'dashboard/view/toDoView'
], function(ToDoListTemplate, ToDoView) {

    var ToDoListView = Marionette.CompositeView.extend({

        childView: ToDoView,

        template: _.template(ToDoListTemplate),

        childViewContainer: '.toDoCollection',

        ui: {
            toDos: '.toDoCollection',
            caret: 'i',
            title: '.toDoListHeader > h3'
        },

        caretDown: 'fa-caret-down',
        caretLeft: 'fa-caret-left',

        events: {
            'click .toDoListHeader': 'toggleListVisibility'
        },

        // When a new ToDoListView is created, create a model for it
        // only containing the title (for serializeData function)
        initialize: function(options) {
            this.title = options.title;
            this.listenTo(this.collection, 'remove add', this.setTitle);
            this.listenTo(this.collection, 'openEditDialog', this.triggerOpenEditDialog);
        },

        // The current version of Marionette used in CS-Web does not support
        // sorted collections: https://github.com/marionettejs/backbone.marionette/wiki/Adding-support-for-sorted-collections
        appendHtml: function(collectionView, childView, index) {
            if (collectionView.isBuffering) {
                collectionView._bufferedChildren.push(childView);
            }

            var childrenContainer = collectionView.isBuffering ? $(collectionView.elBuffer) : this.getChildViewContainer(collectionView);
            var children = childrenContainer.children();
            if (children.size() <= index) {
                childrenContainer.append(childView.el);
            } else {
                children.eq(index).before(childView.el);
            }
        },

        // After the list is rendered to the screen, set the list color,
        // set the caretIcons expanded data field.
        onRender: function() {
            this.$el.addClass('toDoCollectionWrapper');
            this.ui.caret.data('expanded', true);
            this.setTitle();
        },

        triggerOpenEditDialog: function(data) {
            this.trigger('openEditDialog', data, this);
        },

        setTitle: function() {
            this.ui.title.text(this.title + ' (' + this.collection.length + ')');
        },

        // turn on the 'click' event handlers for the Todos' checkboxes
        turnOnCheckboxes: function() {
            this.children.each(function(item) {
                item.onCheckboxClick();
            });
        },

        // turn off the 'click' event handlers for the Todos' checkboxes
        turnOffCheckboxes: function() {
            this.children.each(function(item) {
                item.offCheckboxClick();
            });
        },

        // When a list header is clicked, it should animate hiding
        // the collection view and rotating the caret icon.  If it's clicked
        // again, reverse
        toggleListVisibility: function() {
            var isExpanded = this.ui.caret.data('expanded');

            if (isExpanded) {
                this.ui.caret.data('expanded', false);
                this.ui.caret.switchClass(this.caretDown, this.caretLeft, 200);
                this.collapseToDoCollection();
            } else {
                this.ui.caret.switchClass(this.caretLeft, this.caretDown, 200);
                this.expandToDoCollection(function() {
                    this.ui.caret.data('expanded', true);
                    this.ui.toDos.css('height', '');
                }.bind(this));
            }
        },

        //This function hides the collection view
        collapseToDoCollection: function() {
            var currentHeight = this.ui.toDos.height();
            var heightStyle = $.trim(this.ui.toDos[0].style.height);
            if (heightStyle === '' || heightStyle === 'auto') {
                this.ui.toDos.height(currentHeight);
            }

            this.ui.toDos.data('oldheight', currentHeight);

            this.ui.toDos.animate({
                height: 0,
                opacity: 0
            }, 200, function() {
                this.ui.toDos.hide();
            }.bind(this));
        },

        //This function re-shows the collection view
        expandToDoCollection: function(onComplete) {
            var toDos = this.ui.toDos;

            this.ui.toDos.show().animate({
                height: toDos.data('oldheight'),
                opacity: 1
            }, 200, onComplete);

        },

    });

    return ToDoListView;
});