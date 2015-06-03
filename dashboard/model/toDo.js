/* Summary:
 * this model represents one to Do list object used in the toDoList collection module
 * Anytime the user create or edits a to do object, the object is sent to the server where it's
 * DB column is added or updated
 */

define(function () {
    "use strict";

    var ToDo = Backbone.Model.extend({
        //Default values for a To Do Model
        //If a ToDoList has no To Dos, one default will be loaded into the DOM
        defaults: {
            dueDate: null,
            title: "Nothing To Do..",
            description: "Click the plus icon to add ToDos",
            completed: false,
            id: -1,
            taskID: -1,
            taskSequence: ""
        }
    });

    return ToDo;
});