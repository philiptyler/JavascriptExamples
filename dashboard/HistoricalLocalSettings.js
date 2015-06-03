function pageLoad() {
    var oWindow = GetRadWindow();
    var dock = oWindow.argument;

    //Setup how the dialog window looks based on the dock's known settings.
    if (dock) {
        InitializeForm();
        InitializeFields(dock);
    }
    else {
        //Change the state of the window based on user interactions after initial load.
        ValidateWindowState(window.$find(window.chartComboBoxID).get_value());
    }

    oWindow.argument = null;
}

function InitializeForm() {
    SetAutoRefreshState();
    SetTimeframeRestrictedState();
    $('#' + window.autoRefreshCheckBoxID).click(SetAutoRefreshState);
    $('#' + window.defaultTimeCheckBoxID).click(SetDefaultTimeState);
    $('#' + window.timeframeRestrictedCheckBoxID).click(SetTimeframeRestrictedState);
}

//Pass data back to the Dashboard.
function CloseAndSave() {
    var oWindow = GetRadWindow();
    var historicalAttributes = {};

    historicalAttributes.RefreshEnabled = $('#' + window.autoRefreshCheckBoxID).is(':checked');
    historicalAttributes.RefreshInterval = window.$find(window.autoRefreshNumericTextBoxID).get_value();
    historicalAttributes.ChartType = window.$find(window.chartComboBoxID).get_value();
    historicalAttributes.DefaultTimeEnabled = $('#' + window.defaultTimeCheckBoxID).is(':checked');
    historicalAttributes.DefaultTimeValue = window.$find(window.defaultTimeNumericTextBoxID).get_value();
    historicalAttributes.DefaultTimeType = window.$find(window.defaultTimeComboBoxID).get_value();
    historicalAttributes.TimeRestrictionEnabled = $('#' + window.timeframeRestrictedCheckBoxID).is(':checked');
    if (historicalAttributes.TimeRestrictionEnabled) {
        var startDateTimePicker = window.$find(window.startDateTimePickerID);
        if (historicalAttributes.ChartType == "LineChart") {
            var endDateTimePicker = window.$find(window.endDateTimePickerID);
            if (startDateTimePicker.isEmpty() || endDateTimePicker.isEmpty()) {
                alert("Please provide values for both dates.");
                return;
            }
            else {
                var startDate = startDateTimePicker.get_selectedDate();
                var endDate = endDateTimePicker.get_selectedDate();

                if ((endDate - startDate) < 0) {
                    alert("The second date should be past the first.");
                    return;
                }
                //I just chose a date-time formatting. Globalization isn't a big concern here because its not
                //presented to the user.
                historicalAttributes.TimeStart = startDate.format("MM/dd/yyyy hh:mm:ss tt");
                historicalAttributes.TimeEnd = endDate.format("MM/dd/yyyy hh:mm:ss tt");
            }
        }
        else if (historicalAttributes.ChartType == "PieChart") {
            if (startDateTimePicker.isEmpty()) {
                alert("Please enter a date.");
                return;
            }
            //I just chose a date-time formatting. Globalization isn't a big concern here because its not
            //presented to the user.
            historicalAttributes.TimeStart = startDateTimePicker.get_selectedDate().format("MM/dd/yyyy hh:mm:ss tt");
            historicalAttributes.TimeEnd = null;
        }
    }
    else {
        historicalAttributes.TimeStart = null;
        historicalAttributes.TimeEnd = null;
    }

    historicalAttributes.DataPointsEnabled = $('#' + window.dataPointsCheckBoxID).is(':checked');

    oWindow.argument = historicalAttributes;
    oWindow.close();
    oWindow.argument = null; //Important because pageLoad gets called once more after oWindow closes.
}
//Change the initial loading state based on the dock's known settings.
function InitializeFields(dock) {
    if (dock._refreshEnabled == "True") {
	    $('#' + window.autoRefreshCheckBoxID).attr('checked', true);
	    var autoRefreshNumericTextBox = window.$find(window.autoRefreshNumericTextBoxID);
	    autoRefreshNumericTextBox.set_value(dock._refreshInterval);
	    autoRefreshNumericTextBox.enable();

	    var autoRefreshNumericTextBoxLabel = window.$get(autoRefreshNumericTextBox.get_id() + "_Label");
	    autoRefreshNumericTextBoxLabel.className = autoRefreshNumericTextBoxLabel.className.replace(" LabelDisabled", "");
	    autoRefreshNumericTextBoxLabel.className += autoRefreshNumericTextBoxLabel.className.indexOf("LabelEnabled") != -1 ? "" : " LabelEnabled";
    }

	window.$find(window.chartComboBoxID).findItemByValue(dock._chartType).select();

	if (dock._chartType == "PieChart") {
	    $('#HideCheckBoxWhenDecorated').hide();
	    $('#HideLabelWhenDecorated').hide();
	    $('#DefaultTimeframeTable').hide();
	    window.$find(window.endDateTimePickerID).set_visible(false);
	}

    //String comparisons here because I'm unable to pass object-types through use of DescribeComponent.
	if (dock._defaultTimeEnabled == "True") {
	    $('#' + window.defaultTimeCheckBoxID).attr('checked', true);
	    window.$find(window.defaultTimeNumericTextBoxID).set_value(dock._defaultTimeValue);
	    window.$find(window.defaultTimeComboBoxID).findItemByValue(dock._defaultTimeType).select();

	    //Disable TimeFrame Restriction
	    $('#' + window.timeframeRestrictedCheckBoxID).attr('disabled', 'disabled');
    }

    if (dock._timeRestrictionEnabled == "True") {
        $('#' + window.timeframeRestrictedCheckBoxID).attr('checked', true);

	    var startDateTimePicker = window.$find(window.startDateTimePickerID);

	    startDateTimePicker.set_enabled(true);
	    var timeStartDate = new Date(dock._timeStart);
	    startDateTimePicker.set_selectedDate(timeStartDate);
		startDateTimePicker.get_timeView().setTime(timeStartDate.getHours(), timeStartDate.getMinutes(), 0, 0);

		if (dock._chartType == "LineChart") {
		    var endDateTimePicker = window.$find(window.endDateTimePickerID);
		    endDateTimePicker.set_enabled(true);

			var timeEndDate = new Date(dock._timeEnd);

			endDateTimePicker.set_selectedDate(timeEndDate);
			endDateTimePicker.get_timeView().setTime(timeEndDate.getHours(), timeEndDate.getMinutes(), 0, 0);
		}

        //Disable DefaultTime
        $('#' + window.defaultTimeCheckBoxID).attr('disabled', 'disabled');
        window.$find(window.defaultTimeNumericTextBoxID).disable();
        window.$find(window.defaultTimeComboBoxID).disable();
	}

    if (dock._dataPointsEnabled == "True") {
        $('#' + window.dataPointsCheckBoxID).attr('checked', true);
    }

	ValidateWindowState(window.$find(window.chartComboBoxID).get_value());
	$('#Content').show();
	GetRadWindow().autoSize();
}

