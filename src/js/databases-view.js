/*
 * Copyright 2015 Hewlett-Packard Development Company, L.P.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
 */

define([
    'backbone',
    'underscore',
    'js-whatever/js/list-view',
    'js-whatever/js/filtering-collection',
    'js-whatever/js/escape-hod-identifier'
], function(Backbone, _, ListView, FilteringCollection, escapeHodIdentifier) {

    var filteredIndexesCollection = function(filter, databasesCollection) {
        return new FilteringCollection([], {
            collection: databasesCollection,
            modelFilter: filter
        });
    };

    var setParent = function(category) {
        _.each(category.children, function(child) {
            child.parent = category;
            setParent(child);
        })
    };

    return Backbone.View.extend({
        template: _.template('<div class="no-active-databases"></div><div class="databases-list"></div>'),
        databaseTemplate: $.noop, // you need to override this
        categoryTemplate: $.noop, // you need to override this

        // subtypes should override these as applicable
        initializeInputs: $.noop,
        check: $.noop,
        uncheck: $.noop,
        enable: $.noop,
        disable: $.noop,
        determinate: $.noop,
        indeterminate: $.noop,

        initialize: function(options) {
            this.collection = options.databasesCollection;
            this.forceSelection = options.forceSelection || false;
            this.emptyMessage = options.emptyMessage || '';

            this.currentSelection = options.currentSelection;

            if (!this.currentSelection) {
                this.currentSelection = this.forceSelection ? this.collection.getResourceIdentifiers() : [];
            }

            if (options.childCategories) {
                var children = _.chain(options.childCategories)
                    // find all the categories who have a child in the databases collection
                    .filter(function(child) {
                        return this.collection.filter(child.filter).length > 0
                    }, this)
                    // add the correct collapse property to each child
                    .map(function(child) {
                        child = _.clone(child);

                        var childHasSelection = _.chain(this.currentSelection)
                            // for every item in the current selection find the corresponding database in the database collection
                            .map(function(selection) {
                                return this.collection.findWhere(selection)
                            }, this)
                            // throw out any that don't have a database
                            .compact()
                            // find a selected database that is in the current category
                            .find(child.filter)
                            .value();

                        // if the category has a selected database, don't collapse it
                        child.collapse = !childHasSelection;

                        return child
                    }, this)
                    .value();

                this.hierarchy = {
                    name: 'all',
                    displayName: options.topLevelDisplayName,
                    className: 'list-unstyled',
                    collapse: false,
                    children: children
                };
            } else {
                this.hierarchy = {
                    name: 'all',
                    displayName: options.topLevelDisplayName,
                    className: 'list-unstyled'
                };
            }

            setParent(this.hierarchy);

            // if node.children, call for each child
            // else if node has a filter, set up filtering collection and list view
            // else set up list view
            var buildHierarchy = _.bind(function(node) {
                if (node.children) {
                    _.each(node.children, function(child) {
                        buildHierarchy(child);
                    });
                } else {
                    if (node.filter) {
                        node.children = filteredIndexesCollection(node.filter, this.collection);
                    } else {
                        node.children = this.collection;
                    }

                    node.listView = new ListView({
                        className: 'unstyled break-word',
                        collection: node.children,
                        tagName: 'ul',
                        itemOptions: {
                            tagName: 'li',
                            className: 'animated fadeIn',
                            template: this.databaseTemplate
                        }
                    });
                }
            }, this);

            // start at this hierarchy
            buildHierarchy(this.hierarchy, this.collection);

            this.listenTo(this.collection, 'add remove reset', this.updateEmptyMessage);

            this.listenTo(this.collection, 'remove', function(model) {
                var selectedIndex = _.findWhere(this.currentSelection, model.pick('domain', 'name'));

                if (selectedIndex) {
                    this.currentSelection = _.without(this.currentSelection, selectedIndex);
                    this.updateCheckedOptions();
                    this.triggerChange();
                }
            });

            this.listenTo(this.collection, 'reset', function(collection) {
                if (!_.isEmpty(this.currentSelection)) {
                    var newItems = collection.getResourceIdentifiers();

                    var newSelection = _.filter(this.currentSelection, function(selectedItem) {
                        return _.findWhere(newItems, selectedItem)
                    });

                    if (!_.isEqual(newSelection, this.currentSelection)) {
                        this.currentSelection = newSelection;
                        this.triggerChange();
                    }

                    this.updateCheckedOptions();
                }
                else {
                    // empty selection is everything, which may now be different
                    this.triggerChange();
                }
            });
        },

        render: function() {
            this.$el.html(this.template(this.getTemplateOptions()));

            var renderNode = _.bind(function(node, $parentDomElement) {
                var $nodeEl = $(this.categoryTemplate({
                    data: {node: node}
                }));

                var $child = $nodeEl.find('.child-categories');

                $child.addClass('collapse');

                if (node.collapse) {
                    $nodeEl.find('[data-target]').addClass('collapsed');
                } else {
                    $child.addClass('in');
                }

                if (node.listView) {
                    node.listView.render();

                    $child.append(node.listView.$el);
                }
                else {
                    _.each(node.children, function(child) {
                        renderNode(child, $child)
                    });
                }

                $parentDomElement.append($nodeEl);
            }, this);

            this.$databasesList = this.$('.databases-list');

            renderNode(this.hierarchy, this.$databasesList);

            this.$databaseCheckboxes = this.$('.database-input');
            this.$categoryCheckboxes = this.$('.category-input');

            this.$emptyMessage = this.$('.no-active-databases');
            this.$emptyMessage.text(this.emptyMessage);

            this.initializeInputs();
            this.updateCheckedOptions();
            this.updateEmptyMessage();
            return this;
        },

        getTemplateOptions: function() {
            return {}
        },

        selectAll: function() {
            // no work to do if everything already selected (either empty selection or full selection)
            if (!_.isEmpty(this.currentSelection) && this.currentSelection.length !== this.collection.size()) {
                this.selectCategory('all', !this.forceSelection);
            }
        },

        selectDatabase: function(database, domain, checked) {
            if (checked) {
                this.currentSelection.push({
                    domain: domain,
                    name: database
                });

                this.currentSelection = _.uniq(this.currentSelection, function (item) {
                    // uniq uses reference equality on the transform
                    return escapeHodIdentifier(item.domain) + ':' + escapeHodIdentifier(item.name);
                });
            } else {
                this.currentSelection = _.reject(this.currentSelection, function (selectedItem) {
                    return selectedItem.name === database && selectedItem.domain === domain;
                });
            }

            this.updateCheckedOptions();
            this.triggerChange();
        },

        selectCategory: function(category, checked) {
            var findNode = function(node, name) {
                if (node.name === name) {
                    return node;
                }
                else if (_.isArray(node.children)) {
                    return _.find(node.children, function(child) {
                        return findNode(child, name);
                    })
                }
            };

            var findDatabases = function(node) {
                if (_.isArray(node.children)) {
                    return _.chain(node.children)
                        .map(function(child) {
                            return findDatabases(child);
                        })
                        .flatten()
                        .value();
                }
                else {
                    return node.children.map(function(child) {
                        return child.pick('domain', 'name');
                    });
                }
            };

            var databases = findDatabases(findNode(this.hierarchy, category));

            if (checked) {
                this.currentSelection = _.chain([this.currentSelection, databases]).flatten().uniq(function (item) {
                    return escapeHodIdentifier(item.domain) + ':' + escapeHodIdentifier(item.name);
                }).value();
            } else {
                this.currentSelection = _.reject(this.currentSelection, function (selectedItem) {
                    return _.findWhere(databases, selectedItem);
                });
            }

            this.updateCheckedOptions();
            this.triggerChange();
        },

        triggerChange: function() {
            this.trigger('change', this.getSelection());
        },

        getSelection: function() {
            return _.isEmpty(this.currentSelection) ? this.collection.getResourceIdentifiers() : _.clone(this.currentSelection);
        },

        setSelection: function(selection) {
            this.currentSelection = selection;
            this.updateCheckedOptions();
            this.triggerChange();
        },

        updateCheckedOptions: function() {
            _.each(this.$databaseCheckboxes.add(this.$categoryCheckboxes), function(checkbox) {
                var $checkbox = $(checkbox);
                this.uncheck($checkbox);
                this.enable($checkbox);
                this.determinate($checkbox);
            }, this);

            _.each(this.$databaseCheckboxes, function (checkbox) {
                var $checkbox = $(checkbox);

                if (_.findWhere(this.currentSelection, {name: $checkbox.attr('data-id'), domain: $checkbox.attr('data-domain')})) {
                    this.check($checkbox);

                    if (this.forceSelection && this.currentSelection.length === 1) {
                        this.disable($checkbox);
                    }
                }
            }, this);

            this.updateCategoryCheckbox(this.hierarchy);
        },

        updateCategoryCheckbox: function(node) {
            var $categoryCheckbox = this.$('[data-category-id="' + node.name + '"]');
            var childIndexes;

            if (_.isArray(node.children)) {
                // traverse each of the child categories recursively
                // the flatMap gives a list of all the indexes in this category and its descendants
                childIndexes = _.chain(node.children)
                    .map(function(child) {
                        return this.updateCategoryCheckbox(child);
                    }, this)
                    .flatten()
                    .value();
            }
            else {
                // the indexes are the ones in the collection for this category
                childIndexes = node.children.map(function(child) {
                    return child.pick('domain', 'name');
                });
            }

            // checkedState is an array containing true if there are checked boxes, and false if there are unchecked boxes
            var checkedState = _.chain(childIndexes)
                .map(function(childIndex) {
                    return Boolean(_.findWhere(this.currentSelection, childIndex));
                }, this)
                .uniq()
                .value();

            var checkedBoxes = _.contains(checkedState, true);
            var unCheckedBoxes = _.contains(checkedState, false);

            if (checkedBoxes && unCheckedBoxes) {
                this.indeterminate($categoryCheckbox);
            }
            else if (checkedBoxes) {
                // all the category's children are checked
                this.check($categoryCheckbox);

                // if this category's children comprise the entire selection, it should be disabled
                // otherwise clicking it would leave an empty database selection
                if (this.forceSelection && this.currentSelection.length === childIndexes.length) {
                    this.disable($categoryCheckbox);
                }
            }
            else {
                this.uncheck($categoryCheckbox);
            }

            // return the list of child categories for use in the flatMap of the ancestor category
            return childIndexes;
        },

        updateEmptyMessage: function() {
            if (this.$emptyMessage && this.$databasesList) {
                this.$emptyMessage.toggleClass('hide', !this.collection.isEmpty());
                this.$databasesList.toggleClass('hide', this.collection.isEmpty());
            }
        }
    });

});
