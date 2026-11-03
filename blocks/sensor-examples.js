// Group the same complete simulation-only projects in both editor modes.
(()=>{
 'use strict';const select=document.getElementById('example');if(!select)return;
 const tests=[['sensor-test-temperature','Sensor Test: Temperature'],['sensor-test-ultrasonic','Sensor Test: Ultrasonic'],['sensor-test-soil-moisture','Sensor Test: Soil Moisture']];
 let busy=false;function group(){if(busy)return;const existing=select.querySelector('optgroup[data-sensor-tests]');if(existing&&tests.every(([id])=>existing.querySelector(`option[value="${id}"]`)))return;busy=true;const previous=select.value,g=document.createElement('optgroup');g.label='Sensor tests';g.dataset.sensorTests='true';for(const[id,title]of tests){let o=select.querySelector(`option[value="${id}"]`);if(!o){o=document.createElement('option');o.value=id;o.textContent=title;}g.append(o);}existing?.remove();select.prepend(g);if(previous)select.value=previous;busy=false;}
 new MutationObserver(group).observe(select,{childList:true});group();
})();