//The heavy-hitter for forcing controls to appear/disappear.
function ValidateWindowState(comboBoxSelectedValue) {
    var chartFieldset = document.getElementById('ChartProperties');

    var isTimeframeRestricted = $('#' + window.timeframeRestrictedCheckBoxID).is(':checked');

    var startDateTimePicker = window.$find(window.startDateTimePickerID);
    var endDateTimePicker = window.$find(window.endDateTimePickerID);
    if (comboBoxSelectedValue == "PieChart") {
        $('#HideCheckBoxWhenDecorated').hide();
        $('#HideLabelWhenDecorated').hide();
        $('#DefaultTimeframeTable').hide();
        endDateTimePicker.set_visible(false);
        chartFieldset.style.height = "68px";
        startDateTimePicker.set_enabled(isTimeframeRestricted);
    }
    else if (comboBoxSelectedValue == "LineChart") {
        $('#HideCheckBoxWhenDecorated').show();
        $('#HideLabelWhenDecorated').show();
        $('#DefaultTimeframeTable').show();
        endDateTimePicker.set_visible(true);
        chartFieldset.style.height = "122px";
        startDateTimePicker.set_enabled(isTimeframeRestricted);
        endDateTimePicker.set_enabled(isTimeframeRestricted);
    }

    SetDefaultTimeState();

    //IE Specific patching
    if (window.$telerik.isIE) {
        var tableFieldset = window.$telerik.$(chartFieldset).parents("table.rfdRoundedWrapper_fieldset").filter("table.rfdRoundedWrapper_fieldset");
        if (tableFieldset.length) { //if the jQuery object contains no elements found, then we should skip the fix. 
            tableFieldset = tableFieldset[0];
            var previousTD = chartFieldset.parentNode.previousSibling;
            var nextTD = chartFieldset.parentNode.nextSibling;
            if (comboBoxSelectedValue == "PieChart") {
                window.Sys.UI.DomElement.removeCssClass(tableFieldset, "rfdHeight122");
                window.Sys.UI.DomElement.removeCssClass(previousTD, "rfdTD122");
                window.Sys.UI.DomElement.removeCssClass(nextTD, "rfdTD122");

                window.Sys.UI.DomElement.addCssClass(tableFieldset, "rfdHeight68px");
                window.Sys.UI.DomElement.addCssClass(previousTD, "rfdTD68");
                window.Sys.UI.DomElement.addCssClass(nextTD, "rfdTD68");
            }
            else if (comboBoxSelectedValue == "LineChart") {
                window.Sys.UI.DomElement.addCssClass(tableFieldset, "rfdHeight122");
                window.Sys.UI.DomElement.addCssClass(previousTD, "rfdTD122");
                window.Sys.UI.DomElement.addCssClass(nextTD, "rfdTD122");

                window.Sys.UI.DomElement.removeCssClass(tableFieldset, "rfdHeight68");
                window.Sys.UI.DomElement.removeCssClass(previousTD, "rfdTD68");
                window.Sys.UI.DomElement.removeCssClass(nextTD, "rfdTD68");
            }
        }
    }
}

