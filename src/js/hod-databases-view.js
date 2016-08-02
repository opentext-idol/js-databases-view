/**
 * @module databases-view/js/hod-databases-view
 */
define([
    'backbone',
    'jquery',
    'underscore',
    'databases-view/js/databases-view',
    'js-whatever/js/escape-hod-identifier'
], function(Backbone, $, _, DatabasesView, escapeHodIdentifier) {
    "use strict";
    
    /**
     * @typedef ResourceIdentifier
     * @property {string} name The name of the resource
     * @property {string} domain The domain of the resource
     */
    return DatabasesView.extend({
        /**
         * @desc Template for an individual database. The element which will respond to user interaction must have
         * class database-input. The name of the database must be in a data-name attribute. The name of the domain must
         * be in a data-domain attribute
         * @abstract
         * @method
         */
        databaseTemplate: $.noop,

        getCurrentSelection: function (collection) {
            return collection.toResourceIdentifiers();
        },
        
        getSelectedIndexData: function (item) {
            return {
                name: item.name,
                domain: item.domain
            };
        },
        
        getSelectedIndexDataFromModel: function (model) {
            return model.pick('domain', 'name');
        },
        
        findInCurrentSelectionArguments: function ($checkbox) {
            return {
                name: $checkbox.attr('data-name'),
                domain: $checkbox.attr('data-domain')
            };
        },

        getDatabaseIdentifier: function (item) {
            return escapeHodIdentifier(item.domain) + ':' + escapeHodIdentifier(item.name);
        },
        
        selectedItemsEquals: function (item1, item2) {
            return item1.name === item2.name && item1.domain === item2.domain;
        }
    });
});