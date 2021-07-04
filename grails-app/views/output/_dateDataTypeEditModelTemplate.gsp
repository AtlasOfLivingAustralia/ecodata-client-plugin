<div id="${context.source}Date" class="input-append">
    <input ${context.attributes.toString()} class="form-control form-control-sm input-small" data-bind="${context.databindAttrs}" type="text" size="12" ${context.validationAttr}/>
    <span class="add-on open-datepicker"><i class="fa fa-th"></i></span>
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
    });
</asset:script>