//This will be removed in a future update -- Telerik is working on implementing the functionality after I recc'ed it to them. :)
var allowImplicitResizes = false;
function SubstituteResizeExtender() {
    allowImplicitResizes = true;

    var settingsSlidingPane = window.$find(window.settingsSlidingPaneID);
    var customReportsSlidingPane = window.$find(window.customReportsSlidingPaneID);
    var historicalReportsSlidingPane = window.$find(window.historicalReportsSlidingPaneID);

    var oldOnDragStart = settingsSlidingPane.onDragStart;

    settingsSlidingPane.onDragStart = customReportsSlidingPane.onDragStart = historicalReportsSlidingPane.onDragStart = function (args) {
        console.log("Sliding Pan onDragStart");
        oldOnDragStart.call(this, args);

        this._lastAppliedPosition = window.$telerik.$.extend({}, this._cachedResizeHelperBounds);
    };
    settingsSlidingPane.onDrag = customReportsSlidingPane.onDrag = historicalReportsSlidingPane.onDrag = function (args) {
        console.log("Sliding Pan onDrag");
        var splitterBounds = this._cachedSplitterBounds;
        if (splitterBounds.width < 1 || splitterBounds.height < 1)
            return false;

        var decoration = this._helperBarDecoration;
        window.Sys.UI.DomElement.removeCssClass(decoration, "rspHelperBarSlideError");

        var isHorizontal = this._isHorizontalSlide();
        var property = isHorizontal ? "x" : "y";
        args[property] += 150; // Work with the location of the decoration element.

        var splitBarBounds = this._cachedResizeHelperBounds;
        var result = window.Telerik.Web.UI.ResizeExtender.containsBounds(splitterBounds, new window.Sys.UI.Bounds(args.x, args.y, splitBarBounds.width, splitBarBounds.height));
        if (!result) {
            var maxReached = false;
            if (args.x <= splitterBounds.x) {
                args.x = splitterBounds.x;
                if (isHorizontal) maxReached = true;
            }
            else if (splitterBounds.x + splitterBounds.width <= args.x + splitBarBounds.width) {
                args.x = splitterBounds.x + splitterBounds.width - splitBarBounds.width;
                if (isHorizontal) maxReached = true;
            }

            if (args.y <= splitterBounds.y) {
                args.y = splitterBounds.y;
                if (!isHorizontal) maxReached = true;
            }
            else if (splitterBounds.y + splitterBounds.height <= args.y + splitBarBounds.height) {
                args.y = splitterBounds.y + splitterBounds.height - splitBarBounds.height;
                if (!isHorizontal) maxReached = true;
            }
            result = true;

            if (maxReached)
                window.Sys.UI.DomElement.addCssClass(decoration, "rspHelperBarSlideError");
        }

        if (this.get_splitter().get_liveResize()) {
            var lastUpdate = this._lastUpdate;
            if (!lastUpdate || ((new Date() - lastUpdate) >= 32)) // timeoutInterval = 32ms
            {
                this._lastUpdate = new Date();
                var delta = args[property] - this._lastAppliedPosition[property];
                this._resizeByDelta(delta);

                this._lastAppliedPosition = window.$telerik.$.extend({}, args);
            }
        }
        else {
            var resizeStep = this._resizeStep;
            if (resizeStep > 0)
                args[property] -= (args[property] - splitBarBounds[property]) % resizeStep;
        }

        this._liveResizePosition = window.$telerik.$.extend({}, args);

        args[property] -= 150; // Return the location of the helper element.
        return result;
    };
    settingsSlidingPane.onDragEnd = customReportsSlidingPane.onDragEnd = historicalReportsSlidingPane.onDragEnd = function () {
        console.log("Sliding Pan onDragEnd");
        if (!this.get_expanded()) return;

        var property = this._isHorizontalSlide() ? "x" : "y";
        var currentPosition = this[this.get_splitter().get_liveResize() ? "_lastAppliedPosition" : "_cachedSplitbarBounds"];
        var delta = this._liveResizePosition[property] - currentPosition[property];
        if (delta != 0)
            this._resizeByDelta(delta);

        this.get_splitter()._getDragOverlay().style.display = "none";
        this._helperBar.style.display = "none";
        // In case the decoration is showing error and the resize is cancelled, the class will not be removed.
        window.Sys.UI.DomElement.removeCssClass(this._helperBarDecoration, "rspHelperBarSlideError");

        this._liveResizePosition = null;
        this._cachedSplitterBounds = null;
        this._cachedResizeHelperBounds = null;
        this._resizeMode = false;
        this._lastAppliedPosition = null;
    };
}