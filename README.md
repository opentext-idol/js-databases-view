# HP Autonomy Databases View

[![Build Status](https://travis-ci.org/hpe-idol/js-databases-view.svg?branch=master)](https://travis-ci.org/hpe-idol/js-databases-view)

A Backbone View for displaying and selecting HPE Haven OnDemand resources.

This project exposes AMD modules. The path to the project root directory must be aliased as databases-view. The module names
in the documentation reflect this.

Documentation can be found [here](http://hpe-idol.github.io/js-databases-view).

This repo uses git-flow. develop is the development branch. master is the last known good branch.

## Usage
    bower install hp-autonomy-js-databases-view
    
## Grunt tasks
* grunt : runs the lint, test, and coverage tasks
* grunt test : Runs the Jasmine tests in Phantom JS
* grunt browser-test : Starts a server on localhost:8000, which can be used to run the Jasmine tests in the browser
* grunt coverage : Generates code coverage statistics
* grunt lint : Runs js-lint and coffeelint
* grunt doc : Generates project documentation
* grunt watch-doc : Watches for changes and regenerates the documentation
* grunt watch-test : Watches for changes and reruns the tests
    
## Is it any good?
Yes

## License
Copyright 2015 Hewlett-Packard Development Company, L.P.
Copyright 2015-2017 Hewlett Packard Enterprise Development LP

Licensed under the MIT License (the "License"); you may not use this project except in compliance with the License.
