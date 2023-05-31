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
 * @module databases-view/js/databases-view
 */
define([
    'underscore',
    'jquery',
    'backbone',
    'js-whatever/js/list-view',
    'js-whatever/js/filtering-collection',
    'text!databases-view/templates/databases-view.html'
], function(_, $, Backbone, ListView, FilteringCollection, template) {
    'use strict';

    var STATES = {
        EMPTY: 'EMPTY',
        LOADING: 'LOADING',
        OK: 'OK'
    };

    var CURRENT_SELECTION = 'currentSelection';

    function searchMatches(text, search) {
        return text.toLowerCase().indexOf(search.toLowerCase()) > -1;
    }

    function getTextFilter(filterModel) {
        return function(model) {
            var search = filterModel.get('text');
            return !search || searchMatches(model.get('displayName') || model.get('name'), search);
        };
    }

    var filteredIndexesCollection = function(nodeFilter, databasesCollection, filterModel) {
        var firstFilter = nodeFilter || _.constant(true);
        var textFilter = filterModel
            ? getTextFilter(filterModel)
            : _.constant(true);

        return new FilteringCollection([], {
            collection: databasesCollection,
            modelFilter: function(model) {
                return textFilter(model) && firstFilter(model);
            }
        });
    };

    function filterNode(node) {
        if(_.isArray(node.children)) {
            _.each(node.children, filterNode);
        } else {
            node.children.filter();
        }
    }

    var setParent = function(category) {
        _.each(category.children, function(child) {
            child.parent = category;
            setParent(child);
        });
    };

    var processCategories = function(categories, collection, currentSelection) {
        return _.chain(categories)
            // find all the categories who have a child in the databases collection
            .filter(function(child) {
                return collection.filter(child.filter).length > 0;
            })
            // add the correct collapse property to each child
            .map(function(child) {
                child = _.clone(child);

                var childHasSelection = _.chain(currentSelection)
                    // for every item in the current selection find the corresponding database in the database collection
                    .map(function(selection) {
                        return collection.findWhere(selection);
                    }, this)
                    // throw out any that don't have a database
                    .compact()
                    // find a selected database that is in the current category
                    .find(child.filter)
                    .value();

                // if the category has a selected database, don't collapse it
                // if the selection is empty (i.e. everything is implicitly selected), don't collapse it
                child.collapse = !(childHasSelection || _.isEmpty(currentSelection));

                return child;
            }, this)
            .value();
    };

    /**
     * @typedef module:databases-view/js/databases-view.DatabasesListItemViewOptions
     * @desc As ListItemViewOptions but specifies some default values
     * @extends module:js-whatever/js/list-item-view.ListItemView~ListItemViewOptions
     * @property {string} [tagName=li] The tag name for each database/category
     * @property {callback} [template=this.databaseTemplate] The template to use for a database
     */
    /**
     * @typedef module:databases-view/js/databases-view.DatabasesListViewOptions
     * @desc As ListViewOptions but specifies some default values
     * @extends module:js-whatever/js/list-view.ListView~ListViewOptions
     * @property {string} [classname=list-unstyled] The classname to apply to the list items
     * @property {string} [tagName=ul] The tag name for the top level of the view
     * @property {module:databases-view/js/databases-view.DatabasesListItemViewOptions} itemOptions The options to use for the list items
     */
    /**
     * Function that describes the databases that a category contains
     * @callback module:databases-view/js/databases-view.DatabasesView~CategoryFilter
     * @param {Backbone.Model} model The database model
     * @return {boolean} True if the database is in the category; false otherwise
     */
    /**
     * The databases collection may be empty when the view is created. This function specifies a selection to choose when databases are available
     * @callback module:databases-view/js/databases-view.DatabasesView~DelayedSelection
     * @param {module:databases-view/js/databases-collection.DatabasesCollection} collection The collection of databases
     * @return {Array<ResourceIdentifier>} Array of resource identifiers representing the selection
     */
    /**
     * @typedef module:databases-view/js/databases-view.DatabasesView~Category
     * @property {module:databases-view/js/databases-view.DatabasesView~CategoryFilter} filter Filter describing the databases contained in the category
     * @property {string} name The name of the category
     * @property {string} displayName A different name which may be more suitable for display
     * @property {string} className CSS classes to apply to the category when it is rendered
     */
    /**
     * @typedef module:databases-view/js/databases-view.DatabasesView~DatabasesViewOptions
     * @property {module:databases-view/js/databases-collection.DatabasesCollection} databasesCollection The resources that the view will display
     * @property {module:databases-view/js/databases-collection.DatabasesCollection} selectedDatabasesCollection The currently selected resources
     * @property {string} topLevelDisplayName The display name of the top level category
     * @property {string} [emptyMessage=''] Message to display if there are no databases
     * @property {Array<module:databases-view/js/databases-view.DatabasesView~Category>} [childCategories] The categories the databases will be placed in. If undefined all the databases will be in a single category
     * @property {module:databases-view/js/databases-view.DatabasesListViewOptions} [listViewOptions] Options used to create the list views
     * @property {module:databases-view/js/databases-view.DatabasesView~DelayedSelection} [delayedSelection] The databases collection may be empty when the view is created. This function specifies a selection to choose when databases are available
     */
    /**
     * @name module:databases-view/js/databases-view.DatabasesView
     * @desc View for showing and selecting Haven OnDemand resources.  This is an abstract class and must be supplied
     * with templates for databases and categories. In addition, six primitive operations must be implemented:
     * <ul>
     *     <li> check
     *     <li> uncheck
     *     <li> enable
     *     <li> disable
     *     <li> determinate
     *     <li> indeterminate
     * </ul>
     * The selected databases collection will be kept up to date with the state of the UI, and changes made to the collection
     * will be reflected in the view.
     * @param {module:databases-view/js/databases-view.DatabasesView~DatabasesViewOptions} options The options for the view
     * @constructor
     * @abstract
     * @extends Backbone.View
     */
    //noinspection JSClosureCompilerSyntax
    return Backbone.View.extend(/**@lends module:databases-view/js/databases-view.DatabasesView.prototype */{
        /**
         * @desc Template for the view. If overriding it should have an element with class databases-list. For empty
         * message support add an element with class no-active databases
         * @method
         */
        template: _.template(template),

        /**
         * @desc Template for an individual database. The element which will respond to user interaction must have
         * class database-input.
         * @abstract
         * @method
         */
        databaseTemplate: _.noop,

        /**
         * @desc Template for a category. The element which will respond to user interaction must have
         * class database-input. The name of the category must be in a data-category-id attribute. There must be an
         * element with class child-categories if child categories are used.
         * @abstract
         * @method
         */
        categoryTemplate: _.noop,

        /**
         * @desc Perform any initialization required for the database and category inputs to become functional
         * @abstract
         * @method
         */
        initializeInputs: _.noop,

        /**
         * @desc Marks the given input as selected
         * @param {jQuery} input The input to mark
         * @abstract
         * @method
         */
        check: _.noop,

        /**
         * @desc Marks the given input as deselected
         * @param {jQuery} input The input to mark
         * @abstract
         * @method
         */
        uncheck: _.noop,

        /**
         * @desc Marks the given input as enabled
         * @param {jQuery} input The input to mark
         * @abstract
         * @method
         */
        enable: _.noop,

        /**
         * @desc Marks the given input as disabled
         * @param {jQuery} input The input to mark
         * @abstract
         * @method
         */
        disable: _.noop,

        /**
         * @desc Marks the given input as determinate
         * @param {jQuery} input The input to mark
         * @abstract
         * @method
         */
        determinate: _.noop,

        /**
         * @desc Marks the given input as indeterminate
         * @param {jQuery} input The input to mark
         * @abstract
         * @method
         */
        indeterminate: _.noop,

        initialize: function(options) {
            this.collection = options.databasesCollection;
            this.selectedDatabasesCollection = options.selectedDatabasesCollection;
            this.filterModel = options.filterModel;
            this.visibleIndexesCallback = options.visibleIndexesCallback;
            this.delayedSelection = options.delayedSelection;
            this.databaseHelper = options.databaseHelper;
            this.childCategories = options.childCategories;

            this.emptyMessage = options.emptyMessage || '';

            this.listViewOptions = options.listViewOptions || {};
            this.listViewOptions.itemOptions = this.listViewOptions.itemOptions || {};

            _.defaults(this.listViewOptions.itemOptions, {
                tagName: 'li',
                template: this.databaseTemplate
            });

            _.defaults(this.listViewOptions, {
                className: 'list-unstyled',
                tagName: 'ul'
            });

            if(this.selectedDatabasesCollection.length === this.collection.length) {
                this.currentSelection = [];
            } else {
                this.currentSelection = this.getCurrentSelection(this.selectedDatabasesCollection);
            }

            this.hierarchy = _.extend({
                    name: 'all',
                    displayName: options.topLevelDisplayName,
                    className: 'list-unstyled'
                },
                this.childCategories
                    ? {
                        collapse: false,
                        children: processCategories.call(this, this.childCategories, this.collection, this.currentSelection)
                    }
                    : {}
            );

            setParent(this.hierarchy);

            // if node.children, call for each child
            // else if node has a filter, set up filtering collection and list view
            // else set up list view
            var buildHierarchy = _.bind(function(node, collection) {
                if(node.children) {
                    _.each(node.children, function(child) {
                        buildHierarchy(child, collection);
                    });
                } else {
                    node.children = filteredIndexesCollection(node.filter, collection, this.filterModel);

                    node.listView = new ListView(_.extend(
                        {useCollectionChange: false},
                        this.listViewOptions,
                        {collection: node.children}
                    ));
                }
            }, this);

            // start at this hierarchy
            buildHierarchy(this.hierarchy, this.collection);

            var initialState;

            if (this.collection.currentRequest && this.collection.currentRequest.state() === 'pending') {
                initialState = STATES.LOADING;
            } else if (this.collection.isEmpty()) {
                initialState = STATES.EMPTY;
            } else {
                initialState = STATES.OK;
            }

            this.viewModel = new Backbone.Model({state: initialState});
            this.listenTo(this.viewModel, 'change:state', this.updateViewState);

            this.listenTo(this.collection, 'remove', function(model) {
                var selectedIndex = _.findWhere(this.currentSelection, this.getSelectedIndexDataFromModel(model));

                if(selectedIndex) {
                    this.currentSelection = _.without(this.currentSelection, selectedIndex);
                    this.updateCheckedOptions();
                    this.updateSelectedDatabases();
                }
            });

            this.listenTo(this.collection, 'request', function() {
                this.viewModel.set('state', STATES.LOADING);
            });

            // if the databases change, we need to recalculate category collapsing and visibility
            this.listenTo(this.collection, 'reset update', function() {
                if(this.collection.isEmpty()) {
                    this.viewModel.set('state', STATES.EMPTY);
                } else {
                    this.viewModel.set('state', STATES.OK);

                    if(!_.isEmpty(this.currentSelection)) {
                        var newItems = this.getCurrentSelection(this.collection);

                        var newSelection = _.filter(this.currentSelection, function(selectedItem) {
                            return _.findWhere(newItems, selectedItem);
                        });

                        if(!_.isEqual(newSelection, this.currentSelection)) {
                            this.currentSelection = newSelection;
                        }
                    } else if(this.delayedSelection) {
                        this.currentSelection = this.delayedSelection(this.collection);
                    }

                    if(options.childCategories) {
                        var removeListViews = function(node) {
                            if(node.listView) {
                                node.listView.remove();
                            }

                            if(_.isArray(node.children)) {
                                _.each(node.children, function(child) {
                                    removeListViews(child);
                                });
                            }
                        };

                        removeListViews(this.hierarchy);

                        this.hierarchy.children = processCategories.call(this, options.childCategories, this.collection, this.currentSelection);

                        buildHierarchy(this.hierarchy, this.collection);
                    }

                    this.render();
                    this.updateSelectedDatabases();
                }
            });

            this.listenTo(this.selectedDatabasesCollection, 'update reset', function() {
                // Empty current selection means all selected; if we still have everything selected then there is no work to do
                if(!(_.isEmpty(this.currentSelection) && this.selectedDatabasesCollection.length === this.collection.length)) {
                    this.currentSelection = this.getCurrentSelection(this.selectedDatabasesCollection);
                    this.updateCheckedOptions();
                }
            });

            if(this.filterModel) {
                this.listenTo(this.filterModel, 'change', function() {
                    filterNode(this.hierarchy);
                    this.updateCheckedOptions();

                    if(this.visibleIndexesCallback) {
                        var getModels = function(node) {
                            return _.isArray(node.children)
                                ? _.chain(node.children)
                                    .map(getModels)
                                    .flatten()
                                    .value()
                                : node.children.models;
                        };

                        var models = getModels(this.hierarchy);

                        this.visibleIndexesCallback(models);
                    }
                });
            }
        },

        /**
         * @desc Renders the view
         * @returns {module:databases-view/js/databases-view.DatabasesView} this
         */
        render: function() {
            this.$el.html(this.template(this.getTemplateOptions()));

            var renderNode = _.bind(function(node, $parentDomElement) {
                var $nodeEl = $(this.categoryTemplate({
                    data: {node: node}
                }));

                var $child = $nodeEl.find('.child-categories');

                $child.addClass('collapse');

                if(node.collapse) {
                    $nodeEl.find('[data-target]').addClass('collapsed');
                } else {
                    $child.addClass('in');
                }

                if(node.listView) {
                    node.listView.render();

                    $child.append(node.listView.$el);
                } else {
                    _.each(node.children, function(child) {
                        renderNode(child, $child);
                    });
                }

                $parentDomElement.append($nodeEl);
            }, this);

            this.$databasesList = this.$('.databases-list');

            renderNode(this.hierarchy, this.$databasesList);

            this.$databaseCheckboxes = this.$('.database-input');
            this.$categoryCheckboxes = this.$('.category-input');

            this.$loadingSpinner = this.$('.databases-processing-indicator');
            this.$emptyMessage = this.$('.no-active-databases');
            this.$emptyMessage.text(this.emptyMessage);

            this.initializeInputs();
            this.updateCheckedOptions();
            this.updateViewState();
            return this;
        },

        getCurrentSelection: function(collection) {
            return collection.map(function(model) {
                return model.pick(this.databaseHelper.getDatabaseAttributes());
            }.bind(this));
        },

        getSelectedIndexData: function(item) {
            return _.pick(item, this.databaseHelper.getDatabaseAttributes());
        },

        getSelectedIndexDataFromModel: function(model) {
            var attributes = this.databaseHelper.getDatabaseAttributes();
            return model.pick(attributes);
        },

        findInCurrentSelectionArguments: function($checkbox) {
            var args = {};
            this.databaseHelper.getDatabaseAttributes().forEach(function(arg) {
                args[arg] = $checkbox.attr('data-' + arg)
            });
            return args;
        },

        selectedItemsEquals: function(item1, item2) {
            return this.databaseHelper.getDatabaseAttributes().every(function(attribute) {
                return item1[attribute] === item2[attribute];
            });
        },

        /**
         * Returns any parameters required for use in the template. This allows custom templates to take custom parameters
         * @returns {object} The parameters
         */
        getTemplateOptions: function() {
            return {loading: ''};
        },

        /**
         * @desc Selects the database with the given id
         * @param {object} data The identifying properties of the database
         * @param {boolean} checked The new state of the database
         * @param {string} [selection] The name of the selection array to update. Defaults to 'currentSelection'
         */
        selectDatabase: function(data, checked, selection) {
            selection = selection || CURRENT_SELECTION;

            if(checked) {
                this[selection].push(this.getSelectedIndexDataFromModel(this.collection.find(data)));

                this[selection] = _.uniq(this[selection], this.databaseHelper.getDatabaseIdentifier);
            } else {
                this[selection] = _.reject(this[selection], function(selectedItem) {
                    return this.selectedItemsEquals(data, selectedItem);
                }.bind(this));
            }

            this.updateCheckedOptions(this[selection]);

            if(selection === CURRENT_SELECTION) {
                this.updateSelectedDatabases();
            }
        },

        /**
         * @desc Selects the category with the given name
         * @param {string} category
         * @param {boolean} checked The new state of the category
         * @param {string} [selection] The name of theselection array to update. Defaults to 'currentSelection'
         */
        selectCategory: function(category, checked, selection) {
            selection = selection || CURRENT_SELECTION;

            var findNode = function(node, name) {
                if(node.name === name) {
                    return node;
                } else if(_.isArray(node.children)) {
                    return _.find(node.children, function(child) {
                        return findNode(child, name);
                    });
                }
            };

            var findDatabases = function(node) {
                if(_.isArray(node.children)) {
                    return _.chain(node.children)
                        .map(function(child) {
                            return findDatabases(child);
                        })
                        .flatten()
                        .value();
                } else {
                    return node.children.map(this.getSelectedIndexDataFromModel, this);
                }
            }.bind(this);

            var databases = findDatabases(findNode(this.hierarchy, category));

            if(checked) {
                this[selection] = _.chain([this[selection], databases])
                    .flatten()
                    .uniq(this.databaseHelper.getDatabaseIdentifier)
                    .value();
            } else {
                this[selection] = _.reject(this[selection], function(selectedItem) {
                    return _.findWhere(databases, this.getSelectedIndexData(selectedItem));
                }.bind(this));
            }

            this.updateCheckedOptions(this[selection]);

            if(selection === CURRENT_SELECTION) {
                this.updateSelectedDatabases(this[selection]);
            }
        },

        /**
         * @desc Updates the selected databases collection with the state of the UI
         */
        updateSelectedDatabases: function() {
            this.selectedDatabasesCollection.set(_.isEmpty(this.currentSelection)
                ? this.getCurrentSelection(this.collection)
                : this.currentSelection);
        },

        /**
         * @desc Updates the view to match the current internal state. There should be no need to call this method
         * @param {Array<String>} [selection] The selection that describes the checked options. Defaults to this.currentSelection
         * @private
         */
        updateCheckedOptions: function(selection) {
            selection = selection || this.currentSelection;

            var $databaseInputs = this.$('.database-input');

            this.uncheck(this.$categoryCheckboxes);
            this.enable(this.$categoryCheckboxes);
            this.determinate(this.$categoryCheckboxes);

            _.each($databaseInputs, function(checkbox) {
                var $checkbox = $(checkbox);

                this.uncheck($checkbox);
                this.enable($checkbox);
                this.determinate($checkbox);

                var findArguments = this.findInCurrentSelectionArguments($checkbox);
                if(_.findWhere(selection, findArguments)) {
                    this.check($checkbox);
                }
            }, this);

            this.updateCategoryCheckbox(this.hierarchy, selection);
        },

        /**
         * Updates a category checkbox to match the current internal state. There should be no need to call this method
         * @param {module:databases-view/js/databases-view.DatabasesView~Category} node The category to update
         * @param {Array<String>} [selection] Defaults to this.currentSelection
         * @returns {Array<ResourceIdentifier>} The resource identifier in the category and its descendants
         * @private
         */
        updateCategoryCheckbox: function(node, selection) {
            selection = selection || this.currentSelection;

            var $categoryCheckbox = this.$('[data-category-id="' + node.name + '"]');
            var childIndexes;

            if(_.isArray(node.children)) {
                // traverse each of the child categories recursively
                // the flatMap gives a list of all the indexes in this category and its descendants
                childIndexes = _.chain(node.children)
                    .map(function(child) {
                        return this.updateCategoryCheckbox(child);
                    }, this)
                    .flatten()
                    .value();
            } else {
                // the indexes are the ones in the collection for this category
                childIndexes = node.children.map(this.getSelectedIndexDataFromModel, this);
            }

            // checkedState is an array containing true if there are checked boxes, and false if there are unchecked boxes
            var checkedState = _.chain(childIndexes)
                .map(function(childIndex) {
                    return Boolean(_.findWhere(selection, childIndex));
                }, this)
                .uniq()
                .value();

            var checkedBoxes = _.contains(checkedState, true);
            var unCheckedBoxes = _.contains(checkedState, false);

            if(checkedBoxes && unCheckedBoxes) {
                this.indeterminate($categoryCheckbox);
            } else if(checkedBoxes) {
                // all the category's children are checked
                this.check($categoryCheckbox);
            } else {
                this.uncheck($categoryCheckbox);
            }

            // return the list of child categories for use in the flatMap of the ancestor category
            return childIndexes;
        },

        /**
         * @desc Updates the loading spinner and "no databases" message to match the current internal state. There
         * should be no need to call this method
         * @private
         */
        updateViewState: function() {
            var state = this.viewModel.get('state');

            if(this.$emptyMessage) {
                this.$emptyMessage.toggleClass('hide', state !== STATES.EMPTY);
            }

            if(this.$loadingSpinner) {
                this.$loadingSpinner.toggleClass('hide', state !== STATES.LOADING);
            }

            if(this.$databasesList) {
                this.$databasesList.toggleClass('hide', state !== STATES.OK);
            }
        }
    });
});
