/* Summary:
 * This is a Marionette Layout view which renders 3 regions that communicate with
 * eachother.  The menu, 3D/2D planView and Tooltip.  this tab/view
 * is only loaded if the selected component is a database or a component within a database
 */
/* global Modernizr */
define([
  'common/cormantX3dom',
  'assets/information/enum/tabType',
  'assets/information/planViewTab/model/planViewTab',
  'assets/information/planViewTab/model/xDomDataCenter',
  'assets/information/planViewTab/model/fabricDataCenter',
  'dashboard/model/xDomRackSceneControls',
  'text!assets/information/planViewTab/template/planViewTab.html',
  'text!assets/information/planViewTab/template/planViewRackToolTip.html',
  'assets/information/planViewTab/view/planViewControlsView',
  'dashboard/view/xDomRackToolTipView',
  'assets/information/planViewTab/view/xdomDataCenterView',
  'assets/information/planViewTab/view/fabricDataCenterView',
  'dashboard/model/xDomRack'
], function (initCormantX3dom, TabType, PlanViewModel, XdomDataCenter, FabricDataCenter,
    ControlsModel, PlanViewTemplate, ToolTipTemplate, PlanViewControlsView, ToolTipView,
    XdomDataCenterView, FabricDataCenterView, Rack) {
    'use strict';

    var PlanViewLayout = Marionette.LayoutView.extend({
        template: _.template(PlanViewTemplate),
        id: 'plan-view-tab',

        regions: {
            controlsRegion: '#plan-view-controls-region',
            xdomDataCenterViewRegion: '#plan-view-x3dom',
            fabricDataCenterViewRegion: '#plan-view-fabric',
            toolTipRegion: '#plan-view-tool-tip-region'
        },

        ui: {
            content: '.plan-view-content',
            loading: '#plan-view-loading',
            invalid: '#plan-view-invalid'
        },

        modelEvents: {
            'change:loading': '_onChangeLoading'
        },

        channelid: 'planview',

        /* MARIONETTE FUNCTIONS */
        /************************/

        onRender: function () {
            this._buildControls();
        },

        onDestroy: function () {
            if (this.xdomDataCenterView) {
                this.xdomDataCenterView.model.cleanup();
            }
        },
        
        onShow: function() {
            this._onChangeLoading(this.model, this.model.get('loading'));
        },

        /* PUBLIC FUNCTIONS */
        /********************/

        // disable the planview control toolbar depending on the booleans given
        setControls: function (isLoading, isComponentValid) {
            this.controlsView.setControlsEnabled(!isLoading && isComponentValid);
        },

        /* PRIVATE FUNCTIONS */
        /*********************/

        _disableNamesButton: function () {
            this.controlsView.disableNamesButtonAndNotify();
        },

        // When a rack is clicked, we want to route the user to that rack's
        // rackview tab.
        _changeToAlertTab: function () {
            this.trigger('requestTabChange', TabType.AlertView);
        },

        // Update the tab's messages when the model finishes/begins loading data
        // from the server
        _onChangeLoading: function (model, loading) {
            this.ui.loading.toggleClass('hidden', !loading);
            var isComponentValid = false;

            if (loading) {
                this.render();
                this.ui.invalid.addClass('hidden');
            } else {
                isComponentValid = !(this.model.get('invalidComponent'));
                this.ui.invalid.toggleClass('hidden', isComponentValid);
                if (isComponentValid) {
                    this._buildShowXdomDataCenterView();
                }
            }

            this.setControls(loading, isComponentValid);
        },

        /* MARIONETTE VIEW BUILDERS/SHOWERS */
        /************************************/

        // This function gerenates all the backbone.marionette views that compose the x3dom rack view display
        // this function also binds all the events to the xdomdatacenterview 
        _buildShowXdomDataCenterView: function () {
            this.xdomDataCenterView = new XdomDataCenterView({
                model: new XdomDataCenter({ racks: this.model.racks }),
                channelid: this.channelid
            });
            this.listenTo(this.xdomDataCenterView, 'changeToAlertTab', this._changeToAlertTab);
            this.listenTo(this.xdomDataCenterView, 'doneShowing', this._buildRackToolTip);
            this.listenTo(this.xdomDataCenterView, 'resetView', this.controlsView.reset.bind(this.controlsView));
            this.listenTo(this.xdomDataCenterView.model, 'cannotRenderNames', this._disableNamesButton);

            this.xdomDataCenterViewRegion.show(this.xdomDataCenterView);
        },

        // Show the 3D view, hide the 2D view
        // Do not need to rebuild the 3D canvas because we just hid it (display = none)
        _showXdomDataCenterView: function () {
            this.fabricDataCenterViewRegion.empty();
            this.xdomDataCenterView.$el.show();
        },

        // Build and show a new fabric 2D planview canvas after hiding the 3D canvas
        _showFabricDataCenterView: function () {
            this.xdomDataCenterView.$el.hide();
            this.fabricDataCenterView = new FabricDataCenterView({
                model: new FabricDataCenter(),
                channelid: this.channelid,
                domParent: $('#plan-view-fabric')
            });

            this.fabricDataCenterView.generateRackRects(this.model.racks);
            this.fabricDataCenterViewRegion.show(this.fabricDataCenterView);
        },
        
        _savePlanviewChanges: function () {
            this.fabricDataCenterView.savePlanview(this._onSuccessfulSave.bind(this));
        },
        
        // Called on a successful ajax request to save 
        _onSuccessfulSave: function() {
            this.fabricDataCenterViewRegion.empty();
            this.model.forceReload();
        },

        // Builds control toolbar just under asset tabs
        _buildControls: function () {
            this.controlsView = new PlanViewControlsView({
                model: new ControlsModel({ loadAttributes: true }),
                channelid: this.channelid,
            });
            this.listenTo(this.controlsView, 'preparePrintWindow', this._printScene);
            this.listenTo(this.controlsView, 'prepareJsonModels', this._exportJsonModels);
            this.listenTo(this.controlsView, 'editPlanview', this._showFabricDataCenterView);
            this.listenTo(this.controlsView, 'savePlanview', this._savePlanviewChanges);
            this.listenTo(this.controlsView, 'cancelPlanview', this._showXdomDataCenterView);
            this.controlsRegion.show(this.controlsView);
        },

        // builds Tooltips that follow the mouse using
        // mouse postion taken from the canvas
        _buildRackToolTip: function () {
            var newRack = new Rack();

            // set componentID to 0 so the tooltip will default to empty attributes
            newRack.set('componentID', 0);

            this.rackToolTipView = new ToolTipView({
                template: _.template(ToolTipTemplate),
                model: newRack,
                channelid: this.channelid,
                loadedWithFlash: !Modernizr.webgl
            });

            this.toolTipRegion.show(this.rackToolTipView);
        },

        // takes rack scene view and tooltip view, appends the html
        // of them together and asks the controlsView to print it
        _printScene: function () {
            var canvas = window.document.getElementById('x3dom-plan-view-region-canvas');
            var $printDiv = $('<div></div>');
            $printDiv.append(this.$('#plan-view-tool-tip-region')[0].outerHTML);

            // Calling ToDataURL will allow me to 'capture' a 2D image of the canvas
            // in its current state.  I can then set that data url to an img element to print
            // http://www.informit.com/articles/article.aspx?p=1903884&seqNum=9
            this.controlsView.print(canvas.toDataURL(), $printDiv.html(), this.model.getComponentName());
        },

        // Sends an array of the racks' attributes to the controls view for further csv processing
        _exportJsonModels: function () {
            var jsonModels = this.model.racks.toJSON();
            this.controlsView.exportRacksAsCsv(jsonModels);
        }
    });

    return PlanViewLayout;
});