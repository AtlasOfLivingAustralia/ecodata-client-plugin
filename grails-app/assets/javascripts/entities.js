var entities = (function () {
    var GROUP = "GROUP_OF_SPECIES", SINGLE = "SINGLE_SPECIES", ALL = 'ALL_SPECIES', SPECIES_MAX_FETCH = 20;

    var projectPromise, paPromise;
    var limit = 5, query = "", offset = 0;
    var db = getDB(), dbOpen = convertToJqueryPromise(db.open(), true), forceOffline = false,
    downloadingAllSpecies = false;

    function getProject(projectId) {
        return isOffline().then(function () {
            return offlineFetchProject(projectId);
        }, function () {
            return onlineFetchProject();
        });
    }

    function onlineFetchProject(isSave) {
        isSave = isSave || false;
        if (!projectPromise) {
            projectPromise = $.ajax({
                url: fcConfig.projectURL
            });

            projectPromise.then(saveProject);
        }

        return projectPromise.then(function (result) {
            return standardiseResult(result);
        });
    }

    function offlineFetchProject(projectId) {
        projectId = projectId || fcConfig.projectId;
        return dbOpen.then(function () {
            return convertToJqueryPromise(db.table('project').where('projectId').equals(projectId).first());
        });
    }

    function saveProject(project) {
        return dbOpen.then(function () {
            return convertToJqueryPromise(db.table('project').put(project));
        });
    }

    function getProjectActivity(pActivityId) {
        return isOffline().then(function () {
            return offlineFetchProjectActivity(pActivityId);
        }, function () {
            return onlineFetchProjectActivity(pActivityId);
        });
    }

    function onlineFetchProjectActivity(pActivityId) {
        if (!paPromise) {
            paPromise = $.ajax({
                url: fcConfig.projectActivityURL + "/" + pActivityId
            });

            paPromise.then(saveProjectActivity);
        }

        return paPromise.then(function (result) {
            return standardiseResult(result);
        });
    }

    function offlineFetchProjectActivity(pActivityId) {
        pActivityId = pActivityId || fcConfig.projectActivityId;
        return dbOpen.then(function () {
            return convertToJqueryPromise(db.table('projectActivity').where('projectActivityId').equals(pActivityId).first());
        });
    }

    function saveProjectActivity(pa) {
        return dbOpen.then(function () {
            return convertToJqueryPromise(db.table('projectActivity').put(pa));
        });
    }

    function getActivitiesForProjectActivity(projectActivityId, max, offset, sort, order) {
        return offlineGetActivitiesForProjectActivity(projectActivityId, max, offset, sort, order);
    }

    function saveActivities(activities) {
        return dbOpen.then(function () {
            return convertToJqueryPromise(db.table('activity').bulkPut(activities));
        })
    }

    function offlineGetActivitiesForProjectActivity(projectActivityId, max, offset, sort, order) {
        sort = sort || 'activityId';
        order = order || 'DESC';
        max = max || 30;
        offset = offset || 0;

        function paFilter(item){ return item.projectActivityId == projectActivityId }

        return dbOpen.then(function () {
            var promise,
                countPromise = convertToJqueryPromise(db.table('activity').where('projectActivityId').equals(projectActivityId).count());
            switch (order) {
                default:
                case 'DESC':
                    promise = convertToJqueryPromise(db.table('activity').orderBy(sort).filter(paFilter).reverse().offset(offset).limit(max).toArray());
                    break;
                case 'ASC':
                    promise = convertToJqueryPromise(db.table('activity').orderBy(sort).filter(paFilter).offset(offset).limit(max).toArray());
                    break;
            }

            return $.when(promise, countPromise).then(function (activitiesResult, totalResult) {
                return {data: {activities: activitiesResult.data, total: totalResult.data}};
            });
        });
    }

    function getActivity(activityId) {
        return isOffline().then(function () {
            return offlineGetActivity(activityId);
        }, function () {
            return onlineGetActivity(activityId).then(function (result){
                return standardiseResult(result);
            }, function () {
                // dexie will return not get activity if it is of the wrong type.
                try {
                    activityId = parseInt(activityId);
                } catch (e) {
                    console.debug("activityId is not a number - " + activityId);
                }
                return offlineGetActivity(activityId);
            });
        });
    }

    function onlineGetActivity(activityId) {
        var promise = $.ajax({
            url: fcConfig.activityURL + '/' + activityId
        });

        promise.then(function (result) {
            saveActivity(result);
            return  result;
        }, function (error) {
            console.log("failed to get activity from server");
        });
        return promise;
    }

    function offlineGetActivity(activityId) {
        var isDexie = false;
        if (isUuid(activityId) || (isDexie = isDexieEntityId(activityId))) {
            if (isDexie) {
                activityId = convertIdToInteger(activityId);
            }

            return dbOpen.then(function () {
                return convertToJqueryPromise(db.table('activity').where('activityId').equals(activityId).first());
            });
        } else return $.Deferred().resolve({
            data: {
                activityId: '', siteId: '', projectId: fcConfig.projectId, type: fcConfig.type
            }
        }).promise();
    }

    function offlineGetAllActivities(max, offset, sort, order) {
        sort = sort || 'activityId';
        order = order || 'DESC';
        max = max || 30;
        offset = offset || 0;

        return dbOpen.then(function () {
            var promise, countPromise = convertToJqueryPromise(db.table('activity').count());
            switch (order) {
                default:
                case 'DESC':
                    promise = convertToJqueryPromise(db.table('activity').orderBy(sort).reverse().offset(offset).limit(max).toArray());
                    break;
                case 'ASC':
                    promise = convertToJqueryPromise(db.table('activity').orderBy(sort).offset(offset).limit(max).toArray());
                    break;
            }

            return $.when(promise, countPromise).then(function (activitiesResult, totalResult) {
                return {data: {activities: activitiesResult.data, total: totalResult.data}};
            });
        });
    }

    function offlineGetActivitiesForProject(projectId, max, offset, sort, order) {
        sort = sort || 'activityId';
        order = order || 'DESC';
        max = max || 30;
        offset = offset || 0;

        function pFilter (item) { return item.projectId == projectId }

        return dbOpen.then(function () {
            var promise,
                countPromise = convertToJqueryPromise(db.table('activity').where('projectId').equals(projectId).count());
            switch (order) {
                default:
                case 'DESC':
                    promise = convertToJqueryPromise(db.table('activity').orderBy(sort).filter(pFilter).reverse().offset(offset).limit(max).toArray());
                    break;
                case 'ASC':
                    promise = convertToJqueryPromise(db.table('activity').orderBy(sort).filter(pFilter).offset(offset).limit(max).toArray());
                    break;
            }

            return $.when(promise, countPromise).then(function (activitiesResult, totalResult) {
                return {data: {activities: activitiesResult.data, total: totalResult.data}};
            });
        });
    }

    function getSite(siteId) {
        return isOffline().then(function () {
            return offlineGetSite(siteId);
        }, function () {
            return onlineGetSite(siteId);
        });
    }

    function onlineGetSite(siteId) {
        var deferred = $.Deferred();
        $.ajax({
            url: fcConfig.siteUrl + "/" + siteId
        }).then(function (result) {
            saveSite(result.site);
            deferred.resolve(standardiseResult(result.site));
        }, function (){
            offlineGetSite(siteId).then(function (result) {
                deferred.resolve(result);
            }, function () {
                deferred.reject();
            });
        });

        return deferred;
    }

    function saveSite(site) {
        return dbOpen.then(function () {
            return convertToJqueryPromise(db.table('site').put(site));
        });
    }

    function saveSites(sites) {
        return dbOpen.then(function () {
            return convertToJqueryPromise(db.table('site').bulkPut(sites));
        });
    }

    function offlineGetSite(siteId) {
        return dbOpen.then(function () {
            return convertToJqueryPromise(db.table('site').where('siteId').equals(siteId).first());
        });
    }

    function saveSpeciesPaged(species) {
        return dbOpen.then(function () {
            return convertToJqueryPromise(db.table('taxon').bulkPut(species));
        })
    }

    function deleteAllSpecies() {
        return dbOpen.then(function () {
            return db.taxon.where({
                listId: "all"
            }).delete();
        });
    }

    function countAllSpecies() {
        return dbOpen.then(function () {
            return convertToJqueryPromise(db.taxon.where({
                listId: "all"
            }).count());
        });
    }

    /**
     * Sequentially download sites. This is done sequentially to avoid overloading the server.
     * @param sites
     * @param index
     * @param deferred
     * @returns {*}
     */
    function getSites(sites, index, deferred) {
        index = index || 0;
        deferred = deferred || $.Deferred();

        if (index < sites.length) {
            onlineGetSite(sites[index]).always(function () {
                getSites(sites, index + 1, deferred);
            });
        } else {
            deferred.resolve({message: "Finished fetching sites", success: true});
        }

        return deferred.promise();
    }

    function offlineGetSites (siteIds) {
        return dbOpen.then(function () {
            return convertToJqueryPromise(db.site.where("siteId").anyOf(siteIds).toArray());
        });
    }

    function offlineGetSitesForProject (projectId) {
        return dbOpen.then(function () {
            return convertToJqueryPromise(db.site.where("projects").equals(projectId).toArray());
        });
    }

    function offlineCheckSiteWithName(projectId, name, callback) {
        return dbOpen.then(function (){
            return db.site.where("projects").anyOf(projectId).and(function (site) {
                return site.name === name;
            }).count(callback);
        });
    }

    function searchSpecies(projectActivityId, dataFieldName, outputName, data, limit) {
        var deferred = $.Deferred();
        dbOpen.then(function () {
            db.taxon.where({'projectActivityId': projectActivityId,'dataFieldName': dataFieldName,'outputName': outputName})
                .count(function (count){
                    if (count > 0) {
                        db.taxon.where({'projectActivityId': projectActivityId,'dataFieldName': dataFieldName,'outputName': outputName})
                            .and(function (item) {
                                if(data.q) {
                                    var query = data.q.toLowerCase();
                                    return (item.name && item.name.toLowerCase().startsWith(query)) ||
                                        (item.scientificName && item.scientificName.toLowerCase().startsWith(query)) ||
                                        (item.commonName && item.commonName.toLowerCase().startsWith(query));
                                }
                                else
                                    return true
                            })
                            .limit(limit).toArray()
                            .then(function (data) {
                                deferred.resolve({autoCompleteList: data});
                            })
                            .catch(function (e) {
                                deferred.reject(e);
                            });
                    }
                    else {
                        var promises = [];
                        limit = limit / 2;
                        promises.push(db.taxon.where('scientificName').startsWithIgnoreCase(data.q).and(function (item){
                            return item.listId === 'all'
                        }).limit(limit).toArray());
                        promises.push(db.taxon.where('commonName').startsWithIgnoreCase(data.q).and(function (item){
                            return item.listId === 'all'
                        }).limit(limit).toArray());

                        Promise.all(promises).then(function (data){
                            var data1 = data[0] || [],
                                data2 = data[1] || [];
                            data1.push.apply(data1, data2);
                            deferred.resolve({autoCompleteList: data1});
                        })
                    }
                });
        });
        return deferred.promise();
    }

    /**
     * Save an array of species to the database.
     * @param data
     * @returns {*}
     */
    function saveSpecies(data, dataFieldName, outputName, projectActivityId) {
        console.log("in addSpecies");
        if (data.length === 0) {
            return data;
        }

        data.forEach(function (item) {
            delete item.commonNameMatches;
            delete item.scientificNameMatches;
            delete item.id;
            item.projectActivityId = projectActivityId;
            item.dataFieldName = dataFieldName;
            item.outputName = outputName;
        });

        return dbOpen.then(function () {
            return convertToJqueryPromise(db.taxon.bulkPut(data)).then(function() {
                return data;
            });
        });
    };

    /**
     *
     * @param projectActivityId
     * @param dataFieldName
     * @param outputName
     * @returns {*}
     */
    function deleteSpeciesEntries(projectActivityId, dataFieldName, outputName) {
        return dbOpen.then(function () {
            return convertToJqueryPromise(db.taxon.where({
                projectActivityId: projectActivityId, dataFieldName: dataFieldName, outputName: outputName
            }).delete());
        });
    }

    function getSpeciesForProjectActivity(pa, callback) {
        var promises = [];
        pa.speciesFields && pa.speciesFields.forEach(function (field) {
            var config = field.config, type = config.type;
            console.log("fetching species");
            switch (type) {
                case GROUP:
                case SINGLE:
                    promises.push(deleteFetchedSpeciesEntriesAndGetSpeciesForProjectActivityAndFieldInOutput(pa.projectActivityId, field.dataFieldName, field.output, callback));
                    break;
                case ALL:
                    promises.push(downloadAllSpecies(callback));
                    break;
            }
        });

        return $.when.apply($, promises);
    }

    function deleteSpeciesForProjectActivity(pa) {
        var promises = [];
        pa.speciesFields && pa.speciesFields.forEach(function (field) {
            var config = field.config, type = config.type;
            console.log("fetching species");
            switch (type) {
                case GROUP:
                case SINGLE:
                    promises.push(deleteSpeciesEntries(pa.projectActivityId, field.dataFieldName, field.output));
                    break;
                case ALL:
                    promises.push(deleteAllSpecies());
                    break;
            }
        });

        return $.when.apply($, promises);
    }

    function onlineGetSpeciesForProjectActivityAndFieldInOutput(offset, projectActivityId, dataFieldName, outputName, limit) {
        return $.ajax({
            url: fcConfig.fetchSpeciesUrl, data: {
                projectActivityId: projectActivityId,
                dataFieldName: dataFieldName,
                output: outputName,
                limit: limit,
                q: "",
                offset: offset
            }
        }).then(function (result) {
            return result.autoCompleteList;
        }, function (){
            console.log(arguments)
        });
    };

    function downloadAllSpecies (callback) {
        var page = 0,
        total = 1,
        deferred = $.Deferred();
        if (downloadingAllSpecies)
            return deferred.resolve().promise();

        downloadingAllSpecies = true;
        function fetchNext () {
            page ++;
            if (page <= total) {
                console.log("downloaded " + page + " of " + total);
                return $.ajax({
                    url: fcConfig.downloadSpeciesUrl + "?page=" + page
                }).then(function (species) {
                    console.log("saving species");
                    updateProgress();
                    saveSpeciesPaged(species).then(fetchNext, function () {
                        console.error("Failed to save species to database.");
                        console.log(arguments);
                        deferred.reject();
                    });
                }, function () {
                    console.log("error retrieving species");
                    updateProgress();
                    downloadingAllSpecies = false;
                    deferred.reject();
                });
            }
            else {
                downloadingAllSpecies = false;
                deferred.resolve();
            }

            updateProgress();
        }

        function startFetchingSpecies () {
            return $.ajax({
                url: fcConfig.totalUrl,
                success: function (resp) {
                    total = resp.total;
                    updateProgress();
                }
            }).then(fetchNext);
        }

        function updateProgress () {
            callback && callback(total, page);
        }

        countAllSpecies().then(function (result) {
            if(result.data === 0) {
                startFetchingSpecies();
            }
            else {
                deferred.resolve();
            }
        });

        return deferred.promise();
    }


    function deleteFetchedSpeciesEntriesAndGetSpeciesForProjectActivityAndFieldInOutput(projectActivityId, dataFieldName, outputName, callback) {
        var offset = 0, deferred = $.Deferred(), counter = 1, total = 100;

        function fetchNext(data) {
            if (!data || (data.length == SPECIES_MAX_FETCH)) {
                onlineGetSpeciesForProjectActivityAndFieldInOutput(offset, projectActivityId, dataFieldName, outputName, SPECIES_MAX_FETCH).then(function (result) {
                    callback(total, counter);
                    counter = (counter + 1) % total;
                    return saveSpecies(result, dataFieldName, outputName, projectActivityId);
                }).then(fetchNext).fail(function () {
                    callback(total, total);
                    deferred.reject({
                        offset: offset,
                        projectActivityId: projectActivityId,
                        dataFieldName: dataFieldName,
                        outputName: outputName,
                        completed: false,
                        message: "Failed to fetch species for " + dataFieldName + " " + outputName
                    });
                })
                offset += SPECIES_MAX_FETCH;
            } else {
                callback(total, total);
                deferred.resolve({
                    offset: offset,
                    projectActivityId: projectActivityId,
                    dataFieldName: dataFieldName,
                    outputName: outputName,
                    completed: true,
                    message: "Fetched all species for " + dataFieldName + " " + outputName
                });
            }
        }

        function deleteSuccessHandler(count) {
            console.log("Deleted " + count + " items");
            return;
        }

        function deleteFailHandler() {
            console.log("Deletion failed");
            console.log(arguments);
            return;
        }

        deleteSpeciesEntries(projectActivityId, dataFieldName, outputName).then(deleteSuccessHandler, deleteFailHandler).then(fetchNext);
        return deferred.promise();
    }

    function saveActivity(activity) {
        activity.activityId = activity.activityId || undefined;
        return dbOpen.then(function () {
            return convertToJqueryPromise(db.table('activity').put(activity));
        });
    }

    function getDocument(documentId) {
        return isOffline().then(function () {
            return offlineGetDocument(documentId);
        }, function () {
            return onlineGetDocument(documentId);
        });
    }

    function saveDocument(document) {
        return dbOpen.then(function () {
            return convertToJqueryPromise(db.table('document').put(document));
        });
    }

    function offlineGetDocument(documentId) {
        return dbOpen.then(function () {
            return convertToJqueryPromise(db.document.where("documentId").equals(documentId).first());
        });
    }

    function onlineGetDocument(documentId) {
        return $.ajax({
            url: fcConfig.documentUrl + "/" + documentId
        }).then(function (result) {
            return standardiseResult(result);
        });
    }

    function getProjectActivityMetadata(projectActivityId, activityId) {
        return onlineGetProjectActivityMetadata(projectActivityId, activityId);
    }

    function onlineGetProjectActivityMetadata(projectActivityId, activityId) {
        return $.ajax({
            url: fcConfig.metadataURL + "?projectActivityId=" + projectActivityId + (isUuid(activityId) ? "&activityId=" + activityId : "")
        })
            .done(saveProjectActivityMetadata)
            .then(function (result) {
                if (isDexieEntityId(activityId)) {
                    return offlineGetActivity(activityId).then(function (activityResult) {
                        result.activity = activityResult.data;
                        return standardiseResult(result);
                    });
                }

                return standardiseResult(result);
            }, function (xhr, status, error) {
                // project activity is resticted and user is not a member of project.
                if (status === "401")
                    return $.Deferred().reject({message: "Unauthorized"});
                else
                    return offlineGetProjectActivityMetadata(projectActivityId, activityId);
            });
    }

    function saveProjectActivityMetadata(metadata) {
        if (metadata.projectSite) {
            saveSite(metadata.projectSite);
        }

        if (metadata.project) {
            saveProject(metadata.project);
        }

        if (metadata.pActivity) {
            saveProjectActivity(metadata.pActivity);
        }

        if (metadata.metaModel) {
            var metaModel = mergeMetaModelAndOutputs(metadata);
            saveMetaModel(metaModel);
        }
    }

    function mergeMetaModelAndOutputs(metadata) {
        var outputs = metadata.outputModels;
        metadata.metaModel.outputModels = outputs;
        return metadata.metaModel;
    }

    function saveMetaModel(metaModel) {
        return dbOpen.then(function () {
            return convertToJqueryPromise(db.table('metaModel').put(metaModel));
        });
    }

    function offlineGetMetaModel(modelName) {
        return dbOpen.then(function () {
            return convertToJqueryPromise(db.table('metaModel').where('name').equals(modelName).first());
        });
    }

    function offlineGetProjectActivityMetadata(projectActivityId, activityId) {
        var paPromise = offlineFetchProjectActivity(projectActivityId),
            activityPromise = offlineGetActivity(activityId), result = $.Deferred();

        $.when(paPromise, activityPromise)
            .then(function (paResult, activityResult) {
                var pa = paResult.data, activity = activityResult.data, projectId = pa.projectId,
                    projectPromise = offlineFetchProject(projectId),
                    metaModelPromise = offlineGetMetaModel(pa.pActivityFormName),
                    sitePromise = offlineGetSite(activity.siteId)

                $.when(metaModelPromise, projectPromise, sitePromise)
                    .then(function (metaModelResult, projectResult, siteResult) {
                        var metaModel = metaModelResult.data, project = projectResult.data, site = siteResult.data,
                            projectSitePromise = offlineGetSite(project.projectSiteId);

                        projectSitePromise.then(function (projectSiteResult) {
                            var projectSite = projectSiteResult.data;
                            result.resolve(standardiseResult({
                                "activity": activity,
                                "mode": "",
                                "site": site,
                                "project": project,
                                "projectSite": projectSite,
                                "speciesLists": [],
                                "metaModel": metaModel,
                                "outputModels": metaModel.outputModels,
                                "themes": [],
                                "user": null,
                                "mapFeatures": [],
                                "pActivity": pa,
                                "speciesConfig": {"surveyConfig": {"speciesFields": pa.speciesFields}},
                                "projectName": project.name,
                                "isUserAdminModeratorOrEditor": false
                            }));
                        });
                    });
            }).catch(function () {
            result.reject({message: "Failed to get project activity metadata"});
        });

        return result.promise();
    }

    function bulkDeleteDocuments(documentIds) {
        return bulkDelete(documentIds, 'document');
    }

    function deleteSites(siteIds) {
        return bulkDelete(siteIds, 'site');
    }

    function deleteActivities(activityIds) {
        return bulkDelete(activityIds, 'activity');
    }

    function bulkDelete(ids, tableName) {
        if (!Array.isArray(ids)) {
            ids = [ids];
        }

        return dbOpen.then(function () {
            return convertToJqueryPromise(db.table(tableName).bulkDelete(ids));
        });
    }

    function deleteTable(tableName){
        return dbOpen.then(function (){
            return db.table(tableName).clear();
        })
    }

    function saveMap(map){
        return dbOpen.then(function () {
            return convertToJqueryPromise(db.table('offlineMap').put(map));
        });
    }

    function getMaps () {
        return dbOpen.then(function () {
            return convertToJqueryPromise(db.table('offlineMap').toArray());
        })
    }

    function deleteMap(mapId) {
        return bulkDelete([mapId], 'offlineMap');
    }

    function standardiseResult(result) {
        return {data: result}
    }

    function convertIdToInteger(id) {
        if (!isNaN(id)) {
            id = parseInt(id)
        }

        return id;
    }

    function getCredentials() {
        return dbOpen.then(function () {
            var promise = db.table('credential').toArray().then(function (credentials) {
                if (credentials.length > 0) {
                    setupAjax(credentials[0]);
                }

                return credentials;
            });

            return convertToJqueryPromise(promise);
        });
    }

    function saveCredentials(credentials) {
        return removeCredentials().then(function () {
            return db.table('credential').put(credentials);
        });
    }

    function setupAjax(credentials) {
        var authorization = "Bearer " + credentials.token;
        $.ajaxSetup({
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', authorization);
            }
        });
    }

    function removeCredentials() {
        return dbOpen.then(function () {
            return convertToJqueryPromise(db.table('credential').clear());
        });
    }

    /**
     * Dexie entity ids are integers.
     * @param id
     * @returns {boolean}
     */
    function isDexieEntityId(id) {
        if (isUuid(id))
            return false
        else
            return Number.isInteger(Number.parseInt(id))
    }

    return {
        getProject: getProject,
        getProjectActivity: getProjectActivity,
        saveProjectActivity: saveProjectActivity,
        getActivitiesForProjectActivity: getActivitiesForProjectActivity,
        getActivity: getActivity,
        getSite: getSite,
        offlineGetSite: offlineGetSite,
        getSites: getSites,
        offlineGetSites: offlineGetSites,
        offlineGetSitesForProject: offlineGetSitesForProject,
        saveSite: saveSite,
        saveSites: saveSites,
        deleteMap: deleteMap,
        saveMap: saveMap,
        getMaps: getMaps,
        offlineGetMetaModel: offlineGetMetaModel,
        offlineCheckSiteWithName: offlineCheckSiteWithName,
        offlineGetActivitiesForProject: offlineGetActivitiesForProject,
        offlineGetAllActivities: offlineGetAllActivities,
        offlineGetProjectActivityMetadata: offlineGetProjectActivityMetadata,
        offlineFetchProjectActivity: offlineFetchProjectActivity,
        saveActivities: saveActivities,
        saveActivity: saveActivity,
        getDocument: getDocument,
        saveDocument: saveDocument,
        saveSpecies: saveSpeciesPaged,
        searchSpecies: searchSpecies,
        deleteAllSpecies: deleteAllSpecies,
        countAllSpecies: countAllSpecies,
        offlineGetDocument: offlineGetDocument,
        getProjectActivityMetadata: getProjectActivityMetadata,
        deleteSpeciesForProjectActivity: deleteSpeciesForProjectActivity,
        getSpeciesForProjectActivity: getSpeciesForProjectActivity,
        bulkDeleteDocuments: bulkDeleteDocuments,
        deleteSites: deleteSites,
        deleteActivities: deleteActivities,
        deleteTable: deleteTable,
        getCredentials: getCredentials,
        removeCredentials: removeCredentials,
        saveCredentials: saveCredentials,
        utils: {
            isDexieEntityId: isDexieEntityId
        }
    }
})();

