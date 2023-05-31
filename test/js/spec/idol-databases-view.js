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

define([
    'underscore',
    'backbone',
    'databases-view/js/databases-view',
    'databases-view/js/idol-databases-collection',
    'databases-view/js/idol-database-helper',
    'jasmine-jquery'
], function(_, Backbone, DatabasesView, DatabasesCollection, databaseHelper) {
    'use strict';

    var EMPTY_MESSAGE = 'There are no databases';
    var TOP_LEVEL_DISPLAY_NAME = 'All the things';

    var TestDatabaseView = DatabasesView.extend({
        categoryTemplate: _.template('<div><input type="checkbox" data-category-id="<%-data.node.name%>" class="category-input"> <%-data.node.displayName%><div class="child-categories"></div></div>'),
        databaseTemplate: _.template('<input type="checkbox" data-name="<%-data.name%>" class="database-input"> <%-data.name%>'),
        check: function($input) {
            $input.prop('checked', true);
        },
        uncheck: function($input) {
            $input.prop('checked', false);
        },
        enable: function($input) {
            $input.prop('disabled', false);
        },
        disable: function($input) {
            $input.prop('disabled', true);
        },
        determinate: function($input) {
            $input.prop('indeterminate', false);
        },
        indeterminate: function($input) {
            $input.prop('indeterminate', true);
        }
    });

    var testSelection = function(selectedDatabasesCollection, expectedSelection) {
        expect(selectedDatabasesCollection.length).toEqual(expectedSelection.length);

        _.each(expectedSelection, function(expected) {
            expect(selectedDatabasesCollection.findWhere({name: expected})).toBeDefined();
        });
    };

    describe('IDOL Databases View', function() {
        beforeEach(function() {
            this.databasesCollection = new DatabasesCollection();
            this.selectedDatabasesCollection = new DatabasesCollection();
        });

        describe('when the databases arrive after initialisation', function() {
            describe('without an initial selection', function() {
                beforeEach(function() {
                    var databases = [
                        {id: 'DB1', name: 'DB1'},
                        {id: 'DB2', name: 'DB2'},
                        {id: 'DB3', name: 'DB3'},
                        {id: 'DB4', name: 'DB4'}
                    ];

                    this.databasesCollection = new DatabasesCollection(databases);
                    this.selectedDatabasesCollection = new DatabasesCollection(databases);

                    this.databasesView = new TestDatabaseView({
                        databasesCollection: this.databasesCollection,
                        emptyMessage: EMPTY_MESSAGE,
                        selectedDatabasesCollection: this.selectedDatabasesCollection,
                        topLevelDisplayName: TOP_LEVEL_DISPLAY_NAME,
                        databaseHelper: databaseHelper
                    });

                    this.databasesView.render();

                    this.databasesCollection.reset(databases);
                });

                it('should hide the loading spinner', function() {
                    expect(this.databasesView.$('.databases-processing-indicator')).toHaveClass('hide');
                });

                it('should not show the empty message', function() {
                    expect(this.databasesView.$('.no-active-databases')).toHaveClass('hide');
                });

                it('should show the list of databases', function() {
                    expect(this.databasesView.$('.databases-list')).not.toHaveClass('hide');
                });

                it('should render the databases', function() {
                    expect(this.databasesView.$('.database-input')).toHaveLength(4);
                });

                it('should start with no checkboxes checked', function() {
                    expect(this.databasesView.$('.database-input:checked')).toHaveLength(0);
                });

                it('should start with all databases selected', function() {
                    testSelection(this.selectedDatabasesCollection, ['DB1', 'DB2', 'DB3', 'DB4']);
                });

                it('should not have selected the all checkbox', function() {
                    expect(this.databasesView.$('[data-category-id="all"]')).not.toHaveProp('checked', true);
                });

                describe('after selecting a database', function() {
                    beforeEach(function() {
                        this.databasesView.selectDatabase({name: 'DB1'}, true);
                    });

                    it('should have one checkbox checked', function() {
                        expect(this.databasesView.$('.database-input:checked')).toHaveLength(1);
                    });

                    it('should have one database selected', function() {
                        testSelection(this.selectedDatabasesCollection, ['DB1']);
                    });

                    it('should hide the loading spinner', function() {
                        expect(this.databasesView.$('.databases-processing-indicator')).toHaveClass('hide');
                    });

                    it('should not show the empty message', function() {
                        expect(this.databasesView.$('.no-active-databases')).toHaveClass('hide');
                    });

                    it('should show the list of databases', function() {
                        expect(this.databasesView.$('.databases-list')).not.toHaveClass('hide');
                    });

                    describe('and then selecting another database', function() {
                        beforeEach(function() {
                            this.databasesView.selectDatabase({name: 'DB2'}, true);
                        });

                        it('should have two checkboxes checked', function() {
                            expect(this.databasesView.$('.database-input:checked')).toHaveLength(2);
                        });

                        it('should have all databases selected', function() {
                            testSelection(this.selectedDatabasesCollection, ['DB1', 'DB2']);
                        });

                        it('should not have selected the all checkbox', function() {
                            expect(this.databasesView.$('[data-category-id="all"]')).not.toHaveProp('checked', true);
                        });
                    });
                });
            });
        });

        describe('with a filter model', function() {
            beforeEach(function() {
                var databases = [
                    {id: 'DB1', name: 'onion beverages'},
                    {id: 'DB2', name: 'cloud interpretations'},
                    {id: 'DB3', name: 'concrete'},
                    {id: 'DB4', name: 'anions'}
                ];

                this.databasesCollection = new DatabasesCollection(databases);
                this.selectedDatabasesCollection = new DatabasesCollection(databases);

                this.filterModel = new Backbone.Model();

                this.visibleIndexesCallback = jasmine.createSpy('visibleIndexesCallback');

                this.databasesView = new TestDatabaseView({
                    databasesCollection: this.databasesCollection,
                    emptyMessage: EMPTY_MESSAGE,
                    visibleIndexesCallback: this.visibleIndexesCallback,
                    filterModel: this.filterModel,
                    selectedDatabasesCollection: this.selectedDatabasesCollection,
                    topLevelDisplayName: TOP_LEVEL_DISPLAY_NAME,
                    databaseHelper: databaseHelper
                });

                this.databasesView.render();

                this.databasesCollection.reset(databases);
            });

            it('should show all databases', function() {
                expect(this.databasesView.$('.database-input')).toHaveLength(4);
            });

            it('should display all the indexes incompletely matched by the filter', function() {
                this.filterModel.set('text', 'ions');
                expect(this.databasesView.$('.database-input')).toHaveLength(2);
            });

            it('should call the visibleIndexesCallback with the correct databases', function() {
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
