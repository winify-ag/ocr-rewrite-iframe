OCR_SERVER_URL = 'https://ocr.paycentric.net/ocr/upload';
(function ($) {
  if ((/iPhone|iPod|iPad|Android|BlackBerry/).test(navigator.userAgent) === true) {
    $(document).ready(function () {
      $('html').addClass('mobile');
    });
  }

  $(document).ready(function () {
    var isCameraAllowedByUser = true;
    var scaleFactor = 8;
    var streamObject = null;
    var canvas = $('#canvas')[0];
    var context = canvas.getContext('2d');
    var $openCamera = $('#openCamera');
    var $videoWrapper = $('#videoWrapper');
    var $video = $('#video');
    var $takenPicture = $('#takenPicture');
    var $scanAgain = $('#scanAgain');
    var $alert = $('#alert');
    var $takeAPicture = $('#takeAPicture');
    var $registrationCardBtn = $('#registrationCardBtn');
    var $previewPicture = $('#previewPicture');

    // TODO: add docs why this is needed
    if (!$('html').hasClass('mobile')) {
      $(window).on('resize', function () {
        $('body')
          .css('height', 'auto')
          .css('width', 'auto');
      }).trigger('resize');
    }

    var ua = navigator.userAgent;
    if (ua.indexOf('Android') >= 0) {
      var androidversion = parseFloat(ua.slice(ua.indexOf('Android') + 8));
      if (androidversion < 5.0) {
        $openCamera.find('span').text('Your device does not support this feature');
      }
    }

    var rotateValue = 1;
    $takenPicture.on('click', function () {
      $takenPicture.css('transform', 'rotate(' + ((rotateValue++ % 4) * 90) + 'deg)');
    });

    $('#expiration_month_year').on('change input', function () {
      var val = $('#expiration_month_year').val();
      var month = val.substring(0, 2);
      var year = '20' + val.substring(3, 5);
      $('#expiration_month').val(month);
      $('#expiration_year').val(year);
    });

    $openCamera.on('click', startCamera);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      $video.css('height', $(window).height() + 'px');
      $videoWrapper.hide();

      $scanAgain.on('click', function () {
        startCameraInVideo(function () {
          resetForm();
          $alert.hide().empty();
          $videoWrapper.show();
          $takeAPicture.show();
          $scanAgain.hide();
          $registrationCardBtn.hide();
          $previewPicture.hide();
        });
      });

      $takeAPicture.on('click', function () {
        var deviceWidth = $(window).width();

        scaleFactor = Math.round($video.height() / 300);
        canvas.width = deviceWidth;
        canvas.height = Math.round(deviceWidth * $video.height() / $video.width());
        context.scale(300 / $video.height(), 300 / $video.height());
        context.drawImage($video[0], 0, 0);
        $takenPicture.css('background-position', 'unset').css('margin-top', 0);

        var dataUrl = canvas.toDataURL('image/jpeg', 1);
        var dataBlob = dataURItoBlob(dataUrl);
        var formData = new FormData();
        formData.append('file', dataBlob, 'cc.jpg');

        $takenPicture
          .css('background-image', 'url("' + dataUrl + '")')
          .css('transform', 'rotate(270deg)')
          .css('width', 300 * $video.width() / $video.height() + 'px')
          .css('height', '300px');
        /* $takenPicture.css('background-image', 'url("'+dataUrl+'")').css('width', $video.width()).css('height', $video.height()).css('background-position', "0px 0px"); */

        streamObject.getTracks()[0].stop();
        $videoWrapper.hide();
        $previewPicture.show();
        $('#ocrLoader').show();
        $('#ocrDoneMessage').hide();
        $('#ocrInProgressMessage').show();

        $.ajax({
          type: 'POST',
          url: OCR_SERVER_URL,
          contentType: false,
          processData: false,
          data: formData,
          success: function (result) {
            if (result.result === '') {
              $alert.html('Image could not be recognized, try again');
              $alert.show();
            } else {
              $alert.hide();
              var cardData = parseReturnedOcrData(result);
              if (fillForm(cardData) === false) {
                if ($alert.html() === '')
                  $alert.html('Image could not be recognized, try again');

                $alert.show();
              } else {
                setTimeout(function () {
                  var afterScanFactor = 180 / Math.min(cardData['position_width'], cardData['position_height']);
                  countRotation(result, cardData, afterScanFactor);
                  $takenPicture
                    .css('width', cardData['position_width'] + 'px')
                    .css('height', cardData['position_height'] + 'px')
                    .css('background-position',
                      '-' + cardData['position_x'] + 'px ' + '-' + cardData['position_y'] + 'px');
                }, 1500);
              }
            }
          },
          error: function () {
            $alert.html('Error occured! Please try again later.').show();
          },
          complete: function () {
            $scanAgain.show();
            $takeAPicture.hide();
            $registrationCardBtn.show();
            $('#ocrInProgressMessage').hide();
            $('#ocrDoneMessage').show();

            setTimeout(function () {
              $('#ocrLoader').hide();
              window.scrollTo(0, document.body.scrollHeight);
            }, 2000);
          },
        });
      });
    } else {
      $takeAPicture.hide();
      $videoWrapper.hide();
      $scanAgain.hide();
      $registrationCardBtn.hide();
      $('#ocrDoneMessage').hide();

      $scanAgain.on('click', function () {
        resetForm();
        $alert.html('').hide();
        $('#data').click();
      });

      $openCamera.on('click', function () {
        $(this).hide();
        $('#data').click();
      });

      $('#data').on('change', function () {
        readURL(this);
      });

      $('#sendOCR').on('click', function (e) {
        e.preventDefault();
        if (!$('#data').val()) {
          alert('Take a picture first');
          return;
        }
        var form = $('#ocrForm')[0];
        var formData = new FormData(form);

        $openCamera.hide();
        $previewPicture.show();
        $('#ocrLoader').show();
        $('#ocrDoneMessage').hide();
        $('#ocrInProgressMessage').show();
        $alert.hide();

        $.ajax({
          type: 'POST',
          url: OCR_SERVER_URL,
          contentType: false,
          processData: false,
          data: formData,
          success: function (result) {
            if (result.result === '') {
              $alert.html('Image could not be recognized, try again');
              $alert.show();
            } else {
              var cardData = parseReturnedOcrData(result);
              if (fillForm(cardData) === false) {
                if ($alert.html() === '')
                  $alert.html('Image could not be recognized, try again');

                $alert.show();
              } else {
                setTimeout(function () {
                  createPreviewAfterScan(result, document.getElementById('data'), cardData);
                }, 1500);
              }
            }
          },
          error: function () {
            $alert.html('Error occured! Please try again later.').show();
          },
          complete: function () {
            $scanAgain.show();
            $registrationCardBtn.show();
            $('#ocrInProgressMessage').hide();
            $('#ocrDoneMessage').show();

            setTimeout(function () {
              $('#ocrLoader').hide();
              window.scrollTo(0, document.body.scrollHeight);
            }, 2000);
          },
        });
      });
    }

    function startCamera() {
      if (hasUserMediaApi() && isCameraAllowedByUser) {
        startCameraInVideo()
          .then(function () {
            $openCamera.hide();
            $videoWrapper.show();
          })
          .catch(function (err) {
            console.log(err);
            isCameraAllowedByUser = false;
            startNativeCamera();
          });
      } else {
        startNativeCamera();
      }
    }

    function startNativeCamera() {
      $('#data').trigger('click');
    }

    function hasUserMediaApi() {
      return navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    }

    function startCameraInVideo() {
      return navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}})
        .then(function (stream) {
          var dfd = $.Deferred();
          streamObject = stream;
          $video[0].srcObject = streamObject;
          $video[0].onloadedmetadata = function () {
            context.canvas.width = $video.width();
            context.canvas.height = $video.height();
            dfd.resolve(stream);
          };
          $video[0].play();
          return dfd.promise();
        });
    }

    /**
     * @param {Object} result
     * @param {Object} result.additionalCoordinates
     * @param {string} result.additionalCoordinates.expiry_date
     * @returns {boolean}
     */
    function handleOcrErrors(result) {
      if (!result) {
        $alert.html('Image could not be recognized.');
        return false;
      }
      if (!result.additionalCoordinates.name) {
        $alert.html('Image could not be recognized. Name was not recognized');
        return false;
      }
      if (!result.additionalCoordinates.number) {
        $alert.html('Image could not be recognized. Card number was not recognized');
        return false;
      }
      if (!result.additionalCoordinates.expiry_date) {
        $alert.html('Image could not be recognized. Expiry date was not recognized');
        return false;
      }
      return true;
    }

    function countOrientation(img) {
      var orientationFromExif = 0;
      EXIF.getData(img, function () {
        var allMetaData = EXIF.getAllTags(this);

        switch (allMetaData['Orientation']) {
          case 3:
            orientationFromExif = 180;
            break;
          case 6:
            orientationFromExif = 90;
            break;
          case 8:
            orientationFromExif = 270;
        }
      });
      return orientationFromExif;
    }

    function readURL(input) {
      if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
          var img = new Image();
          img.src = e.target.result;

          img.onload = function () {
            var orientationFromExif = countOrientation(img);
            var deviceWidth = window.outerWidth;
            if (deviceWidth === 0) {
              deviceWidth = window.innerWidth;
            }

            scaleFactor = Math.round(this.height / 200);
            canvas.width = deviceWidth;
            canvas.height = Math.round(deviceWidth * this.height / this.width);

            context.scale(200 / this.height, 200 / this.height);
            context.drawImage(this, 0, 0);

            $takenPicture
              .css('transform', 'rotate(' + orientationFromExif + 'deg)')
              .css('background-position', 'unset')
              .css('margin-top', 0);
            var dataUrl = canvas.toDataURL('image/jpeg', 1);
            $takenPicture.css('background-image', 'url("' + dataUrl + '")');
            $takenPicture.css('width', 200 * this.width / this.height + 'px');
            $takenPicture.css('height', '200px');
          };
          $('#sendOCR').click();
        };

        reader.readAsDataURL(input.files[0]);
      }
    }

    function createPreviewAfterScan(result, input, cardData) {
      if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
          var img = new Image();
          img.src = e.target.result;

          img.onload = function () {
            var deviceWidth = window.outerWidth;
            if (deviceWidth === 0) {
              deviceWidth = window.innerWidth;
            }

            var afterScanFactor = 180 / Math.min(cardData['position_width'], cardData['position_height']);

            canvas.width = (afterScanFactor * deviceWidth) + deviceWidth;
            canvas.height = Math.round(afterScanFactor * (deviceWidth * this.height / this.width));

            context.scale(afterScanFactor * 200 / this.height, afterScanFactor * 200 / this.height);
            context.drawImage(this, 0, 0);

            var dataUrl = canvas.toDataURL('image/jpeg', 1);
            $takenPicture.css('background-image', 'url("' + dataUrl + '")');
            $takenPicture.css('width', afterScanFactor * cardData['position_width'] + 'px');
            $takenPicture.css('height', afterScanFactor * cardData['position_height'] + 'px');
            $takenPicture
              .css('background-position',
                '-' + afterScanFactor * cardData['position_x'] + 'px ' + '-' + afterScanFactor *
                cardData['position_y'] + 'px');
            $takenPicture.css('background-repeat', 'no-repeat');

            countRotation(result, cardData, afterScanFactor);
          };
        };

        reader.readAsDataURL(input.files[0]);
      }
    }

    /**
     *
     * @param {Object} result
     * @param {Object[]} result.creditCardCoordinate
     * @param {Object} result.creditCardCoordinate[].p0
     * @param scaleFactor
     * @returns {Array}
     */
    function countCardDimensions(result, scaleFactor) {
      var cardData = [];
      cardData['position_x'] = Math.min(result.creditCardCoordinate[0].p0.x, result.creditCardCoordinate[0].p1.x,
        result.creditCardCoordinate[0].p2.x, result.creditCardCoordinate[0].p3.x) / scaleFactor;
      cardData['position_y'] = Math.min(result.creditCardCoordinate[0].p0.y, result.creditCardCoordinate[0].p1.y,
        result.creditCardCoordinate[0].p2.y, result.creditCardCoordinate[0].p3.y) / scaleFactor;
      cardData['position_width'] = (Math.max(result.creditCardCoordinate[0].p0.x, result.creditCardCoordinate[0].p1.x,
        result.creditCardCoordinate[0].p2.x, result.creditCardCoordinate[0].p3.x) / scaleFactor -
        cardData['position_x']);
      cardData['position_height'] = (Math.max(result.creditCardCoordinate[0].p0.y, result.creditCardCoordinate[0].p1.y,
        result.creditCardCoordinate[0].p2.y, result.creditCardCoordinate[0].p3.y) / scaleFactor -
        cardData['position_y']);

      return cardData;
    }

    function countRotation(result, cardData, scale) {
      var p = result.additionalCoordinates.name;

      var distanceA = Math.sqrt(p.p0.x * p.p0.x + p.p0.y * p.p0.y);
      var distanceB = Math.sqrt(p.p1.x * p.p1.x + p.p1.y * p.p1.y);
      var distanceC = Math.sqrt(p.p2.x * p.p2.x + p.p2.y * p.p2.y);
      var distanceD = Math.sqrt(p.p3.x * p.p3.x + p.p3.y * p.p3.y);

      if (distanceA < distanceB && distanceA < distanceC && distanceA < distanceD) {
        $takenPicture.css('transform', 'rotate(0)');
      }

      if (distanceB < distanceA && distanceB < distanceC && distanceB < distanceD) {
        $takenPicture.css('transform', 'rotate(90deg)');
        $takenPicture
          .css('margin-top', -(scale * cardData['position_height'] - scale * cardData['position_width']) / 2);
      }

      if (distanceC < distanceA && distanceC < distanceB && distanceC < distanceD) {
        $takenPicture.css('transform', 'rotate(180deg)');
      }

      if (distanceD < distanceA && distanceD < distanceB && distanceD < distanceC) {
        $takenPicture.css('transform', 'rotate(270deg)');
        $takenPicture
          .css('margin-top', -(scale * cardData['position_height'] - scale * cardData['position_width']) / 2);
      }
    }

    function parseReturnedOcrData(result) {
      if (!handleOcrErrors(result)) {
        return false;
      }

      var cardDataNameValue = result.result.split(/[\r\n]/);
      var cardDataTemp = [];

      var cardData = countCardDimensions(result, scaleFactor || 1);

      $.each(cardDataNameValue, function (index, element) {
        cardDataTemp = element.split('=');
        if (cardDataTemp.length > 1) {
          cardData[cardDataTemp[0].trim()] = cardDataTemp[1].trim();
        }
      });

      return cardData;
    }

    function fillForm(data) {
      if (!data)
        return false;

      $('#card_holder').val(data['name']);
      $('#card_number').val(data['number']).trigger('change');
      $('#expiration_month_year').val(data['expiry_date']).trigger('change');
    }

    function dataURItoBlob(dataURI) {
      var binary = atob(dataURI.split(',')[1]);
      var array = [];
      for (var i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
      }
      return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
    }

    function resetForm() {
      $('#card_number').val('');
      $('#expiration_month_year').val('');
      $('#expiration_month').val('');
      $('#expiration_year').val('');
      $('#card_secure_code').val('');
      $('#card_holder').val('');
    }
  });
})(jQuery);
