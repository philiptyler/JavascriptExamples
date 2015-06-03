/* Summary:
 * This is a Backbone model that represents all the data needed to render the planView Tab.
 * The menu, planView, Tooltip and leader board region views depend on Component data from
 * the server.  This model retreives and syncs Component objects with the server.
 */

define(['dashboard/collection/xDomRacks'],
  function (XdomRacks) {
      'use strict';

      var planViewModel = Backbone.Model.extend({
          defaults: function () {
              return {
                  component: null,
                  dataCenterID: null,
                  invalidComponent: false,
                  loading: false
              };
          },
          
          racks: null,

          /* MARIONETTE FUNCTIONS */
          /************************/

          initialize: function (options) {
              this.racks = new XdomRacks();
              this.set('component', options.component);
              this._setupEventCallbacks();
              this._loadPlanViewRacks();
          },

          /* PUBLIC FUNCTIONS */
          /********************/

          getComponentID: function () {
              return this.get('component').get('id');
          },

          getComponentName: function () {
              return this.get('component').get('name');
          },

          forceReload: function () {
              this.set('dataCenterID', null);
              this._loadPlanViewRacks();
          },

          /* PRIVATE FUNCTIONS */
          /*********************/

          // Setup events for loading racks and when the user changes the selected component
          _setupEventCallbacks: function () {
              this.listenTo(this, 'change:component', this._reloadPlanViewRacks);
              this.listenTo(this.racks, 'serverWarning serverError ajaxError', this._setInvalid);
              this.listenTo(this.racks, 'racksLoaded', this._afterRacksLoaded);
          },
          
          _loadPlanViewRacks: function() {
              this._reloadPlanViewRacks(this, this.get('component'));
          },

          // Check if the component ID is valid, then change the state of the model to loading if
          // a new datacenter planview needs to be loaded
          _reloadPlanViewRacks: function (model, component) {
              if (_.isNaN(component.id) || component.id <= 0) {
                  this._setInvalid();
              } else if (this.get('dataCenterID') !== component.get('dataCenterID')) {
                  this._setLoading();
                  this.racks.refresh(component.id, { includeAlerts: true });
              } //else do nothing because the newly selected component is in the same data center that is already displayed
          },

          // Callback after the racks are loaded from the server
          // if rackWarningsCount is negative then none of the racks loaded
          // had valid data to be displayed in 3D
          _afterRacksLoaded: function (rackWarningsCount, dataCenterID) {
              if (rackWarningsCount >= 0) {
                  this.set({ dataCenterID: dataCenterID });
                  this.set({ loading: false });
              } else {
                  this._setInvalid();
              }
          },

          // Set state variables if the component is not valid DC or under a DC
          _setInvalid: function () {
              this.set({ loading: false, invalidComponent: true, dataCenterID: null });
          },

          // Reset state variables when loading for a newly selected component
          _setLoading: function () {
              this.set({ loading: true, invalidComponent: false });
          }
      });

      return planViewModel;
  });