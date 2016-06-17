(function ($, window, document) {
    IX.ns('Hualala.Saas.Menu');
    var C = Hualala.Common,
        G = Hualala.Global,
        U = Hualala.UI,
        HT = Hualala.TplLib;
    var HSSM = Hualala.Saas.Menu,
        HMCM = Hualala.MCM;

    // 初始化集团菜谱页面头部
    var initGroupMenuHeader = function ($container) {
        $container.html('<div class="well well-sm t-r group-menu-operate">' + 
                                '<button class="btn btn-warning add-book">新增菜谱</button>' +
                          '</div>' + 
                          '<div class="group-menu-list"></div>');
        return $container.find('.group-menu-list');
    };

    HSSM.initGroupMenuHeader = initGroupMenuHeader;

    /**
     * 集团菜谱 菜谱列表 数据模型
     */
    var ListModel = HMCM.GiftMgrResultModel.subclass({
        constructor : HMCM.GiftMgrResultModel.prototype.constructor
    });

    ListModel.proto({
        load : function (params) {
            var self = this,
                queryParams = IX.clone(params);
            queryParams = IX.inherit(params, {
                groupID : Hualala.getSessionSite().groupID
            });
            self.hasPager ? self.updatePagerParams(params) :
                (queryParams = IX.inherit(params, { pageNo : '', pageSize : '' }));
            C.loadData(self.callServer, params, null, false)
                .done(function (rsp) {
                    self.updateDataStore($XP(rsp, 'data.records', []), $XP(rsp, 'data.page.pageNo'));
                    self.updatePagerParams($XP(rsp, 'data.page', {}));
                })
                .always(function () {
                    self.emit('loaded');
                });
        },
        updateBook : function (params) {
            var self = this,
                modelID = $XP(params, 'modelID'),
                postParams = $XP(params, 'postParams', {});
            self.updateRecordModel(modelID, postParams);
            self.emit('reload');
        },
        deleteBook : function (params) {
            var self = this,
                groupID = Hualala.getSessionSite().groupID,
                bookID = $XP(params, 'bookID');
            C.loadData('deleteFoodBook', {
                groupID : groupID, 
                bookID : bookID
            }).done(function () {
                self.emit('load');
            });
        },
        updateRecordModel : function (id, params) {
            var self = this,
                recordHT = self.get('ds_record'),
                mRecord = recordHT.get(id);
            mRecord.set(IX.inherit(mRecord.getAll(), params));
            return recordHT.register(id, mRecord);
        }
    });

    HSSM.GroupMenuListModel = ListModel;

    /**
     * 集团菜谱 菜谱列表 基础数据模型
     */
    var BaseListModel = Stapes.subclass({
        constructor : function (data) {
            this.set(data);
        }
    });

    HSSM.GroupMenuBaseListModel = BaseListModel;

    /**
     * 集团菜谱 菜谱列表 视图
     */
    var PublishListHeaderCfg = [
        {key : 'bookName', clz : 'text-center col-xs-2', label : '菜谱名称'},
        {key : 'bookRemark', clz : 'text-center col-xs-3', label : '备注'},
        {key : 'modifiedInfo', clz : 'text-center col-xs-2', label : '上次修改'},
        {key : 'publishInfo', clz : 'text-center col-xs-2', label : '上次发布'},
        {key : 'rowControl', clz : 'text-center col-xs-3', label : '操作'},
    ];

    var mapColItemRenderData = function (row, rowIdx, colKey) {
        var self = this,
            queryKeys = self.model.queryKeys,
            r = {value : '', text : ''},
            v = $XP(row, colKey, '');
        var formatDateTimeValue = C.formatDateTimeValue;
        switch (colKey) {
            case 'bookName' : 
                r.value = $XP(row, 'bookID');
                r.text = v;
                break;
            case 'modifiedInfo' : 
                var time = $XP(row, 'modifiedTime'),
                    user = $XP(row, 'modifiedBy');
                if (time == '0') {
                    r.value = r.text = '';
                } else {
                    r.value = v;
                    r.text = user + ', ' 
                        + IX.Date.getDateByFormat(formatDateTimeValue(time), 'yyyy-MM-dd HH:mm');
                }
                break;
            case 'publishInfo' : 
                var time = $XP(row, 'publishedTime'),
                    user = $XP(row, 'publishedBy');
                if (time == '0') {
                    r.value = r.text = '';
                } else {
                    r.value = v;
                    r.text = user + ', ' 
                        + IX.Date.getDateByFormat(formatDateTimeValue(time), 'yyyy-MM-dd HH:mm');
                }
                break;
            case 'rowControl' :
                var bookID = $XP(row, 'bookID', 0);
                var btnCfg = {
                    link : 'javascript:void(0);',
                    clz : 'btn-xs btn-link',
                    id : bookID,
                    key : $XP(row, '__id__'),
                };
                r = {
                    type : 'button',
                    rowspan : 1,
                    colspan : 1,
                    btns : [
                        IX.inherit(btnCfg, {
                            label : '设置明细',
                            type : 'food',
                            link : Hualala.PageRoute.createPath('saasMenuGroupMenuFood', [bookID])
                        }),
                        IX.inherit(btnCfg, {
                            label : '设置分类',
                            type : 'category',
                            link : Hualala.PageRoute.createPath('saasMenuGroupMenuCategory', [bookID])
                        }),
                        IX.inherit(btnCfg, {
                            label : '发布',
                            type : 'publish'
                        }),
                        IX.inherit(btnCfg, {
                            label : '修改',
                            type : 'update'
                        }),
                        IX.inherit(btnCfg, {
                            label : '删除',
                            type : 'delete'
                        }),
                    ]
                };
                break;
            default :
                r.value = r.text = v;
        }
        return r;
    };

    var mapListRenderData = function (records) {
        var self = this;
        var clz = 'col-md-12',
            tblClz = 'table-bordered table-striped table-hover',
            tblHeaders = PublishListHeaderCfg;
        var mapColsRenderData = function (row, idx) {
            var colKeys = _.map(tblHeaders, function (el) {
                    return {
                        key : $XP(el, 'key', ''), 
                        clz : $XP(el, 'clz', '')
                    };
                }),
                col = {clz : 'text-center', type : 'text'},
                cols = _.map(colKeys, function (k, i) {
                    var r = mapColItemRenderData.call(self, row, idx, $XP(k, 'key', ''));
                    return IX.inherit(col, r, {clz : $XP(k, 'clz', '')});
                });
            return cols;
        };
        var rows = _.map(records, function (row, idx) {
            var rowSet = {
                clz : '',
                cols : mapColsRenderData(row, idx)
            };
            return rowSet;
        });
        var tfoot = [
            {clz : 'hidden', cols : []}
        ];

        return {
            clz : clz,
            tblClz : tblClz,
            isEmpty : !records || records.length == 0 ? true : false,
            colCount : tblHeaders.length,
            thead : tblHeaders,
            rows : rows,
            tfoot : tfoot
        };
    };

    HSSM.mapGroupMenuListRenderData = mapListRenderData;

    var renderList = function (data) {
        var self = this;
        self.$result.empty().html(self.get('resultTpl')(data));
    };

    HSSM.renderGroupMenuList = renderList;

    var ListView = HMCM.QueryResultView.subclass({
        constructor : function (cfg) {
            this.$banner = $XP(cfg, 'banner');
            HMCM.QueryResultView.prototype.constructor.call(this, cfg);
        }
    });

    ListView.proto({
        loadTemplates : function () {
            var layoutTpl = Handlebars.compile(HT.get('tpl_shop_list_layout')),
                resultTpl = Handlebars.compile(HT.get('tpl_base_datagrid'));
            Handlebars.registerPartial('colBtns', HT.get('tpl_base_grid_colbtns'));
            Handlebars.registerHelper('chkColType', function (conditional, options) {
                return (conditional == options.hash.type) ? options.fn(this) : options.inverse(this);
            });
            this.set({
                layoutTpl : layoutTpl,
                resultTpl : resultTpl
            });
        },

        bindEvent : function () {
            var self = this;
            self.$result.on('click', '.btn-link', function (evt) {
                var $btn = $(this),
                    type = $btn.data('type'),
                    bookID = $btn.data('id'),
                    modelID = $btn.data('key');
                modelItem = self.model.getRecordModelByID(modelID);
                switch (type) {
                    case 'update' :
                        var editView = new HSSM.GroupMenuEditModal({
                            model : modelItem,
                            successFn : function (params) {
                                U.TopTip({
                                    msg : '菜谱更新成功',
                                    type : 'success'
                                });
                                self.emit('updateBook', {
                                    modelID : modelID,
                                    postParams : params
                                });
                            }
                        });
                        break;
                    case 'publish' :
                        var publishView = new HSSM.GroupMenuPublishModal({
                            model : modelItem,
                            successFn : function () {
                                self.emit('reload');
                            }
                        });
                        break;
                    case 'delete' :
                        U.Confirm({
                            title : '删除菜谱',
                            msg : '确认删除该菜谱？',
                            okFn : function () {
                                self.emit('deleteBook', {
                                    bookID : bookID
                                });
                            },
                        });
                        break;
                }
            });
            self.$banner.on('click', '.add-book', function (evt) {
                var editView = new HSSM.GroupMenuEditModal({
                    callServer : G.addFoodBook,
                    successFn : function (params) {
                        U.TopTip({
                            msg : '新增菜谱成功',
                            type : 'success'
                        });
                        self.emit('addBook', params);
                    }
                });
            });
        }
    });

    HSSM.GroupMenuListView = ListView;

    /**
     * 集团菜谱 菜谱列表 控制器
     */
    var ListController = HMCM.QueryResultControler.subclass({
        constructor : function (cfg) {
            HMCM.QueryResultControler.prototype.constructor.call(this, cfg);
            this.init();
        }
    });

    ListController.proto({
        init : function (params) {
            var self = this;
            HMCM.QueryResultControler.prototype.init.call(self, params);
            self.emit('load', params);
        },

        bindModelEvent : function () {
            this.model.on({
                load : function (params) {
                    var self = this;
                    self.loadingModal.show();
                    self.model.load(params);
                },
                reload : function () {
                    var self = this;
                    self.view.emit('render');
                },
                loaded : function () {
                    var self = this;
                    self.view.emit('render');
                    self.loadingModal.hide();
                },
                updateBook : function (params) {
                    var self = this;
                    self.model.updateBook(params);
                },
                deleteBook : function (params) {
                    var self = this;
                    self.model.deleteBook(params);
                }
            }, this);
        },

        bindViewEvent : function () {
            this.view.on({
                reload : function (params) {
                    var self = this;
                    self.model.emit('load');
                },
                addBook : function (params) {
                    var self = this;
                    self.model.emit('load');
                },
                updateBook : function (params) {
                    var self = this;
                    self.model.emit('updateBook', params);
                },
                deleteBook : function (params) {
                    var self = this;
                    self.model.emit('deleteBook', params);
                },
                render : function () {
                    var self = this;
                    self.view.render();
                }
            }, this);
        }
    });

    HSSM.GroupMenuListController = ListController;


    // 修改菜谱模态框视图
    var EditModalViewCfg = {
        bookName : {
            type : 'text',
            //clz : '',
            label : '菜谱名称*',
            //labelClz : '',
            //defaultVal : '',
            validCfg : {
                validators : {
                    notEmpty : {
                        message : '菜谱名称不能为空'
                    },
                    stringLength : {
                        max : 100,
                        message : '菜谱名称不能超过100个字符'
                    },
                    regexp : {
                        regexp : /^[^\\\\"'“”’‘\[\]{}]*$/,
                        message : '请不要输入反斜杠、单引号、双引号、大括号、中括号等特殊字符'
                    }
                }
            }
        },
        bookRemark : {
            type : 'textarea',
            label : '备注',
            validCfg : {
                validators : {
                    stringLength : {
                        max : 500,
                        message : '备注不能超过500个字符'
                    },
                    regexp : {
                        regexp : /^[^\\\\"'“”’‘\[\]{}]*$/,
                        message : '请不要输入反斜杠、单引号、双引号、大括号、中括号等特殊字符'
                    }
                }
            }
        }
    };
    var EditModalViewFormElsHT = new IX.IListManager();
    _.each(EditModalViewCfg, function (el, k) {
        var type = $XP(el, 'type');
        var clz = 'col-xs-8 col-sm-8 col-md-6',
            labelClz = 'col-xs-2 col-sm-2 col-md-4 control-label';
        EditModalViewFormElsHT.register(k, IX.inherit(el, {
            id : k + '_' + IX.id(),
            name : k,
            clz : $XP(el, 'clz', clz),
            labelClz : $XP(el, 'labelClz', labelClz)
        }));
    });

    var EditModalView = Stapes.subclass({
        constructor : function (cfg) {
            this.callServer = $XP(cfg, 'callServer', 'updateFoodBook');
            this.model = $XP(cfg, 'model', null);
            this.formKeys = $XP(cfg, 'formKeys', 'bookName,bookRemark'.split(','));
            this.successFn = $XF(cfg, 'successFn');
            this.failedFn = $XF(cfg, 'failedFn');
            
            this.modal = null;
            this.$body = null;
            this.$footer = null;

            this.loadTemplates();
            this.render();
            this.bindEvents();
        }
    });

    EditModalView.proto({
        loadTemplates : function () {
            var layoutTpl = Handlebars.compile(Hualala.TplLib.get('tpl_shop_service_form_layout')),
                btnTpl = Handlebars.compile(Hualala.TplLib.get('tpl_shop_modal_btns'));
            Handlebars.registerHelper('checkFormElementType', function (conditional, options) {
                return (conditional == options.hash.type) ? options.fn(this) : options.inverse(this);
            });
            Handlebars.registerHelper('isInputGroup', function (prefix, surfix, options) {
                return (!prefix && !surfix) ? options.inverse(this) : options.fn(this);
            });
            this.set({
                layoutTpl : layoutTpl,
                btnTpl : btnTpl
            });
        },

        initModal : function () {
            this.modal = new U.ModalDialog({
                id : 'saas_update_book_modal',
                clz : 'saas-update-book-modal',
                title : (this.model ? '修改' : '添加') + '菜谱',
                backdrop : 'static'
            });
            this.$body = this.modal._.body;
            this.$footer = this.modal._.footer;
        },

        bindEvents : function () {
            var self = this;

            this.$footer.on('click', '.btn-ok', function (evt) {
                var $btn = $(this);
                var params = self.serializeForm(),
                    $form = self.$body.find('form');
                if (!$form.data('bootstrapValidator').validate().isValid()) return;
                params = IX.inherit(params, {
                    groupID : Hualala.getSessionSite().groupID,
                    bookID : self.model && self.model.get('bookID'),
                    isActive : 1
                });
                C.loadData(self.callServer, params)
                    .done(function (records) {
                        var newData = records && records[0] || params;
                        self.modal.hide();
                        self.successFn(newData);
                    })
                    .fail(self.failedFn);
            });
        },

        mapRenderData : function (record) {
            var items = _.map(this.formKeys, function (key) {
                var item = EditModalViewFormElsHT.get(key);
                item = IX.inherit(IX.clone(item), {
                    clz : 'col-xs-8 col-sm-8 col-md-6',
                    labelClz : 'col-xs-2 col-sm-2 col-md-4 control-label',
                    value : $XP(record, key, '')
                });
                if (key == 'bookRemark') {
                    item.remark = C.decodeTextEnter(item.value);
                }
                return item;
            });
            return {
                formClz : 'form-feedback-out bv-form',
                items : items
            };
        },

        render : function () {
            var recordData = this.model && this.model.getAll(),
                renderData = this.mapRenderData(recordData);
            this.initModal();
            this.$body.html(this.get('layoutTpl')(renderData));
            this.initValidators();
            this.modal.show();
        },

        serializeForm : function () {
            var params = [],
                $form = this.$body.find('form');
            params = $form.serializeArray();
            params = _.map(params, function (param) {
                var n = param.name, v = param.value;
                if (n == 'bookRemark') {
                    v = C.encodeTextEnter(v);
                }
                return {
                    name : n,
                    value : v
                };
            });
            return _.object(_.pluck(params, 'name'), _.pluck(params, 'value'));
        },

        initValidators : function () {
            var fvOpts = {};
            _.each(this.formKeys, function (k) {
                var elCfg = EditModalViewFormElsHT.get(k),
                    type = $XP(elCfg, 'type');
                if (type != 'hidden') fvOpts[k] = $XP(elCfg, 'validCfg');
            });
            this.$body.find('form').bootstrapValidator({
                trigger : 'blur',
                fields : fvOpts
            });
        }
    });

    HSSM.GroupMenuEditModal = EditModalView;

    // 发布菜谱模态框视图
    var PublishModalFormElsCfg = {
        isAtOnce : {
            type : 'radio',
            label : '发布时间',
            options : [{
                label : '立即发布',
                value : 1,
                checked : 'checked'
            }, {
                label : '指定时间发布',
                value : 0
            }]
        },
        publishDateTime : {
            type : 'section',
            min : {
                type : 'datetimepicker',
                surfix : '<span class="glyphicon glyphicon-calendar"></span>',
                validCfg : {
                    validators : {
                        notEmpty : {
                            message : '发布日期不能为空'
                        },
                        callback : {
                            message : '',
                            callback : function (value, validators, $field) {
                                var nowDate = IX.Date.getDateByFormat(new Date(), 'yyyyMMdd'),
                                    setDate = IX.Date.getDateByFormat(value, 'yyyyMMdd');
                                if (setDate < nowDate) {
                                    return {
                                        valid : false,
                                        message : '发布日期不能早于当前日期'
                                    };
                                }
                                return true;
                            }
                        }
                    }
                }
            },
            max : {
                type : 'timepicker',
                spanClz : 'hidden',
                surfix : '<span class="glyphicon glyphicon-time"></span>',
                validCfg : {
                    validators : {
                        notEmpty : {
                            message : '发布时间不能为空'
                        },
                        callback : {
                            message : '',
                            callback : function (value, validators, $field) {
                                var $date = validators.$form.find('[name="publishDate"]'),
                                    nowTime = IX.Date.getDateByFormat(new Date(), 'yyyyMMddHHmm'),
                                    setTime = IX.Date.getDateByFormat($date.val() + ' ' + value, 'yyyyMMddHHmm');
                                $date.trigger('change'); // 手动触发日期选择框的检查
                                if (setTime < nowTime) {
                                    return {
                                        valid : false,
                                        message : '发布时间不能早于当前时间'
                                    };
                                }
                                return true;
                            }
                        }
                    }
                }
            }
        },
        publishMode : {
            type : 'combo',
            label : '发布方式',
            clz : 'col-xs-4',
            options : [{
                label : '完全替换店铺菜谱',
                value : 2
            }, {
                label : '合并店铺菜谱',
                value : 0
            }]
        },
        isCover : {
            type : 'radio',
            label : '',
            options : [{
                label : '覆盖同名菜品',
                value : 1,
                checked : 'checked'
            }, {
                label : '忽略同名菜品',
                value : 0
            }]
        }
    };
    var PublishModalFormElsHT = new IX.IListManager();
    _.each(PublishModalFormElsCfg, function (el, k) {
        var type = $XP(el, 'type');
        var clz = 'col-xs-8 col-sm-8 col-md-8',
            labelClz = 'col-xs-2 col-sm-2 col-md-2 control-label';
        if (type == 'radio') {
            var opts = _.map($XP(el, 'options', []), function (el) {
                return IX.inherit(el, {
                    id : k + '_' + IX.id(),
                    name : k,
                    labelClz : $XP(el, 'labelClz', 'control-label col-xs-4 radio-label')
                });
            });
            PublishModalFormElsHT.register(k, IX.inherit(el, {
                clz : $XP(el, 'clz', clz),
                labelClz : $XP(el, 'labelClz', labelClz),
                options : opts
            }));
        } else if (type == 'section' && k == 'publishDateTime') {
            var dateID = k + '_date_' + IX.id(),
                timeID = k + '_time_' + IX.id(),
                dateName = 'publishDate',
                timeName = 'publishTime',
                date = IX.inherit($XP(el, 'min', {}), {
                    id : dateID,
                    name : dateName,
                    clz : 'col-xs-4'
                }),
                time = IX.inherit($XP(el, 'max', {}), {
                    id : timeID,
                    name : timeName,
                    clz : 'col-xs-3'
                });
            PublishModalFormElsHT.register(k, IX.inherit(el, {
                clz : $XP(el, 'clz', clz),
                labelClz : $XP(el, 'labelClz', labelClz),
                min : date,
                max : time
            }));
        } else {
            PublishModalFormElsHT.register(k, IX.inherit(el, {
                id : k + '_' + IX.id(),
                name : k,
                clz : $XP(el, 'clz', clz),
                labelClz : $XP(el, 'labelClz', labelClz)
            }));
        }
    });
    HSSM.PublishModalFormElsHT = PublishModalFormElsHT;

    var PublishModalView = Stapes.subclass({
        constructor : function (cfg) {
            this.callServer = $XP(cfg, 'callServer', 'publishFoodBook');
            this.successFn = $XF(cfg, 'successFn');
            this.failedFn = $XF(cfg, 'failedFn');
            this.set({
                model : $XP(cfg, 'model')
            });

            this.queryModel = new Hualala.Shop.QueryModel();
            this.modal = null;
            this.$body = null;
            this.$footer = null;
            this.$shopList = null;
            this.loadingModal = new U.LoadingModal({start:100});

            this.loadTemplates();
            this.initModal();
            this.bindEvents();
            this.emit('load');
        }
    });

    PublishModalView.proto({
        loadTemplates : function () {
            var layoutTpl = Handlebars.compile(HT.get('tpl_saas_publish_book')),
                listTpl = Handlebars.compile(HT.get('tpl_shops_tree'));
            Handlebars.registerPartial('formElements', HT.get('tpl_shop_service_form_layout'));
            Handlebars.registerPartial('collapseBtn', HT.get('tpl_collapse_btn'));
            Handlebars.registerPartial('item', HT.get('tpl_shop_checkbox'));
            Handlebars.registerHelper('checkFormElementType', function (conditional, options) {
                return (conditional == options.hash.type) ? options.fn(this) : options.inverse(this);
            });
            this.set({
                layoutTpl : layoutTpl,
                listTpl : listTpl
            });
        },

        initModal : function () {
            var self = this;
            self.modal = new U.ModalDialog({
                id : 'saas_publish_book_modal',
                clz : 'saas-publish-book-modal',
                title : '菜谱发布',
                okLabel : '发布',
                backdrop : 'static'
            });
            self.$body = self.modal._.body;
            self.$footer = self.modal._.footer;
            self.renderLayout();
        },

        renderLayout : function () {
            var self = this,
                tpl = self.get('layoutTpl'),
                data = self.get('model').getAll(),
                renderData = self.mapLayout(data);
            self.$body.html(tpl(renderData));
            self.$shopList = self.$body.find('.shop-list');
            self.initFormEls();
            self.initValidators();
        },

        mapLayout : function (data) {
            var elsHT = HSSM.PublishModalFormElsHT,
                formKeys = 'isAtOnce,publishDateTime,publishMode,isCover'.split(',');   
            return {
                bookName : data.bookName,
                formClz : 'form-feedback-out bv-form',
                items : _.map(formKeys, function (el) {
                    return elsHT.get(el);
                })
            };
        },

        initFormEls : function () {
            this.$body.find('[data-type="datetimepicker"]')
                .val(IX.Date.getDateByFormat(new Date(), 'yyyy/MM/dd'))
                .datetimepicker({
                    format : 'yyyy/mm/dd',
                    startDate : '2010/01/01',
                    autoclose : true,
                    minView : 'month',
                    todayBtn : true,
                    todayHighlight : true,
                    language : 'zh-CN'
                });
            this.$body.find('[data-type="timepicker"]')
                .on('click', function () {
                    $(this).timepicker('showWidget');
                })
                .timepicker({ 
                    minuteStep: 1,
                    showMeridian: false,
                    showInputs: false
                });
        },

        initValidators : function () {
            var publishDateTimeHT = HSSM.PublishModalFormElsHT.get('publishDateTime'),
                fvOpts = {
                    publishDate : publishDateTimeHT.min.validCfg,
                    publishTime : publishDateTimeHT.max.validCfg
                };
            this.$body.find('form').bootstrapValidator({
                trigger : 'change',
                fields : fvOpts
            });
        },

        mapShopTree : function () {
            var self = this,
                queryModel = self.queryModel;
            var cities = queryModel.getCities();
            var mapShopData = function (list) {
                var curShopLst = queryModel.getShops(list);
                var shops = _.map(curShopLst, function (shop) {
                    var shopID = $XP(shop, 'shopID', ''),
                        shopName = $XP(shop, 'shopName', '');
                    return {
                        nodeClz : 'col-sm-4',
                        nodeType : 'shop',
                        id : shopID,
                        name : shopName,
                        parentID : $XP(shop, 'areaID'),
                        hideCollapse : 'hidden'
                    };
                });
                return {
                    shops : shops,
                    expanded : 'in'
                };
            };
            var mapAreaData = function (list) {
                var curAreaLst = queryModel.getAreas(list);
                var areas = _.map(curAreaLst, function (area) {
                    var areaID = $XP(area, 'areaID', ''),
                        areaName = $XP(area, 'areaName', ''),
                        shopLst = $XP(area, 'shopLst', []);
                    return IX.inherit({
                        nodeClz : '',
                        nodeType : 'area',
                        id : areaID,
                        name : areaName,
                        parentID : $XP(area, 'cityID'),
                        hideCollapse : ''
                    }, mapShopData(shopLst));
                });
                return {
                    areas : areas
                };
            };
            return {
                cities : _.map(cities, function (city) {
                    var cityID = $XP(city, 'cityID', ''),
                        cityName = $XP(city, 'cityName', ''),
                        areaLst = $XP(city, 'areaLst', []);
                    
                    return IX.inherit({
                        nodeClz : '',
                        nodeType : 'city',
                        id : cityID,
                        name : cityName,
                        parentID : 'root',
                        hideCollapse : ''
                    }, mapAreaData(areaLst));
                })
            };
        },

        render : function () {
            var self = this,
                tpl = self.get('listTpl'),
                renderData = self.mapShopTree();
            self.$shopList.html(tpl(renderData));
        },

        bindEvents : function () {
            var self = this,
                $form = self.$body.find('form'),
                $timeInput = self.$body.find('input:text');
            var bindParentNode = function (pID) {
                if (pID == 'root') return;
                var $pEl = $(':checkbox[value=' + pID + ']'),
                    parentID = $pEl.attr('data-parent'),
                    val = $pEl.val(), name = $pEl.attr('name');
                var $childEls = $('#' + name + '_' + val).find(':checkbox');
                var unCheckEls = _.reject($childEls, function (el) {
                    return !!el.checked;
                });
                if (unCheckEls.length == 0) {
                    $pEl[0].checked = true;
                } else {
                    $pEl[0].checked = false;
                }
                bindParentNode(parentID);
            };

            this.on({
                "load" : function () {
                    var params = IX.inherit(Hualala.getSessionUser(), {
                        excludeAgent : 1
                    });
                    self.loadingModal.show();
                    self.queryModel.init(params, function (queryModel) {
                        self.loadingModal.hide();
                        self.queryModel = queryModel;
                        self.render();
                        self.modal.show();
                    });
                },
                "submit" : function (params) {
                    var executeTime = params.publishedExecuteTime 
                        || IX.Date.getDateByFormat(new Date(), 'yyyyMMdd');
                    C.loadData(self.callServer, params)
                        .done(function () {
                            U.TopTip({
                                msg : '菜谱发布成功',
                                type : 'success'
                            });
                            self.modal.hide();
                            // Fix BUG #7581 【Dohko-dianpu】菜谱确认发布后不跳转，停留在菜谱列表页
                            // document.location.href = Hualala.PageRoute.createPath('saasDataPublish',
                            //     [executeTime, executeTime]);
                            self.successFn();
                        })
                        .fail(self.failedFn);
                }
            }, this);

            // self.$body.on('change', ':radio', function (e) {
            //     var $radio = $(this),
            //         id = $radio.attr('id');
            //     $form.bootstrapValidator('resetForm');
            //     $timeInput.prop('disabled', id == 'publish_now');
            // });
            
            self.$body
                .on('change', ':radio[name="isAtOnce"]', function (e) {
                    var $radio = $(this),
                        $time = self.$body.find('[name="publishDate"], [name="publishTime"]'),
                        isHide = $radio.val() == '1';
                    $time.prop('disabled', isHide)
                        .closest('.form-group').toggleClass('hidden', isHide);
                })
                .on('change', 'select[name="publishMode"]', function (e) {
                    var $select = $(this),
                        $isCover = self.$body.find('[name="isCover"]'),
                        isHide = $select.val() == '2';
                    $isCover.prop('disabled', isHide)
                        .closest('.form-group').toggleClass('hidden', isHide);
                });
            // 手动触发事件初始化元素
            self.$body.find(':radio:checked, select').trigger('change');

            self.$shopList.on('change', ':checkbox', function (e) {
                var $chkBox = $(this), type = $chkBox.attr('name'),
                    checked = !this.checked ? false : true,
                    val = $chkBox.val(), parentID = $chkBox.attr('data-parent');
                // if (type == "shop") {
                    
                // } else if (type == "area") {
                    
                // } else if (type == "city") {
                    
                // }
                if (type == "area" || type == "city") {
                    $('#' + type + '_' + val).find(':checkbox').each(function () {
                        this.checked = checked;
                    });
                }
                bindParentNode(parentID);
            });
            self.$shopList.on('click', '.btn-link[data-toggle="collapse"]', function(event) {
                var $btn = $(this), $icon = $btn.find('.glyphicon'),
                    collapsed = $icon.hasClass('glyphicon-chevron-down');
                $icon.removeClass().addClass(collapsed ? 'glyphicon glyphicon-chevron-up' : 'glyphicon glyphicon-chevron-down');
            });

            self.$footer.on('click', '.btn-ok', function (e) {
                var params = {};
                $form.bootstrapValidator('resetForm');
                if (!$form.data('bootstrapValidator').validate().isValid()) return;
                params = self.getPostParams();
                if (params.shopIDs.length == 0) {
                    U.TopTip({
                        msg : '请至少选择一家店铺',
                        type : 'warning'
                    });
                    return;
                }
                U.Confirm({
                    title : '确认发布',
                    msg : params.isAtOnce == 1 ? '点击“确定”后，该菜谱将立即发布到所选店铺<br/><br/>确认发布？' :
                        '点击“确定”后仍可修改该菜谱<br/>最终发布到店铺的菜谱将以您设定时间到达时的菜谱状态为准<br/><br/>确认发布？',
                    //okLabel : '发布',
                    okFn : function () {
                        self.emit('submit', params);
                    }
                });
            });
        },

        getPostParams : function () {
            var self = this,
                shops = [],
                dateTime = '0',
                model = self.get('model'),
                params = {
                    groupID : Hualala.getSessionSite().groupID,
                    bookID : model.get('bookID'),
                    bookName : model.get('bookName')
                };
            var $form = self.$body.find('form'),
                $checkedShops = self.$shopList.find(':checkbox:checked'),
                formData = $form.serializeArray(),
                shopData = $checkedShops.serializeArray();

            formData = _.object(_.pluck(formData, 'name'), _.pluck(formData, 'value'));
            dateTime = (formData.isAtOnce == '1') ? '0' 
                : IX.Date.getDateByFormat(formData.publishDate + ' ' + formData.publishTime, 'yyyyMMddHHmm');
            
            _.each(shopData, function (el) {
                if (el.name == 'shop') shops.push(el.value);
            });

            return IX.inherit(params, {
                shopIDs : shops.join(','),
                isCover : formData.publishMode == '2' ? '2' : formData.isCover,
                isAtOnce : formData.isAtOnce,
            }, formData.isAtOnce == '0' ? {
                publishedExecuteTime : dateTime
            } : {});
        }
    });

    HSSM.GroupMenuPublishModal = PublishModalView;
    
})(jQuery, window, document, undefined);