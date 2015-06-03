/* Summary:
 * This is a Backbone model that represents all the data needed to render the x3dom.js 3D Rack View.
 */

define([],
  function () {
      'use strict';

      var XdomDataCenterModel = Backbone.Model.extend({
          defaults: {
              componentID: -1,
              dataCenterID: -1,
              racks: null,
              maxRacksToRenderNames: 60,

              zoomValue: -1,
              zoomMax: 0,
              zoomMin: -1,

              refreshInterval: null,
              refreshDelay: 30000
          },

          /* MARIONETTE FUNCTIONS */
          /************************/

          onDestroy: function () {
              this.cleanup();
          },

          /* PUBLIC FUNCTIONS */
          /********************/

          // Callback after the racks are loaded from the server
          // if rackWarningsCount is negative then none of the racks loaded
          // had valid data to be displayed in 3D
          finalizeRacks: function () {
              if (this.get('racks').length < this.get('maxRacksToRenderNames')) {
                  this.get('racks').invoke('set', { 'renderName': true });
              } else {
                  this.trigger('cannotRenderNames');
              }
              this._setupRefreshInterval();
          },

          cleanup: function () {
              clearInterval(this.get('refreshInterval'));
          },

          /* PRIVATE FUNCTIONS */
          /*********************/

          // So this.racks' data stays synced with the server
          _setupRefreshInterval: function () {
              var componentID = this.get('componentID');
              this.set('refreshInterval', setInterval(function () {
                  this.get('racks').refresh(componentID, { includeAlerts: true });
              }.bind(this), this.get('refreshDelay')));
          },
      });

      return XdomDataCenterModel;
  });