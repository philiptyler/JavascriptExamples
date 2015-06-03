require([
        '../Scripts/common/main'
], function () {

    //  All sub-main modules will require master.js be loaded before initializing themselves.
    require(['common/master'],
        function () {

            $("#ContentPlaceHolder").removeClass('loading');

            require(['dashboard/view/toDoWidgetView', 'dashboard/model/toDoWidget'],
              function (ToDoWidgetView, ToDoWidget) {
                  var toDoWidgetModel = new ToDoWidget();
                  var view = new ToDoWidgetView({ model: toDoWidgetModel });
                  view.render();
              });

            require(['dashboard/view/jsRadDockView',
                      'alertify'],
               function (JSRadDockView, Alertify) {
                   var jsView = new JSRadDockView();
                   jsView.render();

                   // Because dashboard.js queues up many resize events on one page resize it's important to only run
                   // my jsRadDockView render() after the queues are empty.  This signal -> start double event system
                   // solves that problem.
                   function setupRedraw() {
                       window.dashboardEvents.one(window.dashboardEvents.events.startRedraw, function () {
                           jsView.cleanup();
                           jsView.render();
                       });
                   }

                   function setupResize() {
                       window.dashboardEvents.one(window.dashboardEvents.events.startResize, function () {
                           jsView.cleanup();
                           jsView.render();
                       });
                   }

                   function setupTab() {
                       jsView.cleanup();
                       window.dashboardEvents.one(window.dashboardEvents.events.startTab, function () {
                           jsView.render();
                       });
                   }

                   function setupDropped(event, DockZoneID) {
                       window.dashboardEvents.one(window.dashboardEvents.events.startDropped, function () {
                           jsView.addOneView(DockZoneID);
                       });
                   }

                   function resizeDockAfterMove(event, DockZoneID) {
                       jsView.addOneView(DockZoneID);
                   }

                   function showLoadWarning(event, message, duration) {
                       Alertify.warn(message, duration);
                   }

                   function showLoadError(event, message, duration) {
                       Alertify.error(message, duration);
                   }

                   // When a user changes the window size (for example) a signal event is triggered,
                   // once the resize queue is empty and telerik is done re-adding to the DOM a start
                   // event is triggered which is handled once and redraws the JS widgets to the DOM
                   window.dashboardEvents.on(window.dashboardEvents.events.signalRedraw, setupRedraw);
                   window.dashboardEvents.on(window.dashboardEvents.events.signalResize, setupResize);
                   window.dashboardEvents.on(window.dashboardEvents.events.signalTab, setupTab);
                   window.dashboardEvents.on(window.dashboardEvents.events.signalDropped, setupDropped);
                   window.dashboardEvents.on(window.dashboardEvents.events.dockChanged, resizeDockAfterMove);
                   window.dashboardEvents.one(window.dashboardEvents.events.loadWarning, showLoadWarning);
                   window.dashboardEvents.one(window.dashboardEvents.events.loadError, showLoadError);
                   window.dashboardEvents.on(window.dashboardEvents.events.cleanupView, jsView.cleanupView.bind(jsView));

                   window.dashboardEvents.canSaveDashboard = function() {
                       return jsView.allWidgetsReadyForSave();
                   };
               });
        });
});