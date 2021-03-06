'use strict';

import React from 'react';
import ReactDom from 'react-dom';
import Awesomplete from 'awesomplete';
import Promise from 'promise-polyfill';
import google from './vendor/google';

const NO_MATCHING = 'Unrecognized {{value}}, please check and re-enter.';

var compose = function () {
  var fns = arguments;

  return function (result) {
    for (let i = fns.length - 1; i >= 0; i--) {
      result = fns[i].call(this, result);
    }
    return result;
  };
};

export default class Location extends React.Component {

  constructor(props) {
    super(props);
    this._handleAutocompleteSelect = this._handleAutocompleteSelect.bind(this);
    this._handleInputChange = this._handleInputChange.bind(this);
    this._handleInputFocus = this._handleInputFocus.bind(this);
  }


  componentDidUpdate(prevProps) {
    let { text } = this.props
    if (text != null  &&  text != this._getInputValue()) {
      this.updateText(text)
    }
  }

  updateText(text) {
    ReactDom.findDOMNode(this).value = text
  }

  render() {
    return (
      <input
        type='text'
        className={ this.props.className }
        placeholder={ this.props.placeholder || 'Type your location here.' }
      />
    );
  }

  componentWillMount() {
    this._googlePredictions = [];
    this._noMatching = this.props.noMatching || NO_MATCHING;
  }

  componentDidMount() {
    var input;
    var config = {
      minChars: 1,
      keepListItems: false,
      sort: function () { return 0; },
      item: function (text, input) {
        return Awesomplete.$.create('li', {
          innerHTML: text.replace(
            RegExp(Awesomplete.$.regExpEscape(input.trim()), 'gi'),
            '<mark>$&</mark>'
          ),
          'aria-selected': 'false'
        });
      }
    };

    input = ReactDom.findDOMNode(this);
    this._autocomplete = new Awesomplete(input, config);

    if (this.props.text != null) {
      this.updateText(this.props.text)
    }

    input.addEventListener('awesomplete-selectcomplete', this._handleAutocompleteSelect);
    input.addEventListener('keyup', this._handleInputChange);
    input.addEventListener('focus', this._handleInputFocus);
  }


  componentWillUnmount() {
    var input = ReactDom.findDOMNode(this);
    input.removeEventListener('awesomplete-selectcomplete', this._handleAutocompleteSelect);
    input.removeEventListener('keyup', this._handleInputChange);
    input.removeEventListener('focus', this._handleInputFocus);
  }

  _handleInputFocus(event) {
    var input = ReactDom.findDOMNode(this)
    input.select()
  }

  _handleInputChange(event) {
    var value = this._getInputValue();
    var updateAutocomplete = compose(
      this._autocomplete.evaluate.bind(this._autocomplete),
      (list) => this._autocomplete.list = list,
      (list) => list.map((item) => item.description),
      (results) => this._googlePredictions = results
    );
    var fail = compose(
      updateAutocomplete,
      (text) => [{ description: text }],
      (text) => {
        return this._noMatching.replace('{{value}}', text);
      }
    );
    var navKeys = [38, 40, 13, 27];
    var isItNavKey = navKeys.indexOf(event.keyCode) >= 0;

    if (!isItNavKey) {
      this._getPredictions(value).then(updateAutocomplete, fail);
    }
  }

  _handleAutocompleteSelect() {
    var value = this._getInputValue();
    var find = (list) => {
      let l = list.filter(item => item.description === value);

      return l.length > 0 ? l[0] : false;
    };
    var validate = item => item && item.place_id ? item.place_id : false;
    var getPlaceId = compose(validate, find);
    var success = (result) => {
      if (this.props.onLocationSet) {
        this.props.onLocationSet(result)
      }
    };

    this._geoCode(getPlaceId(this._googlePredictions)).then(success);
  }

  _getInputValue() {
    return ReactDom.findDOMNode(this).value;
  }

  _getPredictions(text) {
    var { country, bounds, type } = this.props;
    var service = (this.props.google || google).createAutocompleteService();
    var isThereAnyText = !!text;

    if (isThereAnyText) {
      return new Promise((resolve, reject) => {
        service.getPlacePredictions({
          input: text,
          bounds,
          componentRestrictions: country ? { country } : null,
          types: type ? [ type ] : null
        }, (result) => {
          if (result !== null) {
            resolve(result);
          } else {
            reject(text);
          }
        });
      });
    }
    return new Promise((resolve, reject) => {});
  }

  _geoCode(placeId) {
    var geocoder = (this.props.google || google).createGeocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode({ placeId: placeId }, (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          resolve(results[0]);
        } else {
          reject(false);
        }
      });
    });
  }

};

Location.propTypes = {
  onLocationSet: React.PropTypes.func,
  className: React.PropTypes.string,
  text: React.PropTypes.string,
  placeholder: React.PropTypes.string,
  type: React.PropTypes.string,
  bounds: React.PropTypes.shape({
    east: React.PropTypes.number,
    west: React.PropTypes.number,
    north: React.PropTypes.number,
    south: React.PropTypes.number
  }),
  country: React.PropTypes.string,
  noMatching: React.PropTypes.string,
  google: React.PropTypes.object
};

