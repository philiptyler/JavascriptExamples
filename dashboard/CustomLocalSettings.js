function pageLoad() {
    var oWindow = GetRadWindow();
    var dock = oWindow.argument;

    if (dock) {
        InitializeForm();
        InitializeFields(dock);
    }
    oWindow.argument = null;
}

function InitializeForm() {
    SetAutoRefreshState();
    $('#' + window.autoRefreshCheckBoxID).click(SetAutoRefreshState);
}
//Change the initial loading state based on the dock's known settings.
function InitializeFields(dock) {
    //String comparisons here because I'm unable to pass object-types through use of DescribeComponent.
    if (dock._refreshEnabled == 'True') {
        $('#' + window.autoRefreshCheckBoxID).attr('checked', true);

        var autoRefreshNumericTextBox = window.$find(window.autoRefreshNumericTextBoxID);

        autoRefreshNumericTextBox.set_value(dock._refreshInterval);
        autoRefreshNumericTextBox.enable();

        var wrapperElement = window.$get(autoRefreshNumericTextBox._wrapperElementID);
        var label = $(wrapperElement.getElementsByTagName("label")[0]);
        label.addClass("LabelEnabled");
        label.removeClass("LabelDisabled");
    }

    window.$find(window.chartComboBoxID).findItemByValue(dock._chartType).select();

    $('#Content').show();
    GetRadWindow().autoSize();
}

//Pass the dialog data back to Dashboard.
function CloseAndSave() {
    var oWindow = GetRadWindow();
    var customAttributes = {};
    customAttributes.RefreshEnabled = $('#' + window.autoRefreshCheckBoxID).is(':checked');
    customAttributes.RefreshInterval = window.$find(window.autoRefreshNumericTextBoxID).get_value();
    customAttributes.ChartType = window.$find(window.chartComboBoxID).get_value();
    oWindow.argument = customAttributes;
    oWindow.close();
    oWindow.argument = null; //Important because pageLoad gets called once more after oWindow closes.
}