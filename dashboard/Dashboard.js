Telerik.Web.UI.RadSplitter.prototype._uniqueID = null; //Used in exposing web control's uniqueID property client-side.
Telerik.Web.UI.RadDockZone.prototype._uniqueID = null;

// Need to keep track of mouse position in order to show rack view tooltips properly
// http://stackoverflow.com/questions/4847726/how-to-animate-following-the-mouse-in-jquery
var mouseX = 0,
    mouseY = 0;
$(document).mousemove(function (e) {
    mouseX = e.pageX;
    mouseY = e.pageY;
});

// This global object is used for triggering events within this file.
// Then I can listen to this object within other modules
window.dashboardEvents = $({});
window.dashboardEvents.events = {
    signalRedraw: 'signalRedraw',
    startRedraw: 'startRedraw',
    signalResize: 'signalResize',
    startResize: 'startResize',
    signalDropped: 'signalDropped',
    startDropped: 'startDropped',
    dockChanged: 'dockChanged',
    signalTab: 'signalTab',
    startTab: 'startTab',
    loadWarning: 'loadWarning',
    loadError: 'loadError',
    cleanupView: 'cleanupView'
};

//When the user first loads the dashboard the saved state dimensions may not be the same
//as the current browser dimensions. Force panes on the page to re-calculate their dimensions proportionally
//to fit the new screen based off of saved-state dimensions.
$(document).ready(function () {
    var rightPane = window.$find(window.rightPaneID);
    FixSplitter(rightPane);
});

function DenyClose(dock, eventArgs) {
    eventArgs.set_cancel(true);
    var openedAlert = window.radalert('Dashboard configuration must be enabled to close this chart.', 330, 100);
    openedAlert.set_title('Action Required');
}

function ConfirmClose(dock, eventArgs) {
    eventArgs.set_cancel(true);

    var callbackFn = function (arg) {
        if (arg) {
            if (dock._uniqueID.indexOf('JSRadDock') >= 0) {
                window.dashboardEvents.trigger(window.dashboardEvents.events.cleanupView, dock);
            }
            dock.doPostBack(eventArgs.Command.get_name());
        }
    };
    window.radconfirm('Are you sure you want to close this chart?', callbackFn, 330, 100);
}

var resizeQueue = [];

function PropagateChanges(splitterID) {
    if (resizeQueue.length == 0) {
        resizeQueue.push(splitterID);
        window.__doPostBack(splitterID);
    } else {
        resizeQueue.push(splitterID);
    }
}

//When a resize occurs a lot of handling needs to happen to convert the user's action into
//a visibly-pleasing result. In addition, the server has to be spoken with in order to save the controls.
function OnClientResizing(pane, eventArgs) {
    window.dashboardEvents.trigger(window.dashboardEvents.events.signalRedraw);
    eventArgs.set_cancel(true);
    var parameters = new Array('Resize', pane.get_id(), eventArgs.get_delta());
    window.__doPostBack(pane.get_splitter()._uniqueID, parameters);
}

//The queue is here to prevent the erroneous state where user drops a control while an AJAX request is in-progress.
//Queue up the next event instead of breaking.
var droppedItemQueue = [];

//When the user drops a RadListBoxItem onto the dashboard we have to figure out
//what RadDockZone the control was dropped onto, rip out information about the event,
//and then pass that data to the server for processing.
function OnClientDropping(sender, eventArgs) {
    eventArgs.set_cancel(true);
    sender.clearSelection();
    previousZone = null;

    var sourceItem = eventArgs.get_sourceItem();
    var droppedObject = window.$find(eventArgs.get_htmlElement().id);

    //Was the item dropped ontop of a RadDockZone?
    if (droppedObject && window.Telerik.Web.UI.RadDockZone.isInstanceOfType(droppedObject)) {
        if (droppedObject.get_docks().length == 0) {
            //Needed to maintain proper visual display of loading panels.
            dockZoneDroppedOnID = droppedObject.get_id();

            var eventData = {};
            eventData.sourceItemText = sourceItem.get_text();
            eventData.sourceItemValue = sourceItem.get_value();

            if (sender.get_id().indexOf('Historical') != -1) {
                eventData.reportType = 'HistoricalReport';
            } else if (sender.get_id().indexOf('Custom') != -1) {
                eventData.reportType = 'CustomReport';
            } else if (sender.get_id().indexOf('JS') != -1) {
                window.dashboardEvents.trigger(window.dashboardEvents.events.signalDropped, dockZoneDroppedOnID);
                eventData.reportType = 'JSReport';
            } else {
                eventData.reportType = 'None';
            }

            if (droppedItemQueue.length == 0) {
                droppedItemQueue.push(droppedObject._uniqueID);
                droppedItemQueue.push(eventData);
                window.__doPostBack(droppedObject._uniqueID, JSON.stringify(eventData));
            } else {
                loadingPanel = window.$find(window.loadingPanelID);
                var dockZoneParentID = window.$find(dockZoneDroppedOnID).get_parent().get_id();

                if ($.inArray(dockZoneParentID, areasDisplayingLoadingPanel) == -1) {
                    loadingPanel.show(dockZoneParentID);
                    areasDisplayingLoadingPanel.push(dockZoneParentID);
                }
                droppedItemQueue.push(droppedObject._uniqueID);
                droppedItemQueue.push(eventData);
            }
        }
    } else {
        dockZoneDroppedOnID = '';
    }
}

