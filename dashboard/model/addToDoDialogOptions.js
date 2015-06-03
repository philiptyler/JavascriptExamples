/* Summary
 * This function returns a set of parameters used by the dialog manager
 * to create the specific Add ToDoItem dialog in the CS-Web dashboard
 */

define(function () {
    'use strict';

    var AddToDoDialogOptions = Backbone.Model.extend({

        defaults: {
            jqueryDialogOptions: {
                title: 'Add New Todo',
                width: '380px',
                okButtonText: "Save"
            },

            buildDialogOptions: {
                dialogId: "ToDoDialogContainer",
                controllerActionUrl: '../Dashboard/CreateToDo',
                isDownload: false,
                isUpload: false
            },

            openDialogOptions: {
                loadUrl: '../Dashboard/GetAddToDoDialog',
                loadParameters: {},
                onLoadBeforeOpen: function() {
                    $('.dateContainer > input').datepicker({ dateFormat: "d MM yy" });
                }
            }
        }
    });
    
    return AddToDoDialogOptions;
});