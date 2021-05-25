    <!-- ko foreach: ${name} -->
    <!-- Images -->
    <div data-bind="visible: $data.status() != 'deleted'" class=" col-sm-3 margin-bottom-20" style="display:none;">
        <a data-bind="attr:{href:url, title:'[click to expand] '+name()}" target="_photo" rel="gallery">
            <img data-bind="attr:{src:thumbnailUrl,  alt:name}" class="imageDataTypePreview margin-bottom-10">
        </a>

        <g:if test="${options?.showRemoveButtonWithImage}">
            <div class="row">
                <div class="col-sm-12">
                    <a class="btn btn-danger btn-sm margin-top-10 margin-bottom-10 remove-btn-with-image" data-bind="click: remove.bind($data,$parent.${name})"><i class="fa fa-remove"></i> Remove</a>
                </div>
            </div>
        </g:if>
    </div>
    <div data-bind="visible: $data.status() != 'deleted'" class="col-sm-5 margin-bottom-20" style="display:none;">
            <div style="display:${showImgMetadata};">
                <div class="row">
                    <div class="col-sm-4 text-left control-group required">
                        <label class="control-label">Title: <g:if test="${options?.titleHelpText}"><i class="fa fa-question-circle popover" data-bind="popover:{container:'body', content:'${options.titleHelpText}', placement:'top'}"></i></g:if> </label>
                    </div>
                    <div class="col-sm-8">
                        <input type="text" data-bind="value:name" ${validationAttrs?'data-validation-engine="data-validate[groupRequired['+source+']]"':''}
                               class="form-control full-width-input image-title-input">
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 text-left control-group required">
                        <label class="control-label" >Date Taken: <i class="fa fa-question-circle popover" data-bind="popover:{container:'body', content:'Please ensure that this information is accurate and the date that the photograph was taken, not the date it was uploaded (unless they are the same date).', placement:'top'}">&nbsp;</i></label>
                    </div>
                    <div class="col-sm-8">
                        <div class="input-group">
                            <input type="text" data-bind="datepicker:dateTaken.date" name="dataTaken" data-validation-engine="validate[required]" class="form-control">
                            <div class="input-group-prepend customPrepend">
                                <span class="add-on open-datepicker input-group-text"><i class="fa fa-calendar"></i></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 text-left">
                        <label class="control-label">Licence: <i class="fa fa-question-circle popover"
                                                                data-bind="popover:{content:'Creative Commons Attribution (CC BY), Creative Commons-Noncommercial (CC BY-NC), Creative Commons Attribution-Share Alike (CC BY-SA), Creative Commons Attribution-Noncommercial-Share Alike (CC BY-NC-SA)', placement:'top'}">&nbsp;</i>
                        </label>
                    </div>
                    <div class="col-sm-8">
                        <select id="licence" data-bind="value:licence" class="form-control col-sm-12">
                            <option value="CC BY 3.0">Creative Commons Attribution 3.0</option>
                            <option value="CC BY 0">Creative Commons Attribution 0</option>
                            <option value="CC BY 4.0">Creative Commons Attribution 4.0</option>
                            <option value="CC BY-NC">Creative Commons Attribution-Noncommercial</option>
                        </select>
                    </div>
                </div>

                <div class="row">
                    <div class="col-sm-4 text-left">
                        <label class="control-label" for="attribution">
                            Attribution: <i class="fa fa-question-circle popover" data-bind="popover:{content:'The name of the photographer', placement:'top'}">&nbsp;</i>
                        </label>
                    </div>
                    <div class="col-sm-8">
                        <input id="attribution" class="form-control full-width-input" type="text" data-bind="value:attribution">
                    </div>
                </div>


                <div class="row">
                    <div class="col-sm-4 text-left">
                        <label class="control-label" for="notes">Notes: <i class="fa fa-question-circle" data-bind="popover:{content:'Additional notes you would like to supply regarding the photo point or photograph.', placement:'top'}">&nbsp;</i></label>
                    </div>
                    <div class="col-sm-8">
                        <input id="notes" class="form-control  full-width-input" type="text" data-bind="value:notes">
                    </div>
                </div>

                <div class="row readonly ">
                    <div class="col-sm-4 text-left">
                        <label class="control-label">File Name:</label>
                    </div>
                    <div class="col-sm-8">
                        <small class="padding-top-5" data-bind="text:filename"></small>
                        (<small class="padding-top-5" data-bind="text:formattedSize"></small>)
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-4 text-left">
                    </div>
                    <div class="col-sm-8">
                        <a class="btn btn-danger btn-sm" data-bind="click: remove.bind($data,$parent.${name})"><i
                                class="fa fa-remove"></i> Remove</a>
                    </div>
                </div>

        </div> <!-- col-sm-8 -->

    </div>
    <!-- /ko -->

    <table class="table table-custom-border borderless" data-bind="${databindAttrs}" data-url="<g:createLink controller='image' action='upload'/>">
        <tbody>
        <tr data-bind="visible:!complete()" style="display:none;">
            <td class="images-preview-width">
                <span class="preview"></span>
            </td>
            <td>

                <label for="progress" class="control-label">Uploading Image...</label>

                <div id="progress" class="controls progress progress-info active input-large"
                     data-bind="visible:!error() && progress() <= 100, css:{'progress-info':progress()<100, 'progress-success':complete()}">
                    <div class="bar" data-bind="style:{width:progress()+'%'}"></div>
                </div>

                <div id="successmessage" class="controls" data-bind="visible:complete()">
                    <span class="alert alert-success">Image successfully uploaded</span>
                </div>

                <div id="message" class="controls" data-bind="visible:error()">
                    <span class="alert alert-danger" data-bind="text:error"></span>
                </div>
            </td>
        </tr>
        <tr style="display:${allowImageAdd};" class="col-sm-8 text-right float-right">
            <td>
                <span class="btn btn-sm btn-success fileinput-button"><i class="fa fa-plus"></i> <input type="file" accept="image/*" name="files" ${validationAttrs?'data-validation-engine="data-validate[groupRequired['+source+']]"':''} ><span>Add images</span>
                </span>
            </td>
            <g:if test="${!options?.disableDragDrop}">
            <td>
                <div class="dropzone">
                    Or, drop images here
                </div>
            </td>
            </g:if>
        </tr>
        </tbody>
        <tfoot>

        </tfoot>
    </table>