function RemoveHighlighting(dockZone) {
    if (dockZone.get_docks().length == 0) dockZone.removeCssClass('zoneDropOk');
}

function AddHighlighting(dockZone) {
    if (dockZone.get_docks().length == 0) dockZone.addCssClass('zoneDropOk');
}

var previousZone = null;
//Evaluates whether the currently moused-over item is a RadDockZone.
function TryGetZoneFromTarget(target) {
    //If the mouse moves too quickly target.id returns a red herring.
    if (/\S/.test(target.id) == false) {
        if ($(target).hasClass('rtsLevel')) {
            return null; //The tabstrip has an invisible div which doesn't have an ID, but isn't a redherring.
        }
        return undefined;
    }

    var foundObject = window.$find(target.id);

    if (foundObject && window.Telerik.Web.UI.RadDockZone.isInstanceOfType(foundObject)) {
        return foundObject;
    }

    return null;
}

//Adds highlighting to the dockZones when the user is dragging objects to the screen.
//Clear the old dockZone as the user moves out of it, and color new ones as they move into it.
function OnClientDragging(sender, eventArgs) {
    var target = eventArgs.get_htmlElement();
    var currentZone = TryGetZoneFromTarget(target);

    if (currentZone === undefined) return;

    if (currentZone) {
        dockZoneDroppedOnID = currentZone.get_id();

        if (previousZone == null) {
            previousZone = currentZone;
            AddHighlighting(currentZone);
        } else if (previousZone != currentZone) {
            RemoveHighlighting(previousZone);
            previousZone = currentZone;
            AddHighlighting(currentZone);
        }
    } else {
        dockZoneDroppedOnID = '';
        if (previousZone != null) {
            RemoveHighlighting(previousZone);
            previousZone = null;
        }
    }
}

var closingPane;

function ConfirmClosePaneCallBackFn(userDecidedToDelete) {
    if (userDecidedToDelete == true) {
        var deletionRequest = [];
        deletionRequest.push('Deletion');
        deletionRequest.push(closingPane.get_id());
        window.__doPostBack(closingPane.get_splitter()._uniqueID, deletionRequest);
    }
}

//Prompt the user before deletion.
function OnClientCollapsing(pane, eventArgs) {
    eventArgs.set_cancel(true);
    closingPane = pane;
    window.radconfirm('This action will delete the specified area. Are you sure?', ConfirmClosePaneCallBackFn, 330, 110);
}

var areasDisplayingLoadingPanel = [];
var dockZoneDroppedOnID = '';
var displayOverBaseID = '';
//Handles drawing the LoadingPanels over the correct elements when callbacks are occurring.
var loadingPanel = '';
var pageRequestManager = Sys.WebForms.PageRequestManager.getInstance();
var postBackElement = '';
pageRequestManager.add_initializeRequest(initializeRequest);
pageRequestManager.add_endRequest(endRequest);

