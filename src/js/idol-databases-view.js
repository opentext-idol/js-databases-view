/**
 * @module databases-view/js/idol-databases-view
 */
define([
    'backbone',
    'jquery',
    'underscore',
    'databases-view/js/databases-view'
], function(Backbone, $, _, DatabasesView) {
    "use strict";
    
    return DatabasesView.extend({
        /**
         * @desc Template for an individual database. The element which will respond to user interaction must have
         * class database-input. The name of the database must be in a data-name attribute.
         * @abstract
         * @method
         */
        databaseTemplate: $.noop,

        getCurrentSelection: function (collection) {
            return collection.map(function (model) {
                return {
                    name: model.get('name')
                };
            });
        },

        getSelectedIndexData: function (item) {
            return {
                name: item.name
            };
        },

        getSelectedIndexDataFromModel: function (model) {
            return model.pick('name');
        },

        findInCurrentSelectionArguments: function ($checkbox) {
            return {
                name: $checkbox.attr('data-name')
            };
        },
        
        getDatabaseIdentifier: function (item) {
            return item.name;
        },

        selectedItemsEquals: function (item1, item2) {
            return item1.name === item2.name;
        }
    });
});