<div class="${css} autocompleteSpecies input-group" data-bind="with:${source}">
    <div class="input-group-prepend">
        <span class="input-group-text" data-bind="visible:!transients.editing(), css:{'btn-success':name()}"><i class="fa fa-check"
                                                                                                      data-bind="css:{'fa-check':listId()!='unmatched' && name(), 'fa-question-o':listId()=='unmatched' || listId() == 'error-unmatched'}"></i>
        </span>
    </div>
    <div class="input-group-prepend">
        <span class="input-group-text" data-bind="visible:transients.editing()"><asset:image src="ajax-saver.gif"
                                                                                   alt="saving icon"/></span>
    </div>
    <input type="text" class="form-control form-control-sm speciesInputTemplates" data-bind="${databindAttrs}" ${validationAttrs}/>
    <div class="input-group-append">
        <span class="input-group-text" data-bind="visible: !transients.editing() && name()">
            <a data-bind="popover: {title: name, content: transients.speciesInformation}, event: { 'shown.bs.popover': fetchSpeciesImage}"><i class="fa fa-info-circle"></i></a>
        </span>
    </div>

</div>
