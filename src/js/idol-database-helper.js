define([], function() {
    "use strict";
    
    return {
        getDatabaseAttributes: function () {
            return ['name']
        },
        
        getDatabaseIdentifier: function (item) {
            return item.name;
        }
    };
});