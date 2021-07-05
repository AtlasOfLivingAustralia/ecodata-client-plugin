<div id="${context.source}Date" class="col-sm-3 input-group">
    <input class="form-control form-control-sm inputDatePicker" data-bind="${context.databindAttrs}" type="text" size="12" ${context.validationAttr}/>
    <div class="input-group-append">
        <span class="add-on input-group-text open-datepicker"><i class="fa fa-th"></i></span>
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
    });
</asset:script>