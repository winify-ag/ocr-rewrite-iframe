$(function() {

	var validator = Validator
	var muume = Muume
	console.log("initializing...");

	var ops = OPS
	function resultPaymentCallback(result) {
		var txStatus = result.status.substr(0, 2);
		$('#blur').fadeOut(500);
		if (txStatus === "07") {
			window.top.location.href = result.extend.redirect_url;
		} else if (txStatus === "00") {
			window.top.location.href = result.extend.success_url;
		} else {
			window.top.location.href = result.extend.failure_url;
		}
	}

	function cardAddCallback(result) {
		var txStatus = result.status.substr(0, 2);
		if (txStatus === "00") {
			$('#blur').hide();
			$(".alert").empty();
			if(result.extend.success_url != '')
				window.location = result.extend.success_url;
			else
				window.location = "ok";
		} else {
			$('#blur').hide();
			$(".alert").empty();
			$(".alert").append(result.desc);
			$('#addFunds').attr("disabled", false);
		}
	}

	$.fn.serializeObject = function() {
		var o = {};
		var a = this.serializeArray();
		$.each(a, function() {
			if (o[this.name]) {
				if (!o[this.name].push) {
					o[this.name] = [ o[this.name] ];
				}
				o[this.name].push(this.value || '');
			} else {
				o[this.name] = this.value || '';
			}
		});
		return o;
	};

	/* credit card */
	function checkCreditCardNumber() {
		return new Cleave('#card_number', {
			creditCard: true,
			creditCardStrictMode: true,
			onCreditCardTypeChanged: function (type) {
				opsType = type;
				if (type == "mastercard") {
					opsType = "master";
				}

				creditCardSecureCode.destroy();
				if (opsType == "amex") {
					creditCardSecureCode = new Cleave('#card_secure_code', {
						numericOnly: true,
						blocks: [4]
					});
				} else {
					creditCardSecureCode = new Cleave('#card_secure_code', {
						numericOnly: true,
						blocks: [3]
					});
				}

				$('input[name=card_type]').prop('checked', false).next().hide();

				if(opsType != 'unknown') {
					var input = $('input[name=card_type][value=' + opsType.toUpperCase() + ']').prop('checked', true);
					input.next().show();
				}
			}
		});
	}

	function checkCreditCardExpiration() {
		return new Cleave('#expiration_month_year', {
			date: true,
			datePattern: ['m', 'y']
		});
	}

	var creditCardNumber = checkCreditCardNumber();
	var creditCardMonthYear = checkCreditCardExpiration();
	var creditCardSecureCode = new Cleave('#card_secure_code', {
		numericOnly: true,
		blocks: [3]
	});

	$('#card_number').on('change', checkCreditCardNumber);
	$('#expiration_month_year').on('change', checkCreditCardExpiration);


	function errorBorder(item) {
		if (item.val() == '') {
			item.addClass('error-border-color');
			return false
		} else {
			item.removeClass('error-border-color');
			return true;
		}
	}

	function removeError(item) {
		item.removeClass('error-border-color');
	}

	function addError(item) {
		item.addClass('error-border-color');
	}

	function validateForm() {
		console.log("validateForm..");
		var card = new Card($('#card_number').val(), $('#card_holder').val(), $('#card_secure_code').val(), $('#expiration_month').val(), $('#expiration_year').val());

		var valid = true;
		var errors = [];
		var result = {};

		if (card.cardHolder == '') {
			valid = false;
			addError($('#card_holder'));
			errors[errors.length] = "card holder wrong";
			$('#alert').text('Wrong holder name');
		} else {
			removeError($('#card_holder'));
		}
		console.log("valid1: " + valid);

		if (card.number == '') {
			valid = false;
			addError($('#card_number'));
			errors[errors.length] = "card number wrong";
			$('#alert').text('Invalid credit card number / brand combination');
		} else {
			if (validator.isNumberValid(card)) {
				removeError($('#card_number'));
			} else {
				valid = false;
				addError($('#card_number'));
				errors[errors.length] = "card number wrong";
				$('#alert').text('Invalid credit card number / brand combination');
			}
		}

		console.log("valid2: " + valid);
		if (card.cvv == '') {
			valid = false;
			addError($('#card_secure_code'));
			errors[errors.length] = "ccv wrong";
			$('#alert').text('Wrong CVV');
		} else {
			removeError($('#card_secure_code'));
		}

		console.log("valid3: " + valid);
		if ($('input[type=radio]:checked').val() == undefined) {
			valid = false;
			errors[errors.length] = "card type not selected";
			$('input[type=radio]').next().addClass('error-border');
		} else {
			$('input[type=radio]').each(function() {
				$(this).next().removeClass('error-border');
			});
		}
		console.log("valid4: " + valid);
		if (/^0[1-9]|1[0-2]$/.test(card.expMonth) == false || /^[0-9]{4}$/.test(card.expYear) == false) {
			valid = false;
			addError($('#expiration_month_year'));
			errors[errors.length] = "expiry date wrong";
			$('#alert').text('Wrong date');
		} else {
			removeError($('#expiration_month_year'));
		}

		console.log("valid5: " + valid);

		if(!validator.expirationDate(card)) {
			valid = false;
			errors[errors.length] = "expiry date wrong";
			addError($('#expiration_month_year'));
			$('#alert').text('Card expired');
		} else {
			removeError($('#expiration_month'));
			removeError($('#expiration_year'));
		}

		if(valid == false)
			$('#alert').show();
		else
			$('#alert').hide();

		console.log("valid6: " + valid);
		result['valid'] = valid;
		result['errors'] = errors;
		console.log("validateFomr() [result = " + result + "]");
		return result;
	}

	$("#submitBtn, #addFunds, #registrationCardBtn").click(function() {
		var validateResult = validateForm();
		var isValid = validateResult['valid'];
		console.log("button clicked!!");
		console.log("isValid: " + isValid);
		console.log("id: " + $(this).attr('id'));
		console.log("ops = " + ops);
		// muume
		if (isValid === true && $(this).attr('id') === 'addFunds') {
			$('#addFunds').attr("disabled", true);
			$('#blur').show();
			muume.card($("#paymentForm").serializeObject(), cardAddCallback);
		}

		if (isValid === true && $(this).attr('id') === 'submitBtn') {
			$('#submitBtn').attr("disabled", true);
			$('#blur').show();
			ops.payment($("#paymentForm").serializeObject(), resultPaymentCallback);
		}

		if (isValid === true && $(this).attr('id') === 'registrationCardBtn') {
			$('#addFunds').attr("disabled", true);
			$('#blur').show();
			muume.registrationCard($("#paymentForm").serializeObject(), cardAddCallback);
		}
	});

	function blocker() {
		document.getElementById('blocker').style.display = 'block';
	}
});
