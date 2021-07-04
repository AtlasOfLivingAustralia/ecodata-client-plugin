<span class="input-prepend input-append" data-bind="with:${source}">
    <input type="text" placeholder="" data-bind="${databindAttrs}" ${validationAttrs} ${attrs}/>
    <span class="add-on">
        <a target="_blank" data-bind="attr:{href: transients.bioProfileUrl}, visible: transients.guid"><i class="fa fa-info"></i></a>
        <a data-bind="visible: !guid() && name()" href="#" class="helphover" data-original-title="" data-placement="top" data-content="No matching species was found in Atlas of Living Australia's taxonomy">
            <i class="fa fa-question-circle-o">&nbsp;</i>
        </a>
    </span>
</span>