//When the user changes between Line Chart and Pie Chart the number of controls
//displayed on the window changes. As such, I need to expand/contract the
//size of the window. This causes the window to resize itself.
function OnClientSelectedIndexChanged(sender, eventArgs) {
    var comboBoxValue = eventArgs.get_item().get_value();
    ValidateWindowState(comboBoxValue);
    AdjustRadWindow();
}

function AdjustRadWindow() {
    var oWindow = GetRadWindow();
    if (oWindow.isVisible()) {
        oWindow.autoSize();
    }
}

var lastChangedHeight = 0;

function OnPopupClosing() {
    var oWindow = GetRadWindow();
    if (oWindow.isVisible()) {
        oWindow.set_height(oWindow.get_height() - lastChangedHeight);
    }
}

//When the DateTimePickers pop-up the window doesn't expand. This forces the window
//to change size based on whether it is open or not.
function OnPopupOpening(sender, eventArgs) {
    var senderID = sender.get_id();
    var oWindow = GetRadWindow();
    if (oWindow.isVisible()) {
        var chartComboBox = window.$find(window.chartComboBoxID);
        var popup = eventArgs.get_popupControl();
        if (popup.get_id().indexOf("calendar") != -1) {
            if (senderID == "StartDateTimePicker") {
                if (chartComboBox.get_value() == "LineChart") {
                    oWindow.set_height(oWindow.get_height() + 140);
                    lastChangedHeight = 140;
                }
                else if (chartComboBox.get_value() == "PieChart") {
                    oWindow.set_height(oWindow.get_height() + 160);
                    lastChangedHeight = 160;
                }
            }
            else {
                oWindow.set_height(oWindow.get_height() + 170);
                lastChangedHeight = 170;
            }
        }
        else {
            if (senderID == "StartDateTimePicker") {
                if (chartComboBox.get_value() == "LineChart") {
                    oWindow.set_height(oWindow.get_height() + 160);
                    lastChangedHeight = 160;
                }
                else if (chartComboBox.get_value() == "PieChart") {
                    oWindow.set_height(oWindow.get_height() + 180);
                    lastChangedHeight = 180;
                }
            }
            else {
                oWindow.set_height(oWindow.get_height() + 180);
                lastChangedHeight = 180;
            }
        }
    }
}

