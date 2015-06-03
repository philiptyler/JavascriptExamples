(function ($) {

    // Populate report grid - run report (normal view)
    function reportNormalView($src, reportID, postData) {
        $('#Loading').show();

        $src.GridUnload();
        $src.empty();

        // create the table element which will hold the grid...        
        var $grid = $('<table id="ReportGrid"></table>').appendTo($src);
        // create the div element which will hold the pager...
        var $pager = $('<div id="pager"></div>').appendTo($src);

        $.ajax({
            url: '../../ReportViewer/PrepareGrid/',
            dataType: 'json',
            data: {
                reportID: reportID
            },
            type: 'post',
            complete: function () {
                $('#Loading').hide();
            },
            success: function (e) {
                // combine the default jqGrid settings with the returned settings by the ajax call...
                var jqSettings = $.extend({}, e, {
                    url: '../../ReportViewer/ReportData/' + reportID,
                    datatype: 'json',
                    cellEdit: false,
                    gridview: true,
                    hidegrid: false,
                    loadui: 'block',
                    mtype: 'post',
                    pager: $pager,
                    postData: postData,
                    rowList: [10, 20, 30, 40, 50],
                    rowNum: 20,
                    shrinkToFit: false,
                    viewrecords: true,
                    width: $(window).width() - 20, //$src.width() returns incorrect value when grid not visible.
                    height: '480px',
                    gridComplete: function () {
                        $grid.find('td[role="gridcell"]').css({ 'white-space': 'normal' });
                    },
                    loadComplete: function () {
                        // the grid's userdata refers to the groups of the report. 
                        // disable the 'Show Detail' checkbox if the report has no groupings...
                        var userdata = $grid.getGridParam('userData');
                        if (userdata && userdata.length > 1) {
                            $('#ShowDetailsLabel').removeAttr('disabled');
                            $('#ShowDetails').removeAttr('disabled');
                        }
                        else {
                            $('#ShowDetailsLabel').attr('disabled', 'disabled');
                            $('#ShowDetails').attr('disabled', 'disabled');
                        }
                        var postdata = $grid.getGridParam('postData');
                        $grid.setGridParam({ postData: { showDetails: postdata.showDetails, forceRefresh: false} });
                    },
                    loadError: function () {
                        window.alert('An error was encountered while trying to load the report.');
                    },
                    onSelectRow: function () {
                        $grid.resetSelection();
                    }
                });
                // initialize the jqgrid...
                try {
                    $grid.jqGrid(jqSettings);
                }
                catch (err) {
                    window.alert('The report is empty or the settings is incomplete. Complete all the required fields in creating or editing the report.');
                }
            },
            error: function (e) {
                window.alert('An error was encountered while trying to initialize the report grid.');
            }
        });
    }

    function getReportStatus() {

        $('#CacheStatusLoadingLabel').empty();
        $("#lblCacheStatus").text('');
    }

    function getLastCachedDate() {

        $('#CacheStatusLoadingLabel').empty();
        $("#lblLastCached").text('');
    }

    $.fn.reportViewer = function (reportID, reportName) {

        var $src = this;
        $src.each(function () {

            var $this = $(this);
            reportNormalView($this, reportID);
            getReportStatus();
            getLastCachedDate(reportID);

            // adjust the width of the grid to match it's placeholder...
            $(window).resize(function () {
                try {
                    var windowWidth = $(window).width();
                    var windowHeight = $(window).height();
                    var prevHeight = $(window).data('PREV_HEIGHT');
                    var prevWidth = $(window).data('PREV_WIDTH');

                    if (prevWidth == windowWidth && prevHeight == windowHeight)
                        return;

                    var $grid = $('#ReportGrid', $this);
                    var $pager = $('#pager', $this);

                    var newWidth = $this.width();
                    $grid.setGridWidth(newWidth, false);
                    $pager.width(newWidth);
                    $(window).data('PREV_HEIGHT', windowHeight);
                    $(window).data('PREV_WIDTH', windowWidth);
                }
                catch (err) {
                }
            });

            /// EVENT HANDLERS - start ///

            // Export to PDF or CSV event handler
            $('#ExportCommand').click(function () {
                var exportFormat = $('#ExportFormat').val();

                $.ajax({
                    type: 'GET',
                    url: '../../Common/IsSessionAlive',
                    success: function (a) {

                        //  If the controller returns true we're OK to download, otherwise refresh to redirect to login.
                        if (a === true) {
                            $('<iframe>', {
                                src: '../../ReportViewer/Export?reportID=' + $('#ReportID').val() + '&format=' + exportFormat,
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

            });

            // Show Report Details event handler
            $('#ShowDetails').click(function () {
                var $grid = $('#ReportGrid', $this);
                $grid.setGridParam({ postData: { showDetails: this.checked, forceRefresh: false} });
                $grid.trigger("reloadGrid");
            });

            // Force refresh event handler
            $('#ForceRefresh').click(function () {
                if ($('#ChartType').is(':checked')) {
                    $('#ChartType').attr('disabled', 'disabled');

                    try {
                        $("#ReportPlaceHolder").css('display', 'none');
                        FetchChart(reportID, reportName, true);
                    }
                    finally {
                        $('#ChartType').removeAttr('disabled');
                    }
                }
                else {
                    var postdata = { showDetails: $('#ShowDetails').is(':checked'), forceRefresh: true };
                    reportNormalView($this, reportID, postdata);
                }
            });

            $('#ChartType').click(function () {
                $('#ChartType').attr('disabled', true);
                if (this.checked) {
                    try {
                        $('#ReportPlaceHolder').hide();
                        FetchChart(reportID, reportName, false);
                    }
                    finally {
                        $('#ChartType').removeAttr('disabled');
                    }
                }
                else {
                    $('#ReportChart').hide();
                    $('#ReportPlaceHolder').show();
                    $('#ChartType').removeAttr('disabled');
                }
            });
            /// EVENT HANDLERS - end ///            
        });
    };
})(jQuery);

$(document).ready(function () {
    var reportID = $('#ReportID').attr('value');
    var reportName = $('#ReportName').attr('value');

    $('#ReportPlaceHolder').reportViewer(reportID, reportName);
});

function FetchChart(reportID, reportName, shouldRefresh) {
    $('#ReportChart').hide();
    $('#LoadingPanel').show();
    var chartWidth = $("#ReportContainer").width();
    var padding = 60; //Magic number for now... would be nice to generate proper height 100% mathematically.
    var chartHeight = $(window).height() - $('#ReportToolbar').height() - $('#CacheStatusAndInterval').height() - padding;

    $('#ReportChart').bind('load', function () {
        $('#LoadingPanel').hide();
        $(this).unbind('load');
        $(this).show();
    }).bind('error', function () {
        $('#LoadingPanel').hide();
        $(this).unbind('error');
        alert("An issue was encountered while loading " + reportName);
    }).attr('src', '../../Chart/CustomChart?ReportID=' + reportID + '&WindowWidth=' + chartWidth + '&WindowHeight=' + chartHeight + '&RefreshData=' + shouldRefresh);
}