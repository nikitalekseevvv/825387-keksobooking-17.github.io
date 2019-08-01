'use strict';
(function () {
  var map = document.querySelector('.map');
  var isActive = false;
  var mainPin = map.querySelector('.map__pin--main');
  var filtersContainer = map.querySelector('.map__filters-container');

  var mainPinStart = {
    x: 570,
    y: 375,
  };

  var switchMap = {
    activate: function () {
      map.classList.remove('map--faded');
    },
    deactivate: function () {
      map.classList.add('map--faded');
      isActive = false;
    },
    reset: function () {
      removePins();
      returnMainPin();
      setAddressPin();
      window.card.close();
      switchMap.deactivate();
    }
  };

  function adIdsToAds(serverAds) {
    return serverAds.map(function (ad, index) {
      return Object.assign({id: index}, ad);
    });
  }

  // Функция для удаления пинов
  var removePins = function () {
    var pins = document.querySelectorAll('.map__pin:not(.map__pin--main)');
    for (var i = 0; i < pins.length; i++) {
      var pin = pins[i];
      pin.remove();
    }
  };

  // Функция для показа объявлений на карте
  var addPins = function (serverAds) {

    var fragment = document.createDocumentFragment();
    var ads = adIdsToAds(serverAds);

    ads.forEach(function (ad) {
      var pin = window.renderPin(ad);
      pin.addEventListener('click', function () {
        window.card.close();
        var card = window.card.create(ad);
        map.insertBefore(card, filtersContainer);
      });
      map.appendChild(pin);
    });

    map.appendChild(fragment);
    isActive = true;
  };

  // Создание массива из координат пина
  var getCoordinates = function () {
    return [
      parseInt(mainPin.style.left, 10) - window.utils.PIN_WIDTH / 2,
      parseInt(mainPin.style.top, 10) - (isActive ? window.utils.PIN_HEIGHT : window.utils.PIN_WIDTH / 2)
    ];
  };

  // Получение координат из данных
  var setAddressPin = function () {
    getCoordinates();
    var resultAddress = getCoordinates();
    window.form.setAddress(resultAddress[0], resultAddress[1]);
  };

  setAddressPin();

  // Функция для активации карты, формы и всего-всего-всего
  var activatePage = function () {
    switchMap.activate();
    window.form.activate();
    setAddressPin();
  };

  var returnMainPin = function () {
    mainPin.style.top = mainPinStart.y + 'px';
    mainPin.style.left = mainPinStart.x + 'px';
  };

  window.onSuccess = function () {
    window.message.showSuccess();
    window.form.deactivate();
    window.filter.reset();
    switchMap.reset();
  };

  mainPin.addEventListener('mousedown', function (evt) {
    if (!isActive) {
      isActive = true;
      activatePage();
      window.backend.load(function (serverAds) {
        addPins(window.filter.filtrateData(serverAds));
        window.filter.setChangeHandler(function () {
          var filteredNewData = window.filter.filtrateData(serverAds);
          removePins();
          addPins(filteredNewData);
        });
      }, window.message.showError);
    }

    var startCoords = {
      x: evt.clientX,
      y: evt.clientY
    };

    var onMouseMove = function (moveEvt) {
      moveEvt.preventDefault();
      var shift = {
        x: startCoords.x - moveEvt.clientX,
        y: startCoords.y - moveEvt.clientY
      };

      startCoords = {
        x: moveEvt.clientX,
        y: moveEvt.clientY
      };

      var currentCoords = {
        x: mainPin.offsetLeft - shift.x,
        y: mainPin.offsetTop - shift.y
      };

      if (currentCoords.x > window.utils.MIN_X && currentCoords.x < window.utils.MAX_X) {
        mainPin.style.left = currentCoords.x + 'px';
      }

      if (currentCoords.y > window.utils.MIN_Y && currentCoords.y < window.utils.MAX_Y) {
        mainPin.style.top = currentCoords.y + 'px';
      }

      var setAddressPointer = {
        x: currentCoords.x + window.utils.PIN_MAIN_WIDTH / 2,
        y: currentCoords.y + window.utils.PIN_MAIN_HEIGHT
      };

      window.form.setAddress(setAddressPointer.x, setAddressPointer.y);
    };

    var onMouseUp = function (upEvt) {
      upEvt.preventDefault();
      document.removeEventListener('mousemove', onMouseMove);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

})();

