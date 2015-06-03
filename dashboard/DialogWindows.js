var oWindow = null; //Currently popped-open window.
var radDock = null; //The dock that opened a Historical/Custom dialog window.

//  Opens the Custom Report Viewer window using the dock's reportID as a parameter to display appropriate data.
function OpenReport(dock) {
    var fullURL = window.reportViewerURL + dock.get_element().getAttribute("ReportID");
    oWindow = window.radopen(fullURL, "ReportWindow");
}

//Opens a RadDock Settings window based off of the type of report being held in the RadDock.
function ShowLocalSettings(dock) {
    radDock = dock;

    var reportType = radDock.get_element().getAttribute("ReportType");
    if (reportType == "HistoricalReport") {
        oWindow = window.radopen(null, "HistoricalLocalSettingsWindow");
    }
    else if (reportType == "CustomReport") {
        oWindow = window.radopen(null, "CustomLocalSettingsWindow");
    }
    else {
        window.radalert("Didn't find report type.");
        return;
    }

}

//Set the argument to the dockID so that when the window loads it can pull
//relevant information about the dock.
function OnLocalSettingsShow(dialogWindow) {
    dialogWindow.argument = radDock;
}

//Passes the data back from the popped-up window for saving/processing.
function OnHistoricalLocalSettingsClose(dialogWindow) {
    var historicalJSONAttributes = dialogWindow.argument;

    if (historicalJSONAttributes != null) {
        historicalJSONAttributes.JSONType = "HistoricalLocalSettingsJSON";
        window.__doPostBack(radDock.get_uniqueID(), JSON.stringify(historicalJSONAttributes));
    }
    oWindow = null;
}

function OnCustomLocalSettingsClose(dialogWindow) {
    var customJSONAttributes = dialogWindow.argument;

    if (customJSONAttributes != null) {
        customJSONAttributes.JSONType = "CustomLocalSettingsJSON";
        window.__doPostBack(radDock.get_uniqueID(), JSON.stringify(customJSONAttributes));
    }
    oWindow = null;
}

function OnReportWindowClose() {
    oWindow = null;
}

//Cancel to prevent sliding pane from opening.
function ShowDashboardGlobalSettings(sender, eventArgs) {
    eventArgs.set_cancel(true);
    oWindow = window.$find(window.globalSettingsWindowID);
    oWindow.show();
}

//Don't allow the user to drag an open window past screen size.
function OnWindowDrag(sender) {
    var rExtender = sender._resizeExtender;
    rExtender._autoScrollEnabled = false;
}

//Cancel to prevent sliding pane from opening.
function UploadDashboard(sender, eventArgs) {
    eventArgs.set_cancel(true);
    oWindow = window.$find(window.uploadDashboardWindowID);
    oWindow.show();
}

//Cancel to prevent sliding pane from opening.
function DownloadDashboard(sender, eventArgs) {
    eventArgs.set_cancel(true);

    $.ajax({
        type: 'GET',
        url: '../Common/IsSessionAlive',
        success: function (a) {
            //  If the controller returns true we're OK to download, otherwise refresh to redirect to login.
            if (a === true) {
                $('<iframe>', {
                    src: "./Dialog/Windows/DownloadDashboard.ashx",
                    css: {
                        display: 'none'
                    }
                }).appendTo('body');
            } else {
                window.location.href = window.location.href;
            }
        },
        error: function () {
            //  Refresh page if Session is dead. Let Forms Authentication logic take over.
            window.location.href = window.location.href;
        }
    });

}

function CloseUploadDashboard() {
    oWindow.hide();
    oWindow = null;
}

//Bug -- IE removes 'TopBar' when closing a modal, content template RadWindow. Circumvent by removing the property right before close.
function AddModal(radWindow) {
    radWindow.set_modal(true);
}

function RemoveModal(radWindow) {
    radWindow.set_modal(false);
}