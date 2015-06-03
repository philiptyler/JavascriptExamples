/* Summary:
 */
/* global x3dom,Modernizr */
define(['common/cormantX3dom',
        'text!assets/information/planViewTab/template/xDomDataCenter.html',
        'dashboard/view/xDomRackSceneView',
        'dashboard/view/xDomRackLegendView'
], function (initCormantX3dom, xDomDataCenterTemplate, SceneView, LegendView) {
    'use strict';
    
    var XdomDataCenterView = Marionette.LayoutView.extend({
        template: _.template(xDomDataCenterTemplate),
        id: 'plan-view-tab',

        regions: {
            xDomSceneRegion: '#plan-view-region',
            legendRegion: '.rack-legend-region'
        },

        ui: {
            resetButton: '#reset-view-x3dom',
            zoomSlider: '#zoom-x3dom'
        },

        events: {
            'mousedown @ui.resetButton': '_resetView',
            'mouseup @ui.resetButton': '_debounceReset',
            'mouseout @ui.resetButton': '_debounceReset'
        },

        /* MARIONETTE FUNCTIONS */
        /************************/

        initialize: function (options) {
            initCormantX3dom(this._getZoomValue.bind(this));
            this.channelid = _.isUndefined(options.channelid) ? '' : options.channelid;
            this._setupEventChannels(options);
        },
        
        onShow: function() {
            this.model.finalizeRacks();
            this._buildScene();
            this._buildLegend();
            this.hideControls(false);
        },

        /* PUBLIC FUNCTIONS */
        /********************/

        // hides/shows reset button and zoomSlider
        hideControls: function (shouldHide) {
            this.ui.resetButton.toggleClass('hidden', shouldHide);
            this.ui.zoomSlider.toggleClass('hidden', shouldHide);
        },

        /* X3DOM OBJECT GETTERS */
        /************************/

        // Returns the most recently added x3dom.Canvas object.
        // Unfortunately there's no way (that I can find) to 
        // remove previously registered canvases.
        _getCanvas: function () {
            return x3dom.canvases[x3dom.canvases.length - 1];
        },

        _getViewAreaObject: function () {
            return this._getCanvas().doc._viewarea;
        },

        /* PRIVATE FUNCTIONS */
        /*********************/

        _setupEventChannels: function () {
            this.rackOptionsChannel = Backbone.Wreqr.radio.channel('rack-options' + this.channelid);
            this.rackViewChannel = Backbone.Wreqr.radio.channel('rack-view' + this.channelid);

            this.listenTo(this.rackViewChannel.vent, 'dblclickRack', this._routeToRackViewTab);
            this.listenTo(this.rackOptionsChannel.vent, 'minMaxZoom', this._setupZoomSlider);
            this.model.on('change:zoomValue', this._setSliderValue.bind(this));
        },

        // When a rack is clicked, we want to route the user to that rack's
        // rackview tab.
        _routeToRackViewTab: function (model) {
            var encodedName = encodeURIComponent(model.get('name').trim());
            window.assetsRouter.navigate('component/' + model.get('componentID') + '/' + encodedName, { trigger: true });
            this.trigger('changeToAlertTab');
        },

        // This function is called after all the <transform> and other x3d html tags have beeen
        // added to the page.  Need to call x3dom.reload() to re-run the functions that draw/create
        // the canvas from the html tags.  Tooltip can't be built until after x3dom has run.
        _afterShow: function (rackSceneView) {
            x3dom.reload();
            rackSceneView.afterShow();
            this.trigger('doneShowing');
        },

        // Builds the x3dom scene with all the rack <transform> tags
        _buildScene: function () {
            this.rackSceneView = new SceneView({
                collection: this.model.get('racks'),
                channelid: this.channelid,
                viewDimensions: {
                    width: this.$el.width(),
                    height: this.$el.height()
                },
                loadedWithFlash: !Modernizr.webgl
            });

            this.xDomSceneRegion.show(this.rackSceneView);
            this._afterShow(this.rackSceneView);
        },

        // Builds legend for x3dom scene
        _buildLegend: function () {
            var rackLegendView = new LegendView({
                channelid: this.channelid
            });

            this.legendRegion.show(rackLegendView);
        },

        // This function is called on a mousedown on the reset
        // button on the x3dom canvas
        _resetView: function () {
            this.ui.resetButton.removeClass('box-shadow');
            this._getViewAreaObject().resetView();
            this.model.set('zoomValue', this.model.get('zoomMin'));
            this.trigger('resetView');
        },

        // This function is called on a mouseup on the reset
        // button on the x3dom canvas
        _debounceReset: function () {
            this.ui.resetButton.addClass('box-shadow');
        },

        /* ZOOM FUNCTIONS */
        /******************/

        // Called after the user slides the zoomSlider
        // Calls the x3dom.doc.viewarea's custom tryzoom function
        // based on the value from the slider.
        _doZoom: function (slideEvent, slider) {
            var viewPointChangeValue = this.model.get('zoomValue') + slider.value;
            var viewArea = this._getViewAreaObject();
            viewArea._isMoving = viewArea.tryZoom(viewPointChangeValue);
            this._getCanvas().doc.needRender = true;
        },

        // When the xDomViewPointsView calculates the tallest rack (zoomMax)
        // in the DC and the topDistance for viewing a DC it triggers a minMax event
        // so this function can record the data points as slider min/max values
        // store them in the model so we can attach change events to them
        // SLIDER VALUES ARE MULTIPLIED BY -1 BECAUSE THAT'S THE ONLY WAY
        // TO REVERSE THE DEFAULT HORIZONTAL JQUERY SLIDER
        _setupZoomSlider: function (zoomAttributes) {
            this.ui.zoomSlider.slider({
                min: -1 * zoomAttributes.minZoom,
                max: -1 * zoomAttributes.maxZoom,
                value: -1 * zoomAttributes.minZoom,
                stop: this._doZoom.bind(this)
            });
            this.ui.zoomSlider.find('a').addClass('fa fa-search-plus x3dom-overlay-control');

            this.model.set('zoomMax', zoomAttributes.maxZoom);
            this.model.set('zoomMin', zoomAttributes.minZoom);
            this.model.set('zoomValue', zoomAttributes.minZoom);
        },

        _setSliderValue: function (model, newValue) {
            this.ui.zoomSlider.slider('option', 'value', -1 * newValue);
        },

        // zoom in is positive
        // zoom out is negative
        // Given the current x3dom viewpoint and float amount to change the viewpoint by
        // this function returns the float amount to change the current x3dom viewpoint.
        // If the viewpoint cannot be changed by the given value, the viewPointChangeValue
        // returned is 0.
        _getZoomValue: function (viewpoint, viewPointChangeValue) {
            var currentZoom = this.model.get('zoomValue');
            var maxZoom = this.model.get('zoomMax');
            var minZoom = this.model.get('zoomMin');

            if (currentZoom - viewPointChangeValue < maxZoom) {
                viewPointChangeValue = currentZoom - maxZoom;
            } else if (currentZoom - viewPointChangeValue > minZoom) {
                viewPointChangeValue = currentZoom - minZoom;
            }

            this.model.set('zoomValue', currentZoom - viewPointChangeValue);
            return viewPointChangeValue;
        }
    });

    return XdomDataCenterView;
});