<div class="feature-map">
    <div class="row">
        <div class="col-sm-8">
            <div class="map-container">
                <m:map id="map-holder" width="100%"></m:map>
            </div>
        </div>
        <div class="col-sm-4">
            <div class="sites-list-sidebar">
                <div class="editable-sites accordion-group">
                    <div class="sites-list-heading">
                        <div class="site-label">
                            <label class="site-category-heading" data-bind="text:editableSitesHeading"></label>

                            <div class="btn-container">
                                <button class="btn btn-sm" type="button" data-bind="click:$root.defaultZoom"><i class="fa fa-search"></i></button>
                                <button class="btn btn-sm" type="button" data-bind="click:$root.editSites"><i class="fa fa-edit"></i></button>
                            </div>
                        </div>

                        <div class="site-information">
                            <label class="site-area">Total area (ha): <span data-bind="text:areaHa"></span></label>
                            <label class="site-length">Total length (km): <span data-bind="text:lengthKm"></span></label>
                        </div>
                    </div>


                    <ul class="sites-category unstyled accordion-inner">
                        <li data-bind="if:editableSites().length == 0">No sites have been defined</li>
                        <!-- ko foreach:editableSites -->
                        <li class="clearfix site-label"
                            data-bind="event:{mouseover:$root.highlightFeature, mouseout:$root.unhighlightFeature}">
                            <label>
                                <input type="text" style="width: 90%" data-bind="value:properties.name || 'Unnamed site'">
                            </label>

                            <div class="btn-container">
                                <button class="btn btn-sm" type="button" data-bind="click:$root.deleteFeature"><i
                                        class="fa fa-remove"></i>
                                </button>
                                <button class="btn btn-sm" type="button" data-bind="click:$root.zoomToFeature"><i
                                        class="fa fa-search"></i>
                                </button>
                            </div>

                        </li>
                        <!-- /ko -->
                    </ul>
                </div>

                <div class="accordion">
                    <!-- ko foreach: categories -->
                    <div class="accordion-group" data-bind="if:features && features.length">
                        <div class="sites-list-heading">
                            <a class="accordion-toggle"
                               data-bind="toggleVisibility:'#sites-category-'+$index()">

                            </a>

                            <div class="site-label">
                                <label class="site-category-heading collapsable" data-bind="text:category"></label>

                                <div class="btn-container">
                                    <button class="btn btn-sm" type="button" data-bind="click:$root.zoomToCategorySites"><i
                                            class="fa fa-search"></i></button>
                                </div>
                            </div>
                        </div>

                        <div data-bind="attr:{id:'sites-category-'+$index()}" class="accordion-body collapse in"
                             style="display: none">
                            <div class="accordion-inner">
                                <ul class="sites-category unstyled" data-bind="foreach:features">
                                    <li class="clearfix site-label"
                                        data-bind="event:{mouseover:$root.highlightFeature, mouseout:$root.unhighlightFeature}">
                                        <label><span
                                                data-bind="text:properties.name || 'Unnamed site'"></span></label>

                                        <div class="btn-container">
                                            <button class="btn btn-sm" type="button" data-bind="click:$root.copyFeature, enable:$root.copyEnabled"
                                                    title="Copy (and edit) this site"><i class="fa fa-copy"></i>
                                            </button>
                                            <button class="btn btn-sm" type="button" data-bind="click:$root.zoomToFeature"
                                                    title="Zoom to this site"><i class="fa fa-search"></i>
                                            </button>
                                        </div>

                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <!-- /ko -->

                </div>
            </div>
        </div>
    </div>
    <script type="text/html" id="editing-in-progress-reminder">
        <div>
            <p><b>Reminder</b></p>

            <p>
                This screen is currently in an Edit or Delete mode.
            </p>

            <p>
                Please inactivate the relevant mode, prior to leaving this page, by returning to either icon and selecting one of the highlighted options on the toolbar on the left of the map.
            </p>

            <div class="actions-holder"></div>

        </div>
    </script>

</div>
