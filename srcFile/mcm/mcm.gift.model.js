(function ($, window) {
	IX.ns("Hualala.MCM");
	var HMCM = Hualala.MCM;
	var U = Hualala.UI,
		topTip = U.TopTip;

    function encodeTextareaItem(data, textareaName) {
        if (data[textareaName]) {
            data[textareaName] = Hualala.Common.encodeTextEnter(data[textareaName]);
        }
        return data;
    }
    HMCM.getSMSSign = function(params) {
        var successFn = $XF(params, 'successFn');
        Hualala.Global.getSMSSignInfo({}, function(rsp) {
            var cancelReceive = '回复TD退订',
                rspData = $XP(rsp.data, 'records', [])[0],
                smsSignName = $XP(rspData, 'signName', '【互联网餐厅】');
            smsSignName = smsSignName.replace(/\[/g, '【');
            smsSignName = smsSignName.replace(/\]/g, '】');
            if(!smsSignName.match(/【/)) {
                smsSignName = '【' + smsSignName;
            }
            if(!smsSignName.match(/】/)){
                smsSignName = smsSignName + '】';
            }
            if(rsp.resultcode != '000') {
                Hualala.UI.TopTip({msg: rsp.resultmsg, type: 'danger'});
            }
            if(IX.isFn(successFn)) successFn(cancelReceive + smsSignName);
        });
    };
    //定义礼品查询结果模型
    var GiftMgrResultModel = Stapes.subclass({
		/**
		 * 构造礼品查询结果的数据模型
		 * @param  {object} cfg 配置信息
		 *          @param {Function} callServer 获取数据接口
		 *          @param {Array} queryKeys 搜索条件字段序列
		 *          @param {Boolean} hasPager 是否支持分页true：支持；false：不支持。default true
		 *          @param {String} gridType 结果数据表类型
		 *          
		 *          
		 * @return {[type]}     [description]
		 */
		constructor : function (cfg) {
			this.callServer = $XP(cfg, 'callServer', null);
			if (!this.callServer) {
				throw("callServer is empty!");
			}
			this.queryKeys = $XP(cfg, 'queryKeys', []);
			this.pagerKeys = 'pageCount,totalSize,pageNo,pageSize'.split(',');
			this.queryParamsKeys = null;
			this.hasPager = $XP(cfg, 'hasPager', true);
			this.recordModel = $XP(cfg, 'recordModel', BaseGiftModel);
			this.gridType = $XP(cfg, 'gridType', '');
		}
	});

	GiftMgrResultModel.proto({
		init : function (params) {
			this.set(IX.inherit({
				ds_record : new IX.IListManager(),
				ds_items : new IX.IListManager(),
				ds_page : new IX.IListManager()
			}, this.hasPager ? {
				pageCount : 0,
				totalSize : 0,
				pageNo : $XP(params, 'pageNo', 1),
				pageSize : $XP(params, 'pageSize', 15)
			} : {}));
			this.queryParamsKeys = !this.hasPager ? this.queryKeys : this.queryKeys.concat(this.pagerKeys);
		},
		updatePagerParams : function (params) {
			var self = this;
			var queryParamsKeys = self.queryParamsKeys.join(',');
			_.each(params, function (v, k, l) {
				if (queryParamsKeys.indexOf(k) > -1) {
					self.set(k, v);
				}
			});
		},
		getPagerParams : function () {
			var self = this;
			var ret = {};
			_.each(self.queryParamsKeys, function (k) {
				ret[k] = self.get(k);
			});
			return ret;
		},
		updateDataStore : function (data, pageNo) {
			var self = this,
				recordHT = self.get('ds_record'),
				pageHT = self.get('ds_page');
			pageNo = self.hasPager ? pageNo : 1;
			var recordIDs = _.map(data, function (r, i, l) {
				var id = pageNo + '_' + IX.id(),
					mRecord = new self.recordModel(IX.inherit(r, {
						'__id__' : id,
						'__gridtype__' : self.gridType
					}));
				recordHT.register(id, mRecord);
				return id;
			});
			pageHT.register(pageNo, recordIDs);
		},
		load : function (params, cbFn) {
			var self = this;
			self.updatePagerParams(params);
			var loginName = Hualala.getSessionData().user.loginName,
			    role = Hualala.getSessionData().user.role[0];
			var queryParams = _.extend(self.getPagerParams(),{loginName:loginName,role:role});
			self.callServer(queryParams, function (res) {
				if (res.resultcode == '000') {
					self.updateDataStore($XP(res, 'data.records', []), $XP(res, 'data.page.pageNo'));
					self.updatePagerParams($XP(res, 'data.page', {}));
					// self.updateItemDataStore($XP(res, 'data', {}));
				} else {
					topTip({
						msg : $XP(res, 'resultmsg', ''),
						type : 'danger'
					});
				}
				cbFn(self);
			});
		},
		getRecordsByPageNo : function (pageNo) {
			var self = this,
				recordHT = self.get('ds_record'),
				pageHT = self.get('ds_page');
			pageNo = !self.hasPager ? 1 : pageNo;
			var ret = _.map(recordHT.getByKeys(pageHT.get(pageNo)), function (mRecord, i, l) {
				return mRecord.getAll();
			});
			IX.Debug.info("DEBUG: Query Result Model PageData");
			IX.Debug.info(ret);
			return ret;
		},
		getRecordModelByID : function (id) {
			var self = this,
				recordHT = self.get('ds_record');
			return recordHT.get(id);
		}

	});

	HMCM.GiftMgrResultModel = GiftMgrResultModel;

	/**
	 * 礼品模型
	 * 
	 * 
	 */
	var BaseGiftModel = Stapes.subclass({
		constructor : function (gift) {
			this.set(gift);
			this.bindEvent();
		}
	});
	BaseGiftModel.proto({
		bindEvent : function () {
			var self = this;
			self.on({
				deleteItem : function (params) {
					var giftItemID = $XP(params, 'itemID');
					var successFn = $XF(params, 'successFn'),
						faildFn = $XF(params, 'faildFn');
					Hualala.Global.deleteMCMGift({
						giftItemID : giftItemID
					}, function (res) {
						if ($XP(res, 'resultcode') == '000') {
							successFn(res);
						} else {
							faildFn(res);
						}
					});
				},
				createGift : function (params) {
					var post = $XP(params, 'params', {}),
						successFn = $XF(params, 'successFn'),
						failFn = $XF(params, 'failFn');
					// save tmp data in model
					self.set(post);
					// Post Model Data Set to Server
					IX.Debug.info("DEBUG: Gift Wizard Form Post Params:");
                    var postData = IX.inherit({}, self.getAll());
                    IX.Debug.info(encodeTextareaItem(postData, 'giftRemark'));
                    //创建礼品
                    Hualala.Global.createMCMGift(encodeTextareaItem(postData, 'giftRemark'), function (res) {
						if ($XP(res, 'resultcode') == '000') {
							successFn(res);
						} else {
							failFn(res);
						}
					});
				},
				editGift : function (params) {
					var post = $XP(params, 'params', {}),
						successFn = $XF(params, 'successFn'),
						failFn = $XF(params, 'failFn');
					// save tmp data in model
					self.set(post);
					// Post Model Data Set to Server
					IX.Debug.info("DEBUG: Gift Wizard Form Post Params:");
					IX.Debug.info(self.getAll());
                    var postData = IX.inherit({}, self.getAll());
					Hualala.Global.editMCMGift(encodeTextareaItem(postData, 'giftRemark'), function (res) {
						if ($XP(res, 'resultcode') == '000') {
							successFn(res);
						} else {
							failFn(res);
						}
					});
				},
				saveCache : function (params) {
					var post = $XP(params, 'params', {}),
						successFn = $XF(params, 'successFn'),
						failFn = $XF(params, 'failFn');
					self.set(post);
					successFn(self);
				},
				bindShops : function (params) {
					var cities = $XP(params, 'cities', []),
						shops = $XP(params, 'shops', []);
					var shopIDs = _.pluck(shops, 'shopID'),
						shopNames = _.pluck(shops, 'shopName'),
						usingCityIDs = _.pluck(cities, 'cityID');
					this.set({
						shopIDs : shopIDs.join(';'),
						shopNames : shopNames.join(';'),
						usingCityIDs : usingCityIDs.join(';')
					});
				},
                getSmsSignName: function(params) {
                    HMCM.getSMSSign(params);
                }

			}, this);
		}
	});
	HMCM.BaseGiftModel = BaseGiftModel;

	/**
	 * 活动模型
	 * 
	 * 
	 */
	var BaseEventModel = Stapes.subclass({
		constructor : function (evt) {
			self.CardLevelIDSet = null;
			self.GroupSetting =null;
            self.SMSInfo = null;
			this.set(evt);
			this.bindEvent();
		}
	});
	BaseEventModel.proto({
		getEventCardSet : function () {
			var self = this;
			var eventTypes = Hualala.TypeDef.MCMDataSet.EventTypes;
			var eventCardSet = _.find(eventTypes, function (el) {
				return $XP(el, 'value') == self.get('eventWay');
			});
			return eventCardSet;
		},
		getEventCardClz : function () {
			var self = this;
			var eventTypes = Hualala.TypeDef.MCMDataSet.EventTypes;
			var eventTypeSet = _.find(eventTypes, function (el) {
				return $XP(el, 'value') == self.get('eventWay');
			});
			return $XP(eventTypeSet, 'type', '');
		},
		bindEvent : function () {
			var self = this;
			self.on({
				deleteItem : function (params) {
					var eventID = $XP(params, 'itemID');
					var successFn = $XF(params, 'successFn'),
						faildFn = $XF(params, 'faildFn');
					Hualala.Global.deleteMCMEvent({
						eventID : eventID
					}, function (res) {
						if ($XP(res, 'resultcode') == '000') {
							successFn(res);
						} else {
							faildFn(res);
						}
					});
				},
				switchEvent : function (params) {
					var post = $XP(params, 'post', {}),
						successFn = $XF(params, 'successFn'),
						faildFn = $XF(params, 'faildFn');
					Hualala.Global.switchMCMEvent(post, function (res) {
						if ($XP(res, 'resultcode') == '000') {
							self.set({
								isActive : $XP(post, 'isActive')
							});
							successFn(res);
						} else {
							faildFn(res);
						}
					});
				},
				updateEvent : function (params) {
					var successFn = $XF(params, 'successFn'),
						faildFn = $XF(params, 'faildFn');
					//------------------------------------------------------------------------------------------------@wxk
					Hualala.Global.getMCMEventByID({
						eventID : self.get('eventID')
					}, function (res) {
						if ($XP(res, 'resultcode') == '000') {
							var d = $XP(res, 'data.records')[0];
							self.set(d);
							successFn(res);
						} else {
							faildFn(res);
						}
					});
				},
				saveCache : function (params) {
					var post = $XP(params, 'params', {}),
						successFn = $XF(params, 'successFn'),
						failFn = $XF(params, 'failFn');
					self.set(post);
					successFn(self);
				},
				loadCardLevelIDs : function (params) {
					var successFn = $XF(params, 'successFn'),
						faildFn = $XF(params, 'faildFn');
					Hualala.Global.getVipLevels({isActive: '1'}, function (res) {
						if ($XP(res, 'resultcode') == '000') {
							self.CardLevelIDSet = $XP(res, 'data.records', []);
							successFn(res);
						} else {
							self.CardLevelIDSet = null;
							faildFn(res);
						}
					});
				},
				loadGroupSet : function (params) {
					var successFn = $XF(params, 'successFn'),
						faildFn = $XF(params, 'faildFn'),
						postData ={groupID:$XP(Hualala.getSessionSite(),'groupID','')};
					Hualala.Global.getGroupSetting(postData, function (res) {
						if ($XP(res, 'resultcode') == '000') {
							self.GroupSetting = $XP(res, 'data.records', []);
							successFn(res);
						} else {
							self.GroupSetting = null;
							faildFn(res);
						}
					});
				},
				loadSMSShops: function(params) {
					var successFn = $XF(params, 'successFn'),
						faildFn = $XF(params, 'faildFn'),
                        sessionUser = Hualala.getSessionUser(),
                        roleType = $XP(sessionUser, 'role', []).join(','),
                        accountID = $XP(sessionUser, 'accountID', '');
					Hualala.Global.getSMSShops({roleType: roleType, accountID: accountID}, function(rsp) {
						if(rsp.resultcode == '000'){
							successFn(rsp);
						} else {
							failFn(rsp);
						}
					});
				},
				createEvent : function (params) {
					var successFn = $XF(params, 'successFn'),
						faildFn = $XF(params, 'faildFn'),
                        postParams = IX.inherit({}, $XP(params, 'params'));
                        //------------------------------------------------------------------------------------------------------@wxk
                    Hualala.Global.createEvent(encodeTextareaItem(postParams, 'eventRemark'), function (res) {
						if ($XP(res, 'resultcode') == '000') {
							var d = $XP(res, 'data');
							self.set(d);
							successFn(res);
						} else {
							faildFn(res);
						}
					});

				},
				editEvent : function (params) {
					var successFn = $XF(params, 'successFn'),
						faildFn = $XF(params, 'faildFn');
					var setData = self.getAll(),
                        postParams = IX.inherit(setData, $XP(params, 'params'));
					Hualala.Global.editEvent(encodeTextareaItem(postParams, 'eventRemark'), function (res) {
						if ($XP(res, 'resultcode') == '000') {
							var d = $XP(res, 'data');
							self.set(d);
							successFn(res);
						} else {
							faildFn(res);
						}
					});
				},
				editSMS: function(params) {
					var successFn = $XF(params, 'successFn'),
						failFn = $XF(params, 'faildFn'),
						formParams = $XP(params, 'params', {});
					Hualala.Global.editSMSTemplate(formParams, function (rsp) {
						var smsEvt = $XP(rsp, 'data.records', []);
						if(rsp.resultcode == '000' && smsEvt.length > 0){
                            self.set(smsEvt[0]);
							successFn(rsp);
                        } else {
                            failFn(rsp);
                            Hualala.UI.TopTip({msg: rsp.resultmsg, type: 'danger'});
                        }
					});
				},
                getSmsSignName: function(params) {
                    HMCM.getSMSSign(params);
                }
			}, this);
		}
	});
	HMCM.BaseEventModel = BaseEventModel;
})(jQuery, window);
































