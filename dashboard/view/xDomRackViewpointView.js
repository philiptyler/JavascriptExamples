define(function() {
    'use strict';

    var RackViewPointView = Marionette.ItemView.extend({
        tagName: 'viewpoint',
        // No template is being used. Just on line of html.
        // But because it is using a ItemView I need to add this tag.
        // I am keeping it an itemView in order to use a collectionView to help render it
        template: _.template(''),

        modelEvents: {
            'change:setBind': '_changeSetBind'
        },

        attributes: function() {
            return {
                id: this.model.get('id'),
                centerOfRotation: this.model.get('centerOfRotation'),
                position: this.model.get('position'),
                orientation: this.model.get('orientation'),
                fieldOfView: this.model.get('fieldOfView')
            };
        },

        // Any changes to the model's setBind attibute will change the el's 'set_bind' attribute
        _changeSetBind: function(model, setBind) {
            this.el.setAttribute('set_bind', setBind);
        }

    });

    return RackViewPointView;
});