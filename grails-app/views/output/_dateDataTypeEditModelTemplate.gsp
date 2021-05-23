<div id="${context.source}Date" class="pl-0 ${context.tagAttrs.dateColCss.toString()} input-group">
    <input  class="pr-0 mr-0 form-control form-control-sm" data-provide="datepicker" data-bind="${context.databindAttrs}" type="text" size="12" ${context.validationAttr}/>
    <div class="input-group-prepend mb-2">
        <span class="add-on open-datepicker input-group-text"><i class="fa fa-calendar"></i></span>
    </div>

</div>
<asset:script>
    $(function () {
        $(document).on('imagedatetime', function (event, data) {
            var id = "${context.source}Date",
                el = document.getElementById(id),
                viewModel = ko.dataFor(el);

            if(viewModel.${context.source} && !viewModel.${context.source}()){
                viewModel.${context.source}(data.date);
            }
        });
        $('.datepicker').datepicker();
    });
</asset:script>
