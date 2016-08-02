/*
 * Copyright 2015 Hewlett-Packard Development Company, L.P.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
 */

define([
    'databases-view/js/idol-databases-view',
    'databases-view/js/idol-databases-collection',
    'backbone',
    'underscore',
    'jasmine-jquery'
], function (DatabasesView, DatabasesCollection, Backbone, _) {

    var EMPTY_MESSAGE = 'There are no databases';
    var TOP_LEVEL_DISPLAY_NAME = 'All the things';

    var TestDatabaseView = DatabasesView.extend({
        categoryTemplate: _.template('<div><input type="checkbox" data-category-id="<%-data.node.name%>" class="category-input"> <%-data.node.displayName%><div class="child-categories"></div></div>'),
        databaseTemplate: _.template('<input type="checkbox" data-name="<%-data.name%>" class="database-input"> <%-data.name%>'),
        check: function ($input) {
            $input.prop('checked', true);
        },
        uncheck: function ($input) {
            $input.prop('checked', false);
        },
        enable: function ($input) {
            $input.prop('disabled', false);
        },
        disable: function ($input) {
            $input.prop('disabled', true);
        },
        determinate: function ($input) {
            $input.prop('indeterminate', false);
        },
        indeterminate: function ($input) {
            $input.prop('indeterminate', true);
        }
    });

    var testSelection = function (selectedDatabasesCollection, expectedSelection) {
        expect(selectedDatabasesCollection.length).toEqual(expectedSelection.length);

        _.each(expectedSelection, function (expected) {
            expect(selectedDatabasesCollection.findWhere({name: expected})).toBeDefined();
        });
    };

    describe('Idol Databases view', function () {
        describe('when not forcing selections', function () {
            describe('without an initial selection', function () {
                beforeEach(function () {
                    var databases = [
                        {name: 'DB1'},
                        {name: 'DB2'}
                    ];

                    this.selectedDatabasesCollection = new DatabasesCollection(databases);
                    this.databasesCollection = new DatabasesCollection(databases);

                    this.databasesView = new TestDatabaseView({
                        databasesCollection: this.databasesCollection,
                        emptyMessage: EMPTY_MESSAGE,
                        selectedDatabasesCollection: this.selectedDatabasesCollection,
                        topLevelDisplayName: TOP_LEVEL_DISPLAY_NAME
                    });

                    this.databasesView.render();
                });

                it('should render the databases', function () {
                    expect(this.databasesView.$('.database-input')).toHaveLength(2);
                });

                it('should start with no checkboxes checked', function () {
                    expect(this.databasesView.$('.database-input:checked')).toHaveLength(0);
                });

                it('should start with all databases selected', function () {
                    testSelection(this.selectedDatabasesCollection, ['DB1', 'DB2']);
                });

                it('should not have selected the all checkbox', function () {
                    expect(this.databasesView.$('[data-category-id="all"]')).not.toHaveProp('checked', true);
                });

                describe('after selecting a database', function () {
                    beforeEach(function () {
                        this.databasesView.selectDatabase({name: 'DB1'}, true);
                    });

                    it('should have one checkbox checked', function () {
                        expect(this.databasesView.$('.database-input:checked')).toHaveLength(1);
                    });

                    it('should have one database selected', function () {
                        testSelection(this.selectedDatabasesCollection, ['DB1']);
                    });

                    it('should mark the category checkbox indeterminate', function () {
                        expect(this.databasesView.$('.category-input')).toHaveProp('indeterminate', true);
                    });

                    describe('and then selecting another database', function () {
                        beforeEach(function () {
                            this.databasesView.selectDatabase({name: 'DB2'}, true);
                        });

                        it('should have two checkboxes checked', function () {
                            expect(this.databasesView.$('.database-input:checked')).toHaveLength(2);
                        });

                        it('should have all databases selected', function () {
                            testSelection(this.selectedDatabasesCollection, ['DB1', 'DB2']);
                        });

                        it('should have selected the all checkbox', function () {
                            expect(this.databasesView.$('[data-category-id="all"]')).toHaveProp('checked', true);
                        });
                    });
                });
            });

            describe('with an initial selection', function () {
                beforeEach(function () {
                    this.selectedDatabasesCollection = new DatabasesCollection([
                        {name: 'DB1'}
                    ]);

                    this.databasesCollection = new DatabasesCollection([
                        {name: 'DB1'},
                        {name: 'DB2'}
                    ]);

                    this.databasesView = new TestDatabaseView({
                        databasesCollection: this.databasesCollection,
                        emptyMessage: EMPTY_MESSAGE,
                        selectedDatabasesCollection: this.selectedDatabasesCollection,
                        topLevelDisplayName: TOP_LEVEL_DISPLAY_NAME
                    });

                    this.databasesView.render();
                });

                it('should render the databases', function () {
                    expect(this.databasesView.$('.database-input')).toHaveLength(2);
                });

                it('should start with one checkbox checked', function () {
                    expect(this.databasesView.$('.database-input:checked')).toHaveLength(1);
                });

                it('should start with the correct databases selected', function () {
                    testSelection(this.selectedDatabasesCollection, ['DB1']);
                });

                it('should not have selected the all checkbox', function () {
                    expect(this.databasesView.$('[data-category-id="all"]')).not.toHaveProp('checked', true);
                });
            });
        });

        describe('when forcing selections', function () {
            describe('without an initial selection', function () {
                beforeEach(function () {
                    var databases = [
                        {id: 'DB1', name: 'DB1'},
                        {id: 'DB2', name: 'DB2'}
                    ];

                    this.selectedDatabasesCollection = new DatabasesCollection(databases);
                    this.databasesCollection = new DatabasesCollection(databases);

                    this.databasesView = new TestDatabaseView({
                        databasesCollection: this.databasesCollection,
                        emptyMessage: EMPTY_MESSAGE,
                        forceSelection: true,
                        selectedDatabasesCollection: this.selectedDatabasesCollection,
                        topLevelDisplayName: TOP_LEVEL_DISPLAY_NAME
                    });

                    this.databasesView.render();
                });

                it('should render the databases', function () {
                    expect(this.databasesView.$('.database-input')).toHaveLength(2);
                });

                it('should start with all checkboxes checked', function () {
                    expect(this.databasesView.$('.database-input:checked')).toHaveLength(2);
                });

                it('should start with all databases selected', function () {
                    testSelection(this.selectedDatabasesCollection, ['DB1', 'DB2']);
                });

                it('should have selected the all checkbox', function () {
                    expect(this.databasesView.$('[data-category-id="all"]')).toHaveProp('checked', true);
                });

                it('should have disabled the all checkbox', function () {
                    expect(this.databasesView.$('[data-category-id="all"]')).toHaveProp('disabled', true);
                });

                describe('after deselecting a database', function () {
                    beforeEach(function () {
                        this.databasesView.selectDatabase({name: 'DB1'}, false);
                    });

                    it('should have one checkbox checked', function () {
                        expect(this.databasesView.$('.database-input:checked')).toHaveLength(1);
                    });

                    it('should have one database selected', function () {
                        testSelection(this.selectedDatabasesCollection, ['DB2']);
                    });

                    it('should have disabled the remaining database', function () {
                        expect(this.databasesView.$('.database-input[data-name="DB2"]')).toHaveProp('disabled', true);
                    });

                    it('should have unchecked the all checkbox', function () {
                        expect(this.databasesView.$('[data-category-id="all"]')).toHaveProp('checked', false);
                    });

                    it('should have enabled the all checkbox', function () {
                        expect(this.databasesView.$('[data-category-id="all"]')).toHaveProp('disabled', false);
                    });
                });
            });

            describe('with an initial selection', function () {
                beforeEach(function () {
                    this.selectedDatabasesCollection = new DatabasesCollection([
                        {name: 'DB1'}
                    ]);

                    this.databasesCollection = new DatabasesCollection([
                        {name: 'DB1'},
                        {name: 'DB2'},
                        {name: 'DB3'},
                        {name: 'DB4'}
                    ]);

                    this.databasesView = new TestDatabaseView({
                        databasesCollection: this.databasesCollection,
                        emptyMessage: EMPTY_MESSAGE,
                        forceSelection: true,
                        selectedDatabasesCollection: this.selectedDatabasesCollection,
                        topLevelDisplayName: TOP_LEVEL_DISPLAY_NAME
                    });

                    this.databasesView.render();
                });

                it('should render the databases', function () {
                    expect(this.databasesView.$('.database-input')).toHaveLength(4);
                });

                it('should start with one checkbox checked', function () {
                    expect(this.databasesView.$('.database-input:checked')).toHaveLength(1);
                });

                it('should start with the correct databases selected', function () {
                    testSelection(this.selectedDatabasesCollection, ['DB1']);
                });

                it('should have disabled the selected database', function () {
                    expect(this.databasesView.$('.database-input[data-name="DB1"]')).toHaveProp('disabled', true);
                });

                it('should not have selected the all checkbox', function () {
                    expect(this.databasesView.$('[data-category-id="all"]')).not.toHaveProp('checked', true);
                });
            });
        });

        describe('when the databases arrive after initialization', function () {
            describe('when not forcing selections', function () {
                describe('without an initial selection', function () {
                    beforeEach(function () {
                        var databases = [
                            {id: 'DB1', name: 'DB1'},
                            {id: 'DB2', name: 'DB2'},
                            {id: 'DB3', name: 'DB3'},
                            {id: 'DB4', name: 'DB4'}
                        ];

                        this.selectedDatabasesCollection = new DatabasesCollection(databases);
                        this.databasesCollection = new DatabasesCollection(databases);

                        this.databasesView = new TestDatabaseView({
                            databasesCollection: this.databasesCollection,
                            emptyMessage: EMPTY_MESSAGE,
                            selectedDatabasesCollection: this.selectedDatabasesCollection,
                            topLevelDisplayName: TOP_LEVEL_DISPLAY_NAME
                        });

                        this.databasesView.render();

                        this.databasesCollection.reset(databases);
                    });

                    it('should render the databases', function () {
                        expect(this.databasesView.$('.database-input')).toHaveLength(4);
                    });

                    it('should start with no checkboxes checked', function () {
                        expect(this.databasesView.$('.database-input:checked')).toHaveLength(0);
                    });

                    it('should start with all databases selected', function () {
                        testSelection(this.selectedDatabasesCollection, ['DB1', 'DB2', 'DB3', 'DB4']);
                    });

                    it('should not have selected the all checkbox', function () {
                        expect(this.databasesView.$('[data-category-id="all"]')).not.toHaveProp('checked', true);
                    });

                    describe('after selecting a database', function () {
                        beforeEach(function () {
                            this.databasesView.selectDatabase({name: 'DB1'}, true);
                        });

                        it('should have one checkbox checked', function () {
                            expect(this.databasesView.$('.database-input:checked')).toHaveLength(1);
                        });

                        it('should have one database selected', function () {
                            testSelection(this.selectedDatabasesCollection, ['DB1']);
                        });

                        describe('and then selecting another database', function () {
                            beforeEach(function () {
                                this.databasesView.selectDatabase({name: 'DB2'}, true);
                            });

                            it('should have two checkboxes checked', function () {
                                expect(this.databasesView.$('.database-input:checked')).toHaveLength(2);
                            });

                            it('should have all databases selected', function () {
                                testSelection(this.selectedDatabasesCollection, ['DB1', 'DB2']);
                            });

                            it('should not have selected the all checkbox', function () {
                                expect(this.databasesView.$('[data-category-id="all"]')).not.toHaveProp('checked', true);
                            });
                        });
                    });
                });
            });
        });

        describe('with a filter model', function () {
            beforeEach(function () {
                var databases = [
                    {id: 'DB1', name: 'onion beverages'},
                    {id: 'DB2', name: 'cloud interpretations'},
                    {id: 'DB3', name: 'concrete'},
                    {id: 'DB4', name: 'anions'}
                ];

                this.selectedDatabasesCollection = new DatabasesCollection(databases);
                this.databasesCollection = new DatabasesCollection(databases);

                this.filterModel = new Backbone.Model();

                this.visibleIndexesCallback = jasmine.createSpy('visibleIndexesCallback');

                this.databasesView = new TestDatabaseView({
                    databasesCollection: this.databasesCollection,
                    emptyMessage: EMPTY_MESSAGE,
                    visibleIndexesCallback: this.visibleIndexesCallback,
                    filterModel: this.filterModel,
                    selectedDatabasesCollection: this.selectedDatabasesCollection,
                    topLevelDisplayName: TOP_LEVEL_DISPLAY_NAME
                });

                this.databasesView.render();

                this.databasesCollection.reset(databases);
            });

            it('should show all databases', function () {
                expect(this.databasesView.$('.database-input')).toHaveLength(4);
            });

            it('should display all the indexes incompletely matched by the filter', function () {
                this.filterModel.set('text', 'ions');
                expect(this.databasesView.$('.database-input')).toHaveLength(2);
            });

            it('should call the visibleIndexesCallback with the correct databases', function () {
                this.filterModel.set('text', 'ions');
                expect(this.visibleIndexesCallback.calls.count()).toBe(1);

                var models = this.visibleIndexesCallback.calls.argsFor(0)[0];
                expect(models.length).toBe(2);

                var names = _.invoke(models, 'get', 'name');
                expect(names).toContain('cloud interpretations');
                expect(names).toContain('anions');
            })
        })
    });

});