//This will display a loading panel over a control. It's useful to change what the loading panel is being
//displayed over in some scenarios because it just doesn't look quite right. e.g. when moving between panels
//the loading panel should only be the size of the pane that the dock is moving to, not the full size of the dock currently.
function initializeRequest(sender, eventArgs) {
    postBackElement = eventArgs.get_postBackElement().id;
    if (postBackElement.indexOf('BASEUNDERPAGEVIEW') != -1 || postBackElement.indexOf('DashboardUpdatePanel') != -1) {
        postBackElement = window.baseSplitterID;
        loadingPanel = window.$find(window.loadingPanelForSplitterFixingID);
        window.$get(window.loadingPanelForSplitterFixingID).style.width = $(window).width() + 'px';
        window.$get(window.loadingPanelForSplitterFixingID).style.height = $(window).height() - $('#TopBar').height() + 'px';
        window.$get(window.loadingPanelForSplitterFixingID).style.position = 'absolute';
        window.$get(window.loadingPanelForSplitterFixingID).style.top = $('#TopBar').height() + 'px';
        window.$get(window.loadingPanelForSplitterFixingID).style.left = '0px';
    } else {
        loadingPanel = window.$find(window.loadingPanelID);
    }

    //When drag and dropping the 'interesting' control isn't where we're coming from but where we're going to.
    if (dockZoneDroppedOnID != '') {
        postBackElement = window.$find(dockZoneDroppedOnID).get_parent().get_id();
        dockZoneDroppedOnID = '';
    } else if (displayOverBaseID != '') {
        postBackElement = displayOverBaseID;
        displayOverBaseID = '';
    }

    if (showLoadingPanel) {
        if ($.inArray(postBackElement, areasDisplayingLoadingPanel) == -1) {
            loadingPanel.show(postBackElement);
            areasDisplayingLoadingPanel.push(postBackElement);
        }
    }
}

//This will hide the loading panel thats currently being displayed and,
//if the user decided to continue dropping things onto the page, it will fire
//the next event.
function endRequest(sender) {
    if (sender._postBackSettings.sourceElement) {
        var sourceElement = window.$find(sender._postBackSettings.sourceElement.id);

        if (sourceElement) {
            var sourceElementID = sourceElement.id;

            if (window.Telerik.Web.UI.RadDockZone.isInstanceOfType(sourceElement)) {
                sourceElement = sourceElement.get_parent();
                sourceElementID = sourceElement.get_id();
            }

            if (sourceElementID) {
                if ($.inArray(postBackElement, areasDisplayingLoadingPanel) != -1) {
                    loadingPanel.hide(postBackElement);
                    areasDisplayingLoadingPanel.splice(areasDisplayingLoadingPanel.indexOf(postBackElement), 1); //Removes the element
                }

                postBackElement = sourceElementID;
            }
        }
    }

    if ($.inArray(postBackElement, areasDisplayingLoadingPanel) != -1) {
        loadingPanel.hide(postBackElement);
        areasDisplayingLoadingPanel.splice(areasDisplayingLoadingPanel.indexOf(postBackElement), 1); //Removes the element
    }

    //  If we've got more ajax requests queued up.
    if (droppedItemQueue.length > 0) {
        droppedItemQueue.shift(); //Remove the ID of the control we just finished.
        droppedItemQueue.shift(); //Remove the data for the control we just finished.
        if (droppedItemQueue.length > 0) {
            var uniqueDockZoneID = droppedItemQueue[0];
            var data = droppedItemQueue[1];
            window.__doPostBack(uniqueDockZoneID, JSON.stringify(data));
        } else {
            window.dashboardEvents.trigger(window.dashboardEvents.events.startDropped);
        }
    } else if (resizeQueue.length > 0) {
        resizeQueue.shift(); //Remove the ID of the control we just finished.

        if (resizeQueue.length > 0) {
            var resizedID = resizeQueue[0];
            window.__doPostBack(resizedID);
        } else {
            window.dashboardEvents.trigger(window.dashboardEvents.events.startResize);
            window.dashboardEvents.trigger(window.dashboardEvents.events.startTab);
        }
    } else {
        window.dashboardEvents.trigger(window.dashboardEvents.events.startRedraw);
    }
}

//Keep dockZoneDroppedOnID up-to-date for proper loading panel placement.
function OnClientDockPositionChanged(sender) {
    dockZoneDroppedOnID = sender.get_dockZoneID();
    window.dashboardEvents.trigger(window.dashboardEvents.events.dockChanged, dockZoneDroppedOnID);
}

