(function ($, window) {
	IX.ns("Hualala.Shop");
	var popoverMsg = Hualala.UI.PopoverMsgTip;
	var CardListView = Stapes.subclass({
		constructor : function () {
			// View层容器
			this.$container = null;
			// 结果容器
			this.$resultBox = null;
			// 结果列表
			this.$list = null;
			// 分页容器
			this.$pager = null;
			this.emptyBar = null;
			this.loadTemplates();
		}
	});
	CardListView.proto({
		init : function (cfg) {
			this.$container = $XP(cfg, 'container', null);
			this.model = $XP(cfg, 'model', null);
			if (!this.$container || !this.model) {
				throw("CardList View Init Failed!");
				return ;
			}
			this.initLayout();
		},
		initLayout : function () {
			var layoutTpl = this.get('layoutTpl');
			var htm = layoutTpl();
			this.$container.append(htm);
			this.$resultBox = this.$container.find('.shop-list');
			this.$list = this.$container.find('.shop-list-body');
			this.$pager = this.$container.find('.page-selection');
			this.initPager();
			this.bindEvent();
		},
		initPager : function (params) {
			var baseCfg = {
				total : 0,
				page : 1,
				maxVisible : 10,
				leaps : true
			};
			this.$pager.IXPager(IX.inherit(baseCfg, params));
		},
		bindEvent : function () {
			var self = this;
			self.$list.tooltip({
				selector : '[title]'
			});
			self.$list.on('click', '.btn[data-href]', function (e) {
				var $btn = $(this),
					path = $btn.attr('data-href');
				if (!IX.isEmpty(path)) {
					document.location.href = path;
				}
			});
			self.$pager.on('page', function (e, pageNo) {
				var params = self.model.getPagerParams();
				params['pageNo'] = pageNo;
				self.model.emit('load', IX.inherit(params, {
					pageNo : $XP(params, 'pageNo', 1),
					pageSize : $XP(params, 'pageSize', 15)
				}));
			});
		},
		// 加载View层所需模板
		loadTemplates : function () {
			var layoutTpl = Handlebars.compile(Hualala.TplLib.get('tpl_shop_list_layout')),
				listTpl = Handlebars.compile(Hualala.TplLib.get('tpl_shop_list')),
				itemTpl = Handlebars.compile(Hualala.TplLib.get('tpl_shop_card')),
				tagTpl = Handlebars.compile(Hualala.TplLib.get('tpl_shop_tags'));
			// 注册shopCard子模板
			Handlebars.registerPartial("shopTag", Hualala.TplLib.get('tpl_shop_tags'));
			Handlebars.registerPartial("shopCard", Hualala.TplLib.get('tpl_shop_card'));

			this.set({
				layoutTpl : layoutTpl,
				listTpl : listTpl,
				itemTpl : itemTpl,
				tagTpl : tagTpl
			});
		},
		// 组装标签
		mapTags : function (d) {
			var self = this,
				tagKeys = 'areaName,cuisineName1,cuisineName2'.split(',');
			var tags = _.map(tagKeys, function (k) {
				return $XP(d, k, null);
			});
			return _.filter(tags, function (t) {
				return !IX.isEmpty(t);
			});
		},
		// 格式化渲染数据
		mapRenderData : function (data) {
			var self = this;
			var getTags = function (tags) {
				return _.map(tags, function (t, i, l) {
					return {
						clz : 'label-info',
						tag : t
					};
				});
			};
			var ret = _.map(data, function (shop, i, l) {
				var address = $XP(shop, 'address', ''),
					byteLen = Hualala.Common.strByteLength(address),
					slugAddr = '';
				slugAddr = byteLen < 72 ? address : (Hualala.Common.substrByte(address, 70) + '...');
				return {
					clz : '',
					id : $XP(shop, 'shopID', ''),
					name : $XP(shop, 'shopName', ''),
					img : Hualala.Common.getSourceImage($XP(shop, 'imagePath', ''), {
						width : 100,
						height : 100,
						quality : 50
					}),
					// tags : getTags($XP(shop, 'tags', [])),
					tags : getTags(self.mapTags(shop)),
					address : address,
					slugAddr : slugAddr,
					tel : $XP(shop, 'tel', ''),
					shopID : $XP(shop, 'shopID', ''),
					infoHref : Hualala.PageRoute.createPath('shopInfo', [$XP(shop, 'shopID', '')]),
					menuHref : Hualala.PageRoute.createPath('shopMenu', [$XP(shop, 'shopID', '')]),
					checked : $XP(shop, 'status') == 1 ? 'checked' : ''
				};
			});
			return {
				shopCard : {
					list : ret
				}
			};
		},
		// 渲染开关
		initSwitcher : function (selector) {
			var self = this;
			self.$list.find(selector).bootstrapSwitch({
				// baseClass : 'ix-bs-switch',
				// wrapperClass : 'ix-bs-switch-wrapper',
				size : 'normal',
				onColor : 'success',
				offColor : 'default',
				onText : '已开通',
				offText : '未开通'
			});
			// 绑定开关事件
			self.$list.find(selector).on('switchChange.bootstrapSwitch', function (e, state) {
				var $chkbox = $(this),
					shopID = $chkbox.attr('data-shop'),
					state = !state ? 0 : 1;
				Hualala.UI.Confirm({
					title : (state == 1 ? "开启" : "关闭") + "店铺",
					msg : "你确定要" + (state == 1 ? "开启" : "关闭") + "店铺？",
					okFn : function () {
						self.model.updateShopStatus(shopID, state, function (_shopID) {
							self.$list.find(selector).filter('[data-shop=' + _shopID + ']').bootstrapSwitch('toggleState', true);
						}, function (_shopID) {
							
						});
					},
					cancelFn : function () {
						self.$list.find(selector).filter('[data-shop=' + shopID + ']').bootstrapSwitch('toggleState', true);
					}
				});
			});
		},
		// 渲染view
		render : function () {
			var self = this,
				model = self.model,
				pagerParams = model.getPagerParams(),
				pageNo = $XP(pagerParams, 'pageNo');
			var shops = model.getShops(pageNo);
			var renderData = self.mapRenderData(shops);
			var listTpl = self.get('listTpl');
			var html = listTpl(renderData);
			self.emptyBar && self.emptyBar.destroy();
			self.$list.empty();
			if (shops.length == 0) {
				self.emptyBar = new Hualala.UI.EmptyPlaceholder({
					container : self.$list
				});
				self.emptyBar.show();
			} else {
				self.$list.html(html);
			}
			
			self.initPager({
				total : model.get('pageCount'),
				page : model.get('pageNo'),
				href : 'javascript:void(0);'
			});
			// self.$list.find(':checkbox[name*=switcher_]').bootstrapSwitch();
			self.initSwitcher(':checkbox[name=switcher]');
		}
	});

	Hualala.Shop.CardListView = CardListView;

	var ShopListView = CardListView.subclass({
		constructor : function () {
			// View层容器
			this.$container = null;
			// 结果容器
			this.$resultBox = null;
			// 结果列表
			this.$list = null;
			// 分页容器
			this.$pager = null;
			this.emptyBar = null;
			// 开关相关提示消息
			this.shopBusinessSwitcherTipHT = new IX.IListManager();
			this.loadTemplates();
			this.initShopBusinessSwitcherTips();
		}
	});
	ShopListView.proto({
		bindEvent : function () {
			var self = this;
			self.$list.tooltip({
				selector : '[title]'
			});
			self.$pager.on('page', function (e, pageNo) {
				var params = self.model.getPagerParams();
				params['pageNo'] = pageNo;
				self.model.emit('load', IX.inherit(params, {
					pageNo : $XP(params, 'pageNo', 1),
					pageSize : $XP(params, 'pageSize', 15)
				}));
			});
			// 弹出修改业务窗口
			self.$list.on('click', '.btn[data-business]', function (e) {
				var $btn = $(this),
					shopID = $btn.attr('data-shop'),
					mShop = self.model.getShopModelByShopID(shopID),
					businessName = $btn.attr('data-business'),
					businessID = $btn.attr('data-business-id'),
					serviceFeatures = mShop.get('serviceFeatures');
				self.initBusinessModal($btn, shopID, businessName, businessID, serviceFeatures);
			});
			self.$list.on('click','.dowloadhref',function (e){
				var $btn = $(this),
					shopID = $btn.attr('data-shop'),
					mShop = self.model.getShopModelByShopID(shopID),
					businessID = $btn.attr('data-business-id');
					size="200",
					isdownloading = false;

				var btnName = $btn.attr("name");
				var params ={shopID:shopID,size:size};
				if(btnName=="QRcode"||btnName=="21QRcode"){//桌台二维码下载

					
					//普通二维码
					if(btnName == 'QRcode' && !isdownloading) {

						Hualala.UI.TopTip({msg: "下载中，请稍等...", type: 'success'});
						isdownloading = true;
						$btn.text('二维码生成中...').parent('li').toggleClass('disabled',isdownloading);
						Hualala.Global.getQRcode(params, function (rsp) {
		                    if(rsp.resultcode != '000'){
		                        rsp.resultmsg && Hualala.UI.TopTip({msg: rsp.resultmsg, type: 'danger'});
		                        isdownloading = false;
		                        $btn.text('普通二维码').parent('li').toggleClass('disabled',isdownloading);
		                        return;
		                    }
		                	var dowloadhref =rsp.data.zipAddr || [];
							Hualala.Common.fileDownload(dowloadhref);
							isdownloading = false;
							$btn.text('普通二维码').parent('li').toggleClass('disabled',isdownloading);
		                });

					}else if(!isdownloading){
						//微信二维码
						//step1:检测是否有微信二维码
						isdownloading = true;//进入下载状态
						$btn.text('二维码生成中...0%').parent('li').toggleClass('disabled',isdownloading);
						Hualala.Global.produceWxTableQrcode(params,function(rsp){
							
							if(rsp.resultcode != '000'){
								//fail
		                        rsp.resultmsg && Hualala.UI.TopTip({msg: rsp.resultmsg, type: 'danger'});
		                        isdownloading = false;//退出下载状态
		                        $btn.text('二码合一二维码').parent('li').toggleClass('disabled',isdownloading);
		                        return;
		                    }else{
		                    	//success step2: 轮询
		                    	Hualala.UI.TopTip({msg: "下载中，请稍等...", type: 'success'});
		                    	var timer = window.setInterval(function(){
		                    		Hualala.Global.QryWxTblCodeProduceProgress(params,function(rsp){
		                    			//fail
		                    			if(rsp.resultcode != '000'){
		                    				isdownloading = false;
		                    				$btn.text('二码合一二维码').parent('li').toggleClass('disabled',isdownloading);
		                    			    rsp.resultmsg && Hualala.UI.TopTip({msg: rsp.resultmsg, type: 'danger'});
		                    			    window.clearInterval(timer);
		                    			    return;
		                    			}else if(rsp.data.totalCount == rsp.data.finishedCount){
		                    				window.clearInterval(timer);
		                    				//success step3:下载二维码
		                    				Hualala.Global.get21QRcode(params,function(rsp){
		                    					if(rsp.resultcode != '000'){
		                    					    rsp.resultmsg && Hualala.UI.TopTip({msg: rsp.resultmsg, type: 'danger'});
		                    					    isdownloading = false;
		                    					    $btn.text('二码合一二维码').parent('li').toggleClass('disabled',isdownloading);
		                    					    return;
		                    					}
		                    					$btn.text('二维码生成中...100%');
		                    					window.setTimeout(function(){
		                    						isdownloading = false;
		                    						$btn.text('二码合一二维码').parent('li').toggleClass('disabled',isdownloading);
		                    					},1000);
		                    					
        					                	var dowloadhref =rsp.data.zipAddr || [];
        										Hualala.Common.fileDownload(dowloadhref);
		                    				});
		                    				return;
		                    			}else{
		                    				var finish_persent = (rsp.data.finishedCount/rsp.data.totalCount).toFixed(2); 
		                    					$btn.text('二维码生成中...'+finish_persent*100+'%');
		                    			}
		                    		});
		                    	},1000);
		                    }
						});
					}//else
				}//if

				else{
					Hualala.Global.getEmpQRcode(params, function (rsp) {
	                    if(rsp.resultcode != '000'){
	                        rsp.resultmsg && Hualala.UI.TopTip({msg: rsp.resultmsg, type: 'danger'});
	                        return;
	                    }
	                	var Address =rsp.data.zipAddr || [];
						Hualala.Common.fileDownload(Address);
	                });
				}
			});
			self.$list.on('click', '.bind-settle', function (e) {
				var $btn = $(this),
					settleID = $btn.attr('data-id'),
					shopID = $btn.attr('data-shop');
				self.initBindSettleModal($btn, settleID, shopID);
			});
		},
		// 加载店铺业务开关相关的提示消息
		initShopBusinessSwitcherTips : function () {
			var self = this,
				tips = Hualala.TypeDef.ShopBusinessSwitcherTips;
			_.each(tips, function (tip) {
				var name = $XP(tip, 'name');
				self.shopBusinessSwitcherTipHT.register(name, tip);
			});
		},
		// 通过名字获取店铺业务开关相关提示信息
		getBusinessSwitcherTipsByName : function (name) {
			var self = this,
				ht = self.shopBusinessSwitcherTipHT;
			return ht.get(name);
		},
		// 加载View层所需模板
		loadTemplates : function () {
			var layoutTpl = Handlebars.compile(Hualala.TplLib.get('tpl_shop_list_layout')),
				listTpl = Handlebars.compile(Hualala.TplLib.get('tpl_shop_list')),
				itemTpl = Handlebars.compile(Hualala.TplLib.get('tpl_shop_list_item')),
				tagTpl = Handlebars.compile(Hualala.TplLib.get('tpl_shop_tags'));
			// 注册shopCard子模板
			Handlebars.registerPartial("shopTag", Hualala.TplLib.get('tpl_shop_tags'));
			Handlebars.registerPartial("shopItem", Hualala.TplLib.get('tpl_shop_list_item'));

			this.set({
				layoutTpl : layoutTpl,
				listTpl : listTpl,
				itemTpl : itemTpl,
				tagTpl : tagTpl
			});
		},
		/**
		 * 获取店铺业务描述信息
		 * @param  {Int} businessID    业务ID(10:常规预订,11:闪吃,20:外送,21:到店自提,41:堂食自助)
		 * @param  {Int} operationMode 餐厅运营模式 0：正餐；1：正餐
		 * @param  {Object} businessInfo  业务配置信息
		 * @param {String} businessName 业务名称
		 * @param {String} ShopID 店铺ID
		 * @return {String}               业务配置描述
		 */
		getBusinessDesc : function (businessID, operationMode, businessInfo, businessName, shopID) {
			var self = this;
			var tpl = null, renderKeys = null, params = null, htm = '';
			var minuteIntervalOpts = Hualala.TypeDef.MinuteIntervalOptions();
			var getMinutIntervalLabel = function (v) {
				var m = _.find(minuteIntervalOpts, function (el, i) {
					return $XP(el, 'value') == v;
				});
				return $XP(m, 'label', '');
			};
			var businessStatus = self.getBusinessSwitcherStatus(shopID, businessName),
				businessDesc = $XP(self.getBusinessSwitcherTipsByName(businessName), 'desc', '');
			switch(businessID) {
				// 常规预订点菜
				case 10:
					tpl = Handlebars.compile(Hualala.TplLib.get('tpl_shop_commonreserve_desc'));
					renderKeys = 'advanceTime,noticeTime,minAmount,reserveTableTime,reserveTableDesc,payMethod'.split(',');
					params = _.map(renderKeys, function (k) {
						var r = $XP(businessInfo, k, '');
						switch(k) {
							case "advanceTime":
								r = IX.isEmpty(r) || r == 0 ? '不限制顾客提前预订时间, ' : ('顾客需提前' + r + '分钟预订, ');
								break;
							case "noticeTime":
								r = IX.isEmpty(r) || r == 0 ? '订单立即通知餐厅, ' : ('订单提前' + getMinutIntervalLabel(r) + '通知餐厅, ');
								break;
							case "minAmount":
								r = IX.isEmpty(r) || r == 0 ? '' : ('最低消费' + r + Hualala.Constants.CashUnit + ', ');
								break;
							case "reserveTableTime":
								r = IX.isEmpty(r) || r == 0 ? '' : ('留位' + getMinutIntervalLabel(r) + ', ');
								break;
							case "reserveTableDesc":
								r = IX.isEmpty(r) ? '' : r + ',';
								break;
							case "payMethod":
								r = (r == 0 ? '仅支持在线支付' : (r == 1 ? '仅支持线下支付' : '线上及线下支付均支持')) + ', ';
								break;
						}
						return r;
					});
					break;
				// 闪吃描述
				case 11:
					tpl = Handlebars.compile(Hualala.TplLib.get('tpl_shop_justeat_desc'));
					renderKeys = 'servicePeriods,holidayFlag,minAmount,advanceTime,noticeTime,reserveTableTime,reserveTableDesc,payMethod'.split(',');
					params = _.map(renderKeys, function (k) {
						var r = $XP(businessInfo, k, '');
						switch(k) {
							case "servicePeriods" :
								r = '开放时间段：' + r.replace(/,/g, '-').replace(/([\d]{2})([\d]{2})/g, '$1:$2') + ', ';
								break;
							case "holidayFlag" : 
								r = (r == 0 ? '工作日及节假日均开放' : (r == 1 ? '仅节假日开放' : '仅工作日开放')) + ', ';
								break;
							case "minAmount" : 
								r = IX.isEmpty(r) || r == 0 ? '' : ('最低消费' + r + Hualala.Constants.CashUnit + ', ');
								break;
							case "advanceTime" : 
								r = IX.isEmpty(r) || r == 0 ? '不限制顾客提前预订时间, ' : ('顾客需提前' + r + '分钟预订, ');
								break;
							case "noticeTime" : 
								r = IX.isEmpty(r) || r == 0 ? '订单立即通知餐厅, ' : ('订单提前' + getMinutIntervalLabel(r) + '通知餐厅, ');
								break;
							case "reserveTableTime" : 
								r = IX.isEmpty(r) || r == 0 ? '' : ('留位' + getMinutIntervalLabel(r) + ', ');
								break;
							case "reserveTableDesc" : 
								r = IX.isEmpty(r) ? '' : r + ',';
								break;
							case "payMethod":
								r = (r == 0 ? '仅支持在线支付' : (r == 1 ? '仅支持线下支付' : '线上及线下支付均支持')) + ', ';
								break;
						}
						return r;
					});
					break;
				// 堂食自助描述
				case 41:
					tpl = Handlebars.compile(Hualala.TplLib.get('tpl_shop_spotorder_desc'));
					renderKeys = operationMode == 0 ?
						// 'isDinner,supportCommitToSoftware,payMethodAtShop,payBeforeCommit'.split(',') :
						'isDinner,supportCommitToSoftware,checkSpotOrder,payBeforeCommit'.split(',') :
						'isDinner,supportCommitToSoftware,fetchFoodMode'.split(',');
					params = _.map(renderKeys, function (k) {
						var r = $XP(businessInfo, k, '');
						switch(k) {
							case "isDinner":
								r = operationMode == 0 ? true : false;
								break;
							case "supportCommitToSoftware":
								if (IX.isEmpty(r)) {
									r = '支持下单到餐饮软件, ';
								} else {
									r = (r == 1 ? '支持' : '不支持') + '下单到餐饮软件, ';
								}
								break;
							case "fetchFoodMode":
								r = '下单后' + (r == 1 ? '凭牌号' : (r == 2 ? '直接' : '凭流水号')) + '在收银台取餐, ';
								break;
							case "checkSpotOrder":
								r = (r == 1 ? '支持' : '不支持') + '顾客通过手机结账, ';
								break;
							case "payMethodAtShop":
								r = (r == 1 ? '餐前先通过手机结账' : (r == 2 ? '餐后可通过手机结账' : '不能用手机结账')) + ', ';
								break;
							case "payBeforeCommit":
								// r = r == 1 ? '支付完成后才能下单, ' : '';
								r = (r == 1 ? '餐前' : '餐后') + '结账, ';
								break;
						}
						return r;
					});
					break;
				// 外卖
				case 20:
					tpl = Handlebars.compile(Hualala.TplLib.get('tpl_shop_takeaway_desc'));
					renderKeys = 'servicePeriods,holidayFlag,noticeTime,advanceTime,minAmount,serviceAmount,freeServiceAmount,takeawayScope,payMethod'.split(',');
					params = _.map(renderKeys, function (k) {
						var r = $XP(businessInfo, k, '');
						switch(k) {
							case "servicePeriods" :
								r = '开放时间段：' + r.replace(/,/g, '-').replace(/([\d]{2})([\d]{2})/g, '$1:$2') + ', ';
								break;
							case "holidayFlag" : 
								r = (r == 0 ? '工作日及节假日均开放' : (r == 1 ? '仅节假日开放' : '仅工作日开放')) + ', ';
								break;
							case "noticeTime" : 
								r = IX.isEmpty(r) || r == 0 ? '订单立即通知餐厅, ' : ('订单提前' + r + '分钟通知餐厅, ');
								break;
							case "advanceTime" :
								r = IX.isEmpty(r) || r == 0 ? '立即送达, ' : ('预计' + r + '分钟送达, ');
								break;
							case "minAmount":
								r = (IX.isEmpty(r) || r == 0 ? 0 : r) + '元起送, ';
								break;
							case "serviceAmount" :
								r = IX.isEmpty(r) || r == 0 ? '免费送餐, ' : (r + '元送餐费');
								break;
							case "freeServiceAmount" :
								r = IX.isEmpty(r) || r == 0 ? '' : ('(满' + r + '元免送餐费), ');
								break;
							case "takeawayScope" :
								r = IX.isEmpty(r) || r == 0 ? '' : ('送餐范围' + r + '公里, ');
								break;
							case "payMethod":
								r = (r == 0 ? '仅支持在线支付' : (r == 1 ? '仅支持线下支付' : '线上及线下支付均支持')) + ', ';
								break;
						}
						return r;
					});
					break;
				// 自提
				case 21:
					tpl = Handlebars.compile(Hualala.TplLib.get('tpl_shop_takeout_desc'));
					renderKeys = 'servicePeriods,holidayFlag,advanceTime,noticeTime,minAmount,payMethod'.split(',');
					params = _.map(renderKeys, function (k) {
						var r = $XP(businessInfo, k, '');
						switch(k) {
							case "servicePeriods" :
								r = '开放时间段：' + r.replace(/,/g, '-').replace(/([\d]{2})([\d]{2})/g, '$1:$2') + ', ';
								break;
							case "holidayFlag" : 
								r = (r == 0 ? '工作日及节假日均开放' : (r == 1 ? '仅节假日开放' : '仅工作日开放')) + ', ';
								break;
							case "advanceTime":
								r = IX.isEmpty(r) || r == 0 ? '不限制顾客提前预订时间, ' : ('顾客需提前' + r + '分钟预订, ');
								break;
							case "noticeTime" : 
								r = IX.isEmpty(r) || r == 0 ? '订单立即通知餐厅, ' : ('订单提前' + getMinutIntervalLabel(r) + '通知餐厅, ');
								break;
							case "minAmount" : 
								r = IX.isEmpty(r) || r == 0 ? '' : ('最低消费' + r + Hualala.Constants.CashUnit + ', ');
								break;
							case "payMethod":
								r = (r == 0 ? '仅支持在线支付' : (r == 1 ? '仅支持线下支付' : '线上及线下支付均支持')) + ', ';
								break;
						}
						return r;
					});
					break;
				// 打赏
				case 91:
					tpl = Handlebars.compile(Hualala.TplLib.get('tpl_shop_empreward_desc'));
					renderKeys = 'rewardType,rewardGiftValue_1,rewardGiftValue_2,rewardGiftValue_3,rewardRandValue,eventID'.split(',');
					params = _.map(renderKeys, function(k) {
						var r = $XP(businessInfo, k, '');
						switch(k) {
							case "rewardType" : 
								r = '打赏方式：' + (r == 1 ? '固定金额' : (r == 0 ? '随机金额' : '两种方式都有')) + ', ';
								break;
							case "rewardGiftValue_1" : 
								r = (+r > 0) ? '固定金额：一档' + r.replace(/\.[0]*$/gi, '') + '元, ' : '';
								break;
							case "rewardGiftValue_2" : 
								r = (+r > 0) ? '二档' + r.replace(/\.[0]*$/gi, '') + '元, ' : '';
								break;
							case "rewardGiftValue_3" :
								r = (+r > 0) ? '三档' + r.replace(/\.[0]*$/gi, '') + '元, ' : '';
								break;
							case "rewardRandValue" : 
								r = r.split('\,');
								r = (+r[1] > 0) ? '随机金额：' + r[0] + '元到' + r[1] + '元, ' : '';
								break;
							case "eventID" : 
								r = '打赏后' + (r != 0 ? ('参与“' + $XP(businessInfo, 'eventName', '') +'”活动') : '不参与活动') + ', ';
								break;
						}
						return r;
					});
					break;
			}
			if (businessID == 11 || businessID == 41 || businessID == 10 || businessID == 20 || businessID == 21 || businessID == 91) {
				htm = tpl(_.object(renderKeys, params));
				htm = htm.slice(0, htm.lastIndexOf(','));
				htm = businessStatus == 1 ? htm : businessDesc;
			} else {
				htm = businessDesc;
			}

			return htm;
		},
		// 获取店铺业务状态
		// @param name 店铺业务名称
		getBusinessSwitcherStatus : function (shopID, name) {
			var self = this,
				mShop = self.model.getShopModelByShopID(shopID);
			var serviceFeatures = mShop.get('serviceFeatures') || '';
			return serviceFeatures.indexOf(name) >= 0 ? 1 : 0;
		},
		// 获取店铺业务信息数据
		getShopBusiness : function (shop) {
			var self = this;
			var business = Hualala.TypeDef.ShopBusiness,
				businessHT = new IX.IListManager(),
				shopID = $XP(shop, 'shopID'),
				serviceFeatures = $XP(shop, 'serviceFeatures', ''),
				// businessCfg = JSON.parse($XP(shop, 'revParamJson', {})),
				businessCfg = null,
				revParamJson = $XP(shop, 'revParamJson', null),
				takeawayParamJson = $XP(shop, 'takeawayParamJson', null),
				rewardDetailJson = $XP(shop, 'rewardDetailJson', null);
			revParamJson = !revParamJson ? {} : JSON.parse(revParamJson);
			takeawayParamJson = !takeawayParamJson ? {} : JSON.parse(takeawayParamJson);
			rewardDetailJson = !rewardDetailJson ? {} : JSON.parse(rewardDetailJson);
			businessCfg = IX.inherit(revParamJson, takeawayParamJson, rewardDetailJson);
			var ret = null;
			_.each(business, function (item, i, l) {
				var id = $XP(item, 'id'), name = $XP(item, 'name'),
					switcherStatus = self.getBusinessSwitcherStatus(shopID, name),
					businessInfo = $XP(businessCfg, id.toString(), {}),
					operationMode = $XP(shop, 'operationMode', null);
				if (id == '41') {
					businessInfo = IX.inherit(businessInfo, {
						checkSpotOrder : serviceFeatures.indexOf('spot_pay') >= 0 ? 1 : 0
					});
				}
				var ret = IX.inherit(item, businessInfo, {
					switcherStatus : switcherStatus,
					shopID : shopID,
					desc : self.getBusinessDesc(id, operationMode, businessInfo, name, shopID)
				});
				businessHT.register(name, ret);
			});
			ret = _.filter(businessHT.getAll(), function (el) {
				return $XP(el, 'businessIsSupported', false) == true;
			});
			return ret;
		},
		// 获取店铺业务信息渲染数据
		mapBusinessRenderData : function (shop) {
			var self = this,
				data = self.getShopBusiness(shop);
			return _.map(data, function (el) {
				var name = $XP(el, 'name'),
					icon = 'icon-' + name,
					switcherName = 'switcher_business',
					open = $XP(el, 'switcherStatus') == 1 ? 'checked' : '';
				return {
					icon : icon,
					label : $XP(el, 'label'),
					switcherName : switcherName,
					shopID : $XP(el, 'shopID'),
					type : name,
					id : $XP(el, 'id'),
					open : open,
					desc : $XP(el, 'desc', ''),
					serviceFeatures : $XP(shop, 'serviceFeatures', ''),
					hideBtn : (name == 'bi' || name == 'crm' ||name=="saas") ? 'disabled hidden' : '',
					hide :(name!='spot_order') ?'disabled hidden':'',
					hideEmp:(name!='emp_reward') ?'disabled hidden':''
				};
			});
		},
		// 校验是否有财务或更高权限
		chkHasAccountRole : function () {
			var loginUsr = Hualala.getSessionUser(),
				usrRoles = $XP(loginUsr, 'role');
				roles = Hualala.TypeDef.SiteRoleType;
			var ret = _.find(roles, function (role) {
				var roleType = $XP(role, 'roleType');
				var matchedID = _.find(usrRoles, function (v) {
					return $XP(role, 'roleType') == v;
				});
				return !!matchedID && (roleType != 'manager');
			});
			return !!ret;
		},
		// 格式化渲染数据
		mapRenderData : function (data) {
			var self = this;
			var ret = _.map(data, function (shop, i, l) {
				var settleUnitID = $XP(shop, 'settleID', '');
				return {
					clz : '',
					shopID : $XP(shop, 'shopID', ''),
					shopName : $XP(shop, 'shopName', ''),
					hideAccount : self.chkHasAccountRole() ? true : false,
					settleID : settleUnitID,
					settleName : $XP(shop, 'settleName', ''),
					btn : {
						clz : 'bind-settle',
						label : (IX.isEmpty(settleUnitID) || settleUnitID == 0) ? '绑定结算账户' : '修改'
					},
					switcherName : 'switcher_status',
					shopOpen : $XP(shop, 'status') == 1 ? 'checked' : '',
					business : self.mapBusinessRenderData(shop)
				}
			});
			return {
				shopItem : {
					list : ret
				}
			};
		},
		// 渲染开关
		initSwitcher : function (switcherName) {
			var self = this;
			var $switchers = self.$list.find(':checkbox[name=' + switcherName + ']');
			var changeSubSwitchersStatus = function () {
				$switchers.each(function (idx, el) {
					var $el = $(el),
						shopID = $el.attr('data-shop'),
						$parentSwitcher = $(':checkbox[name=switcher_status][data-shop=' + shopID + ']'),
						checked = $parentSwitcher[0].checked;
					$el.bootstrapSwitch('disabled', !checked ? true : false);
				});
			};
			$switchers.bootstrapSwitch({
				// baseClass : 'ix-bs-switch',
				// wrapperClass : 'ix-bs-switch-wrapper',
				size : 'normal',
				onColor : switcherName == 'switcher_business' ? 'primary' : 'success',
				offColor : 'default',
				onText : '已开通',
				offText : '未开通'
			});
			if (switcherName == 'switcher_business') {
				changeSubSwitchersStatus();
			}
			$switchers.on('switchChange.bootstrapSwitch', function (e, state) {
				var $chkbox = $(this), name = $chkbox.attr('name'), shopID = $chkbox.attr('data-shop'),
					state = !state ? 0 : 1, business = $chkbox.attr('data-business'), businessID = $chkbox.attr('data-business-id');
				if (name == 'switcher_status') {
					Hualala.UI.Confirm({
						title : (state == 1 ? "开启" : "关闭") + "店铺",
						msg : "你确定要" + (state == 1 ? "开启" : "关闭") + "店铺？",
						okFn : function () {
							self.model.updateShopStatus(shopID, state, function (_shopID) {
								var $switcherEl = self.$list.find(':checkbox[name=' + switcherName + ']').filter('[data-shop=' + _shopID + ']'),
									$subSwitchers = self.$list.find(':checkbox[name=switcher_business]').filter('[data-shop=' + _shopID + ']');
								$switcherEl.bootstrapSwitch('toggleState', true);
								$subSwitchers.bootstrapSwitch('disabled', state == 0 ? false : true);
							}, function (_shopID) {
								var $switcherEl = self.$list.find(':checkbox[name=' + switcherName + ']').filter('[data-shop=' + _shopID + ']'),
									$subSwitchers = self.$list.find(':checkbox[name=switcher_business]').filter('[data-shop=' + _shopID + ']');
								$subSwitchers.bootstrapSwitch('disabled', state == 0 ? true : false);
							});
						},
						cancelFn : function () {
							$chkbox.bootstrapSwitch('toggleState', true);
						}
					});
					
				} else {
					var businessSwitcherTip = self.getBusinessSwitcherTipsByName(business),
						title = (state == 1 ? '开启' : '关闭') + $XP(businessSwitcherTip, 'title', ''),
						msg = $XP(businessSwitcherTip, (state == 1 ? 'switchOn' : 'switchOff'), '');
					Hualala.UI.Confirm({
						title : title,
						msg : msg,
						// okLabel : '',
						okFn : function () {
							self.model.updateShopBusinessStatus({
								shopID : shopID,
								name : business,
								id : businessID,
								status : state
							}, function (params) {
								self.$list.find(':checkbox[name=' + switcherName + ']').filter('[data-shop=' + $XP(params, 'shopID') + '][data-business-id=' + $XP(params, 'id') + ']')
									.bootstrapSwitch('toggleState', true);
							}, function (params) {
								var mShop = $XP(params, 'mShop'), serviceID = $XP(params, 'id'), businessName = $XP(params, 'name'),
									shop = mShop.getAll(), businessData = self.getShopBusiness(shop);
								var curBusinessData = _.find(businessData, function (el) {return el.name == businessName;});
								var desc = $XP(curBusinessData, 'desc', '');

								$chkbox.parents('.shop-business').find('.desc').html(desc);
							});
						},
						cancelFn : function () {
							$chkbox.bootstrapSwitch('toggleState', true);
						}
					});
					
				}
			});

		},
		// 渲染开关
		// initSwitcher : function (selector) {
		// 	var self = this;
		// 	self.$list.find(selector).bootstrapSwitch({
		// 		// baseClass : 'ix-bs-switch',
		// 		// wrapperClass : 'ix-bs-switch-wrapper',
		// 		size : 'normal',
		// 		onColor : selector == ':checkbox[name=switcher_business]' ? 'primary' : 'success',
		// 		offColor : 'default',
		// 		onText : '已开通',
		// 		offText : '未开通'
		// 	});
		// 	// 绑定开关事件
		// 	self.$list.find(selector).on('switchChange.bootstrapSwitch', function (e, state) {
		// 		var $chkbox = $(this),
		// 			name = $chkbox.attr('name'),
		// 			shopID = $chkbox.attr('data-shop'),
		// 			state = !state ? 0 : 1,
		// 			business = $chkbox.attr('data-business'),
		// 			businessID = $chkbox.attr('data-business-id');
		// 		if (name == 'switcher_status') {
		// 			self.model.updateShopStatus(shopID, state, function (_shopID) {
		// 				self.$list.find(selector).filter('[data-shop=' + _shopID + ']').bootstrapSwitch('toggleState', true);
		// 			});
		// 		} else {
		// 			self.model.updateShopBusinessStatus({
		// 				shopID : shopID,
		// 				name : business,
		// 				id : businessID,
		// 				status : state
		// 			}, function (params) {
		// 				self.$list.find(selector).filter('[data-shop=' + $XP(params, 'shopID') + '][data-business-id=' + $XP(params, 'id') + ']')
		// 					.bootstrapSwitch('toggleState', true);
		// 			});
		// 		}
				
		// 	});
		// },
		// 渲染view
		render : function () {
			var self = this,
				model = self.model,
				pagerParams = model.getPagerParams(),
				pageNo = $XP(pagerParams, 'pageNo');
			var shops = model.getShops(pageNo);
			var renderData = self.mapRenderData(shops);
			var listTpl = self.get('listTpl');
			var html = listTpl(renderData);
			self.emptyBar && self.emptyBar.destroy();
			self.$list.empty();
			if (shops.length == 0) {
				self.emptyBar = new Hualala.UI.EmptyPlaceholder({
					container : self.$list
				});
				self.emptyBar.show();
			} else {
				self.$list.html(html);
			}
			
			self.initPager({
				total : model.get('pageCount'),
				page : model.get('pageNo'),
				href : 'javascript:void(0);'
			});
			// self.$list.find(':checkbox[name*=switcher_]').bootstrapSwitch();
			// self.initSwitcher(':checkbox[name=switcher_business]');
			// self.initSwitcher(':checkbox[name=switcher_status]');
			self.initSwitcher('switcher_business');
			self.initSwitcher('switcher_status');
		},
		// 生成业务编辑窗口
		initBusinessModal : function (trigger, shopID, name, id, serviceFeatures) {
			var self = this;
			var editView = new Hualala.Setting.editServiceView({
				triggerEl : trigger,
				serviceID : id,
				serviceName : name,
				serviceFeatures : serviceFeatures,
				model : self.model.getShopModelByShopID(shopID),
				successFn : function (mShop, serviceID, businessInfo, $trigger) {
					var operationMode = mShop.get('operationMode'),
						businessName = $trigger.attr('data-business'),
						shopID = $trigger.attr('data-shop'),
						desc = self.getBusinessDesc(parseInt(serviceID), operationMode, businessInfo, businessName, shopID);

					$trigger.parents('.shop-business').find('.desc').html(desc);

				}
			});
		},
		// 生成绑定结算账号窗口
		initBindSettleModal : function (trigger, settleID, shopID) {
			var self = this;
			var view = new Hualala.Setting.bindSettleUnitView({
				triggerEl : trigger,
				settleID : settleID,
				model : self.model.getShopModelByShopID(shopID),
				successFn : function (mShop, $trigger, settleInfo) {
					var settleUnitID = $XP(settleInfo, 'settleUnitID'),
						settleUnitName = $XP(settleInfo, 'settleUnitName', '');
						bindOperateName=(settleUnitID!= undefined && settleUnitID.length!=0)? '修改' : '绑定结算账户';
					$trigger.attr('data-id', settleUnitID);
					$trigger.parent().find('.account-name').html(settleUnitName);
					$trigger.parent().find('.bind-settle').html(bindOperateName);
					mShop.set({
						settleID : settleUnitID,
						settleName : settleUnitName
					})
				}
			});
		}
	});
	Hualala.Shop.ShopListView = ShopListView;
})(jQuery, window);