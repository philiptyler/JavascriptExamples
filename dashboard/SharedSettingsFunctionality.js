//Contains functionality that all the dialog windows share in common. I found that I was maintaing a lot of code in multiple places unnecessarily.
function GetRadWindow() {
    var oWindow = null;
    if (window.radWindow) oWindow = window.radWindow;
    else if (window.frameElement.radWindow) oWindow = window.frameElement.radWindow;
    return oWindow;
}

function OnGetDockAttributesFailure(errors) {
    alert(errors);
}

function SetAutoRefreshState() {
    var autoRefreshNumericTextBox = window.$find(window.autoRefreshNumericTextBoxID);
    var wrapperElement = window.$get(autoRefreshNumericTextBox._wrapperElementID);
    var label = $(wrapperElement.getElementsByTagName("label")[0]);
    if ($('#' + window.autoRefreshCheckBoxID).is(':checked')) {
        autoRefreshNumericTextBox.enable();
        label.addClass("LabelEnabled");
        label.removeClass("LabelDisabled");
    }
    else {
        autoRefreshNumericTextBox.disable();
        label.addClass("LabelDisabled");
        label.removeClass("LabelEnabled");
    }
}
