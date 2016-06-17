

var dldActions={
	addAction : "shop_addBaseCity",
	queryAction:"shop_queryBaseCity",
	updateAction:"shop_updateBaseCity",
	deleteAction:"shop_deleteBaseCity"
};

var gridInfo={
	colNames:[
		'城市ID',
		'城市名称',
		'是否启用',
		'是否热点城市',
		'当前天气信息',
		'城市首页URL',
		'城市首页跳转页面URL',
		'城市热门关键字',
		'城市可编辑板块的html代码',
		'城市首页右侧可编剧板块的html代码',
		'顶部可编辑区域的Html代码',
		'背景图片路径',
		'背景图片生效起始日期',
		'背景图片有效截止日期',
		'大区编号',
		'大区名称',
		'排序值',
		'省份ID',
		'省份名称'
		],
   	colModel:[
		{ name:'cityID' , index:'cityID',editable : true, edittype : 'text', editoptions : {dataInit: function(element) { $(element).attr("readonly", "readonly"); },addonly:true,readonly:false,maxlength:10}, editrules : {edithidden:true,required : true,integer:true },formoptions:{rowpos:1, colpos:1}}, //城市ID（电话区号+1000）县级城市2位
		{ name:'cityName' , index:'cityName',editable : true, edittype : 'text', editoptions : {addonly : true,readonly:false,maxlength:20}, editrules : {edithidden:true,required : true,custom:false },formoptions:{rowpos:1, colpos:2}}, //cityName
		{ name:'isActive' , index:'isActive',editable : true, edittype : 'select',formatter:'select', editoptions : {value:getStaticOptions("isActiveUse"),readonly:false,maxlength:3}, editrules : {edithidden:true,integer:true,maxvalue:255 },formoptions:{rowpos:2, colpos:1}}, //是否启用
		{ name:'isHot' , index:'isHot',editable : true, edittype : 'select',formatter:'select', editoptions : {value:getStaticOptions("isHot"),readonly:false,maxlength:3}, editrules : {edithidden:true,integer:true,maxvalue:255 },formoptions:{rowpos:2, colpos:2}}, //是否热点城市
		{ name:'weatherInfo' , index:'weatherInfo',editable : true, edittype : 'text', editoptions : {readonly:false,maxlength:50}, editrules : {edithidden:true,custom:false },formoptions:{rowpos:9, colpos:2}}, //当前天气信息
		{ name:'cityHomePageUrl' , index:'cityHomePageUrl',editable : true, edittype : 'text', editoptions : {readonly:false,maxlength:250}, editrules : {edithidden:true,custom:false },formoptions:{rowpos:5, colpos:1},hidden:true}, //城市首页URL(不带域名） 例如：北京  beijing 天津  tianjin 上海  shanghai
		{ name:'cityHomePageGoToUrl' , index:'cityHomePageGoToUrl',editable : true, edittype : 'text', editoptions : {readonly:false,maxlength:230}, editrules : {edithidden:true,custom:false },formoptions:{rowpos:5, colpos:2},hidden:true}, //城市首页跳转页面URL(不带域名）空时表示不调整，反之直接跳转到此页面
		{ name:'cityHotSearchKeywordLst' , index:'cityHotSearchKeywordLst',editable : true, edittype : 'text', editoptions : {readonly:false,maxlength:250}, editrules : {edithidden:true,custom:false },formoptions:{rowpos:9, colpos:1,elmsuffix : '例如：麻辣诱惑|豆捞坊|望湘园'},hidden:true}, //城市热门搜索关键字列表，多个关键字之间用|隔开 例如：麻辣诱惑|豆捞坊|望湘园
		{ name:'cityDivHtml' , index:'cityDivHtml',editable : true, edittype : 'textarea',formatter:html2String, editoptions : {readonly:false,maxlength:20000}, editrules : {edithidden:true,custom:false },formoptions:{rowpos:6, colpos:1},hidden:true}, //城市可编剧板块的html代码
		{ name:'cityRigthDivHtml' , index:'cityRigthDivHtml',editable : true, edittype : 'textarea',formatter:html2String,  editoptions : {readonly:false,maxlength:20000}, editrules : {edithidden:true,custom:false },formoptions:{rowpos:6, colpos:2},hidden:true}, //城市首页右侧可编剧板块的html代码
		{ name:'cityTopDivHtml' , index:'cityTopDivHtml',editable : true, edittype : 'textarea',formatter:html2String,  editoptions : {readonly:false,maxlength:20000}, editrules : {edithidden:true,custom:false },formoptions:{rowpos:7, colpos:1},hidden:true}, //顶部可编辑区域的Html代码
		{ name:'backgroundImagePath' , index:'backgroundImagePath',editable : true, edittype : 'text', editoptions : {readonly:false,maxlength:230}, editrules : {edithidden:true,custom:false },formoptions:{rowpos:7, colpos:2},hidden:true}, //背景图片路径
		{ name:'backgroundImageStartDate' , index:'backgroundImageStartDate',editable : true, edittype : 'text',formatter:setTime, editoptions : {style:"width: 100px;",readonly:false,maxlength:19,dataInit : function(el) {$(el).click(function() {datePick($(el));});}}, editrules : {edithidden:true,custom:false },formoptions:{rowpos:8, colpos:1},hidden:true}, //背景图片生效起始日期  格式：YYYYMMDD  必须指定生效日期
		{ name:'backgroundImageEndDate' , index:'backgroundImageEndDate',editable : true, edittype : 'text', formatter:setTime, editoptions : {style:"width: 100px;",readonly:false,maxlength:19,dataInit : function(el) {$(el).click(function() {datePick($(el));});}}, editrules : {edithidden:true,custom:false },formoptions:{rowpos:8, colpos:2},hidden:true}, //背景图片有效截止日期 格式：YYYYMMDD 必须指定截止日期
		{ name:'regionCode' , index:'regionCode',editable : true, edittype : 'text', editoptions : {readonly:false,maxlength:10}, editrules : {edithidden:true,integer:true },formoptions:{rowpos:3, colpos:1}}, //regionCode
		{ name:'regionName' , index:'regionName',editable : true, edittype : 'text', editoptions : {readonly:false,maxlength:20}, editrules : {edithidden:true,custom:false },formoptions:{rowpos:3, colpos:2},hidden:true}, //regionName
		{ name:'sortIndex' , index:'sortIndex',editable : true, edittype : 'text', editoptions : {readonly:false,maxlength:10}, editrules : {edithidden:true,integer:true },formoptions:{rowpos:10, colpos:1},hidden:true}, //排序值（用户切换城市面板中城市排序）
		{ name:'provinceID' , index:'provinceID',editable : true, edittype : 'text', editoptions : {readonly:false,maxlength:20}, editrules : {edithidden:true,integer:true },formoptions:{rowpos:4, colpos:1}}, //省ID
		{ name:'provinceName' , index:'provinceName',editable : true, edittype : 'text', editoptions : {readonly:false,maxlength:10}, editrules : {edithidden:true,custom:false },formoptions:{rowpos:4, colpos:2}} //省名称		 
   	],
   	rowNum:10,
	height : '110',
    viewrecords: true,
    caption:"城市信息表",
	recordIDs:[	'cityID'],
	editurl : 'ajaxAction',
	parameter:{},
	beforeShowEditForm : function(formid) {
		$("#backgroundImageStartDate").datepicker();
		$("#backgroundImageEndDate").datepicker()
	},
	beforeShowAddForm:function(formid){
		$("#backgroundImageStartDate").datepicker();
		$("#backgroundImageEndDate").datepicker();
	},
	onSelectRow : function (id) {
		showTag(id);
	}
};
	var grid_base=null;
	$(document).ready(function () {
		 grid_base = new jQueryGrid({
			id : 'basecity_grid',
			container : $("#base_city_pos"),
			dldActions : dldActions,
			settings : gridInfo,
			url : '	ajaxAction'
		});
	});
	
	function baseCitySearch() {   
		$("#tags").remove();
		var searchString=$("#cityNameSearch").val();
		grid_base.queryParam={cityName : searchString };
		jqret = $("#basecity_grid").jqGrid("setGridParam", {
			page : "1"
		});
		jqret.trigger("reloadGrid");
	
		//jQuery("#basecity_grid").trigger("reloadGrid");
	} 
