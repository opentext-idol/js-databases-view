define([
    'databases-view/js/hod-databases-collection'
], function(DatabasesCollection) {

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
