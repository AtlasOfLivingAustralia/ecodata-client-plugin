

<!-- ko stopBinding: true -->
<div id="map-modal" class="modal" role="dialog" tabindex="-1">
    <div class="modal-dialog modal-xl" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Mapping Site Activities</h3>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-hidden="true">
                    
                </button>
            </div>
            <div class="modal-body">
                <g:render template="/output/featureMap"/>
            </div>
            <div class="modal-footer">
                <button class="btn btn-sm btn-danger" type="button" data-bs-dismiss="modal" aria-hidden="true">Cancel</button>
                <button class="btn btn-sm btn-primary" type="button" aria-hidden="true">Ok</button>
            </div>
        </div>
    </div>

</div>
<!-- /ko -->
