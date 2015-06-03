/* Summary:
 * This is a Marionette ItemView which renders buttons for the user to control
 * the planview tab.  The menu, planView, Tooltip and leader board.  this tab/view
 * is only loaded if the selected component is a database or a component within a database
 */

define(['alertify',
  'text!assets/information/planViewTab/template/planViewControls.html',
  'text!assets/information/planViewTab/template/planViewPrint.html',
  'common/widget/select/select',
  'utility'
], function (Alertify, ControlsTemplate, PrintTemplate, SelectView, Utility) {
    'use strict';

    var PlanViewControlsView = Marionette.LayoutView.extend({
        tagName: 'ul',
        template: _.template(ControlsTemplate),

        ui: {
            namesCheck: '#toggle-names i',
            colorSelect: '#color-select',
            namesButton: '#toggle-names',
            rotateButton: '#rotate-plan-view',
            editButton: '#edit-plan-view',
            gridSpinner: '#grid-spinner',
            gridSpinnerWrapper: '#grid-spinner-wrapper',
            saveButton: '#save-plan-view',
            cancelButton: '#cancel-plan-view',
            exportButton: '#export-components',
            printButton: '#print-plan-view',
            buttons: 'li > a'
        },

        regions: {
            colorByPropertiesSelect: '#color-by-properties-select'
        },

        events: {
            'change @ui.colorSelect': '_changeRackColors',
            'click @ui.namesButton': '_toggleNames',
            'click @ui.rotateButton': '_changeSelectedView',
            'click @ui.editButton': '_editPlanview',
            'click @ui.saveButton': '_savePlanview',
            'click @ui.cancelButton': '_cancelPlanview',
            'click @ui.exportButton': '_exportComponents',
            'click @ui.printButton': '_printScene',
        },

        modelEvents: {
            'change:controlsEnabled': '_enableControls',
            'change:allRackAlerts': '_colorizeAttributeSelect',
            'change:enableNamesButton': '_disableNamesButton',
            'change:currentViewIndex': '_rotatePlanView'
        },

        /* MARIONETTE FUNCTIONS */
        /************************/

        initialize: function (options) {
            this._setupEventChannels(options.channelid);
        },

        // Have to wait until the template is rendered before the select can be built,
        // also setup event to show select when the attribute list fetch() succeeds
        onRender: function () {
            this._buildColorByPropertiesSelect();
            this.listenToOnce(this.model, 'change:attributesLoaded', function () {
                this._showColorByPropertiesSelect();
            });
            if (this.model.get('attributesLoaded')) {
                this.stopListening(this.model, 'change:attributesLoaded');
                this._showColorByPropertiesSelect();
            }
            this._setupGridSpinner();
        },

        /* PUBLIC FUNCTIONS */
        /********************/

        // Toggles disabled css classes and html properties
        setControlsEnabled: function (enabled) {
            this.model.set('controlsEnabled', enabled);
        },
        
        disableNamesButtonAndNotify: function() {
            this.model.set('enableNamesButton', false);
            Alertify.warn('Data Center too large for Rack Names to Display.');
        },

        // Triggers a browser "print" operation after creating a page to print.
        // MUST MAKE A POPUP WINDOW SO IE9/10 HAVE PRINT PREVIEW
        print: function (imgData, printableDiv, componentName) {
            var template = _.template(PrintTemplate);

            // Create the window.
            var win = window.open('about:blank', '_blank');
            $(win.document).ready(function () {
                // For some crazy reason, IE needs `document.open()` before `print()` can be called.
                win.document.open();

                // Add the view's content to the document.
                win.document.write(template({ componentName: componentName, printableDiv: printableDiv }));
                var canvasImage = win.document.getElementById('canvasImage');
                canvasImage.src = imgData;

                // For some crazy reason, IE needs `document.close()` in order for `print()` to actually work.
                win.document.close();

                //  window.load only fires once and then is cached and doesn't fire. Calling print stops
                //  all JS execution in chrome so the page content doesn't load in the print preview.
                //  Appending HTML via jQuery works but can't tell when CSS has been applied.
                setTimeout(function () {
                    win.print();
                }, 100);
            }.bind(this));
        },

        // Takes all the racks' attributes, filters out the attributes used for 3D rendering,
        // pareses the remaining attributes to a csv string, encodes the csv string and downloads it to users pc
        // PARAMS:
        // rackAttributes - array of objects where each objects contains all the attributes of a rack model
        exportRacksAsCsv: function (rackAttributes) {
            var filteredRackAttributes = _.map(rackAttributes, function (attribute) {
                return _.omit(attribute, 'componentID', 'overlappingAllowed',
                 'heightDeterminant', 'colorDeterminant', 'rackColor', 'renderName', 'id', 'numberingOrigin');
            });
            var csvString = Utility.parseObjectsToCsv(filteredRackAttributes);
            var encodedUri = encodeURI(csvString);
            this._downloadURIFile('dataCenterRacks.csv', encodedUri);
        },
        
        // This function is called when the 'reset' button is clicked on the 3D canvas
        reset: function() {
            this.model.set('currentViewIndex', 0);
        },

        /* PRIVATE FUNCTIONS */
        /*********************/

        _setupEventChannels: function (channelid) {
            this.rackOptionsChannel = Backbone.Wreqr.radio.channel('rack-options' + channelid);
            this.listenTo(this.rackOptionsChannel.vent, 'alertAttributesLoaded', this._setAllRackAlerts);
        },
        
        _setupGridSpinner: function() {
            this.ui.gridSpinner.spinner({
                incremental: false,
                numberFormat: 'n',
                max: this.model.get('maxGridSpacing'),
                min: this.model.get('minGridSpacing'),
                change: this._gridSizingChanged.bind(this),
                stop: this._reformatSizeSpinner.bind(this)
            });
        },
        
        _gridSizingChanged: function () {
            var newSize = this.ui.gridSpinner.spinner('value');
            if (newSize < this.ui.gridSpinner.spinner('option', 'min')) {
                newSize = this.ui.gridSpinner.spinner('option', 'min');
                this.ui.gridSpinner.spinner('value', newSize);
            }
            
            // send new grid size IN METERS to fabricDataCenterView.js
            this.rackOptionsChannel.vent.trigger('changeGrid', newSize / 100);
        },
        
        _reformatSizeSpinner: function () {
            var newSize = this.ui.gridSpinner.spinner('value');
            if (!_.isNull(newSize) && newSize > this.ui.gridSpinner.spinner('option', 'max')) {
                newSize = this.ui.gridSpinner.spinner('option', 'max');
                this.ui.gridSpinner.spinner('value', newSize);
            }
            
        },

        // enable is a boolean, if true, selectView and buttons will be enabled
        //  if false, the controls will be disabled
        _enableControls: function (model, enable) {
            this.ui.buttons.toggleClass('disabled', !enable);
            this._disableNamesButton(model, model.get('enableNamesButton'));
            this.selectView.$el.prop('disabled', !enable);
        },
        
        _disableNamesButton: function (model, enableNamesButton) {
            this.ui.namesButton.toggleClass('disabled', !enableNamesButton);
        },

        // Builds select view of rack attributes fetched from server
        // uses common/widget/select/select.js
        _buildColorByPropertiesSelect: function () {
            this.selectView = new SelectView({
                collection: this.model.get('rackAttributes'),
                valueAttr: 'name',
                displayAttr: 'name',
                model: this.model,
                dataAttr: 'valueAttributeName',
                defaultOption: 'Color By All Alerts',
                defaultValue: 'all'
            });
        },

        // Once the Attributes list has been successfully finished,
        // show the view, enable the dropdown, begin listening to the select change
        // colorize the attributes list if the racks have also come back from the server
        _showColorByPropertiesSelect: function () {
            this.colorByPropertiesSelect.show(this.selectView);
            this.selectView.$el.prop('disabled', !this.model.get('controlsEnabled'));
            this.listenTo(this.model, 'change:valueAttributeName', this._changeRackColors.bind(this));

            if (this.model.get('allRackAlerts') !== null) {
                this._colorizeAttributeSelect();
            }
        },

        _setAllRackAlerts: function (allRackAlerts) {
            this.model.set('allRackAlerts', allRackAlerts);
        },

        // Iterates through all the attribute <option> tags of the selectView
        // if racks have alerts related to an options value, change its color
        _colorizeAttributeSelect: function () {
            if (this.colorByPropertiesSelect.hasView()) {
                var allRackAlerts = this.model.get('allRackAlerts');
                var $options = this.selectView.$('option');
                _.each($options, function (option) {
                    var alertCounts = allRackAlerts[option.value];
                    if (!_.isUndefined(alertCounts)) {
                        if (alertCounts.critical > 0) {
                            option.className += 'critical-attribute';
                        } else if (alertCounts.warning > 0) {
                            option.className += 'warning-attribute';
                        }
                    } else {
                        option.className += 'invalid-attribute';
                    }
                });
            }
        },

        // Trigger an event on the global options channel.  xdomracksview.js will listen to this event
        // and recolor all the rects
        _changeRackColors: function (selectedModel) {
            this.rackOptionsChannel.vent.trigger('changeRackColor', selectedModel.get('valueAttributeName'));
        },

        // By inrementing the model's currentViewIndex, a listener will hear the change and call _rotatePlanView
        _changeSelectedView: function () {
            // Increment currentViewIndex, use '%' to reset it to zero (no array index out of bound exceptions)
            var newViewIndex = (this.model.get('currentViewIndex') + 1) % this.model.get('viewItems').length;
            this.model.set('currentViewIndex', newViewIndex);
        },

        // Trigger an event on the global options channel.  xdomracksview.js will listen to this event
        // and change the position of the x3dom camera
        _rotatePlanView: function (model, currentViewIndex) {
            this.rackOptionsChannel.vent.trigger('changeView', this.model.get('viewItems')[currentViewIndex].title);
        },

        // Event is handled in xDomRackView.js
        // Toggle the font-awesome checkbox
        _toggleNames: function () {
            if (this.model.get('enableNamesButton')) {
                this.rackOptionsChannel.vent.trigger('toggleNames');
                this.ui.namesCheck.toggleClass('fa-square-o fa-check-square-o');
            }
        },
        
        // The export, edit & rotate buttons should only be displayed on 3D view
        // the save & cancel buttons should only be displayed on 2D view
        // This function alternates the two sets
        _toggleEditButtons: function () {
            this.ui.exportButton.toggleClass('hidden');
            this.ui.printButton.toggleClass('hidden');
            this.ui.editButton.toggleClass('hidden');
            this.ui.rotateButton.toggleClass('hidden');
            this.ui.saveButton.toggleClass('hidden');
            this.ui.cancelButton.toggleClass('hidden');
            this.ui.gridSpinnerWrapper.toggleClass('hidden');
        },

        // Triggers planViewTabView.js to hide the x3dom.js 3D Rack view and show
        // the fabric.js 2D plan view
        _editPlanview: function () {
            this._toggleEditButtons();
            this.trigger('editPlanview');
        },
        
        // UNDER CONSTRUCTION
        _savePlanview: function () {
            this.trigger('savePlanview');
        },
        
        // destroys fabric view, reshows 3D view
        _cancelPlanview: function () {
            this._toggleEditButtons();
            this.trigger('cancelPlanview');
        },

        // Event handled by parent view (planViewTabView.js)
        // It calls this views public 'exportRacksAsCsv' method after
        // creating rack attribute objects for parsing
        _exportComponents: function () {
            this.trigger('prepareJsonModels');
        },

        // Event handled by parent view (planViewTabView.js)
        // It calls this views public 'print' method after
        // creating content to print
        _printScene: function () {
            this.trigger('preparePrintWindow');
        },

        // takes a file name and encoded uriString and creates a temporary link on the page
        // so we can use its 'download' property to set the file name.  Then manually clicks
        // the temp link to start a download.
        // http://stackoverflow.com/questions/21177078/javascript-download-csv-as-file
        _downloadURIFile: function (fileName, uriString) {
            var link = document.createElement('a');
            var event = document.createEvent('HTMLEvents');
            event.initEvent('click');
            link.download = fileName;
            link.href = uriString;
            link.dispatchEvent(event);
        }
    });

    return PlanViewControlsView;
});