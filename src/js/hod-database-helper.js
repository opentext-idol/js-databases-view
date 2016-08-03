define([
    'js-whatever/js/escape-hod-identifier'
], function(escapeHodIdentifier) {
    "use strict";
    
    return {
        getDatabaseAttributes: function () {
            return ['name', 'domain']
        },

        getDatabaseIdentifier: function (item) {
            return escapeHodIdentifier(item.domain) + ':' + escapeHodIdentifier(item.name);
        }
    };
});