function getDB() {
    if (navigator.storage && navigator.storage.persisted) {
        var persistentPromise = navigator.storage.persisted();
        persistentPromise.then(async function (persistent) {
            console.log(`Storage API - persistent - ${persistent}`);
            if (!persistent && navigator.storage.persist) {
                var result = await navigator.storage.persist();
                console.log(`Storage API - persist - ${result}`);
            }
        });
    }

    var DB_NAME = "biocollect";
    var db = new Dexie(DB_NAME);
    db.version(5).stores({
        taxon: `
           ++id,
           projectActivityId,
           dataFieldName,
           outputName,
           name,
           scientificName,
           commonName,
           listId,
           [projectActivityId+dataFieldName+outputName]`,
        site: `++siteId,
           *projects`,
        projectActivity: `++projectActivityId,*sites`,
        project: `++projectId`,
        document: `++documentId`,
        activity: `++activityId,
                    projectActivityId,
                    projectId`,
        metaModel: `name`,
        offlineMap: `++id,name`,
        credential: `++userId`,
    });

    return db;
}

function convertToJqueryPromise(dexiePromise, doNotTransformData) {
    doNotTransformData = !!doNotTransformData && true;
    var deferred = $.Deferred();
    dexiePromise.then(function (result) {
        if (doNotTransformData) {
            deferred.resolve.apply(deferred, arguments);
        }
        else {
            deferred.resolve( {data: result});
        }
    }).catch(function (error) {
        if(doNotTransformData) {
            deferred.reject.apply(deferred, arguments);
        }
        else {
            deferred.reject({error: error});
        }
    });

    return deferred.promise();
}