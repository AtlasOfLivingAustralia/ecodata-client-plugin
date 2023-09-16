describe("Entities", function () {
    describe('isDexieEntityId', () => {

        it('should return true for a valid integer', () => {
            // Arrange
            const validId = '42';

            // Act
            const result = entities.utils.isDexieEntityId(validId);

            // Assert
            expect(result).toBe(true);
        });

        it('should return false for an invalid non-integer', () => {
            // Arrange
            const invalidId = '06b823b6-f259-4e80-9441-84e7c68cc09d';

            // Act
            const result = entities.utils.isDexieEntityId(invalidId);

            // Assert
            expect(result).toBe(false);
        });


        it('should return false for null or undefined', () => {
            // Arrange
            const nullId = null;
            const undefinedId = undefined;

            // Act
            const resultNull = entities.utils.isDexieEntityId(nullId);
            const resultUndefined = entities.utils.isDexieEntityId(undefinedId);

            // Assert
            expect(resultNull).toBe(false);
            expect(resultUndefined).toBe(false);
        });
    });

    describe("Credentials", function () {
        it("should add credentials", async function () {
            var credentials = await new Promise((resolve, reject) => {
                entities.saveCredentials({userId: 1, credential: "abc"}).then(function () {
                    entities.getCredentials().then(resolve, reject);
                });
            });

            credentials = credentials.data[0];
            expect(credentials.userId).toBe(1);
            expect(credentials.credential).toBe("abc");
        });

        it("should remove credentials", async function () {
            var credentials = await new Promise((resolve, reject) => {
                entities.saveCredentials({userId: 1, credential: "abc"}).then(function () {
                    entities.removeCredentials().then(function () {
                        entities.getCredentials().then(resolve, reject);
                    });
                });
            });

            credentials = credentials.data;
            expect(credentials.length).toBe(0);
        });
    });


    describe("Activity", function () {

        beforeEach(function () {
            jasmine.Ajax.install();
        });

        afterEach(async function () {
            jasmine.Ajax.uninstall();
            await new Promise((resolve, reject) => {
                entities.deleteTable("activity").then(resolve, reject);
            })
        });

        it("should add activity", async function () {
            simulateOffline();
            var activity = {activityId: 1, outputs: [{}], siteId: 4}
            var activityResult = await new Promise((resolve, reject) => {
                entities.saveActivity(activity).then(function () {
                    entities.getActivity(1).then(resolve, reject);
                });
            })

            var activityData = activityResult.data;
            expect(activityData.activityId).toBe(1);
            expect(activityData.siteId).toBe(4);
        });

        it("should fetch activity from online", async function () {
            simulateOnline();
            window.fcConfig = {activityURL: "/ws/activity"};
            jasmine.Ajax.stubRequest('/ws/activity/3').andReturn({
                "responseText": '{"activityId": "3", "name": "test3", "siteId": "abc"}',
                "status": 200,
                "contentType": "application/json"
            });

            var result = await new Promise((resolve, reject) => {
                entities.getActivity("3").then(resolve, reject);
            });

            var data = result.data;
            expect(data.activityId).toBe("3");
            expect(data.name).toBe("test3");

        })

        it("should fetch activity from offline if online fails", async function () {
            simulateOnline();
            window.fcConfig = {activityURL: "/ws/activity"};
            jasmine.Ajax.stubRequest('/ws/activity/3').andError({
                "status": 500
            });

            var activity = {"activityId": 3, "name": "test3", "siteId": "abc"}
            await new Promise((resolve, reject) => {
                entities.saveActivity(activity).then(resolve, reject);
            })

            var result = await new Promise((resolve, reject) => {
                entities.getActivity("3").then(resolve, reject);
            });

            var data = result.data;
            expect(data.activityId).toBe(3);
            expect(data.name).toBe("test3");
        })

        it("should give skeleton activity when activity not found in db", async function () {
            simulateOffline();
            window.fcConfig = {
                projectId: "a",
                type: "type1"
            }

            var result = await new Promise((resolve, reject) => {
                entities.getActivity("abc").then(resolve, reject);
            });

            var data = result.data;
            expect(data.activityId).toBe("");
            expect(data.siteId).toBe("");
            expect(data.projectId).toBe("a");
            expect(data.type).toBe("type1");
        })

        it("should delete activity", async function () {
            var activity = {activityId: 1, outputs: [{}], siteId: 4}
            var activityResult = await new Promise((resolve, reject) => {
                entities.deleteActivities([1]).then(function () {
                    entities.getActivity(1).then(resolve, reject);
                });
            })

            var activityData = activityResult.data;
            expect(activityData).toBe(undefined);
        });

        it("should get activities for a project activity", async function () {
            var activities = [
                {activityId: "1", projectActivityId: "a", lastUpdated: new Date(2018, 1, 1)},
                {activityId: "2", projectActivityId: "a", lastUpdated: new Date(2019, 1, 1)},
                {activityId: "3", projectActivityId: "a", lastUpdated: new Date(2016, 1, 1)},
                {activityId: "4", projectActivityId: "b", lastUpdated: new Date(2015, 1, 1)},
                {activityId: "5", projectActivityId: "b", lastUpdated: new Date(2020, 1, 1)}
            ];

            var result = await new Promise((resolve, reject) => {
                entities.saveActivities(activities).then(resolve, reject);
            });

            result = await new Promise((resolve, reject) => {
                entities.getActivitiesForProjectActivity("a", 2, 0, "lastUpdated", "DESC").then(resolve, reject);
            });

            var activityData = result.data;
            expect(activityData.activities.length).toBe(2);
            expect(activityData.activities[0].activityId).toBe("2");
            expect(activityData.activities[1].activityId).toBe("1");
            expect(activityData.total).toBe(3);

            result = await new Promise((resolve, reject) => {
                entities.getActivitiesForProjectActivity("b", 2, 0, "lastUpdated", "ASC").then(resolve, reject);
            });

            activityData = result.data;
            expect(activityData.activities.length).toBe(2);
            expect(activityData.activities[0].activityId).toBe("4");
            expect(activityData.activities[1].activityId).toBe("5");
            expect(activityData.total).toBe(2);

            result = await new Promise((resolve, reject) => {
                entities.deleteTable('activity').then(resolve, reject);
            });

            result = await new Promise((resolve, reject) => {
                entities.getActivitiesForProjectActivity("b", 2, 0, "lastUpdated", "ASC").then(resolve, reject);
            })

            activityData = result.data;
            expect(activityData.activities.length).toBe(0);
            expect(activityData.total).toBe(0);
        });

        it("should get activities for a project", async function () {
            var activities = [
                {activityId: "1", projectActivityId: "a", projectId: "n", lastUpdated: new Date(2018, 1, 1)},
                {activityId: "2", projectActivityId: "a", projectId: "n", lastUpdated: new Date(2019, 1, 1)},
                {activityId: "3", projectActivityId: "a", projectId: "n", lastUpdated: new Date(2016, 1, 1)},
                {activityId: "4", projectActivityId: "b", projectId: "m", lastUpdated: new Date(2015, 1, 1)},
                {activityId: "5", projectActivityId: "b", projectId: "m", lastUpdated: new Date(2020, 1, 1)}
            ];

            var result = await new Promise((resolve, reject) => {
                entities.saveActivities(activities).then(resolve, reject);
            });

            result = await new Promise((resolve, reject) => {
                entities.offlineGetActivitiesForProject("n", 2, 0, "lastUpdated", "DESC").then(resolve, reject);
            });

            var activityData = result.data;
            expect(activityData.activities.length).toBe(2);
            expect(activityData.activities[0].activityId).toBe("2");
            expect(activityData.activities[1].activityId).toBe("1");
            expect(activityData.total).toBe(3);

            result = await new Promise((resolve, reject) => {
                entities.offlineGetActivitiesForProject("m", 2, 0, "lastUpdated", "ASC").then(resolve, reject);
            });

            activityData = result.data;
            expect(activityData.activities.length).toBe(2);
            expect(activityData.activities[0].activityId).toBe("4");
            expect(activityData.activities[1].activityId).toBe("5");
            expect(activityData.total).toBe(2);

            result = await new Promise((resolve, reject) => {
                entities.deleteTable("activity").then(resolve, reject);
            });

            result = await new Promise((resolve, reject) => {
                entities.getActivitiesForProjectActivity("b", 2, 0, "lastUpdated", "ASC").then(resolve, reject);
            })

            activityData = result.data;
            expect(activityData.activities.length).toBe(0);
            expect(activityData.total).toBe(0);
        });


        it("should get all activities", async function () {
            var activities = [
                {activityId: "1", projectActivityId: "a", projectId: "n", lastUpdated: new Date(2018, 1, 1)},
                {activityId: "2", projectActivityId: "a", projectId: "n", lastUpdated: new Date(2019, 1, 1)},
                {activityId: "3", projectActivityId: "a", projectId: "n", lastUpdated: new Date(2016, 1, 1)},
                {activityId: "4", projectActivityId: "b", projectId: "m", lastUpdated: new Date(2015, 1, 1)},
                {activityId: "5", projectActivityId: "b", projectId: "m", lastUpdated: new Date(2020, 1, 1)}
            ];

            var result = await new Promise((resolve, reject) => {
                entities.saveActivities(activities).then(resolve, reject);
            });

            result = await new Promise((resolve, reject) => {
                entities.offlineGetAllActivities(10, 0, "lastUpdated", "DESC").then(resolve, reject);
            });

            var activityData = result.data;
            expect(activityData.activities.length).toBe(5);
            expect(activityData.activities[0].activityId).toBe("5");
            expect(activityData.activities[1].activityId).toBe("2");
            console.log(JSON.stringify(activityData));
            expect(activityData.total).toBe(5);

            result = await new Promise((resolve, reject) => {
                entities.offlineGetAllActivities(2, 0, "lastUpdated", "ASC").then(resolve, reject);
            });

            activityData = result.data;
            expect(activityData.activities.length).toBe(2);
            expect(activityData.activities[0].activityId).toBe("4");
            expect(activityData.activities[1].activityId).toBe("3");
            expect(activityData.total).toBe(5);

            await new Promise((resolve, reject) => {
                entities.deleteTable("activity").then(resolve, reject);
            });

            result = await new Promise((resolve, reject) => {
                entities.offlineGetAllActivities(2, 0, "lastUpdated", "ASC").then(resolve, reject);
            })

            activityData = result.data;
            expect(activityData.activities.length).toBe(0);
            expect(activityData.total).toBe(0);
        });
    });

    describe("Site", function () {

        beforeEach(function () {
            jasmine.Ajax.install();
        });

        afterEach(async function () {
            jasmine.Ajax.uninstall();
            await new Promise((resolve, reject) => {
                entities.deleteTable("site").then(resolve, reject);
            });
        });

        async function addSite() {
            var site = {siteId: 1, siteName: "site1", projects: ['project1']};
            await new Promise((resolve, reject) => {
                entities.saveSite(site).then(resolve, reject);
            });
        }

        it("should add site", async function () {
            await addSite();
            var siteResult = await new Promise((resolve, reject) => {
                entities.getSite(1).then(resolve, reject);
            });

            var siteData = siteResult.data;
            expect(siteData.siteId).toBe(1);
            expect(siteData.siteName).toBe("site1");
            expect(siteData.projects[0]).toBe("project1");
        });

        it("should add multiple sites", async function () {
            var sites = [{siteId: 2, siteName: "site1", projects: ['project1']}, {
                siteId: 3,
                siteName: "site2",
                projects: ['project2']
            }];

            var result = await new Promise((resolve, reject) => {
                entities.saveSites(sites).then(function () {
                    entities.getSite(2).then(resolve, reject);
                });
            });

            var data = result.data;
            expect(data.siteId).toBe(2);
            expect(data.siteName).toBe("site1");
        });

        it("should get multiple sites offline", async function () {
            var sites = [{
                siteId: 2, siteName: "site1", projects: ['project1']
            }, {
                siteId: 3, siteName: "site2", projects: ['project2']
            }];

            await new Promise((resolve, reject) => {
                entities.saveSites(sites).then(resolve, reject);
            });

            var result = await new Promise((resolve, reject) => {
                entities.offlineGetSites([2, 3]).then(resolve, reject);
            });

            var sites = result.data;
            expect(sites.length).toBe(2);
            var site = sites.filter(s => s.siteId === 2)[0];
            expect(site.siteId).toBe(2);
            site = sites.filter(s => s.siteId === 3)[0];
            expect(site.siteId).toBe(3);
        })

        it("should get sites associated with project", async function () {
            var sites = [{
                siteId: 2, siteName: "site1", projects: ['project1']
            }, {
                siteId: 3, siteName: "site2", projects: ['project2']
            }];

            await new Promise((resolve, reject) => {
                entities.saveSites(sites).then(resolve, reject);
            });

            var result = await new Promise((resolve, reject) => {
                entities.offlineGetSitesForProject("project1").then(resolve, reject);
            });

            var sites = result.data;
            expect(sites.length).toBe(1);
            expect(sites[0].siteId).toBe(2);
        })

        it("should get if site name exists", async function () {
            var sites = [{
                siteId: 2, name: "site1", projects: ['project1']
            }, {
                siteId: 3, name: "site2", projects: ['project2']
            }];

            await new Promise((resolve, reject) => {
                entities.saveSites(sites).then(resolve, reject);
            });

            await new Promise((resolve, reject) => {
                entities.offlineCheckSiteWithName("project1", "site1", function (count) {
                    expect(count).toBe(1);
                }).then(resolve, reject);
            });
        })

        it("should fetch site from online", async function () {
            window.fcConfig = {siteUrl: "/ws/site"};
            jasmine.Ajax.stubRequest('/ws/site/1').andReturn({
                "responseText": '{"site":{"siteId":1,"siteName":"site1","projects":["project1"]}}',
                "status": 200,
                "contentType": "application/json"
            });
            simulateOnline();
            var result = await new Promise((resolve, reject) => {
                entities.getSite(1).then(resolve, reject);
            });

            var data = result.data;
            expect(data.siteId).toBe(1);
            expect(data.siteName).toBe("site1");

            simulateOffline();
            result = await new Promise((resolve, reject) => {
                entities.getSite(1).then(resolve, reject);
            });

            data = result.data;
            expect(data.siteId).toBe(1);
            expect(data.siteName).toBe("site1");
        });

        it("should fetch site offline when error getting site online", async function () {
            window.fcConfig = {siteUrl: "/ws/site"};
            jasmine.Ajax.stubRequest('/ws/site/1').andError({
                "status": 500
            });
            await addSite();
            simulateOnline();
            var result = await new Promise((resolve, reject) => {
                entities.getSite(1).then(resolve, reject);
            });

            var data = result.data;
            expect(data.siteId).toBe(1);
            expect(data.siteName).toBe("site1");
        });

        it("should fetch site from offline", async function () {
            window.fcConfig = {siteUrl: "/ws/site"};
            await addSite();
            simulateOffline();
            var result = await new Promise((resolve, reject) => {
                entities.getSite(1).then(resolve, reject);
            });

            var data = result.data;
            expect(data.siteId).toBe(1);
            expect(data.siteName).toBe("site1");

            simulateOffline();
            result = await new Promise((resolve, reject) => {
                entities.getSite(1).then(resolve, reject);
            });

            data = result.data;
            expect(data.siteId).toBe(1);
            expect(data.siteName).toBe("site1");
        });

        it("should fetch a given list of sites in sequence", async function () {
            window.fcConfig = {siteUrl: "/ws/site"};
            jasmine.Ajax.stubRequest('/ws/site/2').andReturn({
                "responseText": '{"site":{"siteId":2,"siteName":"site2","projects":["project2"]}}',
                "status": 200,
                "contentType": "application/json"
            });
            jasmine.Ajax.stubRequest('/ws/site/3').andReturn({
                "responseText": '{"site":{"siteId":3,"siteName":"site3","projects":["project2"]}}',
                "status": 200,
                "contentType": "application/json"
            });

            simulateOnline();
            await new Promise((resolve, reject) => {
                entities.getSites([2, 3], 0).then(resolve, reject);
            });

            var result = await new Promise((resolve, reject) => {
                entities.getSite(2).then(resolve, reject);
            });

            simulateOffline();
            var data = result.data;
            expect(data.siteId).toBe(2);
            expect(data.siteName).toBe("site2");

            var result = await new Promise((resolve, reject) => {
                entities.getSite(3).then(resolve, reject);
            });

            var data = result.data;
            expect(data.siteId).toBe(3);
            expect(data.siteName).toBe("site3");
        });
    });

    describe("Document", function () {
        beforeEach(function () {
            jasmine.Ajax.install();
        });

        afterEach(function () {
            jasmine.Ajax.uninstall();
        });

        it("should add and retrieve document", async function () {
            simulateOffline();
            var result = await new Promise((resolve, reject) => {
                entities.saveDocument({documentId: 1, documentName: "doc1"}).then(function () {
                    entities.getDocument(1).then(resolve, reject);
                });
            });

            var data = result.data;
            expect(data.documentId).toBe(1);
            expect(data.documentName).toBe("doc1");
        });

        it("should get document from online", async function () {
            simulateOnline();
            window.fcConfig = {documentUrl: "/ws/document"};
            jasmine.Ajax.stubRequest('/ws/document/3').andReturn({
                "responseText": '{"documentId": 3, "documentName": "doc3"}',
                "status": 200,
                "contentType": "application/json"
            });

            var result = await new Promise((resolve, reject) => {
                entities.getDocument(3).then(resolve, reject);
            });

            var data = result.data;
            expect(data.documentId).toBe(3);
            expect(data.documentName).toBe("doc3");
        });

        it("should delete document from offline", async function () {
            var result = await new Promise((resolve, reject) => {
                entities.bulkDeleteDocuments([1]).then(function () {
                    entities.getDocument(1).then(resolve, reject);
                });
            });

            expect(result.data).toBe(undefined);
        });
    });

    describe("Species", function () {
        beforeEach(function () {
            jasmine.Ajax.install();
        });

        afterEach(async function () {
            jasmine.Ajax.uninstall();
            await new Promise((resolve, reject) => {
                entities.deleteTable("taxon").then(resolve, reject);
            })
        });

        it("should download all species for survey and delete them", async function () {
            window.fcConfig = {
                downloadSpeciesUrl: "/species/speciesDownload",
                totalUrl: "/species/totalSpecies"
            };
            jasmine.Ajax.stubRequest(fcConfig.totalUrl).andReturn({
                "responseText": '{"total": 2}',
                "status": 200,
                "contentType": "application/json"
            });

            jasmine.Ajax.stubRequest(fcConfig.downloadSpeciesUrl + "?page=1").andReturn({
                "responseText": '[{"commonName": "species1", "scientificName": "sc1", "name": "sc1", "listId": "all"}, {"commonName": "species2", "scientificName": "sc1", "name": "sc1", "listId": "all"}]',
                "status": 200,
                "contentType": "application/json"
            });

            jasmine.Ajax.stubRequest(fcConfig.downloadSpeciesUrl + "?page=2").andReturn({
                "responseText": '[{"commonName": "species3", "scientificName": "sc3", "name": "sc3", "listId": "all"}, {"commonName": "species4", "scientificName": "sc4", "name": "sc4", "listId": "all"}]',
                "status": 200,
                "contentType": "application/json"
            });

            var pa = {
                projectActivityId: 1,
                speciesFields: [{config: {type: "ALL_SPECIES"}}]
            }

            var result = await new Promise((resolve, reject) => {
                entities.getSpeciesForProjectActivity(pa, function (total, page) {
                }).then(function () {
                    entities.countAllSpecies().then(resolve, reject);
                });
            })

            expect(result.data).toBe(4);

            // delete check
            result = await new Promise((resolve, reject) => {
                entities.deleteAllSpecies().then(resolve, reject);
            });

            result = await new Promise((resolve, reject) => {
                entities.countAllSpecies().then(resolve, reject);
            })

            expect(result.data).toBe(0);
        }, 30000);

        it("should download species from species list", async function () {
            window.fcConfig = {
                fetchSpeciesUrl: "/search/searchSpecies"
            };

            jasmine.Ajax.stubRequest(fcConfig.fetchSpeciesUrl + "?projectActivityId=1&dataFieldName=species1&output=output1&limit=20&q=&offset=0").andReturn({
                "responseText": '{"autoCompleteList": [{"commonName": "species1", "scientificName": "sc1", "name": "sc1", "listId": "123", "projectActivityId": "1", "dataFieldName": "species1", "outputName": "output1"}, {"commonName": "species2", "scientificName": "sc1", "name": "sc1", "listId": "123", "projectActivityId": "1", "dataFieldName": "species1", "outputName": "output1"}]}',
                "status": 200,
                "contentType": "application/json"
            });

            jasmine.Ajax.stubRequest(fcConfig.fetchSpeciesUrl + "?projectActivityId=1&dataFieldName=species1&output=output1&limit=20&q=&offset=20").andReturn({
                "responseText": '{"autoCompleteList": []}',
                "status": 200,
                "contentType": "application/json"
            });

            var pa = {
                projectActivityId: 1,
                speciesFields: [{config: {type: "GROUP_OF_SPECIES"}, dataFieldName: "species1", output: "output1"}]
            }

            var result = await new Promise((resolve, reject) => {
                entities.getSpeciesForProjectActivity(pa, function (total, page) {
                }).then(function () {
                    entities.searchSpecies(1, "species1", "output1", {q: ""}, 20).then(resolve, reject);
                });
            });
            expect(result.autoCompleteList.length).toBe(2);
        }, 10000);

        it("should search all species if species from species list is empty", async function () {
            window.fcConfig = {
                fetchSpeciesUrl: "/search/searchSpecies",
                downloadSpeciesUrl: "/species/speciesDownload",
                totalUrl: "/species/totalSpecies"
            };
            jasmine.Ajax.stubRequest(fcConfig.totalUrl).andReturn({
                "responseText": '{"total": 2}',
                "status": 200,
                "contentType": "application/json"
            });

            jasmine.Ajax.stubRequest(fcConfig.downloadSpeciesUrl + "?page=1").andReturn({
                "responseText": '[{"commonName": "species1", "scientificName": "sc1", "name": "sc1", "listId": "all"}, {"commonName": "species2", "scientificName": "sc1", "name": "sc1", "listId": "all"}]',
                "status": 200,
                "contentType": "application/json"
            });

            jasmine.Ajax.stubRequest(fcConfig.downloadSpeciesUrl + "?page=2").andReturn({
                "responseText": '[{"commonName": "species3", "scientificName": "sc3", "name": "sc3", "listId": "all"}, {"commonName": "species4", "scientificName": "sc4", "name": "sc4", "listId": "all"}]',
                "status": 200,
                "contentType": "application/json"
            });

            var pa = {
                projectActivityId: 1,
                speciesFields: [{config: {type: "ALL_SPECIES"}}]
            }

            var result = await new Promise((resolve, reject) => {
                entities.getSpeciesForProjectActivity(pa, function (total, page) {
                }).then(resolve, reject);
            });

            jasmine.Ajax.stubRequest(fcConfig.fetchSpeciesUrl + "?projectActivityId=1&dataFieldName=species1&output=output1&limit=20&q=&offset=0").andReturn({
                "responseText": '{"autoCompleteList": []}',
                "status": 200,
                "contentType": "application/json"
            });

            pa = {
                projectActivityId: 1,
                speciesFields: [{config: {type: "GROUP_OF_SPECIES"}, dataFieldName: "species1", output: "output1"}]
            }

            result = await new Promise((resolve, reject) => {
                entities.getSpeciesForProjectActivity(pa, function (total, page) {
                }).then(function () {
                    entities.searchSpecies(1, "species1", "output1", {q: "species4"}, 20).then(resolve, reject);
                });
            });
            expect(result.autoCompleteList.length).toBe(1);
        });

        it("should download single species", async function () {
            window.fcConfig = {
                fetchSpeciesUrl: "/search/searchSpecies"
            };

            jasmine.Ajax.stubRequest(fcConfig.fetchSpeciesUrl + "?projectActivityId=1&dataFieldName=species5&output=output5&limit=20&q=&offset=0").andReturn({
                "responseText": '{"autoCompleteList": [{"commonName": "species5", "scientificName": "sc5", "name": "sc5", "listId": "abc", "projectActivityId": "1", "dataFieldName": "species5", "outputName": "output5"}]}',
                "status": 200,
                "contentType": "application/json"
            });

            jasmine.Ajax.stubRequest(fcConfig.fetchSpeciesUrl + "?projectActivityId=1&dataFieldName=species5&output=output5&limit=20&q=&offset=20").andReturn({
                "responseText": '{"autoCompleteList": []}',
                "status": 200,
                "contentType": "application/json"
            });

            var pa = {
                projectActivityId: 1,
                speciesFields: [{config: {type: "SINGLE_SPECIES"}, dataFieldName: "species5", output: "output5"}]
            }
            var result = await new Promise((resolve, reject) => {
                entities.getSpeciesForProjectActivity(pa, function (total, page) {
                }).then(function () {
                    entities.searchSpecies(1, "species5", "output5", {q: ""}, 20).then(resolve, reject);
                });
            });

            expect(result.autoCompleteList.length).toBe(1);
        }, 30000);
    });

    describe("ProjectActivityMetadata", function () {
        beforeEach(function () {
            jasmine.Ajax.install();
        });

        afterEach(async function () {
            jasmine.Ajax.uninstall();
            await new Promise((resolve, reject) => {
                entities.deleteTable('site').then(resolve, reject);
            });
            await new Promise((resolve, reject) => {
                entities.deleteTable('project').then(resolve, reject);
            });
            await new Promise((resolve, reject) => {
                entities.deleteTable('projectActivity').then(resolve, reject);
            });
            await new Promise((resolve, reject) => {
                entities.deleteTable('metaModel').then(resolve, reject);
            });
        });

        it("should fetch and save metadata objects", async function () {
            window.fcConfig = {
                metadataURL: "/ws/metadata"
            }

            jasmine.Ajax.stubRequest(fcConfig.metadataURL + "?projectActivityId=nnn&activityId=57493b3e-18ea-466a-a520-4dea28b4ea5e").andReturn({
                status: 200,
                responseText: '{' +
                    '"activity": {"activityId": "57493b3e-18ea-466a-a520-4dea28b4ea5e", "name": "activity1", "siteId": "abc"}, ' +
                    '"projectSite": {"siteId": "abc", "name": "site1", "projects": ["project1"]}, ' +
                    '"project": {"projectId": "project1", "name": "Project 1", "projectSiteId": "abc"}, ' +
                    '"pActivity": {"projectActivityId": "nnn", "projectId": "project1"}, ' +
                    '"metaModel": {"outputs": ["abc"], "outputConfig": [{' +
                    '"outputName": "abc"' +
                    '}]' +
                    '},' +
                    '"outputModels":{' +
                    '   "abc": { ' +
                    '       "modelName": "abc",' +
                    '       "dataModel": [{"dataType": "text", "name": "name1", "description": "desc1"}],' +
                    '       "viewModel": [{"type": "text", "preLabel": "label1", "source": "name1"}]' +
                    '       }' +
                    '   }' +
                    '}',
                contentType: "application/json"
            });

            var result = await new Promise((resolve, reject) => {
                entities.getProjectActivityMetadata("nnn", "57493b3e-18ea-466a-a520-4dea28b4ea5e").then(resolve, reject);
            });

            var metadata = result.data;
            expect(metadata.activity.activityId).toBe("57493b3e-18ea-466a-a520-4dea28b4ea5e");
            expect(metadata.projectSite.siteId).toBe("abc");
            expect(metadata.project.projectId).toBe("project1");
            expect(metadata.pActivity.projectActivityId).toBe("nnn");
            expect(metadata.metaModel.outputModels.abc.modelName).toBe("abc");
            expect(metadata.metaModel.outputModels.abc.dataModel.length).toBe(1);
            expect(metadata.metaModel.outputModels.abc.viewModel.length).toBe(1);
            expect(metadata.metaModel.outputModels.abc.viewModel.length).toBe(1);
            expect(metadata.metaModel.outputs[0]).toBe('abc');
            expect(metadata.metaModel.outputConfig[0].outputName).toBe('abc');
        }, 10000);

        it("should fetch metadata objects and get activity offline", async function () {
            window.fcConfig = {
                metadataURL: "/ws/metadata"
            }

            jasmine.Ajax.stubRequest(fcConfig.metadataURL + "?projectActivityId=nnn").andReturn({
                status: 200,
                responseText: '{' +
                    '"projectSite": {"siteId": "abc", "name": "site1", "projects": ["project1"]}, ' +
                    '"project": {"projectId": "project1", "name": "Project 1", "projectSiteId": "abc"}, ' +
                    '"pActivity": {"projectActivityId": "nnn", "projectId": "project1"}, ' +
                    '"metaModel": {"outputs": ["abc"], "outputConfig": [{' +
                    '"outputName": "abc"' +
                    '}]' +
                    '},' +
                    '"outputModels":{' +
                    '   "abc": { ' +
                    '       "modelName": "abc",' +
                    '       "dataModel": [{"dataType": "text", "name": "name1", "description": "desc1"}],' +
                    '       "viewModel": [{"type": "text", "preLabel": "label1", "source": "name1"}]' +
                    '       }' +
                    '   }' +
                    '}',
                contentType: "application/json"
            });

            var activity = {activityId: 1, outputs: [{}], siteId: "abc", projectActivityId: "nnn"};
            await new Promise((resolve, reject) => {
                entities.saveActivity(activity).then(resolve, reject);
            });

            var result = await new Promise((resolve, reject) => {
                entities.getProjectActivityMetadata("nnn", 1).then(resolve, reject);
            });

            var metadata = result.data;
            expect(metadata.activity.activityId).toBe(1);
            expect(metadata.activity.projectActivityId).toBe("nnn");
            expect(metadata.projectSite.siteId).toBe("abc");
            expect(metadata.project.projectId).toBe("project1");
            expect(metadata.pActivity.projectActivityId).toBe("nnn");
            expect(metadata.metaModel.outputModels.abc.modelName).toBe("abc");
            expect(metadata.metaModel.outputModels.abc.dataModel.length).toBe(1);
            expect(metadata.metaModel.outputModels.abc.viewModel.length).toBe(1);
            expect(metadata.metaModel.outputModels.abc.viewModel.length).toBe(1);
            expect(metadata.metaModel.outputs[0]).toBe('abc');
            expect(metadata.metaModel.outputConfig[0].outputName).toBe('abc');
        }, 10000);

        it("should get metadata objects offline", async function () {
            window.fcConfig = {
                metadataURL: "/ws/metadata"
            }

            jasmine.Ajax.stubRequest(fcConfig.metadataURL + "?projectActivityId=nnn").andReturn({
                responseText: '{' +
                    '"projectSite": {"siteId": "abc", "name": "site1", "projects": ["project1"]}, ' +
                    '"project": {' +
                    '   "projectId": "project1", ' +
                    '   "name": "Project 1", ' +
                    '   "projectSiteId": "abc"' +
                    '}, ' +
                    '"pActivity": {' +
                    '       "projectActivityId": "nnn", ' +
                    '       "projectId": "project1", ' +
                    '       "pActivityFormName": "pActivityFormName"' +
                    '}, ' +
                    '"metaModel": {' +
                    '   "name": "pActivityFormName",' +
                    '   "outputs": ["abc"], ' +
                    '   "outputConfig": [' +
                    '       {' +
                    '           "outputName": "abc"' +
                    '       }' +
                    '   ]' +
                    '},' +
                    '"outputModels":{' +
                    '   "abc": { ' +
                    '       "modelName": "abc",' +
                    '       "dataModel": [{"dataType": "text", "name": "name1", "description": "desc1"}],' +
                    '       "viewModel": [{"type": "text", "preLabel": "label1", "source": "name1"}]' +
                    '       }' +
                    '   }' +
                    '}',
                status: 200,
                contentType: "application/json"
            });

            var activity = {activityId: 1, outputs: [{}], siteId: "abc", projectActivityId: "nnn"};
            await new Promise((resolve, reject) => {
                entities.saveActivity(activity).then(resolve, reject);
            });

            await new Promise((resolve, reject) => {
                entities.getProjectActivityMetadata("nnn", 1).then(resolve, reject);
            });

            var result = await new Promise((resolve, reject) => {
                entities.offlineGetProjectActivityMetadata("nnn", 1).then(resolve, reject);
            });

            var metadata = result.data;
            expect(metadata.activity.activityId).toBe(1);
            expect(metadata.activity.projectActivityId).toBe("nnn");
            expect(metadata.projectSite.siteId).toBe("abc");
            expect(metadata.project.projectId).toBe("project1");
            expect(metadata.pActivity.projectActivityId).toBe("nnn");
            expect(metadata.metaModel.outputModels.abc.modelName).toBe("abc");
            expect(metadata.metaModel.outputModels.abc.dataModel.length).toBe(1);
            expect(metadata.metaModel.outputModels.abc.viewModel.length).toBe(1);
            expect(metadata.metaModel.outputModels.abc.viewModel.length).toBe(1);
            expect(metadata.metaModel.outputs[0]).toBe('abc');
            expect(metadata.metaModel.outputConfig[0].outputName).toBe('abc');
        });
    });

    describe("Project", function () {
        beforeEach(function () {
            jasmine.Ajax.install();
        });

        afterEach(function () {
            jasmine.Ajax.uninstall();
        });

        it("should add and retrieve project", async function () {
            simulateOnline();
            window.fcConfig = {
                projectURL: "/ws/project/123"
            };

            jasmine.Ajax.stubRequest(fcConfig.projectURL).andReturn({
                "responseText": '{"projectId": "123", "name": "project1"}',
                "status": 200,
                "contentType": "application/json"
            });

            var result = await new Promise((resolve, reject) => {
                entities.getProject("123").then(resolve, reject);
            });

            var project = result.data;
            expect(project.projectId).toBe("123");
            expect(project.name).toBe("project1");


            // should get via cached promise
            result = await new Promise((resolve, reject) => {
                entities.getProject("123").then(resolve, reject);
            });

            project = result.data;
            expect(project.projectId).toBe("123");
            expect(project.name).toBe("project1");

            simulateOffline();
            var result = await new Promise((resolve, reject) => {
                entities.getProject("123").then(resolve, reject);
            });

            var project = result.data;
            expect(project.projectId).toBe("123");
            expect(project.name).toBe("project1");

        }, 10000);
    });

    describe("ProjectActivity", function () {
        beforeEach(function () {
            jasmine.Ajax.install();
        });

        afterEach(function () {
            jasmine.Ajax.uninstall();
        });

        it("should get project activity online and offline", async function () {
            simulateOnline();
            window.fcConfig = {
                projectActivityURL: "/ws/projectActivity"
            };

            jasmine.Ajax.stubRequest(fcConfig.projectActivityURL + "/456").andReturn({
                "responseText": '{"projectActivityId": "456", "name": "projectActivity1"}',
                "status": 200,
                "contentType": "application/json"
            });

            var result = await new Promise((resolve, reject) => {
                entities.getProjectActivity("456").then(resolve, reject);
            });

            var projectActivity = result.data;
            expect(projectActivity.projectActivityId).toBe("456");
            expect(projectActivity.name).toBe("projectActivity1");

            simulateOffline();
            result = await new Promise((resolve, reject) => {
                entities.getProjectActivity("456").then(resolve, reject);
            });

            projectActivity = result.data;
            expect(projectActivity.projectActivityId).toBe("456");
            expect(projectActivity.name).toBe("projectActivity1");
        });
    });

    describe("OfflineMap", function (){
        it("should add map", async function (){
            await new Promise((resolve, reject) => {
                entities.saveMap({id: 1, name: "test"}).then(resolve, reject);
            });

            var result = await new Promise((resolve, reject) => {
                entities.getMaps().then(resolve, reject).then(resolve, reject);
            });

            expect(result.data.length).toBe(1)
            expect(result.data[0].name).toBe("test")
            expect(result.data[0].id).toBe(1)
        })

        it("should delete map", async function (){
            await new Promise((resolve, reject) => {
                entities.saveMap({id: 1, name: "test"}).then(resolve, reject);
            });

            await new Promise((resolve, reject) => {
                entities.deleteMap(1).then(resolve, reject).then(resolve, reject);
            });

            var result = await new Promise((resolve, reject) => {
                entities.getMaps().then(resolve, reject).then(resolve, reject);
            });

            expect(result.data.length).toBe(0);
        })
    });

    function simulateOnline() {
        clearAllRequests();
        jasmine.Ajax.stubRequest('/noop').andReturn({
            "responseText": '{"status": "ok"}',
            "status": 200,
            "contentType": "application/json"
        });
    }

    function simulateOffline() {
        clearAllRequests();
        jasmine.Ajax.stubRequest('/noop').andError({
            "status": 500
        });
    }

    function clearAllRequests() {
        jasmine.Ajax.requests.reset();
    }
});