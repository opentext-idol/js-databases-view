/*
 * (c) Copyright 2015-2017 Micro Focus or one of its affiliates.
 *
 * Licensed under the MIT License (the "License"); you may not use this file
 * except in compliance with the License.
 *
 * The only warranties for products and services of Micro Focus and its affiliates
 * and licensors ("Micro Focus") are as may be set forth in the express warranty
 * statements accompanying such products and services. Nothing herein should be
 * construed as constituting an additional warranty. Micro Focus shall not be
 * liable for technical or editorial errors or omissions contained herein. The
 * information contained herein is subject to change without notice.
 */

define([
    'databases-view/js/hod-databases-collection'
], function(DatabasesCollection) {
    'use strict';

    describe('Databases collection', function() {
        beforeEach(function() {
            this.collection = new DatabasesCollection([
                {name: 'database1', domain: 'domain1'},
                {name: 'database2', domain: 'domain2'}
            ]);
        });

        it('converts to resource identifiers', function() {
            var resourceIdentifiers = this.collection.toResourceIdentifiers();
            expect(resourceIdentifiers).toHaveLength(2);
            expect(resourceIdentifiers).toContain({name: 'database1', domain: 'domain1'});
            expect(resourceIdentifiers).toContain({name: 'database2', domain: 'domain2'});
        });
    });
});
