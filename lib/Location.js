'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _awesomplete = require('awesomplete');

var _awesomplete2 = _interopRequireDefault(_awesomplete);

var _promisePolyfill = require('promise-polyfill');

var _promisePolyfill2 = _interopRequireDefault(_promisePolyfill);

var _google = require('./vendor/google');

var _google2 = _interopRequireDefault(_google);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var NO_MATCHING = 'Unrecognized {{value}}, please check and re-enter.';

var compose = function compose() {
  var fns = arguments;

  return function (result) {
    for (var i = fns.length - 1; i >= 0; i--) {
      result = fns[i].call(this, result);
    }
    return result;
  };
};

var Location = function (_React$Component) {
  _inherits(Location, _React$Component);

  function Location(props) {
    _classCallCheck(this, Location);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Location).call(this, props));

    _this._handleAutocompleteSelect = _this._handleAutocompleteSelect.bind(_this);
    _this._handleInputChange = _this._handleInputChange.bind(_this);
    _this._handleInputFocus = _this._handleInputFocus.bind(_this);
    return _this;
  }

  _createClass(Location, [{
    key: 'componentDidUpdate',
    value: function componentDidUpdate(prevProps) {
      var text = this.props.text;

      if (text != null && text != this._getInputValue()) {
        this.updateText(text);
      }
    }
  }, {
    key: 'updateText',
    value: function updateText(text) {
      _reactDom2.default.findDOMNode(this).value = text;
    }
  }, {
    key: 'render',
    value: function render() {
      return _react2.default.createElement('input', {
        type: 'text',
        className: this.props.className,
        placeholder: this.props.placeholder || 'Type your location here.'
      });
    }
  }, {
    key: 'componentWillMount',
    value: function componentWillMount() {
      this._googlePredictions = [];
      this._noMatching = this.props.noMatching || NO_MATCHING;
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      var input;
      var config = {
        minChars: 1,
        keepListItems: false,
        sort: function sort() {
          return 0;
        },
        item: function item(text, input) {
          return _awesomplete2.default.$.create('li', {
            innerHTML: text.replace(RegExp(_awesomplete2.default.$.regExpEscape(input.trim()), 'gi'), '<mark>$&</mark>'),
            'aria-selected': 'false'
          });
        }
      };

      input = _reactDom2.default.findDOMNode(this);
      this._autocomplete = new _awesomplete2.default(input, config);

      if (this.props.text != null) {
        this.updateText(this.props.text);
      }

      input.addEventListener('awesomplete-selectcomplete', this._handleAutocompleteSelect);
      input.addEventListener('keyup', this._handleInputChange);
      input.addEventListener('focus', this._handleInputFocus);
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      var input = _reactDom2.default.findDOMNode(this);
      input.removeEventListener('awesomplete-selectcomplete', this._handleAutocompleteSelect);
      input.removeEventListener('keyup', this._handleInputChange);
      input.removeEventListener('focus', this._handleInputFocus);
    }
  }, {
    key: '_handleInputFocus',
    value: function _handleInputFocus(event) {
      var input = _reactDom2.default.findDOMNode(this);
      input.select();
    }
  }, {
    key: '_handleInputChange',
    value: function _handleInputChange(event) {
      var _this2 = this;

      var value = this._getInputValue();
      var updateAutocomplete = compose(this._autocomplete.evaluate.bind(this._autocomplete), function (list) {
        return _this2._autocomplete.list = list;
      }, function (list) {
        return list.map(function (item) {
          return item.description;
        });
      }, function (results) {
        return _this2._googlePredictions = results;
      });
      var fail = compose(updateAutocomplete, function (text) {
        return [{ description: text }];
      }, function (text) {
        return _this2._noMatching.replace('{{value}}', text);
      });
      var navKeys = [38, 40, 13, 27];
      var isItNavKey = navKeys.indexOf(event.keyCode) >= 0;

      if (!isItNavKey) {
        this._getPredictions(value).then(updateAutocomplete, fail);
      }
    }
  }, {
    key: '_handleAutocompleteSelect',
    value: function _handleAutocompleteSelect() {
      var _this3 = this;

      var value = this._getInputValue();
      var find = function find(list) {
        var l = list.filter(function (item) {
          return item.description === value;
        });

        return l.length > 0 ? l[0] : false;
      };
      var validate = function validate(item) {
        return item && item.place_id ? item.place_id : false;
      };
      var getPlaceId = compose(validate, find);
      var success = function success(result) {
        if (_this3.props.onLocationSet) {
          _this3.props.onLocationSet(result);
        }
      };

      this._geoCode(getPlaceId(this._googlePredictions)).then(success);
    }
  }, {
    key: '_getInputValue',
    value: function _getInputValue() {
      return _reactDom2.default.findDOMNode(this).value;
    }
  }, {
    key: '_getPredictions',
    value: function _getPredictions(text) {
      var _props = this.props;
      var country = _props.country;
      var bounds = _props.bounds;
      var type = _props.type;

      var service = (this.props.google || _google2.default).createAutocompleteService();
      var isThereAnyText = !!text;

      if (isThereAnyText) {
        return new _promisePolyfill2.default(function (resolve, reject) {
          service.getPlacePredictions({
            input: text,
            bounds: bounds,
            componentRestrictions: country ? { country: country } : null,
            types: type ? [type] : null
          }, function (result) {
            if (result !== null) {
              resolve(result);
            } else {
              reject(text);
            }
          });
        });
      }
      return new _promisePolyfill2.default(function (resolve, reject) {});
    }
  }, {
    key: '_geoCode',
    value: function _geoCode(placeId) {
      var geocoder = (this.props.google || _google2.default).createGeocoder();

      return new _promisePolyfill2.default(function (resolve, reject) {
        geocoder.geocode({ placeId: placeId }, function (results, status) {
          if (status === 'OK' && results && results.length > 0) {
            resolve(results[0]);
          } else {
            reject(false);
          }
        });
      });
    }
  }]);

  return Location;
}(_react2.default.Component);

exports.default = Location;
;

Location.propTypes = {
  onLocationSet: _react2.default.PropTypes.func,
  className: _react2.default.PropTypes.string,
  text: _react2.default.PropTypes.string,
  placeholder: _react2.default.PropTypes.string,
  type: _react2.default.PropTypes.string,
  bounds: _react2.default.PropTypes.shape({
    east: _react2.default.PropTypes.number,
    west: _react2.default.PropTypes.number,
    north: _react2.default.PropTypes.number,
    south: _react2.default.PropTypes.number
  }),
  country: _react2.default.PropTypes.string,
  noMatching: _react2.default.PropTypes.string,
  google: _react2.default.PropTypes.object
};
module.exports = exports['default'];
//# sourceMappingURL=Location.js.map