OPS = {
	payment : function(paymentType, params, resultPaymentCallback) {
		var jsonDATA = JSON.stringify(params);
		$.ajax({
			url : '/ops/' + paymentType + '/payment',
			type : 'post',
			contentType : 'application/json',
			dataType : 'json',
			data : jsonDATA,
			success : function(data) {
				resultPaymentCallback(
					new Result(
						status = data.data.status, 
						desc = data.data.description, 
						extend = data.data.extend));
			}
		});
	},
	addHolderData : function(id, params, resultAddHolderCallback) {
		var jsonDATA = JSON.stringify(params);
		$.ajax({
			url : '/payment/' + id + '/holder/add',
			type : 'post',
			contentType : 'application/json',
			dataType : 'json',
			data : jsonDATA,
			success : function(data) {
				resultAddHolderCallback(data);
			}
		});
	}
}