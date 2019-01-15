Validator = {
	isNumberValid: function(card) {
		// accept only digits, dashes or spaces
		if (/[^0-9-\s]+/.test(card.number))
			return false;
		// The Luhn Algorithm. It's so pretty.
		var nCheck = 0, nDigit = 0, bEven = false;
		var number = card.number.replace(/\D/g, "");

		for (var n = number.length - 1; n >= 0; n--) {
			var cDigit = number.charAt(n), nDigit = parseInt(cDigit, 10);
			if (bEven) {
				if ((nDigit *= 2) > 9)
					nDigit -= 9;
			}
			nCheck += nDigit;
			bEven = !bEven;
		}
		return (nCheck % 10) == 0;
	},
	expirationDate: function(card) {
		var d = new Date(), n = d.getMonth() + 1, y = d.getFullYear();
		if ((card.expYear < y) || (card.expMonth < n && card.expYear == y)) {
			return false;
		} else {
			return true;
		}
	}
}

function Result(status, desc, extend) {
	this.status = status;
	this.desc = desc;
	this.extend = extend;
}

function Card(number, cardHolder, cvv, expMonth, expYear) {
	this.number = number;
	this.cardHolder = cardHolder;
	this.cvv = cvv;
	this.expMonth = expMonth;
	this.expYear = expYear;
}