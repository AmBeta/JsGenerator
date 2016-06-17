(function ($, window) {
	IX.ns("Hualala.Order");
	var popoverMsg = Hualala.UI.PopoverMsgTip;
	var toptip = Hualala.UI.TopTip;

	Hualala.Order.initQueryParams = function () {
		var ctx = Hualala.PageRoute.getPageContextByPath();
		var self = this;
		var queryVals = $XP(ctx, 'params', []);
		var queryKeys = self.queryKeys;
		var getParamsObj = function(keys, vals) {
			if (keys.length === vals.length) {
				return _.object(keys, vals);
			}
			var sIndex = _.indexOf(keys, 'startDateorderformat');
			var eIndex = _.indexOf(keys, 'endDateorderformat');
			if (sIndex < 0 || eIndex < 0) {
				throw('Init Query Params Failed!');
				return;
			}
			vals.splice(sIndex, 0, vals[sIndex-1] + '0000')
			vals.splice(eIndex, 0, vals[eIndex-1] + '2359');
			return _.object(keys, vals);
		}
		self.set(getParamsObj(queryKeys, queryVals));
	};

	var QueryModel = Hualala.Shop.QueryModel.subclass({
		/**
		 * 构造订单搜索数据模型
		 * @param  {Object} cfg
		 * 			@param {Array} queryKeys 搜索字段
		 * 			@param {Function} initQueryParams 初始化搜索字段方法
		 * 			
		 * @return {Object}
		 */
		constructor : function (cfg) {
			// 原始数据
			this.origCities = [];
			this.origAreas = [];
			this.origShops = [];
			this.queryKeys = $XP(cfg, 'queryKeys', []);
			// 数据是否已经加载完毕
			this.isReady = false;
			this.callServer = Hualala.Global.getShopQuerySchema;
			var initQueryParams = $XF(cfg, 'initQueryParams');
			initQueryParams.apply(this);
		}
	});
	QueryModel.proto({
		getQueryParams : function () {
			var self = this;
			var vals = _.map(self.queryKeys, function (k) {
				return self.get(k);
			});
			var params = _.object(self.queryKeys, vals);
			IX.Debug.info("DEBUG: Order Query Model Query Params :");
			IX.Debug.info(params);
			return params;
		}
	});

	Hualala.Order.QueryModel = QueryModel;
})(jQuery, window);