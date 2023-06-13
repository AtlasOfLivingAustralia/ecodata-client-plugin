function MetaModel(metaModel) {
    var self = this;
    self.metaModel = metaModel;

    function findDataModelItemByNameInOutputModel(name, context) {
        if (!context) {
            return ;
        }

        return context.forEach(function (node) {
            if (node.name === name) {
                return node;
            } else if (isNestedDataModelType(node)) {
                const nested = getNestedDataModelNodes(node);
                return findDataModelItemByName(name, nested);
            } else {
                return null;
            }
        });
    }

    function getNamesForDataType(type) {
        var outputModels = self.metaModel.outputModels,
            result = {};

        for(var name in outputModels) {
            var output = outputModels[name];

            result[name] = getNamesForDataTypeInOutputModel(type, output.dataModel);
        }

        return result;
    }

    function getNamesForDataTypeInOutputModel(type, context) {
        var names = {};
        var childrenNames;

        if (!context) {
            return ;
        }

        context.forEach(function (data) {
            if (isNestedDataModelType(data)) {
                // recursive call for nested data model
                childrenNames = getNamesForDataTypeInOutputModel(type, getNestedDataModelNodes(data));
                if (Object.keys(childrenNames).length > 0) {
                    names[data.name] = childrenNames;
                }
            }

            if (data.dataType === type) {
                names[data.name] = true;
            }
        });

        return names;
    }

    function getDataForType(type, activity) {
        if (!activity.outputs || !type) {
            return
        }

        var pathToData = getNamesForDataType(type),
            data = [];
        for (var outputName in pathToData) {
            var path, result;
            var output = findDataByModelName(outputName, activity)[0];
            if(output) {
                path = pathToData[outputName];
                result = getData(output, path)
                merge(result, data);
            }
        }

        return data;
    }

    /**
     *
     * @param output
     * @param paths - {'foo': true, 'bar': {'baz': true}}
     */
    function getData (output, paths) {
        var pathsToData = serializePaths(paths);
        var data = [];

        pathsToData.forEach(function (path) {
            var result = getDataFromPath(path, output);
            merge(result, data);
        });

        return data;
    }

    function merge(input, output) {
        if (Array.isArray(input)) {
            output.push.apply(output, input);
        }
        else {
            output.push(input);
        }

        return output;
    }

    function serializePaths(obj) {
        var paths = [];

        function traverse(obj, currentPath) {
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    var value = obj[key];
                    var newPath = currentPath.concat(key);

                    if (value === true) {
                        paths.push(newPath);
                    } else if (typeof value === 'object' && value !== null) {
                        traverse(value, newPath);
                    }
                }
            }
        }

        traverse(obj, ['data']);
        return paths;
    }

    function getDataFromPath(path, output) {
        var temp = output;
        var result = [];
        var navigatedPath = [];

        if (path) {
            path.forEach(function(prop) {
                if (Array.isArray(temp)) {
                    temp.forEach(function(map) {
                        result.push.apply(result, getDataFromPath(path.filter(function(p) {
                            return !navigatedPath.includes(p);
                        }), map));
                    });

                    temp = null;
                } else {
                    temp = temp[prop];
                }

                navigatedPath.push(prop);
            });
        }

        if (temp !== null) {
            if (temp instanceof Array) {
                result.push.apply(result, temp);
            } else {
                result.push(temp);
            }
        }

        return result;
    }

    function findDataByModelName(name, activity) {
        return $.grep(activity.outputs || [], function (output) { return output.name == name;})
    }

    function isNestedDataModelType(node) {
        return Array.isArray(node.columns) && node.dataType !== "geoMap";
    }

    function getNestedDataModelNodes(node) {
        return node.columns;
    }

    function updateDataForSources (sourceNames, activity, dataToUpdate) {
        var outputModels = self.metaModel.outputModels;
        for (var name in outputModels) {
            var sourceNamesForOutput = sourceNames[name],
                outputData = findDataByModelName(name, activity)[0];

            updateDataForSourcesInOutput(sourceNamesForOutput, outputData.data, dataToUpdate);
        }
    }

    function updateDataForSourcesInOutput(sourceNamesForOutput, outputData, data) {
        var childrenNames;
        if (!sourceNamesForOutput) {
            return ;
        }

        for (var name in sourceNamesForOutput) {
            childrenNames = sourceNamesForOutput[name];
            if (childrenNames === true) {
                outputData[name] = data;
            }
            else if (typeof childrenNames === 'object') {
                if (Array.isArray(outputData[name])) {
                    outputData[name].forEach(function (item) {
                        updateDataForSourcesInOutput(childrenNames, item, data);
                    });
                }
                else {
                    updateDataForSourcesInOutput(childrenNames, outputData[name], data);
                }
            }
        }
    }



    return {
        getDataForType: getDataForType,
        getNamesForDataType: getNamesForDataType,
        updateDataForSources: updateDataForSources
    }
}