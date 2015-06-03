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

function SetAutoCycleState() {
    var autoCycleNumericTextBox = window.$find(window.autoCycleNumericTextBoxID);
    var wrapperElement = window.$get(autoCycleNumericTextBox._wrapperElementID);
    var label = $(wrapperElement.getElementsByTagName("label")[0]);

    if ($('#' + window.autoCycleCheckBoxID).is(':checked')) {
        autoCycleNumericTextBox.enable();
        label.addClass("LabelEnabled");
        label.removeClass("LabelDisabled");
    }
    else {
        autoCycleNumericTextBox.disable();
        label.addClass("LabelDisabled");
        label.removeClass("LabelEnabled");
    }
}

//Record how things are shown so if the user clicks out we can undo.
var autoRefreshCheckboxChecked;
var autoCycleCheckboxChecked;

function InitializeWindow() {
    window.$find(window.tabsListBoxID).clearSelection();
    
    SetAutoRefreshState();
    SetAutoCycleState();
    
    $('#' + window.autoRefreshCheckBoxID).click(SetAutoRefreshState);
    $('#' + window.autoCycleCheckBoxID).click(SetAutoCycleState);
    
    $('#GlobalSettingsDecorationZone').click(function (e) {
        var tabTextApplyButton = window.$find(window.tabTextApplyButtonID);
        var target = $(e.target);
        if (target.hasClass('rlbItem') || target.hasClass('rlbText')) {
            window.$find(window.tabTextBoxID).clear();
            tabTextApplyButton.set_text("Rename Tab");
        }
        else if( !target.hasClass('riTextBox')) {
            tabTextApplyButton.set_text("Add Tab");
            window.$find(window.tabsListBoxID).clearSelection();
        }
    });

    RecordState();
}

function RecordState() {
    autoRefreshCheckboxChecked = $('#' + window.autoRefreshCheckBoxID).is(':checked');
    autoCycleCheckboxChecked = $('#' + window.autoCycleCheckboxID).is(':checked');
}

//When the user clicks the 'X' button, undo changes.
var shouldResetState = true;
function UnloadWindow() {
    window.$find(window.tabTextApplyButtonID).set_text("Add Tab");
    
    if (shouldResetState) {
        ResetState();
    }
    window.oWindow = null;
    shouldResetState = true;
}

function ResetState() {
    $('#' + window.autoRefreshCheckBoxID).attr('checked', autoRefreshCheckboxChecked);
    SetAutoRefreshState(autoRefreshCheckboxChecked);
    $('#' + window.autoCycleCheckBoxID).attr('checked', autoCycleCheckboxChecked);
    SetAutoCycleState(autoCycleCheckboxChecked);
}

function CloseAndSave() {
    shouldResetState = false;    
    window.oWindow.close();
    window.oWindow = null;
    window.__doPostBack(window.dashboardTabStripUniqueID);
}

//Handles whether the button click was renaming or adding and swaps its state after.
function OnButtonClicked(button) {
    var tabTextBox = window.$find(window.tabTextBoxID);
    if (tabTextBox.get_value() != "") {
        var tabsListBox = window.$find(window.tabsListBoxID);
        tabsListBox.trackChanges();
        if (button.get_text() == "Rename Tab") {
            var newName = tabTextBox.get_value();

            if (newName) {
                tabsListBox.get_selectedItem().set_text(newName);
            }
        }
        else if (button.get_text() == "Add Tab") {
            var item = new window.Telerik.Web.UI.RadListBoxItem();
            item.set_text(tabTextBox.get_value());
            item.set_value("RadTab_" + GenerateUniqueID());
            tabsListBox.get_items().add(item);
        }
        tabsListBox.commitChanges();
        tabTextBox.clear();
        tabsListBox.clearSelection();
    }
}

var rlbDeleteAlive = true;
var rlbMoveDownAlive = true;
var rlbMoveUpAlive = true;

//Sets up initially-disabled buttons. Shouldn't be able to delete or move home tab, only rename.
function OnClientLoad(radListBox) {
    var listboxItem = radListBox.get_selectedItem();
    var $ = window.$telerik.$;

    if (listboxItem == null || listboxItem.get_value() == "RadTab_Home") {
        $(".rlbDelete", $(".rlbButtonAreaRight")[0]).die();
        rlbDeleteAlive = false;
        $(".rlbDelete").addClass("rlbDeleteDisabled rlbDisabled");
        $(".rlbMoveDown", $(".rlbButtonAreaRight")[0]).die();
        rlbMoveDownAlive = false;
        $(".rlbMoveDown").addClass("rlbMoveDownDisabled rlbDisabled");
    }
    else {
        if (rlbDeleteAlive == false) {
            $(".rlbDelete", $(".rlbButtonAreaRight")[0]).live("click", function(e) {
                sender._onDeleteClick(e);
                e.preventDefault();
            });
            rlbDeleteAlive = true;
        }
    }
}

//Ensures that the buttons stay correct when selecting different items.
function OnClientSelectedIndexChanged(sender, eventArgs) {
    var clickedItem = eventArgs.get_item();
    var $ = window.$telerik.$;
    if (clickedItem == null || clickedItem.get_value() == "RadTab_Home") {
        $(".rlbDelete", $(".rlbButtonAreaRight")[0]).die();
        rlbDeleteAlive = false;
        $(".rlbDelete").addClass("rlbDeleteDisabled rlbDisabled");

        $(".rlbMoveDown", $(".rlbButtonAreaRight")[0]).die();
        rlbMoveDownAlive = false;
        $(".rlbMoveDown").addClass("rlbMoveDownDisabled rlbDisabled");
    }
    else if (window.$find(window.tabsListBoxID).get_selectedIndex() == 1) {
        $(".rlbMoveUp", $(".rlbButtonAreaRight")[0]).die();
        rlbMoveUpAlive = false;
        $(".rlbMoveUp").addClass("rlbMoveUpDisabled rlbDisabled");

        if (rlbDeleteAlive == false) {
            $(".rlbDelete", $(".rlbButtonAreaRight")[0]).live("click", function(e) {
                sender._onDeleteClick(e);
                e.preventDefault();
            });
            rlbDeleteAlive = true;
        }
        
        if( rlbMoveDownAlive == false) {
            $(".rlbMoveDown", $(".rlbButtonAreaRight")[0]).live("click", function (e) {
                sender._onMoveDownClick(e);
                e.preventDefault();
            });
            rlbMoveDownAlive = true; 
        }
    }
    else {
        if (rlbDeleteAlive == false) {
            $(".rlbDelete", $(".rlbButtonAreaRight")[0]).live("click", function (e) {
                sender._onDeleteClick(e);
                e.preventDefault();
            });
            rlbDeleteAlive = true;
        }

        if (rlbMoveDownAlive == false) {
            $(".rlbMoveDown", $(".rlbButtonAreaRight")[0]).live("click", function(e) {
                sender._onMoveDownClick(e);
                e.preventDefault();
            });
            rlbMoveDownAlive = true;
        }

        if (rlbMoveUpAlive == false) {
            $(".rlbMoveUp", $(".rlbButtonAreaRight")[0]).live("click", function(e) {
                sender._onMoveUpClick(e);
                e.preventDefault();
            });
            rlbMoveUpAlive = true;
        }
    }
}

//Creates GUID-Like items in JavaScript.
function GenerateUniqueID() {
    var S4 = function () { return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1); };
    return (S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4());
}