/*
 * Copyright 2016-2017 Hewlett Packard Enterprise Development Company, L.P.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
 */

define([
    'js-whatever/js/escape-hod-identifier'
], function(escapeHodIdentifier) {
    'use strict';

    return {
        getDatabaseAttributes: function() {
            return ['name', 'domain']
        },

        getDatabaseIdentifier: function(item) {
            return escapeHodIdentifier(item.domain) + ':' + escapeHodIdentifier(item.name);
        }
    };
});
