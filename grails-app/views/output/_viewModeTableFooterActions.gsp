<g:if test="${name && !disableTableDownload}">
<script id="${name}template-download" type="text/x-tmpl">{% %}</script>

<tr>
    <td colspan="${colCount}">
        <div class="text-start" style="margin:5px">
            <a data-bind="click:${property}.downloadTableData" class="btn"><i class="fa fa-download"></i> Download the data from this table (.xlsx)</a>
        </div>
    </td>
</tr>
</g:if>