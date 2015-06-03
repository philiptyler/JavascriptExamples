define([
    'text!dashboard/template/xDomRackTitleBar.html'
], function (RackTitleBarTemplate) {
    'use strict';

    var RackTitleBarView = Marionette.ItemView.extend({
        className: 'title-bar',
        tagName: 'p',
        template: _.template(RackTitleBarTemplate)

    });

    return RackTitleBarView;
});