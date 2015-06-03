/* Summary
* This function returns a set of parameters used by the dialog manager
* to create the specific Edit ToDoItem dialog in the CS-Web dashboard
*/

define(function () {
    'use strict';

    var EditToDoDialogOptions = Backbone.Model.extend({
        defaults: {
            jqueryDialogOptions: {
                title: 'Edit Todo',
                width: '380px',
                okButtonText: "Save"
            },

            buildDialogOptions: {
                dialogId: "ToDoDialogContainer",
                controllerActionUrl: '../Dashboard/UpdateToDo',
                isDownload: false,
                isUpload: false
            },

            openDialogOptions: {
                loadUrl: '../Dashboard/GetEditToDoDialog',
                onLoadBeforeOpen: function () {
                    // Reformat the date to ex: 6 June 2014
                    var dateContainer = $('.dateContainer > input');
                    if (dateContainer.val() !== "") {
                        var inputDateObject = new Date(dateContainer.val());
                        dateContainer.val($.datepicker.formatDate("d MM yy", inputDateObject));
                    }
                    dateContainer.datepicker({ dateFormat: "d MM yy" });
                }
            }
        },

        initialize: function (id) {
            this.get('openDialogOptions').loadParameters = { toDoItemID: id };
        }
    });

    return EditToDoDialogOptions;
});