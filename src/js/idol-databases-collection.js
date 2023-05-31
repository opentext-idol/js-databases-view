/*
 * Copyright 2015-2017 Open Text.
 *
 * Licensed under the MIT License (the "License"); you may not use this file
 * except in compliance with the License.
 *
 * The only warranties for products and services of Open Text and its affiliates
 * and licensors ("Open Text") are as may be set forth in the express warranty
 * statements accompanying such products and services. Nothing herein should be
 * construed as constituting an additional warranty. Open Text shall not be
 * liable for technical or editorial errors or omissions contained herein. The
 * information contained herein is subject to change without notice.
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