//Set the forbiddenZones on dragging.
//I do this client-side because I do not want to update lal the controls
//server-side whenever a dock's location/state changes.
function OnClientDragStart(sender) {
    var forbiddenZones = [];
    var globalDockZones = window.Telerik.Web.UI.RadDockZonesGlobalArray;
    for (var index = 0; index < globalDockZones.length; index++) {
        if (globalDockZones[index].get_docks().length > 0) {
            forbiddenZones.push(globalDockZones[index].get_id());
        }
    }

    sender.set_forbiddenZones(forbiddenZones);
    //Prevents dragging a RadDock way off the screen horizontally.
    var rExtender = sender._resizeExtender;
    rExtender._autoScrollEnabled = false;
}

//This will only trigger when the browser window resizes.
//Fix the display of the dashboard, if theres an open window, re-center it.
function OnMainSplitterResizing() {
    window.dashboardEvents.trigger(window.dashboardEvents.events.signalResize);
    displayOverBaseID = window.baseSplitterID;
    if (oWindow) oWindow.center();
}

function FixSplitter(sender, eventArgs) {
    var multiPage = window.$find(window.multiPageID);

    if (!multiPage) {
        window.console && console.error('Failed to find multiPage in FixSplitter');
        return;
    }

    var selectedPageView = multiPage.get_selectedPageView();
    var pageViewID = selectedPageView.get_id();
    var htmlContent = sender.get_content();
    var tempStartIndex = htmlContent.indexOf(pageViewID);
    var tempTrimmedFrontData = htmlContent.substring(tempStartIndex);

    var startIndex = tempTrimmedFrontData.indexOf('RadSplitter');
    var trimmedFrontData = tempTrimmedFrontData.substring(startIndex);
    var endingMarker = "\"";
    if (window.$telerik.isIE8) endingMarker = '\>';
    var endIndex = trimmedFrontData.indexOf(endingMarker);
    var trimmedData = trimmedFrontData.substring(0, endIndex);

    var mySplitter = window.$find(trimmedData);

    if (mySplitter) {

        //When eventArgs is defined, FixSplitter has not been called explicitly.
        //If the user is dragging the browser window in one direction, only fix in that direction
        if (eventArgs) {
            //Don't allow implict resizing until after BaseSplitter has loaded.
            if (allowImplicitResizes) {
                if (eventArgs.get_oldHeight() != sender.get_height()) mySplitter.set_height(sender.get_height());
                if (eventArgs.get_oldWidth() != sender.get_width()) mySplitter.set_width(sender.get_width());
                PropagateChanges(mySplitter.get_id());
            }
        }
            //I've called FixSplitter explicitly. Ensure completely valid state.
        else {
            mySplitter.set_height(sender.get_height());
            mySplitter.set_width(sender.get_width());
            PropagateChanges(mySplitter.get_id());
        }

    }

}

function OnClientTabSelected() {
    window.dashboardEvents.trigger(window.dashboardEvents.events.signalTab);
    FixSplitter(window.$find(window.rightPaneID));
}

var showLoadingPanel = true;

function OnServerTabSelected(newID) {
    var oldID = window.$find(window.multiPageID).get_selectedPageView().get_id();

    window.$telerik.$('#' + oldID).fadeOut(1000, function () {
        window.$telerik.$('#' + newID).fadeIn(1000, function () {
            window.$find(window.multiPageID).findPageViewByID(newID).select();
            //Showing a loading panel while fading between tabs looks bad.
            showLoadingPanel = false;
            FixSplitter(window.$find(window.rightPaneID));
            showLoadingPanel = true;
        });
    });
}

//Prevents right-clicking from opening the LHS menu.
var oldMouseDownHandler = Telerik.Web.UI.RadSlidingZone.prototype._paneTab_OnMouseDown;

Telerik.Web.UI.RadSlidingZone.prototype._paneTab_OnMouseDown = function (e) {
    if (isRightClick(e)) return;

    oldMouseDownHandler.call(this, e);
};

function isRightClick(e) {
    var result = false;

    if (e.which && e.which == 2) {
        result = true;
    } else if (e.button && e.button == 2) {
        result = true;
    }

    return result;
}

//IE8 doesn't support .indexOf on Array objects.
//http://stackoverflow.com/questions/3629183/why-doesnt-indexof-work-on-an-array-ie8
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (elt /*, from*/) {
        var len = this.length >>> 0;

        var from = Number(arguments[1]) || 0;
        from = (from < 0) ? Math.ceil(from) : Math.floor(from);
        if (from < 0)
            from += len;

        for (; from < len; from++) {
            if (from in this &&
                this[from] === elt)
                return from;
        }
        return -1;
    };
}

