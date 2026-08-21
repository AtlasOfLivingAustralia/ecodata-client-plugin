function ImageViewModel(prop, skipFindingDocument, context){
    var self = this, document;
    var documents;

    // used by image gallery plugin. document is passed to the function.
    if(!skipFindingDocument){
        documents = context && context.documents;
        // added from biocollect images.js
        if (!documents && window.activityLevelData) {
            documents = activityLevelData.activity.documents;
        }

        // dereferencing the document using documentId
        documents && documents.forEach(function(doc){
            // newer implementation is passing document object.
            var docId = prop.documentId || prop;
            if(doc.documentId === docId){
                prop = doc;
            }
        });
    }

    if(typeof prop !== 'object'){
        console.error('Could not find the required document.')
        return;
    }

    self.dateTaken = ko.observable(prop.dateTaken || (new Date()).toISOStringNoMillis()).extend({simpleDate:false});
    self.contentType = ko.observable(prop.contentType);
    self.url = ko.observable(prop.url);
    self.filesize = prop.filesize;
    self.thumbnailUrl = ko.observable(prop.thumbnailUrl || prop.url);
    self.filename = prop.filename;
    self.attribution = ko.observable(prop.attribution);
    self.licence = ko.observable(prop.licence || ImageViewModel.licenceFromSurvey(context));
    self.licenceDescription = prop.licenceDescription || ImageViewModel.descriptionFor(self.licence());
    self.licence.subscribe(function(code) {
        self.licenceDescription = ImageViewModel.descriptionFor(code);
    });
    self.notes = ko.observable(prop.notes || '');
    self.name = ko.observable(prop.name);
    self.formattedSize = formatBytes(prop.filesize);
    self.staged = prop.staged || false;
    self.documentId = prop.documentId || '';
    self.status = ko.observable(prop.status || 'active');
    self.projectName = prop.projectName;
    self.projectId = prop.projectId;
    self.activityName = prop.activityName;
    self.activityId = prop.activityId;
    self.isEmbargoed = prop.isEmbargoed;
    self.identifier=prop.identifier;
    self.blob = undefined;
    // adds event methods like on, emit etc.
    if (window.Emitter) {
        new Emitter(self);
    }


    self.remove = function(images, data, event){
        if(data.documentId){
            // change status when image is already in ecodata
            data.status('deleted');
            // code for pwa app
            if (window.entities && window.entities.utils.isDexieEntityId(data.documentId)) {
                entities
                    .bulkDeleteDocuments([data.documentId])
                    .then(function (){
                        images.remove(data);
                    });
            }
        } else {
            images.remove(data);
        }
    }

    self.getActivityLink = function(){
        return fcConfig.activityViewUrl + '/' + self.activityId;
    }

    self.getProjectLink = function(){
        return fcConfig.projectIndexUrl + '/' + self.projectId;
    }

    self.getImageViewerUrl = function(){
        // Let the image viewer render high res image.
        var url = self.url() ? self.url().split("/image/proxyImageThumbnailLarge?imageId=").join("/image/proxyImage?imageId=") : self.url()
        self.url(url);
        return fcConfig.imageLeafletViewer + '?file=' + encodeURIComponent(self.url());
    }

    self.summary = function(){
        var picBy = 'Picture by ' + self.attribution() + '. ';
        var takenOn = 'Taken on ' + self.dateTaken.formattedDate() +'.';
        var message = '';
        if(self.attribution()){
            message += picBy;
        }

        message += takenOn;
        return "<p>" + self.notes() + '</p><i>' + message + '</i>';
    }

    self.load = function(prop, doNotUpdateUrls){
        self.dateTaken(prop.dateTaken || (new Date()).toISOStringNoMillis());
        self.contentType(prop.contentType);
        if (!doNotUpdateUrls) {
            self.url(prop.url);
            self.thumbnailUrl(prop.thumbnailUrl || prop.url);
        }

        self.filename = prop.filename;
        prop.attribution && self.attribution(prop.attribution);
        if (prop.licence) {
            self.licence(prop.licence);
        }
        if (prop.licenceDescription) {
            self.licenceDescription = prop.licenceDescription;
        }
        prop.notes && self.notes(prop.notes || '');
        prop.name && self.name(prop.name);
        prop.status && self.status(prop.status || 'active');
        if(prop.filesize)
            self.filesize = prop.filesize
        if(prop.filesize)
            self.formattedSize = formatBytes(prop.filesize);
        if(prop.staged !== undefined)
            self.staged = prop.staged || false;
        if(prop.documentId)
            self.documentId = prop.documentId || '';
        if(prop.projectName)
            self.projectName = prop.projectName;
        if(prop.projectId)
            self.projectId = prop.projectId;
        if(prop.activityName)
            self.activityName = prop.activityName;
        if(prop.activityId)
            self.activityId = prop.activityId;
        if(prop.isEmbargoed)
            self.isEmbargoed = prop.isEmbargoed;
        if(prop.identifier)
            self.identifier = prop.identifier;
    }

    /**
     * any document that is in index db. Their url will be prefixed with blob:.
     */
    self.isBlobDocument = function(){
        return !!(document && !!document.blob);
    }

    self.getBlob = function(){
        return document && document.blobObject;
    }

    self.isBlobUrl = function(url){
        return url && url.indexOf('blob:') === 0;
    }

    self.getDocument = function() {
        return document
    }

    /**
     * Check if the url is a valid object url.
     */
    self.fetchImage = function() {
        // making sure calling this function does not fail in MERIT
        if (!window.isUuid || !window.entities )
            return;

        if (!isUuid(self.documentId) && !isNaN(self.documentId)) {
            var documentId = parseInt(self.documentId);
            entities.offlineGetDocument(documentId).then(function(result) {
                var doc = result.data;
                document = doc;
                if (self.isBlobDocument()) {
                    var url = self.url();
                    if (self.isBlobUrl(url)) {
                        URL.revokeObjectURL(url);
                    }

                    url = ImageViewModel.createObjectURL(doc);
                    self.url(url);
                    self.thumbnailUrl(url);
                }

                document && self.emit('image-fetched', document);
            });
        }
    }

    self.fetchImage();
}


