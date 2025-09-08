<%@ page contentType="text/html;charset=UTF-8" %>
<html>
<head>
    <title>Preview ${model.modelName}</title>
    <asset:stylesheet src="preview.css"/>
    <md:modelStyles model="${model}" edit="true"/>
    <script>
    // This is required by the ImageViewModel - should be passed in via the config rather than implicitly
    // requiring access to a global.
    // it also has server side dependencies that are not currently part of the ecodata-client-plugin codebase.
    window.fcConfig = {
        imageLeafletViewer:'/',
        imagePreviewUrl: '${createLink(action:'imagePreview')}',
        saveBookmarkLocationURL: "${createLink(controller:"preview", action:"saveBookmarkLocation")}",
        getBookmarkLocationsURL: "${createLink(controller:"preview", action:"getBookmarkLocations")}"
    };
    window.modelReady = true

</script>
</head>
<body>
<div class="container-fluid validationEngineContainer">

    <div class="row">
        <div class="col-sm-3 list">
            <h3>All examples</h3>
            <ul class="unstyled">
                <g:each in="${examples}" var="example">
                    <li>
                        <div class="row">
                            <div class="title col-sm-8">${example.title}</div>

                            <div class="col-sm-2">
                                <a href="${g.createLink(action:'index', params:[name:example.name, mode:'view'])}" class="btn btn-sm"><i class="fa fa-eye"></i> </a>
                            </div>
                            <div class="col-sm-2">
                                <a href="${g.createLink(action:'index', params:[name:example.name])}" class="btn btn-sm"><i class="fa fa-edit"></i> </a>
                            </div>
                        </div>
                    </li>
                </g:each>
            </ul>
        </div>
        <div id="output-container" class="col-sm-9 example">

            <h3>${model.title ?: model.modelName}</h3>
            <md:modelView model="${model}" edit="${params.mode != 'view'}" printable="${false}"/>

            <hr/>
            <h3>Model JSON</h3>
            <pre id="model-display"></pre>
        </div>

    </div>

</div>
<g:render template="/output/mapInDialogEditTemplate"/>
</body>
<asset:javascript src="preview.js"/>

<g:render template="/output/outputJSModel"
          model="${[edit: params.mode != 'view',
                    model: model,
                    outputName: model.modelName]}">

</g:render>

<asset:deferredScripts/>
<script>
    function blockUIWithMessage(message) { }

    $(function() {
        var modelName = '${md.toSingleWord(name:model.modelName)}';

        var outputModel = JSON.parse('${model.encodeAsJavaScript()}');

        var dataModel = outputModel.dataModel;
        var config = {
            bieUrl:'',
            searchBieUrl:'',
            model: outputModel,
            prepopUrlPrefix: window.location.origin, //"http://localhost:${serverPort}",
            viewRootElementId:'output-container'
        };
        var output = {};
        <g:if test="${data}">
        var outputData = JSON.parse('${data.encodeAsJavaScript()}');
        output.data = outputData;
        </g:if>
        // copy changes to site object to listSites action in PreviewController
        var site = {
            siteId: 'abc',
            projects: ['projectA'],
            name: 'Test site',
            extent: {
                geometry: {
                    coordinates: [134, -21],
                    type: 'Point'
                }
            },
            geoIndex: {
                coordinates: [134, -21],
                type: 'Point'
            }
        };

        var context = {
            activityData: {
                value1: 1,
                value2: "2"
            },
            documents:[
                {
                    documentId:'d1',
                    url:fcConfig.imagePreviewUrl+'/Landscape_1.jpg',
                    thumbnailUrl:fcConfig.imagePreviewUrl+'/Landscape_1.jpg',
                    "name": "Test image 1",
                    "attribution": "Test attribution 1",
                    "notes": "Test notes 1",
                    filename:"Landscape_1.jpg",
                    filesize:1000

                },
                {
                    documentId:'d2',
                    url:fcConfig.imagePreviewUrl+'/Landscape_2.jpg',
                    thumbnailUrl:fcConfig.imagePreviewUrl+'/Landscape_2.jpg',
                    "name": "Test image 2",
                    "attribution": "Test attribution 2",
                    "notes": "Test notes 2",
                    filename:"Landscape_2.jpg",
                    filesize:1000

                },
                {
                    documentId:'d3',
                    url:fcConfig.imagePreviewUrl+'/Landscape_1.jpg',
                    thumbnailUrl:fcConfig.imagePreviewUrl+'/Landscape_1.jpg',
                    "name": "Test image 3",
                    "attribution": "Test attribution 3",
                    "notes": "Test notes 3",
                    filename:"Landscape_1.jpg",
                    filesize:1000
                }
            ],
            pActivity: {
                projectActivityId: 'projectActivityA',
                projectId : 'projectA',
                allowPolygons: true,
                allowPoints: true,
                allowLine: true,
                surveySiteOption: 'sitepickcreate',
                defaultZoomArea: '123',
                sites: [
                    site
                ]
            },
            getSiteUrl: "${createLink(action: 'getSite')}",
            updateSiteUrl: "${createLink(action: 'updateSite')}",
            listSitesUrl: "${createLink(action: 'listSites')}",
            spatialGeoserverUrl: "${createLink(action: 'spatialGeoserver')}",
            proxyFeatureUrl: "${createLink(action: 'proxyFeature')}",
            uniqueNameUrl: "${createLink(action: 'uniqueName')}",
            checkPointUrl: "${createLink(action: 'checkPoint')}"
        };

        // geoMap dependent functions
        function resolveSites () {
            return [site];
        }

        window.Biocollect = {
            MapUtilities : {
                getBaseLayerAndOverlayFromMapConfiguration: function () {
                    return {}
                },
                featureToValidGeoJson: function (geometry) {
                    var pointGeoJSON =  {"type":"Feature","geometry":{"type":"Point","coordinates":[1,1]},"properties":{}};
                    var lineGeoJSON = {"type":"Feature","geometry":{"type":"LineString","coordinates":[[1,1], [1,1]]},"properties":{}};
                    var polygonGeoJSON = {"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[1,1],[2,2],[3,3]]]},"properties":{}};
                    if (geometry.type === 'Point')
                        return pointGeoJSON;
                    else if (geometry.type === 'LineString')
                        return lineGeoJSON;
                    else
                        return polygonGeoJSON;
                }

            }
        };
        // This is required by any models that use the feature dataType
        context.featureCollection = config.featureCollection = new ecodata.forms.FeatureCollection([]);

        var model = ecodata.forms.initialiseOutputViewModel(modelName, dataModel, output, config, context);

        // Expose our model in the global scope to get at it easily with GEB
        window.model = model;
        window.modelReady = true;

        $('.validationEngineContainer').validationEngine();

        $('#model-display').html(syntaxHighlight(JSON.stringify(outputModel, undefined, 2)));
        // @see https://stackoverflow.com/questions/4810841/how-can-i-pretty-print-json-using-javascript
        function syntaxHighlight(json) {
            if (typeof json != 'string') {
                json = JSON.stringify(json, undefined, 2);
            }
            json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                var cls = 'number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'key';
                    } else {
                        cls = 'string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'boolean';
                } else if (/null/.test(match)) {
                    cls = 'null';
                }
                return '<span class="' + cls + '">' + match + '</span>';
            });
        }
    });

</script>
</html>
