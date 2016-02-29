import React from 'react';
import ReactDOM from 'react-dom';
import Location from '../../src/Location.jsx';

function onLocationSet(value) {
  var pre = document.querySelector('pre');

  pre.innerHTML = JSON.stringify(value, null, 2);
}

function tryParse(json) {
  var obj
  try { 
    obj = JSON.parse(json)
    console.log("parsed json", obj)
  } catch (err) {
    console.log("couldn't parse "+json)
  }

  return obj
}

window.onload = () => {
  var country = document.querySelector('#country-dropdown');
  country.addEventListener('change', render);

  var bounds = document.querySelector('#bounds');
  bounds.addEventListener('change', render);
  bounds.addEventListener('keyup', render);
  bounds.addEventListener('paste', render);

  render()
};



function render() {
  var country = document.querySelector('#country-dropdown');
  var bounds = document.querySelector('#bounds');
  var container = document.querySelector('#container');

  ReactDOM.render(
    <Location
      className='location'
      placeholder='Where are you?'
      country={ country.value }
      type='(regions)'
      bounds={ tryParse(bounds.value)  }
      noMatching='Sorry, I cannot find {{value}}.'
      onLocationSet={ onLocationSet }
      />,
    container
  )
}