function EnableEditMode() {
    $.ajax({
        type: 'POST',
        url: window.pageURL + '/EnableEditMode',
        data: '{}',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function (result) {
            if (result.d == true) {
                window.$find(window.leftPaneID).expand(1);
                $('#' + window.startEditButtonID).hide();
                $('#' + window.finishEditButtonID).show();
                window.dashboardEvents.trigger(window.dashboardEvents.events.signalResize);
            }
        },
        error: function () {
            //  Not authorized, log back in.
            window.location.href = window.location.href;
        }
    });
}

function findAllJSRadDocks() {
    var $allRadDocks = $('.RadDock');
    var jsRadDocks = _.filter($allRadDocks, function (radDock) {
        return radDock.id.startsWith('JSRadDock_');
    });

    return jsRadDocks;
}

function getIDandTitleFromJSRadDocks(jsRadDocks) {
    var idsAndTitles = [];

    for (var dockIndex = 0; dockIndex < jsRadDocks.length; dockIndex++) {
        var radDock = jsRadDocks[dockIndex];
        var obj = {
            title: $(radDock).find('.rdTop .rdCenter em').text()
        };
        obj.id = radDock.id;
        idsAndTitles.push(obj);
    }

    return idsAndTitles;
}

function ShowConfigurationOptions(sender) {
    var currentLocation = window.$telerik.getLocation(sender.get_element());
    var contextMenu = window.$find(window.finishEditContextMenuID);
    contextMenu.showAt(currentLocation.x, currentLocation.y + 22);
}

function ConfigurationOptionChosen(sender, eventArgs) {
    if (window.dashboardEvents.canSaveDashboard()) {
        var itemText = eventArgs.get_item().get_text();

        if (window.$find(window.settingsSlidingPaneID).get_expanded()) {
            window.$find(window.leftPaneSlidingZoneID).collapsePane(window.settingsSlidingPaneID);
        }

        if (window.$find(window.customReportsSlidingPaneID).get_expanded()) {
            window.$find(window.leftPaneSlidingZoneID).collapsePane(window.customReportsSlidingPaneID);
        }

        if (window.$find(window.historicalReportsSlidingPaneID).get_expanded()) {
            window.$find(window.leftPaneSlidingZoneID).collapsePane(window.historicalReportsSlidingPaneID);
        }

        //Show the loading panel prematurely because the real wait time is in the PageMethod (which isn't ajax).
        loadingPanel = window.$find(window.loadingPanelForSplitterFixingID);
        loadingPanel.show(window.baseSplitterID);

        var jsRadDockInfoObject = {
            jsRadDockInfos: getIDandTitleFromJSRadDocks(findAllJSRadDocks())
        };

        if (itemText == 'Save Changes') {
            $.ajax({
                type: 'POST',
                url: window.pageURL + '/SaveToDatabase',
                data: JSON.stringify(jsRadDockInfoObject),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                success: function (result) {
                    if (result.d == true) {
                        var radNotification = window.$find(window.dashboardSaveNotificationID);
                        radNotification.set_text('Dashboard saved successfully.');
                        radNotification.set_title('Save Successful');
                        radNotification.show();
                    } else {
                        window.radalert('Dashboard NOT saved successfully.', 240, 100, 'Save Unsuccessful');
                    }
                    window.dashboardEvents.trigger(window.dashboardEvents.events.signalRedraw);
                    window.__doPostBack(window.dashboardUpdatePanelUniqueID);
                }
            });
        } else if (itemText == 'Cancel Changes') {
            $.ajax({
                type: 'POST',
                url: window.pageURL + '/RevertToLastSave',
                data: '{}',
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                success: function (result) {
                    if (result.d == false) {
                        window.radalert('Dashboard NOT reverted successfully.', 240, 100, 'Revert Unsuccessful');
                    }
                    window.dashboardEvents.trigger(window.dashboardEvents.events.signalRedraw);
                    window.__doPostBack(window.dashboardUpdatePanelUniqueID);
                }
            });
        }
    } else {
        window.radalert('Please complete all initialization dialogs', 240, 100, 'Save Unsuccessful');
    }
}