Muume = {
	card : function(params, callback) {
		var jsonDATA = JSON.stringify(params);
		$.ajax({
			url : '/muume/card',
			type : 'post',
			contentType : 'application/json',
			dataType : 'json',
			data : jsonDATA,
			success : function(data) {
				callback(new Result(status = data.data.status, desc = data.data.description, extend = data.data.extend));
			}
		});
	},
  registrationCard : function(params, callback) {
    var jsonDATA = JSON.stringify(params);
    $.ajax({
      url : '/muume/registration/card',
      type : 'post',
      contentType : 'application/json',
      dataType : 'json',
      data : jsonDATA,
      success : function(data) {
        callback(new Result(status = data.data.status, desc = data.data.description, extend = data.data.extend));
      }
    });
  },
  directDebit : function(params, callback) {
    var jsonDATA = JSON.stringify(params);
    $.ajax({
      url : '/v3/muume/bank_account',
      type : 'post',
      contentType : 'application/json',
      dataType : 'json',
      data : jsonDATA,
      success : function(data) {
        callback(new Result(status = data.data.status, desc = data.data.description, extend = data.data.extend));
      }
    });
  },
}
