<div class="input-group" data-bind="with:${source}">
        <span class="input-group-prepend input-group-text" id="basic-addon1"
              data-bind="visible:!transients.editing(), css:{'btn-success': name()}">
            <i class="icon-white" data-bind="css:{'fa fa-check':listId()!='unmatched' && name(), 'fa fa-question':listId()=='unmatched' || listId() == 'error-unmatched'}"></i>
        </span>
        <span class="input-group-prepend input-group-text" data-bind="visible:transients.editing()" id="basic-addon1">
            <i class="spinner-border text-secondary spinner-border-sm"></i>
        </span>
        <input type="text"  class="form-control form-control-sm" data-bind="${databindAttrs}" ${validationAttrs} aria-describedby="basic-addon1"/>
        <span class="input-group-prepend input-group-text" data-bind="visible: !transients.editing() && name()">
            <a data-bind="popover:{title: name, content: transients.speciesInformation}"> <i class="fa fa-info-circle"></i></a>
        </span>
</div>
