<g:if test="${name}">
<tr data-bind="visible:${property}.allowUserAddedRows || ${property}.showTableDataUpload()">
    <td colspan="${colCount}" style="text-align:left;">
        <button type="button" class="btn btn-sm" data-bind="visible:${property}.allowUserAddedRows, click:${property}.addRow"><i class="fa fa-plus"></i> ${addRowText ?: "Add a row"} </button>
        <g:if test="${!disableTableUpload}">
            <button type="button" class="btn btn-sm" data-bind="click:${property}.showTableDataUpload"><i class="fa fa-upload"></i> ${uploadDataText ?: "Upload data for this table"} </button>
         </g:if>
    </td>
</tr>
</g:if>
<g:if test="${name && !disableTableUpload}">
<tr data-bind="visible:${property}.tableDataUploadVisible">
    <td colspan="${colCount}">
        <g:if test="${containsSpecies}">
            <div class="text-error text-left">
                Note: Only valid exact scientific names will be matched and populated from the database (indicated by a green tick). Unmatched species will load, but will be indicated by a green <b>?</b>. Please check your uploaded data and correct as required.
            </div>
        </g:if>

        <div class="text-left" data-bind="visible:${property}.allowUserAddedRows" style="margin:5px;">
            <input type="checkbox" data-bind="checked:${property}.appendTableRows" style="margin-right:5px">Append uploaded data to table (unticking this checkbox will result in all table rows being replaced)
        </div>

        <div class="text-left" style="margin:5px">
            <a data-bind="click:${property}.downloadTemplate" target="${name}TemplateDownload" class="btn">Step 1 - Download template (.xlsx)</a>
        </div>

        <div class="btn fileinput-button" style="margin-left:5px">
            <input type="file" name="data" data-bind="fileUploadNoImage:${property}.tableDataUploadOptions">
            Step 2 - Upload populated template
        </div>
    </td>
</tr>

<script id="${name}template-upload" type="text/x-tmpl">{% %}</script>
<script id="${name}template-download" type="text/x-tmpl">{% %}</script>
</g:if>