ImageViewModel.createObjectURL = function addObjectURL(document){
    if (document.blob) {
        var blob = document.blobObject = new Blob([document.blob], {name: document.filename, type: document.contentType, filename: document.filename});
        var url = URL.createObjectURL(blob);
        return url;
    }
};

/**
 * Current Creative Commons licences offered for images, most to least permissive.
 * Stored option values are kept stable so existing images still match.
 * Survey dataSharingLicense URLs and photo-point codes are accepted as aliases.
 */
ImageViewModel.DEFAULT_LICENCE = 'CC BY 4.0';
ImageViewModel.IMAGE_LICENCES = [
    {
        value: 'CC BY 0',
        name: 'Creative Commons Zero 1.0',
        aliases: ['CC0', 'https://creativecommons.org/publicdomain/zero/1.0/']
    },
    {
        value: 'CC BY 4.0',
        name: 'Creative Commons Attribution 4.0 International',
        aliases: ['CC BY', 'https://creativecommons.org/licenses/by/4.0/']
    },
    {
        value: 'CC BY-SA 4.0',
        name: 'Creative Commons Attribution-Share Alike 4.0 International',
        aliases: ['CC BY-SA', 'https://creativecommons.org/licenses/by-sa/4.0/']
    },
    {
        value: 'CC BY-NC',
        name: 'Creative Commons Attribution-Noncommercial 4.0 International',
        aliases: ['https://creativecommons.org/licenses/by-nc/4.0/', 'https://creativecommons.org/licenses/by-nc/3.0/au/', 'https://creativecommons.org/licenses/by-nc/2.5/']
    },
    {
        value: 'CC BY-NC-SA',
        name: 'Creative Commons Attribution-Noncommercial-Share Alike 4.0 International',
        aliases: ['https://creativecommons.org/licenses/by-nc-sa/4.0/']
    }
];

ImageViewModel.findLicence = function(value) {
    if (!value) {
        return null;
    }
    return ImageViewModel.IMAGE_LICENCES.find(function(licence) {
        return licence.value === value || licence.aliases.indexOf(value) !== -1;
    }) || null;
};

ImageViewModel.descriptionFor = function(value) {
    var match = ImageViewModel.findLicence(value);
    return match ? match.name : (value || '');
};

/** Map the survey data sharing licence (from form context / pActivity) to a stored image licence value. */
ImageViewModel.licenceFromSurvey = function(context) {
    var pActivity = (context && context.pActivity)
        || (context && context.$data && context.$data.$context && context.$data.$context.pActivity)
        || (window.activityLevelData && activityLevelData.pActivity);
    var match = ImageViewModel.findLicence(pActivity && pActivity.dataSharingLicense);
    return match ? match.value : ImageViewModel.DEFAULT_LICENCE;
};