function SetDefaultTimeState() {
    var isDefaultTimeEnabled = $('#' + window.defaultTimeCheckBoxID).is(':checked');

    if (isDefaultTimeEnabled) {
        //Disable TimeFrame Restriction
        $('#' + window.timeframeRestrictedCheckBoxID).attr('disabled', 'disabled');
        window.$find(window.defaultTimeNumericTextBoxID).enable();
        window.$find(window.defaultTimeComboBoxID).enable();

        var currentItem = window.$find(window.defaultTimeComboBoxID).get_selectedItem();
        var itemValue = currentItem.get_value();

        var defaultTimeNumericTextBox = window.$find(window.defaultTimeNumericTextBoxID);
        var currentNumber = defaultTimeNumericTextBox.get_value();
        if (itemValue == "Days") {
            defaultTimeNumericTextBox.set_maxValue(3650);

            if (currentNumber > 3650) {
                defaultTimeNumericTextBox.set_value(3650);
            }
        }
        else if (itemValue == "Hours") {
            defaultTimeNumericTextBox.set_maxValue(48);

            if (currentNumber > 48) {
                defaultTimeNumericTextBox.set_value(48);
            }
        }
    }
    else {
        //Enable TimeFrame Restriction
        $('#' + window.timeframeRestrictedCheckBoxID).removeAttr('disabled');
        window.$find(window.defaultTimeNumericTextBoxID).disable();
        window.$find(window.defaultTimeComboBoxID).disable();
    }
}

function SetTimeframeRestrictedState() {
    var chartComboBox = window.$find(window.chartComboBoxID);
    var startDateTimePicker = window.$find(window.startDateTimePickerID);

    var isTimeframeRestricted = $('#' + window.timeframeRestrictedCheckBoxID).is(':checked');

    if (isTimeframeRestricted) {
        $('#' + window.defaultTimeCheckBoxID).attr('disabled', 'disabled');
    }
    else {
        $('#' + window.defaultTimeCheckBoxID).removeAttr('disabled');
    }

    if( chartComboBox.get_value() == "LineChart" ) {
        var endDateTimePicker = window.$find(window.endDateTimePickerID);
        
        startDateTimePicker.set_enabled(isTimeframeRestricted);
        endDateTimePicker.set_enabled(isTimeframeRestricted);
    }
    else if( chartComboBox.get_value() == "PieChart" ) {
        startDateTimePicker.set_enabled(isTimeframeRestricted);
    }
    else {
        alert("Error determining chartComboBox value.");
    }
}

function OnDefaultTimeComboBoxChange(sender, eventArgs) {
    var currentItem = eventArgs.get_item();
    var itemValue = currentItem.get_value();

    var defaultTimeNumericTextBox = window.$find(window.defaultTimeNumericTextBoxID);
    var currentNumber = defaultTimeNumericTextBox.get_value();
    if (itemValue == "Days") {
        defaultTimeNumericTextBox.set_maxValue(3650);

        if (currentNumber > 3650) {
            defaultTimeNumericTextBox.set_value(3650);
        }
    }
    else if (itemValue == "Hours") {
        defaultTimeNumericTextBox.set_maxValue(48);

        if (currentNumber > 48) {
            defaultTimeNumericTextBox.set_value(48);
        }
    }
}