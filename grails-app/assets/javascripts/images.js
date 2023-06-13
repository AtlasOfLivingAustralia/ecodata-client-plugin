function ImageViewModel(prop, skipFindingDocument, context){
    var self = this, document;
    var documents;

    // used by image gallery plugin. document is passed to the function.
    if(!skipFindingDocument){
        documents = context.documents;
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
    self.thumbnailUrl = ko.observable(prop.thumbnailUrl);
    self.filename = prop.filename;
    self.attribution = ko.observable(prop.attribution);
    self.licence = ko.observable(prop.licence);
    self.licenceDescription = prop.licenceDescription;
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


    self.remove = function(images, data, event){
        if(data.documentId){
            // change status when image is already in ecodata
            data.status('deleted')
        } else {
            images.remove(data);
        }
    }

    /**
     * any document that is in index db. Their url will be prefixed with blob:.
     */
    self.isBlobDocument = function(){
        return !!document.blob;
    }

    self.getBlob = function(){
        return document.blobObject;
    }

    self.isBlobUrl = function(url){
        return url && url.indexOf('blob:') === 0;
    }

    self.getActivityLink = function(){
        return fcConfig.activityViewUrl + '/' + self.activityId;
    }

    self.getProjectLink = function(){
        return fcConfig.projectIndexUrl + '/' + self.projectId;
    }

    self.getImageViewerUrl = function(){
        return fcConfig.imageLeafletViewer + '?file=' + encodeURIComponent(self.url());
    }

    /**
     * Check if the url is a valid object url.
     */
    self.fetchImage = function() {
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
            });
        }
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

    self.fetchImage();
}

ImageViewModel.createObjectURL = function addObjectURL(document){
    if (document.blob) {
        var blob = document.blobObject = new Blob([document.blob], {type: document.contentType});
        var url = URL.createObjectURL(blob);
        return url;
    }
}