/* Summary
 * This function returns a set of parameters used by the dialog manager
 * to create the specific Add 3D Rack View Data Center Select dialog in the CS-Web dashboard
 */

define(['common/model/dialogManager'], function(DialogManager) {
    'use strict';

    var AddXdomRackViewDialogOptions = Backbone.Model.extend({

        defaults: {
            jqueryDialogOptions: {
                title: 'Select Data Center To Display',
                width: '420px',
                modal: false,

                // overwrite default open() so it will not force window centering of dialog
                open: function() {
                    DialogManager.applyOnOpenDialogDecorations(this);
                },
            },

            buildDialogOptions: {
                dialogId: 'DataCenterSelectDialogContainer',
                controllerActionUrl: '/csweb/PlanView/GetRackInfoByDataCenterSelect',
                noCancel: true,
                isDownload: false,
                isUpload: false
            },

            openDialogOptions: {
                loadUrl: '/csweb/PlanView/GetDataCenterSelectDialog',
                loadParameters: {},
                onLoadBeforeOpen: function() {},
                noClose: true
            }
        },

        // Take a jsRadDock jquery object so the dialog will know where to center itself on the page
        initialize: function($jsRadDock) {
            var jqueryDialogOptions = this.get('jqueryDialogOptions');
            jqueryDialogOptions.position = {
                my: 'center',
                at: 'center',
                of: $jsRadDock
            };
            this.set('jqueryDialogOptions', jqueryDialogOptions);
        }
    });

    return AddXdomRackViewDialogOptions;
});