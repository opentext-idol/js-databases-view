/*
 * Copyright 2015 Hewlett-Packard Development Company, L.P.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
 */

define([
    'databases-view/js/databases-view',
    'backbone',
    'underscore',
    'jasmine-jquery'
], function(DatabasesView, Backbone, _) {

    var EMPTY_MESSAGE = 'There are no databases';
    var TOP_LEVEL_DISPLAY_NAME = 'All the things';

    var DatabasesCollection = Backbone.Collection.extend({

        getResourceIdentifiers: function() {
            return this.map(function(model) {
                return model.pick('domain', 'name');
            })
        }

    });

    var TestDatabaseView = DatabasesView.extend({
        categoryTemplate: _.template('<div><input type="checkbox" data-category-id="<%-data.node.name%>" class="category-input"> <%-data.node.displayName%><div class="child-categories"></div></div>'),
        databaseTemplate: _.template('<input type="checkbox" data-name="<%-data.name%>" data-domain="<%-data.domain%>" class="database-input"> <%-data.name%>'),
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

    var childCategories = [
        {
            name: 'public',
            displayName: 'Public',
            filter: function (model) {
                return model.get('domain') === 'PUBLIC_INDEXES';
            }
        }, {
            name: 'private',
            displayName: 'Private',
            filter: function (model) {
                return model.get('domain') === 'PRIVATE_INDEXES';
            }
        }
    ];

    var testSelection = function(databasesView, expectedSelection) {
        var selection = databasesView.getSelection();

        expect(selection.length).toBe(expectedSelection.length);

        _.each(expectedSelection, function(expected) {
            expect(_.findWhere(selection, {name: expected})).toBeDefined();
        });
    };

    describe('Databases view', function() {
        describe('when not forcing selections', function() {
            describe('without child categories', function() {
                describe('without an initial selection', function() {
                    beforeEach(function() {
                        this.databasesCollection = new DatabasesCollection([
                            {id: 'DB1', name: 'DB1', domain: 'PUBLIC_INDEXES'},
                            {id: 'DB2', name: 'DB2', domain: 'PUBLIC_INDEXES'}
                        ]);

                        this.databasesView = new TestDatabaseView({
                            databasesCollection: this.databasesCollection,
                            emptyMessage: EMPTY_MESSAGE,
                            topLevelDisplayName: TOP_LEVEL_DISPLAY_NAME
                        });

                        this.databasesView.render();
                    });

                    it('should render the databases', function() {
                        expect(this.databasesView.$('.database-input')).toHaveLength(2);
                    });

                    it('should start with no checkboxes checked', function() {
                        expect(this.databasesView.$('.database-input:checked')).toHaveLength(0);
                    });

                    it('should start with all databases selected', function() {
                        testSelection(this.databasesView, ['DB1', 'DB2'])
                    });

                    it('should not have selected the all checkbox', function() {
                        expect(this.databasesView.$('[data-category-id="all"]')).not.toHaveProp('checked', true);
                    });

                    describe('after selecting a database', function() {
                        beforeEach(function() {
                            this.databasesView.selectDatabase('DB1', 'PUBLIC_INDEXES', true);
                        });

                        it('should have one checkbox checked', function() {
                            expect(this.databasesView.$('.database-input:checked')).toHaveLength(1);
                        });

                        it('should have one database selected', function() {
                            testSelection(this.databasesView, ['DB1'])
                        });

                        it('should mark the category checkbox indeterminate', function() {
                            expect(this.databasesView.$('.category-input')).toHaveProp('indeterminate', true);
                        });

                        describe('and then selecting another database', function() {
                            beforeEach(function() {
                                this.databasesView.selectDatabase('DB2', 'PUBLIC_INDEXES', true);
                            });

                            it('should have two checkboxes checked', function() {
                                expect(this.databasesView.$('.database-input:checked')).toHaveLength(2);
                            });

                            it('should have all databases selected', function() {
                                testSelection(this.databasesView, ['DB1', 'DB2']);
                            });

                            it('should have selected the all checkbox', function() {
                                expect(this.databasesView.$('[data-category-id="all"]')).toHaveProp('checked', true);
                            });
                        })
                    })
                });

                describe('with an initial selection', function() {
                    beforeEach(function() {
                        this.databasesCollection = new DatabasesCollection([
                            {id: 'DB1', name: 'DB1', domain: 'PUBLIC_INDEXES'},
                            {id: 'DB2', name: 'DB2', domain: 'PUBLIC_INDEXES'}
                        ]);

                        this.databasesView = new TestDatabaseView({
                            currentSelection: [{domain: 'PUBLIC_INDEXES', name: 'DB1'}],
                            databasesCollection: this.databasesCollection,
                            emptyMessage: EMPTY_MESSAGE,
                            topLevelDisplayName: TOP_LEVEL_DISPLAY_NAME
                        });

                        this.databasesView.render();
                    });

                    it('should render the databases', function() {
                        expect(this.databasesView.$('.database-input')).toHaveLength(2);
                    });

                    it('should start with one checkbox checked', function() {
                        expect(this.databasesView.$('.database-input:checked')).toHaveLength(1);
                    });

                    it('should start with the correct databases selected', function() {
                        testSelection(this.databasesView, ['DB1'])
                    });

                    it('should not have selected the all checkbox', function() {
                        expect(this.databasesView.$('[data-category-id="all"]')).not.toHaveProp('checked', true);
                    });
                });
            });

            describe('with child categories', function() {
                describe('without an initial selection', function() {
                    beforeEach(function() {
                        this.databasesCollection = new DatabasesCollection([
                            {id: 'DB1', name: 'DB1', domain: 'PUBLIC_INDEXES'},
                            {id: 'DB2', name: 'DB2', domain: 'PUBLIC_INDEXES'},
                            {id: 'DB3', name: 'DB3', domain: 'PRIVATE_INDEXES'},
                            {id: 'DB4', name: 'DB4', domain: 'PRIVATE_INDEXES'}
                        ]);

                        this.databasesView = new TestDatabaseView({
                            childCategories: childCategories,
                            databasesCollection: this.databasesCollection,
                            emptyMessage: EMPTY_MESSAGE,
                            topLevelDisplayName: TOP_LEVEL_DISPLAY_NAME
                        });

                        this.databasesView.render();
                    });

                    it('should render the databases', function() {
                        expect(this.databasesView.$('.database-input')).toHaveLength(4);
                    });

                    it('should start with no checkboxes checked', function() {
                        expect(this.databasesView.$('.database-input:checked')).toHaveLength(0);
                    });

                    it('should start with all databases selected', function() {
                        testSelection(this.databasesView, ['DB1', 'DB2', 'DB3', 'DB4']);
                    });

                    it('should not have selected the all checkbox', function() {
                        expect(this.databasesView.$('[data-category-id="all"]')).not.toHaveProp('checked', true);
                    });

                    describe('after selecting a database', function() {
                        beforeEach(function() {
                            this.databasesView.selectDatabase('DB1', 'PUBLIC_INDEXES', true);
                        });

                        it('should have one checkbox checked', function() {
                            expect(this.databasesView.$('.database-input:checked')).toHaveLength(1);
                        });

                        it('should have one database selected', function() {
                            testSelection(this.databasesView, ['DB1']);
                        });

                        describe('and then selecting another database', function() {
                            beforeEach(function() {
                                this.databasesView.selectDatabase('DB2', 'PUBLIC_INDEXES', true);
                            });

                            it('should have two checkboxes checked', function() {
                                expect(this.databasesView.$('.database-input:checked')).toHaveLength(2);
                            });

                            it('should have all databases selected', function() {
                                testSelection(this.databasesView, ['DB1', 'DB2']);
                            });

                            it('should have selected the public checkbox', function() {
                                expect(this.databasesView.$('[data-category-id="public"]')).toHaveProp('checked', true);
                            });

                            it('should not have selected the all checkbox', function() {
                                expect(this.databasesView.$('[data-category-id="all"]')).not.toHaveProp('checked', true);
                            });

                            describe('and then selecting the all checkbox', function() {
                                beforeEach(function() {
                                    this.databasesView.selectCategory('all', true);
                                });

                                it('should have all checkboxes checked', function() {
                                    expect(this.databasesView.$('.database-input:checked')).toHaveLength(4);
                                });

                                it('should have all databases selected', function() {
                                    testSelection(this.databasesView, ['DB1', 'DB2', 'DB3', 'DB4']);
                                });

                                it('should have selected the public checkbox', function() {
                                    expect(this.databasesView.$('[data-category-id="public"]')).toHaveProp('checked', true);
                                });

                                it('should have selected the private checkbox', function() {
                                    expect(this.databasesView.$('[data-category-id="private"]')).toHaveProp('checked', true);
                                });

                                it('should have selected the all checkbox', function() {
                                    expect(this.databasesView.$('[data-category-id="all"]')).toHaveProp('checked', true);
                                });
                            });
                        });
                    })
                });

                describe('with an initial selection', function() {
                    beforeEach(function() {
                        this.databasesCollection = new DatabasesCollection([
                            {id: 'DB1', name: 'DB1', domain: 'PUBLIC_INDEXES'},
                            {id: 'DB2', name: 'DB2', domain: 'PUBLIC_INDEXES'},
                            {id: 'DB3', name: 'DB3', domain: 'PRIVATE_INDEXES'},
                            {id: 'DB4', name: 'DB4', domain: 'PRIVATE_INDEXES'}
                        ]);

                        this.databasesView = new TestDatabaseView({
                            childCategories: childCategories,
                            databasesCollection: this.databasesCollection,
                            emptyMessage: EMPTY_MESSAGE,
                            topLevelDisplayName: TOP_LEVEL_DISPLAY_NAME,
                            currentSelection: [
                                {name: 'DB3', domain: 'PRIVATE_INDEXES'},
                                {name: 'DB4', domain: 'PRIVATE_INDEXES'}
                            ]
                        });

                        this.databasesView.render();
                    });

                    it('should collapse the public category as it has no selected databases', function() {
                        var $data = this.databasesView.$('[data-category-id="public"]').parent().find('.child-categories');
                        expect($data).toHaveClass('collapse');
                        expect($data).not.toHaveClass('in');
                    });

                    it('should not collapse the private category as it has databases', function() {
                        var $data = this.databasesView.$('[data-category-id="private"]').parent().find('.child-categories');
                        expect($data).toHaveClass('collapse in');
                    })
                });

                describe('with a category that has no databases', function() {
                    beforeEach(function() {
                        this.databasesCollection = new DatabasesCollection([
                            {id: 'DB1', name: 'DB1', domain: 'PUBLIC_INDEXES'},
                            {id: 'DB2', name: 'DB2', domain: 'PUBLIC_INDEXES'}
                        ]);

                        this.databasesView = new TestDatabaseView({
                            childCategories: childCategories,
                            databasesCollection: this.databasesCollection,
                            emptyMessage: EMPTY_MESSAGE,
                            topLevelDisplayName: TOP_LEVEL_DISPLAY_NAME
                        });

                        this.databasesView.render();
                    });

                    it('should not render the private category as it has no databases', function() {
                        expect(this.databasesView.$('[data-category-id="private"]')).toHaveLength(0);
                    });
                })
            })
        });

        describe('when forcing selections', function() {
            describe('without child categories', function() {
                describe('without an initial selection', function() {
                    beforeEach(function() {
                        this.databasesCollection = new DatabasesCollection([
                            {id: 'DB1', name: 'DB1', domain: 'PUBLIC_INDEXES'},
                            {id: 'DB2', name: 'DB2', domain: 'PUBLIC_INDEXES'}
                        ]);

                        this.databasesView = new TestDatabaseView({
                            databasesCollection: this.databasesCollection,
                            emptyMessage: EMPTY_MESSAGE,
                            forceSelection: true,
                            topLevelDisplayName: TOP_LEVEL_DISPLAY_NAME
                        });

                        this.databasesView.render();
                    });

                    it('should render the databases', function() {
                        expect(this.databasesView.$('.database-input')).toHaveLength(2);
                    });

                    it('should start with all checkboxes checked', function() {
                        expect(this.databasesView.$('.database-input:checked')).toHaveLength(2);
                    });

                    it('should start with all databases selected', function() {
                        testSelection(this.databasesView, ['DB1', 'DB2']);
                    });

                    it('should have selected the all checkbox', function() {
                        expect(this.databasesView.$('[data-category-id="all"]')).toHaveProp('checked', true);
                    });

                    it('should have disabled the all checkbox', function() {
                        expect(this.databasesView.$('[data-category-id="all"]')).toHaveProp('disabled', true);
                    });

                    describe('after deselecting a database', function() {
                        beforeEach(function() {
                            this.databasesView.selectDatabase('DB1', 'PUBLIC_INDEXES', false);
                        });

                        it('should have one checkbox checked', function() {
                            expect(this.databasesView.$('.database-input:checked')).toHaveLength(1);
                        });

                        it('should have one database selected', function() {
                            testSelection(this.databasesView, ['DB2']);
                        });

                        it('should have disabled the remaining database', function() {
                            expect(this.databasesView.$('.database-input[data-name="DB2"]')).toHaveProp('disabled', true);
                        });

                        it('should have unchecked the all checkbox', function() {
                            expect(this.databasesView.$('[data-category-id="all"]')).toHaveProp('checked', false);
                        });

                        it('should have enabled the all checkbox', function() {
                            expect(this.databasesView.$('[data-category-id="all"]')).toHaveProp('disabled', false);
                        });
                    });
                });

                describe('with an initial selection', function() {
                    beforeEach(function() {
                        this.databasesCollection = new DatabasesCollection([
                            {id: 'DB1', name: 'DB1', domain: 'PUBLIC_INDEXES'},
                            {id: 'DB2', name: 'DB2', domain: 'PUBLIC_INDEXES'},
                            {id: 'DB3', name: 'DB3', domain: 'PRIVATE_INDEXES'},
                            {id: 'DB4', name: 'DB4', domain: 'PRIVATE_INDEXES'}
                        ]);

                        this.databasesView = new TestDatabaseView({
                            databasesCollection: this.databasesCollection,
                            emptyMessage: EMPTY_MESSAGE,
                            forceSelection: true,
                            topLevelDisplayName: TOP_LEVEL_DISPLAY_NAME,
                            currentSelection: [
                                {name: 'DB1', domain: 'PUBLIC_INDEXES'}
                            ]
                        });

                        this.databasesView.render();
                    });

                    it('should render the databases', function() {
                        expect(this.databasesView.$('.database-input')).toHaveLength(4);
                    });

                    it('should start with one checkbox checked', function() {
                        expect(this.databasesView.$('.database-input:checked')).toHaveLength(1);
                    });

                    it('should start with the correct databases selected', function() {
                        testSelection(this.databasesView, ['DB1']);
                    });

                    it('should have disabled the selected database', function() {
                        expect(this.databasesView.$('.database-input[data-name="DB1"]')).toHaveProp('disabled', true);
                    });

                    it('should not have selected the all checkbox', function() {
                        expect(this.databasesView.$('[data-category-id="all"]')).not.toHaveProp('checked', true);
                    });
                });
            });

            describe('with child categories', function() {
                describe('without an initial selection', function() {
                    beforeEach(function() {
                        this.databasesCollection = new DatabasesCollection([
                            {id: 'DB1', name: 'DB1', domain: 'PUBLIC_INDEXES'},
                            {id: 'DB2', name: 'DB2', domain: 'PUBLIC_INDEXES'},
                            {id: 'DB3', name: 'DB3', domain: 'PRIVATE_INDEXES'},
                            {id: 'DB4', name: 'DB4', domain: 'PRIVATE_INDEXES'}
                        ]);

                        this.databasesView = new TestDatabaseView({
                            childCategories: childCategories,
                            databasesCollection: this.databasesCollection,
                            emptyMessage: EMPTY_MESSAGE,
                            forceSelection: true,
                            topLevelDisplayName: TOP_LEVEL_DISPLAY_NAME
                        });

                        this.databasesView.render();
                    });

                    it('should render the databases', function() {
                        expect(this.databasesView.$('.database-input')).toHaveLength(4);
                    });

                    it('should start with all checkboxes checked', function() {
                        expect(this.databasesView.$('.database-input:checked')).toHaveLength(4);
                    });

                    it('should start with all databases selected', function() {
                        testSelection(this.databasesView, ['DB1', 'DB2', 'DB3', 'DB4']);
                    });

                    it('should have selected the all checkbox', function() {
                        expect(this.databasesView.$('[data-category-id="all"]')).toHaveProp('checked', true);
                    });

                    it('should have selected the public checkbox', function() {
                        expect(this.databasesView.$('[data-category-id="public"]')).toHaveProp('checked', true);
                    });

                    it('should have selected the private checkbox', function() {
                        expect(this.databasesView.$('[data-category-id="private"]')).toHaveProp('checked', true);
                    });

                    it('should have disabled the all checkbox', function() {
                        expect(this.databasesView.$('[data-category-id="all"]')).toHaveProp('disabled', true);
                    });

                    describe('after deselecting a database', function() {
                        beforeEach(function() {
                            this.databasesView.selectDatabase('DB1', 'PUBLIC_INDEXES', false);
                        });

                        it('should have three checkboxes checked', function() {
                            expect(this.databasesView.$('.database-input:checked')).toHaveLength(3);
                        });

                        it('should have three database selected', function() {
                            testSelection(this.databasesView, ['DB2', 'DB3', 'DB4']);
                        });

                        it('should have enabled the all checkbox', function() {
                            expect(this.databasesView.$('[data-category-id="all"]')).toHaveProp('disabled', false);
                        });

                        describe('and then deselecting another database', function() {
                            beforeEach(function() {
                                this.databasesView.selectDatabase('DB2', 'PUBLIC_INDEXES', false);
                            });

                            it('should have two checkboxes checked', function() {
                                expect(this.databasesView.$('.database-input:checked')).toHaveLength(2);
                            });

                            it('should have two databases selected', function() {
                                testSelection(this.databasesView, ['DB3', 'DB4']);
                            });

                            it('should have deselected the public checkbox', function() {
                                expect(this.databasesView.$('[data-category-id="public"]')).toHaveProp('checked', false);
                            });

                            it('should not have selected the all checkbox', function() {
                                expect(this.databasesView.$('[data-category-id="all"]')).not.toHaveProp('checked', true);
                            });

                            describe('and then selecting the all checkbox', function() {
                                beforeEach(function() {
                                    this.databasesView.selectCategory('all', true);
                                });

                                it('should have all checkboxes checked', function() {
                                    expect(this.databasesView.$('.database-input:checked')).toHaveLength(4);
                                });

                                it('should have all databases selected', function() {
                                    testSelection(this.databasesView, ['DB1', 'DB2', 'DB3', 'DB4']);
                                });

                                it('should have selected the public checkbox', function() {
                                    expect(this.databasesView.$('[data-category-id="public"]')).toHaveProp('checked', true);
                                });

                                it('should have selected the private checkbox', function() {
                                    expect(this.databasesView.$('[data-category-id="private"]')).toHaveProp('checked', true);
                                });

                                it('should have selected the all checkbox', function() {
                                    expect(this.databasesView.$('[data-category-id="all"]')).toHaveProp('checked', true);
                                });
                            });
                        });
                    })
                });

                describe('with an initial selection', function() {
                    beforeEach(function() {
                        this.databasesCollection = new DatabasesCollection([
                            {id: 'DB1', name: 'DB1', domain: 'PUBLIC_INDEXES'},
                            {id: 'DB2', name: 'DB2', domain: 'PUBLIC_INDEXES'},
                            {id: 'DB3', name: 'DB3', domain: 'PRIVATE_INDEXES'},
                            {id: 'DB4', name: 'DB4', domain: 'PRIVATE_INDEXES'}
                        ]);

                        this.databasesView = new TestDatabaseView({
                            childCategories: childCategories,
                            databasesCollection: this.databasesCollection,
                            emptyMessage: EMPTY_MESSAGE,
                            forceSelection: true,
                            topLevelDisplayName: TOP_LEVEL_DISPLAY_NAME,
                            currentSelection: [
                                {name: 'DB3', domain: 'PRIVATE_INDEXES'},
                                {name: 'DB4', domain: 'PRIVATE_INDEXES'}
                            ]
                        });

                        this.databasesView.render();
                    });

                    it('should collapse the public category as it has no selected databases', function() {
                        var $data = this.databasesView.$('[data-category-id="public"]').parent().find('.child-categories');
                        expect($data).toHaveClass('collapse');
                        expect($data).not.toHaveClass('in');
                    });

                    it('should not collapse the private category as it has databases', function() {
                        var $data = this.databasesView.$('[data-category-id="private"]').parent().find('.child-categories');
                        expect($data).toHaveClass('collapse in');
                    })
                });

                describe('with a category that has no databases', function() {
                    beforeEach(function() {
                        this.databasesCollection = new DatabasesCollection([
                            {id: 'DB1', name: 'DB1', domain: 'PUBLIC_INDEXES'},
                            {id: 'DB2', name: 'DB2', domain: 'PUBLIC_INDEXES'}
                        ]);

                        this.databasesView = new TestDatabaseView({
                            childCategories: childCategories,
                            databasesCollection: this.databasesCollection,
                            emptyMessage: EMPTY_MESSAGE,
                            forceSelection: true,
                            topLevelDisplayName: TOP_LEVEL_DISPLAY_NAME
                        });

                        this.databasesView.render();
                    });

                    it('should not render the private category as it has no databases', function() {
                        expect(this.databasesView.$('[data-category-id="private"]')).toHaveLength(0);
                    });
                })
            });
        });

        describe('when the databases arrive after initialization', function() {
            describe('when not forcing selections', function() {
                describe('with child categories', function() {
                    describe('without an initial selection', function() {
                        beforeEach(function() {
                            var databases = [
                                {id: 'DB1', name: 'DB1', domain: 'PUBLIC_INDEXES'},
                                {id: 'DB2', name: 'DB2', domain: 'PUBLIC_INDEXES'},
                                {id: 'DB3', name: 'DB3', domain: 'PRIVATE_INDEXES'},
                                {id: 'DB4', name: 'DB4', domain: 'PRIVATE_INDEXES'}
                            ];

                            this.databasesCollection = new DatabasesCollection();

                            this.databasesView = new TestDatabaseView({
                                childCategories: childCategories,
                                databasesCollection: this.databasesCollection,
                                emptyMessage: EMPTY_MESSAGE,
                                topLevelDisplayName: TOP_LEVEL_DISPLAY_NAME
                            });

                            this.databasesView.render();

                            this.databasesCollection.reset(databases);
                        });


                        it('should render the databases', function() {
                            expect(this.databasesView.$('.database-input')).toHaveLength(4);
                        });

                        it('should start with no checkboxes checked', function() {
                            expect(this.databasesView.$('.database-input:checked')).toHaveLength(0);
                        });

                        it('should start with all databases selected', function() {
                            testSelection(this.databasesView, ['DB1', 'DB2', 'DB3', 'DB4']);
                        });

                        it('should not have selected the all checkbox', function() {
                            expect(this.databasesView.$('[data-category-id="all"]')).not.toHaveProp('checked', true);
                        });

                        describe('after selecting a database', function() {
                            beforeEach(function() {
                                this.databasesView.selectDatabase('DB1', 'PUBLIC_INDEXES', true);
                            });

                            it('should have one checkbox checked', function() {
                                expect(this.databasesView.$('.database-input:checked')).toHaveLength(1);
                            });

                            it('should have one database selected', function() {
                                testSelection(this.databasesView, ['DB1']);
                            });

                            describe('and then selecting another database', function() {
                                beforeEach(function() {
                                    this.databasesView.selectDatabase('DB2', 'PUBLIC_INDEXES', true);
                                });

                                it('should have two checkboxes checked', function() {
                                    expect(this.databasesView.$('.database-input:checked')).toHaveLength(2);
                                });

                                it('should have all databases selected', function() {
                                    testSelection(this.databasesView, ['DB1', 'DB2']);
                                });

                                it('should have selected the public checkbox', function() {
                                    expect(this.databasesView.$('[data-category-id="public"]')).toHaveProp('checked', true);
                                });

                                it('should not have selected the all checkbox', function() {
                                    expect(this.databasesView.$('[data-category-id="all"]')).not.toHaveProp('checked', true);
                                });

                                describe('and then selecting the all checkbox', function() {
                                    beforeEach(function() {
                                        this.databasesView.selectCategory('all', true);
                                    });

                                    it('should have all checkboxes checked', function() {
                                        expect(this.databasesView.$('.database-input:checked')).toHaveLength(4);
                                    });

                                    it('should have all databases selected', function() {
                                        testSelection(this.databasesView, ['DB1', 'DB2', 'DB3', 'DB4']);
                                    });

                                    it('should have selected the public checkbox', function() {
                                        expect(this.databasesView.$('[data-category-id="public"]')).toHaveProp('checked', true);
                                    });

                                    it('should have selected the private checkbox', function() {
                                        expect(this.databasesView.$('[data-category-id="private"]')).toHaveProp('checked', true);
                                    });

                                    it('should have selected the all checkbox', function() {
                                        expect(this.databasesView.$('[data-category-id="all"]')).toHaveProp('checked', true);
                                    });
                                });
                            });
                        });

                        it('should not collapse any categories', function() {
                            expect(this.databasesView.$('.collapse:not(.in)')).toHaveLength(0);
                            expect(this.databasesView.$('.collapse.in')).toHaveLength(3);
                        })
                    })
                })
            })
        });
    });

});