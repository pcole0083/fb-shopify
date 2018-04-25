export default function matinit(M) {
	'use strict';

	function initSelects(){
		var selects = document.querySelectorAll('.input-field select');
	  	for (var i = selects.length - 1; i >= 0; i--) {
	  		M.FormSelect.init(selects[i], {});
	  	}
  	}

  	return initSelects;
};