/*
 * Copyright 2015-2017 Hewlett Packard Enterprise Development Company, L.P.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
 */

/**
 * @module databases-view/js/idol-databases-collection
 */
define([
    'backbone'
], function(Backbone) {
    'use strict';

    /**
     * @name module:databases-view/js/idol-databases-collection.DatabasesCollection
     * @desc Collection representing a set of Idol databases. Each model must have a name attribute.
     * @constructor
     * @extends Backbone.Collection
     */
    return Backbone.Collection.extend(/** @lends module:databases-view/js/idol-databases-collection.DatabasesCollection.prototype */{
        modelId: function(attributes) {
            return attributes.name;
        }
    });
});
